# Correos de propuesta · 26/10/2026

Cuatro cartas para el CRM (Correo → Redactar → «Elegir .html»). El asunto no
va dentro del HTML: se escribe en el campo «Asunto».

| Plantilla | Para | Asunto |
|---|---|---|
| `CORREO-PROPUESTA-DR-JOHNNY-PIEDRA-2026-10-26.html` | uropiedra@gmail.com | Dr. Piedra, lo busqué en Google como un paciente |
| `CORREO-PROPUESTA-VET-DR-VALLADARES-2026-10-26.html` | luan.vale@hotmail.com | Dr. Valladares, vi su ficha de Google |
| `CORREO-PROPUESTA-VET-VILLALOBOS-2026-10-26.html` | drs.villalobos@hotmail.com | La sede de San Francisco no aparece en Google |
| `CORREO-PROPOSTA-NOVAVET-2026-10-26.html` | novavet@novavet.pt | A Novavet aparece no Google como farmácia |

Las direcciones son las públicas de cada prototipo (o de Facebook, en el caso
de Villalobos). Compruébelas antes de enviar.

## La estrategia: problema, énfasis, solución, llamada

Cada carta sigue el método problema-solución, y el problema no es genérico:
es lo que se ve hoy de cada negocio en Google, comprobado el 25/10/2026.

| Cliente | Problema (comprobado) | Énfasis (dato con fuente) | Prueba social |
|---|---|---|---|
| Dr. Piedra | 5 estrellas de solo 3 opiniones, la última de hace 5 años; sin sitio web | Cleveland Clinic (2019): 72 % de los hombres prefiere hacer oficio antes que ir al médico; 61 % iría más si fuera más cómodo | ONCORE (Lisboa) |
| Valladares | 3,5 estrellas, 14 opiniones; las dos primeras son quejas sin respuesta; sin sitio web | BrightLocal (2025): 89 % espera que el negocio responda a las opiniones | Pura Vida Pets (Heredia) |
| Villalobos | 296 opiniones repartidas en 3 fichas, ninguna con sitio; Santa Lucía y Santa Cecilia «sin reclamar»; San Francisco no aparece | Google: 76 % de quien busca algo cerca en el celular visita un negocio en menos de 24 h | Pura Vida Pets (Heredia) |
| Novavet | En Google figura como «Farmácia», por reivindicar, sin horario, fotos ni site; novavet.pt sin novedades desde mayo de 2021 | Google: el mismo 76 % | ONCORE + Elysium también es de Bragança |

La llamada a la acción es una sola: quince minutos esta semana (videollamada
en Costa Rica, visita al consultorio en Bragança). La urgencia va en la
posdata y es la propia promesa de borrado: **la demostración queda en línea
hasta el viernes 6 de noviembre de 2026**. Si no va a retirarla ese día,
cambie la fecha o quite la posdata con «Editar texto» en el CRM.

Fuentes de los datos:
- Cleveland Clinic, encuesta MENtion It (04/09/2019):
  https://newsroom.clevelandclinic.org/2019/09/04/cleveland-clinic-survey-men-will-do-almost-anything-to-avoid-going-to-the-doctor
- BrightLocal, Local Consumer Review Survey 2025:
  https://www.brightlocal.com/research/local-consumer-review-survey-2025/
- Think with Google, búsquedas «cerca de mí» en el móvil:
  https://www.thinkwithgoogle.com/data/mobile-near-me-searches/

## Lo que hay que saber

- **Los datos de Google cambian.** Si pasa una semana antes de enviar, vuelva a
  mirar las fichas: una opinión nueva o una ficha reclamada deja una frase en
  falso.
- **Precios en colones** al cambio de 590 ₡/€ (el de Elysium Patrimonio),
  redondeados: 70 € ≈ ₡40 000 y 120 € ≈ ₡70 000.
- **Lo que se promete y hay que poder cumplir:** pedir la opinión al cliente
  tras cada cita (Valladares, Dr. Piedra) y dejar las fichas de Google a nombre
  del cliente (Villalobos, Novavet). No vienen de serie en el plan Ecosystem:
  son de las «funciones a medida».
- **Imágenes remotas.** La foto es
  `elysiumdr.eu/Images/daniel-morales-20260924.jpg` y las vistas previas son
  las `og:image` de cada prototipo. Si se renombran o se borran, el correo
  sale con la imagen rota. El sello va por `cid:` y lo adjunta el backend.
- **Novavet no usa su `og:image`**: `novavet/images/og-clinica.jpg` es, byte a
  byte, la de Valladares («Dr. Luis Valladares · Heredia»). Su vista previa
  está hecha en HTML con los colores de Novavet. Mientras no se cambie, quien
  comparta el enlace de Novavet por WhatsApp verá la tarjeta de Valladares.
- **El CRM de la demo de Novavet está en español** (`crm.html`, `demo.html`,
  `portal.html`). Su carta no invita a abrirlo; lo público sí está en
  portugués.
- **El prototipo del Dr. Piedra no tiene agenda en línea** (las citas van por
  WhatsApp y teléfono); su carta la presenta como lo que se monta encima.
- **Villalobos** no tiene titular conocido: el saludo es «Estimados doctores
  Villalobos», como su propio correo (`drs.villalobos@…`). La Dra. Ingrid se
  nombra porque aparece en sus opiniones de Google.
- La carta de Novavet ofrece una visita al consultorio. Si no puede ir, cambie
  ese párrafo en el CRM.
