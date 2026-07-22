/* =========================================================================
 * Elysium λ · F12 — Magic Mouse
 * Concepto: "Gravedad Lambda Etérea"
 * Cursor de estado múltiple. Zero-dependency.
 * Solo CSS Transforms + Vanilla JS. Encapsulado en IIFE.
 *
 * Config:  window.ELYSIUM_MOUSE = { accent, ringSize, dotSize, lambdaSymbol, idleTimeout }
 * API:     window.ElysiumMouse  = { enable, disable }
 * ========================================================================= */
(function () {
    'use strict';

    /* ---- Configuración (gobernable desde window.ELYSIUM_MOUSE) ------------ */
    var DEFAULTS = {
        accent: 'var(--color-accent, #2997ff)', // hereda el acento del sitio
        ringSize: 32,                            // px — radio base del aura-cometa
        dotSize: 8,                              // px — diámetro del núcleo
        lambdaSymbol: 'λ',                       // carácter revelado en idle
        idleTimeout: 1500                        // ms — inactividad -> estado idle
    };
    var cfg = {};
    for (var k in DEFAULTS) { if (DEFAULTS.hasOwnProperty(k)) cfg[k] = DEFAULTS[k]; }
    var userCfg = window.ELYSIUM_MOUSE;
    if (userCfg) { for (var uk in userCfg) { if (userCfg.hasOwnProperty(uk)) cfg[uk] = userCfg[uk]; } }

    /* ---- Contrato F12 de accesibilidad ----------------------------------- */
    var finePointer = window.matchMedia('(pointer: fine)');
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    function isSupported() {
        return finePointer.matches && !reduceMotion.matches;
    }

    /* ---- Estado interno --------------------------------------------------- */
    var STYLE_ID = 'ely-mouse-styles';
    var LERP = 0.35;         // interpolación del aura (seguimiento ágil)
    var VEL_SMOOTH = 0.2;    // suavizado de la velocidad (evita jitter)
    var STRETCH_K = 0.018;   // px/frame -> factor de estiramiento
    var STRETCH_MAX = 0.9;   // tope de estiramiento del cometa

    var mounted = false;
    var rafId = null;
    var idleTimer = null;
    var isIdle = false;

    // Posición inmediata del ratón + posición interpolada del aura (cinemática)
    var mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
    var auraX = mouseX, auraY = mouseY;
    var velSmooth = 0;   // magnitud de velocidad suavizada
    var lastAngle = 0;   // dirección del movimiento (rad)

    // Referencias del DOM
    var root, dot, lambda, breath, breathCore, comet, cometCore;

    /* ---- Inyección de estilos (solo tras pasar las validaciones) ---------- */
    function injectStyles() {
        if (document.getElementById(STYLE_ID)) return;
        var css =
        'html.ely-cursor-active, html.ely-cursor-active body, ' +
        'html.ely-cursor-active *, html.ely-cursor-active *::before, ' +
        'html.ely-cursor-active *::after, html.ely-cursor-active *:hover, ' +
        'html.ely-cursor-active *:active, html.ely-cursor-active *:focus, ' +
        'html.ely-cursor-active *:visited { ' +
        ' cursor: none !important; }' +

        '.ely-cursor, .ely-cursor *, .ely-cursor-dot, .ely-cursor-breath, .ely-cursor-comet {' +
        ' pointer-events: none !important; }' +

        '.ely-cursor { position: fixed; top: 0; left: 0; width: 0; height: 0;' +
        ' z-index: 2147483646; transition: opacity .2s ease; }' +

        '.ely-cursor-dot, .ely-cursor-breath, .ely-cursor-comet {' +
        ' position: fixed; top: 0; left: 0;' +
        ' will-change: transform; }' +

        /* Núcleo (punto / lambda) */
        '.ely-cursor-dot { width: var(--ely-dot, 8px); height: var(--ely-dot, 8px);' +
        ' margin: 0; border-radius: 50%; background: var(--ely-accent, #2997ff);' +
        ' display: flex; align-items: center; justify-content: center;' +
        ' overflow: visible; transition: background-color .35s ease; z-index: 3; }' +
        '.ely-cursor-dot .ely-lambda { font: 600 22px/1 var(--font-heading, sans-serif);' +
        ' color: var(--ely-accent, #2997ff); opacity: 0; transform: scale(.4);' +
        ' transition: opacity .35s ease, transform .35s ease; user-select: none; }' +

        /* Respiración idle — capa externa posiciona, interna respira */
        '.ely-cursor-breath { width: calc(var(--ely-ring, 32px) * 2.6);' +
        ' height: calc(var(--ely-ring, 32px) * 2.6); opacity: 0;' +
        ' transition: opacity .6s ease; z-index: 1; }' +
        '.ely-cursor-breath-core { width: 100%; height: 100%; border-radius: 50%;' +
        ' background: radial-gradient(circle, var(--ely-accent, #2997ff) 0%, transparent 60%); }' +

        /* Aura-cometa cinemática — externa posiciona (lerp), interna se estira */
        '.ely-cursor-comet { width: calc(var(--ely-ring, 32px) * 1.4);' +
        ' height: calc(var(--ely-ring, 32px) * 1.4); opacity: .5;' +
        ' transition: opacity .4s ease; z-index: 2; }' +
        '.ely-cursor-comet-core { width: 100%; height: 100%; border-radius: 50%;' +
        ' transform-origin: center; will-change: transform;' +
        ' background: radial-gradient(circle, var(--ely-accent, #2997ff) 0%, transparent 68%); }' +

        /* Estado idle */
        '.ely-cursor.is-idle .ely-cursor-dot { background: transparent; }' +
        '.ely-cursor.is-idle .ely-cursor-dot .ely-lambda { opacity: 1; transform: scale(1); }' +
        '.ely-cursor.is-idle .ely-cursor-comet { opacity: 0; }' +
        '.ely-cursor.is-idle .ely-cursor-breath { opacity: .5; }' +
        '.ely-cursor.is-idle .ely-cursor-breath-core { animation: ely-breathe 3.4s ease-in-out infinite; }' +

        /* Clic (onda de choque) — posiciona con left/top, anima con transform */
        '.ely-ripple { position: fixed; pointer-events: none !important; z-index: 4;' +
        ' width: var(--ely-ring, 40px); height: var(--ely-ring, 40px);' +
        ' margin-left: calc(var(--ely-ring, 40px) / -2); margin-top: calc(var(--ely-ring, 40px) / -2);' +
        ' border: 1.5px solid var(--ely-accent, #2997ff); border-radius: 50%;' +
        ' will-change: transform, opacity; animation: ely-ripple .5s ease-out forwards; }' +

        '@keyframes ely-breathe { 0%, 100% { transform: scale(.8); opacity: .55; }' +
        ' 50% { transform: scale(1.1); opacity: .9; } }' +
        '@keyframes ely-ripple { 0% { transform: scale(.4); opacity: .8; }' +
        ' 100% { transform: scale(2.6); opacity: 0; } }';

        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = css;
        document.head.appendChild(style);
    }

    /* ---- Construcción del DOM -------------------------------------------- */
    function buildDom() {
        root = document.createElement('div');
        root.className = 'ely-cursor';
        root.setAttribute('aria-hidden', 'true');
        root.style.setProperty('--ely-accent', cfg.accent);
        root.style.setProperty('--ely-ring', cfg.ringSize + 'px');
        root.style.setProperty('--ely-dot', cfg.dotSize + 'px');

        breath = document.createElement('div');
        breath.className = 'ely-cursor-breath';
        breathCore = document.createElement('div');
        breathCore.className = 'ely-cursor-breath-core';
        breath.appendChild(breathCore);

        comet = document.createElement('div');
        comet.className = 'ely-cursor-comet';
        cometCore = document.createElement('div');
        cometCore.className = 'ely-cursor-comet-core';
        comet.appendChild(cometCore);

        dot = document.createElement('div');
        dot.className = 'ely-cursor-dot';
        lambda = document.createElement('span');
        lambda.className = 'ely-lambda';
        lambda.textContent = cfg.lambdaSymbol;
        dot.appendChild(lambda);

        root.appendChild(breath);
        root.appendChild(comet);
        root.appendChild(dot);
        document.body.appendChild(root);

        // Coloca las capas en la posición inicial (centro) sin esperar al primer move
        var initPos = translate(mouseX, mouseY);
        dot.style.transform = initPos;
        breath.style.transform = initPos;
        comet.style.transform = initPos;
    }

    function translate(x, y) {
        return 'translate(' + x + 'px, ' + y + 'px) translate(-50%, -50%)';
    }

    /* ---- Manejadores ------------------------------------------------------ */
    function onLeave() {
        if (root) root.style.opacity = '0';
    }

    function onEnter() {
        if (root) root.style.opacity = '1';
    }

    function onDragStart(e) {
        var target = e.target;
        // Solo previene el arrastre de imágenes para no bloquear la selección de texto
        if (target && target.tagName === 'IMG') {
            e.preventDefault();
        }
    }

    function onMove(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        if (root && root.style.opacity === '0') root.style.opacity = '1';

        // Núcleo y respiración: seguimiento inmediato (sin lerp) vía transform
        var pos = translate(mouseX, mouseY);
        dot.style.transform = pos;
        breath.style.transform = pos;

        if (isIdle) {
            isIdle = false;
            root.classList.remove('is-idle');
        }
        scheduleIdle();
    }

    function scheduleIdle() {
        if (idleTimer) clearTimeout(idleTimer);
        idleTimer = setTimeout(function () {
            isIdle = true;
            root.classList.add('is-idle');
        }, cfg.idleTimeout);
    }

    function onDown(e) {
        if (root && root.style.opacity === '0') root.style.opacity = '1';
        var cx = e.clientX, cy = e.clientY;

        // Diferir la creación del ripple a rAF para NO mutar el DOM durante mousedown y permitir selección de texto nativa
        requestAnimationFrame(function () {
            if (!root) return;
            var ripple = document.createElement('div');
            ripple.className = 'ely-ripple';
            ripple.style.left = cx + 'px';
            ripple.style.top = cy + 'px';
            root.appendChild(ripple);
            var remove = function () {
                if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
            };
            ripple.addEventListener('animationend', remove);
            setTimeout(remove, 600);
        });
    }

    /* ---- Bucle de animación — cinemática del aura-cometa ------------------ *
     * El aura persigue al ratón con Lerp; su velocidad interpolada define la
     * dirección y la magnitud del estiramiento (efecto cometa). Solo se escribe
     * transform (translate + rotate + scale): cero reflow.                     */
    function tick() {
        var prevX = auraX, prevY = auraY;
        auraX += (mouseX - auraX) * LERP;
        auraY += (mouseY - auraY) * LERP;

        var vx = auraX - prevX, vy = auraY - prevY;
        var speed = Math.sqrt(vx * vx + vy * vy);
        velSmooth += (speed - velSmooth) * VEL_SMOOTH;
        if (speed > 0.35) lastAngle = Math.atan2(vy, vx); // fija ángulo solo al moverse

        var stretch = velSmooth * STRETCH_K;
        if (stretch > STRETCH_MAX) stretch = STRETCH_MAX;

        // Exterior: posición interpolada (cabeza del cometa persigue al núcleo)
        comet.style.transform = translate(auraX, auraY);
        // Interior: se estira en la dirección del movimiento y se comprime en perpendicular
        cometCore.style.transform =
            'rotate(' + lastAngle + 'rad) scale(' + (1 + stretch) + ', ' + (1 - stretch * 0.5) + ')';

        rafId = requestAnimationFrame(tick);
    }

    /* ---- API pública ------------------------------------------------------ */
    function enable() {
        if (mounted || !isSupported()) return;
        if (!document.body) return; // se reintentará desde boot()
        injectStyles();
        buildDom();
        document.documentElement.classList.add('ely-cursor-active');

        document.addEventListener('mousemove', onMove, { passive: true });
        document.addEventListener('mousedown', onDown, { passive: true });
        document.addEventListener('mouseleave', onLeave, { passive: true });
        document.addEventListener('mouseenter', onEnter, { passive: true });

        mounted = true;
        scheduleIdle();
        rafId = requestAnimationFrame(tick);
    }

    function disable() {
        if (!mounted) return;
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        if (idleTimer) { clearTimeout(idleTimer); idleTimer = null; }

        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mousedown', onDown);
        document.removeEventListener('mouseleave', onLeave);
        document.removeEventListener('mouseenter', onEnter);

        document.documentElement.classList.remove('ely-cursor-active');
        if (root && root.parentNode) root.parentNode.removeChild(root);
        var style = document.getElementById(STYLE_ID);
        if (style && style.parentNode) style.parentNode.removeChild(style);

        root = dot = lambda = breath = breathCore = comet = cometCore = null;
        velSmooth = 0;
        isIdle = false;
        mounted = false;
    }

    /* ---- Reacción a cambios de entorno ----------------------------------- */
    function onEnvChange() {
        if (isSupported()) enable(); else disable();
    }
    function bindMQ(mq, handler) {
        if (mq.addEventListener) mq.addEventListener('change', handler);
        else if (mq.addListener) mq.addListener(handler); // Safari heredado
    }
    bindMQ(finePointer, onEnvChange);
    bindMQ(reduceMotion, onEnvChange);

    /* ---- Arranque --------------------------------------------------------- */
    function boot() {
        if (!isSupported()) return; // no se ejecuta en móvil ni con reduced-motion
        enable();
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
        boot();
    }

    window.ElysiumMouse = { enable: enable, disable: disable };
})();
