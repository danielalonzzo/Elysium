# Envío — Credenciales de correo profesional · Pura Vida Pets

## Cabecera del correo

| Campo | Valor |
|---|---|
| **De** | `Elysium <info@elysiumdr.eu>` |
| **Para** | `ceo.adrian.pochet@puravidapetscr.com` |
| **CC / CCO** | *ninguno* — el documento se emite para un destinatario único |
| **Asunto** | `Credenciales de correo profesional · Pura Vida Pets` |
| **Adjunto** | `ELYSIUM-PVP-CREDENCIALES-v1.1.0.pdf` (7 páginas, cifrado AES-256) |

El separador es el punto medio `·`, la convención de todos los asuntos que envía
Elysium (`Reunión confirmada · …`, `Nueva reunión · …`).

## Cuerpo

- `correo-credenciales.html` — versión HTML. Pégalo como código fuente del
  mensaje, no como texto: si lo pegas en el editor visual, el cliente de correo
  reescribe los estilos en línea y se pierde la maqueta.
- `correo-credenciales.txt` — versión de texto plano, para la parte
  `text/plain` del mensaje multiparte. Todos los correos de Elysium llevan una.

El preheader (`Documento confidencial para Adrián Arias Pochet.`) va oculto al
principio del HTML: es lo que se lee en la vista previa de la bandeja de
entrada, antes de abrir el mensaje.

## Contraseña de apertura del PDF

Se entrega **fuera de este correo**. Llamada telefónica o WhatsApp a Adrián,
nunca el mismo canal por el que viaja el archivo: si el buzón queda
comprometido, el adjunto sigue siendo ilegible.

El alfabeto de la contraseña excluye `0`/`O` y `1`/`l`/`I`, para que se pueda
dictar por teléfono sin ambigüedad.

## Antes de pulsar enviar

1. Que el destinatario sea exactamente `ceo.adrian.pochet@puravidapetscr.com`
   — dominio `puravidapetscr.com`, no `puravidapets.cr`.
2. Que no haya nadie en CC ni en CCO.
3. Que el adjunto sea el archivo cifrado y **no** una versión en claro.
4. Que la contraseña no aparezca en ninguna parte del cuerpo del mensaje.

## Después del envío

Estos archivos contienen, o dan acceso a, las contraseñas de toda la
infraestructura de correo del cliente. Guárdalos en tu gestor de contraseñas o
en almacenamiento cifrado, o bórralos. **No los dejes en el repositorio de
Elysium**: `_comercial/` está excluido de las tres listas de despliegue, pero no
de git, y un push a `main` los llevaría a GitHub. Del historial de git no se
borra nada, sólo se reescribe.
