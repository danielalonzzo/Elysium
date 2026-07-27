/** Historia de Costa Rica · F02, F03, F04 y F09 según la implementación canónica. */
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
        var story = document.querySelector(".hdc-story");
        var onLight = false;

        if (story) {
          var rect = story.getBoundingClientRect();
          var storyTravel = story.offsetHeight - window.innerHeight;
          // Si el usuario está desplazándose dentro de la portada cinemática
          if (rect.top <= 0 && rect.bottom >= 80 && storyTravel > 0) {
            var progress = -rect.top / storyTravel;
            if (progress < 0.32) {
              // 1. Árbol de Guanacaste (Acto 1) -> Header SIEMPRE claro
              onLight = true;
            } else {
              // 2. Esfera del Diquís (Actos 2, 3, 4) -> Header SIEMPRE oscuro
              onLight = false;
            }
          } else {
            // 3. Ya en la web (fuera de la portada) -> Detecta el modo de la web
            var theme = document.documentElement.dataset.elysiumTheme || "dark";
            onLight = theme === "light";
          }
        } else {
          // Páginas sin portada (como /tienda) -> Detecta el modo de la web
          var theme = document.documentElement.dataset.elysiumTheme || "dark";
          onLight = theme === "light";
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

    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request, { passive: true });
    window.addEventListener("elysium:settings:changed", sync);

    // Sondeo inicial para aplicar la regla inmediatamente desde el arranque
    sync();

    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) sync();
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

  function initAnchorGlide() {
    document.addEventListener("click", function (event) {
      var source = elementTarget(event);
      var anchor = source && source.closest('a[href^="#"]');
      if (!anchor) return;
      var href = anchor.getAttribute("href");
      if (!href || href === "#") return;
      var target = document.getElementById(href.slice(1));
      if (!target) return;
      event.preventDefault();
      var header = document.querySelector(".navbar");
      var offset = header ? header.offsetHeight : 0;
      var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        || document.documentElement.dataset.elysiumMotion === "reduced";
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.pageYOffset - offset,
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
