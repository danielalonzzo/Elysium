/**
 * Rutas por hash: `#/metas/meta-123?modo=editar`.
 *
 * El hash permite enlaces profundos, atajos de la PWA y el botón atrás sin
 * tocar el servidor: Cloudflare solo sirve `/Gestor-Patrimonios/` y todo lo
 * demás ocurre en el navegador.
 */

/** Un `%` suelto en la dirección («#/metas/100%») hace fallar `decodeURIComponent`: se deja el trozo tal cual. */
function decodeSegment(segment) {
    try {
        return decodeURIComponent(segment);
    } catch {
        return segment;
    }
}

export function parseHash(hash = location.hash) {
    const clean = String(hash || '').replace(/^#\/?/, '');
    const [path, query = ''] = clean.split('?');
    const parts = path.split('/').filter(Boolean).map(decodeSegment);
    return {
        name: parts[0] || 'inicio',
        id: parts[1] || null,
        rest: parts.slice(2),
        query: Object.fromEntries(new URLSearchParams(query)),
        raw: clean
    };
}

export function onRouteChange(callback) {
    const handler = () => callback(parseHash());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
}

/** Cambia de ruta; si es la misma, fuerza el aviso igualmente. */
export function go(hash, { replace = false } = {}) {
    const target = hash.startsWith('#') ? hash : `#/${hash}`;
    if (location.hash === target) {
        window.dispatchEvent(new HashChangeEvent('hashchange'));
        return;
    }
    if (replace) {
        history.replaceState(history.state, '', target);
        window.dispatchEvent(new HashChangeEvent('hashchange'));
    } else {
        location.hash = target;
    }
}
