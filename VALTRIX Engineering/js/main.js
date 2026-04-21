document.addEventListener('DOMContentLoaded', () => {
    // 0. Loading Page Logic
    const startTime = Date.now();
    const loader = document.getElementById('loader');
    
    window.addEventListener('load', () => {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 2000 - elapsedTime);
        
        setTimeout(() => {

            if (loader) {
                loader.classList.add('fade-out');
                document.body.style.overflow = ''; // Restore scroll
                
                // Remove from DOM after transition
                setTimeout(() => {
                    loader.remove();
                    document.body.classList.remove('loading');
                }, 800);
            }
        }, remainingTime);
    });

    // 1. Mobile Hamburger Menu Toggle

    // 1. Mobile Hamburger Menu Toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
            // Prevent scrolling on body when menu is open
            if(navMenu.classList.contains('active')){
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = 'auto';
            }
        });
    }

    // Close menu when a link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if(hamburger && navMenu) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    });

    // 2. Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
            navbar.style.padding = '0.5rem 0';
        } else {
            navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.05)';
            navbar.style.padding = '0';
        }
    });

    // 3. Smooth Scrolling for Anchor Links (safeguard for older browsers)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const getHref = this.getAttribute('href');
            if(getHref !== "#") {
                e.preventDefault();
                const targetId = getHref.substring(1);
                const targetElement = document.getElementById(targetId);
                
                if(targetElement) {
                    const navbarHeight = document.querySelector('.navbar').offsetHeight;
                    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // 4. Reveal Elements on Scroll
    const revealElements = document.querySelectorAll('.service-card, .plan-card, .ps-list-item, .stat-item');
    
    const revealOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealOnScroll = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                entry.target.style.opacity = "1";
                entry.target.style.transform = "translateY(0)";
                observer.unobserve(entry.target);
            }
        });
    }, revealOptions);

    // 5. Contact Form Submission
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Simulación de envío exitoso
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'Enviando...';
            
            setTimeout(() => {
                alert('¡Gracias! Su solicitud de diagnóstico ha sido enviada con éxito. Valeria Vargas se pondrá en contacto con usted a la brevedad posible.');
                contactForm.reset();
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }, 1500);
        });
    }

    // 6. FAB & Theme Toggle Logic
    const fabMain = document.getElementById('fab-main');
    const fabWrapper = document.getElementById('fab-wrapper');
    const themeToggle = document.getElementById('theme-toggle');
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');

    // FAB Toggle
    if (fabMain && fabWrapper) {
        fabMain.addEventListener('click', (e) => {
            e.stopPropagation();
            fabWrapper.classList.toggle('active');
        });

        // Close FAB when clicking outside
        document.addEventListener('click', (e) => {
            if (fabWrapper.classList.contains('active') && !fabWrapper.contains(e.target)) {
                fabWrapper.classList.remove('active');
            }
        });
    }

    // Theme Switch Function
    function setTheme(isLight, isManual = false) {
        if (isLight) {
            document.body.classList.add('light-mode');
            if (sunIcon) sunIcon.style.display = 'none';
            if (moonIcon) moonIcon.style.display = 'block';
        } else {
            document.body.classList.remove('light-mode');
            if (sunIcon) sunIcon.style.display = 'block';
            if (moonIcon) moonIcon.style.display = 'none';
        }
        
        if (isManual) {
            localStorage.setItem('theme_preference', isLight ? 'light' : 'dark');
        }
    }

    // Automatic theme based on Costa Rica time (UTC-6)
    function applyAutoTheme() {
        const savedTheme = localStorage.getItem('theme_preference');
        if (savedTheme) {
            setTheme(savedTheme === 'light');
            return;
        }

        try {
            const now = new Date();
            const crTime = now.toLocaleString("en-US", {timeZone: "America/Costa_Rica", hour12: false, hour: "numeric"});
            const crHour = parseInt(crTime);
            
            // Light Mode: 6am to 6pm (18:00)
            const isLightTime = crHour >= 6 && crHour < 18;
            setTheme(isLightTime);
        } catch (e) {
            console.error("Error calculating Costa Rica time:", e);
            setTheme(true); // Default to light on error
        }
    }

    // Theme Toggle Click
    if (themeToggle) {
        themeToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isCurrentlyLight = document.body.classList.contains('light-mode');
            setTheme(!isCurrentlyLight, true);
        });
    }

    // Initialize Theme
    applyAutoTheme();
});
