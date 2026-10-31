# Elysium λ Institute — Syllabus del Cuatrimestre 3
### v1.0.0 · Agosto 2026 · Documento D6 del paquete fundacional
### Full-Stack, Agentes en el Servidor, Emprendimiento y Publicación · Semanas globales 33 a 48

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

# PARTE I · IDENTIFICACIÓN Y REGLAS

## 1 · Ficha del cuatrimestre

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

## 2 · Objetivo del cuatrimestre

Al terminar la semana 48, la persona graduada tiene **una plataforma transaccional
en producción**: personas usuarias que se autentican, datos protegidos por rol,
agenda operativa, cobro en modo de prueba, automatización supervisada por agentes,
cumplimiento legal documentado y una defensa técnica sostenida ante un panel con
auditor externo. Y tiene su nombre en un **preprint publicado con identificador
persistente** y en el manuscrito enviado a revista.

## 3 · Las tres líneas simultáneas

| Línea | Semanas | Qué produce |
|---|---|---|
| **Técnica** | S33–S45 | Autenticación, roles, agenda, agentes, pagos, endurecimiento |
| **Negocio y cumplimiento** | S38–S42 | Lean Canvas validado, marca, expediente legal, SEO |
| **Científica** | S39–S46 | Análisis, redacción, revisión por pares, **publicación del preprint** y envío a revista |

Las tres convergen en las semanas 46 a 48. Quien se retrase en una arrastra las
otras, y por eso las compuertas G7 y G8 son bloqueantes y sin prórroga.

---

# PARTE II · LAS DIECISÉIS SEMANAS

## Módulo IX · Identidad, acceso y transacción (S01–S05)

### Semana 33 · C3·S01 · Identidad, sesión y testigos

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

### Semana 34 · C3·S02 · Roles, rutas privadas y cabeceras de seguridad

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

### Semana 35 · C3·S03 · Tiempo, husos horarios y colisión de reservas

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

### Semana 36 · C3·S04 · Interfaz de agenda accesible

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

### Semana 37 · C3·S05 · Servidor sin servidor y agentes supervisados

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

## Módulo X · Negocio, cumplimiento y descubrimiento (S06–S10)

### Semana 38 · C3·S06 · Modelo de negocio y validación

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

### Semana 39 · C3·S07 · Marca, redacción persuasiva y análisis de datos

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

### Semana 40 · C3·S08 · Protección de datos y documentos legales

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

### Semana 41 · C3·S09 · Formalización en la propia jurisdicción

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

### Semana 42 · C3·S10 · Descubrimiento: SEO técnico y agentes de búsqueda

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

## Módulo XI · Endurecimiento, memoria y graduación (S11–S16)

### Semana 43 · C3·S11 · Endurecimiento de seguridad

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

### Semana 44 · C3·S12 · Cobro en línea y cierre funcional

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

### Semana 45 · C3·S13 · Auditoría Técnica final y optimización

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

### Semana 46 · C3·S14 · Memoria, artículo y preparación del pitch

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

### Semana 47 · C3·S15 · Ensayo general y revisión por pares

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

### Semana 48 · C3·S16 · Demo Day, sustentación y graduación

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

# PARTE III · ADMINISTRACIÓN DEL CUATRIMESTRE

## 5 · Mapa de evaluación

| Componente | Peso | Instrumentos |
|---|:---:|---|
| **A · Continua** | 40 % | `Q33`–`Q47` (12 mejores) 15 % · `L33`–`L47` 25 % |
| **B · Proyecto** | 30 % | `T33`–`T47` 12 % · G7 (9 %) + G8 (9 %) 18 % |
| **C · Hito** | 30 % | H3: ATE apta + memoria y producto 60 % + sustentación 40 % |
| **Apto / no apto** | — | **4 DAA mínimo** · asistencia ≥ 80 % · `AI-USE.md` · P5 y P6 |

## 6 · Calendario de la Generación I

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

## 7 · Panel de sustentación

| Miembro | Procedencia | Vota |
|---|---|:---:|
| Presidencia | Dirección Académica o docente del cuatrimestre | Sí |
| Vocalía técnica | Comité de Auditoría Técnica | Sí |
| **Vocalía externa** | **Profesional ajeno al Instituto** (Carta, art. 23) | Sí |

Quien tenga interés económico, familiar o contractual en el proyecto se abstiene y
la abstención consta en acta (Carta, art. 27).

## 8 · Condiciones del Demo Day

Sesión pública y grabada. Cada estudiante autoriza previamente por escrito la
difusión de su presentación y puede revocarla en 30 días (Carta, art. 58). Se
retransmite con subtitulado en español. El acto se convoca con seis semanas de
antelación para permitir la asistencia de invitados de todos los husos horarios.

## 9 · Después de la graduación

| Beneficio | Alcance |
|---|---|
| Alojamiento del proyecto | 12 meses cubiertos por el Instituto |
| Galería de la generación | Permanente, con licencia revocable |
| Acceso a las grabaciones | 24 meses (Carta, art. 61.1) |
| Comunidad de egresados | Permanente |
| Vía de incorporación docente | Convocatoria abierta a graduados con mención |
| Actualización del artículo | Participación en la respuesta a revisores hasta la publicación en revista, que llegará meses después del Demo Day |
| Oferta comercial de la empresa | **Nunca antes de emitido el certificado**, y nunca presentada por quien evaluó (Carta, art. 63 bis) |

## 10 · Límites declarados de este cuatrimestre

El bloque de negocio y cumplimiento **no sustituye a un abogado, a un contable ni
a un asesor fiscal**, y así se declara en el material, en el certificado y ante el
estudiante. El bloque de pagos se realiza íntegramente en modo de prueba: el
Instituto no interviene en ningún cobro real de sus estudiantes ni asume
responsabilidad sobre la operación comercial que estos emprendan.

## 11 · Bibliografía del cuatrimestre

- Documentación oficial del proveedor de identidad, de funciones en el servidor y
  de la pasarela de pago.
- Reglamento (UE) 2016/679; Lei n.º 58/2019 (Portugal); Ley n.º 8968 (Costa Rica).
- Guías oficiales de la Autoridade Tributária de Portugal y del Registro Nacional y
  la Dirección General de Tributación de Costa Rica.
- Proyecto abierto de seguridad en aplicaciones web: riesgos más frecuentes.
- `ELYSIUM-STANDARDS.md`, funciones F07, F08, F19, F20, F23, F24, F25, F26, F27.
- Material propio: micro-guías `MG33`–`MG48` y fichas `L33`–`L47`.

## 12 · Contrato de expectativas del docente

Se mantiene el del D4 §11, con dos añadidos propios de este cuatrimestre: convocar
**cuatro** Defensas Aleatorias de Autoría por estudiante, y asegurar la presencia
efectiva del auditor externo en la sustentación, cuya ausencia obliga a aplazar la
defensa y no a celebrarla sin él.

## 13 · Registro de erratas y de semanas defectuosas

| Fecha | Semana | Naturaleza | Corrección aplicada | Efecto sobre notas |
|---|---|---|---|---|
| *(vacío al inicio de la generación)* | | | | |

---

*Elysium λ Institute of Development & Research · D6 · «Abstrahere, aedificare, probare.»*
