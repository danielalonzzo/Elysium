# VALTRIX Engineering — Modelo de Pricing y Condiciones Comerciales

**v1.0 · Agosto 2026 · Clasificación: interno.**
Documento vinculado a `00-constitucion-valtrix.md`.

> **Nomenclatura:** los planes se nombran por el alcance de la operación del
> cliente (Línea Base, Escala Industrial, Multi-Sitio / Métrica Esencial,
> Ecosistema Integrado, Arquitectura de Datos). «Tier 1/2/3» suena a software
> genérico y VALTRIX es una firma boutique de ingeniería.
>
> Contiene el tarifario público **y** la capa interna que no se publica: umbrales de
> descuento, costo real por proyecto y guion de negociación. La versión pública vive
> en `precios.html`.

---

## 1. Principios de precio

Cinco reglas que gobiernan toda cotización:

1. **No se cobra por hora.** La hora convierte a VALTRIX en gasto y castiga la
   eficiencia: cuanto mejor es la consultora, menos factura. Se cobra por entregable
   con precio cerrado.
2. **El precio se ancla al riesgo evitado, no al esfuerzo.** Un sistema metrológico
   de $4.600 protege un contrato de zona franca que sostiene la planilla. Ese es el
   marco de referencia, no las horas invertidas.
3. **Boutique, no volumen.** VALTRIX nunca es la opción barata. Si el prospecto
   compara solo por precio, no es el cliente (§6 de la constitución).
4. **La instalación existe para vender el Soporte Continuo.** El pago único financia el
   levantamiento; el recurrente es el negocio. Conversión objetivo: **60 %**.
5. **Todo precio publicado es un piso con alcance definido.** Fuera de ese alcance,
   adenda. Sin excepción.

---

## 2. Servicio 01 — Trazabilidad Metrológica

> El servicio con menor competencia y mayor margen del portafolio. Se cotiza más alto
> que BI a igual esfuerzo porque el riesgo que evita es de otra magnitud: un hallazgo
> mayor puede costar el contrato entero.

### 2.1 Fase 1 · Instalación (pago único)

| | **Plan Línea Base** | **Plan Escala Industrial** | **Plan Multi-Sitio** |
|---|---|---|---|
| **Precio** | **$2.400** | **$4.600** | **$8.500** |
| Parque de instrumentos | hasta 75 | 76–300 | 301–1.000+ |
| Sitios | 1 | 1–2 | Multi-sitio |
| Levantamiento físico | ✓ | ✓ | ✓ con codificación e identificación física |
| Análisis de criticidad | Básico | Por impacto en producto | Por impacto en producto y en requisito regulatorio |
| Auditoría de estado normativo | ✓ | ✓ con brechas priorizadas | ✓ con plan de acción y responsables |
| Sistema de alertas | Calendario automatizado | Sistema con alertas 60/30/15 días | Sistema + tablero de cumplimiento en vivo |
| Procedimiento documentado | Ficha de equipo | Procedimiento de control + fichas | Procedimiento, fichas, matriz de trazabilidad a patrones |
| Selección de laboratorios ECA | Lista sugerida | Matriz comparativa por magnitud | Matriz, negociación de tarifas y calendario anual |
| Duración | 2 semanas | 3–5 semanas | 6–8 semanas |
| Capacitación | 2 h | 4 h + manual | 8 h + manual + simulacro de auditoría |

**Incluye en los tres planes:** inventario físico equipo por equipo con marca, modelo,
serie, ubicación y responsable · verificación del estado de calibración vigente ·
identificación de equipos vencidos, no trazables o fuera de uso · frecuencias de
calibración justificadas por criticidad, no por costumbre · expediente digital
ordenado y listo para presentar ante auditor · capacitación con acta · 30 días de
garantía.

**No incluye — y se dice en la primera reunión:** **VALTRIX no calibra ni emite
certificados.** La calibración física la ejecuta un laboratorio acreditado por el ECA
y se factura directamente al cliente · no se repara ni ajusta instrumental · no se
garantiza la aprobación de una auditoría de tercera parte · no se asume la
representación legal ante entes reguladores.

### 2.2 Fase 2 · Soporte Continuo

| | **Vigilancia** | **Cumplimiento** | **Cero Hallazgos** |
|---|---|---|---|
| **Precio/mes** | **$380** | **$690** | **$1.150** |
| Mantenimiento del calendario | ✓ | ✓ | ✓ |
| Alertas de vencimiento | 30 y 15 días | 60, 30 y 15 días | 60, 30 y 15 días + escalado a gerencia |
| Reporte de cumplimiento | Mensual | Mensual + indicador de % de parque conforme | Mensual + tablero en vivo |
| Auditoría interna de cumplimiento | — | Mensual, remota | Mensual, presencial |
| Gestión con laboratorios ECA | — | Coordinación de envíos y recepción | Coordinación, verificación técnica de certificados recibidos |
| Verificación de certificados | — | Vigencia y alcance | Vigencia, alcance, trazabilidad e incertidumbre declarada |
| Altas y bajas de equipo | 5/mes | 15/mes | Sin límite |
| Acompañamiento en auditoría de cliente o ente | — | Remoto | **Presencial**, hasta 2/año |
| Tiempo de respuesta | 24 h hábiles | 24 h hábiles | 8 h hábiles |

**Excluido de todo Soporte Continuo:** el costo de las calibraciones · transporte de equipos ·
compra de instrumentos o patrones · ampliación del parque por encima del plan
contratado sin adenda · representación legal.

---

## 3. Servicio 02 — Inteligencia Operativa (BI & Data)

### 3.1 Fase 1 · Instalación (pago único)

| | **Plan Métrica Esencial** | **Plan Ecosistema Integrado** | **Plan Arquitectura de Datos** |
|---|---|---|---|
| **Precio** | **$1.850** | **$3.400** | **$6.200** |
| Perfil | PYME, 1 área | Mediana, varias áreas | Proveedor de zona franca, multi-planta |
| Fuentes de datos | 1 (Excel o export) | 2–3 (incluye ERP/SAP) | 4+ con orígenes heterogéneos |
| Indicadores | hasta 15 | hasta 35 | sin tope definido, por modelo |
| Tableros | 1 | 2–3 con drill-down | Modelo gobernado, seguridad por rol (RLS) |
| Levantamiento en sitio | 1 sesión | 2–3 sesiones | Inmersión, hasta 5 sesiones |
| Duración | 2 semanas | 3–4 semanas | 5–7 semanas |
| Capacitación | 2 h, 1 persona | 4 h, hasta 3 personas | 8 h, hasta 6 personas + manual de gobierno |

**Incluye en los tres planes:** entrevistas de levantamiento y definición de
indicadores con el responsable de cada área · auditoría de calidad del dato en origen
(dónde se captura mal y por qué) · limpieza y modelado · diccionario de indicadores
con fórmula, origen y responsable · publicación en el entorno del cliente ·
capacitación con acta · 30 días de garantía de corrección sobre lo entregado.

**No incluye:** licencias de Power BI o de cualquier plataforma (las paga y las
posee el cliente) · desarrollo de software o integraciones a medida vía API ·
digitación histórica masiva (se cotiza aparte) · hardware · corrección de datos
históricos erróneos anteriores al proyecto.

### 3.2 Fase 2 · Soporte Continuo

| | **Esencial** | **Control** | **Gobierno** |
|---|---|---|---|
| **Precio/mes** | **$320** | **$580** | **$950** |
| Actualización de datos | Mensual | Quincenal | Semanal |
| Reporte ejecutivo escrito | ✓ | ✓ | ✓ |
| Sesión de lectura de indicadores | — | 1 h/mes | 2 h/mes, presencial |
| Horas de ajuste incluidas | 2 h | 5 h | 10 h |
| Indicadores o vistas nuevas | — | 1/trimestre | 1/mes |
| Tiempo de respuesta | 24 h hábiles | 24 h hábiles | 8 h hábiles |
| Soporte de incidencia crítica | — | ✓ | ✓ (4 h) |
| Tablero adicional | — | — | 1/trimestre |

**Excluido de todo Soporte Continuo:** proyectos nuevos de levantamiento (se cotizan como
instalación) · migración a otra plataforma · formación de personal nuevo más allá de las
horas incluidas · recuperación de datos por fallo de sistemas del cliente.

**Hora adicional fuera de plan:** $65.

---

## 4. Paquete combinado — «Sala de Control VALTRIX»

Contratar ambas instalaciones en el mismo proyecto: **−15 % sobre la suma de los dos**. El
descuento se justifica en costo real: el levantamiento en sitio, las entrevistas y el
conocimiento de la operación se comparten entre los dos servicios.

| Combinación | Suma | Con descuento | Ahorro |
|---|---|---|---|
| Línea Base + Métrica Esencial | $4.250 | **$3.613** | $637 |
| Escala Industrial + Ecosistema Integrado | $8.000 | **$6.800** | $1.200 |
| Multi-Sitio + Arquitectura de Datos | $14.700 | **$12.495** | $2.205 |

Soporte Continuo combinado: **−10 %** sobre la suma mensual.

---

## 5. Condiciones y formas de pago

### 5.1 Instalación

- **50 %** a la firma del contrato — habilita el inicio, no antes.
- **50 %** contra acta de aceptación firmada.
- Tier 3 admite tres pagos: **40 / 30 / 30** (firma / hito intermedio / aceptación).

### 5.2 Soporte Continuo

- Facturación **por adelantado**, primeros 5 días hábiles del mes.
- **Permanencia mínima: 6 meses.** Es lo que tarda un sistema en demostrar valor; por
  debajo de eso el cliente juzga sobre ruido.
- Renovación automática mensual tras el periodo mínimo.
- Baja con **30 días** de preaviso escrito.
- **10 % de descuento** por pago anual anticipado.

### 5.3 Medios de pago

Transferencia bancaria en **CRC** o **USD** · **SINPE Móvil** (hasta el límite
regulatorio) · transferencia internacional para clientes fuera de CR (comisiones a
cargo del cliente).

**Factura electrónica** conforme a Hacienda en toda operación. **Todos los precios
son netos: el IVA 13 % no está incluido.** Las cotizaciones tienen **15 días** de
vigencia.

### 5.4 Mora y suspensión

- Interés moratorio desde el día **31** de vencida la factura.
- A los **45** días de mora se suspende el servicio de retainer, con aviso previo.
- El expediente y los entregables ya aceptados son **propiedad del cliente** y se
  entregan siempre, incluso en caso de mora. VALTRIX no retiene información del
  cliente como mecanismo de cobro.

### 5.5 Viáticos

Incluidos dentro de la **Gran Área Metropolitana**. Fuera de la GAM: $0,45/km más
hospedaje si el sitio exige pernocta, presupuestado y aprobado por adelantado.

---

## 6. Capa interna — no publicar

### 6.1 Costo real y margen objetivo

| Servicio / Tier | Precio | Días de trabajo estimados | Ingreso/día | Margen objetivo |
|---|---|---|---|---|
| Métrica Esencial | $1.850 | 5 | $370 | alto |
| Ecosistema Integrado | $3.400 | 10 | $340 | alto |
| Arquitectura de Datos | $6.200 | 18 | $344 | medio-alto |
| Línea Base | $2.400 | 6 | $400 | alto |
| Escala Industrial | $4.600 | 12 | $383 | alto |
| Multi-Sitio | $8.500 | 22 | $386 | medio-alto |

**Piso absoluto: $300/día efectivo.** Por debajo se rechaza el proyecto o se recorta
alcance. No se baja el precio: se baja el alcance.

### 6.2 Umbrales de descuento

| Situación | Descuento máximo | Quién autoriza |
|---|---|---|
| Primer cliente de un plan (caso documentable) | **20 %**, a cambio de permiso escrito para publicar el caso | Fundadora |
| Referido de cliente activo | 10 % | Fundadora |
| Combinado de servicios | 15 % (ya tabulado) | Automático |
| Pago 100 % anticipado del Setup | 7 % | Automático |
| Cualquier otro caso | **0 %** | — |

Los descuentos **no se acumulan**. Tope duro por proyecto: **20 %**.

### 6.3 Guion de negociación

**«Está muy caro.»**
No se defiende el precio: se recontextualiza. *«Entiendo. Póngalo al lado de lo que
cuesta el problema: si la auditoría de su cliente arroja un hallazgo mayor en control
de instrumentos, ¿qué pasa con ese contrato? El sistema cuesta una fracción de un
mes de esa facturación, y se paga una vez.»*

**«Déjeme pensarlo.»**
*«Claro. ¿Le sirve que le deje el diagnóstico por escrito con los equipos vencidos
que encontramos? Así, decida lo que decida, sabe exactamente dónde está parado.»*
El informe trabaja solo.

**«Tengo una cotización más barata.»**
*«Es probable, y le digo en qué se van a diferenciar: pregúnteles si le entregan el
sistema de alertas funcionando y quién lo gestiona en marzo, o si le entregan un
inventario en Excel. No es el mismo producto.»*

**«¿Y si lo hacemos internamente?»**
*«Es la opción correcta a largo plazo y le ayudo a llegar ahí: por eso capacitamos a
su gente y el sistema queda documentado. Lo que le vendemos es no esperar dos años ni
aprenderlo a punta de hallazgos.»*

**«¿Me garantiza que pasamos la auditoría?»**
Nunca se promete. *«No, y desconfíe de quien se lo prometa: eso lo decide el auditor.
Lo que le garantizo es que el control de instrumentos deja de ser el motivo del
hallazgo, con evidencia lista para presentar.»*

### 6.4 Señales para no vender

Se declina cuando: el prospecto pide honorarios contra resultado · quiere solo el
documento sin tocar la operación · no hay un responsable identificable de calidad ·
regatea antes del diagnóstico · pide entrega en un plazo que rompe KR3.1 · o ya hay
dos Setup en curso (KR3.4).

**Decir que no a tiempo es más rentable que entregar tarde y mal.** El primer cliente
insatisfecho, en un mercado donde todos los gerentes de calidad del Valle Central se
conocen, cuesta más que los tres proyectos siguientes.

### 6.5 Revisión de precios

Anual, o antes si **tres prospectos consecutivos del mismo plan** rechazan
explícitamente por precio. Si la conversión Instalación → Soporte Continuo cae por debajo del 40 %,
el problema no es el precio: es el alcance del Soporte Continuo o la calidad de la entrega.
