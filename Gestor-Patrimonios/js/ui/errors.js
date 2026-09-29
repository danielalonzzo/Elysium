/**
 * Mensajes de error para personas. Los errores de Firebase llegan con textos en
 * inglés («Missing or insufficient permissions.») o con códigos internos; aquí
 * se traducen a algo que se pueda leer y de lo que se pueda hacer algo.
 */

const MESSAGES = {
    'permission-denied': 'No tiene permiso para guardar esto. Revise que su licencia siga activa o, si escribió los signos «<» o «>», cámbielos.',
    unavailable: 'No hay conexión con el servidor. Sus cambios se enviarán solos al volver la red.',
    'deadline-exceeded': 'El servidor tardó demasiado en responder. Inténtelo de nuevo en unos segundos.',
    'resource-exhausted': 'El servicio está saturado por ahora. Inténtelo de nuevo en unos minutos.',
    unauthenticated: 'Su sesión venció. Salga y vuelva a entrar.',
    'not-found': 'Eso ya no existe. Puede que se haya borrado desde otro dispositivo.',
    'failed-precondition': 'No se pudo completar por el estado actual de sus datos. Recargue la página.',
    'storage/unauthorized': 'No tiene permiso para subir archivos. Revise que su licencia siga activa.',
    'storage/quota-exceeded': 'Se llenó el espacio de archivos disponible.',
    'storage/canceled': 'Se canceló la subida del archivo.',
    'storage/retry-limit-exceeded': 'La subida tardó demasiado. Revise su conexión e inténtelo de nuevo.',
    'auth/network-request-failed': 'Sin conexión. Revise su red y vuelva a intentarlo.'
};

/** Códigos que no merecen molestar a nadie (una navegación que se cancela, por ejemplo). */
const IGNORED = /^(AbortError|NotAllowedError)$/;

export function errorCode(error) {
    return String(error?.code || '').replace(/^firestore\//, '');
}

/**
 * @param {unknown} error
 * @param {string} [fallback]  texto si no se reconoce el error
 * @param {{trustMessage?: boolean}} [options]  `trustMessage: false` ignora el texto del error
 *   (un fallo inesperado del código trae mensajes técnicos en inglés que no le sirven a nadie)
 */
export function describeError(error, fallback = 'No se pudo completar. Inténtelo de nuevo.', { trustMessage = true } = {}) {
    const code = errorCode(error);
    if (MESSAGES[code]) return MESSAGES[code];
    // Los errores propios de la app (`new Error('El archivo supera los 10 MB.')`) ya vienen redactados.
    if (trustMessage && !code && error instanceof Error && error.message && error.message.length < 140) return error.message;
    return fallback;
}

export function isIgnorable(error) {
    return IGNORED.test(String(error?.name || '')) || /ResizeObserver loop/.test(String(error?.message || ''));
}
