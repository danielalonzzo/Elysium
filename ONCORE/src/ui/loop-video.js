/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  VÍDEOS EM CICLO — planos de fundo mudos (feature de interface de ONCORE)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Governa todos os `[data-loop-video]` da página: vídeos mudos que correm em
 *  ciclo indefinidamente e não são leitores de media — não têm controlos, não
 *  recebem cliques nem foco, e o visitante nunca interage com eles.
 *
 *  Hoje há dois, e nunca coexistem: o retrato do hero, que desaparece abaixo
 *  dos 900 px, e o da secção «A ONCORE», que só aparece abaixo desses 900 px.
 *  Assim nunca há dois descodificadores de vídeo em simultâneo.
 *
 *  Este módulo cobre os quatro casos que o HTML sozinho não resolve:
 *
 *    1. `prefers-reduced-motion`. Um vídeo em ciclo é movimento contínuo, e o
 *       §6.6 do estándar exige respeitar a preferência. Com movimento reduzido
 *       não arranca e fica o `poster`, que é um fotograma do próprio vídeo: a
 *       composição não muda, apenas deixa de se mover.
 *    2. Arranque automático recusado. Alguns navegadores e modos de poupança
 *       recusam o `autoplay` mesmo em vídeo mudo; nesse caso fica o `poster` e
 *       tenta-se de novo quando a página volta a ficar visível.
 *    3. Fora do ecrã. Descodificar vídeo que ninguém vê gasta bateria sem
 *       contrapartida: pausa-se ao sair do viewport e retoma-se ao voltar.
 *    4. Oculto pelo ponto de corte. O que `display: none` esconde não deve
 *       consumir nada; ao mudar a largura da janela, o que passa a estar
 *       visível arranca e o outro pára.
 *
 *  API pública  Oncore.initLoopVideos()
 *
 *  Zero-dependency.
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function (window, document) {
    'use strict';

    var Oncore = window.Oncore = window.Oncore || {};

    /**
     * Inicializa todos os vídeos em ciclo da página.
     * @param {string} [selector='[data-loop-video]'] Seletor dos `<video>`.
     * @returns {void}
     */
    Oncore.initLoopVideos = function initLoopVideos(selector) {
        var videos = document.querySelectorAll(selector || '[data-loop-video]');
        if (!videos.length) return;

        var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

        /**
         * Indica se o vídeo está realmente à vista, e não escondido pelo ponto
         * de corte responsivo.
         * @param {HTMLVideoElement} video Elemento a inspecionar.
         * @returns {boolean} `true` se ocupa espaço no layout.
         */
        function isRendered(video) {
            return !!(video.offsetWidth || video.offsetHeight || video.getClientRects().length);
        }

        /**
         * Arranca o vídeo, se a preferência de movimento e o layout o permitirem.
         * @param {HTMLVideoElement} video Vídeo a reproduzir.
         * @returns {void}
         */
        function play(video) {
            if (reduceMotion.matches || !isRendered(video)) return;
            var attempt = video.play();
            // Em navegadores antigos `play()` não devolve promessa.
            if (attempt && typeof attempt.catch === 'function') {
                attempt.catch(function () { /* fica o poster; sem consola nem ruído */ });
            }
        }

        /**
         * Pára o vídeo e volta ao primeiro fotograma, que é o do `poster`.
         * @param {HTMLVideoElement} video Vídeo a deter.
         * @returns {void}
         */
        function stop(video) {
            video.pause();
            try { video.currentTime = 0; } catch (_) {}
        }

        /**
         * Reavalia todos: arranca o que está à vista, pára o que não está.
         * @returns {void}
         */
        function sync() {
            Array.prototype.forEach.call(videos, function (video) {
                if (isRendered(video) && !reduceMotion.matches) play(video);
                else stop(video);
            });
        }

        Array.prototype.forEach.call(videos, function (video) {
            if (typeof video.play !== 'function') return;

            // Garante que nunca sai som, aconteça o que acontecer com os atributos.
            video.muted = true;
            video.defaultMuted = true;

            // Só corre enquanto estiver à vista.
            if ('IntersectionObserver' in window) {
                new IntersectionObserver(function (entries) {
                    entries.forEach(function (entry) {
                        if (entry.isIntersecting) play(video); else video.pause();
                    });
                }, { threshold: 0.01 }).observe(video);
            }
        });

        // Preferência de movimento, também se mudar em pleno uso.
        if (reduceMotion.addEventListener) {
            reduceMotion.addEventListener('change', sync);
        }

        // Segunda tentativa quando a página volta a estar visível.
        document.addEventListener('visibilitychange', function () {
            if (!document.hidden) sync();
        });

        // Ao cruzar o ponto de corte troca-se qual dos dois está à vista.
        window.addEventListener('resize', sync, { passive: true });

        sync();
    };
})(window, document);
