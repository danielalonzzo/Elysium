# Contrato propuesto · F22 System Settings

Estado: **propuesta específica para Regalarte, pendiente de aprobación junto
con `01-informe-preliminar.md`**.

Este contrato no modifica el catálogo general de `ELYSIUM-STANDARDS.md`.

## 1. Definición

F22 es un panel accesible de preferencias de lectura que adapta localmente la
presentación de la interfaz sin modificar contenidos, precios, idioma, datos
comerciales ni lógica de negocio.

El estado inicial conserva exactamente la apariencia de la réplica. Solo
cambia cuando el visitante lo solicita.

## 2. Controles incluidos

### Tamaño del texto

- Estándar: 100 %, predeterminado.
- Ampliado: 112,5 %.
- Escala texto y controles, no logotipos ni imágenes.

### Movimiento

- Seguir el sistema: predeterminado.
- Reducir movimiento.
- La reducción desactiva el desplazamiento suave de F04 y presenta de
  inmediato los elementos de F03.
- `prefers-reduced-motion: reduce` siempre prevalece; F22 nunca fuerza
  animaciones contra la preferencia del sistema operativo.

### Contraste

- Estándar: predeterminado.
- Reforzado: aumenta contraste, bordes, subrayados y foco visible sin crear un
  tema claro/oscuro.

### Restablecer ajustes

Elimina exclusivamente las preferencias de F22 y recupera los valores
predeterminados.

## 3. Interfaz y accesibilidad

- Botón visible “Ajustes” con engranaje en el área del pie, próximo a F05 pero
  independiente.
- Diálogo titulado “Ajustes del sistema”.
- Aplicación inmediata, sin botón Guardar.
- Cierre mediante botón, `Escape` o fondo del diálogo.
- Al cerrar, el foco vuelve al activador.
- `role="dialog"`, `aria-modal="true"`, título asociado, trampa de foco y
  objetivos táctiles mínimos de 44 × 44 px.
- A 375 px se muestra como panel de ancho completo sin desplazamiento
  horizontal.

## 4. Estado y persistencia

Esquema lógico:

```js
{
  schema: 1,
  text: "standard" | "large",
  motion: "system" | "reduced",
  contrast: "standard" | "enhanced"
}
```

- Clave única: `elysium:f22:settings:v1`.
- Persistencia local en `localStorage`.
- Si el almacenamiento está bloqueado, lleno o corrupto, continúa en memoria
  con valores predeterminados.
- No usa cookies, identificadores, analítica, red ni servidor.
- F06 elimina esta preferencia durante su limpieza global.

Atributos sobre `<html>`:

```text
data-elysium-text
data-elysium-motion
data-elysium-contrast
```

Evento público: `elysium:settings:changed`.

API pública mínima:

```text
ElysiumSettings.show()
ElysiumSettings.close()
ElysiumSettings.get()
ElysiumSettings.set(partialState)
ElysiumSettings.reset()
```

Configuración white-label:

```js
window.ELYSIUM_SETTINGS = {
  storageKey: "elysium:f22:settings:v1",
  accent: "<color de marca>",
  defaults: {
    text: "standard",
    motion: "system",
    contrast: "standard"
  }
};
```

## 5. Arquitectura

F22 se implementará como módulo sin dependencias del proyecto:

```text
js/features/f22-system-settings.js
css/components/f22-system-settings.css
```

- No se modifica, copia ni parchea `elysium-core/`.
- No se inyecta contenido en el modal privado de F05.
- F05 y F06 conservan sus APIs canónicas.
- La lectura inicial usa un archivo externo compatible con CSP, sin
  `unsafe-inline`.
- Clases y elementos propios: prefijo `ely-settings-`.
- API pública: `ElysiumSettings`.

## 6. Exclusiones vinculantes

F22 no incorpora, muestra ni simula:

- sonido o volumen, correspondientes a F21;
- tema automático, F13;
- selector claro/oscuro, F14;
- idioma, F15;
- divisa o conversión de precios, F16;
- región;
- PWA, F17;
- cookies o consentimiento, F08;
- analítica, perfilado o sincronización remota.

El contraste reforzado es una ayuda de accesibilidad, no un tema alternativo.

## 7. Criterios de aceptación

- Estado predeterminado visualmente idéntico a la réplica.
- Tres ajustes aplicados inmediatamente y persistentes tras una recarga.
- F03 y F04 respetan la reducción de movimiento.
- Texto ampliado sin solapamientos ni desbordes a 375 px.
- Contraste reforzado mantiene al menos WCAG 2.1 AA.
- Navegación completa por teclado, foco visible y restauración del foco.
- Datos corruptos o `localStorage` bloqueado no rompen la interfaz.
- Restablecer recupera los tres valores predeterminados.
- F06 borra el estado persistido de F22.
- F22 no realiza solicitudes de red.
- El diff de `elysium-core/` permanece vacío.
- El inventario sigue siendo exactamente F01, F02, F03, F04, F05, F22, F06,
  F09 y F10.

## 8. Trazabilidad del legado

Se conserva del legado el panel de preferencias, la aplicación inmediata, la
persistencia local y la adaptación a la marca.

Se descartan deliberadamente el tema y los horarios de Paulo Morais; el sonido
y volumen de ONCORE; idioma, región y divisa; y la integración directa dentro
de `elysium-system-info.js`. Esos elementos corresponden a otras funciones o
violarían el carácter de solo lectura del core.
