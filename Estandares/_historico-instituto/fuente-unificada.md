# Nota de esta edición

<p class="doc-sub">Qué contiene este volumen y qué garantiza</p>

Este volumen reúne **íntegramente y sin resumir** el paquete fundacional del Elysium λ
Institute of Development & Research. No es una síntesis: es la concatenación literal de los
ocho documentos normativos, del documento personal de organización y del programa que
resuelve el horario, con la única modificación de haber bajado un nivel los encabezados
internos de cada documento para que el índice general sea navegable.

**Qué contiene, en orden.**

| Bloque | Documento | Naturaleza |
|---|---|---|
| — | Presentación del paquete | Vista general |
| **D0** | Carta Constitutiva | **Norma superior.** Prevalece sobre todo lo demás |
| **D1** | Modelo Académico | Vinculante |
| **D2** | Plan de Estudios | Vinculante |
| **D3** | Reglamento de Evaluación | Vinculante |
| **D4** | Syllabus del Programa | Vinculante, congelado durante la generación |
| **D5** | Manual de Operación | Operativo |
| **D6** | Protocolo de Investigación | Aprobado por el Comité de Ética |
| **D7** | Protocolo del Trabajo Final de Graduación | Vinculante |
| — | Marco de Organización Personal | **Personal. No forma parte del paquete normativo** |
| **Anexo** | Modelo horario (`horario.py`) | Código reproducible |

**Jerarquía.** En caso de contradicción entre documentos prevalece el de menor número
(Carta, art. 79). El Marco de Organización Personal no forma parte de esa jerarquía: no lo
aprueba ningún órgano y no obliga a nadie más que a su autor.

**Advertencia de naturaleza jurídica.** El Instituto no es una institución de educación
superior reconocida ni por Portugal ni por Costa Rica, y **no expide títulos académicos
oficiales**. Expide certificaciones privadas de formación profesional. El art. 9 de la
Carta detalla esta condición.



<div class="salto"></div>

# Presentación del paquete

<p class="doc-sub">Vista general, decisiones estructurales y calendario</p>
<p class="doc-file">Fichero: <code>ELYSIUM-INSTITUTE/README.md</code></p>

> *Abstrahere, aedificare, probare.* Abstraer, construir, demostrar.

**Qué es, en una frase.** Un programa de **extensión social gratuito** de cuatro meses que
enseña **programación, herramientas modernas de inteligencia artificial y emprendimiento**
a diez personas, tres veces al año, para que salgan con la estructura base de su propio
emprendimiento digital funcionando.

**Qué forma.** No programadores. **Arquitectos de infraestructura digital asistida por
IA**: personas que saben lo suficiente de programación para leer, juzgar y corregir lo que
un agente les entrega; lo suficiente de datos para decidir la estructura; y lo suficiente
de negocio para lanzarlo. El código lo escribe en gran parte la máquina; la arquitectura,
el criterio y la responsabilidad son de la persona.

> **Cómo NO se nombra.** Nunca «curso de IA» (Carta, art. 21). La IA es la herramienta, no
> el objeto. Y nunca «saldrás siendo desarrollador»: el D2 §3.3 declara con precisión lo
> que el egresado no es.

---

### Los documentos

| Cód. | Documento | Qué responde |
|:---:|---|---|
| **D0** | [**Carta Constitutiva**](D0-CARTA-CONSTITUTIVA.md) | Qué es el Instituto, qué principios lo rigen, quién manda, qué derechos hay |
| **D1** | [**Modelo Académico**](D1-MODELO-ACADEMICO.md) | Por qué se enseña así, con su evidencia, y cómo se regula la IA |
| **D2** | [**Plan de Estudios**](D2-PLAN-DE-ESTUDIOS.md) | Qué se enseña: 32 resultados con su **nivel de logro declarado** |
| **D3** | [**Reglamento de Evaluación**](D3-REGLAMENTO-DE-EVALUACION.md) | Cómo se mide, con qué rúbricas y qué umbrales objetivos |
| **D4** | [**Syllabus del Programa**](D4-SYLLABUS.md) | Las 16 semanas, minuto a minuto |
| **D5** | [**Manual de Operación**](D5-MANUAL-DE-OPERACION.md) | A quién sirve, a qué hora, qué cuesta, quién lo paga y cómo se selecciona |
| **D6** | [**Protocolo de Investigación**](D6-PROTOCOLO-DE-INVESTIGACION.md) | Las tres líneas de investigación del profesorado, con carga cero para el aula |
| **D7** | [**Protocolo del TFG**](D7-PROTOCOLO-TFG.md) | De la idea de la semana 1 al emprendimiento de la semana 16 |
| — | [**Marco de Organización Personal**](MARCO-PERSONAL.md) | Documento personal: universidad, empresa e instituto a la vez |
| — | [`horario.py`](horario.py) | El programa que resuelve la franja síncrona óptima |

**Jerarquía.** En caso de contradicción prevalece el documento de menor número (Carta,
art. 79). [`ELYSIUM-STANDARDS.md`](../ELYSIUM-STANDARDS.md) y
[`ELYSIUM-PROTOTYPING.md`](../ELYSIUM-PROTOTYPING.md) son fuente técnica vinculante para el
contenido de la enseñanza y ceden ante la Carta en materia académica.

---

### El programa en una página

**16 semanas** · sábados y domingos, **15:00–17:00 UTC** · **una sola aula de 10 a 15
personas** · **gratuito en su totalidad** · sin experiencia previa exigida · **tres
generaciones al año**.

```text
        MÓDULO 0 · seis semanas antes · asíncrono, sin docente, sin nota (25 h)
        Lógica de programación · herramientas · primer HTML · idea de negocio
┌─────────────────────────────────────────────────────────────────────────────┐
│  NIVEL I · Semanas 1–5 · Fundamentos                       IA: N0 · SIN IA  │
│  Web, semántica y accesibilidad · CSS y responsividad · JavaScript · DOM     │
│  Semana 5: fundamentos teóricos de la IA, estudiada como objeto             │
│  → Página propia accesible y desplegada, escrita a mano                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  NIVEL II · Semanas 6–10 · Agentes y bases de datos                 IA: N3  │
│  Dirección de agentes en el editor · depuración · asincronía                │
│  Modelado documental (a N0) · Firestore · panel · Auth · reglas · despliegue │
│  → Plataforma con datos, acceso autenticado y compuerta de calidad          │
├─────────────────────────────────────────────────────────────────────────────┤
│  NIVEL III · Semanas 11–15 · Cierre y emprendimiento                IA: N4  │
│  S11 transacción y agente supervisado · S12 auditoría y congelación          │
│  S13 modelo de negocio · S14 marca y redes · S15 legal y memoria            │
│  → Emprendimiento digital listo para lanzar                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  SEMANA 16 · Demo Day el sábado · sustentación técnica el domingo            │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Las cuatro horas y las otras cuatro.** El Instituto **imparte cuatro horas de clase**. El
estudiante **dedica otras cuatro por su cuenta**, y no son opcionales: sin ellas no existe
la Transferencia dominical, que es lo que convierte quince laboratorios en un
emprendimiento.

**Evaluación** · 40 % continua · 30 % proyecto · 30 % hito final y sustentación. Más cuatro
requisitos de tipo apto o no apto que no promedian: asistencia del 80 %, las cuatro Defensas
Aleatorias de Autoría superadas, Auditoría Técnica sin hallazgos críticos y declaración de
uso de IA completa.

---

### Las nueve decisiones que definen este Instituto

1. **Cinco semanas iniciales sin ninguna IA.** El Nivel I es de nivel **N0**: ni
   autocompletado, ni chat, ni agente. No protege al estudiante de la IA, lo **cualifica**
   para usarla. Quien no puede leer código no dirige a un agente, lo obedece.
2. **Forma arquitectos, no programadores.** El perfil de egreso es especificar, dirigir,
   auditar y responder por un sistema construido con agentes (D2 §3).
3. **La Defensa Aleatoria de Autoría es el muro de carga.** Cuatro convocatorias por
   estudiante, sin aviso, sin asistencia. **Si se relaja, el modelo entero se cae**
   (D1 §6.5).
4. **Es gratuito, y eso es su naturaleza, no un descuento.** Nadie paga nada (Carta,
   art. 3). Se admiten donaciones bajo el art. 72, que prohíbe las de estudiantes y
   candidatos.
5. **Diez personas, una sola aula simultánea, por decisión permanente** (art. 46).
6. **Tres generaciones al año, nueve en tres años.** El ciclo de corrección del currículo
   pasa de doce meses a cuatro, que es la ventaja pedagógica más importante del calendario.
7. **El horario es 15:00–17:00 UTC, anclado a UTC todo el año.** Resultado de un modelo de
   utilidad ponderada sobre catorce husos (D5, Parte III).
8. **El certificado distingue dominado de introducido** (D2 §5.9). 22 resultados se dominan
   y 10 sólo se introducen, y decirlo es una obligación del art. 11.
9. **La investigación la hace el profesorado, no los estudiantes.** Carga cero para el
   aula: veinte minutos en todo el programa (D6). Se promete **publicar el preprint** y
   **enviar** a revista, nunca que la acepten.

---

### Calendario · las nueve primeras generaciones

| Generación | Módulo 0 se abre | Semana 1 | Semana 16 · Demo Day |
|---|---|---|---|
| **Λ27-1** | 28-XI-2026 | **9-I-2027** | **24-IV-2027** |
| **Λ27-2** | 27-III-2027 | **8-V-2027** | **21-VIII-2027** |
| **Λ27-3** | 24-VII-2027 | **4-IX-2027** | **18-XII-2027** |
| **Λ28-1** | 27-XI-2027 | **8-I-2028** | **22-IV-2028** |
| **Λ28-2** | 25-III-2028 | **6-V-2028** | **19-VIII-2028** |
| **Λ28-3** | 22-VII-2028 | **2-IX-2028** | **16-XII-2028** |
| **Λ29-1** | 2-XII-2028 | **13-I-2029** | **28-IV-2029** |
| **Λ29-2** | 31-III-2029 | **12-V-2029** | **25-VIII-2029** |
| **Λ29-3** | 28-VII-2029 | **8-IX-2029** | **22-XII-2029** |

**Convocatoria única y anual**, en octubre, de la que salen las tres generaciones del año
siguiente (D5 §17).

---

### Antes de abrir la primera convocatoria

```text
JURÍDICO Y REPUTACIONAL
□ Revisión legal del término «instituto» y del texto del certificado ← lo más urgente
□ Asesoría fiscal ANTES de abrir cualquier vía de donación (Carta, art. 72)
□ Declaración del art. 9 visible en web, convocatoria y certificado
□ Ninguna pieza de difusión dice «curso de IA» ni promete empleo (arts. 20 y 21)
□ Certificado que distingue resultados dominados de introducidos (D2 §5.9)

GOBIERNO Y CONFLICTO DE INTERÉS
□ Miembro externo del Comité de Ética, sin relación económica con la empresa
□ Auditor externo de defensas identificado y presupuestado
□ Protocolo del art. 73 operativo: ninguna oferta comercial a estudiantes en curso

ACADÉMICO
□ Módulo 0 construido y probado de principio a fin
□ Repositorio `elysium-lab` con los 15 laboratorios y su arnés de pruebas
□ Micro-guías MG01–MG15 escritas antes del arranque
□ Prueba de Disposición λ redactada y pilotada
□ Rúbrica de selección publicada ANTES de abrir la convocatoria
□ Preinscripción del protocolo de investigación (D6 §13), antes del primer dato

OPERATIVO
□ Coste de cada generación provisionado antes de abrir su Módulo 0
□ Umbral mínimo de apertura: 6 estudiantes (Carta, art. 76)
□ Tutores pares comprometidos antes de Λ27-2, o se reduce a dos generaciones (D5 §20)
□ Difusión dirigida a organizaciones de base, no sólo a comunidades de desarrollo
□ Devolución motivada al 100 % de las personas no admitidas
```

---

*Elysium λ Development & Research · Bragança, Portugal · San José, Costa Rica*
*[elysiumdr.eu](https://elysiumdr.eu)*




<div class="salto"></div>

# D0 · Carta Constitutiva

<p class="doc-sub">Norma superior del Instituto · 80 artículos</p>
<p class="doc-file">Fichero: <code>ELYSIUM-INSTITUTE/D0-CARTA-CONSTITUTIVA.md</code></p>

> **Cómo leer este documento.** Esta Carta es la norma superior del Instituto. Todo
> lo demás que el Instituto escriba se subordina a ella y se interpreta conforme a
> ella. Está redactada en títulos y artículos para que pueda citarse con precisión:
> «Carta, art. 34».
>
> **Advertencia de naturaleza jurídica.** El Instituto **no es** una institución de
> educación superior reconocida ni por Portugal ni por Costa Rica, y **no expide
> títulos académicos oficiales**. Expide certificaciones privadas de formación
> profesional. El art. 9 detalla esta condición. Ningún documento del Instituto puede
> afirmar lo contrario.

---

### Preámbulo

En 1785 Friedrich von Schiller escribió que todos los seres humanos se vuelven
hermanos allí donde se posa el ala suave de la alegría, y situó ese lugar en el
Elíseo. En 1824 Ludwig van Beethoven incorporó ese poema al cuarto movimiento de su
Novena Sinfonía. Esa música es hoy el himno oficial de la Unión Europea.

Elysium λ Development & Research nació para llevar infraestructura digital a las
pequeñas y medianas empresas que sostienen la economía europea y costarricense y que,
sin embargo, quedan fuera de la transformación tecnológica por barreras de
complejidad, coste y alfabetización digital.

Este Instituto nace de la constatación de que esa barrera no se derriba únicamente
construyendo software para las pymes: se derriba **formando a las personas capaces de
dirigir su construcción**, en su propia lengua, desde su propio país, sin tener que
emigrar ni endeudarse.

El símbolo λ es la undécima letra del alfabeto griego y la segunda de Ἠλύσιον.
Representa la abstracción de las ideas en sistemas ejecutables. Este Instituto existe
para enseñar esa abstracción, y para investigarla.

---

## PARTE I · NATURALEZA Y FINES

### Título I · Denominación, naturaleza y sede

**Art. 1 · Denominación.** Se constituye el **Elysium λ Institute of Development &
Research** (en adelante, «el Instituto»), unidad académica y de investigación de
Elysium λ Development & Research.

**Art. 2 · Naturaleza.** El Instituto es una **división académica y de investigación**
de la empresa fundadora, constituida como **programa de extensión social sin ánimo de
lucro**. No tiene personalidad jurídica separada mientras esta Carta no sea reformada
conforme al art. 77. Sus actos obligan a Elysium λ Development & Research.

**Art. 3 · Gratuidad.** La formación que imparte el Instituto es **enteramente
gratuita para el estudiante**. No existe matrícula, mensualidad, cuota de examen,
coste de materiales ni pago de ninguna clase, en ningún momento y por ningún
concepto. El Instituto no vende formación: la dona. Esta disposición está protegida
por el art. 77 y no puede reformarse durante una generación en curso.

**Art. 4 · Sede y ámbito.** Sede administrativa en Bragança, Portugal. Operación en
Costa Rica. Ámbito de enseñanza: **la totalidad del mundo hispanohablante**, por vía
telemática síncrona y asíncrona. La lengua vehicular de la docencia es el **español**;
la lengua de la producción científica es el **español y el inglés**; la lengua del
código, de sus identificadores y de sus comentarios es el **inglés**.

**Art. 5 · Misión.** Formar personas capaces de **concebir, dirigir, auditar y
sostener** infraestructura digital accesible, transparente y verificable, y de
convertirla en un emprendimiento propio.

**Art. 6 · Visión.** Ser el instituto de referencia del mundo hispanohablante en la
formación de arquitectos de infraestructura digital asistida por inteligencia
artificial, y contribuir activamente a la construcción de una Unión Europea digital y
de una Costa Rica que avanza hacia la modernidad.

**Art. 7 · Objeto.** Son objeto del Instituto:

1. La **docencia** de la arquitectura de infraestructura digital asistida por IA y del
   emprendimiento digital, en programas estructurados por generaciones.
2. La **investigación** sobre la enseñanza de la programación asistida por
   inteligencia artificial, conducida por el profesorado.
3. La **transferencia**: que cada persona formada termine el programa con la
   estructura base de un emprendimiento digital propio, real, publicado y operativo.
4. La **publicación abierta** de los resultados de su investigación y de sus propios
   indicadores de desempeño educativo.

**Art. 8 · Lema.** *Abstrahere, aedificare, probare.* Abstraer, construir, demostrar.
Ninguna afirmación del Instituto sobre lo que sus estudiantes saben hacer se sostiene
sin artefacto verificable que la demuestre.

### Título II · Condición jurídica de las certificaciones

**Art. 9 · Régimen de los certificados.**

1. El Instituto expide **certificados privados de formación profesional**, no títulos
   académicos oficiales. Todo certificado, toda página web y todo material de difusión
   deben decirlo de forma expresa y legible.
2. El Instituto **no está autorizado** a usar las denominaciones «universidad»,
   «licenciatura», «grado», «máster», «bachillerato» ni equivalentes, ni a otorgar
   ECTS. Cuando el paquete documental menciona ECTS, lo hace siempre como
   **equivalencia estimada de carga de trabajo** y nunca como crédito emitido.
3. Los certificados adoptan el formato de microcredencial descrito en la Recomendación
   del Consejo de la Unión Europea de 16 de junio de 2022 sobre un enfoque europeo de
   las microcredenciales, con el fin de facilitar su reconocimiento futuro. Adoptar el
   formato no equivale a estar reconocido.
4. El certificado distingue de forma expresa los resultados de aprendizaje alcanzados
   **a nivel de dominio** de los meramente **introducidos**, conforme a la
   clasificación del D2 §5.9. Certificar como dominado lo que sólo se introdujo
   vulnera el art. 11.

**Art. 10 · Hoja de ruta de reconocimiento.** El Instituto se obliga a tramitar, en
este orden: (a) certificación como *entidade formadora* ante la **DGERT** de Portugal;
(b) inscripción de la oferta formativa en el Sistema Nacional de Qualificações cuando
proceda; (c) convenios de reconocimiento con instituciones asociadas. Mientras (a) no
se obtenga, el art. 9 rige sin excepción. Las entidades mencionadas como asociadas en
los materiales de la empresa **no avalan académicamente** este programa salvo convenio
escrito y publicado; la Secretaría Académica mantiene el registro público de convenios
vigentes.

---

## PARTE II · PRINCIPIOS RECTORES

> Estos once principios son la parte vinculante de la Carta. Cuando una norma
> inferior, una decisión docente o una práctica operativa entren en conflicto con uno
> de ellos, prevalece el principio.

**Art. 11 · Principio de artefacto verificable.** El Instituto no evalúa
declaraciones, evalúa artefactos. Toda competencia se acredita mediante un objeto
inspeccionable por un tercero: código en un repositorio público, una auditoría
reproducible, un despliegue accesible por URL. Lo que no se puede inspeccionar, no se
puede aprobar.

**Art. 12 · Principio de autoría demostrable.** La persona que entrega un artefacto
debe poder explicarlo, modificarlo en vivo y justificar cada decisión de diseño. La
incapacidad de hacerlo invalida la entrega con independencia de su calidad técnica.
Este principio es la única defensa real contra la delegación opaca del pensamiento,
sea a otra persona o a un modelo de lenguaje, y es el **muro de carga** de todo el
modelo académico.

**Art. 13 · Principio de la inteligencia artificial como instrumento subordinado.** La
inteligencia artificial se enseña, se usa y se audita, pero nunca sustituye la
formación del criterio. Rige la **Escalera de Uso de IA** (D1 §6): cada actividad
declara su nivel permitido, y toda entrega declara el uso realizado. Ocultar el uso de
IA es falta grave; declararlo con precisión nunca lo es.

**Art. 14 · Principio de accesibilidad como requisito.** Ningún artefacto se aprueba si
excluye a una persona por su discapacidad. La accesibilidad no es un tema de una
semana ni un apartado de la rúbrica: es una condición de admisibilidad de toda
entrega, desde la primera. El Instituto aplica este principio también a su propia
docencia (art. 69).

**Art. 15 · Principio de realidad económica.** El proyecto de graduación no es un
ejercicio: es un emprendimiento real, con un cliente identificado, un modelo de
ingresos declarado y cumplimiento legal efectivo.

**Art. 16 · Principio de gratuidad y de acción social.** El dinero no puede ser la
barrera que decida quién aprende. La contrapartida de la plaza no es económica: es el
compromiso de asistencia, de entrega y de honestidad que se firma en el Compromiso λ.
De este principio se derivan dos obligaciones: que **la asignación de plazas sea
pública, reglada y motivada** (art. 71), y que **el coste real del programa se declare
y se cuantifique cada año** (art. 70).

**Art. 17 · Principio de ciencia abierta.** Los datos, el código, los instrumentos y
los preprints producidos por el Instituto se publican con licencia abierta y con
identificador persistente, salvo que la protección de datos personales lo impida. La
excepción se motiva por escrito y se publica el motivo.

**Art. 18 · Principio de medición del propio desempeño.** El Instituto publica cada
año sus propios indicadores (postulaciones, admisiones, retención, graduación,
resultados de auditoría) con metodología declarada. Un instituto que no publica sus
tasas de abandono no está en condiciones de exigir rigor a nadie.

**Art. 19 · Principio de comunidad generacional.** Los estudiantes ingresan, avanzan y
se gradúan como **generación**, no como individuos aislados. La generación es la
unidad de identidad y de aprendizaje entre pares.

**Art. 20 · Principio de honestidad en la promesa.** El Instituto no promete empleo,
no promete salarios y no publica cifras de inserción que no pueda auditar. Promete
formación, artefactos y el acompañamiento para lanzar un emprendimiento propio. Toda
comunicación se somete a esta regla y la Dirección Académica tiene derecho de veto
sobre ella.

**Art. 21 · Regla de denominación.** El programa se describe siempre como lo que es:
**programación, herramientas modernas de inteligencia artificial y emprendimiento**.
Queda expresamente prohibido:

1. Anunciarlo como «curso de IA», «máster en IA» o cualquier fórmula que sitúe la IA
   como objeto del curso en lugar de como herramienta de trabajo.
2. Insinuar que forma programadores profesionales contratables como tales, o que
   sustituye a un grado o a un ciclo formativo.
3. Prometer que el egresado «sabrá programar» sin la matización del D2 §3.3, o
   enumerar como aprendizaje lo que el D2 §5.9 clasifica como **introducido**.

El motivo no es de estilo. Un programa que se anuncia como curso de IA atrae a quien
busca una moda y decepciona a quien busca construir algo. La denominación honesta es
también un filtro de selección.

---

## PARTE III · GOBIERNO

### Título III · Órganos

**Art. 22 · Enumeración.**

| Órgano | Naturaleza | Composición mínima | Cadencia |
|---|---|---|---|
| **Consejo Académico** | Deliberante y normativo | 3 miembros | Semestral |
| **Dirección Académica** | Ejecutiva | 1 persona | Permanente |
| **Comité de Ética e Integridad Científica (CEIC)** | Independiente | 3 miembros, 1 externo | A demanda + anual |
| **Comité de Auditoría Técnica (CAT)** | Técnico evaluador | 2 miembros + 1 externo por defensa | Por generación |
| **Secretaría Académica** | Registral | 1 persona | Permanente |
| **Asamblea de Generación** | Representativo estudiantil | Toda la generación | Mensual |

**Art. 23 · Consejo Académico.** Aprueba y reforma el plan de estudios, el syllabus y
el reglamento de evaluación; resuelve en última instancia los recursos académicos;
aprueba la apertura de cada generación. Preside la Dirección Académica con voto de
calidad. Sesiona válidamente con dos tercios.

**Art. 24 · Dirección Académica.** Dirige la docencia, designa al profesorado,
responde por la calidad del programa y ejerce el veto del art. 20. Es incompatible con
la presidencia del CEIC.

**Art. 25 · Comité de Ética e Integridad Científica.** Dictamina sobre todo protocolo
de investigación que involucre personas o sus datos; resuelve expedientes de
integridad académica en segunda instancia; audita el cumplimiento de los arts. 72 y
73; custodia el registro de conflictos de interés. **Al menos un miembro debe ser
externo a Elysium λ y sin relación económica con la empresa.** Sus dictámenes son
vinculantes y sólo el Consejo Académico puede devolverlos, motivadamente y una vez.

**Art. 26 · Comité de Auditoría Técnica.** Ejecuta la Auditoría Técnica Elysium (D3
§11) sobre cada compuerta y sobre cada trabajo final. Al menos un auditor de cada
defensa de graduación debe ser **externo al Instituto**. Sus umbrales son objetivos y
públicos: no admiten valoración subjetiva.

**Art. 27 · Secretaría Académica.** Custodia expedientes, actas, calificaciones y
certificados; mantiene el registro público de convenios y el registro de generaciones;
garantiza los derechos de acceso, rectificación y supresión de datos (art. 63).

**Art. 28 · Asamblea de Generación.** Elige dos delegados por generación con voz en el
Consejo Académico. Puede solicitar por mayoría simple la revisión de una decisión
docente colectiva.

**Art. 29 · Regla de degradación honesta.** Mientras el Instituto no cuente con
personas suficientes para integrar todos los órganos, las funciones se acumulan en la
Dirección Académica **con dos excepciones inderogables**: el miembro externo del CEIC
(art. 25) y el auditor externo de la defensa final (art. 26). Ambas figuras deben
existir desde la primera generación. La acumulación de funciones se declara
públicamente en la ficha de cada generación.

**Art. 30 · Conflictos de interés.** Quien tenga interés económico, familiar o
contractual en un proyecto de estudiante se abstiene de evaluarlo. La abstención se
registra en acta y el Instituto publica anualmente el registro de abstenciones.

---

## PARTE IV · COMUNIDAD ACADÉMICA

### Título IV · Estudiantes

**Art. 31 · Condición de estudiante.** Se adquiere con la admisión formalizada y la
firma del **Compromiso λ** (Anexo A). Se conserva mientras no se incurra en causal de
pérdida (art. 36).

**Art. 32 · Requisitos de admisión.**

1. Edad mínima **16 años cumplidos** al inicio de la generación. Entre 16 y 18 se
   exige autorización escrita de quien ejerza la responsabilidad parental, conforme al
   art. 8 del Reglamento (UE) 2016/679.
2. Dominio del español a nivel **B2** o superior.
3. Acceso propio y estable a un ordenador (no tableta ni teléfono como único
   dispositivo) y a conexión a internet capaz de sostener videoconferencia.
4. Superación de la **Prueba de Disposición λ**, que no evalúa conocimientos previos de
   programación sino razonamiento lógico, comprensión lectora técnica y compromiso
   horario declarado.
5. **No se exige experiencia previa en programación.** Exigirla contradiría el art. 16.
   El **Módulo 0** (art. 42) existe precisamente para nivelar sin excluir.

**Art. 33 · Derechos del estudiante.** Son derechos irrenunciables:

- Recibir la docencia síncrona comprometida y su grabación accesible.
- Ser evaluado con criterios públicos, anteriores a la entrega y no retroactivos.
- Recibir retroalimentación escrita sobre toda entrega calificada en un plazo máximo
  de **siete días naturales**.
- Recurrir toda calificación (art. 49) y todo expediente disciplinario.
- Conservar la **propiedad intelectual íntegra** de su trabajo final (art. 60).
- Acceder, rectificar y suprimir sus datos personales (art. 63).
- Recibir ajustes razonables por discapacidad, sin coste y sin que consten en el
  certificado (art. 69).
- Estudiar en un entorno libre de acoso (art. 35).
- Participar, **si lo desea y sólo si lo desea**, en la investigación del Instituto, y
  retirar ese consentimiento en cualquier momento sin consecuencia académica alguna.

**Art. 34 · Deberes del estudiante.** Son deberes exigibles:

- Asistir al **80 % mínimo** de las sesiones síncronas, computado conforme al art. 47.
- Dedicar las **cuatro horas semanales de estudio autónomo** que el modelo exige
  (D1 §4.1), además de las cuatro horas de clase.
- Entregar dentro de plazo y declarar con veracidad el uso de IA (art. 13).
- Someterse a la Defensa Aleatoria de Autoría cuando sea convocado (D3 §10).
- Mantener público y actualizado su repositorio de proyecto.
- Respetar la confidencialidad de los datos de terceros que su proyecto trate.

**Art. 35 · Convivencia.** Queda prohibido en todo canal del Instituto el acoso, la
discriminación por cualquier causa, la difusión de trabajo ajeno como propio y la
publicación de datos personales de terceros sin base legal. La Dirección Académica
puede suspender cautelarmente el acceso a los canales mientras instruye.

**Art. 36 · Pérdida de la condición de estudiante.** Por renuncia escrita; por
incumplimiento del mínimo de asistencia sin causa justificada, tras haberse agotado el
protocolo de riesgo de abandono (D1 §8.1); o por sanción firme de expulsión (art. 58).
**No existe causal económica**, porque no existe obligación de pago.

### Título V · Profesorado

**Art. 37 · Perfil del profesorado.** Ejerce la docencia quien acredite
simultáneamente: (a) práctica profesional vigente en producción, no únicamente
académica; (b) capacidad demostrada de explicar en público; (c) adhesión escrita a
esta Carta. La práctica vigente es requisito: el Instituto no admite docencia
desconectada del ejercicio real.

**Art. 38 · Deberes del profesorado.** Publicar el syllabus antes del inicio; respetar
la estructura del Ciclo λ (D1 §4); devolver retroalimentación en siete días; grabar y
subtitular toda sesión síncrona; declarar su propio uso de IA en los materiales que
produce; y abstenerse conforme al art. 30.

**Art. 39 · Evaluación del profesorado.** Cada generación se aplica el instrumento de
percepción estudiantil (D1 §9). Los resultados agregados se publican; los individuales
son confidenciales salvo consentimiento.

**Art. 40 · Tutores pares.** El Consejo Académico puede nombrar **tutores pares** entre
las personas graduadas con mención. Su función es acompañar la revisión de
laboratorios y las tutorías de compuerta bajo supervisión de la Dirección Académica.
No califican el hito final ni participan en la Defensa Aleatoria de Autoría. Su
existencia es la vía prevista para sostener tres generaciones anuales sin degradar el
acompañamiento (D5 §20).

---

## PARTE V · RÉGIMEN ACADÉMICO

### Título VI · Estructura de la formación

**Art. 41 · Programa.** El Instituto ofrece el programa **Arquitectura de
Infraestructura Digital Asistida por IA y Emprendimiento**, de **16 semanas**,
organizadas en tres niveles de cinco semanas más una semana final de Demo Day y
sustentación.

**Art. 42 · Módulo 0.** Las seis semanas anteriores al inicio se dedican a un módulo
preparatorio **gratuito, asíncrono, autodirigido, sin docente y sin calificación**, de
unas 25 horas, que cubre lógica de programación, herramientas y primer documento web.
No es requisito de admisión ni filtro encubierto: es la condición que hace posible
impartir el programa en dieciséis semanas sin exigir experiencia previa. Quien no lo
complete conserva su plaza y elige entre aplazarse a la generación siguiente o entrar
asumiendo por escrito la desventaja.

**Art. 43 · Régimen horario.** Docencia síncrona **sábado y domingo, dos horas cada
día**, en la franja **15:00–17:00 UTC**, anclada a UTC todo el año. Cada sesión va
precedida y seguida de trabajo asíncrono según el D1 §4.

**Art. 44 · Carga de trabajo.** La carga nominal es de **8 horas semanales**: **4 de
clase impartida** y **4 de estudio autónomo obligatorio**. Total: **128 horas
lectivas**, más unas 25 horas del Módulo 0 y unas 20 horas de memoria y preparación de
la defensa. **Carga total aproximada: 173 horas.** Equivalencia estimada: **6 a 7
ECTS**, en el sentido del art. 9.2.

**Art. 45 · Generaciones.** El Instituto imparte **tres generaciones por año natural**,
de enero a abril, de mayo a agosto y de septiembre a diciembre, con un fin de semana
de receso entre cada una. Cada generación recibe un código de la forma **Λaa-n**, donde
`aa` son las dos últimas cifras del año y `n` el ordinal dentro de ese año.

**Art. 46 · Aula.** El Instituto opera **una sola aula λ por generación**, de **quince
estudiantes como máximo y diez como número ideal**. El límite no es una restricción
transitoria: es una **decisión de diseño permanente**. Los tres mecanismos que definen
al Instituto (la Defensa Aleatoria de Autoría, la tutoría individual ligada a cada
compuerta y la retroalimentación escrita en siete días) sólo son sostenibles a esa
escala. Por la misma razón, **el Instituto no abre aulas paralelas simultáneas**:
crecer en número de estudiantes por aula no es un objetivo declarado del programa.

**Art. 47 · Asistencia y asistencia diferida.**

1. La asistencia síncrona mínima es del **80 %**.
2. Se admite **asistencia diferida** hasta un **25 %** de las sesiones: visionado
   íntegro de la grabación más entrega del *parte de sesión diferida* en un plazo de 72
   horas. La asistencia diferida computa como asistencia.
3. No está disponible para las sesiones de defensa, para el Demo Day ni para aquellas
   que el syllabus marque como **presencia obligatoria**.
4. Existe para no penalizar estructuralmente a las zonas horarias donde la sesión
   coincide con la comida principal (D5 §15).

**Art. 48 · Progresión y repetición.** El programa es una **unidad indivisible de
dieciséis semanas**. No existen matrículas parciales, ni asignaturas sueltas, ni
certificación por niveles: los tres niveles son la estructura interna de un único
programa. Quien no lo apruebe puede cursarlo una sola vez más, incorporándose a una
generación posterior y conservando sus artefactos aprobados.

**Art. 49 · Calificación, revisión y recurso.** Escala **0 a 100**; aprobación en
**70**. El estudiante puede pedir revisión razonada en los 5 días siguientes a la
publicación de la nota; el docente responde por escrito en 5 días; si persiste el
desacuerdo, resuelve el Consejo Académico en 15 días. La resolución del Consejo agota
la vía interna.

**Art. 50 · Certificación.** Quien completa las 16 semanas, aprueba el programa, supera
la Auditoría Técnica final y sostiene su defensa recibe el **Certificado de Arquitecto
de Infraestructura Digital Elysium λ**, que consigna: identidad, carga horaria, método
de evaluación, URL del proyecto final, la mención expresa del art. 9.1 y la distinción
entre resultados dominados e introducidos (art. 9.4).

**Art. 51 · Constancia de participación.** Quien no completa el programa puede
solicitar una **constancia de participación** que declara las semanas cursadas y hace
constar de forma expresa que **no acredita resultado de aprendizaje alguno**. No es una
microcredencial y no puede presentarse como tal.

### Título VII · Investigación y trabajo final

**Art. 52 · Investigación del Instituto.** El Instituto mantiene una línea de
investigación propia sobre la enseñanza de la programación asistida por inteligencia
artificial, **conducida y firmada por el profesorado**. Se rige por el **D6**.

**Art. 53 · Los estudiantes no cargan con la investigación.** El plan de estudios **no
contiene ninguna actividad de investigación evaluable**. La participación en el estudio
es voluntaria, revocable, anónima, no afecta a ninguna calificación y no puede exigir
al estudiante más de **veinte minutos** en todo el programa. Los estudiantes **no
figuran como autores**, por ser sujetos del estudio, y se les reconoce de forma
colectiva en los agradecimientos.

**Art. 54 · Trabajo Final de Graduación.** Cada estudiante desarrolla, desde la semana
1 y hasta la 16, **la estructura base de un emprendimiento digital propio y real**, con
su memoria técnica y su defensa. Se rige por el **D7**.

**Art. 55 · Compromiso de publicación.** El Instituto se compromete a **publicar un
preprint con identificador persistente** y a **enviar** el manuscrito a revisión. **No
se compromete a que una revista lo acepte**, porque eso no depende de nadie del
Instituto. Confundir ambas promesas vulnera el art. 20.

---

## PARTE VI · INTEGRIDAD, CIENCIA ABIERTA Y DATOS

### Título VIII · Integridad académica

**Art. 56 · Definición de falta.**

| Código | Falta | Gravedad |
|---|---|---|
| **I-01** | Presentar como propio código, texto o datos ajenos sin atribución | Grave |
| **I-02** | Ocultar o falsear la declaración de uso de IA | Grave |
| **I-03** | Usar IA en una actividad declarada de nivel N0 | Grave |
| **I-04** | Suplantación de identidad en sesión, entrega o defensa | Muy grave |
| **I-05** | Falsear la asistencia o el parte de sesión diferida | Leve |
| **I-06** | Publicar datos personales de terceros sin base legal | Grave |
| **I-07** | Reutilizar trabajo propio de otra evaluación sin declararlo | Leve |
| **I-08** | Impedir o entorpecer la Defensa Aleatoria de Autoría | Grave |

**Art. 57 · La declaración de uso de IA.** Toda entrega incorpora el fichero
`AI-USE.md` según la plantilla del D3, Anexo II. La declaración veraz de un uso
intensivo **nunca** es sancionable si el nivel estaba permitido. La omisión sí lo es.
El Instituto prefiere el uso declarado al uso oculto, y lo dice sin ambigüedad.

**Art. 58 · Procedimiento y sanciones.** Instruye la Dirección Académica y resuelve en
primera instancia; el CEIC resuelve el recurso. Se garantiza audiencia previa, acceso
al expediente y motivación escrita.

| Gravedad | Sanción |
|---|---|
| **Leve** | Amonestación escrita; repetición de la entrega con techo de 70 |
| **Grave** | Calificación 0 en la actividad; anotación en expediente; convocatoria inmediata a Defensa Aleatoria de Autoría sobre el resto de las entregas |
| **Muy grave** | Expulsión del programa, pérdida de la plaza, que se declara vacante, y revocación de los certificados ya emitidos |

**Art. 59 · Revocación de certificados.** El Consejo Académico puede revocar un
certificado si se acredita falta muy grave anterior a su emisión. La revocación se
comunica al titular y se anota en el registro público de certificados revocados, sin
exponer datos personales innecesarios.

### Título IX · Propiedad intelectual y ciencia abierta

**Art. 60 · Propiedad del trabajo del estudiante.** El código, el diseño, la marca y el
modelo de negocio del Trabajo Final de Graduación **pertenecen íntegramente al
estudiante**. El Instituto no adquiere derecho patrimonial alguno sobre ellos.

**Art. 61 · Licencia de exhibición.** El estudiante concede al Instituto una licencia
**no exclusiva, gratuita y revocable** para mostrar su proyecto con fines académicos y
de difusión, con atribución. La revocación surte efecto en 30 días.

**Art. 62 · Producción científica.** Los datos anonimizados, los instrumentos y el
código de la investigación del Instituto se publican bajo licencia abierta con
identificador persistente. El Instituto no reclama autoría corporativa: los autores son
las personas.

### Título X · Protección de datos personales

**Art. 63 · Régimen aplicable.** El tratamiento de datos personales se rige por el
Reglamento (UE) 2016/679, por la Lei n.º 58/2019 de Portugal y, para titulares en Costa
Rica, por la Ley n.º 8968. El responsable del tratamiento es Elysium λ Development &
Research.

**Art. 64 · Reglas específicas del entorno educativo.**

1. Las grabaciones de sesión se conservan **24 meses** y luego se suprimen.
2. La cámara **nunca es obligatoria**, salvo en defensas y evaluaciones de autoría,
   donde sí lo es y así se advierte con antelación.
3. El Instituto **no realiza proctoring biométrico ni vigilancia algorítmica**. La
   integridad se asegura por defensa oral, no por vigilancia.
4. Los datos que el proyecto de un estudiante trate sobre terceros son responsabilidad
   del estudiante, que actúa como responsable independiente. El D7 §8 fija sus
   obligaciones mínimas.
5. Ningún dato personal de estudiantes se incorpora a la investigación del Instituto
   sin consentimiento explícito, separado y revocable, y **el análisis no se ejecuta
   hasta que los certificados están emitidos** (D6 §5).

**Art. 65 · Registro de tratamientos.** La Secretaría Académica mantiene el registro de
actividades de tratamiento del Instituto y lo revisa al cierre de cada generación.

**Art. 66 · Brechas de seguridad.** Toda violación de datos personales se notifica a la
autoridad de control competente dentro de las 72 horas y a los interesados cuando
proceda.

**Art. 67 · Conservación de expedientes.** Los expedientes académicos se conservan
mientras subsista la validez del certificado. Las candidaturas no admitidas se suprimen
a los doce meses, salvo que la persona pida conservarlas para la convocatoria siguiente.

**Art. 68 · Transferencias.** Cuando un proveedor esté fuera del Espacio Económico
Europeo, la Secretaría verifica la base de transferencia aplicable y lo hace constar en
el registro del art. 65.

---

## PARTE VII · ACCESIBILIDAD, SOSTENIBILIDAD Y SELECCIÓN

**Art. 69 · Accesibilidad de la propia docencia.** El Instituto aplica a sus materiales
y plataformas el mismo estándar que exige: **WCAG 2.2 nivel AA** como mínimo, en
coherencia con la norma EN 301 549 y con la Directiva (UE) 2019/882. Toda sesión se
publica con subtítulos en español. Todo material escrito se entrega en formato legible
por lector de pantalla. Los ajustes razonables se conceden en 10 días hábiles y no
constan en el certificado.

**Art. 70 · Financiación.** El programa se financia **íntegramente con recursos de
Elysium λ Development & Research**, procedentes de su actividad comercial. El
Instituto:

1. **No cobra** al estudiante por ningún concepto (art. 3).
2. **No condiciona** ninguna plaza, calificación ni certificado a la contratación de
   servicios de la empresa.
3. **Puede aceptar donaciones y patrocinio**, con las condiciones del art. 72.
4. **Publica cada año el coste real del programa**, en dinero y en horas donadas, junto
   con los indicadores del art. 18 y el origen y el importe de toda donación recibida.

**Art. 71 · Selección de las plazas.** Al ser gratuitas y escasas, las plazas se
adjudican mediante un proceso **público, reglado y motivado**, publicado antes de abrir
la convocatoria y no alterado durante ella. Rigen estas reglas:

1. Se evalúa con una **rúbrica publicada** cuyos criterios son: disposición demostrada
   en la Prueba de Disposición λ, viabilidad horaria real, claridad del proyecto que se
   quiere construir, y **situación de acceso**, entendida como la distancia que separa a
   la persona de una oportunidad equivalente por otra vía.
2. **No se puntúa el conocimiento previo de programación.** Puntuarlo convertiría el
   programa en un premio a quien ya tuvo oportunidades.
3. Toda persona no admitida recibe **la razón concreta** de su no admisión y una
   indicación de qué la haría admisible en la convocatoria siguiente.
4. La convocatoria es **única y anual**, y de ella salen las tres generaciones del año
   siguiente (D5 §22). Una sola comparación, una sola rúbrica, un solo momento.
5. Quien tenga relación personal, familiar o comercial con una persona candidata se
   abstiene de valorarla y la abstención consta en acta.

**Art. 72 · Régimen de donaciones.** El Instituto puede recibir donaciones bajo seis
condiciones que no admiten excepción:

1. **Ninguna donación otorga plaza, influencia ni trato alguno.**
2. **No se aceptan donaciones de estudiantes en curso, ni de sus familias, ni de
   personas candidatas durante la convocatoria**, hasta la emisión del certificado.
3. **No se aceptan donaciones condicionadas** al contenido del currículo, a la
   selección de estudiantes ni a la línea de investigación.
4. **Todo donante y todo importe se publican** en el informe anual; si la persona pide
   anonimato, se publica el importe y la categoría pero no el nombre.
5. **El Comité de Ética audita** el cumplimiento de este artículo cada año.
6. **Las donaciones no alteran la gratuidad ni la crean.** El art. 3 rige aunque no se
   reciba ni un euro.

> **Advertencia práctica.** Una sociedad mercantil que recibe donaciones para una
> actividad gratuita tiene un tratamiento fiscal y contable propio en Portugal, y puede
> aconsejar constituir una figura separada sin ánimo de lucro. Es una decisión que
> exige asesoría antes de abrir cualquier vía de donación.

**Art. 73 · Separación entre docencia y actividad comercial.** Ninguna oferta comercial
de Elysium λ Development & Research puede dirigirse a un estudiante mientras conserve
esa condición. La oferta al graduado sólo puede comunicarse **después** de emitido su
certificado, y nunca puede presentarla quien lo evaluó.

> El motivo de este artículo es que la gratuidad, lejos de eliminar el conflicto de
> interés, lo concentra: si nadie paga por la formación, la única vía de retorno
> imaginable es convertir a los estudiantes en clientes. Reconocerlo y prohibirlo de
> forma expresa es la única manera de que la acción social lo sea de verdad.

**Art. 74 · Patrocinio.** Admisible sólo sin contrapartida y sin influencia sobre
currículo, selección ni línea de investigación, y siempre declarado con su importe.

**Art. 75 · Retirada del programa.** La persona estudiante puede retirarse en cualquier
momento, sin causa, sin plazo y **sin consecuencia económica alguna**. Se le pide
únicamente que lo comunique por escrito, para que su plaza pueda reasignarse y para que
el Instituto pueda medir con honestidad su tasa de abandono. La retirada comunicada
nunca consta como demérito.

**Art. 76 · Umbral de apertura.** Ninguna generación se abre con menos de **seis**
estudiantes. Por debajo de ese número, la generación se aplaza a la siguiente del año y
se comunica públicamente el motivo.

---

## PARTE VIII · REFORMA Y DISPOSICIONES

**Art. 77 · Reforma.** Esta Carta se reforma por acuerdo de dos tercios del Consejo
Académico, previo informe del CEIC y audiencia de la Asamblea de Generación. Los
artículos 3 (gratuidad), 11 a 21 (principios rectores) y 60 (propiedad del estudiante)
requieren **unanimidad** del Consejo y no pueden reformarse durante una generación en
curso.

**Art. 78 · Versionado.** La Carta sigue el sistema de versionado Elysium
(`ELYSIUM-STANDARDS.md`, §7). Toda reforma incrementa la versión menor; toda reforma de
los artículos protegidos incrementa la mayor.

**Art. 79 · Jerarquía documental.** En caso de contradicción prevalece el documento de
menor número: D0 sobre D1, D1 sobre D2, y así sucesivamente. Los documentos técnicos de
la empresa (`ELYSIUM-STANDARDS.md`, `ELYSIUM-PROTOTYPING.md`) son **fuente técnica
vinculante** para el contenido de la enseñanza, y ceden ante esta Carta en materia
académica.

**Art. 80 · Regla del calendario.** El año académico coincide con el año natural. La
primera generación de cada año inicia el **segundo sábado de enero**; las tres
generaciones se suceden con un fin de semana de receso entre ellas, y la tercera cierra
en diciembre. El detalle operativo está en el D5 §17.

**Disposición transitoria.** La generación **Λ27-1** inicia el **sábado 9 de enero de
2027** y celebra su Demo Day el **sábado 24 de abril de 2027**. Su Módulo 0 se abre el
**28 de noviembre de 2026**. La convocatoria de la que salen las tres generaciones de
2027 se publica en **octubre de 2026**.

**Disposición final.** Esta Carta entra en vigor el día de su publicación en el
repositorio documental del Instituto y su firma por la Dirección Académica.

---

## ANEXOS

### Anexo A · Compromiso λ

> Yo, ____________________, al incorporarme a la generación ______ del Elysium λ
> Institute of Development & Research, me comprometo:
>
> A **construir lo que digo que construí**, y a poder explicarlo línea por línea.
> A **declarar con exactitud** toda ayuda que reciba, de una persona o de una máquina.
> A **no excluir a nadie** con lo que programe, y a comprobarlo, no a suponerlo.
> A **sostener a mi generación**, porque nadie se gradúa solo.
> A **dedicar las ocho horas semanales** que este programa exige: cuatro de clase y
> cuatro por mi cuenta.
> A **entregar a tiempo o avisar a tiempo**.
>
> Entiendo que el Instituto puede pedirme, en cualquier momento y sin aviso, que
> explique mi propio trabajo, y que no poder hacerlo anula ese trabajo.
>
> Firma: ____________________  Fecha: ____________

### Anexo B · Jerarquía del paquete documental

| Código | Documento | Aprueba | Reforma |
|---|---|---|---|
| **D0** | Carta Constitutiva | Consejo Académico | 2/3 · unanimidad en arts. 3, 11–21, 60 |
| **D1** | Modelo Académico | Consejo Académico | Mayoría simple |
| **D2** | Plan de Estudios | Consejo Académico | Mayoría simple |
| **D3** | Reglamento de Evaluación | Consejo Académico | Mayoría simple |
| **D4** | Syllabus del Programa | Dirección Académica | Dirección, con aviso |
| **D5** | Manual de Operación | Dirección Académica | Dirección |
| **D6** | Protocolo de Investigación | CEIC | CEIC |
| **D7** | Protocolo del Trabajo Final de Graduación | Consejo Académico | Mayoría simple |

**Regla de congelación.** El D4 **no se modifica durante una generación en curso**
salvo corrección de errores materiales, que se anota en su registro de erratas.

### Anexo C · Glosario

**Arquitecto de infraestructura digital asistida por IA** · Perfil que forma el
programa: quien especifica, dirige, audita y responde por un sistema construido en gran
medida con agentes (D2 §3).
**Aula λ** · Grupo síncrono único de la generación, de hasta 15 estudiantes y 10 como
número ideal (art. 46).
**Artefacto** · Objeto inspeccionable que acredita una competencia.
**Auditoría Técnica Elysium (ATE)** · Batería de comprobaciones objetivas con umbrales
públicos aplicada a cada compuerta (D3 §11).
**Ciclo λ** · La estructura Antes / Durante / Después de cada sesión (D1 §4).
**Compuerta** · Punto del programa que no se atraviesa sin aprobación explícita.
**Defensa Aleatoria de Autoría (DAA)** · Comparecencia oral de diez minutos, sin aviso
previo, para explicar y modificar el propio código (D3 §10).
**Dominado / Introducido** · Distinción obligatoria en el certificado entre lo que el
estudiante demostró con artefacto y defendió, y lo que sólo practicó una vez (D2 §5.9).
**Escalera de IA** · Los cinco niveles N0 a N4 de uso permitido (D1 §6).
**Generación** · Cohorte que ingresa y se gradúa junta. Código `Λaa-n` (art. 45).
**Módulo 0** · Preparación asíncrona, gratuita y sin nota de las seis semanas anteriores
al inicio (art. 42).
**Nivel** · Cada uno de los tres bloques de cinco semanas. **No es certificable por
separado** (art. 48).
**Transferencia** · Trabajo asíncrono dominical en que lo aprendido en el laboratorio se
aplica al proyecto propio.

---

*Elysium λ Institute of Development & Research · D0 · «Abstrahere, aedificare, probare.»*




<div class="salto"></div>

# D1 · Modelo Académico

<p class="doc-sub">Por qué se enseña así, y con qué evidencia</p>
<p class="doc-file">Fichero: <code>ELYSIUM-INSTITUTE/D1-MODELO-ACADEMICO.md</code></p>

> **Cómo leer este documento.** Aquí se explica **por qué** el Instituto enseña como
> enseña. La Parte I fija la fundamentación científica: cada decisión de diseño se
> declara junto a la evidencia que la sostiene, para que pueda discutirse y, si
> procede, refutarse. La Parte II describe la maquinaria concreta del Ciclo λ, minuto a
> minuto. La Parte III regula el uso de la inteligencia artificial, que es la parte más
> delicada del modelo. La Parte IV trata la comunidad y la permanencia. La Parte V es
> el aseguramiento de la calidad docente.
>
> Se subordina a la Carta (D0) y gobierna el plan de estudios (D2), el reglamento de
> evaluación (D3) y el syllabus (D4).
>
> **Nota epistemológica.** Las referencias citadas son el estado del conocimiento tal
> como el Instituto lo entiende. Ninguna es dogma. El art. 18 de la Carta obliga a
> medir el propio desempeño; si los datos contradicen alguna decisión de la Parte I, se
> reforma la decisión, no se ocultan los datos.

---

## PARTE I · FUNDAMENTACIÓN CIENTÍFICA

### 1 · El problema que este modelo resuelve

El programa dispone de **cuatro horas síncronas por semana** y de estudiantes que
trabajan o estudian de lunes a viernes, repartidos en catorce husos horarios, con
conectividad desigual y sin experiencia previa de programación. En esas condiciones,
tres modos de enseñanza fracasan de forma predecible:

1. **La clase magistral en directo.** Consume la única hora en que el docente está
   disponible en aquello que el estudiante puede hacer solo: escuchar.
2. **El curso grabado autoadministrado.** La ausencia de presencia docente y de
   compromiso social produce abandonos masivos. La motivación no es un rasgo del
   estudiante: es un producto del diseño.
3. **El bootcamp de inmersión total.** Excluye por definición a quien no puede dejar de
   trabajar, es decir, a la mayoría del público al que el art. 16 de la Carta obliga a
   servir.

El modelo responde con una tesis: **la hora síncrona se reserva para lo que sólo puede
ocurrir en compañía**, esto es, la producción con corrección inmediata, la discusión de
decisiones de diseño y la articulación en voz alta del propio razonamiento. Todo lo
demás se desplaza fuera de ella, antes y después.

### 2 · Los once mecanismos y sus decisiones de diseño

Cada fila declara el mecanismo, la evidencia que lo respalda, la decisión que el
Instituto adopta y el lugar donde esa decisión se observa. Las decisiones son
verificables: si una no se cumple en el syllabus, el syllabus está mal.

#### 2.1 · Aula invertida sin recorte de tiempo síncrono

| | |
|---|---|
| **Mecanismo** | Trasladar la exposición inicial fuera del aula libera el tiempo compartido para práctica y discusión. |
| **Evidencia** | El metaanálisis de van Alten, Phielix, Janssen y Kester (2019, *Educational Research Review* 28, k = 114) encuentra un efecto positivo pequeño sobre los resultados y ninguno sobre la satisfacción. Sus análisis de moderadores son lo informativo: el efecto es **mayor cuando el tiempo presencial no se reduce** y **mayor cuando se añaden cuestionarios**. |
| **Decisión λ** | Se invierte el aula **sin recortar un minuto** de las cuatro horas síncronas, y se añade **un cuestionario obligatorio** al cierre de cada sesión teórica. El trabajo previo no sustituye a la clase: la habilita. |
| **Dónde se ve** | §4 y D4, bloques *Antes* y quices `Q01`–`Q15`. |

> **Consecuencia que el Instituto acepta.** El mismo metaanálisis indica que invertir el
> aula **no mejora la satisfacción**. El modelo puede resultar más exigente y menos
> cómodo que un curso grabado, y así se comunica en la convocatoria. No se vende
> comodidad.

#### 2.2 · Práctica de recuperación y espaciamiento

| | |
|---|---|
| **Mecanismo** | Recuperar información de la memoria consolida más que releerla; distribuir la práctica consolida más que concentrarla. |
| **Evidencia** | Roediger y Karpicke (2006) sobre el efecto de examen; Dunlosky, Rawson, Marsh, Nathan y Willingham (2013, *Psychological Science in the Public Interest* 14-1) clasifican **práctica de recuperación** y **práctica distribuida** como las dos únicas técnicas de **utilidad alta** entre diez evaluadas. |
| **Decisión λ** | Quiz de recuperación al cierre de cada sábado, de **producción** y no de opción única. Cada quiz incluye **tres ítems de semanas anteriores** con espaciamiento creciente. Ninguna sesión repasa: recupera. |
| **Dónde se ve** | D3 §5 y campo *espaciado* de cada quiz en D4. |

#### 2.3 · Carga cognitiva y ejemplos resueltos con desvanecimiento

| | |
|---|---|
| **Mecanismo** | La memoria de trabajo del novato se satura si se le pide resolver antes de haber visto resolver. El andamiaje debe retirarse a medida que crece la pericia, porque mantenerlo perjudica al experto. |
| **Evidencia** | Teoría de la carga cognitiva de Sweller; efecto del ejemplo resuelto; efecto de reversión por pericia (Kalyuga y cols., 2003); modelo 4C/ID de van Merriënboer y Kirschner. |
| **Decisión λ** | Secuencia de desvanecimiento en cuatro pasos: ejemplo completo → ejemplo con huecos → problema de completar → problema abierto. En el Nivel I el 60 % de la práctica es de los dos primeros tipos; en el Nivel III lo es el 10 %. |
| **Dónde se ve** | §5.2 y campo *Andamiaje* de cada semana en D4. |

#### 2.4 · Leer código antes de escribirlo: PRIMM

| | |
|---|---|
| **Mecanismo** | El novato que escribe antes de saber leer programa por imitación superficial. Predecir, ejecutar e investigar código ajeno antes de modificarlo construye el modelo mental de la máquina. |
| **Evidencia** | Marco **PRIMM** (Predict–Run–Investigate–Modify–Make) de Sentance y Waite, con base sociocultural vygotskiana, y su evaluación con profesorado (SIGCSE 2019). |
| **Decisión λ** | Todo laboratorio empieza con **predicción escrita** sobre código no ejecutado. La predicción se registra: es espejo metacognitivo para el estudiante y dato para la investigación del profesorado. |
| **Dónde se ve** | D4, bloque `00:00–00:15` de cada domingo. |

> **Por qué PRIMM importa más aquí que en un curso convencional.** Este programa forma a
> quien **dirigirá agentes**, no a quien escribirá el código a mano. La destreza central
> del egresado es exactamente la primera letra de PRIMM: **leer código ajeno y predecir
> qué hace**. El código que tendrá delante durante el resto de su vida profesional lo
> habrá escrito una máquina.

#### 2.5 · Problemas de Parsons como evaluación de bajo coste

| | |
|---|---|
| **Mecanismo** | Ordenar bloques desordenados evalúa la comprensión de la estructura sin el coste cognitivo de la sintaxis. |
| **Evidencia** | Informe del grupo de trabajo ITiCSE 2022 *Parsons Problems and Beyond*: se resuelven en menos tiempo que escribir código desde cero **sin sacrificar el aprendizaje** y permiten calificación más fiable. Las variantes con desvanecimiento mejoran la instrucción de patrones. |
| **Decisión λ** | Los quices usan **problemas de Parsons con desvanecimiento** como formato principal. Reservan el tiempo escaso del estudiante para pensar, no para pelear con puntos y comas. |
| **Dónde se ve** | D3 §5. |

#### 2.6 · Aprendizaje cognitivo: hacer visible el pensamiento del experto

| | |
|---|---|
| **Mecanismo** | La programación es un oficio cuyo trabajo real ocurre dentro de la cabeza del experto. El aprendizaje cognitivo lo externaliza mediante modelado, entrenamiento, andamiaje, articulación, reflexión y exploración. |
| **Evidencia** | Collins, Brown y Newman (1989), *Cognitive Apprenticeship*. |
| **Decisión λ** | El docente programa en vivo **incluyendo sus errores** y verbalizando sus dudas; prohibido pegar código pre-escrito. El estudiante narra su razonamiento en voz alta durante los laboratorios en parejas. El error del docente en directo es material didáctico, no un accidente. |
| **Dónde se ve** | §4.2 y Anexo A. |

#### 2.7 · Instrucción entre pares

| | |
|---|---|
| **Mecanismo** | Ante una pregunta conceptual difícil, discutir con un par que sostiene otra respuesta produce más aprendizaje que escuchar la explicación correcta. |
| **Evidencia** | Peer Instruction de Mazur; su replicación en informática por Porter, Bailey Lee y Simon, con reducción documentada de tasas de fracaso en cursos introductorios. |
| **Decisión λ** | Los 40 minutos finales del sábado son instrucción entre pares con protocolo fijo: voto individual → discusión en parejas → segundo voto → cierre. Se registran ambos votos: el desplazamiento entre uno y otro mide la calidad de la pregunta. |
| **Dónde se ve** | §4.2 y bloque de pares de cada sábado en D4. |

#### 2.8 · Fracaso productivo antes de la instrucción

| | |
|---|---|
| **Mecanismo** | Intentar y fallar en un problema antes de recibir la explicación prepara el terreno conceptual y mejora la transferencia, aunque el intento no llegue a la solución. |
| **Evidencia** | Programa de investigación de Kapur sobre *productive failure*. |
| **Decisión λ** | Se usa **de forma selectiva y no como norma**: sólo en los cuatro puntos donde el concepto tiene una intuición previa errónea documentada. El fracaso productivo con carga cognitiva alta y novatos absolutos es contraproducente, y el Instituto lo acota. |
| **Dónde se ve** | Semanas **4, 7, 10 y 11** del D4. |

#### 2.9 · Dominio con reintento, no promedio con arrastre

| | |
|---|---|
| **Mecanismo** | Si la unidad *n+1* depende de la *n*, aprobar la *n* con 71 arrastra una deuda que se acumula hasta el colapso. |
| **Evidencia** | Bloom (1984) sobre el problema de las dos sigmas y la tradición de *mastery learning* de Guskey. El Instituto adopta el mecanismo **sin suscribir la magnitud del efecto**: la cifra de dos desviaciones típicas no ha sido replicada de forma robusta y no se usa como argumento de difusión (Carta, art. 20). |
| **Decisión λ** | Todo laboratorio admite **reintento hasta alcanzar el criterio**, con techo decreciente (100 / 85 / 70) y fecha límite dura. Las **compuertas** no admiten arrastre. |
| **Dónde se ve** | D3 §14 y D7 §6. |

#### 2.10 · Alineamiento constructivo

| | |
|---|---|
| **Mecanismo** | Resultados de aprendizaje, actividades y evaluación deben apuntar al mismo verbo y al mismo nivel cognitivo. |
| **Evidencia** | Biggs, alineamiento constructivo; taxonomía SOLO. |
| **Decisión λ** | Cada semana declara sus códigos `RA`, y la matriz del D2 §6 cruza cada uno con la actividad que lo desarrolla, el instrumento que lo mide y **su nivel de logro**. Ningún `RA` queda sin instrumento; ningún instrumento mide lo que ningún `RA` declara. |
| **Dónde se ve** | D2 §5.9 y §6. |

#### 2.11 · Retroalimentación que alimenta hacia adelante

| | |
|---|---|
| **Mecanismo** | La retroalimentación sólo produce aprendizaje si el estudiante puede actuar sobre ella en la tarea siguiente. Una nota al final del curso no es retroalimentación: es un veredicto. |
| **Evidencia** | Hattie y Timperley (2007), modelo de las tres preguntas; Nicol y Macfarlane-Dick (2006), principios de la evaluación formativa que sostiene la autorregulación. |
| **Decisión λ** | Toda retroalimentación se emite en **siete días naturales** y en formato de tres campos obligatorios: *qué cumple el criterio*, *qué no lo cumple y por qué*, *qué acción concreta lo corregiría*. Prohibidas las valoraciones sin acción. |
| **Dónde se ve** | D3, Anexo I. |

### 3 · Lo que este modelo deliberadamente no hace

Declarar los límites es parte del rigor.

- **No promete personalización algorítmica.** No hay motor adaptativo. La adaptación la
  hace un docente humano que conoce a diez personas y su código.
- **No usa gamificación por puntos, insignias ni rachas.** Compiten con la motivación
  autónoma que el §8 busca construir.
- **No aplica vigilancia algorítmica de exámenes** (Carta, art. 64.3). La integridad se
  resuelve con defensa oral, que además es formativa.
- **No enseña un marco de trabajo de moda como eje.** El eje es la plataforma web y el
  criterio de arquitectura. Los marcos son herramienta subordinada y sustituible.
- **No asegura empleo.** Asegura artefacto, auditoría y emprendimiento lanzado.
- **No escala, y no pretende hacerlo.** Diez personas por generación y una sola aula
  simultánea (Carta, art. 46). Un modelo que depende de que el docente conozca el código
  de cada estudiante no se convierte en masivo sin dejar de ser lo que es.

---

## PARTE II · LA MAQUINARIA: EL CICLO λ

### 4 · Estructura de la semana

#### 4.1 · Las cuatro horas de clase y las cuatro de estudio

Conviene dejarlo escrito sin ambigüedad, porque es la fuente de malentendido más
frecuente al describir el programa:

> **El Instituto imparte cuatro horas de clase a la semana.** Dos el sábado y dos el
> domingo, en directo, con el docente presente. Ésa es la totalidad del tiempo lectivo
> síncrono y no hay más.
>
> **El estudiante dedica otras cuatro horas por su cuenta.** Media hora antes de cada
> sesión, media hora de quiz el sábado, y entre una y dos horas el domingo para llevar
> lo aprendido a su propio proyecto. Ese tiempo **no es opcional ni es tarea**: es la
> mitad del método.

```text
        ANTES (asíncrono)        DURANTE (síncrono)         DESPUÉS (asíncrono)
        ─────────────────        ──────────────────         ───────────────────
SÁBADO  30 min · micro-guía  →   120 min · concepto     →   30 min · quiz de
        + 3 predicciones         20' dudas                  recuperación con
                                 60' modelado en vivo       ítems espaciados
                                 40' instrucción entre pares

DOMINGO 30 min · entorno     →   120 min · laboratorio  →   60–90 min ·
        listo + predicción       15' reto y predicción      TRANSFERENCIA al
        escrita del código       90' construcción           proyecto propio
                                 15' validación y entrega   + empuje al repositorio
```

Si el trabajo asíncrono se suprimiera y quedaran sólo las cuatro horas de clase, el
Ciclo λ dejaría de funcionar: no habría predicciones que abrir el sábado, no habría
recuperación espaciada y, sobre todo, **no habría Transferencia**, que es el mecanismo
por el que quince domingos producen un emprendimiento real en lugar de quince
ejercicios sueltos.

#### 4.2 · Sábado · sesión conceptual (120 minutos)

| Tramo | Duración | Qué ocurre | Regla dura |
|---|---|---|---|
| **S-1 · Apertura y dudas** | 20 min | Se resuelven las dudas del *Antes*. El docente abre con las tres predicciones erróneas más frecuentes. | Nunca se empieza explicando: se empieza escuchando. |
| **S-2 · Modelado en vivo** | 60 min | Programación o diagramación en directo, con errores reales, verbalizando el razonamiento y las alternativas descartadas. | Prohibido pegar código pre-escrito. En el Nivel I, prohibido todo asistente en la pantalla de proyección. |
| **S-3 · Instrucción entre pares** | 40 min | Pregunta conceptual difícil → voto individual → 5 min en parejas → segundo voto → cierre. | Se registran ambos votos. Si el primer voto acierta por encima del 80 %, la pregunta era mala y se sustituye. |

**Cierre.** El docente enuncia en una frase el criterio de éxito del laboratorio del día
siguiente. Los estudiantes salen sabiendo qué van a construir.

#### 4.3 · Domingo · laboratorio (120 minutos)

| Tramo | Duración | Qué ocurre | Regla dura |
|---|---|---|---|
| **L-1 · Reto y predicción** | 15 min | Se presenta el reto y el código de partida. Cada estudiante escribe su **predicción** antes de ejecutarlo. | Nadie ejecuta antes de predecir. La predicción se envía y queda registrada. |
| **L-2 · Construcción** | 90 min | Producción activa. El docente circula por salas, entrena, no resuelve. Parejas con rotación de rol cada 20 min. | El docente **no toca el teclado del estudiante**. Pregunta, no dicta. |
| **L-3 · Validación y entrega** | 15 min | Ejecución de la batería: pruebas automatizadas, `axe`, Lighthouse, navegación por teclado. Entrega inicial al repositorio. | No se entrega nada que no pase la batería. Un laboratorio rojo se reintenta. |

**Cierre.** Enunciado explícito de la **Transferencia**: qué parte exacta del proyecto
propio se toca esta semana y con qué criterio de aceptación.

#### 4.4 · La Transferencia como columna vertebral

Es el mecanismo que convierte quince laboratorios sueltos en un emprendimiento real. Su
regla no admite excepción:

> **Lo que se aprende el domingo se aplica el domingo al proyecto propio, no a un
> ejercicio de juguete.**

El laboratorio usa un dominio neutro común para que el reto sea comparable entre
estudiantes y evaluable con la misma batería. La Transferencia lo traslada al dominio
real de cada persona. La diferencia entre ambos es el espacio donde ocurre la
transferencia de aprendizaje, y por eso se evalúa por separado (D3 §7).

### 5 · Secuenciación didáctica

#### 5.1 · La secuencia PRIMM-λ

| Fase | Minutos | Actividad |
|---|---|---|
| **P · Predecir** | 15 | Predicción escrita sobre código no ejecutado. |
| **R · Ejecutar** | 10 | Ejecución y contraste con la predicción. Se nombra la discrepancia. |
| **I · Investigar** | 20 | Trazado, anotación, identificación de la línea responsable, uso del depurador. |
| **M · Modificar** | 30 | Cambios dirigidos con objetivo declarado, de menor a mayor alcance. |
| **M · Crear** | 45 | Construcción propia del artefacto de la semana. |

#### 5.2 · Escalera de andamiaje y su desvanecimiento

| Nivel | Formato de la práctica | Nivel I | Nivel II | Nivel III |
|---|:---:|:---:|:---:|:---:|
| **A1** | Ejemplo resuelto completo, anotado | 35 % | 10 % | 0 % |
| **A2** | Ejemplo con huecos | 25 % | 20 % | 5 % |
| **A3** | Problema de Parsons con desvanecimiento | 20 % | 15 % | 5 % |
| **A4** | Problema con especificación y pruebas dadas | 15 % | 40 % | 40 % |
| **A5** | Problema abierto con especificación propia | 5 % | 15 % | 50 % |

La retirada del andamiaje es **una decisión con calendario**, no una consecuencia de que
el docente se canse de dar ejemplos. La columna del Nivel III con 50 % en A5 es lo que
hace que el trabajo final sea genuinamente del estudiante.

#### 5.3 · Entrelazado de los hilos

Los tres hilos del programa (interfaz y lógica, datos e IA, negocio) **no se enseñan en
bloques estancos**. El caso más deliberado es la **semana 5**: el sábado se estudia la
anatomía de un modelo de lenguaje y el domingo se construye un analizador de tokens en
JavaScript puro, sin asistencia. La teoría de la IA nunca ocupa un domingo entero,
porque una semana sin programar en un curso de quince produce decaimiento medible de una
destreza recién adquirida.

---

## PARTE III · LA INTELIGENCIA ARTIFICIAL EN EL APRENDIZAJE

### 6 · La Escalera de Uso de IA

#### 6.1 · Por qué existe

La evidencia disponible sobre modelos generativos y programadores novatos converge en un
hallazgo incómodo: **el efecto no es uniforme, es divergente**. El trabajo de Prather y
colaboradores (*The Widening Gap: The Benefits and Harms of Generative AI for Novice
Programmers*, ICER 2024) documenta que los estudiantes con buena regulación
metacognitiva mejoran su desempeño con asistencia generativa, mientras que los que
tienen dificultades metacognitivas resultan perjudicados: sobreestiman su desempeño y
terminan la tarea con **ilusión de competencia**. La literatura posterior ha nombrado el
fenómeno como *deuda epistémica* y ha documentado descarga cognitiva, pereza
metacognitiva y dependencia. Los estudios sobre asistentes en el editor sitúan la
aceptación de sugerencias por parte de novatos en un rango amplio, aproximadamente del
10 % al 53 %, lo que indica una relación con la herramienta muy poco regulada.

De ahí la posición del Instituto, que no es ni prohibicionista ni entusiasta:

> La IA es la herramienta central del oficio que enseñamos y por eso hay que enseñarla
> en serio. Enseñarla en serio significa que **el estudiante primero construye el
> criterio que le permitirá dirigir y juzgar la salida del modelo**, y sólo entonces se
> le entrega el modelo.

#### 6.2 · La escalera no restringe: habilita

De la formulación depende cómo se entiende el programa entero. El **Nivel I es de nivel
N0: cinco semanas sin ninguna asistencia de IA para producir código**. Eso no existe
para proteger al estudiante de la IA: existe para **cualificarlo** para usarla a fondo.

El perfil que este programa forma no es el de quien escribe código, sino el de quien
**especifica, dirige, audita y responde** por un sistema construido en gran parte por
agentes (D2 §3). Ese perfil exige exactamente tres cosas, y las tres se construyen antes
de abrir la herramienta:

| Lo que hace falta | Por qué no se puede delegar | Dónde se construye |
|---|---|---|
| **Leer código y detectar que está mal** | Quien no puede leerlo acepta cualquier cosa, y entonces no dirige: obedece. | Semanas 1 a 5, a nivel **N0** |
| **Saber cómo piensa el modelo** | Sin entender tokenización, ventana de contexto y alucinación, no se sabe cuándo desconfiar. | Semana 5 |
| **Decidir la estructura de datos** | Es la decisión de la que dependen todas las demás, y un agente la toma sin conocer el negocio. | Semana 8, a nivel **N0** |

#### 6.3 · Los cinco niveles

| Nivel | Nombre | Qué se permite | Qué se prohíbe | Declaración |
|:---:|---|---|---|:---:|
| **N0** | **Cerrado** | Nada. Sin asistentes, sin autocompletado, sin chat. | Toda herramienta generativa. | No aplica |
| **N1** | **Consulta conceptual** | Preguntar por conceptos, analogías, glosario. | Pedir código, pedir la solución, pegar el enunciado. | Obligatoria |
| **N2** | **Diagnóstico asistido** | Pegar un mensaje de error y pedir su **interpretación**. | Pedir el arreglo. La corrección la escribe la persona. | Obligatoria + traza |
| **N3** | **Dirección de agentes en el editor** | Encargar a un agente avanzado tareas de varios pasos sobre el propio repositorio: construir, refactorizar, documentar. **Es el nivel donde vive la mayor parte del trabajo del programa.** | Delegar la arquitectura, el modelo de datos o la regla de negocio. Aceptar una sola línea sin haberla leído. | Obligatoria + revisión |
| **N4** | **Delegación supervisada sobre sistemas reales** | Agentes que **actúan por sí mismos**: se ejecutan en el servidor, escriben en la base de datos, se comunican con terceros. | Desplegar sin auditar. Cualquier acción con efecto externo sin aprobación humana registrada. | Obligatoria + auditoría + carta de límites |

> ### Dónde está de verdad la frontera entre N3 y N4
>
> No está en si la herramienta se llama «agente». Casi todo asistente de programación es
> hoy agéntico, y fingir lo contrario sería enseñar una realidad que no existe. La
> frontera está en **qué puede tocar el agente sin que un humano lo apruebe**:
>
> - En **N3** el agente escribe **texto en un editor** que la persona lee, acepta o
>   rechaza antes de que exista. Su radio de acción es un archivo del repositorio y su
>   peor consecuencia es un mal *commit*, que se revierte.
> - En **N4** el agente **ejecuta acciones con efecto fuera del editor**: manda un
>   correo, cobra, modifica un documento en producción. Su peor consecuencia no se
>   revierte con `git`.

#### 6.4 · Progresión a lo largo del programa

| Bloque | Nivel máximo | Razón |
|---|:---:|---|
| **Nivel I · semanas 1–5** | **N0** | Cinco semanas sin ninguna asistencia. Es donde se construye el criterio. La IA se estudia como **objeto**, no se usa como herramienta. |
| **Nivel II · semanas 6–10** | **N3** | Dirección de agentes en el editor y bases de datos. Aquí vive la mayor parte del trabajo. |
| **Nivel III · semanas 11–15** | **N4** | Agentes que actúan sobre sistemas reales, con carta de límites y auditoría. |
| **Diseño del modelo de datos (semana 8)** | **N0** | Aunque ocurre en el Nivel II. Ver más abajo. |
| **Quices, Defensas de Autoría y defensa final** | **N0** | Siempre, sin excepción. |

**La excepción que sostiene el Nivel II.** Abrir el agente sería peligroso si con él se
pudiera delegar el diseño. Por eso la decisión estructural del programa, el **modelo de
datos**, se toma en papel, a nivel **N0**, y se defiende oralmente en la compuerta G2. La
regla operativa es breve: *la IA puede escribir código; no puede decidir la
arquitectura, el modelo de datos ni la regla de negocio.*

#### 6.5 · Los tres contrapesos

Permitir el uso sin contrapesos es delegar. El Instituto aplica tres, inseparables de la
Escalera:

1. **Declaración obligatoria** (`AI-USE.md`). Cada entrega incluye qué modelo se usó,
   para qué, qué prompts fueron decisivos, qué se aceptó, qué se rechazó y por qué.
   Declarar no penaliza; ocultar sí (Carta, art. 57).
2. **Defensa Aleatoria de Autoría** (D3 §10). Diez minutos, sin aviso, con cámara:
   explique este bloque, cambie este comportamiento en vivo, justifique esta decisión. Es
   el único mecanismo que discrimina de verdad entre comprender y obtener, y funciona
   igual si la fuente fue un compañero, un foro o un modelo.
3. **Guion metacognitivo obligatorio antes de invocar al modelo.** Antes de cada consulta
   de nivel N2 o superior, el estudiante escribe tres líneas: *qué creo que pasa*, *qué he
   probado*, *qué espero obtener*. Las intervenciones basadas en guiones metacognitivos
   son la vía más prometedora para mitigar la deuda epistémica.

> **El muro de carga.** Cuando la mayor parte del código la escribe un agente, el único
> mecanismo que separa a un arquitecto de alguien que no entiende su propio proyecto es
> la Defensa Aleatoria de Autoría. Si ese instrumento se relaja, el título de arquitecto
> queda hueco y el programa deja de ser defendible. Es, por diseño, lo último que puede
> negociarse.

#### 6.6 · Enseñar la IA como objeto de estudio

Además de usarla, el programa la estudia en la semana 5: anatomía de un modelo de
lenguaje, mecanismos de atención, tokenización y ventana de contexto, latencia y coste
de inferencia, sesgos, alucinación, límites de verificabilidad, y diferencia entre
familias propietarias y abiertas. Quien integra modelos en infraestructura de clientes
debe saber **cuándo el modelo no debe usarse**, y esa competencia no se adquiere
usándolo: se adquiere estudiándolo.

---

## PARTE IV · COMUNIDAD, MOTIVACIÓN Y PERMANENCIA

### 7 · Las tres presencias

El Instituto adopta el marco de **Comunidad de Indagación** de Garrison, Anderson y
Archer (2000):

| Presencia | Definición | Cómo se produce aquí |
|---|---|---|
| **Cognitiva** | Capacidad de construir significado mediante indagación sostenida. | El ciclo PRIMM-λ y la instrucción entre pares. |
| **Social** | Proyectarse como persona real ante los demás. | Aula de 10 a 15 personas, parejas rotativas semanales, revisión cruzada de proyectos, Demo Day público. Con ese tamaño el docente conoce el código de cada estudiante, que es la condición de todo lo demás. |
| **Docente** | Diseño, facilitación y dirección del proceso. | Syllabus público y congelado, retroalimentación en 7 días, presencia del docente circulando en los laboratorios. |

### 8 · Motivación y permanencia

#### 8.0 · El problema propio de un programa gratuito

La gratuidad elimina la barrera económica, que es su razón de ser, pero elimina también
el compromiso financiero, que en los programas de pago actúa como un ancla poco elegante
y bastante eficaz. Un programa gratuito debe construir otra, de forma deliberada.

| Ancla | Cómo opera |
|---|---|
| **Escasez y selección** | Diez plazas adjudicadas con rúbrica pública entre muchas solicitudes. Quien entra sabe que otra persona no entró. |
| **Compromiso explícito y firmado** | El Compromiso λ se firma con nombre y se lee en voz alta en la primera sesión. Es un contrato moral, no comercial. |
| **Visibilidad del propio avance** | El proyecto es suyo y crece cada domingo. Abandonar cuesta un producto propio, no una matrícula. |
| **Deuda con el grupo** | Con diez personas, la ausencia de una se nota en la misma sesión. |
| **Horizonte corto** | Son dieciséis semanas, no doce meses. El final es visible desde el primer día. |

Las metas de retención se fijan altas (D5 §26) precisamente porque la selección es
estricta y el grupo pequeño. Si aun así la retención cae, la conclusión no será que los
estudiantes fallaron: será que estas cinco anclas no bastan, y habrá que decirlo por
escrito (Carta, art. 18).

#### 8.1 · Protocolo de riesgo de abandono

Se activa cuando concurren **dos** de estas señales en una misma semana: ausencia sin
aviso, entrega no realizada, quiz por debajo de 50, o ausencia de actividad en el
repositorio durante 10 días.

| Momento | Acción | Responsable |
|---|---|---|
| **T+0** | Mensaje privado, no automatizado, sin tono de reproche. | Docente |
| **T+3 días** | Videollamada de 15 min. Se pregunta por circunstancias, no por rendimiento. | Docente |
| **T+7 días** | Plan de recuperación escrito con nuevas fechas y alcance reducido si procede. | Dirección Académica |
| **T+14 días** | Oferta formal de **traslado a la generación siguiente** sin coste ni demérito. | Secretaría |

El traslado es un resultado aceptable. El abandono silencioso no lo es. Con tres
generaciones al año, la siguiente empieza en pocas semanas, lo que convierte el traslado
en una opción real y no en una promesa vacía.

---

## PARTE V · ASEGURAMIENTO DE LA CALIDAD DOCENTE

### 9 · Instrumentos

| Instrumento | Frecuencia | Quién | Qué mide | Publicidad |
|---|---|---|---|---|
| **Encuesta de percepción λ** (12 ítems) | Semanas 8 y 16 | Estudiantes | Claridad, carga, utilidad de la retroalimentación, pertenencia | Agregada, pública |
| **Observación de aula por par** | 1 por generación | Docente par o tutor | Cumplimiento del guion de sesión (Anexo A) | Confidencial |
| **Auditoría de retroalimentación** | Mensual | Dirección Académica | Plazo de 7 días y presencia de los 3 campos | Agregada |
| **Analítica de aprendizaje** | Continua | Secretaría | Asistencia, entrega, reintentos, desplazamiento de voto en pares | Agregada, anonimizada |
| **Tasa de éxito por semana** | Continua | Dirección Académica | % que alcanza el criterio del laboratorio en primer intento | Pública |

**Umbral de intervención curricular.** Si en una semana **menos del 60 %** alcanza el
criterio en primer intento, esa semana se marca como **defectuosa por diseño**, no por
los estudiantes, y su rediseño es obligatorio antes de la generación siguiente. Con tres
generaciones al año, el ciclo de corrección es de cuatro meses en lugar de doce: es la
ventaja pedagógica más importante del calendario.

### 10 · Indicadores públicos

En cumplimiento del art. 18 de la Carta se publican cada año: postulaciones, admisiones,
retención, graduación, distribución de calificaciones, tasa de superación de la Auditoría
Técnica en primer intento y coste real del programa. La metodología de cálculo se publica
junto con las cifras y no cambia entre periodos sin nota explicativa.

---

## ANEXOS

### Anexo A · Guion de sesión del docente

**Sábado**

```text
□ ANTES DE ENTRAR
  □ Leer las predicciones del trabajo previo y anotar los 3 errores más frecuentes
  □ Preparar 2–3 preguntas conceptuales con distractores plausibles
  □ Desactivar todo asistente de IA en el editor de proyección
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

□ 00:15–01:45  CONSTRUCCIÓN
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
[Explicación con una analogía y un contraejemplo. Sin jerga sin definir.]

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
4. En el laboratorio produje trabajo propio la mayor parte del tiempo.
5. Cuando me atasqué, obtuve ayuda en un tiempo razonable.
6. La retroalimentación me dijo qué hacer distinto la próxima vez.
7. La carga de trabajo fue sostenible con mi vida laboral y familiar.
8. El horario de las sesiones me resulta viable.
9. Siento que formo parte de esta generación.
10. Entiendo cómo lo de esta semana avanza mi proyecto.
11. Usé la IA dentro del nivel permitido y entendí por qué ese nivel.
12. Recomendaría esta semana tal como está, sin cambios.

*Dos preguntas abiertas:* ¿qué debería mantenerse exactamente igual? ¿qué una sola cosa
cambiaría?

---

*Elysium λ Institute of Development & Research · D1 · «Abstrahere, aedificare, probare.»*




<div class="salto"></div>

# D2 · Plan de Estudios

<p class="doc-sub">Los 32 resultados de aprendizaje y su nivel de logro</p>
<p class="doc-file">Fichero: <code>ELYSIUM-INSTITUTE/D2-PLAN-DE-ESTUDIOS.md</code></p>

> **Cómo leer este documento.** Aquí está el **qué** se enseña, ordenado y trazable. La
> Parte I identifica el programa y sus perfiles. La Parte II declara los 32 resultados
> de aprendizaje con **su nivel de logro**, que es el contrato: nada se evalúa si no
> está aquí, y nada se certifica por encima del nivel que aquí se le asigna. La Parte
> III es el mapa de las dieciséis semanas y sus dependencias. La Parte IV justifica el
> conjunto tecnológico y lo enlaza con el estándar técnico de la empresa.
>
> Se subordina a la Carta (D0) y al Modelo Académico (D1). Se detalla en el syllabus (D4).

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
| **Duración** | **16 semanas** · tres niveles de cinco semanas + semana de defensa |
| **Preparación previa** | Módulo 0 asíncrono de unas 25 h (Carta, art. 42) |
| **Régimen** | Sábado y domingo, 2 h síncronas cada día · **15:00–17:00 UTC** |
| **Carga total** | **173 h** de trabajo del estudiante (§7) |
| **Equivalencia estimada** | 6 a 7 ECTS · descriptores de nivel 4 del MEC/EQF |
| **Generaciones por año** | **Tres** · enero–abril, mayo–agosto, septiembre–diciembre |
| **Aula** | Máximo 15 estudiantes · 10 como número ideal · una sola aula simultánea |
| **Coste para el estudiante** | **Ninguno** (Carta, art. 3) |
| **Credencial** | Certificado privado de formación profesional (Carta, art. 9) |
| **Requisito previo de programación** | Ninguno |

### 2 · Perfil de ingreso

Persona de 16 años o más, hispanohablante de nivel B2 o superior, con ordenador propio
y conexión estable, **sin experiencia previa exigida en programación**, que dispone de
ocho horas semanales sostenidas durante cuatro meses más unas 25 horas de preparación en
el Módulo 0, y que quiere **montar un emprendimiento digital propio**.

El programa está diseñado para tres situaciones:

- Quien trabaja de lunes a viernes y no puede abandonar su empleo para formarse.
- Quien vive fuera de los centros urbanos donde existe oferta presencial.
- Quien ya tiene un micronegocio y necesita construir su propia infraestructura en lugar
  de alquilarla.

### 3 · Perfil de egreso

> **Lo que este programa forma, dicho sin rodeos.** No forma programadores expertos.
> Forma **arquitectos de infraestructura digital asistida por IA**: personas capaces de
> **especificar, dirigir, auditar y responder** por un sistema construido en gran medida
> con agentes de inteligencia artificial, y de llevarlo al mercado.

Es un perfil profesional distinto del de desarrollador, y conviene no confundirlos. El
desarrollador escribe el código. El arquitecto **decide qué debe existir, con qué
estructura de datos, bajo qué restricciones, y comprueba que lo entregado las cumple**.

#### 3.1 · Las cuatro capacidades del egresado

| Capacidad | Qué significa en concreto |
|---|---|
| **Leer y juzgar** | Entiende el código que un agente le entrega lo suficiente para detectar cuándo está mal, cuándo es innecesariamente complejo y cuándo hace algo que nadie pidió. No lo escribe desde cero, pero **no lo acepta a ciegas**. |
| **Decidir la estructura** | Diseña el modelo de datos y las reglas de acceso **sin asistencia** (nivel N0), porque son las decisiones que un agente no puede tomar sin comprometer todo lo demás. |
| **Dirigir y auditar** | Especifica tareas a agentes avanzados, revisa lo devuelto línea a línea, declara qué aceptó y qué rechazó, y somete el resultado a umbrales objetivos de accesibilidad, rendimiento y seguridad. |
| **Lanzar** | Termina con la plataforma en producción, la marca, la presencia en redes, el cumplimiento legal básico y un modelo de negocio formulado y sometido a un experimento real. |

#### 3.2 · Qué sabe hacer, en términos verificables

1. Construye interfaces conformes a **WCAG 2.2 nivel AA** y lo comprueba con herramienta
   automática y con prueba manual de teclado y lector de pantalla.
2. **Lee, modifica y corrige** JavaScript ES6+ y explica en vivo qué hace cada bloque de
   su proyecto, sin asistencia de ningún tipo.
3. **Diseña** un modelo de datos documental y sus reglas de seguridad, y demuestra que
   funcionan con una batería de casos negativos.
4. **Dirige agentes de IA avanzados** en el editor, declarando por escrito cada
   aceptación y cada rechazo.
5. Despliega de forma continua con una **compuerta de calidad bloqueante**.
6. Formula un modelo de negocio, una identidad de marca y una presencia digital, y los
   sostiene ante un panel.
7. Cumple los requisitos básicos de **RGPD** y **Ley n.º 8968** para los datos que su
   plataforma trata.
8. Distingue con precisión qué domina y qué sólo conoce, porque su certificado lo declara
   (§5.9) y su defensa lo comprobó.

#### 3.3 · Lo que el egresado **no** es

No es desarrollador profesional contratable como tal. No escribe pruebas automatizadas
desde cero. No domina ningún marco de trabajo. No optimiza rendimiento a nivel experto.
No es asesor jurídico ni fiscal. **Ninguna pieza de difusión puede insinuar lo
contrario** (Carta, arts. 20 y 21).

### 4 · Referencia a marcos de competencias

El programa se describe, sin reclamar reconocimiento formal (Carta, art. 9), en términos
de los marcos siguientes:

| Marco | Uso en este plan |
|---|---|
| **MEC/EQF** | Los resultados se redactan con los descriptores de conocimientos, destrezas y responsabilidad del nivel 4. |
| **e-CF (EN 16234-1)** | Correspondencia con A.6 Diseño de aplicaciones, B.1 Desarrollo, B.3 Pruebas, D.11 Identificación de necesidades, E.8 Gestión de la seguridad de la información. |
| **DigComp 2.2** | Áreas 3 (creación de contenidos digitales) y 4 (seguridad), con el añadido explícito de alfabetización en IA. |
| **Microcredenciales UE** | Formato del certificado conforme a la Recomendación del Consejo de 16-VI-2022. |
| **EN 301 549 / Directiva (UE) 2019/882** | Norma técnica de referencia del hilo de accesibilidad. |

---

## PARTE II · RESULTADOS DE APRENDIZAJE

### 5 · Catálogo de los 32 resultados

Notación: `RA-<Dominio><n>`. **SOLO** indica el verbo cognitivo más alto exigido según la
taxonomía SOLO (M = multiestructural, R = relacional, A = abstracto ampliado).

#### Dominio A · Interfaz accesible y rendimiento

| Código | Resultado de aprendizaje | SOLO | Semanas |
|---|---|:---:|:---:|
| **RA-A1** | Construir documentos HTML5 semánticos cuyo árbol de accesibilidad refleje fielmente la estructura de la información, y justificar la elección de cada elemento frente a alternativas. | R | 1–2 |
| **RA-A2** | Aplicar CSS3 mediante un sistema de propiedades personalizadas, con cascada controlada y especificidad justificada, evitando la anulación por fuerza bruta. | R | 3 |
| **RA-A3** | Producir interfaces responsivas con enfoque *mobile-first* operables sin pérdida de contenido ni funcionalidad entre 320 px y 2560 px. | R | 3 |
| **RA-A4** | Verificar y corregir la conformidad WCAG 2.2 nivel AA combinando análisis automático, recorrido por teclado y prueba con lector de pantalla, y distinguir qué criterios la herramienta automática **no** puede detectar. | A | 2–12 |
| **RA-A5** | Diagnosticar y optimizar las métricas de Core Web Vitals hasta los umbrales de la Auditoría Técnica Elysium. | A | 12 |

#### Dominio B · Lógica, lenguaje y estructura de programas

| Código | Resultado de aprendizaje | SOLO | Semanas |
|---|---|:---:|:---:|
| **RA-B1** | Modelar información con los tipos primitivos y compuestos de JavaScript ES6+, y razonar correctamente sobre coerción, igualdad, alcance y mutabilidad. | R | 4 |
| **RA-B2** | Expresar algoritmos mediante control de flujo, iteración y funciones, y argumentar su corrección con casos límite antes de ejecutarlos. | R | 4 |
| **RA-B3** | Manipular el DOM y gestionar eventos con la API estándar de la plataforma, sin bibliotecas intermedias. | R | 5 |
| **RA-B4** | Programar operaciones asíncronas con promesas y `async`/`await`, y explicar el orden de ejecución resultante del bucle de eventos. | M | 7 |
| **RA-B5** | Ejecutar e interpretar una batería de pruebas automatizadas, y actuar sobre sus fallos. | M | 4–15 |
| **RA-B6** | Leer una traza de error, formular una hipótesis causal, y confirmarla o refutarla con el depurador antes de modificar una sola línea. | A | 6 |

#### Dominio C · Datos, servicios y despliegue

| Código | Resultado de aprendizaje | SOLO | Semanas |
|---|---|:---:|:---:|
| **RA-C1** | Consumir servicios HTTP con la Fetch API, gestionando de forma explícita los estados de carga, éxito, vacío y error. | R | 7 |
| **RA-C2** | Diseñar un modelo de datos documental **sin asistencia de IA**, justificando cada decisión de desnormalización en función de los patrones de consulta previstos. | A | 8 |
| **RA-C3** | Implementar en **Firebase Cloud Firestore** las operaciones de creación, lectura, actualización y borrado, incluida la sincronización en tiempo real. | R | 8–9 |
| **RA-C4** | Establecer despliegue continuo desde el repositorio con una compuerta de calidad que bloquee la publicación cuando los umbrales no se cumplen. | R | 10 |
| **RA-C5** | Implementar lógica de servidor en funciones sin servidor para aquello que, por seguridad o por coste, no puede residir en el cliente. | M | 11 |

#### Dominio D · Seguridad, privacidad y cumplimiento

| Código | Resultado de aprendizaje | SOLO | Semanas |
|---|---|:---:|:---:|
| **RA-D1** | Escribir reglas de seguridad de datos que denieguen por defecto, y demostrar su corrección con una batería de **casos negativos** que deben fallar. | A | 10 |
| **RA-D2** | Implementar autenticación y control de acceso basado en roles con **Firebase Authentication**, distinguiendo autenticación de autorización. | R | 10 |
| **RA-D3** | Aplicar las políticas de seguridad de la plataforma web (CSP, HSTS, control de orígenes) y explicar qué ataque previene cada una. | M | 12 |
| **RA-D4** | Diseñar el tratamiento de datos personales declarando base legal, minimización, plazo de retención y vía de ejercicio de derechos, conforme al RGPD y a la Ley n.º 8968. | M | 15 |

#### Dominio E · Inteligencia artificial

| Código | Resultado de aprendizaje | SOLO | Semanas |
|---|---|:---:|:---:|
| **RA-E1** | Explicar la anatomía funcional de un modelo de lenguaje grande: tokenización, mecanismo de atención, ventana de contexto y coste de inferencia. | R | 5 |
| **RA-E2** | Estimar de forma empírica el coste, la latencia y los límites de una integración concreta de modelo de lenguaje. | M | 5 |
| **RA-E3** | Detectar, documentar y mitigar alucinaciones y sesgos, y decidir de forma argumentada **cuándo no debe usarse** un modelo. | A | 5 |
| **RA-E4** | Dirigir agentes generativos en el editor en tareas de varios pasos, revisando y justificando por escrito cada aceptación y cada rechazo. | A | 6–12 |
| **RA-E5** | Diseñar y auditar un agente que **actúe sobre sistemas reales** desde el servidor, con supervisión humana registrada y carta de límites publicada. | M | 11 |

#### Dominio F · Ingeniería, proceso y calidad

| Código | Resultado de aprendizaje | SOLO | Semanas |
|---|---|:---:|:---:|
| **RA-F1** | Operar Git y GitHub con historial legible, versionado semántico Elysium y participación efectiva en revisión de código ajeno. | R | 1–10 |
| **RA-F2** | Someter un artefacto propio a la Auditoría Técnica Elysium, interpretar sus hallazgos y remediarlos en orden de severidad. | A | 12–15 |
| **RA-F3** | Escribir documentación técnica que permita a una persona ajena instalar, ejecutar y entender el proyecto sin preguntar nada al autor. | M | 15 |

#### Dominio G · Negocio, marca y comunicación

| Código | Resultado de aprendizaje | SOLO | Semanas |
|---|---|:---:|:---:|
| **RA-G1** | Formular una propuesta de valor y un modelo de negocio verificables, y someterlos a un experimento con criterio numérico de refutación. | A | 2, 13 |
| **RA-G2** | Producir identidad de marca, presencia en redes sociales y contenido de captación coherentes con la interfaz y con la promesa del negocio. | R | 14 |
| **RA-G3** | Identificar los requisitos legales y fiscales de la puesta en marcha en su propia jurisdicción. | M | 15 |
| **RA-G4** | Sostener una defensa técnica y una presentación comercial ante un panel, respondiendo a preguntas adversas sin perder rigor. | A | 16 |

### 5.9 · Clasificación por nivel de logro

> **Por qué existe esta tabla.** Los 32 resultados no se alcanzan todos a la misma
> profundidad en 128 horas. El art. 11 de la Carta prohíbe certificar lo que no se
> demostró, de modo que el certificado debe distinguir entre lo que la persona **dominó**
> y lo que sólo se le **introdujo**. Esta tabla es la fuente de esa distinción y se
> transcribe literalmente en el certificado.

**Dominado** significa: practicado varias semanas, evaluado con artefacto propio,
sometido a la Auditoría Técnica y defendible en la Defensa Aleatoria de Autoría.
**Introducido** significa: visto, practicado una vez con andamiaje, y **no certificado
como competencia**.

| Nivel de logro | Resultados de aprendizaje |
|---|---|
| **DOMINADO** (22) | RA-A1, RA-A2, RA-A3, RA-A4 · RA-B1, RA-B2, RA-B3, RA-B6 · RA-C1, RA-C2, RA-C3, RA-C4 · RA-D1, RA-D2 · RA-E1, RA-E3, RA-E4 · RA-F1, RA-F2 · RA-G1, RA-G2, RA-G4 |
| **INTRODUCIDO** (10) | RA-A5 · RA-B4 · RA-B5 · RA-C5 · RA-D3 · RA-D4 · RA-E2 · RA-E5 · RA-F3 · RA-G3 |

**Regla de honestidad en la difusión.** Ninguna pieza de comunicación puede enumerar un
resultado *introducido* sin esa etiqueta. Decir «aprenderás a escribir tus propias
pruebas automatizadas» sería falso: en dieciséis semanas se aprende a **ejecutarlas e
interpretarlas**, y eso es lo que se puede prometer.

### 6 · Matriz de alineamiento constructivo

Cada `RA` debe tener al menos una actividad y al menos un instrumento. Los números de
semana remiten al syllabus (D4).

| RA | Semanas | Instrumento que lo mide | Logro |
|---|:---:|---|:---:|
| RA-A1 | 1, 2 | Batería `axe` + revisión del árbol de accesibilidad | Dominado |
| RA-A2 | 3 | Revisión de código + prueba del sistema de tokens | Dominado |
| RA-A3 | 3 | Prueba de viewport a 320, 768, 1440 y 2560 px | Dominado |
| RA-A4 | 2, 5, 9, 12 | ATE-A: cero violaciones + recorrido manual con lector de pantalla | Dominado |
| RA-A5 | 12 | ATE-P (Lighthouse ≥ 95, LCP, CLS, INP) | Introducido |
| RA-B1, RA-B2 | 4 | Quices de Parsons + arnés de pruebas provisto · **todo a N0** | Dominado |
| RA-B3 | 5 | Validación accesible y renderizado dinámico · **a N0** | Dominado |
| RA-B4 | 7 | Prueba de orden de ejecución | Introducido |
| RA-B5 | 4–15 | Ejecución e interpretación de las pruebas provistas | Introducido |
| RA-B6 | 6 | **Bitácora de depuración con hipótesis previa** | Dominado |
| RA-C1 | 7 | Los cuatro estados de interfaz, anunciados | Dominado |
| RA-C2 | 8 | **Compuerta G2 con defensa oral a N0** | Dominado |
| RA-C3 | 8, 9 | Operaciones completas en Firestore + panel en tiempo real | Dominado |
| RA-C4 | 10 | Evidencia de publicación bloqueada y corregida | Dominado |
| RA-C5 | 11 | Función de servidor desplegada | Introducido |
| RA-D1 | 10 | **Batería de casos negativos: cero que pasen** | Dominado |
| RA-D2 | 10 | Prueba de acceso no autorizado desde consola | Dominado |
| RA-D3 | 12 | Cabeceras verificadas | Introducido |
| RA-D4 | 15 | Registro de actividades de tratamiento (ATE-C) | Introducido |
| RA-E1, RA-E3 | 5 | Quiz + informe de alucinaciones provocadas | Dominado |
| RA-E2 | 5 | Estimación de contexto y coste | Introducido |
| RA-E4 | 6–12 | Auditoría de `AI-USE.md` (rechazos justificados) + **DAA** | Dominado |
| RA-E5 | 11 | Carta de límites + cero envíos sin aprobación | Introducido |
| RA-F1 | 1, 10 | Historial de Git legible + revisión de pares | Dominado |
| RA-F2 | 12, 15 | Informe ATE con hallazgos remediados (**G3**, **G4**) | Dominado |
| RA-F3 | 15 | `README` ejecutable por un tercero + memoria | Introducido |
| RA-G1 | 2, 13 | **G1** + lienzo con experimento de criterio numérico | Dominado |
| RA-G2 | 14 | Manual de marca + perfiles + plan de contenido sostenible | Dominado |
| RA-G3 | 15 | Ficha de ruta de formalización con fuentes oficiales | Introducido |
| RA-G4 | 16 | Pitch en Demo Day + sustentación ante panel externo | Dominado |

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

Equivalencia: a razón de 25 a 30 horas de trabajo por crédito, 173 h corresponden a **6 o
7 ECTS estimados**, siempre como estimación de carga y nunca como crédito emitido
(Carta, art. 9.2).

> **Lectura correcta de esta tabla.** Las **cuatro horas de clase** son las dos filas
> superiores: es todo el tiempo que el Instituto imparte. Las otras cuatro las pone el
> estudiante y **no son opcionales**.

### 8 · Los tres niveles y los tres hilos

```text
              NIVEL I · sin IA        NIVEL II · agentes+datos   NIVEL III · cierre+negocio  DEFENSA
Semana:   01  02  03  04  05      |   06  07  08  09  10     |   11  12  13  14  15     |     16
──────────────────────────────────────────────────────────────────────────────────────────────────
α Interfaz    ████████████████░░░░░░░░░░░░░░░░████░░░░░░░░░░░░░░░░████░░░░░░░░░░░░░░       ██
  y lógica    A1  A2 A3  B1 B2 B3                                    A4 A5

β Datos       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████████████████████████░░░░░░░░░░░░░░       ██
  y agentes                             E4 B6 B4 C1 C2 C3 C4 D1 D2   C5 E5 D3

γ IA como     ░░░░░░░░░░░░░░░░████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░       ░░
  objeto                    E1 E2 E3

δ Negocio     ░░░░██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████████       ██
              G1 anteproyecto                                          G1 G2 G3 D4

ε TFG         ████████████████████████████████████████████████████████████████████████       ██
  (proyecto)  G1 en S02          G2 en S08          G3 en S12    G4 en S15    Hito H
```

**Regla de entrelazado.** Ningún hilo desaparece más de tres semanas seguidas. La
semana 5 mezcla DOM con anatomía de modelos de lenguaje, y la semana 15 concentra
cumplimiento, memoria y ensayo. Está declarado y es deliberado.

### 9 · Grafo de dependencias duras

Una dependencia dura significa que la semana destino es **inviable** sin la origen.

| Origen | → | Destino | Por qué |
|---|:---:|---|---|
| **Módulo 0** (lógica) | → | S04 (JavaScript) | Sin nociones previas de variable, condicional y bucle, la semana 4 es imposible al ritmo requerido. **Es la dependencia que sostiene todo el programa.** |
| S02 (semántica y formularios) | → | S09 (crear datos desde formulario) | Sin formulario accesible no hay entrada de datos. |
| S04 (lógica y funciones) | → | S05 (DOM y eventos) | Los eventos manipulan estructuras que hay que saber recorrer. |
| **S01–S05 a nivel N0** | → | S06 (dirección de agentes) | **La regla central del modelo.** Sin criterio construido sin asistencia, dirigir un agente es obedecerlo. |
| S05 (DOM) | → | S07 (renderizar respuestas) | Nada que pintar sin API del DOM. |
| S07 (asincronía) | → | S08 (Firestore) | `await` sin bucle de eventos entendido produce culto a la carga. |
| S08 (modelado, N0) | → | S09 (operaciones sobre datos) | Se modela en papel antes de crear colecciones. |
| S09 (operaciones completas) | → | S10 (reglas y autenticación) | No se escriben reglas sobre operaciones que no existen. |
| S12 (congelación del producto) | → | S13–S15 (negocio y cumplimiento) | El expediente legal describe la plataforma real; si el código sigue cambiando, la descripción es falsa. |
| S02 (**G1 aprobada**) | → | Toda Transferencia posterior | Sin proyecto definido no hay destino para la transferencia. |

### 10 · Compuertas

| Código | Compuerta | Semana | Qué se entrega | Efecto |
|---|---|:---:|---|---|
| **G1** | Carta de Anteproyecto | **02** | Nicho, cliente, problema, propuesta de valor | Bloquea toda Transferencia posterior |
| **G2** | Modelo de datos | **08** | Esquema documental con sus consultas · **defensa oral a N0** | Bloquea la compuerta G3 |
| **G3** | Auditoría Técnica del producto | **12** | ATE-A, ATE-P, ATE-S, ATE-Q, ATE-D sin hallazgos críticos · **congelación de funcionalidad** | Bloquea G4 |
| **G4** | Cumplimiento y memoria | **15** | ATE-C completo, expediente legal y memoria técnica | Bloquea la defensa |
| **H** | **Demo Day y sustentación** | **16** | Emprendimiento digital + pitch + defensa de autoría final | Graduación |

Los cierres de nivel de las semanas 5 y 10 **no son compuertas**: son puntos de control
formativos que producen retroalimentación y activan el protocolo de riesgo de abandono si
procede (D1 §8.1).

---

## PARTE IV · TECNOLOGÍA Y CANON TÉCNICO

### 11 · Conjunto tecnológico y su justificación

| Capa | Elección | Por qué esta y no otra |
|---|---|---|
| **Estructura** | HTML5 semántico | Es la capa de accesibilidad. No hay atajo. |
| **Presentación** | CSS3 con propiedades personalizadas, Flexbox y Grid | Sin preprocesador ni marco de utilidades: se enseña la cascada, no a esquivarla. |
| **Lógica** | JavaScript ES6+ estándar | Un marco resuelve problemas que el novato aún no tiene. Se aprende la plataforma. |
| **Entorno** | GitHub Codespaces | Elimina la desigualdad de máquinas y de conectividad. Es la decisión que hace viable la equidad del art. 16. |
| **Control de versiones** | Git y GitHub | Estándar del oficio y sustrato de la evaluación por artefacto. |
| **Pruebas** | Vitest (provistas al estudiante) | Ejecutables en Codespaces y en la compuerta de integración continua. |
| **Datos** | **Firebase Cloud Firestore** | Capa gratuita suficiente, sincronización en tiempo real, y reglas de seguridad declarativas que **enseñan** el modelo de amenaza mejor que un ORM. |
| **Identidad** | **Firebase Authentication** | Permite estudiar sesiones y testigos sin construir criptografía. |
| **Servidor** | **Firebase Cloud Functions** (Node.js) | Frontera cliente/servidor explícita, que es el concepto a enseñar. |
| **Despliegue** | Firebase Hosting o Cloudflare Pages con acción de integración continua | Compuerta de calidad bloqueante desde la semana 10. |
| **Auditoría** | `axe-core`, Lighthouse CI | Umbrales objetivos, reproducibles y públicos. |
| **Agentes de IA** | Herramientas de agente en el editor y en la terminal | Se evita atar el currículo a un proveedor. Lo que se enseña es el criterio de dirección y auditoría, no el producto. |

**Regla de sustituibilidad.** Ninguna elección es doctrinal. Si un proveedor cambia sus
condiciones o desaparece, se sustituye sin tocar los resultados de aprendizaje, porque
los `RA` están redactados sobre conceptos y no sobre productos, con la única excepción
declarada de Firebase, que se nombra por ser el conjunto que el estudiante encontrará en
el estándar técnico de la empresa (§12).

### 12 · Correspondencia con el estándar técnico de la empresa

El Instituto enseña, en versión reducida y dirigida a agentes, el mismo catálogo de
funciones que Elysium λ implementa en producción (`ELYSIUM-STANDARDS.md`, Parte II). El
estudiante no recibe el código del núcleo: lo **especifica y lo dirige**, y al hacerlo
entiende por qué el estándar es como es.

| Función del estándar | Semana | Alcance en el Instituto |
|---|:---:|---|
| **F05** Information System | 2 | Completo |
| **F02** Header Mobile-First | 3 | Completo |
| **F13** Dynamic Theme · **F14** Theme Switcher | 3 | Completo |
| **F03** Scroll Reveal · **F04** Anchor Glide | 3 | Versión reducida |
| **F01** Loading Page · **F10** Elysium Signature | 3 | Versión propia del estudiante |
| **F18** Personalized CRM · **F25** Client Records | 9 | Versión reducida |
| **F07** Security Core | 10, 12 | Completo |
| **F23** Clean URLs · **F06** System Update | 10 | Conceptual + versionado |
| **F24** Smart Booking | 11 | Versión reducida |
| **F26** Online Payments | 11 | Sólo si el arquetipo lo requiere, en modo de prueba |
| **F19** Discovery Core · **F20** SEO | 14 | Completo |
| **F08** Cookies Management | 15 | Completo |
| **F15** Multi-language · **F16** Multi-Currency · **F17** Web App Downloader · **F22** System Settings · **F27** Occupancy Reports | — | **Fuera de alcance**, y así se declara |
| **F11** Efectos de Temporada · **F12** Magic Mouse | — | **Excluidas.** Reservadas a código de producción de la empresa. |

**Advertencia de propiedad.** El kit `elysium-core/` y su código no se distribuyen a los
estudiantes. Lo que comparte el Instituto es la **especificación funcional** y los
criterios de aceptación, no la implementación propietaria. El trabajo del estudiante es
suyo (Carta, art. 60) y no incorpora código de la empresa.

### 13 · Riesgos curriculares reconocidos

| Riesgo | Prob. | Mitigación |
|---|:---:|---|
| El Módulo 0 no se completa y la semana 4 resulta inabordable. | **Alta** | Punto de control con 20 ejercicios; sesión opcional a mitad del módulo; opción de aplazarse a la generación siguiente, que empieza en pocas semanas. |
| El agente en el editor (N3) erosiona la autoría desde la semana 6. | **Alta** | Cinco semanas previas a N0; `AI-USE.md` con apartado de rechazos; **cuatro DAA**; G2 a nivel N0 con defensa oral. |
| Dispersión de proyectos: hasta 15 dominios distintos que asesorar. | Media | Laboratorio con dominio neutro común; sólo la Transferencia es individual; catálogo de cinco arquetipos en G1. |
| El bloque de emprendimiento se percibe como relleno frente al técnico. | Media | Ocupa tres de las quince semanas y pesa en la rúbrica del hito; el experimento de la semana 13 exige criterio numérico de refutación. |
| **Tres generaciones al año agotan al profesorado.** | **Alta** | Tutores pares reclutados entre graduados (Carta, art. 40); materiales escritos una vez y reutilizados tres veces al año; receso obligatorio entre generaciones. Ver D5 §20. |
| Dependencia de Firebase. | Media | Regla de sustituibilidad (§11); los `RA` describen conceptos. |

### 14 · Bibliografía de fundamentación

**Diseño instruccional**

- van Alten, D., Phielix, C., Janssen, J., Kester, L. (2019). *Effects of flipping the
  classroom on learning outcomes and satisfaction: A meta-analysis*. Educational Research
  Review, 28.
- Dunlosky, J., Rawson, K., Marsh, E., Nathan, M., Willingham, D. (2013). *Improving
  Students' Learning With Effective Learning Techniques*. PSPI, 14(1).
- Roediger, H., Karpicke, J. (2006). *Test-Enhanced Learning*.
- Collins, A., Brown, J. S., Newman, S. (1989). *Cognitive Apprenticeship*.
- Biggs, J. *Teaching for Quality Learning at University*.
- Hattie, J., Timperley, H. (2007). *The Power of Feedback*.
- Nicol, D., Macfarlane-Dick, D. (2006). *Formative assessment and self-regulated learning*.
- Garrison, D. R., Anderson, T., Archer, W. (2000). *Critical Inquiry in a Text-Based Environment*.
- van Merriënboer, J., Kirschner, P. *Ten Steps to Complex Learning* (4C/ID).
- Kalyuga, S. y cols. (2003). *The Expertise Reversal Effect*.
- Kapur, M. *Productive Failure*.
- Bloom, B. (1984). *The 2 Sigma Problem*, con la reserva del D1 §2.9.

**Educación en programación**

- Sentance, S., Waite, J. *Teaching computer programming with PRIMM*.
- ITiCSE 2022 Working Group. *Parsons Problems and Beyond*.
- Weinman, N., Fox, A., Hearst, M. (2021). *Improving Instruction of Programming Patterns
  with Faded Parsons Problems*. CHI.
- Porter, L., Bailey Lee, B., Simon, B. *Peer Instruction in Computing*.

**Inteligencia artificial generativa y aprendizaje**

- Prather, J. y cols. (2024). *The Widening Gap: The Benefits and Harms of Generative AI
  for Novice Programmers*. ICER.
- Tankelevitch, L. y cols. *The Metacognitive Demands and Opportunities of Generative AI*.
- Literatura sobre deuda epistémica y guiones metacognitivos en programación asistida
  (revisión actualizada en el D6 §3).

**Marco normativo**

- Directiva (UE) 2019/882, aplicable desde el 28-VI-2025.
- EN 301 549; W3C, *Web Content Accessibility Guidelines 2.2*.
- Reglamento (UE) 2016/679; Lei n.º 58/2019 (Portugal); Ley n.º 8968 (Costa Rica).
- Recomendación del Consejo de la UE de 16-VI-2022 sobre microcredenciales.

---

*Elysium λ Institute of Development & Research · D2 · «Abstrahere, aedificare, probare.»*




<div class="salto"></div>

# D3 · Reglamento de Evaluación

<p class="doc-sub">Instrumentos, rúbricas y umbrales objetivos</p>
<p class="doc-file">Fichero: <code>ELYSIUM-INSTITUTE/D3-REGLAMENTO-DE-EVALUACION.md</code></p>

> **Cómo leer este documento.** Aquí está el **cómo se mide** lo que el D2 promete. La
> Parte I fija los principios y la aritmética de la nota. La Parte II describe cada
> instrumento con su rúbrica. La Parte III contiene los dos mecanismos que distinguen al
> Instituto: la Defensa Aleatoria de Autoría y la Auditoría Técnica Elysium, ambos con
> umbrales objetivos y públicos. La Parte IV regula plazos, reintentos y recursos.
>
> **Regla de publicidad anticipada.** Ninguna rúbrica, umbral o criterio puede aplicarse
> a una actividad si no estaba publicado **antes** de que la actividad comenzara. Un
> criterio retroactivo es nulo (Carta, art. 33).

---

## PARTE I · ARQUITECTURA DE LA EVALUACIÓN

### 1 · Los siete principios

1. **Se evalúan artefactos, no declaraciones** (Carta, art. 11). Todo instrumento
   produce un objeto inspeccionable por un tercero.
2. **Se evalúa la autoría, no sólo el resultado** (Carta, art. 12). Un artefacto
   excelente que su autor no puede explicar vale cero.
3. **La evaluación es formativa por defecto y sumativa por excepción.**
4. **Los umbrales técnicos son objetivos.** Accesibilidad, rendimiento y seguridad se
   miden con herramienta, no con opinión. La opinión se reserva para lo que la
   herramienta no puede ver.
5. **No hay curva ni cupo.** Si las diez personas del aula cumplen el criterio, las diez
   aprueban.
6. **Todo lo que pesa, se practica antes sin que pese.** Ningún formato aparece por
   primera vez en una evaluación sumativa.
7. **La retroalimentación llega a tiempo de ser usada**, o no es retroalimentación
   (D1 §2.11).

### 2 · Composición de la nota

| Componente | Peso | Qué agrupa | Reintento |
|---|:---:|---|:---:|
| **A · Evaluación continua** | **40 %** | Quices de recuperación (15 %) + laboratorios dominicales (25 %) | Sí |
| **B · Avance del proyecto** | **30 %** | Transferencias semanales (12 %) + compuertas G1 a G4 (18 %) | Sí |
| **C · Hito final y sustentación** | **30 %** | Entrega **H** de la semana 16: producto, memoria, Demo Day y sustentación | Una vez |

El programa es una unidad de dieciséis semanas, de modo que **la nota del programa es la
nota final**. Los cierres de nivel de las semanas 5 y 10 **no llevan nota propia**: son
puntos de control formativos.

**No existe componente de investigación.** El plan de estudios no contiene actividad
investigadora evaluable (Carta, art. 53).

#### 2.1 · Requisitos de aprobación (todos, no algunos)

| # | Requisito | Umbral |
|---|---|---|
| 1 | Nota final | ≥ **70** |
| 2 | Nota del componente **C** | ≥ **70** |
| 3 | Asistencia síncrona, incluida la diferida | ≥ **80 %** |
| 4 | Defensa Aleatoria de Autoría | **Superada** en todas las convocatorias |
| 5 | Auditoría Técnica Elysium (G3 y G4) | **Sin hallazgos críticos** |
| 6 | Declaración `AI-USE.md` en todas las entregas | **Completa y veraz** |
| 7 | Expediente de integridad académica | **Sin falta grave firme** |

Los requisitos 4 a 7 son de tipo **apto / no apto**: no promedian, no compensan y no se
negocian. Un componente A brillante no rescata una defensa de autoría fallida.

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

La conversión es **orientativa** y no constituye equivalencia oficial (Carta, art. 9).

#### 3.1 · Menciones de graduación

| Mención | Requisito |
|---|---|
| **Cum laude λ** | Nota final ≥ 90 y ninguna compuerta reintentada. |
| **Mención de Accesibilidad** | Todas las auditorías ATE-A superadas en primer intento. |
| **Mención de Ingeniería** | Cero hallazgos mayores en la Auditoría Técnica final y las cuatro defensas de autoría superadas sin reservas. |
| **Mención de Emprendimiento** | Experimento de validación de la semana 13 ejecutado con datos reales y modelo de negocio revisado en consecuencia. |

Las menciones habilitan para ser convocado como **tutor par** en generaciones posteriores
(Carta, art. 40).

---

## PARTE II · LOS INSTRUMENTOS

### 4 · Catálogo

| Cód. | Instrumento | Frecuencia | Peso | Naturaleza | Nivel IA |
|---|---|---|:---:|---|:---:|
| **Q** | Quiz de recuperación | Semanal (sábado) | 15 % | Formativo con nota | **N0** |
| **L** | Laboratorio dominical | Semanal (domingo) | 25 % | Formativo con nota | Según semana |
| **T** | Transferencia al proyecto | Semanal (domingo) | 12 % | Formativo con nota | Según semana |
| **G** | Compuerta de proyecto | 4: semanas 2, 8, 12 y 15 | 18 % | Sumativo, bloqueante | Según fase |
| **H** | Hito final y sustentación | 1: semana 16 | 30 % | Sumativo | **N0** |
| **DAA** | Defensa Aleatoria de Autoría | 4: semanas 4, 9, 12 y 16 | Apto/no apto | Sumativo, bloqueante | **N0** |
| **ATE** | Auditoría Técnica Elysium | Compuertas G3 y G4 | Apto/no apto | Sumativo, bloqueante | N/A |

### 5 · Quiz de recuperación (Q) · 15 %

**Cuándo.** Ventana asíncrona desde el cierre del sábado hasta las 23:59 UTC del mismo
día. Duración máxima **20 minutos** desde la apertura.

**Diseño.** Ocho ítems:

| Ítems | Tipo | Origen |
|:---:|---|---|
| 3 | Predicción de salida o identificación del error | Concepto de la semana |
| 2 | Problema de Parsons con desvanecimiento | Concepto de la semana |
| **3** | **Recuperación espaciada** | Semanas **n−1**, **n−3** y **n−6** |

Los ítems de predicción y de Parsons miden comprensión estructural sin coste sintáctico
(D1 §2.5). Los tres espaciados implementan la práctica distribuida (D1 §2.2). En las seis
primeras semanas se usan los ítems espaciados disponibles y el resto se completa con
ítems de la semana en curso.

**Reglas.** Nivel de IA **N0**, sin excepción. Se computan las **doce mejores de las
quince** notas: tres semanas malas por enfermedad, trabajo o vida no arruinan el
componente. No hay reintento de un quiz concreto, porque el descarte de las tres peores
ya cumple esa función.

### 6 · Laboratorio dominical (L) · 25 %

**Entrega.** Al repositorio del laboratorio, antes de las 23:59 UTC del martes siguiente.

| Parte | Peso del laboratorio | Cómo se mide |
|---|:---:|---|
| **Corrección funcional** | 60 % | Batería de pruebas automatizadas provista. Binaria por prueba. |
| **Calidad de ingeniería** | 40 % | Rúbrica L (§6.2), evaluada por el docente o por tutor par formado. |

#### 6.1 · Arnés de pruebas

Cada laboratorio se entrega con su especificación de pruebas ya escrita (`spec/`). El
estudiante ejecuta `npm test` y ve exactamente qué falta.

**En dieciséis semanas no se llega a escribir pruebas propias.** `RA-B5` queda
clasificado como **introducido** (D2 §5.9): el estudiante aprende a ejecutarlas, leerlas e
interpretar sus fallos, que es mucho, pero no a diseñarlas desde cero. El certificado lo
dice así y la difusión también debe decirlo así.

> **Consecuencia deliberada.** Un laboratorio con todas las pruebas en verde garantiza 60
> de 100. Nunca 100. La diferencia entre funcionar y estar bien hecho es exactamente el
> 40 % restante, y esa diferencia es el oficio.

#### 6.2 · Rúbrica L · calidad de ingeniería

| Criterio | Insuficiente (0–69) | Suficiente (70–79) | Notable (80–89) | Excelente (90–100) |
|---|---|---|---|---|
| **Accesibilidad** | Hay violaciones automáticas serias, o el recorrido por teclado se rompe. | Sin violaciones automáticas; teclado funcional. | Además: foco visible y orden lógico; textos alternativos con significado. | Además: verificado con lector de pantalla y documentada una decisión de accesibilidad no trivial. |
| **Legibilidad** | Nombres opacos, funciones de más de 50 líneas, código muerto. | Nombres en inglés y descriptivos; funciones acotadas. | Además: responsabilidad única por función; sin comentarios que repitan el código. | Además: el código se lee sin comentarios y los que hay explican **por qué**, no qué. |
| **Robustez** | No contempla el caso vacío ni el de error. | Contempla el caso vacío. | Contempla vacío, error y límite. | Además: los estados de error son visibles y accionables para la persona usuaria. |
| **Historial de Git** | Un solo *commit* «final» o mensajes sin sentido. | Varios *commits* con mensajes comprensibles. | Además: formato Elysium de mensaje y versión declarada. | Además: el historial narra la construcción y permite revertir cualquier paso. |
| **Declaración de IA** | Ausente o falsa → falta I-02. | Presente y veraz. | Además: consigna qué se rechazó y por qué. | Además: incluye el guion metacognitivo previo a cada consulta. |

### 7 · Transferencia (T) · 12 %

Aplicación de lo aprendido al proyecto propio, entregada al repositorio personal antes de
las 23:59 UTC del miércoles.

| Nivel | Nota | Criterio |
|---|:---:|---|
| **Transferida** | 100 | El concepto está aplicado al dominio propio, adaptado, y funciona. |
| **Trasplantada** | 75 | El código del laboratorio está copiado con cambios cosméticos. |
| **No entregada** | 0 | Sin avance en el repositorio personal esa semana. |

La distinción entre *transferida* y *trasplantada* es el indicador más temprano de que un
estudiante está imitando en lugar de comprender, y por eso dispara prioridad en la
selección para la Defensa Aleatoria de Autoría (§10.3).

### 8 · Compuertas (G) · 18 %

| Compuerta | Semana | Peso | Rúbrica |
|---|:---:|:---:|---|
| **G1 · Carta de Anteproyecto** | 2 | 4 % | D7 §11.1 |
| **G2 · Modelo de datos** (defensa oral a N0) | 8 | 6 % | D7 §11.2 |
| **G3 · Auditoría Técnica del producto** | 12 | 5 % | §11 de este documento |
| **G4 · Cumplimiento y memoria** | 15 | 3 % | D7 §11.4 |

Son **bloqueantes**: no se avanza con la anterior no aprobada, ni se compensa con otras
notas.

### 9 · Hito final (H) · 30 %

| Elemento | Peso del hito |
|---|:---:|
| Auditoría Técnica superada sin hallazgos críticos (G3 y G4) | Requisito previo |
| Producto: emprendimiento digital completo y en producción | 35 % |
| Memoria técnica (D7 §14) | 25 % |
| Sustentación técnica ante panel con auditor externo | 25 % |
| Pitch en el Demo Day | 15 % |

Se realiza con **cámara obligatoria** (Carta, art. 64.2) y sin asistencia de IA.

---

## PARTE III · LOS DOS MECANISMOS DISTINTIVOS

### 10 · Defensa Aleatoria de Autoría (DAA)

#### 10.1 · Qué es y por qué existe

Diez minutos, sin aviso previo, en los que el estudiante explica y modifica en vivo su
propio código. Es el único mecanismo que discrimina de forma fiable entre haber
comprendido y haber obtenido. Funciona igual si la fuente fue un compañero, un foro, un
tutorial o un agente, y por eso **sustituye por completo a la vigilancia algorítmica de
exámenes**, que el Instituto prohíbe (Carta, art. 64.3).

> **Es el muro de carga del modelo.** Cuando la mayor parte del código la escribe un
> agente, este instrumento es lo único que separa a un arquitecto de alguien que no
> entiende su propio proyecto. Si se relaja, el certificado deja de significar nada.

#### 10.2 · Protocolo

| Fase | Duración | Contenido |
|---|:---:|---|
| **1 · Localización** | 1 min | El evaluador señala un bloque de 10–30 líneas de una entrega reciente. |
| **2 · Explicación** | 3 min | «Explíqueme qué hace esto y por qué está así.» |
| **3 · Modificación en vivo** | 4 min | «Cambie el comportamiento para que ahora haga ___.» Pantalla compartida, sin asistentes. |
| **4 · Justificación** | 2 min | «¿Qué alternativa descartó y por qué?» |

#### 10.3 · Calendario y selección

| Convocatoria | Semana | Qué examina |
|---|:---:|---|
| **DAA-1** | 4 | Código escrito **sin ninguna asistencia** (Nivel I, N0) |
| **DAA-2** | 9 | Código construido **dirigiendo agentes** (Nivel II, N3). **Es la más importante de las cuatro.** |
| **DAA-3** | 12 | El producto congelado, completo |
| **DAA-final** | 16 | Dentro de la sustentación, a N0 estricto |

El orden dentro de cada convocatoria no es puramente aleatorio: es **aleatorio
estratificado**, y el estrato se declara en público para que nadie lo interprete como
sospecha personal.

| Estrato | Probabilidad relativa de ser el primero |
|---|:---:|
| Todos los estudiantes (base) | 1× |
| Entrega marcada como *trasplantada* en la Transferencia (§7) | 3× |
| Salto anómalo de calidad entre entregas consecutivas | 3× |
| Discrepancia entre nota de quiz (N0) y nota de laboratorio | 3× |
| Ausencia o pobreza de la declaración `AI-USE.md` | 2× |

**Todos los estudiantes pasan por las cuatro convocatorias.** El estrato sólo determina
el orden y la profundidad del examen. Con un aula de diez, las cuarenta comparecencias
del programa suman unas siete horas.

#### 10.4 · Resultado

| Resultado | Efecto |
|---|---|
| **Superada** | Se registra y no afecta a la nota. |
| **Superada con reservas** | Se registra, se acuerda un plan de refuerzo y se reconvoca en 3 semanas. |
| **No superada** | La entrega examinada pasa a 0. Segunda convocatoria en 7 días sobre otra entrega. |
| **No superada dos veces** | Expediente por falta I-01 o I-02 (Carta, art. 56). |

**Garantía.** No superar una DAA por nervios, por fallo de conexión o por una
circunstancia acreditada no produce efecto alguno: se repone. El instrumento existe para
detectar ausencia de comprensión, no para castigar la ansiedad.

### 11 · Auditoría Técnica Elysium (ATE)

#### 11.1 · Naturaleza

Batería de comprobaciones **objetivas, reproducibles y públicas** que se ejecutan sobre
el artefacto desplegado. Cualquier persona con la URL debe poder reproducir el resultado.
La ATE no opina: mide. Se ejecuta de forma automatizada mediante la acción de integración
continua del estándar de la empresa (`ELYSIUM-STANDARDS.md`, §6), más las comprobaciones
manuales que ninguna herramienta puede sustituir.

**Cuándo.** Los bloques A, P, S, Q y D en la compuerta **G3** (semana 12); el bloque C en
la compuerta **G4** (semana 15).

#### 11.2 · Los seis bloques y sus umbrales

**ATE-A · Accesibilidad** *(referencia: WCAG 2.2 AA, EN 301 549)*

| # | Comprobación | Umbral | Severidad |
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

**ATE-S · Seguridad**

| # | Comprobación | Umbral | Severidad |
|---|---|---|:---:|
| S1 | Ningún secreto ni credencial en el historial del repositorio | 0 | **Crítica** |
| S2 | Reglas de Firestore con denegación por defecto | Verificado | Crítica |
| S3 | Batería de **casos negativos** de acceso: todos rechazados | 100 % | Crítica |
| S4 | Content Security Policy sin `unsafe-inline` en scripts | Cumplido | Mayor |
| S5 | HSTS activo y HTTPS forzado | Cumplido | Mayor |
| S6 | Dependencias sin vulnerabilidades de severidad alta o crítica | 0 | Mayor |

**ATE-C · Cumplimiento** *(compuerta G4, semana 15)*

| # | Comprobación | Severidad |
|---|---|:---:|
| C1 | Aviso legal identificando al responsable | Crítica |
| C2 | Política de privacidad con base legal, finalidad, plazo y vía de ejercicio de derechos | Crítica |
| C3 | Gestión de consentimiento previa a toda cookie no esencial | Crítica |
| C4 | Términos y condiciones coherentes con lo que la plataforma hace | Mayor |
| C5 | Registro de actividades de tratamiento del proyecto | Mayor |

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
| **Crítica** | Bloquea la compuerta. Se remedia y se vuelve a auditar. Sin excepciones. |
| **Mayor** | Resta 5 puntos de la nota del hito por hallazgo, hasta un máximo de 20. |
| **Menor** | Se anota en el informe. No resta. Debe estar remediada en la compuerta siguiente. |

#### 11.4 · Informe

La ATE produce un informe con: fecha, `commit` auditado, URL, versión de cada
herramienta, resultado por comprobación, capturas y hallazgos ordenados por severidad con
acción concreta de remedio. Es el modelo del informe que el egresado ejecutará en la vida
profesional para clientes reales.

---

## PARTE IV · PLAZOS, REINTENTOS Y RECURSOS

### 12 · Calendario semanal de entregas (horas UTC)

| Día | Hora | Qué vence |
|---|---|---|
| Viernes | 12:00 | *Antes* del sábado completado |
| Sábado | 23:59 | Quiz de recuperación de la semana |
| Domingo | 17:00 | Entrega inicial del laboratorio en sesión |
| Martes | 23:59 | Entrega definitiva del laboratorio |
| Miércoles | 23:59 | Transferencia al proyecto propio |
| Jueves | 23:59 | Revisión de código de un par asignado |

### 13 · Entregas fuera de plazo

| Retraso | Efecto |
|---|---|
| Hasta 24 h | Techo de calificación **85** |
| De 24 a 72 h | Techo de calificación **70** |
| Más de 72 h | **0**, con derecho a reintento por dominio (§14) |

**Fondo de gracia.** Cada estudiante dispone de **tres prórrogas de 72 h** en todo el
programa, que se activan avisando **antes** del vencimiento y sin necesidad de justificar
el motivo. Avisar antes es una competencia profesional y el Instituto la premia;
desaparecer no lo es.

**Circunstancias graves.** Enfermedad, duelo, catástrofe natural, corte prolongado de
servicios o violencia doméstica suspenden todos los plazos previa comunicación a la
Secretaría, que no exige detalle alguno sobre la naturaleza del hecho.

### 14 · Reintento por dominio

| Intento | Techo de calificación | Plazo |
|:---:|:---:|---|
| 1.º | 100 | Plazo ordinario |
| 2.º | 85 | 7 días desde la retroalimentación |
| 3.º | 70 | 14 días desde la retroalimentación |
| 4.º | — | No existe |

Aplica a **Q** (por descarte de las tres peores), **L**, **T** y **G**. No aplica al hito
**H**, que admite una única repetición extraordinaria autorizada por el Consejo Académico.

**Fecha límite dura.** Ningún reintento se acepta después del **domingo de la semana 15**.
La semana 16 es de Demo Day y sustentación, y no admite entregas.

### 15 · Revisión y recurso

Conforme al art. 49 de la Carta: solicitud razonada en 5 días, respuesta escrita del
docente en 5 días, recurso ante el Consejo Académico en 15 días. El recurso puede
confirmar, subir o **bajar** la nota, y así se advierte al recurrente antes de admitirlo a
trámite.

### 16 · Evaluación entre pares

Cada jueves, cada estudiante revisa el laboratorio de un par asignado por rotación
determinista. La revisión usa la rúbrica L (§6.2) y **no genera nota para el revisado**:
genera nota para el **revisor**, dentro del componente A, medida por la utilidad y la
precisión de sus observaciones.

**Regla de rotación en aula pequeña.** Con diez a quince personas y quince semanas, la
repetición de pareja es inevitable y no es un defecto:

1. Se agota **primero** la lista completa de compañeros distintos antes de repetir a nadie.
2. Agotada la vuelta, se inicia una segunda con desplazamiento distinto, de modo que la
   segunda pareja de cada persona no coincida con la primera.
3. **Nadie revisa a la misma persona dos semanas consecutivas**, ni revisa a quien lo
   revisó la semana anterior.
4. La reincidencia es **deseable**: la segunda revisión del mismo proyecto permite
   comprobar si la observación anterior se atendió, y eso se valora en la nota del revisor.

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
- [ ] [Acción ejecutable en la próxima entrega. Un verbo, un objeto, un criterio de
      éxito comprobable.]

**Próxima entrega donde espero ver esto:** ____
```

> Prohibidas las valoraciones sin acción: «mejorable», «regular», «falta pulir», «casi».
> Una retroalimentación sin campo 3 se devuelve al docente en la auditoría mensual.

### Anexo II · Plantilla `AI-USE.md` (obligatoria en toda entrega)

```markdown
# Declaración de uso de inteligencia artificial

**Entrega:** [código] · **Nivel permitido en esta actividad:** N_
**Fecha:** ____ · **Autor:** ____

## 1. Herramientas utilizadas
| Herramienta y modelo | Para qué | Nº aproximado de consultas |
|---|---|---|

*Si no se usó ninguna, escriba «Ninguna» y firme igual. La declaración negativa también
es obligatoria. En el Nivel I (semanas 1 a 5) la única respuesta admisible es «Ninguna».*

## 2. Guion metacognitivo previo (obligatorio desde nivel N2)
| # | Qué creía que pasaba | Qué había probado ya | Qué esperaba obtener |
|---|---|---|---|

## 3. Prompts decisivos
> [Transcriba literalmente los 1–3 prompts que más influyeron en el resultado.]

## 4. Qué acepté y por qué
- [Fragmento o decisión] → [por qué lo consideré correcto] → [cómo lo verifiqué]

## 5. Qué rechacé y por qué
- [Sugerencia rechazada] → [qué estaba mal en ella]

*Este apartado es el que más se valora. Si está vacío, o aceptó todo sin criterio, o no
leyó lo que aceptó.*

## 6. Qué parte de esta entrega NO habría podido hacer sin ayuda
> [Respuesta honesta. No penaliza. Orienta la tutoría.]

**Declaro que esta información es completa y veraz, y entiendo que ocultarla constituye
falta grave I-02 conforme al art. 56 de la Carta.**

Firma: ____
```

### Anexo III · Rúbrica de la sustentación (componente C, 25 %)

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
**Semana:** __ · **Nivel:** __ · **RA:** ____ · **Nivel de IA:** N_ · **Andamiaje:** A_

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
<p class="doc-file">Fichero: <code>ELYSIUM-INSTITUTE/D4-SYLLABUS.md</code></p>

> **Cómo leer este documento.** Es el contrato semanal del programa. La Parte I lo
> identifica y explica el Módulo 0. La Parte II detalla las dieciséis semanas, minuto a
> minuto, agrupadas en tres niveles de cinco semanas más la semana de defensa. La Parte
> III lo administra.
>
> **Regla de congelación** (Carta, Anexo B). No se modifica durante una generación en
> curso salvo corrección de errata, que se anota en §11.
>
> Se subordina a la Carta (D0), al Modelo Académico (D1), al Plan de Estudios (D2) y al
> Reglamento de Evaluación (D3).

---

## PARTE I · IDENTIFICACIÓN Y REGLAS

### 1 · Ficha del programa

| Campo | Valor |
|---|---|
| **Denominación** | Arquitectura de Infraestructura Digital Asistida por IA y Emprendimiento |
| **Estructura** | 16 semanas · tres niveles de cinco semanas + semana de defensa |
| **Generaciones por año** | Tres: enero–abril, mayo–agosto, septiembre–diciembre |
| **Horario** | Sábado y domingo, **15:00–17:00 UTC** |
| **Aula** | Máximo 15 estudiantes · 10 ideal · una sola aula simultánea |
| **Coste** | **Ninguno** (Carta, art. 3) |
| **Carga** | **4 h de clase + 4 h de estudio autónomo** por semana |
| **Preparación previa** | **Módulo 0**, asíncrono y autodirigido, unas 25 h (§3) |
| **Nivel de IA** | **N0 (S1–S5)** → N3 (S6–S10) → N4 (S11–S15) · **N0** siempre en quices, DAA, defensa y diseño de datos |
| **Entregable final** | Emprendimiento digital propio en producción, con marca, modelo de negocio y cumplimiento legal |

### 2 · Objetivo del programa

Al terminar la semana 16, la persona graduada tiene **publicada y en producción la
estructura base de su propio emprendimiento digital**: la plataforma funcionando, la
marca, la presencia en redes y el modelo de negocio formulado y sometido a un
experimento real.

**No la construyó sola: la dirigió.** Buena parte del código lo escribieron agentes de
inteligencia artificial bajo su especificación. Lo que sí es enteramente suyo es la
arquitectura, el modelo de datos, las decisiones y la responsabilidad, y puede
demostrarlo explicando y modificando cualquier bloque en vivo, sin asistencia.

### 3 · Módulo 0 · Preparación asíncrona

> **Por qué existe.** El programa dura dieciséis semanas y no exige experiencia previa.
> Ambas cosas sólo son compatibles si la semana 1 no empieza desde cero absoluto. El
> Módulo 0 es **gratuito, autodirigido, sin docente y sin nota**, y su única función es
> que todo el aula llegue con la misma base mínima. Quien lo complete, entra; nadie queda
> fuera por no haber programado antes, que es lo que el art. 16 de la Carta protege.

**Cuándo.** Las seis semanas anteriores al inicio de cada generación.

**Carga.** Unas 25 horas totales, al ritmo de cada persona. No hay sesiones en vivo.

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
  Consentimiento de investigación (D6, Anexo), voluntario y revocable
  Ficha de zona horaria y prueba de audio, vídeo y compartición de pantalla
```

**Acompañamiento.** Canal asíncrono de dudas con respuesta en 48 horas laborables, y
**una sesión opcional de una hora** a mitad del módulo. No cuenta como docencia.

**Si alguien no lo completa.** No pierde la plaza. Se le ofrece pasar a la generación
siguiente, que empieza en pocas semanas, o entrar asumiendo por escrito la desventaja.

### 4 · Los tres niveles

| Nivel | Semanas | Título | IA | Cierra con |
|:---:|:---:|---|:---:|---|
| **I** | 1–5 | Fundamentos de programación y de inteligencia artificial | **N0** | Página propia accesible y desplegada, escrita a mano |
| **II** | 6–10 | Programación asistida por agentes y bases de datos | **N3** | Plataforma con datos, acceso autenticado y despliegue |
| **III** | 11–15 | Cierre del proyecto y emprendimiento | **N4** | Emprendimiento digital listo para lanzar |
| **—** | 16 | **Demo Day y sustentación** | **N0** | Graduación |

**Los niveles no son certificables por separado.** Son la estructura interna de un único
programa (Carta, art. 48).

> ### La regla que gobierna el Nivel I
>
> **Cinco semanas sin ninguna asistencia de inteligencia artificial para producir
> código.** Ni autocompletado, ni chat, ni agente. La única respuesta admisible en el
> `AI-USE.md` de las semanas 1 a 5 es «Ninguna».
>
> Esto no protege al estudiante de la IA: lo **cualifica** para usarla. Quien no puede
> leer código no dirige a un agente, lo obedece. La semana 5 estudia la IA a fondo como
> **objeto**, precisamente para que en la semana 6 pueda empezar a usarla como
> **herramienta** con criterio propio.

### 5 · Cómo se lee cada semana

```text
### Semana NN · Título
> RA · Nivel de IA · Andamiaje · Entregable

Sábado · Antes (30 min)       trabajo previo obligatorio
Sábado · Durante (120 min)    20' apertura · 60' modelado en vivo · 40' pares
Sábado · Después (30 min)     quiz con 3 ítems de recuperación espaciada
Domingo · Antes (30 min)      entorno listo + predicción escrita
Domingo · Durante (120 min)   15' predicción · 90' construcción · 15' validación
Domingo · Después (60-90 min) Transferencia al proyecto propio
Criterio de aceptación        qué debe cumplirse para aprobar
```

---

## PARTE II · LAS DIECISÉIS SEMANAS

### NIVEL I · Fundamentos de programación y de inteligencia artificial · Semanas 1 a 5

> **Nivel de IA: N0 en todas las semanas.** Sin excepción y sin matices.

#### Semana 01 · La web como sistema, el DOM y el entorno

> **RA** RA-A1 · RA-F1 **·** **IA** **N0** **·** **Andamiaje** A1 **·** **Entrega** `L01`

**Sábado · Antes (30 min).** Micro-guía *«Qué ocurre cuando escribo una dirección y pulso
Intro»*. Tres predicciones escritas: ¿quién guarda el archivo que veo?, ¿el navegador
recibe la página ya dibujada?, ¿qué diferencia hay entre lo que escribí y lo que el
navegador tiene en memoria?

**Sábado · Durante (120 min).**
- `00:00–00:20` · Apertura con las tres predicciones erróneas más frecuentes, y puesta en
  común de cómo fue el Módulo 0. Lectura en voz alta del Compromiso λ.
- `00:20–01:20` · Modelado en vivo: recorrido completo de una petición y construcción del
  árbol del documento. Se modifica un nodo en directo desde las herramientas del navegador
  para mostrar que el DOM y el archivo HTML no son la misma cosa.
- `01:20–02:00` · Instrucción entre pares: *si edito el DOM desde el navegador y recargo,
  ¿por qué desaparece mi cambio?*

**Sábado · Después (30 min).** `Q01`, sin ítems espaciados.

**Domingo · Antes (30 min).** Abrir el Codespace de `elysium-lab`. Leer el HTML de partida
**sin ejecutarlo** y escribir la predicción de qué se verá.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Contraste predicción / realidad.
- `00:15–01:45` · Documento HTML válido y publicado: estructura, metadatos, `lang`, título;
  `git add`, `commit`, `push`; publicación estática y comprobación de la URL.
- `01:45–02:00` · Validación con el validador del W3C y prueba desde el teléfono.

**Domingo · Después.** `T01` · Repositorio personal del proyecto con un `README` que declara
en cinco líneas qué negocio va a construir, para quién y qué problema resuelve.

**Criterio de aceptación.** Documento válido y desplegado en URL pública; repositorio
creado; al menos tres *commits* con mensajes comprensibles.

---

#### Semana 02 · Semántica, accesibilidad y formularios

> **RA** RA-A1 · RA-A4 · RA-G1 **·** **IA** **N0** **·** **Andamiaje** A1 **·** **Entrega** `L02` **·** **COMPUERTA G1**

**Sábado · Antes (30 min).** Micro-guía *«Un `div` no significa nada»*. Predicción: ¿cómo
sabe un lector de pantalla que un bloque es la navegación principal?

**Sábado · Durante (120 min).**
- `00:00–00:20` · Apertura y dudas.
- `00:20–01:20` · Modelado con **demostración comparativa**: la misma página con
  contenedores genéricos y con elementos semánticos, recorridas ambas con lector de
  pantalla en directo. Árbol de accesibilidad. Los cuatro principios de WCAG, el nivel
  **AA de WCAG 2.2**, y por qué desde el 28 de junio de 2025 esto es exigible en la Unión
  Europea: Directiva (UE) 2019/882 y norma EN 301 549. Formularios accesibles: etiqueta
  programática por control, agrupaciones con leyenda, ayuda asociada, error anunciado.
- `01:20–02:00` · Instrucción entre pares: *¿cuál de estas cuatro maquetaciones de
  formulario es accesible y por qué las otras tres no?*

**Sábado · Después (30 min).** `Q02` · espaciado: S01.

**Domingo · Antes (30 min).** Instalar `axe DevTools`. Predecir cuántas violaciones
encontrará en el código de partida y de qué tipo.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Predicción y primera ejecución de `axe`.
- `00:15–01:45` · Esqueleto semántico completo (regiones, jerarquía de encabezados sin
  saltos, listas reales) y formulario de contacto accesible. Reconstruye **F05 ·
  Information System** del estándar.
- `01:45–02:00` · Validación: cero violaciones serias o críticas; recorrido íntegro por
  teclado sin trampa de foco.

**Domingo · Después.** `T02` · Esqueleto semántico del proyecto propio con su formulario.

> ### ⚑ Compuerta G1 · Carta de Anteproyecto
> **Vence:** domingo de la semana 2, 23:59 UTC. **Bloquea todas las Transferencias
> posteriores**, porque sin proyecto definido no hay destino para lo que se aprende. Dos
> páginas según la plantilla del D7, Anexo I: nicho, cliente concreto con nombre y
> contexto, problema, propuesta de valor en una frase, tres competidores, y qué hará la
> plataforma que hoy no ocurre.
>
> **Por qué en la semana 2 y no más tarde.** En un programa de dieciséis semanas, cada
> domingo sin destino es un 7 % de la Transferencia perdida. Se pide antes y se admite
> más imperfecta: se corrige en la tutoría de la semana 4.

**Criterio de aceptación.** Cero violaciones serias o críticas; todo control con etiqueta
programática; G1 aprobada.

---

#### Semana 03 · CSS: cascada, tokens y diseño responsivo

> **RA** RA-A2 · RA-A3 **·** **IA** **N0** **·** **Andamiaje** A2 **·** **Entrega** `L03`

**Sábado · Antes (30 min).** Micro-guía *«Por qué su regla CSS no se aplica»*. Predicción
sobre tres pares de selectores en conflicto.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Apertura.
- `00:20–01:20` · Modelado: origen y orden de la cascada, herencia, cálculo de
  especificidad, modelo de caja, unidades relativas, y **propiedades personalizadas como
  sistema de diseño**. Después: enfoque *mobile-first*, consultas de medio ascendentes,
  ejes de Flexbox, áreas de Grid y tipografía fluida con `clamp()`. Se muestra
  `!important` como antipatrón y por qué siempre se paga.
- `01:20–02:00` · Instrucción entre pares: *dadas estas cuatro reglas en conflicto, ¿qué
  color tendrá el elemento?* y *¿esto es Flexbox o Grid?*

**Sábado · Después (30 min).** `Q03` · espaciado: S02, S01.

**Domingo · Antes (30 min).** Señalar las tres reglas de la hoja de partida que **no**
surtirán efecto.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Predicción y contraste.
- `00:15–01:45` · Sistema de tokens (color, escala tipográfica, espaciado, radios) y
  maquetación responsiva completa, con cabecera móvil primero operable por teclado y
  cierre con `Escape`. Reconstruye **F02 · Header Mobile-First** y, si da tiempo, el tema
  claro y oscuro (**F13** y **F14**).
- `01:45–02:00` · Validación en 320, 768, 1440 y 2560 px, sin desbordamiento horizontal;
  contraste ≥ 4.5:1; cero valores de color fuera del sistema de tokens.

**Domingo · Después.** `T03` · Tokens y responsividad aplicados al proyecto propio.

**Criterio de aceptación.** Sin desplazamiento horizontal en ningún ancho; texto legible al
200 % de zoom; cero `!important`.

---

#### Semana 04 · JavaScript: datos, decisiones, iteración y funciones

> **RA** RA-B1 · RA-B2 · RA-B5 **·** **IA** **N0** **·** **Andamiaje** A2 **·** **Entrega** `L04` **·** **DAA-1** **·** **Fracaso productivo**

**Sábado · Antes (30 min).** **Fracaso productivo dirigido**: resolver ocho comparaciones
(`0 == ''`, `[] == false`, `NaN === NaN`…) y anotar la predicción. Se entrega el acierto y
el error. Nadie corrige nada todavía.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Apertura sobre los patrones de error del grupo, sin nombres.
- `00:20–01:20` · Modelado: tipos primitivos y de referencia; `const` y `let`; coerción e
  igualdad estricta; mutabilidad y copia; arreglos y objetos. Condicionales y cláusulas de
  guarda frente al anidamiento profundo. Iteración con `for…of` y transformación con `map`,
  `filter` y `reduce`. Funciones con retorno explícito, funciones puras y módulos ES.
- `01:20–02:00` · Instrucción entre pares con **problemas de Parsons**: ordenar los bloques
  de una función de filtrado y otra de agregación.

**Sábado · Después (30 min).** `Q04` · espaciado: S03, S02.

**Domingo · Antes (30 min).** Preparar el arnés de pruebas (`npm install`) y predecir la
salida del código de partida.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Predicción y contraste.
- `00:15–01:45` · Modelado del dominio del negocio en JavaScript (servicios con nombre,
  precio, duración, disponibilidad) y las funciones que operan sobre él, organizadas en
  módulos. Se hace pasar cada prueba una a una.
- `01:45–02:00` · Validación: `npm test` en verde; ninguna función supera 25 líneas.

**Domingo · Después.** `T04` · Datos reales del negocio propio modelados en un módulo.

> **DAA-1 · Primera Defensa Aleatoria de Autoría.** Ventana de esta semana. Examina código
> escrito **sin ninguna asistencia**. Establece la línea base de lo que la persona sabe
> hacer sola, que es contra lo que se comparará todo lo demás.

**Criterio de aceptación.** Pruebas en verde; sin `var`; sin comparación laxa salvo
justificación escrita; `AI-USE.md` que dice «Ninguna».

---

#### Semana 05 · DOM, eventos y fundamentos teóricos de la inteligencia artificial

> **RA** RA-B3 · RA-E1 · RA-E2 · RA-E3 **·** **IA** **N0** **·** **Andamiaje** A3 **·** **Entrega** `L05` **·** **Cierre del Nivel I**

**Sábado · Antes (30 min).** Dos tareas. Primera: segmentar a mano en «unidades mínimas»
tres frases en español, una con tildes y otra con emoji, y predecir cuántas contará el
modelo. Segunda: provocar deliberadamente **dos respuestas falsas** en un modelo de uso
libre sobre un tema que domine, y guardar las transcripciones. *Es la única semana del
Nivel I en que se abre un modelo, y se abre para estudiarlo, no para usarlo.*

**Sábado · Durante (120 min) · La sesión de teoría de IA.**
- `00:00–00:20` · Contraste de las segmentaciones con el conteo real y puesta en común de
  las falsedades recogidas.
- `00:20–01:20` · Modelado conceptual: qué es un modelo de lenguaje grande y qué significa
  predecir el siguiente token; representación vectorial del significado; el mecanismo de
  atención explicado sin álgebra; ventana de contexto y su coste; latencia de inferencia;
  familias propietarias y abiertas y **dónde acaban los datos del cliente**; por qué el
  modelo produce contenido falso con seguridad aparente; sesgo en los datos y en la
  alineación; y la lista de casos en los que **no debe usarse**: decisiones jurídicas,
  médicas, financieras, y todo aquello cuyo error no se detecta sin ser ya experto.
- `01:20–02:00` · Instrucción entre pares con casos de decisión profesional real.

**Sábado · Después (30 min).** `Q05` · espaciado: S04, S02.

**Domingo · Antes (30 min).** Predicción sobre el comportamiento del formulario de partida
al enviarlo vacío.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Predicción y contraste.
- `00:15–01:45` · API del DOM y eventos: `querySelector`, `addEventListener`, el objeto del
  evento, `preventDefault`. Validación de formulario en cliente con mensajes asociados al
  control, anuncio en región activa y foco al primer error. Y **el analizador de tokens**:
  una pequeña herramienta en JavaScript puro que segmenta texto, lo pinta con un color por
  unidad y compara el conteo propio con el de referencia, haciendo visible el coste
  desigual del español frente al inglés.
- `01:45–02:00` · Validación: prueba con teclado y con lector de pantalla; `npm test`.

**Domingo · Después.** `T05` · Validación accesible en el proyecto propio y análisis de sus
textos reales con el analizador construido. **Cierre del Nivel I.**

**Criterio de aceptación.** Un error de validación es percibido por alguien que navega sólo
con teclado y lector de pantalla, sin ver la pantalla. El analizador funciona con texto en
español con tildes, con emoji y con código, y el estudiante explica la diferencia de coste.

---

### NIVEL II · Programación asistida por agentes y bases de datos · Semanas 6 a 10

> **Se abre el nivel N3.** A partir de aquí se permite dirigir un **agente dentro del
> editor** en tareas de varios pasos sobre el propio repositorio. Lo que no se abre es el
> agente que actúa fuera del editor: eso es N4 y llega en el Nivel III. La frontera y su
> porqué están en el D1 §6.3.
>
> **Excepción inderogable:** el diseño del modelo de datos de la semana 8 se hace a **N0**.

#### Semana 06 · Instrucción técnica, dirección de agentes y depuración

> **RA** RA-E4 · RA-B6 **·** **IA** N3, salvo el diagnóstico que baja a **N2** **·** **Andamiaje** A3 **·** **Entrega** `L06`

**Sábado · Antes (30 min).** Dos tareas. Pedir a un modelo la misma función de tres maneras
(vaga, detallada, con ejemplo y restricciones) y guardar las salidas. Recibir cinco trazas
de error y escribir qué cree que ocurrió, sin ejecutar nada.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Comparación de las tres salidas: la variabilidad depende más de la
  instrucción que del modelo. Contraste de hipótesis sobre las trazas.
- `00:20–01:20` · Modelado: anatomía de una instrucción técnica útil (contexto, entrada,
  salida esperada, restricciones, criterio de éxito, formato); por qué pedir opciones con
  sus compromisos en vez de una solución; qué es un agente en el editor y en qué se
  diferencia de la sugerencia línea a línea. Después, depuración: leer una traza de abajo
  arriba, distinguir síntoma de origen, el depurador, y el método **hipótesis →
  experimento → confirmación → sólo entonces, cambio**. Se advierte sobre las tasas de
  aceptación acrítica documentadas en novatos, entre el 10 % y el 53 %, como aviso sobre la
  propia conducta.
- `01:20–02:00` · Depuración en directo de un fallo aportado por un estudiante.

**Sábado · Después (30 min).** `Q06` · espaciado: S05, S03.

**Domingo · Antes (30 min).** Configurar el agente en el editor y escribir el **guion
metacognitivo** de la primera consulta prevista (D1 §6.5).

**Domingo · Durante (120 min).**
- `00:00–00:15` · Predicción: ¿qué parte hará bien el agente y cuál mal?
- `00:15–01:45` · Dos mitades. Dirección del agente para construir un componente accesible
  con criterios dados de antemano, con la regla de leer en voz alta al par cada línea antes
  de aceptarla. Y reparación de tres defectos en código ajeno con **bitácora de depuración**
  obligatoria: hipótesis previa, prueba, resultado, conclusión. Aquí se permite pedir al
  modelo que **interprete** el error, nunca que lo arregle.
- `01:45–02:00` · Validación: pruebas en verde, `axe` limpio, `AI-USE.md` con el apartado de
  rechazos relleno y bitácora con tres entradas.

**Domingo · Después.** `T06` · Un componente del proyecto dirigido al agente y un fallo real
depurado con bitácora.

**Criterio de aceptación.** El apartado *qué rechacé y por qué* contiene al menos tres
rechazos justificados. La bitácora contiene la hipótesis **antes** del arreglo; si se
escribió después, el historial de Git lo delata.

---

#### Semana 07 · Asincronía, HTTP y consumo de datos

> **RA** RA-B4 · RA-C1 **·** **IA** N3 **·** **Andamiaje** A3 **·** **Entrega** `L07` **·** **Fracaso productivo**

**Sábado · Antes (30 min).** **Fracaso productivo**: ordenar la salida esperada de un
fragmento con `console.log`, `setTimeout(…, 0)` y una promesa resuelta. Casi nadie acierta,
y ése es el objetivo.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Contraste. Se cuentan los aciertos en voz alta y se dice que ser pocos es
  lo normal.
- `00:20–01:20` · Modelado: un solo hilo, la pila, la cola de tareas y el bucle de eventos
  dibujado en pantalla; la promesa y sus tres estados; `async`/`await` como azúcar sobre lo
  mismo; `try`/`catch`. Después, HTTP: métodos, familias de códigos de estado, cabeceras,
  intercambio entre orígenes, `fetch`, y la trampa clásica de que `fetch` **no rechaza**
  ante un 404. JSON y su capa de transformación.
- `01:20–02:00` · Instrucción entre pares con fragmentos de orden de ejecución no obvio.

**Sábado · Después (30 min).** `Q07` · espaciado: S06, S04.

**Domingo · Antes (30 min).** Predecir qué devolverá la petición de partida y qué falla al
recibir datos incompletos.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Predicción y contraste con una respuesta deliberadamente sucia.
- `00:15–01:45` · Cliente HTTP encapsulado en módulo, con los **cuatro estados de interfaz**
  implementados y anunciados: cargando, éxito, vacío y error. Capa de transformación
  resistente a datos ausentes o con tipo inesperado.
- `01:45–02:00` · Validación: la interfaz no se rompe con ninguno de los seis cuerpos de
  respuesta defectuosos provistos; los cuatro estados se anuncian a lector de pantalla.

**Domingo · Después.** `T07` · Los cuatro estados y la capa de datos en el proyecto.

**Criterio de aceptación.** Los cuatro estados existen y son accesibles. Una interfaz que
sólo contempla el éxito no aprueba.

---

#### Semana 08 · Modelado de datos y Firebase Cloud Firestore

> **RA** RA-C2 · RA-C3 **·** **IA** **N0 en el diseño**, N3 en el código **·** **Andamiaje** A4 **·** **Entrega** `L08` **·** **COMPUERTA G2**

**Sábado · Antes (30 min).** Dibujar **en papel**, sin ayuda de ningún tipo, cómo guardaría
los datos de su negocio. Fotografiar y entregar.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Se proyectan varios papeles anónimos y se comparan enfoques.
- `00:20–01:20` · Modelado: entidad y relación; el modelo documental y por qué invierte la
  regla; la pregunta que gobierna todo el diseño, que no es *cómo son mis datos* sino
  **cómo los voy a consultar**; desnormalización deliberada y su coste de escritura;
  colección, documento, subcolección; índices compuestos; y el modelo de facturación por
  operación de Firestore, con la advertencia de que un bucle mal escrito genera una factura.
- `01:20–02:00` · Taller: cada pareja rediseña el esquema del otro para una consulta nueva
  que no estaba prevista.

**Sábado · Después (30 min).** `Q08` · espaciado: S07, S05.

**Domingo · Antes (30 min).** Listar las ocho consultas que su aplicación necesitará.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Revisión cruzada de las listas de consultas.
- `00:15–01:45` · Creación del proyecto de Firebase y de las colecciones del esquema
  aprobado; carga de datos de prueba; primera lectura desde la aplicación; primera
  suscripción en tiempo real con dos pestañas abiertas.
- `01:45–02:00` · Validación: la lectura funciona, la suscripción se cancela al desmontar, y
  no hay claves sensibles en el repositorio.

**Domingo · Después.** `T08` · Colecciones del proyecto propio creadas y pobladas.

> ### ⚑ Compuerta G2 · Modelo de datos aprobado
> **Vence:** domingo de la semana 8. **Bloquea la compuerta G3.** Esquema con cada
> colección y sus campos tipados, las ocho consultas previstas y la **justificación escrita
> de cada desnormalización**. Se defiende oralmente a nivel **N0**: la arquitectura de datos
> no se delega. Rúbrica en D7 §11.2.

**Criterio de aceptación.** Cada decisión de desnormalización tiene una consulta que la
justifica. Un esquema bonito sin consultas que lo motiven no aprueba.

---

#### Semana 09 · Operaciones sobre datos y panel de administración

> **RA** RA-C3 · RA-A1 · RA-A4 **·** **IA** N3 **·** **Andamiaje** A4 **·** **Entrega** `L09` **·** **DAA-2**

**Sábado · Antes (30 min).** Micro-guía *«De un formulario accesible a un documento en la
nube»*. Buscar tres interfaces reales con confirmación de borrado y evaluar cuál protege
mejor de un error.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Apertura con los ejemplos.
- `00:20–01:20` · Modelado: el recorrido del dato desde el control del formulario hasta el
  documento persistido; validación en cliente frente a validación en servidor y por qué la
  primera nunca basta; marcas de tiempo del servidor; idempotencia y el problema del doble
  envío; actualización parcial frente a sustitución; borrado físico frente a lógico; y el
  diseño accesible de la confirmación destructiva, con foco atrapado y devuelto.
- `01:20–02:00` · Instrucción entre pares: *¿qué pasa si el usuario pulsa enviar dos veces?*
  y *¿qué ocurre con dos escrituras simultáneas?*

**Sábado · Después (30 min).** `Q09` · espaciado: S08, S06.

**Domingo · Antes (30 min).** Predecir qué ocurre al enviar el formulario sin conexión, y
bocetar el panel propio.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Predicción y contraste en modo sin red.
- `00:15–01:45` · Inserción desde el formulario accesible con bloqueo del doble envío y
  confirmación anunciada; y **panel de administración en tiempo real**: tabla accesible con
  encabezados asociados, edición, borrado con confirmación y deshacer, filtros y contador de
  pendientes. Equivalente reducido de **F18** y **F25**.
- `01:45–02:00` · Validación: la llegada de un dato nuevo mientras se lee la tabla no
  desplaza el contenido ni roba el foco; todo operable sólo con teclado.

**Domingo · Después.** `T09` · Formulario conectado y panel del proyecto propio.

> **DAA-2 · La convocatoria más importante de las cuatro.** Examina código construido
> **dirigiendo agentes**, tres semanas después de abrirse el nivel N3. Es el punto de mayor
> riesgo de erosión de la autoría en todo el programa.

**Criterio de aceptación.** El doble envío no duplica. La confirmación se percibe sin ver la
pantalla.

---

#### Semana 10 · Autenticación, reglas de seguridad y despliegue continuo

> **RA** RA-D1 · RA-D2 · RA-C4 · RA-F1 **·** **IA** **N0 en el diseño de reglas**, N3 en el resto **·** **Andamiaje** A4 **·** **Entrega** `L10` **·** **Cierre del Nivel II** **·** **Fracaso productivo**

**Sábado · Antes (30 min).** **Fracaso productivo**: se entrega la URL de una aplicación de
práctica del Instituto con reglas abiertas. Intentar leer y modificar datos que no deberían
ser accesibles, y documentar lo conseguido. Es un entorno del Instituto y nada más.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Puesta en común de lo que cada quien logró leer y borrar. Ver la propia
  base de datos vaciada por un compañero no lo produce ninguna diapositiva.
- `00:20–01:20` · Modelado: identidad, autenticación y autorización como tres cosas
  distintas; por qué las contraseñas nunca se almacenan; **Firebase Authentication**, el
  testigo firmado y su caducidad; control de acceso por roles y mínimo privilegio. Después:
  el cliente **nunca** es de confianza; el lenguaje de reglas de Firestore; denegación por
  defecto; validación de forma en la propia regla; por qué **ocultar el botón no protege la
  ruta**; y la **batería de casos negativos** como única prueba aceptable. Y por último:
  ramas, revisión de código, versionado Elysium, e **integración continua que bloquea la
  publicación** cuando los umbrales no se cumplen. Secretos y variables de entorno: una
  clave en el historial ya está comprometida.
- `01:20–02:00` · Escritura colectiva de reglas, atacadas en directo por el docente.

**Sábado · Después (30 min).** `Q10` · espaciado: S09, S07.

**Domingo · Antes (30 min).** Escribir la matriz de permisos del proyecto y ocho casos
negativos: ocho cosas que **nadie** debería poder hacer.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Revisión cruzada de matrices y casos negativos entre parejas.
- `00:15–01:45` · Registro, inicio y cierre de sesión con mensajes que **no revelan si el
  correo existe**; área privada y área de administración; reglas de Firestore que reflejan
  la matriz, con batería automatizada en el emulador local; y despliegue continuo con
  compuerta activa. Se provoca a propósito un fallo de accesibilidad para **ver el bloqueo
  funcionar**, se corrige y se publica.
- `01:45–02:00` · Validación: los ocho casos negativos fallan, los cuatro positivos pasan, y
  existe evidencia de una publicación bloqueada y luego corregida.

**Domingo · Después.** `T10` · Acceso autenticado, reglas y despliegue en el proyecto propio.
**Cierre del Nivel II.**

**Criterio de aceptación.** **Cero casos negativos que pasen.** Uno solo que pase es hallazgo
crítico. Un cliente autenticado no puede leer ni un documento del área de administración,
comprobado **desde la consola** y no sólo desde la interfaz.

---

### NIVEL III · Cierre del proyecto y emprendimiento · Semanas 11 a 15

> **Se abre el nivel N4**, y sólo en la semana 11: agentes que actúan por sí mismos sobre
> sistemas reales, donde el peor error ya no se revierte con `git`.
>
> **Dos semanas de cierre técnico y tres de emprendimiento.** No es un nivel técnico con un
> apéndice de negocio: son dos bloques del mismo peso. Quien termine con una plataforma
> impecable y sin saber a quién se la va a ofrecer no ha terminado el programa.

#### Semana 11 · La transacción del negocio y el agente supervisado

> **RA** RA-C5 · RA-E5 · RA-B2 **·** **IA** **N4** **·** **Andamiaje** A5 **·** **Entrega** `L11` **·** **Fracaso productivo**

**Sábado · Antes (30 min).** **Fracaso productivo**: escribir la función que decide si dos
reservas se solapan. Y listar tres cosas de su aplicación que **no deberían** ejecutarse en
el navegador.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Se proyectan varias soluciones y se rompen con casos límite: reservas
  contiguas, de duración cero, que cruzan la medianoche.
- `00:20–01:20` · Modelado en dos mitades. **La transacción:** tiempo universal frente a hora
  local, husos y cambios estacionales, el algoritmo correcto de solapamiento, condiciones de
  carrera, y el patrón de rejilla accesible con navegación por flechas (**F24**). **El agente
  en el servidor:** Firebase Cloud Functions, disparadores, gestión de secretos, y la regla
  dura de que toda clave de un tercero vive en el servidor. Diseño de un agente con **carta
  de límites**: qué puede hacer, qué no puede hacer nunca, qué exige confirmación humana, qué
  se registra y cómo se revierte.
- `01:20–02:00` · Instrucción entre pares: *¿qué es lo peor que puede hacer este agente si el
  modelo se equivoca?*

**Sábado · Después (30 min).** `Q11` · espaciado: S10, S08.

**Domingo · Antes (30 min).** Reglas de disponibilidad del propio negocio y **carta de
límites** del propio agente.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Revisión cruzada de las cartas de límites.
- `00:15–01:45` · La transacción del negocio (reserva, pedido o alta) con impedimento del
  doble apunte, construida dirigiendo al agente. Y una función de servidor que, ante una
  transacción nueva, genera con un modelo un **borrador de respuesta que queda pendiente de
  aprobación humana**, con bitácora de entrada, salida y decisión.
- `01:45–02:00` · Validación: **una transacción completa realizada sólo con teclado y lector
  de pantalla**; cero envíos automáticos sin aprobación.

**Domingo · Después.** `T11` · Transacción operativa y agente supervisado en el proyecto.

**Criterio de aceptación.** Una persona ciega completa la transacción de principio a fin.
**Cero envíos automáticos sin revisión humana**: un agente que puede enviar solo es hallazgo
crítico.

---

#### Semana 12 · Auditoría técnica, endurecimiento y congelación

> **RA** RA-F2 · RA-A4 · RA-A5 · RA-D3 **·** **IA** N4 **·** **Entrega** `L12` **·** **COMPUERTA G3** **·** **DAA-3**

**Sábado · Antes (30 min).** Ejecutar la Auditoría Técnica Elysium completa sobre el proyecto
propio y **predecir la puntuación** antes de mirar el informe. Buscar activamente tres
formas de romper la propia plataforma.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Contraste entre puntuación esperada y obtenida. Se comenta el sesgo
  sistemático del grupo, que casi siempre se sobreestima.
- `00:20–01:20` · Modelado: lectura de un informe de rendimiento y causa raíz de cada
  métrica; presupuesto de rendimiento; la disciplina de medir antes y después de cada cambio.
  Modelo de amenaza: inyección, escalada de privilegios, exposición de secretos, dependencias
  vulnerables, limitación de tasa. Cabeceras de seguridad de la plataforma con el ataque que
  previene cada una (**F07 · Security Core**). Y el plan de respuesta ante incidente, con la
  notificación de violación de datos en 72 horas.
- `01:20–02:00` · **Ataque cruzado autorizado**: cada estudiante intenta vulnerar la
  plataforma de otro, con consentimiento escrito previo y dentro del entorno del Instituto.
  Todo hallazgo se comunica en privado a su autor antes de comentarse.

**Sábado · Después (30 min).** `Q12` · espaciado: S11, S09.

**Domingo · Antes (30 min).** Recibir el informe de quien le atacó y ordenar la remediación
por severidad.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Validación del plan de remediación con el docente.
- `00:15–01:45` · Remediación de todo hallazgo crítico y mayor, con medición antes y después,
  y un **caso negativo automatizado por cada vector encontrado**. Cabeceras configuradas y
  verificadas. Reauditoría.
- `01:45–02:00` · **Congelación de funcionalidad.**

**Domingo · Después.** `T12` · Proyecto sin hallazgos críticos y **congelado**.

> ### ⚑ Compuerta G3 · Auditoría Técnica del producto
> **Vence:** domingo de la semana 12. **Bloquea la compuerta G4.** ATE-A, ATE-P, ATE-S,
> ATE-Q y ATE-D **sin hallazgos críticos**.
>
> **A partir de aquí no se añaden funciones nuevas.** Las tres semanas siguientes son
> negocio, cumplimiento y memoria, y describen la plataforma que existe. Si el código
> siguiera cambiando, la descripción sería falsa.

> **DAA-3.** Examina el producto completo y congelado.

**Criterio de aceptación.** Cada hallazgo tiene un caso negativo que lo impide en el futuro.
Remediar sin prueba no cuenta: vuelve a ocurrir.

---

#### Semana 13 · Emprendimiento I · el negocio detrás de la plataforma

> **RA** RA-G1 **·** **IA** N4 **·** **Andamiaje** A5 **·** **Entrega** `L13`

**Sábado · Antes (30 min).** Releer la Carta de Anteproyecto de la semana 2 y anotar **qué ha
resultado ser falso**. Hablar con una persona que podría ser cliente y apuntar textualmente
tres frases suyas.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Puesta en común: qué supuesto se cayó. Casi todos se caen, y decirlo en
  público es la lección.
- `00:20–01:20` · Modelado: lienzo Lean para micronegocios; segmento, problema, propuesta
  única, canales, ingresos y costes; identificación del **supuesto más peligroso** y diseño
  del experimento más barato que puede refutarlo; economía unitaria mínima, con coste de
  adquisición, valor del cliente y punto de equilibrio; y cómo se fija un precio sin adivinar.
- `01:20–02:00` · Taller por pares: cada persona **ataca** el lienzo del otro.

**Sábado · Después (30 min).** `Q13` · espaciado: S12, S10.

**Domingo · Antes (30 min).** Formular por escrito el supuesto más peligroso del propio
negocio.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Revisión de supuestos.
- `00:15–01:45` · Lienzo completo, economía unitaria con números propios, y **el experimento
  de validación lanzado de verdad**: encuesta, conversaciones con cinco clientes potenciales
  o página de captación publicada.
- `01:45–02:00` · Presentación de dos minutos por persona.

**Domingo · Después.** `T13` · Lienzo, precios y experimento en marcha.

**Criterio de aceptación.** El experimento tiene un **criterio numérico** que, de no
alcanzarse, obliga a cambiar el modelo. Sin ese criterio no es un experimento, es una ilusión
con formulario.

---

#### Semana 14 · Emprendimiento II · marca, redes y captación

> **RA** RA-G2 **·** **IA** N4 **·** **Andamiaje** A5 **·** **Entrega** `L14`

**Sábado · Antes (30 min).** Elegir tres marcas del propio sector y describir en una frase qué
promete cada una. Buscar el propio negocio en un buscador y en un asistente conversacional.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Apertura con los hallazgos.
- `00:20–01:20` · Modelado en tres bloques. **Marca:** identidad mínima viable, nombre, paleta
  ya validada por contraste, voz y tono, y la promesa de marca entendida como restricción de
  producto y no como adorno. **Redes y contenido:** qué red sirve a qué negocio y cuál no
  sirve a ninguno; ritmo sostenible de publicación para una persona sola; contenido que capta
  frente a contenido que entretiene; y la advertencia de que una red social es infraestructura
  alquilada mientras la plataforma propia es infraestructura poseída. **Descubrimiento:**
  metadatos, datos estructurados, mapa del sitio, previsualización enriquecida y ficheros de
  contexto para asistentes (**F19 · Discovery Core**, **F20 · SEO**).
- `01:20–02:00` · Crítica de marca entre pares con prueba ciega de promesas.

**Sábado · Después (30 min).** `Q14` · espaciado: S13, S11.

**Domingo · Antes (30 min).** Escribir la promesa de marca en una sola frase y las diez
consultas por las que quiere que le encuentren.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Prueba ciega de promesas entre pares.
- `00:15–01:45` · Manual de marca de una página; reescritura de todos los textos de la
  plataforma conforme a la voz definida; perfiles sociales creados y coherentes; plan de
  contenido de ocho semanas realista para una persona sola; y metadatos, datos estructurados y
  previsualización configurados.
- `01:45–02:00` · Validación con herramienta de resultados enriquecidos y revisión de
  coherencia entre marca, interfaz y promesa.

**Domingo · Después.** `T14` · Marca, presencia y descubrimiento del proyecto propio.

**Criterio de aceptación.** La promesa de marca, la interfaz y los perfiles sociales dicen lo
mismo. El plan de contenido es sostenible por una sola persona: si exige publicar a diario, se
rechaza por irreal.

---

#### Semana 15 · Cumplimiento legal, memoria y ensayo

> **RA** RA-D4 · RA-G3 · RA-F3 **·** **IA** N4 **·** **Entrega** `L15` **·** **COMPUERTA G4**

**Sábado · Antes (30 min).** Inventariar **todos** los datos personales que su plataforma
recoge, campo por campo. Localizar la sede electrónica oficial del registro mercantil y de la
administración tributaria de su propio país.

**Sábado · Durante (120 min).**
- `00:00–00:20` · Puesta en común de los datos personales que nadie había contado, que casi
  siempre son las direcciones IP y los registros de acceso.
- `00:20–01:20` · Modelado: qué es un dato personal y cuál es sensible; bases legales;
  minimización y plazo de conservación; derechos de la persona interesada; responsable y
  encargado; transferencias fuera de la Unión; consentimiento previo de cookies (**F08**); el
  Reglamento (UE) 2016/679 junto a la Ley n.º 8968 de Costa Rica; y la ruta de formalización
  comercial, con Costa Rica y Portugal como casos trabajados y una plantilla común para el
  resto de jurisdicciones.
- `01:20–02:00` · Taller: elegir base legal para ocho tratamientos concretos, y estructura de
  la memoria técnica.

**Sábado · Después (30 min).** `Q15` · recuperación acumulativa de todo el programa.

**Domingo · Antes (30 min).** Borrador del registro de actividades de tratamiento.

**Domingo · Durante (120 min).**
- `00:00–00:15` · Revisión cruzada de registros.
- `00:15–01:30` · Expediente legal completo: política de privacidad, aviso legal, términos y
  gestión de consentimiento. Nivel N4 permitido para generar borradores, con **revisión
  obligatoria línea a línea** y verificación de que cada afirmación corresponde a lo que la
  plataforma realmente hace. Cierre de la memoria técnica.
- `01:30–02:00` · Primer ensayo cronometrado del pitch, con retorno de dos compañeros.

**Domingo · Después.** `T15` · Expediente publicado, memoria definitiva y pitch cerrado.

> ### ⚑ Compuerta G4 · Cumplimiento y memoria
> **Vence:** domingo de la semana 15. **Bloquea la defensa.** ATE-C completo sin hallazgos
> críticos, más la memoria técnica conforme al D7 §14.

**Criterio de aceptación.** Cada tratamiento del registro tiene base legal, plazo y cauce de
ejercicio de derechos. Una política de privacidad que menciona funcionalidades que la
plataforma no tiene se devuelve: es una declaración falsa.

> **Límite declarado.** Este bloque enseña a navegar el procedimiento y a saber qué
> preguntar. **No es asesoramiento jurídico ni fiscal**, y así consta en el material y en el
> certificado.

---

### SEMANA 16 · Demo Day y sustentación

> **RA** RA-G4 **·** **IA** **N0 estricto** **·** **Entrega** `H` **·** **Presencia obligatoria** **·** **DAA-final**

**Sábado · Antes.** Comprobación técnica: plataforma en producción, URL accesible, guion
listo, entorno de presentación probado.

**Sábado · Durante (120 min) · DEMO DAY.** Sesión pública, retransmitida, grabada y
subtitulada, con invitados externos. Cada estudiante presenta **7 minutos** con demostración
en vivo de la plataforma funcionando y de su modelo de negocio. Sin diapositivas de relleno.

**Domingo · Durante (120 min) · SUSTENTACIÓN TÉCNICA.** En salas paralelas, ante panel de tres
personas con **al menos un auditor externo al Instituto** (Carta, art. 26):

| Fase | Duración | Contenido |
|---|:---:|---|
| Exposición técnica | 10 min | Arquitectura, decisiones y alternativas descartadas |
| **Defensa de autoría final** | 10 min | Modificación de código en vivo, a nivel **N0** |
| Preguntas del panel | 15 min | Técnicas, de negocio y de cumplimiento |
| Deliberación | 5 min | A puerta cerrada |

**Domingo · Cierre.** Acto de graduación: certificados, menciones (D3 §3.1) y publicación de
los proyectos en la galería de la generación.

**Preguntas que siempre se hacen**, y que por tanto se entrenan en la semana 15: *¿por qué
eligió esta estructura de datos?*, *¿qué parte de esto no escribió usted?*, *¿qué haría si
mañana tuviera mil usuarios?*, *¿cómo sabe que es accesible?*, *¿qué dato personal guarda y
con qué base legal?*, *¿qué es lo peor que puede hacer su agente si el modelo se equivoca?*,
*¿a quién le va a vender esto la semana que viene?*

---

## PARTE III · ADMINISTRACIÓN

### 6 · Mapa de evaluación

| Componente | Peso | Instrumentos |
|---|:---:|---|
| **A · Continua** | 40 % | `Q01`–`Q15` (12 mejores) 15 % · `L01`–`L15` 25 % |
| **B · Proyecto** | 30 % | `T01`–`T15` 12 % · G1 (4 %) + G2 (6 %) + G3 (5 %) + G4 (3 %) 18 % |
| **C · Hito final** | 30 % | Producto 35 % · memoria 25 % · sustentación 25 % · pitch 15 % |
| **Apto / no apto** | — | **4 DAA** (S4, S9, S12, S16) · asistencia ≥ 80 % · `AI-USE.md` completo |

### 7 · Estructura del calendario

Las tres generaciones del año siguen la misma estructura de dieciséis semanas consecutivas,
sin receso interno, con un fin de semana de separación entre generaciones (Carta, art. 45).
Las fechas concretas de cada generación se publican en el D5 §17.

| Semana | Nivel | Marca |
|:---:|:---:|---|
| 01 | I | Arranque · lectura del Compromiso λ |
| 02 | I | **G1 · Carta de Anteproyecto** |
| 03 | I | |
| 04 | I | **DAA-1** · fracaso productivo |
| 05 | I | Fundamentos de IA · **cierre del Nivel I** |
| 06 | II | **Apertura de N3** |
| 07 | II | Fracaso productivo |
| 08 | II | **G2 · Modelo de datos** (defensa a N0) |
| 09 | II | **DAA-2** |
| 10 | II | Fracaso productivo · **cierre del Nivel II** |
| 11 | III | **Apertura de N4** · fracaso productivo |
| 12 | III | **G3 · Auditoría del producto** · **DAA-3** · **congelación** |
| 13 | III | Emprendimiento I |
| 14 | III | Emprendimiento II |
| 15 | III | **G4 · Cumplimiento y memoria** · cierre de reintentos |
| 16 | — | **DEMO DAY y SUSTENTACIÓN** · **DAA-final** · presencia obligatoria |

**Aviso de cambio de hora.** El horario está anclado a **15:00 UTC**, de modo que **nada
cambia nunca para América Latina continental**; sólo se desplaza el reloj de pared de quienes
viven en un territorio que todavía cambia de hora. La Secretaría lo anuncia por escrito la
semana previa a cada transición.

### 8 · Qué **no** cabe en dieciséis semanas

Se declara aquí para que nadie lo descubra en la semana 9, y para que ninguna pieza de
difusión lo insinúe:

- **No** se estudian marcos de trabajo de JavaScript ni preprocesadores de CSS.
- **No** se alcanza dominio en optimización profunda de Core Web Vitals.
- **No** se escriben pruebas propias desde cero: se ejecutan y se interpretan las provistas.
- **No** hay estructura multiidioma ni multidivisa, ni aplicación instalable.
- **No** hay investigación científica a cargo del estudiante (Carta, art. 53).
- **No** se imparte asesoría jurídica, fiscal ni contable.

La lista completa de qué queda **dominado** y qué queda **introducido**, resultado por
resultado, está en el D2 §5.9 y se transcribe en el certificado.

### 9 · Recursos permanentes

| Recurso | Uso |
|---|---|
| `elysium-lab` (Codespaces) | Repositorio de laboratorios con arnés de pruebas |
| `<usuario>-tfg` | Repositorio personal del proyecto |
| MDN Web Docs | Fuente canónica de la plataforma web |
| Documentación oficial de Firebase | Firestore, Authentication, Cloud Functions |
| `axe DevTools` · Lighthouse · validador del W3C | Auditoría |
| Lector de pantalla del sistema | NVDA, VoiceOver u Orca |
| Guía rápida WCAG 2.2 (W3C) | Referencia normativa |
| `ELYSIUM-STANDARDS.md` | Canon técnico de la empresa (D2 §12) |

### 10 · Contrato de expectativas del docente

Publicar la micro-guía del sábado con 72 horas de antelación; devolver toda calificación en 7
días con los tres campos obligatorios; grabar y subtitular las 32 sesiones; **no tocar nunca
el teclado del estudiante**; **desactivar todo asistente de IA en la pantalla de proyección
durante el Nivel I**; convocar las cuatro Defensas Aleatorias de Autoría; asegurar la
presencia del auditor externo en la sustentación, cuya ausencia obliga a aplazar y no a
celebrar sin él; y anotar en §11 cualquier semana en la que menos del 60 % alcance el criterio
en primer intento, que se considerará defectuosa **por diseño** y no por el grupo (D1 §9).

### 11 · Registro de erratas y de semanas defectuosas

| Generación | Semana | Naturaleza | Corrección aplicada | Efecto sobre notas |
|---|---|---|---|---|
| *(vacío al inicio)* | | | | |

---

*Elysium λ Institute of Development & Research · D4 · «Abstrahere, aedificare, probare.»*




<div class="salto"></div>

# D5 · Manual de Operación

<p class="doc-sub">A quién sirve, a qué hora, qué cuesta y quién lo paga</p>
<p class="doc-file">Fichero: <code>ELYSIUM-INSTITUTE/D5-MANUAL-DE-OPERACION.md</code></p>

> **Cómo leer este documento.** Es el documento operativo del Instituto. La Parte I
> delimita a quién sirve el programa y frente a qué alternativas. La Parte II fija el
> posicionamiento. La **Parte III resuelve el problema del horario** con un modelo
> cuantitativo cuya especificación se incluye para que pueda replicarse o refutarse. La
> Parte IV contiene el calendario de las tres generaciones anuales. La Parte V declara
> qué cuesta el programa y quién lo paga. La Parte VI regula la selección, los riesgos y
> los indicadores públicos.
>
> **Advertencia metodológica.** Las cifras de contexto sectorial proceden de informes
> comerciales que no publican su metodología completa y cuyas estimaciones varían entre
> sí. Se usan como **indicio de tendencia y no como dato**. Las únicas cifras propias son
> las del modelo horario (Parte III) y las de coste (Parte V), y ambas incluyen sus
> supuestos.

---

## PARTE I · A QUIÉN SIRVE EL PROGRAMA

### 1 · Delimitación

**Población destinataria.** Personas hispanohablantes de 16 años o más, residentes en
cualquiera de los veintiún países de lengua española y en la diáspora, que quieren
**montar un emprendimiento digital propio** y necesitan las bases técnicas para
dirigirlo, que **no pueden o no quieren** abandonar su empleo o sus estudios para
formarse, y que **no tienen a su alcance una vía equivalente**. Este último requisito no
es retórico: es el criterio que más pesa en la selección (§23).

**Escala.** Alrededor de 600 millones de personas hablan español. El Instituto atiende a
**diez personas por generación y treinta por año**. La magnitud sirve únicamente para
dimensionar el problema que la convocatoria intenta abordar, y para recordar su
desproporción.

### 2 · Segmentación por barrera de acceso

Describe **qué barrera queda en pie cuando se elimina el precio**, que es exactamente la
información que necesita el proceso de selección.

| Grupo | Territorios | Barrera dominante |
|:---:|---|---|
| **A** | España, Portugal, Puerto Rico, Uruguay, Chile, Costa Rica, Panamá, diáspora en EE. UU. y UE | **Tiempo.** Existen alternativas de pago accesibles; lo escaso es el hueco semanal. El diferencial es el horario de fin de semana. |
| **B** | México, Colombia, Argentina, Perú, Ecuador, República Dominicana, Paraguay | **Coste de oportunidad.** Hay oferta, pero cuesta varios meses de salario. El diferencial es la gratuidad combinada con no tener que dejar el empleo. |
| **C** | Bolivia, Guatemala, Honduras, El Salvador, Nicaragua, Venezuela, Cuba, Guinea Ecuatorial | **Ausencia de oferta y de infraestructura.** El diferencial es que el programa exista; la restricción real pasa a ser la conectividad y el equipo. |

> **Límite reconocido con honestidad.** El requisito de ordenador propio y conexión
> estable excluye a una parte de la población del grupo C, que es precisamente la de mayor
> necesidad. El Instituto no puede resolverlo hoy y no finge lo contrario. Queda anotado
> como el primer objetivo de ampliación si alguna vez se obtiene financiación pública.

### 3 · Los tres arquetipos de estudiante

Previsiones de planificación sobre un aula de diez, no cupos: la rúbrica de selección no
reserva plazas por arquetipo.

#### Arquetipo 1 · «La persona que ya trabaja» *(estimado: 50 %)*

Entre 24 y 40 años, empleo de lunes a viernes fuera del sector tecnológico. Ha intentado
aprender por su cuenta con vídeo y lo ha abandonado dos veces. **Se presenta** porque el
fin de semana es el único hueco real que tiene. **Abandona** cuando el trabajo se le
complica y siente que ya no alcanza al grupo.
*Mecanismo que lo retiene:* reintento hasta el dominio, descarte de las tres peores notas,
tres prórrogas sin justificación, y el horizonte de cuatro meses visible desde el
primer día.

#### Arquetipo 2 · «Quien ya tiene un micronegocio» *(estimado: 30 %)*

Entre 28 y 50 años, autónomo o con una empresa de menos de cinco personas. Paga hoy por
una web que no controla, o no tiene ninguna. **Se presenta** porque el proyecto de
graduación **es** su plataforma. **Abandona** cuando el ritmo técnico supera su interés
real por programar.
*Mecanismo que lo retiene:* la Transferencia semanal, que produce avance visible en su
propio negocio cada domingo, y las tres semanas de emprendimiento del Nivel III.

#### Arquetipo 3 · «Quien estudia o acaba de terminar» *(estimado: 20 %)*

Entre 16 y 24 años, con tiempo pero sin dinero. **Se presenta** porque quiere salir con
algo suyo funcionando y defendible, y porque intuye que saber dirigir agentes de IA vale
más que saber escribir el código a mano. **Abandona** cuando aparece una oportunidad
laboral.
*Mecanismo que lo retiene:* que el proyecto sea **suyo y esté en producción** desde la
semana 2.

---

## PARTE II · ALTERNATIVAS Y POSICIONAMIENTO

### 4 · Mapa de alternativas

| Categoría | Ejemplos | Coste orientativo | Modalidad | Hueco que deja |
|---|---|---|---|---|
| **Bootcamps intensivos** | 4Geeks Academy, Le Wagon, Ironhack | 4.000–6.500 USD | Inmersión, semanas completas | Exigen dejar de trabajar, y su precio equivale a varios meses de salario en buena parte del mundo hispanohablante. |
| **Bootcamps con pago diferido** | Modelos de acuerdo de ingresos | Porcentaje del salario futuro | Intensivo remoto | El compromiso financiero futuro asusta y la promesa de empleo es frágil. |
| **Programas de impacto social** | Laboratoria y equivalentes | Subvencionado | 6 meses remoto | Cupo limitado y foco demográfico específico. |
| **Plataformas de suscripción** | Vídeo bajo demanda | 10–40 USD al mes | Asíncrona | Sin sincronía, sin cohorte, sin verificación de autoría. Terminación notoriamente baja. |
| **Gratuito de alta calidad** | freeCodeCamp, contenido abierto | 0 | Autodidacta | Sin acompañamiento, sin credencial defendible, sin proyecto tutorizado. |
| **Universidad tradicional** | Grados y ciclos | Variable | 2–5 años | Lentitud y currículos desfasados en IA aplicada. |

**Conclusión.** El eje saturado es *intensivo caro* frente a *asíncrono barato*. El
cuadrante **vacío** es el de **alta intensidad docente en franja de fin de semana,
gratuito, con cohorte muy pequeña y con emprendimiento propio como entregable**. Conviene
ser explícito sobre por qué está vacío: **no es un hueco de mercado, es un hueco que sólo
puede ocupar quien no busque rentabilidad**. Diez personas por generación con
acompañamiento individual no constituyen un negocio viable para nadie. Ésa es a la vez la
razón de que nadie lo haga y la razón de que el Instituto pueda hacerlo.

### 5 · La proposición

> **Cuatro meses, dos días a la semana, gratis, para salir con tu emprendimiento digital
> montado: la plataforma funcionando, la marca, y el negocio pensado.**
>
> Programación, herramientas modernas de inteligencia artificial y emprendimiento. Diez
> plazas. Sin coste de ningún tipo. Sábados y domingos de 15:00 a 17:00 UTC.

#### 5.1 · Cómo se nombra, y cómo no

El art. 21 de la Carta lo convierte en norma. Aquí está el motivo práctico.

| Se dice | No se dice | Por qué |
|---|---|---|
| «Programación, IA y emprendimiento» | «Curso de IA» | Atraería a quien busca una moda y decepcionaría a quien quiere construir algo. Además sería falso: la IA es la herramienta, no el objeto. |
| «Aprenderás a dirigir y auditar el código que escriben los agentes» | «Aprenderás a programar» | Es lo que de verdad ocurre, y es más difícil y más valioso que lo segundo. |
| «Saldrás con la estructura base de tu emprendimiento» | «Saldrás siendo desarrollador» | El D2 §3.3 lo prohíbe expresamente. |
| «Diez plazas, gratis, y hay que trabajar ocho horas por semana» | «Formación gratuita y flexible» | La exigencia declarada filtra mejor que cualquier prueba de admisión. |

**Posicionamiento en una frase, para uso interno:** *no vendemos un curso de inteligencia
artificial; damos bases técnicas, uso serio de herramientas modernas y el empujón para dar
los primeros pasos de un negocio propio.*

### 6 · Los siete diferenciadores

| # | Diferenciador | Por qué es difícil de imitar |
|---|---|---|
| **1** | **Cinco semanas iniciales sin ninguna IA.** El criterio se construye antes de abrir la herramienta. | Va en contra de la tendencia del sector y exige sostener una posición pedagógica argumentada. |
| **2** | **Forma arquitectos, no programadores.** Enseña a especificar, dirigir y auditar agentes, que es el perfil escaso. | Exige un mecanismo de verificación de autoría que casi nadie tiene. |
| **3** | **Defensa Aleatoria de Autoría** en lugar de vigilancia algorítmica. | Exige docentes que conozcan el código de cada estudiante. No escala por software. |
| **4** | **El proyecto es un emprendimiento real**, definido en la semana 2 y lanzado en la 16, marca y modelo de negocio incluidos. | Exige rediseñar el currículo entero alrededor de la Transferencia semanal. |
| **5** | **Auditoría Técnica con umbrales públicos** alineada al Acta Europea de Accesibilidad. | Exige que el propio instituto opere a ese nivel, cosa que Elysium λ ya hace con clientes. |
| **6** | **Gratuidad total como acción social**, sin tramos ni versión reducida. | No se copia: se decide. Exige financiar el programa con otra actividad. |
| **7** | **Aula de diez por decisión, no por falta de demanda.** | Es lo contrario de lo que hace un negocio educativo, y sostiene los seis anteriores. |

### 7 · Lo que el Instituto no ofrece, y lo dice

No hay garantía de empleo, no hay bolsa de trabajo, no hay título oficial, no hay marcos
de trabajo de moda como eje del currículo, y no hay ruta rápida.

Y hay que decir con precisión qué son las cuatro horas: **el Instituto imparte cuatro
horas de clase a la semana, y el estudiante dedica otras cuatro por su cuenta**. Quien
sólo pueda asistir a las clases y no estudiar entre ellas no debe presentarse, porque el
método no funcionará para él y ocupará una de las diez plazas. En un programa gratuito eso
importa más: la plaza que ocupa quien no va a terminar es la plaza que no ocupó otra
persona.

---

## PARTE III · EL PROBLEMA DEL HORARIO

### 8 · Planteamiento

Hay que elegir una franja de dos horas, sábado y domingo, que sirva simultáneamente a
catorce husos horarios efectivos, desde Tijuana (UTC−8 o −7) hasta Guinea Ecuatorial
(UTC+1), con un docente en Portugal. La conveniencia horaria del docente no es una
restricción: la variable a optimizar es la del estudiantado.

### 9 · Modelo

**Variable de decisión.** Hora UTC de inicio del bloque de dos horas, idéntica sábado y
domingo, para no fragmentar el hábito.

**Función de utilidad.** A cada hora local se le asigna una utilidad pedagógica en [0, 1]
construida sobre tres componentes: una **curva base** de disponibilidad y estado cognitivo
en fin de semana; una **penalización por comida principal**, con ventana propia por región
cultural, porque el almuerzo de fin de semana es un ritual familiar y no un hueco libre; y
una **penalización por tope social nocturno**, distinto por región.

**Ponderación.** Se evalúan **dos** ponderaciones independientes para comprobar la
robustez: población hispanohablante por huso, y demanda esperada de formación técnica en
línea. El resultado es idéntico en ambas.

**Regímenes estacionales.** Se evalúan por separado el invierno y el verano boreales,
incorporando los regímenes propios de Chile y de Cuba. Paraguay se modela en **UTC−3
permanente** conforme a la ley que eliminó el cambio estacional en 2024.

**Especificación completa.** El programa se conserva en `horario.py` y se publica para que
cualquiera pueda cambiar los supuestos y comprobar si el resultado cambia.

### 10 · Resultado

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

**Óptimo: 15:00–17:00 UTC**, con margen claro y con el mismo ganador bajo las dos
ponderaciones y los dos regímenes estacionales.

### 11 · Decisión de anclaje: UTC fijo todo el año

| Política | Índice invierno | Índice verano | Media |
|---|:---:|:---:|:---:|
| **A · 15:00 UTC fijo** (América Latina nunca cambia; Iberia se desplaza) | 0,928 | 0,931 | **0,929** |
| B · 16:00 Lisboa fijo (Iberia estable; América Latina se desplaza) | 0,845 | 0,931 | 0,888 |

**Se adopta la política A.** La razón es estructural: la mayor parte del mundo
hispanohablante **abolió el cambio de hora estacional**, mientras que Portugal y España lo
mantienen. Anclar a UTC hace que el desplazamiento lo absorban las dos únicas zonas que sí
cambian, y que además son las del docente. Es también la política más simple de comunicar:
*la clase es siempre a las 15:00 UTC*.

### 12 · Tabla de conversión oficial

#### 12.1 · Invierno boreal · noviembre a marzo

| Huso | Territorios | Hora local | Valoración |
|:---:|---|---|:---:|
| UTC−8 | Tijuana y Baja California, Pacífico de EE. UU. | 07:00–09:00 | Temprano |
| UTC−7 | Pacífico de México, Baja California Sur | 08:00–10:00 | Bien |
| UTC−6 | **México (centro), Guatemala, El Salvador, Honduras, Nicaragua, Costa Rica** | **09:00–11:00** | **Óptimo** |
| UTC−5 | **Colombia, Perú, Ecuador, Panamá, Cuba** | **10:00–12:00** | **Óptimo** |
| UTC−4 | Venezuela, Bolivia, República Dominicana, Puerto Rico | 11:00–13:00 | Muy bien |
| UTC−3 | **Argentina, Uruguay, Paraguay, Chile** | **12:00–14:00** | Aceptable · roza la comida |
| UTC+0 | **Portugal (sede)** | **15:00–17:00** | Óptimo |
| UTC+1 | **España**, Guinea Ecuatorial | **16:00–18:00** | Óptimo |

#### 12.2 · Verano boreal · abril a octubre

| Huso | Territorios | Hora local | Valoración |
|:---:|---|---|:---:|
| UTC−7 | Tijuana, Pacífico de México y de EE. UU. | 08:00–10:00 | Bien |
| UTC−6 | **México (centro) y Centroamérica** | **09:00–11:00** | **Óptimo** |
| UTC−5 | **Colombia, Perú, Ecuador, Panamá** | **10:00–12:00** | **Óptimo** |
| UTC−4 | Venezuela, Bolivia, Chile, Caribe | 11:00–13:00 | Muy bien |
| UTC−3 | **Argentina, Uruguay, Paraguay** | **12:00–14:00** | Aceptable · roza la comida |
| UTC+1 | **Portugal (sede)** | **16:00–18:00** | Óptimo |
| UTC+2 | **España**, Guinea Ecuatorial | **17:00–19:00** | Óptimo |

### 13 · Los dos perjuicios reconocidos y su compensación

| Perjudicado | Perjuicio | Compensación |
|---|---|---|
| **Cono Sur** (Argentina, Uruguay, Paraguay, Chile en verano austral) | La franja 12:00–14:00 invade la comida familiar. | **Asistencia diferida** del art. 47 de la Carta, hasta el 25 % de las sesiones. Tutoría opcional los martes a las 22:00 UTC. |
| **Pacífico norte** (Tijuana, Baja California, diáspora en la costa oeste de EE. UU.) | 07:00–09:00 en invierno boreal es temprano. | Mismo mecanismo. Es además la zona con menor peso de matrícula esperada, lo que hace el compromiso defendible. |

---

## PARTE IV · CALENDARIO

### 14 · La regla permanente

El año académico coincide con el año natural. El Instituto imparte **tres generaciones por
año**: la primera inicia el **segundo sábado de enero**, y las tres se suceden con **un fin
de semana de receso entre ellas**. La tercera cierra en diciembre.

De 52 fines de semana del año, **48 son lectivos y 3 de receso**. El **Módulo 0** de cada
generación se abre seis semanas antes de su semana 1, lo que significa que el Módulo 0 de
una generación transcurre durante las últimas semanas de la anterior. Es asíncrono y sin
docente, de modo que no genera solapamiento de docencia.

### 15 · Las nueve generaciones de los tres primeros años

| Generación | Módulo 0 se abre | Semana 1 | Semana 16 · Demo Day |
|---|---|---|---|
| **Λ27-1** | 28-XI-2026 | **9-I-2027** | **24-IV-2027** |
| **Λ27-2** | 27-III-2027 | **8-V-2027** | **21-VIII-2027** |
| **Λ27-3** | 24-VII-2027 | **4-IX-2027** | **18-XII-2027** |
| **Λ28-1** | 27-XI-2027 | **8-I-2028** | **22-IV-2028** |
| **Λ28-2** | 25-III-2028 | **6-V-2028** | **19-VIII-2028** |
| **Λ28-3** | 22-VII-2028 | **2-IX-2028** | **16-XII-2028** |
| **Λ29-1** | 2-XII-2028 | **13-I-2029** | **28-IV-2029** |
| **Λ29-2** | 31-III-2029 | **12-V-2029** | **25-VIII-2029** |
| **Λ29-3** | 28-VII-2029 | **8-IX-2029** | **22-XII-2029** |

**Nueve generaciones en tres años.** Con diez estudiantes por aula, **noventa personas
formadas**; con quince, hasta ciento treinta y cinco.

### 16 · Transiciones de horario que caen en fin de semana lectivo

Con el anclaje a UTC, **ninguna afecta a América Latina continental**: sólo se desplaza el
reloj de pared de quienes viven en un territorio que todavía cambia de hora. Se anuncian
por escrito la semana previa.

| Fecha (domingo) | Generación y semana | Qué ocurre |
|---|---|---|
| 14-III-2027 | Λ27-1, semana 10 | Estados Unidos y Cuba adelantan |
| 28-III-2027 | Λ27-1, semana 12 | Europa adelanta |
| 4-IV-2027 | Λ27-1, semana 13 | Chile retrasa |
| 5-IX-2027 | Λ27-3, semana 01 | Chile adelanta |
| 31-X-2027 | Λ27-3, semana 09 | Europa retrasa |
| 7-XI-2027 | Λ27-3, semana 10 | Estados Unidos y Cuba retrasan |

Las fechas de años posteriores se recalculan con `horario.py` al publicar cada calendario
anual.

### 17 · Ciclo anual de la convocatoria

**Una sola convocatoria al año, de la que salen las tres generaciones.** Es la decisión
administrativa más importante del manual: una sola rúbrica, una sola comparación, un solo
momento de trabajo de selección, y mucho más justo que comparar candidaturas contra pozos
distintos tres veces al año.

| Mes | Acción |
|---|---|
| **Octubre** | Publicación de la convocatoria, de la rúbrica de selección y del número de plazas del año siguiente |
| **Octubre y noviembre** | Tres sesiones informativas en directo, en la franja de **15:00 UTC** |
| **Primera semana de noviembre** | Cierre de solicitudes y Prueba de Disposición λ |
| **Noviembre** | Entrevistas de 20 minutos a las personas preseleccionadas |
| **Última semana de noviembre** | **Resolución motivada a todas las personas candidatas**, con asignación de generación |
| **Diciembre a julio** | Cada persona cursa su Módulo 0 en las seis semanas previas a su generación |

**Asignación de generación.** Cada persona admitida declara en qué franja del año puede
comprometerse, y la Secretaría asigna procurando respetar la preferencia. Quien no pueda
sostener el compromiso en su generación puede pedir traslado a otra del mismo año sin
perder la plaza: es una ventaja directa de tener tres cohortes.

---

## PARTE V · COSTE DEL PROGRAMA Y SU FINANCIACIÓN

> El programa es **gratuito para el estudiante** (Carta, art. 3) y por tanto no tiene
> ingresos, facturación ni reembolsos. Lo que sí tiene es **coste**, y el art. 70 obliga a
> declararlo y publicarlo cada año.

### 18 · Qué significa exactamente «gratuito»

| Concepto | Quién lo paga |
|---|---|
| Docencia, materiales, evaluación, tutoría, auditoría, certificado | **Elysium λ Development & Research** |
| Entorno de desarrollo en la nube durante el programa | **Elysium λ Development & Research** |
| Alojamiento del proyecto durante 12 meses tras graduar | **Elysium λ Development & Research** |
| Ordenador y conexión a internet del estudiante | El estudiante (requisito de admisión) |
| Dominio propio del proyecto, si lo quiere | El estudiante, opcionalmente y después de graduar |

No hay matrícula, mensualidad, cuota de examen ni coste de materiales. No existe tampoco
la figura de la beca parcial, porque no existe la del pago: **todas las plazas son
gratuitas y por tanto ninguna es una beca**. La palabra correcta es acción social.

### 19 · Coste monetario anual

Supuestos: tres generaciones de doce personas, un aula simultánea.

| Concepto | Por generación | Anual (×3) |
|---|---:|---:|
| Plataforma de videoconferencia y aula virtual con subtitulado | 150 € | 450 € |
| Servicios en la nube para laboratorios y Módulo 0 | 250 € | 750 € |
| Herramientas de auditoría y licencias de desarrollo | — | 400 € |
| **Auditor externo de defensas** (12 sustentaciones) | 600 € | 1 800 € |
| **Miembro externo del Comité de Ética** | — | 600 € |
| Alojamiento de los proyectos graduados durante 12 meses | 250 € | 750 € |
| Depósito de datos, código y preprint de la investigación | — | 0 € |
| **Total en dinero** | | **≈ 4 750 €** |

**Partida de riesgo declarada.** Si la revista de destino de la investigación exige tasa de
publicación en acceso abierto, el importe puede oscilar entre 0 y 2 000 €. El Instituto
prioriza destinos sin tasa; en el peor caso el preprint ya está publicado sin coste.

### 20 · Coste en tiempo, y por qué los tutores pares no son opcionales

Es la partida grande y la que suele omitirse. El art. 70.4 obliga a declararla.

| Actividad | Horas por generación |
|---|---:|
| Docencia síncrona (32 sesiones de 2 h) | 64 h |
| Actualización de materiales | 20 h |
| Retroalimentación escrita en 7 días, 12 estudiantes | 60 h |
| Tutorías individuales (5 por estudiante) | 17 h |
| Defensas Aleatorias de Autoría (4 por estudiante) | 8 h |
| Auditorías técnicas y sustentaciones | 20 h |
| Acompañamiento del Módulo 0 | 12 h |
| **Subtotal por generación** | **201 h** |
| **× 3 generaciones** | **603 h** |
| Convocatoria anual única y administración | 60 h |
| Investigación del profesorado (D6), fuera de periodo lectivo | 90 h |
| **TOTAL ANUAL** | **≈ 753 h ≈ 14,5 h por semana** |

> ### La consecuencia que hay que decir en voz alta
>
> Tres generaciones al año son **48 fines de semana lectivos de 52**. Sostenerlas al
> ritmo de la tabla anterior no es realista para una sola persona que además dirige una
> empresa y cursa una licenciatura.
>
> **Por eso los tutores pares del art. 40 de la Carta no son una figura decorativa: son
> la condición de viabilidad del calendario.** Las dos partidas delegables son la
> **retroalimentación** (60 h) y las **tutorías** (17 h), que suman 77 h por generación y
> 231 h al año. Con dos tutores pares formados entre los graduados con mención, la carga
> propia baja a unas **520 h anuales**, es decir a **10 h por semana**.
>
> **Regla operativa:** la generación **Λ27-1 se imparte sin tutores** porque todavía no
> existen graduados. A partir de **Λ27-2** el Instituto convoca tutores pares en cada
> generación, y **si no los consigue, reduce a dos generaciones ese año**. La calidad del
> acompañamiento no se sacrifica para sostener el número de cohortes.

### 21 · Sostenibilidad y salvaguardas

**Fuente de financiación.** La actividad comercial de Elysium λ Development & Research. El
coste de cada generación se provisiona íntegro antes de abrir su Módulo 0.

**Las tres salvaguardas.** Se repiten aquí porque son la parte del diseño que más
fácilmente se erosiona con el tiempo:

1. **Ninguna plaza, calificación ni certificado** se condiciona a la contratación de
   servicios de la empresa (Carta, art. 70.2).
2. **Ninguna oferta comercial** se dirige a un estudiante mientras lo sea, y al graduado
   sólo después de emitido su certificado y nunca por quien lo evaluó (art. 73).
3. **Las donaciones** se rigen por el art. 72: nunca de estudiantes ni de candidatos,
   nunca condicionadas, siempre publicadas.

### 22 · Reconocimiento oficial

| Asunto | Situación |
|---|---|
| **Certificación DGERT** | **Prioritaria.** Es requisito para acceder a financiación pública de formación, y esa financiación es exactamente lo que un programa gratuito necesita para no depender de un solo pagador privado. |
| **Uso del término «instituto» y del certificado** | **Riesgo alto.** La gratuidad no autoriza a describir como titulación lo que no lo es. Sigue siendo la revisión legal más urgente (Carta, art. 9). |
| **Donaciones** | Requieren asesoría fiscal previa; pueden aconsejar una figura separada sin ánimo de lucro (art. 72). |

---

## PARTE VI · SELECCIÓN, RIESGOS E INDICADORES

### 23 · La rúbrica de selección

Pública desde la apertura de la convocatoria, y aplicada sin excepción.

| Criterio | Peso | Qué se valora | Qué **no** se valora |
|---|:---:|---|---|
| **Disposición demostrada** | 30 % | Resultado en la Prueba de Disposición λ: razonamiento lógico y comprensión lectora técnica | Conocer ya un lenguaje de programación |
| **Viabilidad horaria real** | 25 % | Que las 8 h semanales existan de verdad en su vida, no como buena intención | Disponibilidad total; se busca a quien trabaja |
| **Situación de acceso** | 25 % | Distancia real que le separa de una oportunidad equivalente: renta, geografía, cargas familiares, ausencia de red profesional | La necesidad declarada sin contexto |
| **Claridad del proyecto** | 20 % | Que sepa qué quiere construir y para quién, aunque sea de forma imperfecta | Que la idea sea brillante o novedosa |

**Regla explícita:** el conocimiento previo de programación **no puntúa** (Carta,
art. 71.2).

**Devolución obligatoria.** Toda persona no admitida recibe la razón concreta de su no
admisión y qué la haría admisible el año siguiente. Es la parte más costosa del proceso en
tiempo y la que más define el carácter del Instituto.

### 24 · Volumen previsto de la convocatoria

Cifras de planificación, no promesas. Se revisarán con datos reales.

| Etapa | Previsión anual |
|---|---:|
| Personas que ven la convocatoria | 5 000 – 15 000 |
| Solicitudes iniciadas | 200 – 500 |
| Solicitudes completas con Prueba de Disposición | 90 – 200 |
| Entrevistas realizadas | 50 – 70 |
| **Plazas ofrecidas** (tres generaciones) | **36** |
| **Plazas ocupadas** | **30 – 36** |

Se ofrecen doce plazas por generación para un aula ideal de diez, previendo dos renuncias.
Si se ocupan las quince del máximo, no se amplía: se cierra (Carta, art. 46).

### 25 · Difusión

No es marketing: es alcanzar a quien la rúbrica quiere encontrar, que por definición es
quien menos expuesto está a este tipo de convocatorias.

1. **Organizaciones de base**: asociaciones de personas autónomas, cooperativas, entidades
   de inclusión digital, bibliotecas públicas y centros comunitarios.
2. **Las instituciones asociadas**, para difusión y sólo para difusión (Carta, art. 10).
3. **El propio sitio y el portafolio de Elysium λ**, que demuestra en producción lo que el
   programa enseña.
4. **Contenido técnico en abierto**: auditorías reales de accesibilidad publicadas con su
   metodología.
5. **Comunidades hispanohablantes de desarrollo**, útiles pero sesgadas hacia quien ya está
   dentro del sector; se usan con conciencia de ese sesgo.
6. **Referencia de graduados**, operativa desde la segunda generación y que a medio plazo
   debería ser el canal dominante.

### 26 · Riesgos

| Riesgo | Prob. | Impacto | Mitigación |
|---|:---:|:---:|---|
| **Tres generaciones al año agotan al profesorado.** | **Alta** | **Muy alto** | Tutores pares obligatorios desde Λ27-2; reducción a dos generaciones si no se consiguen (§20). |
| **Todo el programa depende de una sola persona.** | Alta | **Muy alto** | Grabación íntegra; materiales escritos completos y reutilizados tres veces al año; tutores pares; docente suplente identificado. |
| El Módulo 0 no se completa y la semana 4 resulta inabordable | Alta | Alto | Punto de control; sesión opcional; traslado a la generación siguiente, que empieza en pocas semanas. |
| La gratuidad eleva el abandono | Media | Alto | Las cinco anclas no económicas del D1 §8.0 y la selección estricta. |
| Percepción de arbitrariedad en la selección | Media | Alto | Rúbrica pública anterior a la convocatoria, devolución motivada individual, archivo de decisiones a disposición del Comité de Ética. |
| Confusión con una titulación oficial | Media | **Muy alto** | Art. 9 aplicado a web, convocatoria y certificado. Revisión legal previa. |
| Conflicto de interés al convertir estudiantes en clientes | Media | **Muy alto** | Art. 73, auditado por el Comité de Ética cada año. La gratuidad **aumenta** este riesgo. |
| No se cubren las plazas de una generación | Baja | Medio | Umbral mínimo de apertura: **6 estudiantes**; por debajo se traslada a la generación siguiente. |

### 27 · Indicadores y metas

Se publican cada año conforme al art. 18 de la Carta, con metodología declarada y sin
cambiarla entre periodos.

| Indicador | Meta | Cómo se mide |
|---|:---:|---|
| Plazas ocupadas por generación | ≥ 10 | Compromisos λ firmados |
| Finalización del Módulo 0 | ≥ 85 % | Punto de control superado |
| Retención al cierre del Nivel I (semana 5) | ≥ **90 %** | Matrícula activa |
| Retención al cierre del Nivel II (semana 10) | ≥ **80 %** | Matrícula activa |
| Graduación sobre plazas ocupadas | ≥ **70 %** | Hito H superado |
| Superación de la ATE en primer intento (G3) | ≥ 70 % | Informe del Comité de Auditoría Técnica |
| Proyectos en producción a los 6 meses de graduar | ≥ 60 % | Comprobación de URL viva |
| Experimentos de validación con datos reales (semana 13) | ≥ 80 % | Entrega `T13` |
| Satisfacción con el horario (ítem 8 de la encuesta) | ≥ 4,0 / 5 | Encuesta de percepción λ |
| **Coste monetario por persona graduada** | Publicado, sin meta | Coste total ÷ graduados |
| **Horas donadas por persona graduada** | Publicado, sin meta | Horas totales ÷ graduados |
| Personas no admitidas con devolución motivada | **100 %** | Registro de la convocatoria |

Los dos indicadores de coste se publican **sin meta asociada** de forma deliberada: su
función no es optimizarse a la baja, sino hacer visible qué cuesta realmente formar a una
persona de este modo.

### 28 · Fuentes

- Páginas públicas de precios y resultados de las alternativas citadas en §4.
- Council on Integrity in Results Reporting: estándares de reporte de resultados.
- DGERT (Portugal): requisitos y guía de certificación de entidades formadoras.
- Recomendación del Consejo de la UE de 16 de junio de 2022 sobre microcredenciales.
- Directiva (UE) 2019/882 y norma EN 301 549.
- Ley n.º 7354 de 2024 de Paraguay, que establece el huso UTC−3 permanente.
- Modelo horario propio: `horario.py`, con sus supuestos y su barrido completo.

---

*Elysium λ Institute of Development & Research · D5 · «Abstrahere, aedificare, probare.»*




<div class="salto"></div>

# D6 · Protocolo de Investigación

<p class="doc-sub">Las tres líneas del programa de investigación 2026–2031</p>
<p class="doc-file">Fichero: <code>ELYSIUM-INSTITUTE/D6-PROTOCOLO-DE-INVESTIGACION.md</code></p>

> **Cómo leer este documento.** Describe la línea de investigación que el Instituto
> conduce y firma, con los estudiantes como **sujetos anónimos y voluntarios de carga
> cero**. La Parte I fija los principios y la regla que lo hace legítimo. La Parte II
> elige la línea y explica por qué ésta y no otra. La Parte III especifica los tres
> estudios. La Parte IV trata la ética, que aquí es el punto delicado. La Parte V
> contiene el calendario plurianual y la estrategia de publicación.
>
> Lo aprueba y lo reforma el **Comité de Ética e Integridad Científica** (Carta, arts. 25
> y 79).
>
> **Compromiso declarado, en tres frases exactas.**
>
> 1. El Instituto **sí se compromete a publicar** un **preprint con identificador
>    persistente**, junto con los datos anonimizados y el código de análisis.
> 2. El Instituto **sí se compromete a enviar** el manuscrito a una revista o congreso.
> 3. El Instituto **no se compromete a que lo acepten**. La revisión por pares tarda
>    entre seis y doce meses y su resultado no está en nuestras manos (Carta, art. 55).

---

## PARTE I · PRINCIPIOS

### 1 · La regla de carga cero

> **Ninguna actividad de esta investigación puede añadir trabajo al estudiante más allá
> de veinte minutos en las dieciséis semanas.**

Es la regla que hace legítimo el estudio, y se cumple por diseño y no por buena voluntad:
**casi todos los datos ya existen** porque el modelo académico los produce por razones
pedagógicas propias.

Las predicciones de PRIMM se recogen desde la semana 1 porque son un espejo metacognitivo
para el estudiante. Las declaraciones `AI-USE.md` existen porque el art. 57 de la Carta las
exige. Las Defensas Aleatorias de Autoría se convocan porque son el mecanismo de
integridad. La predicción de la puntuación de auditoría antes de mirar el informe está en
el syllabus porque enseña calibración. Los quices son a nivel N0 y los laboratorios del
Nivel II a nivel N3, de modo que la comparación entre desempeño asistido y no asistido
está incorporada al currículo.

**La investigación no crea instrumentos nuevos: lee los que ya funcionan.** Ése es todo su
mérito metodológico y toda su justificación ética.

### 2 · Los seis principios

1. **Carga cero para el estudiante** (§1).
2. **Ningún dato influye en ninguna calificación.** El análisis se ejecuta **después** de
   emitidos los certificados (§12). Es la salvaguarda central del doble rol de docente e
   investigador.
3. **Participación voluntaria y revocable** en cualquier momento, sin consecuencia
   académica y sin dar explicaciones.
4. **Preinscripción antes de mirar los datos**, y publicación de los resultados adversos
   con la misma diligencia que los favorables.
5. **Datos anonimizados, código y preprint abiertos**, con identificador persistente.
6. **Una sola línea coherente durante cinco años**, no una colección de estudios sueltos.

---

## PARTE II · LA LÍNEA Y POR QUÉ ÉSTA

### 3 · El activo que el Instituto posee y casi nadie tiene

Un programa de investigación se construye sobre un activo. El del Instituto es inusual y
conviene nombrarlo con precisión:

| Activo | Detalle |
|---|---|
| **Cohortes repetidas y comparables** | Tres generaciones al año, nueve en tres años: entre 90 y 135 sujetos con **el mismo currículo, el mismo instrumento y el mismo docente**. |
| **Una línea base sin IA** | Las semanas 1 a 5 son de nivel **N0**. Casi ningún estudio dispone de una medición limpia del desempeño de un novato **antes** de que toque una herramienta generativa. |
| **Una intervención documentada y escalonada** | La Escalera de IA (N0 → N3 → N4) tiene fechas de apertura conocidas y contrapesos declarados. Es una intervención, no un uso difuso. |
| **Métricas objetivas de calidad** | La Auditoría Técnica Elysium mide accesibilidad, rendimiento y seguridad con umbrales públicos. La calidad del producto no depende del juicio del investigador. |
| **Verificación de autoría** | La Defensa Aleatoria de Autoría distingue comprender de obtener, cuatro veces por estudiante. |
| **Población hispanohablante** | Sujetos que dirigen agentes **en español**, sobre modelos entrenados mayoritariamente en inglés. |

La última fila es la que convierte un estudio de educación en informática en algo más
grande, y es la que se explica en el §4.

### 4 · La pregunta que une todo

Los modelos de lenguaje se entrenan de forma abrumadoramente mayoritaria en inglés. La
documentación técnica, los mensajes de error, los nombres de las funciones y el propio
razonamiento interno de los modelos están sesgados hacia esa lengua. La tokenización
penaliza al español, que necesita más unidades para decir lo mismo, lo que encarece cada
consulta y consume antes la ventana de contexto.

Sobre esa asimetría se puede formular una pregunta que casi nadie está en condiciones de
responder empíricamente:

> **¿Existe una penalización lingüística en la programación asistida por inteligencia
> artificial? Y si existe, ¿cuánto cuesta, en dinero, en calidad del código y en
> comprensión de quien aprende?**

Esa pregunta tiene tres capas, y cada una corresponde a una parte del itinerario académico
de la Dirección Académica:

| Capa | Disciplina | Corresponde a |
|---|---|---|
| **Empírica** · ¿cuánto cuesta la asimetría? | Interacción persona-computador, ingeniería de software | Máster de investigación en inteligencia artificial |
| **Pedagógica** · ¿cómo afecta a quien aprende? | Educación en informática | Experiencia docente e investigadora acreditable |
| **Política** · ¿qué significa para una Europa de 24 lenguas y para América Latina? | Estudios europeos, geopolítica, soberanía digital | Licenciatura en Línguas Aplicadas aos Estudos Europeus e à Geopolítica, y doctorado en sistemas inteligentes |

**Ésa es la coherencia del programa.** No son tres intereses dispersos que hay que
justificar por separado: son tres niveles de análisis de un mismo objeto, y la licenciatura
en curso proporciona el marco teórico de la tercera capa, que es la que normalmente falta
en una tesis de informática y la que hace distinguible una candidatura doctoral.

### 5 · Las tres líneas

| Línea | Título | Papel | Publicación prevista |
|:---:|---|---|---|
| **A** | **Asimetría lingüística en la dirección de agentes de programación** | Núcleo empírico. Es la línea que da la disertación de máster. | 2028 |
| **B** | **La Escalera de IA: deuda epistémica y calibración metacognitiva en programadores novatos** | Línea pedagógica. Es la que produce publicación antes y acredita la experiencia docente e investigadora. | 2027 |
| **C** | **Soberanía lingüística en la infraestructura digital europea e iberoamericana** | Marco político. Es el encuadre de la propuesta doctoral. | 2029–2030 |

Las tres comparten sujetos, instrumento y datos. **No triplican el trabajo: lo estratifican.**

---

## PARTE III · ESPECIFICACIÓN DE LOS ESTUDIOS

### 6 · Línea B · La Escalera de IA *(primera en ejecutarse)*

Se ejecuta primero porque no requiere ningún cambio en el currículo: los datos ya se
generan. Produce publicación en el primer año y acredita experiencia investigadora antes de
que empiece el máster.

#### 6.1 · Preguntas

| Cód. | Pregunta |
|---|---|
| **B-1** | ¿Cómo evoluciona la **brecha** entre el desempeño sin asistencia (quices, N0) y el desempeño asistido (laboratorios, N3 y N4) a lo largo de las quince semanas? |
| **B-2** | ¿Mejora la **calibración metacognitiva**, medida como el error entre la puntuación de auditoría que el estudiante predice y la que obtiene? |
| **B-3** | ¿La **calidad de la declaración `AI-USE.md`**, y en particular el número y la sustancia de los rechazos justificados, predice el resultado en la Defensa Aleatoria de Autoría? |
| **B-4** | ¿Se observa **divergencia** entre estudiantes, es decir, que la apertura de N3 en la semana 6 beneficie a unos y perjudique a otros según su regulación metacognitiva inicial? |
| **B-5** | ¿La clasificación de la Transferencia como *transferida* o *trasplantada* funciona como **indicador temprano** de un resultado adverso en la Defensa de Autoría? |

**B-3 y B-5 son las de mayor valor práctico.** Si se confirman, entregan a cualquier
institución dos señales baratas y tempranas para detectar delegación acrítica sin recurrir
a vigilancia algorítmica, que es un problema abierto y urgente.

#### 6.2 · Hipótesis preinscritas

| Cód. | Hipótesis | Criterio de refutación |
|---|---|---|
| **HB-1** | La brecha N0 frente a N3 **no crecerá** significativamente tras la apertura de N3. | Un crecimiento significativo la refuta, y sería evidencia en contra del diseño del programa. |
| **HB-2** | El error de calibración disminuirá entre la semana 12 y las mediciones previas. | Ausencia de disminución la refuta. |
| **HB-3** | El número de rechazos justificados en `AI-USE.md` correlacionará positivamente con el resultado en la DAA. | Correlación nula o negativa la refuta. |
| **HB-4** | La regulación metacognitiva inicial moderará el efecto de la apertura de N3. | Ausencia de interacción significativa la refuta. |
| **HB-5** | Al menos el 60 % de los resultados adversos en DAA habrá tenido una Transferencia *trasplantada* en las tres semanas previas. | Una proporción menor la refuta. |

> **Sobre HB-1 y la honestidad del diseño.** Apuesta a favor del propio programa, y ése es
> un riesgo que se asume de forma expresa. Si la brecha crece, el resultado dice que la
> Escalera de IA no protege lo que dice proteger, **se publica igual** y se reforma el D1
> §6 antes de la generación siguiente. El protocolo existe para poder descubrir esto.

#### 6.3 · Variables y su procedencia

| Variable | De dónde sale | ¿Añade carga? |
|---|---|:---:|
| Desempeño no asistido | Quices `Q01`–`Q15`, todos a N0 | No |
| Desempeño asistido | Laboratorios `L06`–`L15`, a N3 y N4 | No |
| **Línea base pura** | Laboratorios `L01`–`L05`, **a N0**: el desempeño antes de tocar ninguna herramienta | No |
| Error de calibración | Puntuación de auditoría predicha menos obtenida, semana 12 | No |
| Calidad de la declaración de IA | Recuento y codificación de los rechazos en `AI-USE.md` | No |
| Resultado de autoría | Actas de las cuatro DAA | No |
| Tipo de transferencia | Clasificación *transferida* / *trasplantada* (D3 §7) | No |
| Regulación metacognitiva | Cuestionario breve, dos veces | **Sí, 20 min** |
| Covariables | Experiencia previa declarada, país, tramo de edad, resultado del Módulo 0 | No |

#### 6.4 · Análisis

Modelos mixtos con el estudiante como efecto aleatorio y la semana como término temporal
para B-1 y B-2; correlación y regresión ordinal para B-3; término de interacción con la
regulación metacognitiva inicial para B-4; descriptiva con intervalo de confianza para B-5.
Corrección de Benjamini-Hochberg. Todo análisis no previsto se etiqueta como
**exploratorio**.

### 7 · Línea A · Asimetría lingüística *(núcleo del máster)*

Requiere una **modificación mínima del laboratorio**, que se declara y se somete al CEIC
antes de aplicarse.

#### 7.1 · La modificación, y por qué no vulnera la carga cero

En los laboratorios del Nivel II y III, la instrucción al agente se da en una lengua u
otra según un **contrabalanceo asignado por la Secretaría**: la mitad de las tareas se
dirigen en español y la mitad en inglés, alternando el orden entre estudiantes.

El estudiante **no hace trabajo adicional**: hace el mismo laboratorio, dirigiendo al
agente en la lengua que le toque esa semana. Y el ejercicio tiene valor formativo propio,
porque **descubrir en carne propia que el idioma cambia el resultado es una lección
profesional de primer orden** para alguien que va a trabajar con estas herramientas toda su
vida. Se le explica al final de cada generación, en la sesión de cierre.

#### 7.2 · Preguntas

| Cód. | Pregunta |
|---|---|
| **A-1** | ¿Cuál es la **penalización de tokenización** del español frente al inglés en instrucciones técnicas reales de programación, y cuánto encarece la misma tarea? |
| **A-2** | ¿Difiere la **calidad objetiva del código** producido, medida con los umbrales de la Auditoría Técnica Elysium, según la lengua de la instrucción? |
| **A-3** | ¿Difiere la **tasa de aceptación y de rechazo** del estudiante según la lengua? Es decir: ¿revisa con el mismo rigor lo que le llega tras una instrucción en su lengua materna que tras una en inglés? |
| **A-4** | ¿Difiere la **comprensión posterior**, medida en la Defensa Aleatoria de Autoría, del código producido en una u otra lengua? |
| **A-5** | ¿Modera el **nivel de inglés declarado** del estudiante los efectos anteriores? |

**A-4 es la pregunta central**, y es la que ninguna evaluación automática de modelos puede
responder: no mide qué produce el modelo, sino **qué entiende la persona de lo que el
modelo produjo**. Ahí es donde la lengua deja de ser un problema de coste y pasa a ser un
problema de aprendizaje y de equidad.

#### 7.3 · Hipótesis preinscritas

| Cód. | Hipótesis | Criterio de refutación |
|---|---|---|
| **HA-1** | El español consumirá al menos un 20 % más de tokens que el inglés para instrucciones técnicas equivalentes. | Una diferencia menor la refuta. |
| **HA-2** | No habrá diferencia significativa en la calidad objetiva del código (ATE) según la lengua de instrucción. | Una diferencia significativa la refuta, y sería el hallazgo más importante del estudio. |
| **HA-3** | La tasa de rechazo justificado será **mayor** cuando la instrucción se dio en español, por mayor comodidad de lectura crítica. | Igualdad o signo contrario la refutan. |
| **HA-4** | El resultado en DAA será **mejor** para el código producido tras instrucción en español. | Igualdad o signo contrario la refutan. |
| **HA-5** | El nivel de inglés declarado moderará HA-3 y HA-4. | Ausencia de interacción la refuta. |

#### 7.4 · Por qué esto importa más allá del aula

Si HA-2 se refuta, es decir, si **el código resultante es objetivamente peor cuando se
instruye en español**, la consecuencia excede la educación: significa que la
infraestructura digital construida con asistencia de IA en el mundo hispanohablante parte
de una desventaja medible, y eso es un argumento de política pública, no un dato
pedagógico. Si HA-2 se confirma y la diferencia está sólo en el coste y en la comprensión,
la conclusión es distinta pero igual de relevante: la barrera no es de calidad sino de
precio y de aprendizaje, y ambas son remediables.

En cualquiera de los dos casos hay resultado publicable, que es la marca de una pregunta
bien planteada.

### 8 · Línea C · Soberanía lingüística *(marco doctoral)*

No es un estudio empírico independiente: es el **encuadre** que convierte los resultados de
A y B en una contribución a los estudios europeos y a la geopolítica de la tecnología, que
es exactamente el territorio de la licenciatura en curso.

#### 8.1 · Preguntas

| Cód. | Pregunta |
|---|---|
| **C-1** | ¿Qué implica, para el objetivo de soberanía digital de la Unión Europea, que la producción de software esté mediada por modelos entrenados mayoritariamente en una sola lengua? |
| **C-2** | ¿Cómo se relaciona la asimetría medida en la Línea A con el régimen de las 24 lenguas oficiales de la Unión y con los instrumentos de accesibilidad y de mercado único digital? |
| **C-3** | ¿Qué posición ocupa América Latina en esa asimetría, siendo simultáneamente el mayor bloque hispanohablante y un consumidor neto de modelos desarrollados fuera? |
| **C-4** | ¿Qué medidas de política pública, europeas o iberoamericanas, se derivan de la evidencia de A y B? |

#### 8.2 · Método

Análisis documental y normativo (instrumentos de la Unión sobre inteligencia artificial,
accesibilidad, mercado único digital y política lingüística), combinado con la evidencia
empírica propia de las Líneas A y B. La contribución no es la revisión normativa, que
existe: es **aportar medición propia donde hasta ahora sólo hay declaraciones**.

---

## PARTE IV · ÉTICA

### 9 · El doble rol, que es el problema central

La Dirección Académica es a la vez **quien enseña, quien califica y quien investiga**. Esa
concentración es el mayor riesgo del programa y se mitiga con cinco reglas duras:

| # | Regla | Verificable por |
|:---:|---|---|
| 1 | **El análisis no se ejecuta hasta que los certificados están emitidos.** Los datos se recogen automáticamente y quedan sellados sin abrir. | Marca temporal del repositorio de datos |
| 2 | **La participación no se conoce durante el programa.** El consentimiento lo custodia la Secretaría y no se comunica al docente hasta el cierre. | Registro de la Secretaría |
| 3 | **La asignación de lengua de la Línea A la hace la Secretaría**, no el docente, y es ciega para él durante el laboratorio en la medida en que sea posible. | Registro de asignación |
| 4 | **Ningún dato del estudio entra en ninguna decisión académica**, ni de calificación, ni de admisión, ni de recomendación. | Auditoría del CEIC |
| 5 | **Un miembro externo del CEIC revisa el protocolo y el manuscrito** antes del envío (Carta, art. 25). | Dictamen escrito |

### 10 · Consentimiento

Voluntario, explícito, separado del Compromiso λ, y **revocable en cualquier momento sin
dar explicaciones y sin consecuencia académica alguna**. Se firma en el Módulo 0. Quien no
participe cursa el programa exactamente igual y nadie lo sabrá.

**Caso especial de la Línea A.** La asignación de lengua forma parte del diseño del
laboratorio y se aplica a toda el aula por igual, participe o no en el estudio, porque
tiene valor formativo propio (§7.1). Lo que requiere consentimiento es **el uso de sus
datos**, no la actividad.

### 11 · Datos personales

Seudonimización en el origen: la tabla que enlaza identidad con código de sujeto la
custodia la Secretaría, no la Dirección Académica, y se destruye al publicar. El conjunto
abierto no contiene país cuando el aula tenga menos de tres personas de esa nacionalidad,
para evitar reidentificación. Régimen aplicable: Reglamento (UE) 2016/679 y Ley n.º 8968
(Carta, art. 63).

### 12 · Limitaciones declaradas desde el protocolo

Se declaran aquí y se repiten en cada manuscrito. Un estudio que las oculta es peor que uno
que no las tiene.

| Limitación | Alcance | Qué se hace |
|---|---|---|
| **Muestra pequeña** | 10 a 15 por generación | El estudio se declara **exploratorio y de generación de hipótesis**. Énfasis en el análisis intra-sujeto. Los tamaños de efecto se reportan con intervalos amplios y sin lenguaje causal. La solución no es exagerar: es **acumular generaciones**. |
| **Sin grupo de control aleatorizado en la Línea B** | Sería inviable y poco ético: exigiría asignar a media aula a un régimen de IA que el Instituto considera peor. | Diseño intra-sujeto y replicación entre generaciones. |
| **Un solo docente** | Todo el efecto observado está confundido con la persona que enseña. | Se declara. Se mitiga parcialmente cuando entren tutores pares y, más adelante, un segundo docente. |
| **Autoselección** | Quien se presenta a una convocatoria gratuita no es una muestra de la población. | Se describen las características de cada cohorte y se comparan entre generaciones. |
| **Efecto de expectativa** | Los sujetos saben que el programa defiende su propia escalera de IA. | El análisis se ejecuta a ciegas respecto a la identidad y se preinscriben las hipótesis, incluida la que apuesta contra el programa. |

---

## PARTE V · CALENDARIO Y PUBLICACIÓN

### 13 · Cronograma plurianual

Todo el trabajo de análisis y redacción cae **fuera del periodo lectivo**, en los recesos y
en los meses de menor carga. Proteger contra el agotamiento es criterio de diseño de este
protocolo igual que lo es del académico.

| Periodo | Actividad | Producto |
|---|---|---|
| **Sep–nov 2026** | Redacción del protocolo, dictamen del CEIC, **preinscripción pública** antes de existir el primer dato | Protocolo registrado |
| **Dic 2026 – abr 2027** | Λ27-1. Recogida automática de la Línea B. Cero intervención del investigador. | Primer lote |
| **May–ago 2027** | Λ27-2, con la modificación de lengua de la Línea A ya dictaminada | Segundo lote |
| **Sep–dic 2027** | Λ27-3. Análisis del primer año en los huecos entre generaciones. | Tercer lote |
| **Ene–mar 2028** | Análisis y redacción de la **Línea B** con tres cohortes | **Preprint 1** |
| **2028** | Λ28-1/2/3. Acumulación de la Línea A. | Sexto lote |
| **Ene–jun 2029** | Análisis y redacción de la **Línea A** con seis cohortes | **Preprint 2** · base de la disertación de máster |
| **2029** | Λ29-1/2/3. Cierre de la serie de tres años. | Noveno lote |
| **2030** | Integración de A + B bajo el marco de la **Línea C** | **Preprint 3** · base de la propuesta doctoral |

**Carga estimada:** unas 90 horas anuales, concentradas fuera de las semanas lectivas.

### 14 · Autoría

| Posición | Quién | Criterio |
|---|---|---|
| **Primer autor** | Dirección Académica | Conceptualización, metodología, análisis, redacción |
| Coautoría | Quien contribuya sustantivamente en dos roles CRediT o más | Docentes, tutores o investigadores asociados |
| Agradecimientos | Las generaciones participantes, **de forma colectiva y sin nombres** | Protección de los sujetos |

**Los estudiantes no firman.** No es un demérito: es la consecuencia de que sean sujetos
del estudio. Firmar el trabajo que los estudia comprometería a la vez su libertad de
participar y la validez del resultado.

### 15 · Vocabulario obligatorio

Tres expresiones que el Instituto no puede usar como sinónimos, ni en el aula, ni en la
convocatoria, ni en el certificado:

| Expresión | Qué significa | ¿Se promete? |
|---|---|:---:|
| **Publicar el preprint** | Depositar el manuscrito en un repositorio abierto, con identificador persistente, citable desde ese día. | **Sí** |
| **Enviar** | Someter el manuscrito a una revista o congreso e iniciar la revisión por pares. | **Sí** |
| **Publicar en revista** | Que ese foro lo acepte tras revisión. Ocurre meses después, si ocurre. | **No** |

### 16 · Destino de cada línea

| Línea | Destino prioritario | Alternativas |
|---|---|---|
| **B** | Congreso internacional de investigación en educación en informática | Revista del área de informática y educación; informe técnico con identificador persistente |
| **A** | Foro de interacción persona-computador o de ingeniería de software con perspectiva humana | Revista de educación en informática; foro de recursos y evaluación lingüística |
| **C** | Revista de política tecnológica o de estudios europeos | Informe de posición del Instituto, en español y en inglés |

**Preprint siempre primero**, el mismo día del envío. Es lo único que no depende de nadie.

### 17 · Cómo este programa sirve al itinerario académico

Se hace explícito porque condiciona las prioridades y porque conviene que quede escrito y
no sólo entendido.

| Objetivo | Qué lo sostiene | Cuándo |
|---|---|---|
| **Experiencia docente acreditable** | Nueve generaciones, 32 sesiones cada una, con syllabus público, rúbricas y evaluación documentada | Continuo desde 2027 |
| **Experiencia investigadora acreditable** | Protocolo preinscrito, comité de ética con miembro externo, datos abiertos | Desde 2026 |
| **Admisión a máster de investigación en IA** | **Preprint 1** (Línea B) publicado y **Preprint 2** (Línea A) en curso, más la licenciatura en Engenharia Informática | Solicitud en 2028 |
| **Disertación de máster** | Línea A con seis cohortes acumuladas | 2029 |
| **Propuesta de doctorado en sistemas inteligentes** | Línea C como marco, A y B como base empírica, y la licenciatura en Línguas Aplicadas aos Estudos Europeus e à Geopolítica como fundamento teórico | 2030 |

> **La ventaja competitiva de esta candidatura, dicha sin rodeos.** Una propuesta doctoral
> en sistemas inteligentes firmada por alguien con formación en ingeniería informática **y**
> en lenguas aplicadas a los estudios europeos, que además llega con datos propios
> recogidos durante tres años sobre hablantes de español dirigiendo agentes de IA, no se
> parece a ninguna otra. La licenciatura en curso no es una distracción del objetivo
> doctoral: es la mitad del argumento.

---

## ANEXO · Consentimiento informado

```markdown
# Consentimiento · Investigación del Instituto · Generación ______

**Qué se estudia.** Cómo se aprende a dirigir agentes de inteligencia artificial: el
efecto de la Escalera de IA de este programa, y el efecto de la lengua en que se dirige al
agente.

**Qué se le pide.** Dos cuestionarios de diez minutos: uno en el Módulo 0 y otro después de
su sustentación. **Nada más.** El resto de la información procede de trabajos que usted ya
entrega como parte del programa.

**Sobre la lengua de los laboratorios.** En algunos laboratorios se le pedirá dirigir al
agente en español y en otros en inglés. Eso forma parte del diseño del curso y se aplica a
todo el aula, participe o no en el estudio, porque aprender que el idioma cambia el
resultado es una lección profesional útil. Lo que usted autoriza con esta firma es el **uso
de sus datos**, no la actividad.

**Qué NO ocurre.**
- Su participación **no afecta a ninguna calificación**, ni positiva ni negativamente.
- El docente **no sabrá si usted participa** hasta que el programa haya terminado y los
  certificados estén emitidos.
- Sus datos **no se publican con su nombre** ni con ningún dato que permita identificarle.
- Usted **no firma** el artículo, porque es sujeto del estudio y no investigador.

**Revocación.** Puede retirar este consentimiento cuando quiera, escribiendo a la
Secretaría Académica, sin dar explicaciones y sin ninguna consecuencia. Sus datos se
eliminarán del estudio.

  ☐ Consiento participar        ☐ No consiento participar

*(Marcar «no consiento» no tiene ningún efecto sobre su experiencia en el programa. Nadie
del profesorado lo sabrá.)*

Nombre: ____________  Firma: ____________  Fecha: ____________
```

---

*Elysium λ Institute of Development & Research · D6 · «Abstrahere, aedificare, probare.»*




<div class="salto"></div>

# D7 · Protocolo del Trabajo Final de Graduación

<p class="doc-sub">De la idea de la semana 1 al emprendimiento de la 16</p>
<p class="doc-file">Fichero: <code>ELYSIUM-INSTITUTE/D7-PROTOCOLO-TFG.md</code></p>

> **Cómo leer este documento.** Describe el recorrido completo del Trabajo Final de
> Graduación, que empieza en la semana 1 y termina en la 16. La Parte I fija su naturaleza
> y las reglas de elección del proyecto. La Parte II detalla las cuatro fases y sus
> compuertas. La Parte III contiene las rúbricas. La Parte IV especifica la memoria y la
> defensa. La Parte V trata propiedad intelectual y casos especiales.
>
> **La regla que gobierna todo el protocolo.** El proyecto no es una práctica de curso: es
> **la estructura base de un emprendimiento digital real**, y se construye desde el primer
> domingo con la misma calidad que tendría un proyecto de producción de Elysium λ. El
> código no sabe que es un ejercicio; para él, ya es el sitio del cliente.

---

## PARTE I · NATURALEZA Y ELECCIÓN

### 1 · Qué es el TFG Elysium λ

Un **emprendimiento digital en producción**, propiedad del estudiante, construido durante
16 semanas mediante la Transferencia dominical, auditado bajo los umbrales de la Auditoría
Técnica Elysium, con su marca, su modelo de negocio y su cumplimiento legal, acompañado de
una memoria técnica y defendido ante un panel con auditor externo.

No es una tesis. No es un prototipo. No es una demostración. Es un sistema que funciona,
que cumple la normativa aplicable y que alguien puede usar el lunes siguiente a la
graduación.

### 2 · Los cinco principios

1. **Un solo proyecto durante las 16 semanas.** Cambiar de proyecto reinicia el reloj y
   sólo se autoriza en las condiciones del §16.
2. **Cliente identificado.** Real o plausible, pero con nombre, contexto y problema
   concreto. Un proyecto «para pymes en general» no es admisible: no se puede diseñar para
   todo el mundo.
3. **Construcción incremental y continua.** Cada domingo el proyecto avanza. No hay semanas
   de acumulación seguidas de esfuerzos heroicos.
4. **Calidad de producción desde el primer archivo.** Sin carpetas llamadas «prueba», sin
   código muerto, sin datos de ejemplo incrustados, sin `console.log` de depuración.
5. **Autoría demostrable.** El estudiante puede explicar y modificar en vivo cualquier
   línea, en cualquier momento (Carta, art. 12).

### 3 · Los cinco arquetipos admisibles

Para que el currículo se aplique íntegro, el proyecto debe encajar en uno de estos
arquetipos. La restricción no limita la creatividad: canaliza el dominio de negocio hacia
una arquitectura que el programa enseña de verdad.

| # | Arquetipo | Ejemplos | Qué ejercita |
|:---:|---|---|---|
| **1** | **Servicio con cita previa** | Fisioterapia, peluquería, taller mecánico, clases particulares | Agenda, área privada, recordatorios |
| **2** | **Catálogo con pedido** | Comercio local, artesanía, alimentación, floristería | Catálogo, pedido, seguimiento |
| **3** | **Formación o contenido con acceso restringido** | Academia, taller, escuela de música, membresía | Matrícula, área privada, progreso |
| **4** | **Directorio o intermediación local** | Guía de comercios, asociación sectorial, bolsa de servicios | Fichas, búsqueda, contacto, moderación |
| **5** | **Gestión interna de una micro-organización** | Asociación, cooperativa, clínica pequeña, club deportivo | Panel con roles, registros, informes |

### 4 · Criterios de admisibilidad

| # | Requisito | Por qué |
|:---:|---|---|
| 1 | Requiere **autenticación** de al menos dos roles distintos | Sin ello no se ejercita el dominio D |
| 2 | Requiere **datos persistentes** en Firestore con operaciones completas | Sin ello no se ejercita el dominio C |
| 3 | Incluye al menos una **transacción**: reserva, pedido, matrícula o alta | Es el núcleo de la semana 11 |
| 4 | Tiene un **cliente identificable** con nombre y contexto | Principio 2 |
| 5 | Es **legal** en la jurisdicción del estudiante | Se verifica en G1 |
| 6 | **No trata datos de categoría especial** salvo con salvaguardas expresas | Ver §5 |
| 7 | Puede construirse dentro de las **capas gratuitas** de los servicios | Equidad de acceso (Carta, art. 16) |

### 5 · La regla de los datos sensibles

Varios arquetipos rozan datos de salud: una agenda de fisioterapia, una clínica pequeña, un
club deportivo. El Reglamento (UE) 2016/679 trata los datos de salud como **categoría
especial** y su tratamiento exige salvaguardas que exceden el alcance formativo del
programa.

**Regla dura.** Un TFG puede gestionar **metadatos de la cita** (quién, cuándo, qué
servicio, duración, precio, estado). **No puede almacenar contenido clínico**:
diagnósticos, historiales, notas de evolución ni datos de salud de ningún tipo. Si el
negocio real los necesita, se documenta en la memoria como funcionalidad **fuera de
alcance** con su justificación normativa, lo cual es en sí mismo un ejercicio profesional
valioso.

La misma regla se aplica a datos de menores, datos biométricos, datos financieros completos
y datos de afiliación sindical, religiosa o política.

---

## PARTE II · LAS CUATRO FASES

### 6 · Vista general

| Fase | Semanas | Qué produce | Compuerta |
|:---:|:---:|---|---|
| **F0 · Preparación** | Módulo 0 | Idea preliminar y entorno listo | — |
| **F1 · Anteproyecto** | 1–2 | Nicho, cliente, problema, propuesta de valor | **G1** (S02) |
| **F2 · Construcción** | 3–12 | Interfaz accesible, lógica, datos, acceso, transacción, auditoría | **G2** (S08) · **G3** (S12) |
| **F3 · Negocio y cumplimiento** | 13–15 | Modelo de negocio validado, marca, expediente legal, memoria | **G4** (S15) |
| **F4 · Defensa** | 16 | Demo Day y sustentación | **H** (S16) |

### 7 · Fase por fase

#### F0 · Preparación · Módulo 0

Trabajo asíncrono sin evaluación. Se entrega la nota de una página *«el negocio que quiero
construir»*. No es vinculante: su función es que la semana 1 empiece con material sobre el
que conversar.

#### F1 · Anteproyecto · Semanas 1 y 2

| Semana | Actividad | Producto |
|:---:|---|---|
| 1 | Repositorio personal con la idea declarada en cinco líneas | `README.md` inicial |
| 2 | Investigación de nicho, cliente concreto identificado, redacción de la Carta | **Carta de Anteproyecto** |

> **⚑ G1 · Carta de Anteproyecto.** Vence el domingo de la semana 2 a las 23:59 UTC.
> **Bloquea todas las Transferencias posteriores.** Plantilla en el Anexo I; rúbrica en
> §11.1.

#### F2 · Construcción · Semanas 3 a 12

Las Transferencias `T03` a `T12` levantan la plataforma: sistema de tokens y responsividad,
modelo de dominio, validación accesible, capa de datos, colecciones en Firestore,
operaciones completas, panel de administración, autenticación y reglas, despliegue continuo,
la transacción del negocio, el agente supervisado y el endurecimiento.

> **⚑ G2 · Modelo de datos.** Semana 8. Se **defiende oralmente a nivel N0**: la
> arquitectura de datos no se delega. Rúbrica en §11.2.
>
> **⚑ G3 · Auditoría Técnica del producto.** Semana 12. **Sin hallazgos críticos.**
> **Congelación de funcionalidad: a partir de aquí no se añaden funciones nuevas.**
> Rúbrica en el D3 §11.

#### F3 · Negocio y cumplimiento · Semanas 13 a 15

Lienzo Lean con el supuesto más peligroso identificado y un experimento real de validación;
economía unitaria con números propios; manual de marca, perfiles sociales y plan de
contenido; descubrimiento técnico; expediente legal completo; y memoria técnica.

> **⚑ G4 · Cumplimiento y memoria.** Semana 15. **Bloquea la defensa.** Rúbrica en §11.3.

#### F4 · Defensa · Semana 16

Demo Day público el sábado y sustentación técnica el domingo, ante panel con auditor externo
(Carta, art. 26).

> **⚑ H · Graduación.** Rúbrica en §11.4.

### 8 · Cronograma de Transferencias

| Sem. | Transferencia | Sem. | Transferencia |
|:---:|---|:---:|---|
| 01 | Repositorio e idea declarada | 09 | Formulario conectado y panel de administración |
| 02 | Esqueleto semántico y formulario · **G1** | 10 | Autenticación, reglas y despliegue con compuerta |
| 03 | Sistema de tokens y responsividad | 11 | Transacción del negocio y agente supervisado |
| 04 | Modelo de datos del negocio en JavaScript | 12 | Sin hallazgos críticos · **G3 · congelación** |
| 05 | Validación accesible y análisis de textos | 13 | Lienzo, precios y experimento en marcha |
| 06 | Componente dirigido al agente y fallo depurado | 14 | Marca, presencia y descubrimiento |
| 07 | Los cuatro estados y la capa de datos | 15 | Expediente legal y memoria · **G4** |
| 08 | Colecciones creadas y pobladas · **G2** | 16 | **Demo Day y sustentación · H** |

### 9 · Tutoría

| Momento | Formato | Duración |
|---|---|:---:|
| Semanal | Retroalimentación escrita de la Transferencia | — |
| Semanas 2, 8, 12 y 15 | Tutoría individual **obligatoria**, antes de cada compuerta | 20 min |
| Semanas 5 y 10 | Tutoría de cierre de nivel, con informe formativo | 20 min |
| A demanda | Consulta por canal asíncrono, respuesta en 48 h laborables | — |
| Riesgo detectado | Protocolo del D1 §8.1 | Según fase |

**Seis tutorías individuales obligatorias.** La ausencia injustificada a dos de ellas es
señal de riesgo y activa el protocolo de abandono. Con un aula de diez, las sesenta tutorías
del programa suman unas veinte horas, de las cuales las de cierre de nivel son delegables a
tutores pares (Carta, art. 40).

### 10 · Qué hace y qué no hace el tutor

| Sí | No |
|---|---|
| Pregunta hasta que el estudiante encuentra el error | Escribe código en el proyecto del estudiante |
| Señala qué criterio de la rúbrica no se cumple | Rediseña la solución por él |
| Propone dos caminos y sus consecuencias | Elige el camino |
| Revisa el `AI-USE.md` y pregunta por los rechazos | Acepta una entrega sin declaración |
| Detiene un proyecto inviable a tiempo | Deja avanzar diez semanas algo que no llegará |

---

## PARTE III · RÚBRICAS

> Todas usan la escala del D3 §3. Aprobación en **70**. El estudiante las conoce antes de
> empezar la fase.

### 11.1 · G1 · Carta de Anteproyecto

| Criterio | Peso | Insuficiente | Suficiente | Notable | Excelente |
|---|:---:|---|---|---|---|
| **Concreción del cliente** | 30 % | «Pymes» o «todo el mundo». | Segmento definido. | Cliente con nombre y contexto. | Cliente con nombre, contexto y una conversación real documentada. |
| **Problema** | 25 % | Enunciado como falta de web. | Problema de negocio identificado. | Problema con su coste actual estimado. | Coste estimado con evidencia o testimonio. |
| **Propuesta de valor** | 20 % | Genérica. | Clara en una frase. | Clara y diferenciada de los competidores. | Además, declara qué **no** hará. |
| **Análisis de alternativas** | 15 % | Ausente. | Tres competidores listados. | Tres analizados con fortalezas y huecos. | Además, identifica el hueco que ocupará. |
| **Encaje con un arquetipo** | 10 % | No encaja o no lo declara. | Encaja. | Encaja y justifica la elección. | Encaja y anticipa las funciones que necesitará. |

### 11.2 · G2 · Modelo de datos

| Criterio | Peso | Umbral |
|---|:---:|---|
| Cobertura de consultas | 30 % | Las ocho consultas previstas se resuelven con el esquema |
| Justificación de la desnormalización | 30 % | **Cada** decisión tiene una consulta que la motiva |
| Tipado y restricciones | 15 % | Todos los campos con tipo y obligatoriedad declarados |
| Estimación de volumen a 12 meses | 10 % | Presente y razonada |
| **Defensa oral a nivel N0** | 15 % | Explica por qué su esquema y no otro |

### 11.3 · G4 · Cumplimiento y memoria

| Criterio | Peso | Umbral |
|---|:---:|---|
| Registro de actividades de tratamiento | 25 % | Cada tratamiento con base legal, finalidad, plazo y destinatarios |
| Política de privacidad | 25 % | Describe la aplicación **real**, no una genérica |
| Términos, aviso legal y consentimiento de cookies | 20 % | Presentes, coherentes y con consentimiento previo efectivo |
| Ficha de ruta de formalización | 10 % | Pasos, órganos, costes y plazos, con **fuentes oficiales** |
| Memoria técnica | 20 % | Las catorce secciones del §14, con la 13 escrita con honestidad |

### 11.4 · H · Graduación

| Componente | Peso |
|---|:---:|
| Auditoría Técnica completa sin hallazgos críticos (G3 y G4) | Requisito previo |
| **Producto**: emprendimiento digital completo y en producción | 35 % |
| **Memoria técnica** conforme al §14 | 25 % |
| **Sustentación técnica** ante panel (rúbrica del D3, Anexo III) | 25 % |
| **Pitch de Demo Day** | 15 % |

---

## PARTE IV · MEMORIA Y DEFENSA

### 12 · Naturaleza de la memoria

La memoria **no** es un informe académico convencional: es el **documento de entrega que
Elysium λ produce para un cliente real**, ampliado con la justificación de las decisiones.
Por eso su estructura reproduce los diez pasos del **λ Development Framework Model** de la
empresa. Quien escribe esta memoria está practicando exactamente el entregable de su vida
profesional.

### 13 · Extensión y formato

| Elemento | Especificación |
|---|---|
| Extensión | **12 a 20 páginas**, sin anexos |
| Lengua | Español; los términos técnicos en inglés cuando sea la forma canónica |
| Formato | Markdown en el repositorio, exportado a PDF accesible con estructura de encabezados y texto alternativo |
| Figuras | Diagramas propios; toda figura ajena, atribuida |
| Anexos | Sin límite: código relevante, informes de auditoría, capturas |

### 14 · Estructura obligatoria

| § | Sección | Paso λ | Se cierra en |
|:---:|---|:---:|:---:|
| **1** | Resumen y palabras clave | — | S15 |
| **2** | Entorno operativo actual: el negocio, sus flujos y su contexto | 01 | S02 |
| **3** | Estado del arte y limitaciones: qué usa hoy, qué usan las alternativas | 02 | S02 |
| **4** | Variables críticas: procesos manuales, gestión de datos, vulnerabilidades | 03 | S05 |
| **5** | Definición del problema | 04 | S05 |
| **6** | Impacto esperado: riesgo mitigado, tiempo ahorrado, presencia ganada | 05 | S13 |
| **7** | Arquitectura de la infraestructura | 06 | S08 |
| **8** | Selección tecnológica: opciones, criterios, elección y coste de la elección | 07 | S08 |
| **9** | Diseño, desarrollo y base de datos | 08 | S12 |
| **10** | Aseguramiento de calidad y auditoría: informes ATE, hallazgos, remediación | 09 | S12 |
| **11** | Entrega y operación: cómo se usa, quién la mantiene | 10 | S15 |
| **12** | Modelo de negocio, marca y economía unitaria | — | S14 |
| **13** | **Limitaciones, deuda técnica conocida y trabajo futuro** | — | S15 |
| **14** | Declaración de uso de IA a lo largo del proyecto | — | S15 |

> **La sección 13 es obligatoria y se evalúa.** Una memoria que no declara su deuda técnica
> ni sus limitaciones no es una memoria de ingeniería: es publicidad. Reconocer con
> precisión lo que no se hizo bien puntúa alto.

### 15 · Cómo se escribe una decisión de ingeniería

Formato obligatorio en las secciones 7, 8 y 9:

```markdown
### D-NN · [Decisión en una frase]
**Contexto.** [Qué situación la obligó.]
**Opciones consideradas.** [Al menos dos, descritas con justicia.]
**Criterio de decisión.** [Qué se optimizó: coste, tiempo, accesibilidad, seguridad…]
**Elección y por qué.**
**Coste de la elección.** [Qué se pierde. Toda decisión pierde algo.]
**Cuándo la revisaría.** [Condición concreta que obligaría a cambiarla.]
```

Un documento con diez decisiones así escritas demuestra más criterio de ingeniería que
cincuenta páginas de descripción de funcionalidades.

### 16 · La defensa

| Fase | Duración | Contenido | Nivel de IA |
|---|:---:|---|:---:|
| Exposición técnica | 10 min | Arquitectura, decisiones y alternativas descartadas | — |
| **Defensa de autoría final** | 10 min | Modificación de código en vivo, pantalla compartida | **N0** |
| Preguntas del panel | 15 min | Técnicas, de negocio y de cumplimiento | — |
| Deliberación | 5 min | A puerta cerrada | — |

**Panel:** presidencia, vocalía técnica y **vocalía externa al Instituto** (Carta,
art. 26). Cámara obligatoria. La ausencia del vocal externo obliga a aplazar, no a celebrar
la defensa sin él.

---

## PARTE V · PROPIEDAD Y CASOS ESPECIALES

### 17 · Cambio de proyecto

Sólo se autoriza por el Consejo Académico y únicamente si el cliente identificado
desaparece, si el proyecto resulta ilegal en su jurisdicción, o si el análisis de la fase F1
demuestra que el problema no existe. La autorización es **imposible después de la semana
4**: a partir de ahí el proyecto se reorienta dentro del mismo dominio, no se sustituye. En
dieciséis semanas no hay margen para empezar de cero dos veces.

### 18 · Proyecto para un cliente real de terceros

Está permitido y es la mejor opción cuando existe. Requisitos adicionales:

- **Acuerdo escrito** entre estudiante y cliente sobre propiedad, alcance y datos.
- El cliente entiende que se trata de un proyecto formativo y que el Instituto no garantiza
  el resultado ni asume responsabilidad.
- El estudiante actúa como **responsable o encargado del tratamiento** de los datos de ese
  cliente y asume las obligaciones correspondientes (Carta, art. 64.4).
- Si el cliente exige confidencialidad, la memoria se anonimiza y la defensa se celebra a
  puerta cerrada, con acta reservada.

### 19 · Proyecto sin ánimo de lucro

Admisible en los arquetipos 4 o 5. La sección 12 de la memoria sustituye el modelo de
ingresos por el **modelo de sostenibilidad**: quién paga la infraestructura, quién la
mantiene y qué ocurre si la persona fundadora se retira. Es una pregunta más difícil que la
del lucro, no más fácil.

### 20 · Propiedad intelectual

El código, el diseño, la marca y el modelo de negocio **pertenecen íntegramente al
estudiante** (Carta, art. 60). El Instituto:

- **No adquiere** derecho patrimonial alguno.
- Recibe una licencia **no exclusiva, gratuita y revocable** de exhibición con atribución
  (art. 61), revocable con efecto en 30 días.
- **No incorpora** código del estudiante a sus productos comerciales.
- **No entrega** al estudiante el kit `elysium-core/` ni ningún código propietario.

### 21 · Continuidad tras la graduación

| Beneficio | Alcance |
|---|---|
| Alojamiento del proyecto | 12 meses cubiertos por el Instituto |
| Dominio propio | Coste del estudiante; el Instituto acompaña la configuración |
| Galería de la generación | Permanente, revocable |
| Acceso a las grabaciones | 24 meses (Carta, art. 64.1) |
| Comunidad de egresados | Permanente |
| **Vía de tutor par** | Convocatoria abierta a graduados con mención (Carta, art. 40) |
| Oferta comercial de la empresa | **Nunca antes de emitido el certificado**, y nunca presentada por quien evaluó (art. 73) |

> ### La salvaguarda más importante del protocolo
>
> Un instituto que evalúa a quien al mismo tiempo intenta convertir en cliente tiene un
> conflicto de interés estructural. En un programa **gratuito** ese conflicto no
> desaparece: **se agrava**, porque si nadie paga la formación, la única vía de retorno
> imaginable es convertir a los estudiantes en clientes.
>
> Por eso el art. 73 de la Carta establece tres reglas duras: ninguna oferta comercial
> llega a un estudiante mientras conserve esa condición; la oferta al graduado sólo se
> comunica **después** de emitido su certificado; y **nunca la presenta quien lo evaluó**.
> El Comité de Ética audita el cumplimiento cada año.

---

## ANEXOS

### Anexo I · Carta de Anteproyecto (plantilla · máx. 2 páginas)

```markdown
# Carta de Anteproyecto · TFG · Generación ______
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

## 5. Alternativas actuales
| Alternativa | Qué hace bien | Qué hueco deja |
|---|---|---|

## 6. Funcionalidades previstas
| Prioridad | Funcionalidad | Semana estimada |
|---|---|---|
| Obligatoria | | |
| Deseable | | |
| Futura | | |

## 7. Datos que tratará
| Dato | ¿De quién? | ¿Categoría especial? | Base legal prevista |
|---|---|---|---|

*Si alguna fila dice «sí» en categoría especial, lea el §5 de este protocolo antes de
continuar.*

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

DESDE LA SEMANA 5
□ `axe` sin violaciones serias ni críticas
□ Recorrido completo por teclado
□ Contraste conforme en todos los temas

DESDE LA SEMANA 10
□ Batería de casos negativos en verde
□ Ningún secreto en el historial del repositorio
□ Compuerta de despliegue activa y demostrada

DESDE LA SEMANA 12
□ Lighthouse móvil ≥ 95 en rendimiento
□ Cabeceras de seguridad verificadas
□ Carta de límites del agente publicada
□ Funcionalidad congelada

DESDE LA SEMANA 15
□ Expediente legal coherente con lo que la plataforma hace
□ Marca, perfiles y plan de contenido publicados
□ Memoria completa con las 14 secciones
□ Sección 13 (limitaciones y deuda técnica) escrita con honestidad
```

### Anexo III · Acta de defensa

```markdown
# Acta de sustentación · TFG · Generación ______
**Estudiante:** ____ · **Proyecto:** ____ · **URL:** ____
**Fecha:** ____ · **Hora:** 15:00 UTC

## Panel
| Rol | Nombre | Procedencia | Abstención (art. 30) |
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
☐ Ninguna ☐ Cum laude λ ☐ Accesibilidad ☐ Ingeniería ☐ Emprendimiento

## Observaciones del panel

## Firmas
```

---

*Elysium λ Institute of Development & Research · D7 · «Abstrahere, aedificare, probare.»*




<div class="salto"></div>

# Marco de Organización Personal

<p class="doc-sub">Documento personal · universidad, empresa e instituto</p>
<p class="doc-file">Fichero: <code>ELYSIUM-INSTITUTE/MARCO-PERSONAL.md</code></p>

> **Qué es este documento y qué no es.** No forma parte del paquete normativo del
> Instituto: no lo aprueba ningún órgano y no obliga a nadie más que a usted. Es el
> documento donde se declara cómo conviven las tres cosas que ha decidido sostener a la
> vez, cuánto cuestan en horas, dónde chocan y qué se sacrifica cuando chocan.
>
> Está escrito con franqueza porque su función es esa. Un plan que no dice lo que no
> cuadra no es un plan: es una lista de deseos.

---

## PARTE I · LOS TRES COMPROMISOS

### 1 · Qué hay sobre la mesa

| Compromiso | Qué es | Periodo | Qué aporta al objetivo final |
|---|---|---|---|
| **La empresa** | Elysium λ Development & Research, desarrollo full-stack y de infraestructura para pymes | En marcha desde 09-2025 | **Financia todo lo demás.** Sin ella no hay instituto gratuito ni tiempo para estudiar |
| **La universidad** | Licenciatura em Línguas Aplicadas aos Estudos Europeus e à Geopolítica, Universidade Aberta | 14-IX-2026 → prevista 31-VIII-2029 | El **marco teórico** de la propuesta doctoral: lenguas, Europa, geopolítica |
| **El instituto** | Elysium λ Institute, tres generaciones al año, gratuito | Λ27-1 desde 9-I-2027 | La **experiencia docente e investigadora** y los datos propios |

Y por encima de los tres, el objetivo:

> **Máster universitario de investigación en inteligencia artificial** y después
> **doctorado en sistemas inteligentes**, en Europa.

### 2 · La buena noticia, que conviene entender antes de la mala

**Usted ya tiene la llave de acceso al máster.** La Licenciatura em Engenharia Informática
de ULACIT es una titulación de nivel 6 del Marco Europeo de Cualificaciones, y eso es lo que
exige una admisión a máster. La licenciatura en Línguas Aplicadas **no es un requisito de
acceso**: es un **argumento de candidatura**.

La consecuencia es liberadora y hay que sacarle partido: **no necesita terminar la
licenciatura en tres años**. Necesita cursarla, aprovecharla y que aparezca en su
expediente. La velocidad es negociable; la existencia, no.

Ése es el margen con el que se resuelve casi todo lo que sigue.

---

## PARTE II · LA ARITMÉTICA

### 3 · Lo que cuesta cada cosa, en horas al año

| Compromiso | Supuesto | Horas/año |
|---|---|---:|
| **Empresa** | 20 h por semana, que es lo mínimo para sostener la facturación | **1 040 h** |
| **Instituto** | Tres generaciones, sin tutores pares (D5 §20) | **753 h** |
| **Instituto** | Tres generaciones, **con dos tutores pares** | **520 h** |
| **UAb** | 60 ECTS al año, régimen completo, a 26 h por crédito | **1 560 h** |
| **UAb** | 36 ECTS al año, tres unidades curriculares por semestre | **936 h** |
| **UAb** | 24 ECTS al año, dos unidades curriculares por semestre | **624 h** |

### 4 · Los escenarios, y cuál es viable

| Escenario | UAb | Instituto | Empresa | Total anual | Por semana |
|---|---:|---:|---:|---:|---:|
| **A · Todo a la vez** | 1 560 | 753 | 1 040 | **3 353 h** | **64,5 h** |
| **B · UAb completa, instituto con tutores** | 1 560 | 520 | 1 040 | **3 120 h** | **60,0 h** |
| **C · UAb a 3 UC, instituto con tutores** | 936 | 520 | 1 040 | **2 496 h** | **48,0 h** |
| **D · UAb a 2 UC, instituto con tutores** | 624 | 520 | 1 040 | **2 184 h** | **42,0 h** |

Y hay una restricción que no aparece en la tabla y que pesa más que las horas:

> **Tres generaciones al año son 48 fines de semana lectivos de 52.** No es sólo cantidad
> de trabajo: es que **los sábados y domingos dejan de existir como tiempo disponible**
> durante todo el año, salvo tres. Todo el estudio universitario y todo el descanso tienen
> que caber de lunes a viernes, junto con la empresa.

### 5 · La recomendación

**Escenario D durante 2027 y 2028. Escenario C a partir de 2029.**

Esto significa:

1. **Matricular dos unidades curriculares por semestre** en la Universidade Aberta, no
   cinco. La licenciatura pasa de tres años a unos siete, y termina hacia 2033 en lugar de
   2029.
2. **Conseguir tutores pares desde Λ27-2**, que es la primera generación con graduados
   disponibles. No es un lujo administrativo: es la condición que hace posible la tercera
   generación anual.
3. **Mantener la empresa en 20 h semanales como suelo, no como techo.** Es lo que paga todo
   lo demás; recortarla para sostener el instituto sería quitarle al instituto su propia
   financiación.

**Por qué la universidad es la variable que cede y no las otras dos.** Porque es la única
cuyo retraso no destruye nada. Retrasar la empresa cuesta ingresos. Retrasar el instituto
rompe un compromiso con personas que confiaron en una convocatoria. Retrasar la
licenciatura cuesta solamente tiempo, y usted ya tiene el título que le abre el máster
(§2).

> **Si en algún momento hay que elegir entre terminar la licenciatura rápido y publicar el
> primer preprint, publique el preprint.** Para una admisión de investigación, un artículo
> propio con datos propios pesa más que un semestre adelantado de una segunda licenciatura.

### 6 · La alternativa honesta, por si prefiere la otra

Si quiere conservar el ritmo de tres años en la Universidade Aberta, la variable que debe
ceder es el número de generaciones: **dos al año en lugar de tres**, de enero a abril y de
septiembre a diciembre, dejando **mayo a agosto libre** para las épocas de exámenes del
segundo semestre y para descansar.

Eso serían seis generaciones en tres años en lugar de nueve, y unas 350 horas anuales de
instituto en lugar de 520. Es un plan perfectamente defendible y la Carta lo permite sin
reforma, porque el art. 45 fija tres generaciones como estructura y el art. 76 permite no
abrir una si no se dan las condiciones.

**No hay una respuesta correcta entre las dos.** Hay que elegir cuál de los dos activos
quiere acumular más deprisa: cohortes formadas o créditos universitarios.

---

## PARTE III · EL CALENDARIO DE COLISIONES

### 7 · Cómo encajan los dos calendarios

La Universidade Aberta organiza el año en dos semestres con evaluación continua por
e-fólios y una prueba final, presencial o en línea, en época normal y época de recurso. Las
épocas de prueba caen, a grandes rasgos, en **enero y febrero** para el primer semestre y
en **junio y julio** para el segundo, con recurso en julio.

Superpuesto al calendario del Instituto:

| Periodo | Instituto | Universidad | Nivel de conflicto |
|---|---|---|:---:|
| **Enero – febrero** | Λaa-1, semanas 1 a 6 | **Época de pruebas del 1.º semestre** | **Alto** |
| **Marzo – abril** | Λaa-1, semanas 7 a 16 | 2.º semestre en curso, e-fólios | Medio |
| **Mayo** | Receso · arranque de Λaa-2 | 2.º semestre, e-fólios | Bajo |
| **Junio – julio** | Λaa-2, semanas 4 a 11 | **Época de pruebas del 2.º semestre y recurso** | **Alto** |
| **Agosto** | Λaa-2, semanas 12 a 16 | Vacaciones académicas | Bajo |
| **Septiembre – octubre** | Λaa-3, semanas 1 a 8 | Arranque del 1.º semestre | Medio |
| **Noviembre – diciembre** | Λaa-3, semanas 9 a 16 · **convocatoria anual** | e-fólios del 1.º semestre | **Alto** |

Los tres periodos de conflicto alto coinciden, además, con momentos delicados del
Instituto: enero es el arranque de una generación, julio son las compuertas G2 y G3 de otra,
y noviembre y diciembre son a la vez el cierre de la tercera generación y la convocatoria
anual completa.

### 8 · Las cinco reglas de precedencia

Escritas por adelantado, porque en el momento del choque ya no se decide bien.

1. **Las dieciséis sesiones de una generación en curso son intocables.** Si un examen de la
   Universidade Aberta cae en sábado o domingo a las 15:00 UTC, se traslada el examen a la
   época de recurso, no la clase.
2. **Los tres fines de semana de receso entre generaciones son de la universidad.** No se
   usan para adelantar materiales del Instituto ni para la empresa. Están reservados.
3. **La semana 16 de cada generación (Demo Day y sustentación) tiene prioridad absoluta**
   sobre cualquier otra cosa, salvo urgencia médica o familiar.
4. **La empresa no cede en la semana de facturación.** Sin ingresos no hay nada de lo demás.
5. **Cuando dos compromisos choquen y ninguna regla anterior aplique, cede la
   universidad**, por la razón del §5.

### 9 · Tres decisiones de matrícula que evitan la mayor parte del problema

Estas se toman al matricular, no cuando llega el conflicto:

1. **Priorizar unidades curriculares con evaluación continua** por e-fólios sobre las que
   dependen de una prueba final única. El e-fólio se entrega entre semana; la prueba tiene
   fecha fija y suele caer en fin de semana.
2. **No matricular ninguna unidad cuya prueba final caiga en las semanas 12 a 16 de una
   generación.** Esas cinco semanas concentran G3, G4 y la sustentación.
3. **Reservar deliberadamente la época de recurso** como red de seguridad en lugar de como
   fracaso. Con dos unidades por semestre, usar el recurso en una de ellas es una decisión
   de planificación, no un suspenso.

### 10 · El punto más difícil de todo el calendario: septiembre a diciembre de 2026

Es el único tramo en que se solapan cuatro cosas:

| Qué | Cuándo |
|---|---|
| Cierre de la Licenciatura em Engenharia Informática (ULACIT) | hasta el 15-XII-2026 |
| Arranque del 1.º semestre en la Universidade Aberta | desde el 14-IX-2026 |
| **Producción de todo el material del Instituto** | septiembre a diciembre de 2026 |
| **Convocatoria anual y selección de las tres generaciones de 2027** | octubre y noviembre de 2026 |

**Recomendación para ese tramo concreto:** matricular **una sola unidad curricular** en el
primer semestre de la Universidade Aberta. Una. El objetivo de ese semestre no es avanzar en
la licenciatura: es **no perder la matrícula y cerrar bien la otra carrera**, mientras se
construye el material que hará posible todo 2027.

Producir quince laboratorios con su arnés de pruebas, quince micro-guías, el Módulo 0
completo y la Prueba de Disposición λ son unas **190 horas** que no se pueden improvisar en
enero.

---

## PARTE IV · EL ITINERARIO ACADÉMICO

### 11 · Los cinco años, con lo que produce cada uno

| Año | Universidad | Instituto | Investigación | Hito personal |
|---|---|---|---|---|
| **2026** | Cierre de Engenharia Informática · 1 UC en UAb | Material, convocatoria y selección | Protocolo preinscrito (D6) | Los dos primeros pasos dados |
| **2027** | 2 UC por semestre | Λ27-1, Λ27-2, Λ27-3 | Recogida de tres cohortes | **Primeras 30 personas formadas** |
| **2028** | 2 UC por semestre | Λ28-1, Λ28-2, Λ28-3 | **Preprint 1** (Línea B) · solicitud de máster | **Primera publicación** |
| **2029** | 2–3 UC por semestre · inicio del máster | Λ29-1, Λ29-2, Λ29-3 | **Preprint 2** (Línea A) | **90 personas formadas · máster en curso** |
| **2030** | Máster · licenciatura en curso | Generaciones Λ30 | Disertación de máster · **Preprint 3** (Línea C) | **Propuesta doctoral** |

### 12 · Qué hace fuerte esta candidatura, y qué la debilita

**Lo que la hace fuerte y es difícil de replicar:**

- Una **serie longitudinal propia de tres años** sobre hispanohablantes dirigiendo agentes
  de IA, con línea base sin asistencia. Casi nadie tiene ese dato.
- La combinación de **ingeniería informática y lenguas aplicadas a los estudios europeos y
  la geopolítica**, que convierte una tesis técnica en una contribución con marco político.
- **Experiencia docente real y documentada**: syllabus público, rúbricas, evaluación,
  indicadores publicados. No es «he dado unos talleres».
- Un proyecto de **acción social sostenido**, que en las cartas de motivación europeas pesa
  más de lo que suele suponerse.

**Lo que la debilita, y conviene atacar pronto:**

| Debilidad | Cómo se corrige | Cuándo |
|---|---|---|
| **Inglés B2/B1.** Es el punto más frágil del expediente para un doctorado europeo. La mayoría de los programas exige C1 acreditado. | Es lo que **más retorno tiene por hora invertida** de todo el plan. Y encaja con la licenciatura: el inglés es materia de estudio, no una tarea añadida. **Acreditar C1 antes de solicitar el máster.** | 2027–2028 |
| **Ninguna publicación todavía** | Preprint 1 en 2028 (D6 §13) | 2028 |
| **Sin vínculo con un grupo de investigación** | Contactar grupos de educación en informática y de IA en universidades portuguesas y españolas desde 2027, presentando el protocolo del D6 | 2027 |
| **Portugués C1 de comprensión pero B2 escrito** | Relevante si el doctorado es en Portugal. Mejora sola con la licenciatura en la UAb | Continuo |

> **Si tuviera que elegir una sola cosa de esta tabla, elija el inglés.** Un C1 acreditado
> abre programas de doctorado en toda Europa; un semestre más de licenciatura no abre
> ninguno.

---

## PARTE V · SOSTENIBILIDAD

### 13 · Las señales de sobrecarga, y qué hacer con cada una

Fijadas por adelantado para no negociarlas en caliente.

| Señal | Umbral | Qué hacer |
|---|---|---|
| Retroalimentación entregada fuera de los 7 días | Dos semanas seguidas | Activar tutor par para la retroalimentación de esa generación |
| Sesión impartida sin haber preparado la micro-guía con 72 h | Dos veces en una generación | Reutilizar el material de la generación anterior sin actualizar y anotarlo |
| Menos de 6 h de sueño de media | Una semana | Suspender el trabajo de investigación de ese mes; es la partida más aplazable |
| Facturación mensual por debajo del suelo | Un mes | Reducir el instituto a dos generaciones el año siguiente |
| Unidad curricular abandonada por falta de tiempo | Una vez | Bajar a una UC por semestre el semestre siguiente |
| Ganas de no abrir el ordenador el sábado | Dos fines de semana | Hablarlo con alguien. Es la señal más importante y la más fácil de ignorar |

### 14 · Lo que hay que proteger, en orden

1. **La salud.** Cuarenta y dos horas semanales sostenidas son mucho; sesenta no son
   sostenibles. Si el plan exige sesenta, el plan está mal, no usted.
2. **La empresa.** Es la que financia el instituto y la que paga la matrícula. Es la base
   de la pirámide, aunque no sea lo que más ilusión hace.
3. **La palabra dada a una generación en curso.** Diez personas reorganizaron su vida
   alrededor de un compromiso suyo. Esa deuda es real.
4. **La investigación.** Es lo que convierte todo el esfuerzo en carrera académica. Aplazable
   un mes, no un año.
5. **La licenciatura.** Importante, larga, y la única que se puede estirar sin romper nada.

### 15 · La regla de las tres generaciones, dicha con claridad

El art. 45 de la Carta establece tres generaciones al año como estructura, y el art. 76
permite no abrir una si no se dan las condiciones. Esa combinación es deliberada: le da a
usted una salida que no es un incumplimiento.

**Si al llegar octubre no hay tutores pares comprometidos para el año siguiente, convoque
dos generaciones y no tres.** Comunicarlo en la convocatoria, antes de que nadie postule, es
transparencia. Abrir tres y degradar el acompañamiento a mitad de camino sería lo contrario,
y además destruiría lo único que hace defendible el certificado, que es la Defensa Aleatoria
de Autoría hecha con calma.

---

## PARTE VI · LO QUE HAY QUE DECIDIR AHORA

### 16 · Decisiones que no admiten aplazamiento

| # | Decisión | Antes de | Por qué |
|:---:|---|---|---|
| 1 | **Cuántas unidades curriculares matricular** en el 1.º semestre de la UAb | septiembre de 2026 | Recomendación del §10: una |
| 2 | **Revisión legal** del término «instituto» y del texto del certificado | antes de la convocatoria de octubre | Es el riesgo reputacional más alto del proyecto |
| 3 | **Asesoría fiscal** sobre donaciones, si se van a aceptar | antes de abrir cualquier vía | Una sociedad mercantil que recibe donaciones para actividad gratuita tiene tratamiento propio |
| 4 | **Miembro externo del Comité de Ética** y **auditor externo** de defensas | antes de la convocatoria | La Carta los declara inderogables (art. 29) |
| 5 | **Preinscripción del protocolo de investigación** | noviembre de 2026 | Debe estar registrado antes del primer dato (D6 §13) |
| 6 | **Producción del material**: 15 laboratorios, 15 micro-guías, Módulo 0, Prueba de Disposición | 28 de noviembre de 2026 | Es cuando se abre el Módulo 0 de Λ27-1 |
| 7 | **Plan de acreditación de inglés C1** | inicio de 2027 | §12: lo que más retorno tiene por hora |

### 17 · Una última cosa

Lo que ha diseñado aquí es coherente y poco común: una empresa que financia un instituto
gratuito que produce los datos de una investigación que sostiene una carrera académica, y
todo ello atravesado por la misma pregunta sobre la lengua, la tecnología y quién queda
fuera de ella.

Esa coherencia es su mayor activo y también su mayor riesgo, porque las tres piezas se
sostienen entre sí y ninguna funciona sola. Por eso este documento existe: para que, cuando
una de las tres empiece a fallar, sepa de antemano cuál cede y cuál no.

---

*Documento personal · no forma parte del paquete normativo del Instituto*




<div class="salto"></div>

# Anexo · Modelo horario

<p class="doc-sub">Programa que determina la franja síncrona óptima para el mundo hispano</p>
<p class="doc-file">Fichero: <code>ELYSIUM-INSTITUTE/horario.py</code></p>

Es el programa citado en el D5, Parte III. Se reproduce completo para que cualquiera pueda cambiar sus supuestos y comprobar si el resultado cambia. Su ejecución produce el barrido de horas UTC, el ranking, la prueba de anclaje y las tablas de conversión local.

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
