/**
 * Dr. Johnny Piedra Aguilera — comportamiento del sitio.
 *
 * Mejora progresiva: sin JavaScript la página se lee, se navega y permite
 * pedir cita igual. Este módulo solo añade el menú móvil, el filete de la
 * cabecera al desplazarse, la entrada suave de las secciones, la barra de
 * acciones del móvil y el service worker.
 */

const desktopNavigation = window.matchMedia('(min-width: 75rem)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/** Menú móvil: abre y cierra el panel, bloquea el fondo y devuelve el foco. */
function initMenu() {
  const header = document.querySelector('[data-header]');
  const toggle = header?.querySelector('[data-menu-toggle]');
  const menu = toggle && document.getElementById(toggle.getAttribute('aria-controls'));
  if (!menu) return;

  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    header.toggleAttribute('data-menu-open', open);
    document.documentElement.classList.toggle('has-menu-open', open);
  };

  toggle.addEventListener('click', () => setOpen(!isOpen()));

  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !isOpen()) return;
    setOpen(false);
    toggle.focus();
  });

  desktopNavigation.addEventListener('change', () => setOpen(false));
}

/** Cabecera: muestra su filete inferior en cuanto la página se desplaza. */
function initHeaderState() {
  const header = document.querySelector('[data-header]');
  if (!header) return;

  const update = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  update();
  window.addEventListener('scroll', update, { passive: true });
}

/**
 * Revelado al desplazarse. Solo se marca lo que aún está fuera de la pantalla:
 * así nada de lo que ya se ve desaparece y vuelve a aparecer al cargar.
 */
function initReveal() {
  if (reducedMotion.matches || !('IntersectionObserver' in window)) return;

  const pending = [...document.querySelectorAll('[data-reveal]')]
    .filter((element) => element.getBoundingClientRect().top > window.innerHeight);

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.remove('is-pending');
      observer.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -8% 0px' });

  for (const element of pending) {
    element.classList.add('is-pending');
    observer.observe(element);
  }
}

/**
 * Barra de acciones del móvil: visible solo entre la portada y el contacto,
 * donde no hay ya un botón de cita a la vista. Oculta, queda inerte para que
 * sus enlaces no reciban el foco.
 */
function initActionBar() {
  const bar = document.querySelector('[data-action-bar]');
  const landmarks = ['.hero', '#contacto', '.site-footer']
    .map((selector) => document.querySelector(selector))
    .filter(Boolean);
  if (!bar || !('IntersectionObserver' in window)) return;

  const onScreen = new Set();
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) onScreen.add(entry.target);
      else onScreen.delete(entry.target);
    }
    const visible = onScreen.size === 0;
    bar.classList.toggle('is-visible', visible);
    bar.inert = !visible;
  });

  bar.inert = true;
  bar.hidden = false;
  landmarks.forEach((landmark) => observer.observe(landmark));
}

/** Año del pie: el HTML trae uno escrito para que nunca quede vacío. */
function setCurrentYear() {
  const year = String(new Date().getFullYear());
  document.querySelectorAll('[data-current-year]').forEach((element) => {
    element.textContent = year;
  });
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((error) => {
      console.warn('No se pudo registrar el service worker:', error);
    });
  });
}

initMenu();
initHeaderState();
initReveal();
initActionBar();
setCurrentYear();
registerServiceWorker();
