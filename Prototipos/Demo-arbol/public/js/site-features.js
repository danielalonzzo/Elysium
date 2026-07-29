/** Demo-arbol · F02, F03, F04 y F09 según la implementación canónica. */
(function () {
  "use strict";

  if (window.__HDC_SITE_FEATURES__) return;
  window.__HDC_SITE_FEATURES__ = true;

  function elementTarget(event) {
    return event.target instanceof Element ? event.target : null;
  }

  function currentMenu() {
    return {
      toggle: document.querySelector(".menu-toggle"),
      drawer: document.querySelector(".nav-menu")
    };
  }

  function closeMenu(restoreFocus) {
    var menu = currentMenu();
    if (!menu.drawer || !menu.toggle) return;
    var wasOpen = menu.drawer.classList.contains("open");
    menu.drawer.classList.remove("open");
    menu.toggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("nav-open");
    if (restoreFocus && wasOpen) menu.toggle.focus();
  }

  /** Fondo de reserva (crema de marca) si el sondeo no encuentra color opaco. */
  var FALLBACK_BG = { r: 248, g: 244, b: 234, a: 1 };

  /** Umbral de luminancia a partir del cual el fondo se considera claro. */
  var LIGHT_THRESHOLD = 0.62;

  /*
   * Progreso narrativo de la portada en el que la escena termina de irse a
   * negro. Va en el mismo espacio que las marcas de los actos de
   * CinematicStory.tsx (CANVAS_RAMP acaba de oscurecer en 0.22; la frontera
   * Acto 1 -> Acto 2 está en 0.27), no en el del scroll en bruto.
   */
  var ACT1_DARK = 0.2;

  function parseBackgroundColor(color) {
    var values = String(color).match(/[\d.]+/g);
    if (!values || values.length < 3) return null;
    return {
      r: Number(values[0]),
      g: Number(values[1]),
      b: Number(values[2]),
      a: values.length > 3 ? Number(values[3]) : 1
    };
  }

  /** Sube por el árbol hasta encontrar el primer ancestro con fondo opaco. */
  function effectiveBackground(element) {
    var current = element;
    while (current) {
      var parsed = parseBackgroundColor(window.getComputedStyle(current).backgroundColor);
      if (parsed && parsed.a > 0.08) return parsed;
      current = current.parentElement;
    }
    return FALLBACK_BG;
  }

  /**
   * Contraste adaptativo de la píldora.
   *
   * La cabecera flota sobre la portada oscura y sobre páginas internas de
   * fondo crema, así que no puede tener un solo tratamiento: sondea la
   * luminancia real de lo que cruza por debajo y conmuta entre cristal claro
   * y cristal oscuro. Sin esto el logotipo desaparece en una de las dos
   * situaciones.
   */
  function initHeaderContrast() {
    var header = document.querySelector("#header");
    var dock = document.querySelector(".hdc-dock");
    if (!header && !dock) return;
    var frame = null;

    function sync() {
      frame = null;

      if (header) {
        var docRoot = document.documentElement;
        var onLight;
        // La portada publica su progreso YA warpeado en `--hdc-story-progress`
        // mientras dura la cinemática (ver CinematicStory.tsx). Se lee de ahí en
        // vez de deducirlo otra vez del scroll: esa copia se desfasó cuando el
        // Acto 1 pasó a durar la mitad, y la píldora se quedaba en modo claro
        // con la escena ya negra.
        var progress = parseFloat(docRoot.style.getPropertyValue("--hdc-story-progress"));

        if (docRoot.classList.contains("hdc-immersive") && !isNaN(progress)) {
          // Acto 1, el árbol bajo un cielo pálido -> píldora clara. A partir de
          // ACT1_DARK la escena ya se ha ido a negro (Actos 2-4) -> oscura.
          onLight = progress < ACT1_DARK;
        } else {
          // Fuera de la portada, y en páginas que no la tienen (/tienda),
          // manda el modo de la web.
          onLight = (docRoot.dataset.elysiumTheme || "dark") === "light";
        }

        header.classList.toggle("header-on-light", onLight);
        header.classList.toggle("header-on-dark", !onLight);
      }

      if (dock) {
        var rectD = dock.getBoundingClientRect();
        var probeXD = Math.round(rectD.left + rectD.width / 2);
        var probeYD = Math.max(1, Math.min(window.innerHeight - 1, Math.round(rectD.top + rectD.height / 2)));
        var stackD = document.elementsFromPoint(probeXD, probeYD);
        var underlyingD = null;
        for (var j = 0; j < stackD.length; j += 1) {
          if (!stackD[j].closest("#header") && !stackD[j].closest(".hdc-dock") && !stackD[j].closest("#ely-preloader")) {
            underlyingD = stackD[j];
            break;
          }
        }
        var bgD = effectiveBackground(underlyingD || document.body);
        var luminanceD = (0.2126 * bgD.r + 0.7152 * bgD.g + 0.0722 * bgD.b) / 255;
        var dockOnLight = luminanceD > LIGHT_THRESHOLD;
        dock.classList.toggle("dock-on-light", dockOnLight);
        dock.classList.toggle("dock-on-dark", !dockOnLight);
      }
    }

    function request() {
      if (frame === null) frame = window.requestAnimationFrame(sync);
    }

    /*
     * Mientras la portada está en pantalla no basta con escuchar el scroll: el
     * ScrollTrigger va con `scrub`, así que la escena sigue interpolando —y
     * `--hdc-story-progress` sigue cambiando— hasta medio segundo después del
     * último evento. Si el visitante suelta justo en la frontera, la píldora se
     * quedaba con el contraste del acto anterior. Mientras dura la cinemática se
     * sigue por fotograma; fuera de ella no queda ningún bucle vivo.
     */
    var following = false;

    function followStory() {
      if (!document.documentElement.classList.contains("hdc-immersive")) {
        following = false;
        return;
      }
      following = true;
      sync();
      window.requestAnimationFrame(followStory);
    }

    /** Arranca el seguimiento salvo que ya haya uno vivo. */
    function requestFollow() {
      if (!following) followStory();
    }

    window.addEventListener("scroll", function () {
      request();
      requestFollow();
    }, { passive: true });
    window.addEventListener("resize", request, { passive: true });
    window.addEventListener("elysium:settings:changed", sync);

    // Sondeo inicial para aplicar la regla inmediatamente desde el arranque
    sync();
    requestFollow();

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) return;
      sync();
      requestFollow();
    });
  }

  /** El dock se repliega al alcanzar el pie para no tapar los enlaces legales. */
  function initDockTuck() {
    var dock = document.querySelector(".hdc-dock");
    var footer = document.querySelector(".site-footer");
    if (!dock || !footer || !("IntersectionObserver" in window)) return;
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        dock.classList.toggle("is-tucked", entry.isIntersecting);
      });
    }, { rootMargin: "0px 0px -35% 0px" }).observe(footer);
  }

  function initHeader() {
    document.addEventListener("click", function (event) {
      var target = elementTarget(event);
      if (!target) return;
      var toggle = target.closest(".menu-toggle");
      if (toggle) {
        var menu = currentMenu();
        if (!menu.drawer || !menu.toggle) return;
        var open = menu.drawer.classList.toggle("open");
        menu.toggle.setAttribute("aria-expanded", String(open));
        document.body.classList.toggle("nav-open", open);
        return;
      }
      if (target.closest(".nav-menu a")) closeMenu(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeMenu(true);
    });

    window.addEventListener("scroll", function () {
      var header = document.querySelector(".navbar");
      if (header) header.classList.toggle("scrolled", window.scrollY > 50);
    }, { passive: true });

    var initial = document.querySelector(".navbar");
    if (initial) initial.classList.toggle("scrolled", window.scrollY > 50);
  }

  var revealObserver = "IntersectionObserver" in window
    ? new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" })
    : null;

  function initScrollReveal(selector) {
    var nodes = document.querySelectorAll(selector || ".reveal:not(.visible)");
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      || document.documentElement.dataset.elysiumMotion === "reduced";
    nodes.forEach(function (element) {
      if (reduced || !revealObserver) element.classList.add("visible");
      else revealObserver.observe(element);
    });
  }

  /**
   * Posición de documento a la que hay que ir para dejar `target` arriba.
   *
   * El caso normal es la caja del propio elemento menos el alto del header.
   * La excepción es el carrusel horizontal de las secciones: en móvil
   * GSAP lo ancla (`pin`), y mientras dura el anclaje la sección y sus paneles
   * están en `position: fixed` — su caja ya no dice nada del documento. Quien
   * conserva el recorrido real es el `pin-spacer` que GSAP deja en su sitio, y
   * dentro de él cada panel vive a su fracción del trayecto (el mismo reparto
   * que usa el `snap` del ScrollTrigger). En escritorio no hay anclaje alguno
   * y cada panel se alcanza directamente.
   */
  function glideOffsetFor(target, headerHeight) {
    var pinned = target.closest('[data-mode="pinned"]');
    var spacer = pinned && pinned.parentElement
      && pinned.parentElement.classList.contains("pin-spacer")
      ? pinned.parentElement
      : null;

    if (!spacer) {
      return target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
    }

    var panels = pinned.querySelectorAll(".hdc-narrative-section");
    var index = Array.prototype.indexOf.call(panels, target);
    var travel = Math.max(0, spacer.offsetHeight - window.innerHeight);
    var ratio = panels.length > 1 && index > 0 ? index / (panels.length - 1) : 0;
    // Anclada, la sección se pega al borde superior: aquí el header no descuenta.
    return spacer.getBoundingClientRect().top + window.pageYOffset + travel * ratio;
  }

  function initAnchorGlide() {
    document.addEventListener("click", function (event) {
      var source = elementTarget(event);
      var anchor = source && source.closest('a[href*="#"]');
      if (!anchor) return;
      var href = anchor.getAttribute("href");
      if (!href || href === "#") return;
      var hashIndex = href.indexOf("#");
      if (hashIndex === -1) return;
      var path = href.slice(0, hashIndex);
      var targetId = href.slice(hashIndex + 1);
      if (!targetId) return;

      var currentPath = window.location.pathname;
      if (path && path !== currentPath && !(currentPath === "/" && (path === "/" || path === ""))) {
        return;
      }

      var target = document.getElementById(targetId);
      if (!target) return;

      event.preventDefault();
      var header = document.querySelector(".navbar");
      var offset = header ? header.offsetHeight : 0;
      var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        || document.documentElement.dataset.elysiumMotion === "reduced";

      window.scrollTo({
        top: Math.max(0, glideOffsetFor(target, offset)),
        behavior: reduced ? "auto" : "smooth"
      });
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    });
  }

  function boot() {
    initHeader();
    initHeaderContrast();
    initDockTuck();
    initScrollReveal();
    initAnchorGlide();
    if ("MutationObserver" in window) {
      var mutation = new MutationObserver(function (records) {
        var hasNewContent = records.some(function (record) { return record.addedNodes.length > 0; });
        if (hasNewContent) initScrollReveal();
      });
      mutation.observe(document.body, { childList: true, subtree: true });
    }
  }

  window.addEventListener("elysium:settings:changed", function () {
    if (document.documentElement.dataset.elysiumMotion === "reduced") {
      document.querySelectorAll(".reveal").forEach(function (element) {
        element.classList.add("visible");
        if (revealObserver) revealObserver.unobserve(element);
      });
    }
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
