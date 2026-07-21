// js/oncore.js — ONCORE (PT)

// ── Preloader inicial ────────────────────────────────────────────────────────
// Desvanece quando todos os recursos terminam de descarregar (evento load),
// com exibição mínima de 600ms para evitar um "flash" em ligações rápidas
// e um temporizador de segurança que nunca deixa o utilizador preso.
(function () {
    var PRELOADER_MIN_MS = 600;
    var PRELOADER_MAX_MS = 5000;
    var startedAt = Date.now();

    // Lança a entrada cénica do hero (títulos, retrato e barra inferior).
    function revealHero() {
        if (document.body) document.body.classList.add('hero-ready');
    }

    function hidePreloader() {
        var pre = document.getElementById('oncore-preloader');
        if (!pre || pre.classList.contains('is-loaded')) { revealHero(); return; }
        var elapsed = Date.now() - startedAt;
        var delay = Math.max(0, PRELOADER_MIN_MS - elapsed);
        setTimeout(function () {
            pre.classList.add('is-loaded');
            revealHero();
            // Remove do DOM após a transição de 0.8s
            setTimeout(function () { pre.remove(); }, 900);
        }, delay);
    }

    window.addEventListener('load', hidePreloader);
    setTimeout(hidePreloader, PRELOADER_MAX_MS); // segurança anti-bloqueio
})();

document.addEventListener('DOMContentLoaded', () => {
    // Ícones Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Header com contraste adaptativo segundo o fundo que atravessa
    const header = document.getElementById('header');
    let headerThemeFrame = null;

    const parseBackgroundColor = (color) => {
        const values = color.match(/[\d.]+/g);
        if (!values || values.length < 3) return null;
        return {
            r: Number(values[0]),
            g: Number(values[1]),
            b: Number(values[2]),
            a: values.length > 3 ? Number(values[3]) : 1
        };
    };

    const effectiveBackground = (element) => {
        let current = element;
        while (current) {
            const parsed = parseBackgroundColor(getComputedStyle(current).backgroundColor);
            if (parsed && parsed.a > 0.08) return parsed;
            current = current.parentElement;
        }
        return { r: 251, g: 247, b: 240, a: 1 };
    };

    const syncHeaderContrast = () => {
        if (!header) return;
        const rect = header.getBoundingClientRect();
        const probeX = Math.round(window.innerWidth / 2);
        const probeY = Math.max(1, Math.min(window.innerHeight - 1, Math.round(rect.top + rect.height / 2)));
        const underlying = document.elementsFromPoint(probeX, probeY).find((element) =>
            !element.closest('#header') &&
            !element.closest('.oncore-dock') &&
            !element.closest('#oncore-preloader')
        );
        const background = effectiveBackground(underlying || document.body);
        const luminance = (0.2126 * background.r + 0.7152 * background.g + 0.0722 * background.b) / 255;
        const onLight = luminance > 0.62;
        header.classList.toggle('header-on-light', onLight);
        header.classList.toggle('header-on-dark', !onLight);
        headerThemeFrame = null;
    };

    const requestHeaderContrast = () => {
        if (headerThemeFrame === null) {
            headerThemeFrame = requestAnimationFrame(syncHeaderContrast);
        }
    };

    const handleScroll = () => {
        header.classList.toggle('scrolled', window.scrollY > 40);
        requestHeaderContrast();
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', requestHeaderContrast, { passive: true });
    handleScroll();

    // Menu móvel
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navMenu = document.getElementById('navMenu');
    const setMenuIcon = (open) => {
        const isEnglish = document.documentElement.lang.toLowerCase().startsWith('en');
        mobileMenuBtn.setAttribute('aria-label', open
            ? (isEnglish ? 'Close menu' : 'Fechar menu')
            : (isEnglish ? 'Open menu' : 'Abrir menu'));
        mobileMenuBtn.setAttribute('aria-expanded', String(open));
        const icon = mobileMenuBtn.querySelector('i, svg');
        if (icon) {
            icon.outerHTML = `<i data-lucide="${open ? 'x' : 'menu'}"></i>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    };
    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            const open = navMenu.classList.toggle('active');
            setMenuIcon(open);
        });
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                setMenuIcon(false);
            });
        });
    }

    // Realce do item de navegação ativo
    const sections = document.querySelectorAll('main section[id]');
    const navLinks = document.querySelectorAll('.nav-menu ul a');
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navLinks.forEach(l => {
                    l.classList.toggle('nav-active', l.getAttribute('href') === `#${entry.target.id}`);
                });
            }
        });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(s => sectionObserver.observe(s));

    // Slider de testemunhos
    const track = document.getElementById('testimonialTrack');
    const dotsWrap = document.getElementById('sliderDots');
    if (track && dotsWrap) {
        const slides = track.children.length;
        let index = 0;
        let timer;

        for (let i = 0; i < slides; i++) {
            const dot = document.createElement('span');
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', () => goTo(i, true));
            dotsWrap.appendChild(dot);
        }
        const dots = dotsWrap.querySelectorAll('span');

        const goTo = (i, manual = false) => {
            index = (i + slides) % slides;
            track.style.transform = `translateX(-${index * 100}%)`;
            dots.forEach((d, di) => d.classList.toggle('active', di === index));
            if (manual) restartAuto();
        };
        const restartAuto = () => {
            clearInterval(timer);
            timer = setInterval(() => goTo(index + 1), 7000);
        };

        document.getElementById('prevTestimonial')?.addEventListener('click', () => goTo(index - 1, true));
        document.getElementById('nextTestimonial')?.addEventListener('click', () => goTo(index + 1, true));

        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            restartAuto();
        }
    }

    // FAQ: fechar os restantes ao abrir um
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        item.addEventListener('toggle', () => {
            if (item.open) {
                faqItems.forEach(other => { if (other !== item) other.open = false; });
            }
        });
    });

    // Animação de entrada das secções
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const revealTargets = document.querySelectorAll(
            '.section-head, .values-lead, .values-list-col, .values-contact-col, .about-media, .about-text, ' +
            '.service-card, .steps-intro, .step, .team-card, .referral-intro, .benefit, ' +
            '.testimonial-slider, .contact-intro, .contact-details, .contact-form-panel, .faq-head, .faq-list, .eco-card, .eco-head'
        );
        revealTargets.forEach(el => el.classList.add('reveal'));
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });
        revealTargets.forEach(el => revealObserver.observe(el));
    }

    // Termos explicativos: hover no desktop, toque/foco em mobile e teclado
    const termTooltips = document.querySelectorAll('.term-tooltip');
    const closeTermTooltips = (except) => {
        termTooltips.forEach(term => {
            if (term !== except) term.classList.remove('is-open');
        });
    };
    termTooltips.forEach(term => {
        term.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const wasOpen = term.classList.contains('is-open');
            closeTermTooltips(term);
            term.classList.toggle('is-open', !wasOpen);
        });
        term.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                term.classList.remove('is-open');
                term.blur();
            }
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                const wasOpen = term.classList.contains('is-open');
                closeTermTooltips(term);
                term.classList.toggle('is-open', !wasOpen);
            }
        });
    });
    document.addEventListener('click', () => closeTermTooltips());
    window.addEventListener('scroll', () => closeTermTooltips(), { passive: true });

    // Formulário de contacto: compõe email com os campos preenchidos
    const contactForm = document.getElementById('contactForm');
    const contactFormStatus = document.getElementById('contactFormStatus');
    if (contactForm) {
        contactForm.addEventListener('submit', (event) => {
            event.preventDefault();
            if (!contactForm.checkValidity()) {
                contactForm.reportValidity();
                return;
            }

            const data = new FormData(contactForm);
            const name = data.get('name') || 'Website';
            const subject = `Pedido de contacto ONCORE - ${name}`;
            const body = [
                'Pedido de contacto recebido através do website ONCORE.',
                '',
                `Nome: ${data.get('name') || ''}`,
                `Email: ${data.get('email') || ''}`,
                `Telefone: ${data.get('phone') || ''}`,
                `Perfil: ${data.get('profile') || ''}`,
                `Área de interesse: ${data.get('interest') || ''}`,
                '',
                'Mensagem:',
                data.get('message') || '',
                '',
                'Consentimento RGPD: Sim, autorizou o contacto para resposta ao pedido.'
            ].join('\n');

            if (contactFormStatus) {
                contactFormStatus.textContent = 'A abrir o seu email para concluir o envio.';
            }
            window.location.href = `mailto:info@oncore.pt?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        });
    }


});
