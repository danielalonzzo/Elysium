/* =========================================================================
 * Elysium λ · A01 — Aqua Audio
 * Concepto: "Gravedad Lambda Etérea" — la capa sonora del cursor.
 * Reproducción de samples vía Web Audio API. Zero-dependency.
 *
 * Voces (assets en /sounds):
 *   button   → click-en-boton.m4a    · botones y enlaces reales
 *   success  → enviado-con-exito.m4a · formulario enviado, login, plan elegido
 *   error    → error.m4a             · validación fallida, credenciales, fallos
 *   void     → toque-al-vacio.m4a    · click en cualquier zona no interactiva
 *
 * Contrato:
 *   - Volumen bajo y balanceado por voz (los samples vienen casi a 0 dBFS).
 *   - Mute persistente en localStorage (botón flotante siempre accesible).
 *   - AudioContext creado al cargar (arranca 'suspended') y reanudado en el
 *     primer gesto del usuario: respeta la política de autoplay.
 *   - Anti-acumulación: una nueva voz corta con fundido la anterior igual.
 *
 * Marcado opcional en HTML:  data-ely-sound="success|error|button|void|none"
 *
 * API:  window.ElysiumAudio = { play, mute, unmute, toggle, isMuted, ready }
 * ========================================================================= */
(function () {
    'use strict';

    if (!('AudioContext' in window || 'webkitAudioContext' in window)) return;

    var STORE_KEY = 'ely-audio-muted';
    var MASTER_VOLUME = 0.6;

    /* Ganancia por voz — compensa el nivel de cada sample.
     * 'void' suena en casi cada click, así que va deliberadamente más abajo. */
    var VOICES = {
        button:  { file: 'click-en-boton.m4a',    gain: 0.30 },
        success: { file: 'enviado-con-exito.m4a', gain: 0.40 },
        error:   { file: 'error.m4a',             gain: 0.40 },
        void:    { file: 'toque-al-vacio.m4a',    gain: 0.50 }
    };

    /* Ruta de /sounds deducida del propio <script> (funciona en /, /es/, /pt/,
     * /es/research/, etc. sin depender de rutas absolutas). */
    var script = document.currentScript;
    var BASE = script ? new URL('../sounds/', script.src).href : 'sounds/';

    var AC = window.AudioContext || window.webkitAudioContext;
    var ctx = null;
    var master = null;
    var buffers = {};
    var active = {};          // voz -> { src, gain } en reproducción
    var lastPlay = {};        // voz -> timestamp (anti-rebote)
    var muted = readMuted();
    var resumed = false;

    /* ---- Persistencia del mute ------------------------------------------- */
    function readMuted() {
        try { return localStorage.getItem(STORE_KEY) === '1'; }
        catch (e) { return false; }
    }
    function writeMuted(v) {
        try { localStorage.setItem(STORE_KEY, v ? '1' : '0'); } catch (e) {}
    }

    /* ---- Grafo de audio + precarga --------------------------------------- *
     * Crear el contexto sin gesto está permitido: nace 'suspended' y se puede
     * decodificar igualmente. Solo reanudarlo requiere interacción.          */
    function init() {
        try { ctx = new AC(); } catch (e) { return; }
        master = ctx.createGain();
        master.gain.value = MASTER_VOLUME;
        master.connect(ctx.destination);

        Object.keys(VOICES).forEach(function (name) {
            fetch(BASE + VOICES[name].file)
                .then(function (r) { return r.ok ? r.arrayBuffer() : Promise.reject(r.status); })
                .then(function (buf) {
                    return new Promise(function (res, rej) {
                        // Firma con callbacks: compatible con Safari heredado.
                        ctx.decodeAudioData(buf, res, rej);
                    });
                })
                .then(function (decoded) { buffers[name] = decoded; })
                .catch(function () { /* sample no disponible: esa voz queda muda */ });
        });
    }

    function resume() {
        if (resumed || !ctx) return;
        resumed = true;
        if (ctx.state === 'suspended') ctx.resume();
    }

    /* ---- Reproducción ----------------------------------------------------- */
    function play(voice) {
        if (muted || !ctx) return;
        var def = VOICES[voice];
        var buf = buffers[voice];
        if (!def || !buf) return;

        // Anti-rebote: ignora repeticiones de la misma voz en <70 ms.
        var now = ctx.currentTime;
        if (lastPlay[voice] && now - lastPlay[voice] < 0.07) return;
        lastPlay[voice] = now;

        // Corta con fundido la instancia previa de esta voz (evita apilado).
        var prev = active[voice];
        if (prev) {
            try {
                prev.gain.gain.cancelScheduledValues(now);
                prev.gain.gain.setValueAtTime(prev.gain.gain.value, now);
                prev.gain.gain.linearRampToValueAtTime(0.0001, now + 0.05);
                prev.src.stop(now + 0.06);
            } catch (e) {}
        }

        try {
            var g = ctx.createGain();
            g.gain.value = def.gain;
            g.connect(master);

            var src = ctx.createBufferSource();
            src.buffer = buf;
            src.connect(g);
            src.start(now);

            active[voice] = { src: src, gain: g };
            src.onended = function () {
                if (active[voice] && active[voice].src === src) active[voice] = null;
                try { g.disconnect(); } catch (e) {}
            };
        } catch (e) { /* silencioso ante fallos de audio */ }
    }

    /* ---- Resolución de la voz según el objetivo del click ----------------- */
    var INTERACTIVE = 'a[href], button, [role="button"], .btn, input[type="submit"],' +
                      ' input[type="button"], summary, [data-plan]';

    function resolveVoice(target) {
        var el = target;
        while (el && el.nodeType === 1 && el !== document.body) {
            // 1) Marcado explícito manda sobre todo lo demás.
            var explicit = el.getAttribute && el.getAttribute('data-ely-sound');
            if (explicit) return explicit === 'none' ? null : explicit;
            // 2) Los planes de suscripción se sienten como una confirmación.
            if (el.hasAttribute && el.hasAttribute('data-plan')) return 'success';
            // 3) Cualquier otro elemento interactivo.
            if (el.matches && el.matches(INTERACTIVE)) return 'button';
            el = el.parentElement;
        }
        // 4) Zona muerta de la página.
        return 'void';
    }

    /* ---- Escucha global (desktop y táctil) -------------------------------- *
     * Usamos 'click' en captura: no dispara en scroll ni en drag, así que el
     * sonido siempre acompaña a una acción intencionada.                      */
    function onClick(e) {
        resume();
        if (muted) return;
        if (e.target.closest && e.target.closest('.ely-audio-toggle')) return;
        var voice = resolveVoice(e.target);
        if (voice) play(voice);
    }

    /* ---- Botón de mute flotante ------------------------------------------ */
    var SPEAKER = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/></svg>';
    var MUTEDIC = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l4 6M21 9l-4 6"/></svg>';
    var toggleBtn = null;

    function injectButton() {
        if (toggleBtn) return;
        var css =
            '.ely-audio-toggle{position:fixed;left:1.25rem;bottom:1.25rem;z-index:2147483000;' +
            'width:40px;height:40px;display:flex;align-items:center;justify-content:center;' +
            'border-radius:50%;border:1px solid var(--color-accent,#2997ff);' +
            'background:rgba(10,12,16,.55);color:var(--color-accent,#2997ff);' +
            'backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);cursor:pointer;' +
            'opacity:.55;transition:opacity .25s ease,transform .25s ease,box-shadow .25s ease;' +
            'padding:0;line-height:0;}' +
            '.ely-audio-toggle:hover{opacity:1;transform:translateY(-2px);' +
            'box-shadow:0 0 14px var(--color-accent-glow,rgba(41,151,255,.5));}' +
            '.ely-audio-toggle:focus-visible{opacity:1;outline:2px solid var(--color-accent,#2997ff);outline-offset:2px;}' +
            '.ely-audio-toggle.is-muted{opacity:.4;}' +
            '@media (max-width:600px){.ely-audio-toggle{width:36px;height:36px;left:1rem;bottom:1rem;}}';
        var style = document.createElement('style');
        style.id = 'ely-audio-styles';
        style.textContent = css;
        document.head.appendChild(style);

        toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'ely-audio-toggle';
        document.body.appendChild(toggleBtn);
        toggleBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            resume();
            toggle();
        });
        renderButton();
    }

    function renderButton() {
        if (!toggleBtn) return;
        toggleBtn.innerHTML = muted ? MUTEDIC : SPEAKER;
        toggleBtn.classList.toggle('is-muted', muted);
        toggleBtn.setAttribute('aria-pressed', muted ? 'true' : 'false');
        toggleBtn.setAttribute('aria-label', muted ? 'Activar sonido' : 'Silenciar sonido');
        toggleBtn.setAttribute('title', muted ? 'Activar sonido' : 'Silenciar sonido');
    }

    /* ---- API pública ------------------------------------------------------ */
    function mute()   { muted = true;  writeMuted(true);  renderButton(); }
    function unmute() { muted = false; writeMuted(false); renderButton(); }
    function toggle() { if (muted) { unmute(); play('button'); } else { mute(); } }

    /* ---- Arranque --------------------------------------------------------- */
    init();
    function boot() {
        injectButton();
        document.addEventListener('click', onClick, { passive: true, capture: true });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
        boot();
    }

    window.ElysiumAudio = {
        play: play,
        mute: mute,
        unmute: unmute,
        toggle: toggle,
        isMuted: function () { return muted; },
        ready: function (v) { return !!buffers[v]; }
    };
})();
