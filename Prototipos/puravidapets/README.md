# Pura Vida Pets

Aplicación React/Vite con Firebase Authentication, Cloud Firestore y Cloud Functions. La UI consume datos exclusivamente mediante `src/utils/dataService.js`; las operaciones sensibles no escriben directamente desde el navegador.

## Secciones funcionales

- `/#/`: paquetes y formulario de precalificación por buyer persona.
- `/#/contact`: precalificación antes del handoff a WhatsApp.
- `/#/portal`: billetera, bitácora, citas, galería y solicitud de suscripción del cliente.
- `/#/admin`: CRM en tiempo real para administradores y editores.
- `/#/walker`: agenda aislada del paseador y acceso sanitario temporal por asignación.

## Desarrollo local

1. Copiar `.env.example` a `.env` y completar la configuración web de Firebase/Google Maps.
2. Instalar dependencias con `npm install`.
3. Ejecutar `npm run dev`.

Comprobaciones disponibles:

```sh
npm test
npm run lint
npm run build
```

## Firebase

- Esquema/adaptador: `src/utils/dataService.js`
- Reglas: `firestore.rules`
- Índices: `firestore.indexes.json`
- Lógica privilegiada: `functions/index.js`
- Configuración local: `firebase.json`

Antes de usar un entorno real hay que instalar las dependencias de `functions/`, configurar `ERP_WEBHOOK_SECRET`, provisionar usuarios/roles con custom claims y desplegar manualmente Rules, índices y Functions. El despliegue no forma parte de `npm run build`.

La especificación completa está en `docs/pura-vida-pets-backend-architecture.md`.
