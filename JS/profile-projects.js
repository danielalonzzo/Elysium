/* ==========================================================================
   Proyectos del perfil — espejo de portfolio.html
   ==========================================================================

   La fuente única de los proyectos es `#portfolio-grid` en portfolio.html (y
   sus traducciones en es/ y pt/). Este script lo lee en tiempo de carga y
   vuelve a pintar las tarjetas dentro de /daniel-morales, así que **añadir un
   proyecto al portafolio lo añade también al perfil sin tocar nada más**.

   El contrato con portfolio.html es exactamente este, y romperlo deja el
   perfil sin proyectos:

     #portfolio-grid
       └── .project-card[data-category]
             ├── a[href]                     ← enlace principal del proyecto
             │     └── img.mobile-preview    ← miniatura
             └── .project-info
                   ├── h3                    ← nombre + span.project-location
                   ├── p                     ← descripción
                   └── .project-tags a       ← enlaces secundarios (opcionales)

   No se copian los <iframe> del portafolio a propósito: son cuatro sitios
   ajenos cargándose a la vez, y en una página de perfil eso cuesta más de lo
   que aporta. Se usa la miniatura, que ya existe para móvil.

   Si el fetch falla o no hay tarjetas, la rejilla se oculta y queda el
   encabezado con su enlace al portafolio completo: nunca un hueco roto.
   ========================================================================== */

(function () {
    'use strict';

    var mount = document.getElementById('profile-projects');
    if (!mount) return;

    var grid = mount.querySelector('.profile-projects-grid');
    var source = mount.getAttribute('data-source') || 'portfolio';
    if (!grid) return;

    function clean(node) {
        return node ? node.textContent.replace(/\s+/g, ' ').trim() : '';
    }

    function fail() {
        grid.remove();
        mount.classList.add('is-empty');
    }

    fetch(source, { credentials: 'same-origin' })
        .then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.text();
        })
        .then(function (html) {
            var doc = new DOMParser().parseFromString(html, 'text/html');
            var cards = doc.querySelectorAll('#portfolio-grid .project-card');
            if (!cards.length) throw new Error('portfolio sin tarjetas');

            // Las rutas del portafolio son relativas A ESA página (en es/ y pt/
            // llevan «../»), así que hay que resolverlas contra su propia URL.
            var base = new URL(source, window.location.href);
            var absolute = function (url) {
                try { return new URL(url, base).href; } catch (e) { return ''; }
            };

            var frag = document.createDocumentFragment();

            Array.prototype.forEach.call(cards, function (card) {
                var link = card.querySelector('a[href]');
                var thumb = card.querySelector('img.mobile-preview');
                var heading = card.querySelector('.project-info h3');
                var place = card.querySelector('.project-location');
                var desc = card.querySelector('.project-info p');
                if (!heading) return;

                // El nombre es el h3 menos el <span> de la ubicación.
                var title = heading.cloneNode(true);
                var placeInTitle = title.querySelector('.project-location');
                if (placeInTitle) placeInTitle.remove();

                var href = link ? absolute(link.getAttribute('href')) : '';
                var article = document.createElement('article');
                article.className = 'profile-project';
                if (card.dataset.category) article.dataset.category = card.dataset.category;

                var media = document.createElement(href ? 'a' : 'div');
                media.className = 'profile-project-thumb';
                if (href) {
                    media.href = href;
                    media.target = '_blank';
                    media.rel = 'noopener noreferrer';
                    // El título de al lado ya lleva el mismo enlace: este queda
                    // fuera del recorrido de teclado para no duplicarlo.
                    media.tabIndex = -1;
                    media.setAttribute('aria-hidden', 'true');
                }
                if (thumb) {
                    var img = document.createElement('img');
                    img.src = absolute(thumb.getAttribute('src'));
                    img.alt = '';
                    img.loading = 'lazy';
                    img.decoding = 'async';
                    media.appendChild(img);
                } else {
                    media.classList.add('is-blank');
                    media.textContent = 'λ';
                }
                article.appendChild(media);

                var body = document.createElement('div');
                body.className = 'profile-project-body';

                var h3 = document.createElement('h3');
                h3.className = 'profile-project-title';
                if (href) {
                    var a = document.createElement('a');
                    a.href = href;
                    a.target = '_blank';
                    a.rel = 'noopener noreferrer';
                    a.textContent = clean(title);
                    h3.appendChild(a);
                } else {
                    h3.appendChild(document.createTextNode(clean(title)));
                }
                if (place) {
                    var badge = document.createElement('span');
                    badge.className = 'profile-project-place';
                    badge.textContent = clean(place);
                    h3.appendChild(badge);
                }
                body.appendChild(h3);

                if (desc) {
                    var p = document.createElement('p');
                    p.className = 'profile-project-desc';
                    p.textContent = clean(desc);
                    body.appendChild(p);
                }

                // Solo los <a> reales: en el portafolio hay <button> y <span>
                // para los apartados que todavía no existen.
                var tags = card.querySelectorAll('.project-tags a[href]');
                if (tags.length) {
                    var wrap = document.createElement('div');
                    wrap.className = 'profile-project-tags';
                    Array.prototype.forEach.call(tags, function (tag) {
                        var t = document.createElement('a');
                        t.href = absolute(tag.getAttribute('href'));
                        t.textContent = clean(tag);
                        if (tag.target === '_blank') {
                            t.target = '_blank';
                            t.rel = 'noopener noreferrer';
                        }
                        wrap.appendChild(t);
                    });
                    body.appendChild(wrap);
                }

                article.appendChild(body);
                frag.appendChild(article);
            });

            if (!frag.childNodes.length) throw new Error('ninguna tarjeta utilizable');

            grid.innerHTML = '';
            grid.appendChild(frag);
            grid.removeAttribute('aria-busy');
            mount.classList.add('is-ready');
        })
        .catch(fail);
})();
