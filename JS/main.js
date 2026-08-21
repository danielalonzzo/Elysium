const elysiumMainScript = document.currentScript;
const elysiumScriptBase = elysiumMainScript && elysiumMainScript.src
    ? new URL('.', elysiumMainScript.src)
    : new URL('JS/', document.baseURI);

// The lambda is a short inter-page transition, never an initial-load screen.
const navigationMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
// Long enough for the restored pulse and light sweep to be perceptible, while
// remaining a brief route transition rather than an initial-load gate.
const navigationTransitionDuration = 520;
let navigationInProgress = false;
let navigationTimer = 0;
let navigationRecoveryTimer = 0;

function normalizeNavigationOverlay(overlay) {
    if (!overlay) return null;
    overlay.classList.remove('is-loaded', 'is-leaving');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('inert', '');
    return overlay;
}

function getNavigationOverlay() {
    let overlay = document.getElementById('elysium-preloader');
    if (overlay) return normalizeNavigationOverlay(overlay);

    overlay = document.createElement('div');
    overlay.id = 'elysium-preloader';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('inert', '');

    const content = document.createElement('div');
    content.className = 'preloader-content';

    const lambda = document.createElement('span');
    lambda.className = 'preloader-lambda';
    lambda.setAttribute('aria-hidden', 'true');
    lambda.textContent = 'λ';

    content.appendChild(lambda);
    overlay.appendChild(content);
    document.body.appendChild(overlay);
    return overlay;
}

function resetNavigationTransition() {
    navigationInProgress = false;
    clearTimeout(navigationTimer);
    clearTimeout(navigationRecoveryTimer);
    navigationTimer = 0;
    navigationRecoveryTimer = 0;
    normalizeNavigationOverlay(document.getElementById('elysium-preloader'));
}

function getNavigationDestination(event) {
    if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
    ) return null;

    const eventTarget = event.target;
    const target = eventTarget instanceof Element ? eventTarget : eventTarget && eventTarget.parentElement;
    const link = target && target.closest('a[href]');
    if (!link || link.hasAttribute('download') || link.closest('[data-no-transition]')) return null;
    if (link.getAttribute('aria-disabled') === 'true' || link.isContentEditable) return null;

    const linkTarget = (link.getAttribute('target') || '').toLowerCase();
    if (linkTarget && linkTarget !== '_self') return null;

    const rawHref = (link.getAttribute('href') || '').trim();
    if (!rawHref || rawHref === '#' || rawHref.startsWith('#')) return null;

    let destination;
    try {
        destination = new URL(rawHref, window.location.href);
    } catch (error) {
        return null;
    }

    if (!['http:', 'https:'].includes(destination.protocol) || destination.origin !== window.location.origin) {
        return null;
    }

    const current = new URL(window.location.href);
    const sameDocument = destination.pathname === current.pathname && destination.search === current.search;
    if (sameDocument) return null;

    return destination;
}

function handleNavigationTransition(event) {
    const destination = getNavigationDestination(event);
    if (!destination || navigationMotionQuery.matches) return;

    event.preventDefault();
    if (navigationInProgress) return;
    navigationInProgress = true;

    const overlay = getNavigationOverlay();

    requestAnimationFrame(() => {
        overlay.classList.add('is-leaving');

        navigationTimer = window.setTimeout(() => {
            window.location.assign(destination.href);
        }, navigationTransitionDuration);

        // If navigation is cancelled by the browser or a development tool,
        // restore the current page instead of leaving an inert overlay behind.
        navigationRecoveryTimer = window.setTimeout(resetNavigationTransition, 8000);
    });
}

normalizeNavigationOverlay(document.getElementById('elysium-preloader'));
document.addEventListener('click', handleNavigationTransition);
window.addEventListener('pageshow', resetNavigationTransition);
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) resetNavigationTransition();
});

// Keep third-party analytics out of the critical path. GTM starts on the
// visitor's first interaction, so it cannot delay the initial LCP/TBT audit.
function loadGoogleTagManager() {
    document.removeEventListener('pointerdown', loadGoogleTagManager);
    document.removeEventListener('keydown', loadGoogleTagManager);
    window.removeEventListener('wheel', loadGoogleTagManager);
    document.body.classList.add('ambient-motion');

    // Most legacy pages still bootstrap GTM in their head. Avoid inserting a
    // second container when this shared script runs on those routes.
    if (document.querySelector('script[src*="googletagmanager.com/gtm.js?id=GTM-NDDNWMFH"]')) return;

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-NDDNWMFH';
    document.head.appendChild(script);
}

document.addEventListener('pointerdown', loadGoogleTagManager, { once: true, passive: true });
document.addEventListener('keydown', loadGoogleTagManager, { once: true });
window.addEventListener('wheel', loadGoogleTagManager, { once: true, passive: true });

document.addEventListener('DOMContentLoaded', () => {
    // Developer cards - now handled entirely via CSS/HTML links

    // Language switcher dropdowns
    const langDropdowns = document.querySelectorAll('.lang-switcher-dropdown');
    langDropdowns.forEach(langDropdown => {
        const trigger = langDropdown.querySelector('.lang-switcher-trigger');
        const menu = langDropdown.querySelector('.lang-switcher-menu');

        if (trigger && menu) {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                // Close region dropdowns if open
                document.querySelectorAll('.region-switcher-dropdown').forEach(d => d.classList.remove('is-open'));
                langDropdown.classList.toggle('is-open');
                trigger.setAttribute('aria-expanded', langDropdown.classList.contains('is-open'));
            });

            document.addEventListener('click', () => {
                langDropdown.classList.remove('is-open');
                trigger.setAttribute('aria-expanded', 'false');
            });

            // Set language override when manually selecting a language
            menu.querySelectorAll('a, button').forEach(link => {
                link.addEventListener('click', () => {
                    try {
                        localStorage.setItem('langOverride', 'true');
                    } catch (error) {
                        // Storage can be disabled; navigation must still work.
                    }
                });
            });
        }
    });

    // Region switcher dropdowns
    const regionDropdowns = document.querySelectorAll('.region-switcher-dropdown');
    regionDropdowns.forEach(regionDropdown => {
        const trigger = regionDropdown.querySelector('.region-switcher-trigger');
        const menu = regionDropdown.querySelector('.region-switcher-menu');

        if (trigger && menu) {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                // Close language dropdowns if open
                document.querySelectorAll('.lang-switcher-dropdown').forEach(d => d.classList.remove('is-open'));
                regionDropdown.classList.toggle('is-open');
                trigger.setAttribute('aria-expanded', regionDropdown.classList.contains('is-open'));
            });

            document.addEventListener('click', () => {
                regionDropdown.classList.remove('is-open');
                trigger.setAttribute('aria-expanded', 'false');
            });

            // Set region override when manually navigating regions
            menu.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    try {
                        localStorage.setItem('elysium_region_override', 'true');
                        document.cookie = "elysium_region_override=true; path=/; max-age=31536000; SameSite=Lax";
                    } catch (error) {
                        // Storage can be disabled; navigation must still work.
                    }
                });
            });
        }
    });

    // Mobile Navigation Toggle
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (mobileToggle && navLinks) {
        const closeMobileMenu = () => {
            navLinks.classList.remove('active');
            document.body.classList.remove('mobile-menu-open');
            mobileToggle.textContent = '☰';
            mobileToggle.setAttribute('aria-expanded', 'false');
            mobileToggle.setAttribute('aria-label', 'Open navigation menu');
            document.body.style.overflow = '';
        };

        mobileToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            document.body.classList.toggle('mobile-menu-open');

            // Toggle icon between hamburger and close
            if (navLinks.classList.contains('active')) {
                mobileToggle.textContent = '✕';
                mobileToggle.setAttribute('aria-expanded', 'true');
                mobileToggle.setAttribute('aria-label', 'Close navigation menu');
                document.body.style.overflow = 'hidden'; // Prevent scrolling when menu is open
            } else {
                closeMobileMenu();
            }
        });

        // Close menu when clicking a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && navLinks.classList.contains('active')) {
                closeMobileMenu();
                mobileToggle.focus();
            }
        });
    }

    // Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');

    if (navbar) {
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        }, { passive: true });
    }

    // Smooth Scroll for Anchors
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            // `href="#"` is used by auth view toggles. It is not a valid CSS
            // selector and must be left to the component-specific listener.
            if (!targetId || targetId === '#') return;
            e.preventDefault();
            const target = document.querySelector(targetId);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Fade-in Animation on Scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.remove('reveal-pending');
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        // Anything already in the first viewport is immediately visible. This
        // keeps entrance animations out of the Speed Index/LCP window.
        if (el.getBoundingClientRect().top <= window.innerHeight + 50) return;
        el.classList.add('reveal-pending');
        observer.observe(el);
    });
    // Testimonial Carousel
    const testimonialContent = document.querySelector('.testimonial-content');
    if (testimonialContent) {
        // Empty array ready for real testimonials
        const testimonials = [];

        if (testimonials.length > 0) {
            let currentIndex = 0;

            // Re-create DOM elements if they were cleared
            let quoteEl = testimonialContent.querySelector('.testimonial-quote');
            if (!quoteEl) {
                quoteEl = document.createElement('p');
                quoteEl.className = 'testimonial-quote';
                testimonialContent.appendChild(quoteEl);
                quoteEl.textContent = `"${testimonials[0].quote}"`;
            }

            let authorEl = testimonialContent.querySelector('.testimonial-author');
            if (!authorEl) {
                authorEl = document.createElement('h5');
                authorEl.className = 'testimonial-author';
                testimonialContent.appendChild(authorEl);
                authorEl.textContent = testimonials[0].author;
            }

            const indicatorsContainer = document.querySelector('.testimonial-indicators');

            // Create Indicators
            testimonials.forEach((_, index) => {
                const indicator = document.createElement('div');
                indicator.classList.add('indicator');
                if (index === 0) indicator.classList.add('active');
                indicator.addEventListener('click', () => {
                    currentIndex = index;
                    updateTestimonial();
                    resetInterval();
                });
                indicatorsContainer.appendChild(indicator);
            });

            const indicators = indicatorsContainer.querySelectorAll('.indicator');

            function updateTestimonial() {
                // Slide out
                testimonialContent.classList.add('slide-out');

                setTimeout(() => {
                    // Update content
                    quoteEl.textContent = `"${testimonials[currentIndex].quote}"`;
                    authorEl.textContent = testimonials[currentIndex].author;

                    // Update indicators
                    indicators.forEach((ind, i) => {
                        if (i === currentIndex) ind.classList.add('active');
                        else ind.classList.remove('active');
                    });

                    // Slide in
                    testimonialContent.classList.remove('slide-out');
                    testimonialContent.classList.add('slide-in');

                    setTimeout(() => {
                        testimonialContent.classList.remove('slide-in');
                    }, 500); // Cleanup slide-in class

                }, 500); // Wait for slide out transition (0.5s)
            }

            function nextTestimonial() {
                currentIndex = (currentIndex + 1) % testimonials.length;
                updateTestimonial();
            }

            let interval = setInterval(nextTestimonial, 5000);

            function resetInterval() {
                clearInterval(interval);
                interval = setInterval(nextTestimonial, 5000);
            }
        }
    }

    // Interactive Tools Carousel
    const logoContainers = document.querySelectorAll('.logos');

    logoContainers.forEach(container => {
        const slides = container.querySelectorAll('.logos-slide');
        if (slides.length < 2) return;

        let x = 0;
        let speed = -1; // Base speed (moving left)
        let targetSpeed = -1;
        let animationId = 0;
        let isVisible = false;
        let slideWidth = slides[0].offsetWidth;

        // Resync widths on resize and after images load
        const updateWidths = () => {
            slideWidth = slides[0].offsetWidth;
        };

        window.addEventListener('resize', updateWidths);

        // Also wait for images to load to get correct widths
        container.querySelectorAll('img').forEach(img => {
            if (img.complete) updateWidths();
            else img.addEventListener('load', updateWidths);
        });

        container.addEventListener('mousemove', (e) => {
            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const centerX = rect.width / 2;

            // Calculate distance from center (-1 to 1)
            // -1 = far left, 1 = far right
            const distFrac = (mouseX - centerX) / centerX;

            // Intensity of movement
            const maxSpeed = 8;
            targetSpeed = distFrac * maxSpeed;
        });

        container.addEventListener('mouseleave', () => {
            targetSpeed = -1; // Return to idle speed
        });

        function animate() {
            animationId = 0;
            if (!isVisible || document.hidden) return;

            // Smoothly interpolate speed
            speed += (targetSpeed - speed) * 0.05;

            // Update position
            x += speed;

            // Infinite loop logic
            // Slides are arranged side by side: [Slide 1][Slide 2]
            // We want to keep x between -slideWidth and 0
            if (x <= -slideWidth) {
                x += slideWidth;
            }
            if (x >= 0) {
                x -= slideWidth;
            }

            // Apply transform to both slides
            const transformValue = `translateX(${x}px)`;
            slides.forEach(slide => {
                slide.style.transform = transformValue;
            });

            animationId = requestAnimationFrame(animate);
        }

        const startAnimation = () => {
            if (!animationId && isVisible && !document.hidden) {
                animationId = requestAnimationFrame(animate);
            }
        };

        const carouselObserver = new IntersectionObserver((entries) => {
            isVisible = entries[0].isIntersecting;
            if (isVisible) startAnimation();
            else if (animationId) {
                cancelAnimationFrame(animationId);
                animationId = 0;
            }
        });
        carouselObserver.observe(container);

        document.addEventListener('visibilitychange', startAnimation);
    });
    // --- Parallax & Reveal Implementation ---

    // 1. Header Lambda Parallax
    const parallaxLambdas = document.querySelectorAll('.parallax-lambda');

    // 2. Elegant Reveal Observer
    const revealObserverOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, revealObserverOptions);

    document.querySelectorAll('.reveal-item').forEach(el => revealObserver.observe(el));
    document.querySelectorAll('.reveal-step').forEach(el => revealObserver.observe(el));

    // ─── Methodology Timeline: Scroll Progress & Dot Highlight ───────────
    const timelineSection = document.querySelector('.timeline-section');
    const timelineProgress = document.querySelector('.timeline-progress');
    const timelineItems = document.querySelectorAll('.timeline-section .timeline-item');

    if (timelineSection && timelineProgress) {
        let timelineFrame = 0;

        const updateTimeline = () => {
            timelineFrame = 0;
            const rect = timelineSection.getBoundingClientRect();
            // Start progressing when the section is a bit below the top of viewport
            const triggerOffset = window.innerHeight * 0.5; 
            
            // Calculamos cuánto hemos scrolleado dentro de la sección
            const scrollStart = rect.top - triggerOffset;
            const scrollDistance = rect.height; // approximate
            
            let progress = 0;
            if (scrollStart > 0) {
                progress = 0;
            } else if (-scrollStart > scrollDistance) {
                progress = 100;
            } else {
                progress = (-scrollStart / scrollDistance) * 100;
            }

            // Aceleramos ligeramente el progreso visual para que llegue al 100% a tiempo
            progress = Math.min(100, Math.max(0, progress * 1.1));
            
            const itemRects = Array.from(timelineItems, item => item.getBoundingClientRect());
            // El margen inferior es el hueco natural entre tarjetas: de ahí sale el
            // recorrido del que disponemos para apagar la que se queda atrás.
            const stepGap = timelineItems.length
                ? parseFloat(getComputedStyle(timelineItems[0]).marginBottom) || 0
                : 0;
            timelineProgress.style.transform = `scaleY(${progress / 100})`;

            // Iluminar puntos de la línea de tiempo y apagar tarjetas anteriores
            timelineItems.forEach((item, index) => {
                const itemRect = itemRects[index];
                if (itemRect.top < window.innerHeight * 0.7) {
                    item.classList.add('is-visible');
                } else {
                    item.classList.remove('is-visible');
                }
                
                // Apagar la tarjeta antes de que la siguiente la alcance: si las dos se
                // leen a la vez el solapamiento parece un fallo de renderizado.
                if (index < timelineItems.length - 1) {
                    const nextRect = itemRects[index + 1];
                    const distance = nextRect.top - itemRect.top;
                    // A esta distancia las tarjetas ya se tocan: el fundido tiene que
                    // haber terminado antes, no empezar aquí.
                    const overlapAt = itemRect.height + 16;
                    const fadeStart = overlapAt + stepGap * 0.85;
                    const content = item.querySelector('.timeline-content');

                    if (content) {
                        if (fadeStart > overlapAt && distance <= fadeStart && itemRect.top <= window.innerHeight * 0.6) {
                            const t = Math.min(1, Math.max(0, (fadeStart - distance) / (fadeStart - overlapAt)));
                            const fade = t * t * (3 - 2 * t); // suaviza la entrada y la salida

                            content.style.opacity = `${1 - fade}`;
                            content.style.transform = `scale(${1 - (fade * 0.05)})`;
                            content.style.pointerEvents = fade > 0.3 ? 'none' : 'auto';
                            content.style.transition = 'none'; // Instanteo para sincronizar con scroll
                        } else {
                            content.style.opacity = '';
                            content.style.transform = '';
                            content.style.pointerEvents = '';
                            content.style.transition = ''; // Restaura transición CSS
                        }
                    }
                }
            });
        };

        const requestTimelineUpdate = () => {
            if (!timelineFrame) timelineFrame = requestAnimationFrame(updateTimeline);
        };

        window.addEventListener('scroll', requestTimelineUpdate, { passive: true });
        window.addEventListener('resize', requestTimelineUpdate, { passive: true });
        requestTimelineUpdate();
    }

    // 3. Glass Parallax Cards
    const glassCards = document.querySelectorAll('.card-parallax');

    // Handle all scroll-based parallax in one listener for performance
    window.addEventListener('scroll', () => {
        // Disable parallax on mobile for performance and usability
        if (window.innerWidth <= 768) return;

        const scrolled = window.scrollY;

        // Header Parallax logic
        parallaxLambdas.forEach(lambda => {
            const parent = lambda.parentElement;
            const parentRect = parent.getBoundingClientRect();

            // Only transform if the header is visible
            if (parentRect.top < window.innerHeight && parentRect.bottom > 0) {
                const speed = 0.4;
                const yPos = (scrolled * speed);
                lambda.style.transform = `translate(-50%, calc(-50% + ${yPos}px))`;
            }
        });

        // Glass Card Parallax logic
        glassCards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const winHeight = window.innerHeight;

            if (rect.top < winHeight && rect.bottom > 0) {
                // Calculate position relative to viewport (0 = enter, 1 = exit)
                const relativePos = (rect.top + rect.height / 2) / winHeight;
                const movement = (relativePos - 0.5) * 30; // Move +/- 15px
                card.style.setProperty('--parallax-y', `${movement}px`);

                // Direct style update for the pseudo-element via a variable is not possible, 
                // so we use a CSS variable that the pseudo-element consumes.
                card.style.setProperty('--glass-y', `${-movement}px`);
            }
        });
    }, { passive: true });

    // Update CSS to use the variables
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
        .card-parallax::before {
            transform: translateY(var(--glass-y, 0px));
        }
    `;
    document.head.appendChild(styleSheet);
});

// Accordion interaction
document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
        const accordionItem = header.parentElement;
        const isExpanded = accordionItem.classList.contains('is-expanded');

        if (isExpanded) {
            accordionItem.classList.remove('is-expanded');
            header.setAttribute('aria-expanded', 'false');
        } else {
            accordionItem.classList.add('is-expanded');
            header.setAttribute('aria-expanded', 'true');
        }
    });
});

// Non-critical sensory and system-information features are fetched only when
// they can be used. This keeps audio samples, the custom cursor, and the large
// version modal out of the initial rendering path.
document.addEventListener('DOMContentLoaded', () => {
    function loadScriptOnce(filename) {
        const absoluteSrc = new URL(filename, elysiumScriptBase).href;
        const existing = Array.from(document.scripts).find(script => script.src === absoluteSrc);
        if (existing) return Promise.resolve(existing);

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = absoluteSrc;
            script.onload = () => resolve(script);
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }

    const loadAudio = () => {
        loadScriptOnce('elysium-audio.js').catch(() => {});
        document.removeEventListener('pointerdown', loadAudio);
        document.removeEventListener('keydown', loadAudio);
    };
    document.addEventListener('pointerdown', loadAudio, { once: true, passive: true });
    document.addEventListener('keydown', loadAudio, { once: true });

    if (window.matchMedia('(pointer: fine)').matches &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.addEventListener('pointermove', () => {
            loadScriptOnce('elysium-mouse.js').catch(() => {});
        }, { once: true, passive: true });
    }

    const servicesSection = document.querySelector('.services');
    if (servicesSection) {
        const serviceScriptName = elysiumMainScript && /home\.v\d+\.min\.js$/.test(elysiumMainScript.src)
            ? 'service-modal.v20260730.min.js'
            : 'service-modal.js';
        let servicesLoaded = false;
        const loadServices = () => {
            if (servicesLoaded) return;
            servicesLoaded = true;
            loadScriptOnce(serviceScriptName).catch(() => {
                servicesLoaded = false;
            });
        };

        if ('IntersectionObserver' in window) {
            const servicesObserver = new IntersectionObserver((entries, observer) => {
                if (!entries[0].isIntersecting) return;
                observer.disconnect();
                loadServices();
            }, { rootMargin: '0px 0px -15% 0px' });
            servicesObserver.observe(servicesSection);
        } else {
            loadServices();
        }

        servicesSection.addEventListener('pointerenter', loadServices, { once: true, passive: true });
        servicesSection.addEventListener('focusin', loadServices, { once: true });
    }

    const footer = document.querySelector('footer');
    if (footer) {
        const versionObserver = new IntersectionObserver((entries, observer) => {
            if (!entries[0].isIntersecting) return;
            observer.disconnect();
            loadScriptOnce('version-modal.js').catch(() => {});
        }, { rootMargin: '300px 0px' });
        versionObserver.observe(footer);
    }
});

// Currency Switcher Logic
document.addEventListener('DOMContentLoaded', () => {
    const currencyBtns = document.querySelectorAll('.currency-btn');
    const dynamicPrices = document.querySelectorAll('.dynamic-price');

    if (currencyBtns.length === 0 || dynamicPrices.length === 0) return;

    let exchangeRates = { EUR: 1, USD: 1.05, CRC: 540 }; // Fallback rates
    let currentCurrency = 'EUR';
    let ratesPromise = null;

    // Fetch live rates
    async function fetchRates() {
        if (ratesPromise) return ratesPromise;
        ratesPromise = (async () => {
          try {
            // Using a free, reliable API for public exchange rates (Base EUR)
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();

            if (data && data.rates) {
                exchangeRates.USD = data.rates.USD || exchangeRates.USD;
                exchangeRates.CRC = data.rates.CRC || exchangeRates.CRC;
            }
          } catch (error) {
              // Fallback values keep the control usable when the API is offline.
          }
        })();
        return ratesPromise;
    }

    // Format price based on currency
    function formatPrice(basePrice, currency) {
        const rate = exchangeRates[currency] || 1;
        let converted = Math.round(basePrice * rate);

        if (currency === 'EUR') {
            return `${basePrice.toLocaleString('es-ES')} €`;
        } else if (currency === 'USD') {
            return `$${converted.toLocaleString('en-US')}`;
        } else if (currency === 'CRC') {
            const roundedCRC = Math.ceil(converted / 1000) * 1000;
            const formattedCRC = roundedCRC
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            return `₡${formattedCRC}`;
        }
        return `€${basePrice}`;
    }

    // Update all prices on the page
    function updatePrices(targetCurrency) {
        currentCurrency = targetCurrency;
        try {
            localStorage.setItem('preferredCurrency', targetCurrency);
        } catch (error) {
            // Storage can be disabled; prices still work for this visit.
        }
        document.body.dataset.activeCurrency = targetCurrency;

        dynamicPrices.forEach(el => {
            const baseStr = el.getAttribute('data-base-price');
            // Remove any existing separators from the data attribute just in case
            const cleanBaseStr = baseStr.replace(/[^0-9.-]+/g, "");
            const basePrice = parseFloat(cleanBaseStr);

            if (!isNaN(basePrice)) {
                el.innerText = formatPrice(basePrice, targetCurrency);
            }
        });

        // Update active button state across all switchers on the page
        currencyBtns.forEach(btn => {
            if (btn.getAttribute('data-currency') === targetCurrency) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // Auto-detect location for first-time visitors
    function detectDefaultCurrency() {
        let saved = null;
        try {
            saved = localStorage.getItem('preferredCurrency');
        } catch (error) {
            saved = null;
        }
        if (saved) return saved;

        const locale = Intl.DateTimeFormat().resolvedOptions().locale || navigator.language || '';
        const country = locale.split('-').pop().toUpperCase();
        if (country === 'CR') return 'CRC';

        const europe = ['AD','AL','AT','AX','BA','BE','BG','BY','CH','CY','CZ','DE','DK','EE','ES','FI','FO','FR','GB','GG','GI','GR','HR','HU','IE','IM','IS','IT','JE','LI','LT','LU','LV','MC','MD','ME','MK','MT','NL','NO','PL','PT','RO','RS','SE','SI','SJ','SK','SM','UA','VA'];
        return europe.includes(country) ? 'EUR' : 'USD';
    }

    // Setup event listeners
    currencyBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const selectedCurrency = btn.getAttribute('data-currency');
            if (selectedCurrency !== 'EUR') await fetchRates();
            updatePrices(selectedCurrency);
        });
    });

    const defaultCurrency = detectDefaultCurrency();
    updatePrices(defaultCurrency);

    // Refresh non-EUR fallbacks only when pricing actually reaches the
    // viewport. This keeps the exchange-rate API out of the initial chain.
    const pricingSwitcher = document.querySelector('.currency-switcher-container');
    if (defaultCurrency !== 'EUR' && pricingSwitcher) {
        const ratesObserver = new IntersectionObserver((entries, observer) => {
            if (!entries[0].isIntersecting) return;
            observer.disconnect();
            fetchRates().then(() => {
                if (currentCurrency === defaultCurrency) updatePrices(defaultCurrency);
            });
        });
        ratesObserver.observe(pricingSwitcher);
    }
});

// Read More Toggle Logic
document.addEventListener('DOMContentLoaded', () => {
    const readMoreBtns = document.querySelectorAll('.read-more-btn');

    readMoreBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('aria-controls');
            if (!targetId) return;

            const content = document.getElementById(targetId);
            if (!content) return;

            const isExpanded = btn.getAttribute('aria-expanded') === 'true';

            // Toggle Logic
            if (isExpanded) {
                // Collapse
                content.classList.remove('is-expanded');
                btn.setAttribute('aria-expanded', 'false');

                // Switch text based on language via text content check
                if (btn.innerText.includes('Leer más') || btn.innerText.includes('Leer menos')) {
                    btn.innerText = 'Leer más ↓';
                } else if (btn.innerText.includes('Read more') || btn.innerText.includes('Show less')) {
                    btn.innerText = 'Read more ↓';
                } else if (btn.innerText.includes('Ler mais') || btn.innerText.includes('Ler menos')) {
                    btn.innerText = 'Ler mais ↓';
                } else {
                    btn.innerText = 'Read more ↓'; // Fallback
                }
            } else {
                // Expand
                content.classList.add('is-expanded');
                btn.setAttribute('aria-expanded', 'true');

                // Switch text based on language via text content check
                if (btn.innerText.includes('Leer más') || btn.innerText.includes('Leer menos')) {
                    btn.innerText = 'Leer menos ↑';
                } else if (btn.innerText.includes('Read more') || btn.innerText.includes('Show less')) {
                    btn.innerText = 'Show less ↑';
                } else if (btn.innerText.includes('Ler mais') || btn.innerText.includes('Ler menos')) {
                    btn.innerText = 'Ler menos ↑';
                } else {
                    btn.innerText = 'Show less ↑'; // Fallback
                }
            }
        });
    });
});

// Discrete Text Carousel Logic
document.addEventListener('DOMContentLoaded', () => {
    const discreteCarousels = document.querySelectorAll('.discrete-text-carousel');
    discreteCarousels.forEach(carousel => {
        const items = carousel.querySelectorAll('.discrete-item');
        if (items.length <= 1) return;

        let currentIndex = 0;

        function nextItem() {
            const current = items[currentIndex];
            if (!current) return;
            
            currentIndex = (currentIndex + 1) % items.length;
            const next = items[currentIndex];

            current.classList.remove('active');
            current.classList.add('exit');

            setTimeout(() => {
                current.classList.remove('exit');
            }, 800);

            if (next) next.classList.add('active');
        }

        setInterval(nextItem, 4000);
    });
});

// Portfolio iOS Search & Filter Logic
document.addEventListener('DOMContentLoaded', () => {
    const searchWrapper = document.getElementById('ios-search-wrapper');
    const searchInput = document.getElementById('portfolio-search');
    const searchIcon = document.querySelector('.ios-icon');
    const segmentControl = document.getElementById('ios-segmented-control');
    const segmentSlider = document.getElementById('ios-segment-slider');
    const segments = document.querySelectorAll('.ios-segment');
    const projectCards = document.querySelectorAll('.project-card');
    
    if (!segmentControl && !searchInput) return;

    let currentFilter = 'all';
    let searchQuery = '';

    // Initialize Slider Position
    function updateSlider(activeSegment) {
        if (!segmentSlider || !activeSegment) return;
        const leftOffset = activeSegment.offsetLeft;
        const width = activeSegment.offsetWidth;
        segmentSlider.style.transform = `translateX(${leftOffset}px)`;
        segmentSlider.style.width = `${width}px`;
    }

    // Set initial position
    const initialActive = document.querySelector('.ios-segment.active');
    if (initialActive) {
        setTimeout(() => updateSlider(initialActive), 100);
    }

    // Filter Logic with stagger
    function filterProjects() {
        let delayCounter = 0;
        
        projectCards.forEach(card => {
            const category = card.getAttribute('data-category') || '';
            const title = (card.querySelector('h3')?.textContent || '').toLowerCase();
            const desc = (card.querySelector('p')?.textContent || '').toLowerCase();
            const textMatch = title.includes(searchQuery) || desc.includes(searchQuery);
            const categoryMatch = currentFilter === 'all' || category === currentFilter;

            if (textMatch && categoryMatch) {
                card.style.display = 'block';
                setTimeout(() => {
                    card.classList.remove('hidden');
                }, 10 + (delayCounter * 50));
                delayCounter++;
            } else {
                card.classList.add('hidden');
                setTimeout(() => {
                    if (card.classList.contains('hidden')) {
                        card.style.display = 'none';
                    }
                }, 400); 
            }
        });
    }

    // Expand search
    if (searchIcon && searchWrapper && searchInput) {
        searchIcon.addEventListener('click', () => {
            searchWrapper.classList.add('expanded');
            searchInput.focus();
        });

        searchInput.addEventListener('blur', () => {
            if (searchInput.value.trim() === '') {
                searchWrapper.classList.remove('expanded');
            }
        });

        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            filterProjects();
        });
    }

    // Segment Clicks
    segments.forEach(segment => {
        segment.addEventListener('click', () => {
            segments.forEach(s => s.classList.remove('active'));
            segment.classList.add('active');
            
            updateSlider(segment);
            
            currentFilter = segment.getAttribute('data-filter') || 'all';
            filterProjects();
        });
    });

    // Handle Resize
    window.addEventListener('resize', () => {
        const active = document.querySelector('.ios-segment.active');
        if (active) updateSlider(active);
    });
});
