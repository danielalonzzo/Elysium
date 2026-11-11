(() => {
  const loader = document.querySelector('.vtx-loader');
  if (loader) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      loader.remove();
    } else {
      window.setTimeout(() => loader.remove(), 1000);
    }
  }

  const controls = document.querySelectorAll('.currency');
  const amounts = document.querySelectorAll('[data-usd][data-crc]');
  if (!controls.length) return;

  const preferenceKey = 'vtx-pref-currency';
  let currency = 'USD';
  try {
    if (sessionStorage.getItem(preferenceKey) === 'CRC') currency = 'CRC';
  } catch {
    // The selector still works on this page if storage is unavailable.
  }

  const buttons = document.querySelectorAll('button[data-currency]');
  function displayCurrency() {
    const field = currency.toLowerCase();
    amounts.forEach(amount => { amount.textContent = amount.dataset[field]; });
    buttons.forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.currency === currency));
    });
  }

  buttons.forEach(button => button.addEventListener('click', () => {
    currency = button.dataset.currency;
    displayCurrency();
    try {
      sessionStorage.setItem(preferenceKey, currency);
    } catch {
      // Displaying prices does not require storage.
    }
  }));

  displayCurrency();
  controls.forEach(control => { control.hidden = false; });
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    try {
      currency = sessionStorage.getItem(preferenceKey) === 'CRC' ? 'CRC' : 'USD';
      displayCurrency();
    } catch {
      // Keep the current page selection.
    }
  });
})();
