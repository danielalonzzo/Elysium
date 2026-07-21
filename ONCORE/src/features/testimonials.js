/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  TESTEMUNHOS — carrusel de la sección Comunidade (feature de ONCORE)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Carrusel accesible: navegación por flechas, puntos indicadores, avance
 *  automático que se detiene al interactuar o al pasar el puntero, y pausa
 *  total con `prefers-reduced-motion`.
 *
 *  API pública  Oncore.initTestimonials()
 *
 *  Zero-dependency.
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function (window, document) {
    'use strict';

    var Oncore = window.Oncore = window.Oncore || {};

    /** Intervalo del avance automático, en ms. */
    var AUTOPLAY_MS = 7000;

    /**
     * Inicializa el carrusel de testemunhos.
     * @returns {void}
     */
    Oncore.initTestimonials = function initTestimonials() {
        var track = document.getElementById('testimonialTrack');
        var dotsWrap = document.getElementById('sliderDots');
        if (!track || !dotsWrap) return;

        var slider = document.getElementById('testimonialSlider');
        var slides = track.children.length;
        if (!slides) return;

        var isEnglish = document.documentElement.lang.toLowerCase().indexOf('en') === 0;
        var dotLabel = isEnglish ? 'Go to testimonial ' : 'Ir para o testemunho ';
        var index = 0;
        var timer = null;

        for (var i = 0; i < slides; i++) {
            var dot = document.createElement('button');
            dot.type = 'button';
            dot.setAttribute('aria-label', dotLabel + (i + 1));
            if (i === 0) dot.classList.add('active');
            (function (target) {
                dot.addEventListener('click', function () { goTo(target, true); });
            })(i);
            dotsWrap.appendChild(dot);
        }
        var dots = dotsWrap.querySelectorAll('button');

        /**
         * Desplaza el carrusel a la diapositiva indicada.
         * @param {number}  i        Índice de destino (se normaliza en ciclo).
         * @param {boolean} [manual] `true` si procede de una acción del usuario.
         * @returns {void}
         */
        function goTo(i, manual) {
            index = (i + slides) % slides;
            track.style.transform = 'translateX(-' + (index * 100) + '%)';
            dots.forEach(function (d, di) { d.classList.toggle('active', di === index); });

            // Solo la diapositiva visible queda expuesta a lectores de pantalla.
            Array.prototype.forEach.call(track.children, function (slide, si) {
                slide.setAttribute('aria-hidden', String(si !== index));
            });

            if (manual) restartAuto();
        }

        function restartAuto() {
            stopAuto();
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            timer = window.setInterval(function () { goTo(index + 1); }, AUTOPLAY_MS);
        }

        function stopAuto() {
            if (timer !== null) { window.clearInterval(timer); timer = null; }
        }

        var prev = document.getElementById('prevTestimonial');
        var next = document.getElementById('nextTestimonial');
        if (prev) prev.addEventListener('click', function () { goTo(index - 1, true); });
        if (next) next.addEventListener('click', function () { goTo(index + 1, true); });

        // Detiene el avance mientras se lee un testemunho.
        if (slider) {
            slider.addEventListener('mouseenter', stopAuto);
            slider.addEventListener('mouseleave', restartAuto);
            slider.addEventListener('focusin', stopAuto);
            slider.addEventListener('focusout', restartAuto);
        }

        goTo(0);
        restartAuto();
    };
})(window, document);
