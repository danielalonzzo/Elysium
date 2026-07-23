/** Regalarte · F02, F03, F04 y F09 según la implementación canónica. */
(function () {
  "use strict";

  function initHeader(options) {
    var opts = options || {};
    var header = document.querySelector(opts.headerSel || ".navbar");
    var toggle = document.querySelector(opts.toggleSel || ".menu-toggle");
    var drawer = document.querySelector(opts.drawerSel || ".nav-menu");

    if (toggle && drawer) {
      var open = function () {
        drawer.classList.add("open");
        document.body.style.overflow = "hidden";
        toggle.setAttribute("aria-expanded", "true");
      };
      var close = function () {
        drawer.classList.remove("open");
        document.body.style.overflow = "";
        toggle.setAttribute("aria-expanded", "false");
      };

      toggle.addEventListener("click", function () {
        if (drawer.classList.contains("open")) close();
        else open();
      });
      drawer.querySelectorAll("a").forEach(function (anchor) {
        anchor.addEventListener("click", close);
      });
      document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") close();
      });
    }

    if (header) {
      var lastY = window.scrollY;
      window.addEventListener("scroll", function () {
        var y = window.scrollY;
        header.classList.toggle("scrolled", y > 50);
        lastY = y;
      }, { passive: true });
    }
  }

  function initScrollReveal(selector) {
    var nodes = document.querySelectorAll(selector || ".reveal");
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      || document.documentElement.dataset.elysiumMotion === "reduced";
    if (reduced || !("IntersectionObserver" in window)) {
      nodes.forEach(function (element) { element.classList.add("visible"); });
      return;
    }
    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
    nodes.forEach(function (element) { observer.observe(element); });
  }

  function initAnchorGlide(headerSel) {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener("click", function (event) {
        var href = this.getAttribute("href");
        if (!href || href === "#") return;
        var target = document.getElementById(href.slice(1));
        if (!target) return;
        event.preventDefault();
        var header = document.querySelector(headerSel || ".navbar");
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
    });
  }

  function initMagicBottom(mainSel, wrapperSel) {
    var main = document.querySelector(mainSel || "#fab-main");
    var wrap = document.querySelector(wrapperSel || "#fab-wrapper");
    if (!main || !wrap) return;
    main.addEventListener("click", function (event) {
      event.stopPropagation();
      var active = wrap.classList.toggle("active");
      main.setAttribute("aria-expanded", String(active));
    });
    document.addEventListener("click", function (event) {
      if (wrap.classList.contains("active") && !wrap.contains(event.target)) {
        wrap.classList.remove("active");
        main.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && wrap.classList.contains("active")) {
        wrap.classList.remove("active");
        main.setAttribute("aria-expanded", "false");
        main.focus();
      }
    });
    var footer = document.querySelector(".site-footer");
    if (footer && "IntersectionObserver" in window) {
      var footerObserver = new IntersectionObserver(function (entries) {
        wrap.classList.toggle("near-footer", entries[0].isIntersecting);
      }, { threshold: 0.05 });
      footerObserver.observe(footer);
    }
  }

  function boot() {
    initHeader();
    initScrollReveal();
    initAnchorGlide();
    initMagicBottom();
    if ("MutationObserver" in window) {
      var revealMutation = new MutationObserver(function (records) {
        var hasNewContent = records.some(function (record) { return record.addedNodes.length > 0; });
        if (hasNewContent) initScrollReveal(".reveal:not(.visible)");
      });
      revealMutation.observe(document.getElementById("content") || document.body, { childList: true, subtree: true });
    }
  }

  window.addEventListener("elysium:settings:changed", function () {
    if (document.documentElement.dataset.elysiumMotion === "reduced") {
      document.querySelectorAll(".reveal").forEach(function (element) {
        element.classList.add("visible");
      });
    }
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
