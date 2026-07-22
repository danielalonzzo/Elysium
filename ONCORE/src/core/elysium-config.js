/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ADAPTADOR DE CONFIGURACIÓN DE `elysium-core/` — ONCORE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Punto único donde ONCORE personaliza los componentes nucleares:
 *
 *      F01 Loading Page          window.ELYSIUM_PRELOADER
 *      F05 Information System    window.ELYSIUM_SYSTEM
 *      F06 System Update         (incluido en F05)
 *      F08 Cookies Management    window.ELYSIUM_CONSENT
 *
 *  Toda personalización pasa por estos objetos: el código de `elysium-core/`
 *  no se toca dentro del proyecto de cliente (§4.2 del estándar).
 *
 *  Este archivo es externo y no inline a propósito. Con la configuración en un
 *  `<script>` incrustado, la CSP del Security Core (F07) obligaría a `hashes`
 *  `sha256-…` que habría que recalcular en cada edición; sirviéndola como
 *  archivo, `script-src 'self'` basta y no hay `unsafe-inline` en ningún sitio.
 *
 *  La versión NO se declara aquí: su punto único de verdad es
 *  `<meta name="app-version">`, que lee el propio componente F05 (§6.1).
 *
 *  Zero-dependency.
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function (window, document) {
    'use strict';

    var lang = (document.documentElement.getAttribute('lang') || 'pt').toLowerCase();
    var isEnglish = lang.indexOf('en') === 0;

    /** Raíz del árbol de idioma actual, para resolver rutas legales reales. */
    var ROOT = isEnglish ? '/ONCORE/en/' : '/ONCORE/';

    /** Acento de marca (terracota ONCORE, espejo de `--terracotta`). */
    var ACCENT = '#C1683F';

    /** Trazo «activity» de la marca, inline para no depender del set de iconos. */
    var LOGO_SVG =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
        'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>';

    /**
     * Tema activo en el momento de arrancar, fijado por F13 en `<head>`.
     * @returns {string} `'light'` o `'dark'`.
     */
    function activeTheme() {
        return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    }

    var isDark = activeTheme() === 'dark';

    // ── F01 · Loading Page ──────────────────────────────────────────────────
    window.ELYSIUM_PRELOADER = {
        brandName: 'ONCORE',
        tagline: 'Cancer Recovery & Survivorship Center',
        accent: ACCENT,
        background: isDark ? '#141A17' : '#FBF7F0',
        foreground: isDark ? '#EDE7DC' : '#27332E',
        logoSvg: LOGO_SVG,
        minDuration: 1000,
        maxDuration: 8000
    };

    // ── F05 · Information System  +  F06 · System Update ────────────────────
    window.ELYSIUM_SYSTEM = {
        stage: 'Beta',
        license: 'ONC-2026-RBC1-MFPT',
        brandName: 'ONCORE',
        accent: ACCENT,
        theme: activeTheme(),
        logoSvg: LOGO_SVG,
        legal: {
            // `terms` se omite deliberadamente: ONCORE no publica todavía
            // términos y condiciones, y el estándar prohíbe enlazar a '#'.
            privacy: ROOT + 'privacy-policy.html'
        },
        healthEndpoint: '/ONCORE/manifest.json',
        compliance: {
            privacyDirective: isEnglish
                ? 'ePrivacy Directive · Cookie Consent v1.0'
                : 'Diretiva ePrivacy · Cookie Consent v1.0',
            infrastructure: 'HSTS · CSP N3',
            legalFramework: 'RGPD (UE) · Lei 58/2019 (PT) · CNPD'
        },
        org: {
            rows: [
                {
                    label: isEnglish ? 'Organisation' : 'Organização',
                    value: 'ONCORE — Cancer Recovery & Survivorship Center'
                },
                { label: isEnglish ? 'Web Portal' : 'Portal Web', value: 'oncore.pt', href: 'https://oncore.pt' },
                {
                    label: isEnglish ? 'Support Channel' : 'Canal de Apoio',
                    value: 'info@oncore.pt', href: 'mailto:info@oncore.pt'
                },
                {
                    label: isEnglish ? 'Location' : 'Localização',
                    value: 'Miraflores, Oeiras — Lisboa'
                }
            ]
        },
        attributions: [
            { label: isEnglish ? 'Typography' : 'Tipografia', value: 'Playfair Display · Inter (SIL OFL 1.1)' },
            { label: isEnglish ? 'Icons' : 'Ícones', value: 'Lucide Icons (ISC)' }
        ],
        developer: { name: 'Elysium λ Development & Research', url: 'https://elysiumdr.eu' },
        copyright: isEnglish
            ? '© 2026 ONCORE — Cancer Recovery & Survivorship Center. All rights reserved.'
            : '© 2026 ONCORE — Cancer Recovery & Survivorship Center. Todos os direitos reservados.',
        mountSelector: '.footer-bottom-inner'
    };

    // F13 Dynamic Theme se configura en `src/core/theme.js`, que debe ejecutarse
    // ANTES que este archivo: aquí ya se lee el tema que aquél ha resuelto.

    // ── F08 · Cookies Management ────────────────────────────────────────────
    window.ELYSIUM_CONSENT = {
        policyVersion: '1.0',
        accent: ACCENT,
        theme: activeTheme(),
        // ONCORE no carga hoy ninguna herramienta de marketing ni de perfilado;
        // se declara solo la categoría analítica, y sigue sin activarse hasta
        // que exista opt-in explícito.
        categories: [{ id: 'analytics' }],
        links: {
            privacy: ROOT + 'privacy-policy.html',
            cookies: ROOT + 'cookie-policy.html'
        }
    };
})(window, document);
