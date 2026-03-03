document.addEventListener('DOMContentLoaded', () => {
    /* -----------------------------------------------------------
       1. Mobile Drawer Logic
    ----------------------------------------------------------- */
    const menuToggle = document.getElementById('menuToggle');
    const closeMenu = document.getElementById('closeMenu');
    const mobileDrawer = document.getElementById('mobileDrawer');
    const navItems = document.querySelectorAll('.mobile-nav .nav-item, .drawer-footer .cta-button');

    function openMenu() {
        mobileDrawer.classList.add('open');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    function hideMenu() {
        mobileDrawer.classList.remove('open');
        document.body.style.overflow = '';
    }

    menuToggle.addEventListener('click', openMenu);
    closeMenu.addEventListener('click', hideMenu);

    navItems.forEach(item => {
        item.addEventListener('click', hideMenu);
    });

    /* -----------------------------------------------------------
       2. Sticky / Glassy Header on Scroll
    ----------------------------------------------------------- */
    const header = document.getElementById('header');
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;

        if (currentScrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Hide header on scroll down, show on scroll up
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            header.classList.add('header-hidden');
        } else {
            header.classList.remove('header-hidden');
        }

        lastScrollY = currentScrollY;
    });

    /* -----------------------------------------------------------
       3. Intersection Observer (Fade up on scroll)
    ----------------------------------------------------------- */
    const revealElements = document.querySelectorAll('.reveal, .animate-fade-up');

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Reveal only once
            }
        });
    }, {
        root: null,
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    });

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });

    /* -----------------------------------------------------------
       4. Simple Parallax for Hero Image
    ----------------------------------------------------------- */
    const parallaxBg = document.querySelector('.hero-bg img');
    const parallaxImgs = document.querySelectorAll('.parallax-img');

    window.addEventListener('scroll', () => {
        // Disable parallax on mobile
        if (window.innerWidth <= 768) return;

        let scrollY = window.scrollY;

        // Hero background moves slower
        if (parallaxBg && scrollY < window.innerHeight) {
            parallaxBg.style.transform = `translateY(${scrollY * 0.4}px) scale(1.05)`;
        }

        // Slight parallax for product images
        parallaxImgs.forEach(img => {
            const rect = img.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                const diff = (window.innerHeight - rect.top) * 0.05;
                img.style.transform = `translateY(-${diff}px) scale(1.1)`;
            }
        });
    });

    /* -----------------------------------------------------------
       5. Menu Tabs (Segmented Control)
    ----------------------------------------------------------- */
    const tabSegments = document.querySelectorAll('.segment');
    const tabContents = document.querySelectorAll('.menu-tab-content');

    tabSegments.forEach(segment => {
        segment.addEventListener('click', () => {
            // Remove active from all
            tabSegments.forEach(s => s.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active to clicked
            segment.classList.add('active');
            const targetId = `tab-${segment.getAttribute('data-target')}`;
            document.getElementById(targetId).classList.add('active');
        });
    });

    // Handle Quick Categories links to auto-select tab
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('click', (e) => {
            const targetTab = card.getAttribute('data-tab');
            const segmentToClick = document.querySelector(`.segment[data-target="${targetTab}"]`);
            if (segmentToClick) {
                segmentToClick.click();
            }
        });
    });

    /* -----------------------------------------------------------
       6. Initial Animations Trigger
    ----------------------------------------------------------- */
    setTimeout(() => {
        const heroElements = document.querySelectorAll('.hero .animate-fade-up');
        heroElements.forEach(el => el.classList.add('visible'));
    }, 100);

});

/* -----------------------------------------------------------
   7. Modal Options (Uber Eats / Glovo)
----------------------------------------------------------- */
function openOrderModal() {
    const modal = document.getElementById('orderModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeOrderModal() {
    const modal = document.getElementById('orderModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Close order modal when clicking outside the card
document.getElementById('orderModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('orderModal')) {
        closeOrderModal();
    }
});

/* -----------------------------------------------------------
   8. Contact Modal (WhatsApp / Maps)
----------------------------------------------------------- */
function openContactModal() {
    const modal = document.getElementById('contactModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeContactModal() {
    const modal = document.getElementById('contactModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Close contact modal when clicking outside the card
document.getElementById('contactModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('contactModal')) {
        closeContactModal();
    }
});
