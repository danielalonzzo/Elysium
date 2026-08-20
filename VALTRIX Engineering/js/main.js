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

    // 5. Contact Form Submission (Multi-form support: contacto.html & index.html)
    //
    // No hay backend todavía (queda para la fase 2 con Firebase). Hasta entonces
    // el formulario redacta la solicitud y la abre en el cliente de correo del
    // visitante: el envío lo confirma él. Ambos formularios van a info@valtrix.com.
    const contactForms = document.querySelectorAll('.contact-form');
    if (contactForms.length > 0) {
        const DESTINATARIO = 'info@valtrix.com';

        contactForms.forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();

                const getVal = (name) => {
                    const field = form.querySelector(`[name="${name}"]`);
                    return field ? field.value.trim() : '';
                };

                const negocio = getVal('company');
                const asunto = 'Solicitud de llamada — ' + (negocio || 'VALTRIX');

                const cuerpo = [
                    'Solicitud de llamada de 30 minutos, sin costo',
                    '',
                    'Nombre:      ' + getVal('name'),
                    'Negocio:     ' + negocio,
                    'Correo:      ' + getVal('email'),
                    'WhatsApp:    ' + getVal('phone'),
                    'Zona:        ' + getVal('canton'),
                    'Se dedica a: ' + getVal('sector'),
                    'Personas:    ' + getVal('size'),
                    'Interés:     ' + getVal('interest'),
                    '',
                    '¿Qué lo trae hoy?',
                    getVal('trigger'),
                    '',
                    '—',
                    'Enviado desde valtrix.cr'
                ].join('\n');

                const enlace = 'mailto:' + DESTINATARIO +
                    '?subject=' + encodeURIComponent(asunto) +
                    '&body=' + encodeURIComponent(cuerpo);

                const submitBtn = form.querySelector('button[type="submit"]');
                const originalHTML = submitBtn ? submitBtn.innerHTML : 'Preparar la solicitud';
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Abriendo su correo…';
                }

                window.location.href = enlace;

                if (submitBtn) {
                    setTimeout(() => {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalHTML;
                    }, 2500);
                }
            });
        });
    }

    // 5b. Acordeón de preguntas frecuentes
    document.querySelectorAll('.faq-question').forEach((question) => {
        question.addEventListener('click', () => {
            const item = question.closest('.faq-item');
            const answer = item.querySelector('.faq-answer');
            const isOpen = item.classList.toggle('is-open');

            // max-height se calcula al vuelo para que la transición anime
            answer.style.maxHeight = isOpen ? answer.scrollHeight + 'px' : null;
        });
    });

    // 6. FAB Toggle Logic
    const fabMain = document.getElementById('fab-main');
    const fabWrapper = document.getElementById('fab-wrapper');

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
});
