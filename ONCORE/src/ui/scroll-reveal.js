/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  F03 · SCROLL REVEAL — ONCORE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Los elementos con clase `.reveal` entran con fade-up al alcanzar el
 *  viewport, una sola vez (`unobserve` tras revelar, para liberar memoria).
 *
 *  Con `prefers-reduced-motion: reduce` no se marca ningún elemento y el
 *  contenido queda visible desde el primer fotograma (WCAG 2.1 AA).
 *
 *  API pública  Oncore.initScrollReveal()
 *
 *  Zero-dependency.
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function (window, document) {
    'use strict';

    var Oncore = window.Oncore = window.Oncore || {};

    /** Elementos de ONCORE que participan en la revelación progresiva. */
    var REVEAL_TARGETS = [
        '.section-head', '.values-lead', '.values-list-col', '.values-contact-col',
        '.about-media', '.about-text', '.service-card', '.steps-intro', '.step',
        '.team-card', '.referral-intro', '.benefit', '.testimonial-slider',
        '.contact-intro', '.contact-details', '.contact-form-panel',
        '.faq-head', '.faq-list', '.eco-card', '.eco-head'
    ].join(', ');

    /**
     * Inicializa la revelación por scroll.
     * @param {string} [selector] Selector de los elementos a revelar.
     * @returns {void}
     */
    Oncore.initScrollReveal = function initScrollReveal(selector) {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        var targets = document.querySelectorAll(selector || REVEAL_TARGETS);
        if (!targets.length) return;

        targets.forEach(function (el) { el.classList.add('reveal'); });

        var observer = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('visible');
                obs.unobserve(entry.target);          // revelar una sola vez
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

        targets.forEach(function (el) { observer.observe(el); });
    };
})(window, document);
