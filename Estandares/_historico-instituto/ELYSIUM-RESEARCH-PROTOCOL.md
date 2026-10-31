# Elysium λ Institute — Protocolo de Investigación del Profesorado
### v3.0.0 · Agosto 2026 · Documento D8 del paquete fundacional
### Línea única: efecto de la Escalera de IA sobre programadores novatos

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

# PARTE I · PRINCIPIOS

## 1 · La regla de carga cero

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

## 2 · Los cinco principios

1. **Carga cero para el estudiante** (§1).
2. **Ningún dato influye en ninguna calificación.** El análisis se ejecuta
   **después** de emitidos los certificados (§6.2). Es la salvaguarda central del
   doble rol de docente e investigador.
3. **Participación voluntaria y revocable** en cualquier momento, sin consecuencia
   académica y sin dar explicaciones.
4. **Preinscripción antes de mirar los datos**, y publicación de los resultados
   adversos con la misma diligencia que los favorables.
5. **Datos anonimizados, código y preprint abiertos**, con identificador persistente.

## 3 · Por qué esta pregunta y no otra

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

# PARTE II · DISEÑO DEL ESTUDIO

## 4 · Especificación

### 4.1 · Título de trabajo

> *Una escalera de uso declarado de inteligencia artificial en la enseñanza
> introductoria de programación: efecto sobre la brecha entre desempeño asistido y
> autónomo, la calibración metacognitiva y la autoría demostrable. Estudio
> longitudinal de cohortes.*

### 4.2 · Preguntas de investigación

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

### 4.3 · Hipótesis preinscritas

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

### 4.4 · Los únicos veinte minutos que se piden

| Instrumento | Cuándo | Duración |
|---|---|:---:|
| Cuestionario de regulación metacognitiva, versión breve | Módulo 0 | 10 min |
| El mismo cuestionario, repetido | Semana 16, tras la sustentación | 10 min |

Nada más. Todo lo demás se lee de artefactos que el programa ya genera.

### 4.5 · Variables y su procedencia

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

### 4.6 · Diseño y muestra

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

### 4.7 · Análisis

Modelos mixtos con el estudiante como efecto aleatorio y la semana como término
temporal, para PI-1 y PI-2. Correlación y regresión ordinal para PI-3. Término de
interacción con la regulación metacognitiva inicial para PI-4. Descriptiva con
intervalo de confianza para PI-5. Corrección de Benjamini-Hochberg. Todo análisis no
previsto aquí se etiqueta como **exploratorio** en el manuscrito.

---

# PARTE III · ÉTICA

## 5 · El doble rol, que es el problema central

La Dirección Académica es a la vez **quien enseña, quien califica y quien investiga**.
Esa concentración es el mayor riesgo del estudio y se mitiga con cuatro reglas duras:

| # | Regla | Verificable por |
|:---:|---|---|
| 1 | **El análisis no se ejecuta hasta que los certificados están emitidos.** Los datos se recogen automáticamente y quedan sellados sin abrir. | Marca temporal del repositorio de datos |
| 2 | **La participación no se conoce durante el curso.** El consentimiento lo custodia la Secretaría y no se comunica al docente hasta el cierre. | Registro de la Secretaría |
| 3 | **Ningún dato del estudio entra en ninguna decisión académica**, ni de calificación, ni de admisión, ni de recomendación. | Auditoría del CEIC |
| 4 | **Un miembro externo del CEIC revisa el protocolo y el manuscrito** antes del envío (Carta, art. 22). | Dictamen escrito |

## 6 · Consentimiento

Voluntario, explícito, separado del Compromiso λ, y **revocable en cualquier momento
sin dar explicaciones y sin consecuencia académica alguna**. Se firma en el Módulo 0.
Quien no participe cursa el programa exactamente igual y nadie lo sabrá.

Si se revoca después del sellado de datos, se eliminan las observaciones de esa
persona. Si se revoca después de publicado el preprint, se anota en el registro de
correcciones y se recalcula si procede.

## 7 · Datos personales

Seudonimización en el origen: la tabla que enlaza identidad con código de sujeto la
custodia la Secretaría, no la Dirección Académica, y se destruye al publicar. El
conjunto abierto no contiene país cuando el aula tenga menos de tres personas de esa
nacionalidad, para evitar reidentificación. Régimen aplicable: Reglamento (UE)
2016/679 y Ley n.º 8968 (Carta, art. 60).

---

# PARTE IV · CALENDARIO Y PUBLICACIÓN

## 8 · Cronograma, que es del profesorado y no del aula

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

## 9 · Autoría

| Posición | Quién | Criterio |
|---|---|---|
| **Primer autor** | Daniel Alonso Morales Ávila | Conceptualización, metodología, análisis, redacción |
| Coautoría | Quien contribuya sustantivamente en dos roles CRediT o más | Docentes o investigadores asociados, si los hubiera |
| Agradecimientos | Las generaciones participantes, **de forma colectiva y sin nombres** | Protección de los sujetos |

**Los estudiantes no firman.** No es un demérito: es la consecuencia de que sean
sujetos del estudio. Firmar el trabajo que los estudia comprometería a la vez su
libertad de participar y la validez del resultado (véase la versión archivada de este
documento, §3, donde se argumentó la separación por primera vez).

## 10 · Destino

| Prioridad | Destino | Por qué |
|:---:|---|---|
| **0** | **Preprint en repositorio abierto** | Garantiza el resultado. No depende de nadie. |
| 1 | Congreso internacional de investigación en educación en informática | Foro natural del tema; admite trabajos exploratorios bien declarados |
| 2 | Revista del área de educación en informática o de informática y educación | Recorrido más largo, mayor peso |
| 3 | Informe técnico del Instituto con identificador persistente | Red de seguridad. Siempre se publica. |

## 11 · Contingencias

| Si ocurre | Entonces |
|---|---|
| Consienten menos de 6 personas | Se publica como **estudio de casos múltiples**, con análisis cualitativo y sin inferencia. Sigue siendo publicable y honesto. |
| Todas las hipótesis se refutan | Se publica igual. Un resultado nulo sobre una intervención bien descrita es útil. |
| H1 se refuta, es decir, la brecha crece | **Se publica, y además se reforma el D1 §6 antes de la generación siguiente.** El protocolo existe para poder descubrir esto. |
| La generación no llega a la semana 16 | Se reporta con la mortalidad experimental declarada. |
| El foco de revisión rechaza | El preprint ya está publicado. Se atiende la crítica y se reenvía. |

---

# ANEXO · Consentimiento informado

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
