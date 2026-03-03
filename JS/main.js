document.addEventListener('DOMContentLoaded', () => {
    // Developer cards - expand/collapse on click
    document.querySelectorAll('[data-developer-card]').forEach(trigger => {
        trigger.addEventListener('click', () => {
            const card = trigger.closest('.developer-card');
            const isExpanded = card.classList.toggle('is-expanded');
            trigger.setAttribute('aria-expanded', isExpanded);
            const detail = document.getElementById(trigger.getAttribute('aria-controls'));
            if (detail) detail.setAttribute('aria-hidden', !isExpanded);
        });
    });

    // Language switcher dropdown
    const langDropdown = document.querySelector('.lang-switcher-dropdown');
    if (langDropdown) {
        const trigger = langDropdown.querySelector('.lang-switcher-trigger');
        const menu = langDropdown.querySelector('.lang-switcher-menu');
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            langDropdown.classList.toggle('is-open');
            trigger.setAttribute('aria-expanded', langDropdown.classList.contains('is-open'));
        });
        document.addEventListener('click', () => {
            langDropdown.classList.remove('is-open');
            trigger.setAttribute('aria-expanded', 'false');
        });
        menu.addEventListener('click', (e) => e.stopPropagation());
    }

    // Mobile Navigation Toggle
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            // Toggle icon between hamburger and close
            if (navLinks.classList.contains('active')) {
                mobileToggle.textContent = '✕';
                document.body.style.overflow = 'hidden'; // Prevent scrolling when menu is open
            } else {
                mobileToggle.textContent = '☰';
                document.body.style.overflow = '';
            }
        });

        // Close menu when clicking a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                mobileToggle.textContent = '☰';
                document.body.style.overflow = '';
            });
        });
    }

    // Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Smooth Scroll for Anchors
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
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
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        el.style.opacity = '0'; // Initial state
        observer.observe(el);
    });
    // Testimonial Carousel
    const testimonialContent = document.querySelector('.testimonial-content');
    if (testimonialContent) {
        const testimonials = [
            {
                quote: "Elysium brought a level of rigor and professionalism we hadn't seen before. The result is immaculate.",
                author: "— CEO, FinTech Zurich"
            },
            {
                quote: "Precise execution. They understood our need for a serious, high-performance platform.",
                author: "— Director, Logistics Berlin"
            },
            {
                quote: "A perfect blend of aesthetics and engineering. The new dashboard improved our workflow efficiency by 40%.",
                author: "— CTO, DataSystems Munich"
            },
            {
                quote: "Their research-first approach saved us months of development time. Truly European excellence.",
                author: "— Founder, AI Startup Paris"
            }
        ];

        let currentIndex = 0;
        const quoteEl = testimonialContent.querySelector('.testimonial-quote');
        const authorEl = testimonialContent.querySelector('.testimonial-author');
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

    // Interactive Tools Carousel
    const logoContainers = document.querySelectorAll('.logos');

    logoContainers.forEach(container => {
        const slides = container.querySelectorAll('.logos-slide');
        if (slides.length < 2) return;

        let x = 0;
        let speed = -1; // Base speed (moving left)
        let targetSpeed = -1;
        let isHovered = false;
        let containerWidth = container.offsetWidth;
        let slideWidth = slides[0].offsetWidth;

        // Resync widths on resize and after images load
        const updateWidths = () => {
            containerWidth = container.offsetWidth;
            slideWidth = slides[0].offsetWidth;
        };

        window.addEventListener('resize', updateWidths);

        // Also wait for images to load to get correct widths
        container.querySelectorAll('img').forEach(img => {
            if (img.complete) updateWidths();
            else img.addEventListener('load', updateWidths);
        });

        container.addEventListener('mousemove', (e) => {
            isHovered = true;
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
            isHovered = false;
            targetSpeed = -1; // Return to idle speed
        });

        function animate() {
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

            requestAnimationFrame(animate);
        }

        // Start animation
        requestAnimationFrame(animate);
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
            
            // Toggle current item
            accordionItem.classList.toggle('is-expanded');
            
            // Optional: Close other items (uncomment if you want accordion behavior)
            /*
            document.querySelectorAll('.accordion-item').forEach(item => {
                if(item !== accordionItem) {
                    item.classList.remove('is-expanded');
                }
            });
            */
        });
    });
