/** F22 · System Settings específico del prototipo Selva y Sal. */
(function () {
  "use strict";

  var cfg = Object.assign({
    storageKey: "elysium:f22:settings:v1",
    accent: "#538D22",
    defaults: { text: "standard", motion: "system", contrast: "standard" }
  }, window.ELYSIUM_SETTINGS || {});
  var allowed = {
    text: ["standard", "large"],
    motion: ["system", "reduced"],
    contrast: ["standard", "enhanced"]
  };
  var memory = normalize(cfg.defaults);

  function normalize(value) {
    var input = value || {};
    return {
      schema: 1,
      text: allowed.text.indexOf(input.text) > -1 ? input.text : "standard",
      motion: allowed.motion.indexOf(input.motion) > -1 ? input.motion : "system",
      contrast: allowed.contrast.indexOf(input.contrast) > -1 ? input.contrast : "standard"
    };
  }

  function load() {
    try {
      var parsed = JSON.parse(localStorage.getItem(cfg.storageKey) || "null");
      if (parsed && parsed.schema === 1) memory = normalize(parsed);
    } catch (_) {}
    return memory;
  }

  function persist() {
    try { localStorage.setItem(cfg.storageKey, JSON.stringify(memory)); } catch (_) {}
  }

  function apply(emit) {
    var root = document.documentElement;
    root.dataset.elysiumText = memory.text;
    root.dataset.elysiumMotion = memory.motion;
    root.dataset.elysiumContrast = memory.contrast;
    if (emit !== false) {
      window.dispatchEvent(new CustomEvent("elysium:settings:changed", { detail: get() }));
    }
  }

  function get() { return Object.assign({}, memory); }

  function set(partialState) {
    memory = normalize(Object.assign({}, memory, partialState || {}));
    persist();
    apply(true);
    return get();
  }

  function reset() {
    memory = normalize(cfg.defaults);
    try { localStorage.removeItem(cfg.storageKey); } catch (_) {}
    apply(true);
    return get();
  }

  load();
  apply(false);
  window.ElysiumSettings = { get: get, set: set, reset: reset };
})();
