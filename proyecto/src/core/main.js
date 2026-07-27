/** Header Mobile-First — F02 */
function initHeader({ headerSel = '.navbar', toggleSel = '.menu-toggle', drawerSel = '.nav-menu', hideOnScroll = false } = {}) {
    const header = document.querySelector(headerSel);
    const toggle = document.querySelector(toggleSel);
    const drawer = document.querySelector(drawerSel);
    
    if (toggle && drawer) {
        const open = () => { drawer.classList.add('open'); document.body.style.overflow = 'hidden'; toggle.setAttribute('aria-expanded','true'); };
        const close = () => { drawer.classList.remove('open'); document.body.style.overflow = ''; toggle.setAttribute('aria-expanded','false'); };
        
        toggle.addEventListener('click', () => drawer.classList.contains('open') ? close() : open());
        drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
        document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    }
    
    if (header) {
        let lastY = window.scrollY;
        window.addEventListener('scroll', () => {
            const y = window.scrollY;
            header.classList.toggle('scrolled', y > 50);
            if (hideOnScroll) header.classList.toggle('header-hidden', y > lastY && y > 100);
            lastY = y;
        }, { passive: true });
    }
}

/** Scroll Reveal — F03 */
function initScrollReveal(selector = '.reveal') {
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('visible');
            obs.unobserve(entry.target);
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    document.querySelectorAll(selector).forEach(el => observer.observe(el));
}

/** Anchor Glide — F04 */
function initAnchorGlide(headerSel = '.navbar') {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            const target = document.getElementById(href.slice(1));
            if (!target) return;
            e.preventDefault();
            const offset = document.querySelector(headerSel)?.offsetHeight || 0;
            window.scrollTo({
                top: target.getBoundingClientRect().top + window.pageYOffset - offset,
                behavior: 'smooth'
            });
        });
    });
}

/** Magic Bottom — F09 */
function initMagicBottom(mainSel = '#fab-main', wrapperSel = '#fab-wrapper') {
    const main = document.querySelector(mainSel);
    const wrap = document.querySelector(wrapperSel);
    if (!main || !wrap) return;
    
    main.addEventListener('click', e => { e.stopPropagation(); wrap.classList.toggle('active'); });
    document.addEventListener('click', e => {
        if (wrap.classList.contains('active') && !wrap.contains(e.target)) wrap.classList.remove('active');
    });
}

/** Dynamic Theme — F13 */
function initDynamicTheme({ timeZone = undefined, lightStart = 6, lightEnd = 18 } = {}) {
    const mode = localStorage.getItem('theme_mode') || 'auto'; 
    const hourNow = () => {
        try { return parseInt(new Date().toLocaleString('en-US', { timeZone, hour12: false, hour: 'numeric' })); }
        catch { return new Date().getHours(); }
    };
    const isLight = mode === 'light' || (mode === 'auto' && hourNow() >= lightStart && hourNow() < lightEnd);
    document.documentElement.dataset.theme = isLight ? 'light' : 'dark';
    return isLight;
}

/** Theme Switcher — F14 */
window.toggleTheme = function() {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme_mode', next);
    document.documentElement.dataset.theme = next;
}

/** Multi-language — F15 (Prototipo) */
window.toggleLanguage = function () {
    const currentLang = document.documentElement.lang;
    const nextLang = currentLang === 'es' ? 'en' : 'es';
    document.documentElement.lang = nextLang;
    alert("Cambio de idioma solicitado a: " + nextLang + ". (Requiere estructura de directorios en producción)");
};

/** Multi-Currency — F16 (Prototipo local) */
function initMultiCurrency({ base = 'EUR' } = {}) {
    const fmt = new Intl.NumberFormat(undefined, { style: 'currency', currency: base });
    document.querySelectorAll('[data-price]').forEach(el => {
        el.textContent = fmt.format(parseFloat(el.dataset.price));
    });
}

// ── Inicialización ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initDynamicTheme({ timeZone: 'Europe/Madrid' });
    initHeader();
    initScrollReveal();
    initAnchorGlide();
    initMagicBottom();
    initMultiCurrency();
    
    // F17: Registro Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
});
