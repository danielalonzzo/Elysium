(function () {
    'use strict';

    const currentRegion = document.currentScript.dataset.region;
    const physical = currentRegion === 'EU' || currentRegion === 'GLOBAL';
    const nativeLanguages = ['en', 'es', 'pt'];
    const preferenceKey = 'elysium_site_language';
    const pageUrl = new URL(window.location.href);
    const prefix = /^\/(es|pt)(?=\/|$)/.exec(pageUrl.pathname);
    const normalizeLanguage = value => (value || '').trim().toLowerCase().split(/[-_]/)[0];
    const deviceLanguage = normalizeLanguage(navigator.language || navigator.languages?.[0]);

    const copy = {
        en: {
            title: 'Visit a different Elysium site?',
            descriptions: {
                EU: 'There is an Elysium site for visitors in Europe.',
                ES: 'There is an Elysium site for visitors in Spain.',
                PT: 'There is an Elysium site for visitors in Portugal.',
                CR: 'There is an Elysium site for visitors in Costa Rica.',
                GLOBAL: 'The global Elysium site serves international visitors.'
            },
            visit: 'Go to recommended site',
            stay: 'Stay here'
        },
        es: {
            title: '¿Quieres cambiar de sitio?',
            descriptions: {
                EU: 'Elysium tiene un sitio para quienes visitan desde Europa.',
                ES: 'Elysium tiene un sitio para quienes visitan desde España.',
                PT: 'Elysium tiene un sitio para quienes visitan desde Portugal.',
                CR: 'Elysium tiene un sitio para quienes visitan desde Costa Rica.',
                GLOBAL: 'El sitio global de Elysium está dirigido a visitantes internacionales.'
            },
            visit: 'Ir al sitio recomendado',
            stay: 'Seguir aquí'
        },
        pt: {
            title: 'Pretende mudar de site?',
            descriptions: {
                EU: 'A Elysium tem um site para quem visita a partir da Europa.',
                ES: 'A Elysium tem um site para quem visita a partir de Espanha.',
                PT: 'A Elysium tem um site para quem visita a partir de Portugal.',
                CR: 'A Elysium tem um site para quem visita a partir da Costa Rica.',
                GLOBAL: 'O site global da Elysium destina-se a visitantes internacionais.'
            },
            visit: 'Ir para o site recomendado',
            stay: 'Ficar neste site'
        }
    };

    function readPreference() {
        try {
            return window.localStorage.getItem(preferenceKey);
        } catch {
            return null;
        }
    }

    function rememberLanguage(language) {
        try {
            window.localStorage.setItem(preferenceKey, language);
        } catch {
            // El selector funciona también con el almacenamiento desactivado.
        }
    }

    function preferredLanguage(liveLanguages = []) {
        const supported = [...nativeLanguages, ...liveLanguages];
        const saved = readPreference();
        const explicit = normalizeLanguage(pageUrl.searchParams.get('lang'));
        // El selector de región anterior añadía inglés a todos los enlaces a Europa.
        const legacyRegionLink = explicit === 'en' && pageUrl.searchParams.get('region') === 'EU'
            && pageUrl.searchParams.get('override') === 'true';
        if (supported.includes(explicit) && !legacyRegionLink) return explicit;
        if (liveLanguages.includes(saved)) return saved;
        if (prefix) return prefix[1];
        if (supported.includes(saved)) return saved;
        return supported.includes(deviceLanguage) ? deviceLanguage : 'en';
    }

    window.ElysiumSitePreferences = { preferredLanguage, rememberLanguage, deviceLanguage };

    if (physical) {
        document.addEventListener('click', event => {
            const option = event.target.closest?.('.lang-switcher-menu a[data-lang], .lang-switcher-menu button[data-lang]');
            if (nativeLanguages.includes(option?.dataset.lang)) rememberLanguage(option.dataset.lang);
        }, true);
    }

    function openPhysicalLanguage(language) {
        if (!physical || !nativeLanguages.includes(language) || language === (prefix?.[1] || 'en')) return false;
        const localized = new URL(pageUrl);
        const path = prefix ? pageUrl.pathname.slice(prefix[0].length) || '/' : pageUrl.pathname;
        localized.pathname = language === 'en' ? path : `/${language}${path}`;
        window.location.replace(localized);
        return true;
    }

    function showSuggestion(suggestion) {
        const dismissalKey = `elysium_region_dismissed:${currentRegion}:${suggestion.region}`;
        try {
            if (window.sessionStorage.getItem(dismissalKey)) return;
        } catch {
            // El aviso sigue disponible aunque no se pueda recordar su cierre.
        }

        const language = normalizeLanguage(document.documentElement.lang);
        const messages = copy[language] || copy.en;
        const description = messages.descriptions[suggestion.region];
        if (!description) return;

        const target = new URL(suggestion.url);
        for (const [key, value] of pageUrl.searchParams) {
            if (!['lang', 'region', 'override', 'national'].includes(key)) target.searchParams.append(key, value);
        }
        target.hash = pageUrl.hash;

        const stylesheet = document.createElement('link');
        stylesheet.rel = 'stylesheet';
        stylesheet.href = '/CSS/elysium-regions.css';
        document.head.append(stylesheet);

        const notice = document.createElement('aside');
        notice.className = 'elysium-region-notice';
        notice.setAttribute('aria-labelledby', 'elysium-region-title');

        const title = document.createElement('h2');
        title.id = 'elysium-region-title';
        title.textContent = messages.title;
        const summary = document.createElement('p');
        summary.setAttribute('role', 'status');
        summary.textContent = description;

        const actions = document.createElement('div');
        actions.className = 'elysium-region-actions';
        const stay = document.createElement('button');
        stay.type = 'button';
        stay.textContent = messages.stay;
        const visit = document.createElement('a');
        visit.href = target.href;
        visit.textContent = messages.visit;
        stay.addEventListener('click', () => {
            try {
                window.sessionStorage.setItem(dismissalKey, 'true');
            } catch {
                // El aviso se puede cerrar sin almacenamiento.
            }
            notice.remove();
        });
        actions.append(stay, visit);
        notice.append(title, summary, actions);
        document.body.append(notice);
    }

    async function initialise() {
        const national = window.ElysiumI18n;
        const language = preferredLanguage(window.ElysiumTranslate?.languages);
        if (openPhysicalLanguage(language)) return;

        const endpoint = new URL('/__region', pageUrl);
        endpoint.searchParams.set('path', pageUrl.pathname);
        try {
            const response = await fetch(endpoint);
            if (response.status !== 200) return;
            const suggestion = await response.json();
            if (national?.enabled) await national.init();
            showSuggestion(suggestion);
        } catch {
            // La página sigue disponible si no se puede obtener una sugerencia.
        }
    }

    document.addEventListener('DOMContentLoaded', initialise, { once: true });
})();
