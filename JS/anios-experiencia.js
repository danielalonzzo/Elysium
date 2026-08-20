/**
 * Los años de trayectoria se cuentan solos.
 *
 * La carrera de Valeria arranca en mayo de 2017 (Trimpot). Escribir "9 años" a
 * mano obliga a acordarse de subirlo cada cumpleaños profesional, y nadie se
 * acuerda: la cifra envejece en la página y desmiente al currículum que tiene
 * debajo. Así que la página marca el hueco y este script lo rellena con el
 * número que toque. En mayo de 2027 dirá "10" sin que nadie toque nada.
 *
 * En el HTML:
 *     <span data-anios>9</span> años
 *     <span data-anios="palabra">Nueve</span> años
 *
 * Lo que va escrito dentro del span es el respaldo: si el script no llega a
 * correr, la página sigue diciendo algo correcto (aunque se quede corto).
 *
 * Las descripciones de <meta> no admiten hijos, así que ahí se sustituye por
 * patrón: cualquier "<número o palabra> años/anos/years" pasa a la cifra viva.
 */
(function () {
    'use strict';

    // Primer puesto en industria: Trimpot, mayo de 2017.
    var INICIO_ANIO = 2017;
    var INICIO_MES = 5; // 1-12

    var PALABRAS = {
        9: 'nueve', 10: 'diez', 11: 'once', 12: 'doce', 13: 'trece',
        14: 'catorce', 15: 'quince', 16: 'dieciséis', 17: 'diecisiete',
        18: 'dieciocho', 19: 'diecinueve', 20: 'veinte', 21: 'veintiuno',
        22: 'veintidós', 23: 'veintitrés', 24: 'veinticuatro', 25: 'veinticinco'
    };

    function aniosCumplidos() {
        var hoy = new Date();
        var anios = hoy.getFullYear() - INICIO_ANIO;
        if (hoy.getMonth() + 1 < INICIO_MES) {
            anios -= 1;
        }
        return anios;
    }

    function mayuscula(texto) {
        return texto.charAt(0).toUpperCase() + texto.slice(1);
    }

    function aplicar() {
        var anios = aniosCumplidos();
        if (!(anios > 0)) {
            return;
        }

        var cifra = String(anios);
        var palabra = PALABRAS[anios] || cifra;

        var marcados = document.querySelectorAll('[data-anios]');
        for (var i = 0; i < marcados.length; i++) {
            var modo = marcados[i].getAttribute('data-anios') || '';
            if (modo === 'palabra') {
                marcados[i].textContent = palabra;
            } else if (modo === 'Palabra') {
                marcados[i].textContent = mayuscula(palabra);
            } else {
                marcados[i].textContent = cifra;
            }
        }

        // "Nueve años", "9 años", "9 anos", "9 years" → la cifra o palabra viva.
        var patron = /\b(\d+|nueve|diez|once|doce|trece|catorce|quince|dieciséis|dieciseis|diecisiete|dieciocho|diecinueve|veinte)(\s+)(años|anos|years)\b/gi;
        var metas = document.querySelectorAll(
            'meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]'
        );
        for (var j = 0; j < metas.length; j++) {
            var contenido = metas[j].getAttribute('content');
            if (!contenido) {
                continue;
            }
            metas[j].setAttribute('content', contenido.replace(patron, function (_, numero, espacio, unidad) {
                var esPalabra = !/^\d+$/.test(numero);
                var nuevo = esPalabra ? palabra : cifra;
                if (esPalabra && numero.charAt(0) === numero.charAt(0).toUpperCase()) {
                    nuevo = mayuscula(nuevo);
                }
                return nuevo + espacio + unidad;
            }));
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', aplicar);
    } else {
        aplicar();
    }
})();
