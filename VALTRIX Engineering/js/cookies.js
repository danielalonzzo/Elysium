/**
 * ══════════════════════════════════════════════════════════════════════════════
 *  VALTRIX Engineering — Panel de estado de rastreo
 *  cookies.js  |  V1.0.0
 *
 *  Rellena el panel de `cookies.html` con lo que hay de verdad en el navegador
 *  de quien lee: cookies del dominio, claves de almacenamiento, programas de
 *  terceros cargados y dominios ajenos a los que se pidió algo. Es una
 *  comprobación, no una declaración: la política dice «no hay cookies» y esto
 *  lo enseña en la pantalla del visitante.
 *
 *  Tres reglas de diseño:
 *   1. Todo se mide en local. No hay ninguna petición de red; sería absurdo
 *      llamar a un servidor desde el panel que promete no llamar a ninguno.
 *   2. Si una medición sale mal, se dice. Un panel que solo sabe decir «cero»
 *      no vale nada: cuando aparece algo inesperado se marca en ámbar en vez
 *      de silenciarlo.
 *   3. Sin JavaScript el HTML ya trae los valores estáticos correctos, así que
 *      la página se lee igual; lo único que se pierde es la comprobación.
 *
 *  Uso: <script src="js/cookies.js"></script> al final de `cookies.html`.
 *  Sin dependencias.
 * ══════════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    // Las dos únicas claves que el sitio escribe (ver version-modal.js).
    var PREF_KEYS = ['vtx-pref-motion', 'vtx-pref-fab'];

    var NOMBRES = {
        'vtx-pref-motion': 'animaciones de fondo',
        'vtx-pref-fab':    'botón de contacto'
    };

    function $(id) { return document.getElementById(id); }

    // Escribe valor y color del punto. `warn` pinta ámbar: algo que no
    // esperábamos encontrar y que quien lee merece ver señalado.
    function set(id, text, warn) {
        var el = $(id);
        if (!el) return;
        el.textContent = text;
        var dot = el.parentNode && el.parentNode.querySelector('.trk-dot');
        if (dot) dot.classList.toggle('is-warn', !!warn);
    }

    // ── Cookies del dominio ───────────────────────────────────────────────────
    function contarCookies() {
        var crudo = '';
        try { crudo = document.cookie || ''; } catch (e) { return null; }
        return crudo.split(';').map(function (c) { return c.trim(); })
                    .filter(function (c) { return c.length > 0; });
    }

    // ── Claves de almacenamiento ──────────────────────────────────────────────
    // Devuelve null si el navegador tiene el almacenamiento bloqueado: no es un
    // fallo del sitio y no debe contarse como si hubiera datos guardados.
    function claves(store) {
        try {
            var s = window[store];
            if (!s) return null;
            var out = [];
            for (var i = 0; i < s.length; i++) out.push(s.key(i));
            return out;
        } catch (e) {
            return null;
        }
    }

    function describirClaves(lista, store) {
        if (lista === null) return { txt: 'bloqueado por su navegador', warn: false };
        if (lista.length === 0) return { txt: 'nada', warn: false };

        var propias = lista.filter(function (k) { return PREF_KEYS.indexOf(k) !== -1; });
        var ajenas  = lista.filter(function (k) { return PREF_KEYS.indexOf(k) === -1; });

        if (ajenas.length > 0) {
            return { txt: lista.length + ' clave(s), ' + ajenas.length + ' no declarada(s)', warn: true };
        }
        var etiquetas = propias.map(function (k) { return NOMBRES[k] || k; });
        return { txt: propias.length + ' preferencia' + (propias.length > 1 ? 's' : '')
                      + ' · ' + etiquetas.join(' y '), warn: false };
    }

    // ── Programas de terceros ─────────────────────────────────────────────────
    // Cuenta los <script src> que no salen de este mismo origen. Los cuatro
    // ficheros del sitio son propios, así que lo correcto aquí es cero.
    function scriptsAjenos() {
        var fuera = [];
        var lista = document.querySelectorAll('script[src]');
        for (var i = 0; i < lista.length; i++) {
            var src = lista[i].src || '';
            if (!src) continue;
            try {
                if (new URL(src, location.href).origin !== location.origin) fuera.push(src);
            } catch (e) { /* una URL ilegible no se cuenta como propia */ }
        }
        return fuera;
    }

    // ── Dominios ajenos a los que se pidió algo ───────────────────────────────
    // Se leen las peticiones reales de la página, no las que deberíamos haber
    // hecho. Las de tipografías se nombran; cualquier otra se marca en ámbar.
    var TIPOGRAFIAS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

    function dominiosAjenos() {
        if (!window.performance || !performance.getEntriesByType) return null;
        var vistos = {};
        var entradas = performance.getEntriesByType('resource') || [];
        for (var i = 0; i < entradas.length; i++) {
            try {
                var host = new URL(entradas[i].name, location.href).hostname;
                if (host && host !== location.hostname) vistos[host] = true;
            } catch (e) { /* ignorada */ }
        }
        return Object.keys(vistos);
    }

    function describirDominios(hosts) {
        if (hosts === null) return { txt: 'no se pudo medir aquí', warn: false };
        if (hosts.length === 0) return { txt: 'ninguno', warn: false };

        var otros = hosts.filter(function (h) { return TIPOGRAFIAS.indexOf(h) === -1; });
        if (otros.length > 0) {
            return { txt: otros.join(', '), warn: true };
        }
        return { txt: 'solo tipografías (Google Fonts)', warn: false };
    }

    // ── Señal de «no me rastree» ──────────────────────────────────────────────
    function senalNoRastrear() {
        var gpc = (navigator.globalPrivacyControl === true);
        var dnt = (navigator.doNotTrack === '1' || window.doNotTrack === '1' ||
                   navigator.msDoNotTrack === '1');
        if (gpc && dnt) return 'GPC y DNT activas · nada que apagar';
        if (gpc)        return 'GPC activa · nada que apagar';
        if (dnt)        return 'DNT activa · nada que apagar';
        return 'no la envía · igual no se rastrea';
    }

    // ── Sello de la comprobación ──────────────────────────────────────────────
    function sello() {
        var d = new Date();
        var dd = function (n) { return String(n).padStart(2, '0'); };
        return 'comprobado en su navegador · '
             + dd(d.getDate()) + '/' + dd(d.getMonth() + 1) + '/' + d.getFullYear()
             + ' ' + dd(d.getHours()) + ':' + dd(d.getMinutes());
    }

    // ── Pintado ───────────────────────────────────────────────────────────────
    function pintar() {
        var cookies = contarCookies();
        if (cookies === null) {
            set('trk-cookies', 'no se pudo leer', false);
        } else if (cookies.length === 0) {
            set('trk-cookies', 'ninguna', false);
        } else {
            var nombres = cookies.map(function (c) { return c.split('=')[0]; });
            set('trk-cookies', cookies.length + ': ' + nombres.join(', '), true);
        }

        var local = describirClaves(claves('localStorage'), 'localStorage');
        set('trk-local', local.txt, local.warn);

        var sesion = describirClaves(claves('sessionStorage'), 'sessionStorage');
        set('trk-session', sesion.txt, sesion.warn);

        var ajenos = scriptsAjenos();
        set('trk-scripts', ajenos.length === 0 ? 'ninguno' : ajenos.length + ' detectado(s)', ajenos.length > 0);

        var dominios = describirDominios(dominiosAjenos());
        set('trk-hosts', dominios.txt, dominios.warn);

        set('trk-id', 'ninguno', false);
        set('trk-dnt', senalNoRastrear(), false);

        var stamp = $('trk-stamp');
        if (stamp) stamp.textContent = sello();

        actualizarBoton();
    }

    // ── Botón de borrado ──────────────────────────────────────────────────────
    // Borra solo lo de este sitio, no todo el almacenamiento del navegador: si
    // alguna vez conviven aquí datos de otra herramienta, no son nuestros para
    // borrarlos. Las cookies se limpian por si acaso; no debería haber ninguna.
    function hayAlgoQueBorrar() {
        var l = claves('localStorage');
        var s = claves('sessionStorage');
        var c = contarCookies();
        return (l && l.length > 0) || (s && s.length > 0) || (c && c.length > 0);
    }

    function actualizarBoton() {
        var btn = $('trk-clear');
        if (!btn) return;
        var algo = hayAlgoQueBorrar();
        btn.disabled = !algo;
        btn.textContent = algo ? 'Borrar lo guardado' : 'No hay nada que borrar';
    }

    function borrar() {
        PREF_KEYS.forEach(function (k) {
            try { localStorage.removeItem(k); } catch (e) {}
        });
        try { sessionStorage.clear(); } catch (e) {}

        try {
            document.cookie.split(';').forEach(function (c) {
                var nombre = c.replace(/^ +/, '').split('=')[0];
                if (!nombre) return;
                var exp = 'expires=' + new Date(0).toUTCString();
                document.cookie = nombre + '=;' + exp + ';path=/';
                document.cookie = nombre + '=;' + exp + ';path=/;domain=' + location.hostname;
            });
        } catch (e) {}

        // Las preferencias ya no existen: la página vuelve a su estado de origen
        // sin recargar, para que se vea que el borrado surtió efecto.
        document.documentElement.classList.remove('vtx-no-motion', 'vtx-no-fab');

        pintar();

        var btn = $('trk-clear');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Borrado';
            setTimeout(actualizarBoton, 2200);
        }
    }

    // ── Arranque ──────────────────────────────────────────────────────────────
    function iniciar() {
        if (!$('trk-cookies')) return;   // no estamos en cookies.html

        // Tras `load` la lista de recursos ya está completa; antes faltarían las
        // tipografías y el panel diría «ningún dominio ajeno», que es mentira.
        if (document.readyState === 'complete') {
            pintar();
        } else {
            window.addEventListener('load', pintar);
        }

        var btn = $('trk-clear');
        if (btn) btn.addEventListener('click', borrar);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar);
    } else {
        iniciar();
    }
})();
