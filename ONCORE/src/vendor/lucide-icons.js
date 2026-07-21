/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ICONOS — subconjunto local de Lucide (auto-alojado)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Sustituye a `https://unpkg.com/lucide@latest`. Motivos de la vendorización:
 *
 *    1. El Security Core (F07) prohíbe abrir `script-src` a dominios externos;
 *       con este archivo la CSP se mantiene en `script-src 'self'`.
 *    2. El paquete completo pesa 412 kB para los 32 iconos que usa el sitio.
 *       Este subconjunto ronda los 8 kB y no bloquea el LCP.
 *    3. `@latest` es un tag flotante: cualquier publicación en el registro
 *       cambiaba el código servido al cliente sin revisión previa.
 *
 *  Los iconos se renderizan como decorativos (`aria-hidden`): el contenido
 *  sustantivo de la página vive siempre en el HTML (F20 §4).
 *
 *  Regeneración: scripts/build-icons.py (versión fija abajo).
 *
 *  Iconos de Lucide — licencia ISC — https://lucide.dev
 *  Copyright (c) 2026 Lucide Icons and Contributors
 *
 *  Zero-dependency.
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function (window, document) {
    'use strict';

    /** Versión del paquete `lucide-static` de la que procede este subconjunto. */
    var LUCIDE_VERSION = '1.25.0';

    /**
     * Contenido interior de cada `<svg>`, indexado por el valor de `data-lucide`.
     * @type {Object.<string, string>}
     */
    var ICONS = {
        "activity": "<path d=\"M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2\"/>",
        "arrow-down": "<path d=\"M12 5v14\"/> <path d=\"m19 12-7 7-7-7\"/>",
        "arrow-right": "<path d=\"M5 12h14\"/> <path d=\"m12 5 7 7-7 7\"/>",
        "arrow-up-right": "<path d=\"M7 7h10v10\"/> <path d=\"M7 17 17 7\"/>",
        "bar-chart-3": "<path d=\"M3 3v16a2 2 0 0 0 2 2h16\"/> <path d=\"M18 17V9\"/> <path d=\"M13 17V5\"/> <path d=\"M8 17v-3\"/>",
        "briefcase": "<path d=\"M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16\"/> <rect width=\"20\" height=\"14\" x=\"2\" y=\"6\" rx=\"2\"/>",
        "calendar-check": "<path d=\"M8 2v4\"/> <path d=\"M16 2v4\"/> <rect width=\"18\" height=\"18\" x=\"3\" y=\"4\" rx=\"2\"/> <path d=\"M3 10h18\"/> <path d=\"m9 16 2 2 4-4\"/>",
        "chevron-left": "<path d=\"m15 18-6-6 6-6\"/>",
        "chevron-right": "<path d=\"m9 18 6-6-6-6\"/>",
        "clock": "<circle cx=\"12\" cy=\"12\" r=\"10\"/> <path d=\"M12 6v6l4 2\"/>",
        "droplets": "<path d=\"M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z\"/> <path d=\"M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97\"/>",
        "flask-conical": "<path d=\"M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2\"/> <path d=\"M6.453 15h11.094\"/> <path d=\"M8.5 2h7\"/>",
        "heart-handshake": "<path d=\"M19.414 14.414C21 12.828 22 11.5 22 9.5a5.5 5.5 0 0 0-9.591-3.676.6.6 0 0 1-.818.001A5.5 5.5 0 0 0 2 9.5c0 2.3 1.5 4 3 5.5l5.535 5.362a2 2 0 0 0 2.879.052 2.12 2.12 0 0 0-.004-3 2.124 2.124 0 1 0 3-3 2.124 2.124 0 0 0 3.004 0 2 2 0 0 0 0-2.828l-1.881-1.882a2.41 2.41 0 0 0-3.409 0l-1.71 1.71a2 2 0 0 1-2.828 0 2 2 0 0 1 0-2.828l2.823-2.762\"/>",
        "heart-pulse": "<path d=\"M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5\"/> <path d=\"M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27\"/>",
        "hospital": "<path d=\"M12 7v4\"/> <path d=\"M14 21v-3a2 2 0 0 0-4 0v3\"/> <path d=\"M14 9h-4\"/> <path d=\"M18 11h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h2\"/> <path d=\"M18 21V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16\"/>",
        "infinity": "<path d=\"M6 16c5 0 7-8 12-8a4 4 0 0 1 0 8c-5 0-7-8-12-8a4 4 0 1 0 0 8\"/>",
        "lightbulb": "<path d=\"M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5\"/> <path d=\"M9 18h6\"/> <path d=\"M10 22h4\"/>",
        "mail": "<path d=\"m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7\"/> <rect x=\"2\" y=\"4\" width=\"20\" height=\"16\" rx=\"2\"/>",
        "map-pin": "<path d=\"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0\"/> <circle cx=\"12\" cy=\"10\" r=\"3\"/>",
        "menu": "<path d=\"M4 5h16\"/> <path d=\"M4 12h16\"/> <path d=\"M4 19h16\"/>",
        "message-circle": "<path d=\"M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719\"/>",
        "monitor-smartphone": "<path d=\"M18 8V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h8\"/> <path d=\"M10 19v-3.96 3.15\"/> <path d=\"M7 19h5\"/> <rect width=\"6\" height=\"10\" x=\"16\" y=\"12\" rx=\"2\"/>",
        "phone": "<path d=\"M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384\"/>",
        "phone-call": "<path d=\"M13 2a9 9 0 0 1 9 9\"/> <path d=\"M13 6a5 5 0 0 1 5 5\"/> <path d=\"M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384\"/>",
        "plus": "<path d=\"M5 12h14\"/> <path d=\"M12 5v14\"/>",
        "send": "<path d=\"M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z\"/> <path d=\"m21.854 2.147-10.94 10.939\"/>",
        "shield-check": "<path d=\"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z\"/> <path d=\"m9 12 2 2 4-4\"/>",
        "smartphone": "<rect width=\"14\" height=\"20\" x=\"5\" y=\"2\" rx=\"2\" ry=\"2\"/> <path d=\"M12 18h.01\"/>",
        "star": "<path d=\"M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z\"/>",
        "stethoscope": "<path d=\"M11 2v2\"/> <path d=\"M5 2v2\"/> <path d=\"M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1\"/> <path d=\"M8 15a6 6 0 0 0 12 0v-3\"/> <circle cx=\"20\" cy=\"10\" r=\"2\"/>",
        "user-check": "<path d=\"m16 11 2 2 4-4\"/> <path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\"/> <circle cx=\"9\" cy=\"7\" r=\"4\"/>",
        "users": "<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\"/> <path d=\"M16 3.128a4 4 0 0 1 0 7.744\"/> <path d=\"M22 21v-2a4 4 0 0 0-3-3.87\"/> <circle cx=\"9\" cy=\"7\" r=\"4\"/>",
        "x": "<path d=\"M18 6 6 18\"/> <path d=\"m6 6 12 12\"/>"
    };

    var SVG_ATTRS =
        'xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" ' +
        'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
        'stroke-linejoin="round" aria-hidden="true" focusable="false"';

    /**
     * Sustituye cada `[data-lucide]` del ámbito indicado por su SVG.
     * Es idempotente: los nodos ya resueltos se marcan y no se reprocesan.
     * @param {ParentNode} [scope=document] Raíz sobre la que buscar.
     * @returns {void}
     */
    function createIcons(scope) {
        var root = scope || document;
        var nodes = root.querySelectorAll('[data-lucide]');

        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            var name = node.getAttribute('data-lucide');
            var inner = ICONS[name];

            if (!inner) {
                if (window.console) console.warn('[iconos] no incluido en el subconjunto: ' + name);
                continue;
            }

            var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.innerHTML = inner;
            svg.setAttribute('class', 'lucide lucide-' + name);
            svg.setAttribute('data-lucide-done', name);

            // Reproduce los atributos canónicos del SVG original de Lucide.
            SVG_ATTRS.replace(/([\w:-]+)="([^"]*)"/g, function (_, key, value) {
                svg.setAttribute(key, value);
                return '';
            });

            // Conserva las clases que el proyecto hubiera puesto en el marcador.
            if (node.className && typeof node.className === 'string') {
                svg.setAttribute('class', svg.getAttribute('class') + ' ' + node.className);
            }

            node.parentNode.replaceChild(svg, node);
        }
    }

    window.OncoreIcons = { createIcons: createIcons, version: LUCIDE_VERSION };

    // Compatibilidad con la API global que ya usaba el proyecto.
    window.lucide = window.lucide || { createIcons: createIcons };
})(window, document);
