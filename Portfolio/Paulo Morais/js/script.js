/*
 * Developed by Elysium λ Development & Research
 * A European company
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    } else {
        console.warn('Lucide library not loaded');
    }

    // Header Scroll Effect
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Mobile Menu Toggle
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            mobileToggle.classList.toggle('active');

            // Icon switching
            const icon = mobileToggle.querySelector('i');
            if (mobileToggle.classList.contains('active')) {
                icon.setAttribute('data-lucide', 'x');
            } else {
                icon.setAttribute('data-lucide', 'menu');
            }
            lucide.createIcons();
        });

        // Keyboard Accessibility
        mobileToggle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                mobileToggle.click();
            }
        });

        // Close menu when a link is clicked
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                mobileToggle.classList.remove('active');
                const icon = mobileToggle.querySelector('i');
                icon.setAttribute('data-lucide', 'menu');
                lucide.createIcons();
            });
        });
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Reveal animations on scroll
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    document.querySelectorAll('section').forEach(section => {
        section.classList.add('reveal');
        observer.observe(section);
    });

    // --- Testimonial Carousel System ---
    const setupCarousel = () => {
        const testimonials = document.querySelectorAll('.testimonial-card-gold, .testimonial-card-yellow');
        const paginations = document.querySelectorAll('.testimonial-pagination');

        if (testimonials.length === 0) return;

        let currentIndex = 0;
        let timer;
        const speed = 6000;

        const updateUI = (index) => {
            // Update Cards
            testimonials.forEach((card, i) => {
                card.classList.toggle('active', i === index);
            });

            // Update All Dots in all pagination bars found
            document.querySelectorAll('.dot').forEach((dot, i) => {
                // If the dot belongs to a bar that should have 'X' dots, we need to be careful
                // For simplicity, we match the index within its own pagination container
                const dotsInThisBar = dot.parentElement.querySelectorAll('.dot');
                const dotIdx = Array.from(dotsInThisBar).indexOf(dot);
                dot.classList.toggle('active', dotIdx === index);
            });
        };

        const goToNext = () => {
            currentIndex = (currentIndex + 1) % testimonials.length;
            updateUI(currentIndex);
        };

        const startTimer = () => {
            clearInterval(timer);
            timer = setInterval(goToNext, speed);
        };

        // Initialize
        updateUI(0);
        startTimer();

        // Event Listeners for Dots
        paginations.forEach(p => {
            const dots = p.querySelectorAll('.dot');
            dots.forEach((dot, i) => {
                dot.addEventListener('click', () => {
                    currentIndex = i;
                    updateUI(currentIndex);
                    startTimer(); // Reset timer on interaction
                });
            });
        });

        // Pause on Hover
        const container = document.querySelector('.testimonial-carousel-wrapper, .testimonials-right');
        if (container) {
            container.addEventListener('mouseenter', () => clearInterval(timer));
            container.addEventListener('mouseleave', startTimer);
        }
    };

    setupCarousel();


    // Force Video Autoplay (Robustness for Large Files)
    const autoPlayVideos = document.querySelectorAll('.video-auto-play');
    autoPlayVideos.forEach(video => {
        video.play().catch(error => {
            console.warn("Autoplay was prevented:", error);
            // Retry on interaction or muted
            video.muted = true;
            video.play().catch(e => console.error("Retry failed:", e));
        });
    });

    // Parallax Effect for Osteopatia Statistics
    const parallaxSection = document.querySelector('.osteopatia-parallax-section');
    const parallaxBg = document.querySelector('.parallax-bg');

    if (parallaxSection && parallaxBg) {
        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const scrolled = window.scrollY;
                    const sectionTop = parallaxSection.offsetTop;
                    const sectionHeight = parallaxSection.offsetHeight;
                    const windowHeight = window.innerHeight;

                    // Only calculate if section is in view
                    if (scrolled + windowHeight > sectionTop && scrolled < sectionTop + sectionHeight) {
                        // Calculate relative scroll position
                        const distance = scrolled - sectionTop;

                        // Move the background element using transform
                        // Speed 0.3 ensures visible but smooth movement
                        const speed = 0.3;
                        const yPos = distance * speed;

                        // Apply transform
                        parallaxBg.style.transform = `translate3d(0, ${yPos}px, 0)`;
                    }
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    // Preloader Logic
    // We use window.addEventListener('load') to ensure all assets (images, scripts) are loaded
    window.addEventListener('load', () => {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            // Add a small delay for better UX (optional, but requested implicitly by "effect of loading")
            setTimeout(() => {
                document.body.classList.add('loaded');
                // Remove from DOM after transition to free up memory (optional but good practice)
                setTimeout(() => {
                    preloader.style.display = 'none';
                }, 500); // Match transition duration
            }, 500); // Minimum 500ms loading time
        }
    });

    // GDPR Cookie Banner
    const cookieConsent = localStorage.getItem('cookie_consent');
    if (!cookieConsent) {
        const banner = document.createElement('div');
        banner.id = 'cookie-banner';
        banner.className = 'cookie-banner';
        banner.innerHTML = `
            <p>Utilizamos cookies para melhorar a sua experiência e para fins de marketing. Ao continuar, concorda com a nossa <a href="politica-privacidade.html">Política de Privacidade</a>.</p>
            <div class="cookie-buttons">
                <button id="accept-cookies" class="btn btn-primary btn-sm">Aceitar</button>
                <button id="reject-cookies" class="btn btn-primary-black btn-sm" style="border: 1px solid #333;">Rejeitar</button>
            </div>
        `;
        document.body.appendChild(banner);

        // Animation delay
        setTimeout(() => {
            banner.classList.add('visible');
        }, 1000);

        document.getElementById('accept-cookies').addEventListener('click', () => {
            localStorage.setItem('cookie_consent', 'accepted');
            banner.classList.remove('visible');
            setTimeout(() => banner.remove(), 300);
        });

        document.getElementById('reject-cookies').addEventListener('click', () => {
            localStorage.setItem('cookie_consent', 'rejected');
            banner.classList.remove('visible');
            setTimeout(() => banner.remove(), 300);
        });
    }

});

/* --- YouTube High Res Force --- */
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var player;
var player2;

function onYouTubeIframeAPIReady() {
    // Initial Hero Video
    if (document.getElementById('hero-video-iframe')) {
        player = new YT.Player('hero-video-iframe', {
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
            }
        });
    }

    // Final Hero CTA Video
    if (document.getElementById('hero-cta-video-iframe')) {
        player2 = new YT.Player('hero-cta-video-iframe', {
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
            }
        });
    }
}

function onPlayerReady(event) {
    event.target.mute();
    event.target.playVideo();
    event.target.setPlaybackQuality('hd1080'); // Suggest to force 1080p
}

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING) {
        event.target.setPlaybackQuality('hd1080'); // Re-force when playing starts
    }
    if (event.data == YT.PlayerState.ENDED) {
        event.target.playVideo();
    }
}
