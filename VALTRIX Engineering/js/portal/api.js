/**
 * Cliente del API. Cada petición lleva el ID token; los errores llegan ya
 * redactados por el servidor y se lanzan con su código estable.
 *
 * El portal enseña `error`, nunca inventa el texto; y decide con `code`,
 * nunca comparando la frase. Así se puede reescribir un mensaje sin romper una
 * pantalla.
 *
 * En la demo no hay servidor: `useTransport` cambia el `fetch` por el motor
 * corriendo dentro del navegador (`demo.js`). Las vistas no se enteran —piden
 * las mismas rutas y reciben las mismas respuestas—, y por eso lo que enseña
 * la demo es lo que hace el sistema.
 */

import { idToken } from './session.js';

export class ApiError extends Error {
    constructor(message, { status = 0, code = 'UNKNOWN', extra = {} } = {}) {
        super(message);
        this.status = status;
        this.code = code;
        this.extra = extra;
    }
}

let transport = null;

/** Sustituye la red por otra cosa que responda a las mismas rutas. */
export function useTransport(handler) {
    transport = handler;
}

async function headers(extra = {}) {
    const token = await idToken();
    return { ...(token ? { authorization: `Bearer ${token}` } : {}), ...extra };
}

export async function api(path, { method = 'GET', body = undefined } = {}) {
    if (transport) return transport(path, { method, body });
    let response;
    try {
        response = await fetch(`/api${path}`, {
            method,
            credentials: 'same-origin',
            headers: await headers(body === undefined ? {} : { 'content-type': 'application/json' }),
            body: body === undefined ? undefined : JSON.stringify(body)
        });
    } catch {
        throw new ApiError('No hay conexión con el servicio. Revise su red.', { code: 'NETWORK' });
    }
    let data = {};
    try { data = await response.json(); } catch { data = {}; }
    if (!response.ok) {
        const { error, code, ...extra } = data || {};
        throw new ApiError(error || 'No se pudo completar la operación.', {
            status: response.status, code: code || 'UNKNOWN', extra
        });
    }
    return data;
}

export const get = path => api(path);
export const post = (path, body = {}) => api(path, { method: 'POST', body });
export const patch = (path, body = {}) => api(path, { method: 'PATCH', body });
export const put = (path, body = {}) => api(path, { method: 'PUT', body });
