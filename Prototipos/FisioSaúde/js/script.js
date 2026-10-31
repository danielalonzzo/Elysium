/* Navigation, scroll state, reveals and lightbox adapted from the read-only
 * Paulo Morais reference (js/script.js). Native dialogs add focus management. */
document.addEventListener('DOMContentLoaded', () => {
  const header = document.getElementById('header');
  const mobileToggle = document.querySelector('.mobile-menu-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const closeMenu = () => {
    navMenu.classList.remove('active');
    mobileToggle.classList.remove('active');
    mobileToggle.setAttribute('aria-expanded', 'false');
    mobileToggle.setAttribute('aria-label', 'Abrir menu');
  };
  mobileToggle.addEventListener('click', () => {
    const active = navMenu.classList.toggle('active');
    mobileToggle.classList.toggle('active', active);
    mobileToggle.setAttribute('aria-expanded', String(active));
    mobileToggle.setAttribute('aria-label', active ? 'Fechar menu' : 'Abrir menu');
  });
  navMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && navMenu.classList.contains('active')) {
      closeMenu();
      mobileToggle.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!header.contains(event.target)) closeMenu();
  });
  const desktopQuery = matchMedia('(min-width: 651px)');
  desktopQuery.addEventListener('change', closeMenu);
  const updateHeader = () => header.classList.toggle('scrolled', window.scrollY > 50);
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  // Keep ordinary anchor navigation and browser history; reveal a targeted service.
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', () => {
      const target = document.getElementById(anchor.hash.slice(1));
      if (target?.matches('details')) target.open = true;
    });
  });
  if (location.hash) {
    const target = document.getElementById(location.hash.slice(1));
    if (target?.matches('details')) target.open = true;
  }
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !reduceMotion) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('pending');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.07 });
    document.querySelectorAll('.section-heading, .clinic-grid, .team-card, .agreements-header').forEach(element => {
      element.classList.add('reveal', 'pending');
      observer.observe(element);
    });
  }
  if ('IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navMenu.querySelectorAll('a').forEach(link => {
            if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
          });
        }
      });
    }, { rootMargin: '-15% 0px -50% 0px', threshold: 0 });
    document.querySelectorAll('main section[id]').forEach(section => navObserver.observe(section));
  }

  // Native dialogs trap focus, support Escape and return focus to their opener.
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target === dialog) {
        const rect = dialog.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
      }
    });
    dialog.querySelectorAll('[data-close-dialog]').forEach(link => link.addEventListener('click', () => dialog.close()));
  });
  const booking = document.getElementById('booking-dialog');
  const service = document.getElementById('booking-service');
  const email = document.getElementById('booking-email');
  function updateEmail() {
    const isAgreement = service.value === 'Informações sobre acordos';
    const subject = `${isAgreement ? 'Pedido de informações' : 'Pedido de marcação'} — ${service.value}`;
    const request = isAgreement ? 'Pretendo confirmar a existência de acordo com o meu seguro ou plano de saúde e as condições de acesso.\n\nSeguro ou plano de saúde:\nServiço pretendido:' : `Pretendo obter informações sobre disponibilidade para ${service.value.toLowerCase()}.`;
    const body = `Exmos. Senhores,\n\n${request}\n\nNome:\nContacto telefónico:\nPreferência de dia e horário:\n\nAgradeço a confirmação da disponibilidade.\n\nCom os melhores cumprimentos`;
    email.href = `mailto:geral.fisiosaude@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
  document.querySelectorAll('[data-book]').forEach(button => button.addEventListener('click', () => {
    closeMenu();
    service.value = button.dataset.service || 'Fisioterapia';
    updateEmail();
    booking.showModal();
  }));
  service.addEventListener('change', updateEmail);
  updateEmail();
  document.getElementById('show-address-poster').addEventListener('click', () => document.getElementById('poster-dialog').showModal());
  document.getElementById('privacy-button').addEventListener('click', () => document.getElementById('privacy-dialog').showModal());
  document.getElementById('year').textContent = new Date().getFullYear();
});
