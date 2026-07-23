# Inconsistencias normativas por resolver

## F22 · System Settings

`ELYSIUM-PROTOTYPING.md` v1.1.0 exige exactamente nueve funciones para el
prototipo, incluida **F22 · System Settings**. Sin embargo,
`ELYSIUM-STANDARDS.md` v2.1.1 declara identificadores estables únicamente de
F01 a F18 y no contiene contrato, API ni implementación canónica para F22.

Se localizaron tres referencias legadas, ninguna canónica:

- `../../Elysium/ONCORE/elysium-core/elysium-system-info.js`: ajustes de
  sonido, volumen, idioma, divisa y región integrados en F05/F06. El archivo se
  rotula F05+F06, no F22, y el core es de solo lectura.
- `../../Paulo Morais/pmorais/js/script.js` y `theme.js`: tema automático,
  horarios, idioma y región, pero acoplados a ese proyecto.
- `../../Elysium/JS/version-modal.js`: versión antigua con valores rígidos y
  una API obsoleta.

El 22 de julio de 2026 el equipo autorizó redactar un contrato específico a
partir del legado. La propuesta quedó en `CONTRATO-F22-PROPUESTO.md` y deberá
aprobarse junto con el informe preliminar antes de implementarla.

## F08 frente a “exactamente nueve”

El protocolo de prototipado exige **exactamente** F01, F02, F03, F04, F05,
F22, F06, F09 y F10 y excluye funciones adicionales no justificadas. El
estándar general incluye F08 dentro de sus controles transversales para
proyectos web Basic.

Interpretación provisional: para el prototipo manda la norma específica de
“exactamente nueve”, por lo que F08 no se incluiría hasta producción. Esta
interpretación debe quedar confirmada en `02-informe-aprobado.md`.
