/**
 * Errores del sistema: un **código estable** y su frase.
 *
 * El código es lo que comparan las pruebas y lo que decide una pantalla; la
 * frase es lo que lee la persona, en español de Costa Rica y de usted. Así se
 * puede reescribir un mensaje sin romper una prueba ni una vista.
 *
 * Viven en el núcleo, y no en el Worker, porque los enseñan dos anfitriones:
 * el API (que responde `{ error, code }`) y la demo, que corre el mismo motor
 * dentro del navegador y no tiene servidor que le redacte nada.
 */

export const MESSAGES = Object.freeze({
    BAD_ORIGIN: 'Origen inválido.',
    BAD_FORMAT: 'El formato de la solicitud no es válido.',
    TOO_LARGE: 'La solicitud es demasiado grande.',
    BAD_JSON: 'El contenido enviado no es JSON válido.',
    NOT_FOUND: 'No encontramos lo que busca.',
    ROUTE_NOT_FOUND: 'Esa ruta no existe.',
    METHOD_NOT_ALLOWED: 'Ese método no se admite en esta ruta.',
    UNAUTHENTICATED: 'Inicie sesión para continuar.',
    EMAIL_NOT_VERIFIED: 'Confirme su correo electrónico antes de entrar.',
    ACCOUNT_DISABLED: 'Esta cuenta está desactivada. Comuníquese con VALTRIX.',
    NO_ROLE: 'Su cuenta todavía no tiene acceso asignado. Comuníquese con VALTRIX.',
    FORBIDDEN: 'No tiene permiso para esta operación.',
    RATE_LIMITED: 'Demasiados intentos. Espere un minuto y vuelva a probar.',
    UNAVAILABLE: 'Servicio temporalmente no disponible.',
    INVALID_INPUT: 'Revise los datos indicados.',
    CONFLICT: 'Los datos cambiaron mientras tanto. Actualice y vuelva a intentarlo.',
    NOT_CONFIGURED: 'El servicio todavía no está configurado.',

    // Negocio y membresía
    TENANT_REQUIRED: 'Indique con cuál negocio está trabajando.',
    TENANT_NOT_FOUND: 'Ese negocio no existe.',
    NOT_A_MEMBER: 'No pertenece a ese negocio.',
    MEMBERSHIP_SUSPENDED: 'Su acceso a este negocio está suspendido.',
    LAST_OWNER: 'Un negocio no puede quedarse sin propietario.',
    ALREADY_MEMBER: 'Esa persona ya tiene acceso a este negocio.',

    // Suscripción y módulos
    SUBSCRIPTION_INACTIVE: 'La suscripción de este negocio no está activa.',
    SUBSCRIPTION_SUSPENDED: 'La suscripción está suspendida: puede consultar sus datos, pero no registrar movimientos.',
    MODULE_LOCKED: 'Este módulo se habilita más adelante en la suscripción.',
    INVALID_TRANSITION: 'Ese cambio de estado no es posible desde el estado actual.',
    PERIOD_ALREADY_SETTLED: 'Ese período de la suscripción ya está liquidado.',

    // Control financiero
    PRODUCT_CODE_TAKEN: 'Ya existe un producto con ese código en este negocio.',
    PRODUCT_INACTIVE: 'Ese producto está desactivado.',
    NOT_STOCKED: 'Un servicio no lleva existencias.',
    STOCK_CHANGED: 'Las existencias cambiaron mientras registraba. Revise y confirme de nuevo.',
    STOCK_INSUFFICIENT: 'No hay existencias suficientes para esa salida.',
    DOCUMENT_CLOSED: 'Este documento ya no se puede modificar.',
    HAS_PAYMENTS: 'Esta venta ya tiene cobros aplicados. Anule primero esos cobros.',
    PAYMENT_OVER_ALLOCATED: 'No puede asignar más de lo que suma el pago.',
    PAYMENT_EXCEEDS_BALANCE: 'El cobro supera lo que ese cliente debe.',
    NOTHING_TO_COLLECT: 'Ese cliente no tiene saldos pendientes.',
    CURRENCY_MISMATCH: 'La moneda del cobro no coincide con la de la obligación.',
    CUSTOMER_REQUIRED: 'Una venta a crédito necesita un cliente.',
    PERIOD_CLOSED: 'Ese período ya está cerrado.',
    PERIOD_NOT_FINISHED: 'Ese mes todavía no termina: el cierre se genera cuando acaba.',
    FUTURE_DATE: 'La fecha no puede ser posterior a hoy.',

    // Orden operativo
    PROCESS_NOT_PUBLISHED: 'Esa lista todavía no está publicada.',
    NOT_SCHEDULED: 'Esa lista no corresponde a esa fecha.',
    RUN_DATE_CLOSED: 'Solo se pueden marcar tareas de hoy o de ayer.',
    NOT_ASSIGNED: 'Esa lista está asignada a otra persona.',

    // Incorporación
    INTAKE_NOT_FOUND: 'Este enlace no es válido o ya venció. Pida uno nuevo a VALTRIX.',
    INTAKE_LOCKED: 'Este formulario ya fue enviado. Si necesita corregir algo, escriba a VALTRIX.',
    INTAKE_EMPTY: 'Agregue al menos un producto o servicio antes de enviar.',
    INTAKE_NOT_SUBMITTED: 'El negocio todavía no ha enviado el formulario.',
    INTAKE_ALREADY_APPLIED: 'Esta incorporación ya fue cargada al sistema.'
});

/** Estado HTTP de cada código que lanza el motor. Lo que no esté aquí es un 400. */
const STATUS = Object.freeze({
    MODULE_LOCKED: 402,
    SUBSCRIPTION_SUSPENDED: 402,
    NOT_FOUND: 404,
    INTAKE_NOT_FOUND: 404,
    FORBIDDEN: 403,
    NOT_ASSIGNED: 403,
    CONFLICT: 409,
    PRODUCT_CODE_TAKEN: 409,
    STOCK_CHANGED: 409,
    STOCK_INSUFFICIENT: 409,
    DOCUMENT_CLOSED: 409,
    HAS_PAYMENTS: 409,
    PERIOD_CLOSED: 409,
    PERIOD_NOT_FINISHED: 409,
    PERIOD_ALREADY_SETTLED: 409,
    ALREADY_MEMBER: 409,
    INTAKE_LOCKED: 409,
    INTAKE_ALREADY_APPLIED: 409,
    INTAKE_NOT_SUBMITTED: 409,
    RUN_DATE_CLOSED: 409
});

export class DomainError extends Error {
    constructor(code, extra = {}) {
        super(code);
        this.name = 'DomainError';
        this.code = code;
        this.status = STATUS[code] || 400;
        this.extra = extra;
    }
}

export const raise = (code, extra) => { throw new DomainError(code, extra); };

/** Un dato de entrada que no vale, con el campo que hay que revisar. */
export const invalid = field => raise('INVALID_INPUT', { field });

export const messageFor = code => MESSAGES[code] || MESSAGES.INVALID_INPUT;

/** Los dos almacenes lanzan un error con este código cuando una precondición no se cumple. */
export const isConflict = error => error?.code === 'CONFLICT';
