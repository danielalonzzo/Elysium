// js/script.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    } else {
        console.warn('Lucide icons not loaded');
    }

    // 2. Sticky Header Logic
    const header = document.querySelector('header');
    
    const handleScroll = () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };

    // Initial check and scroll event listener
    window.addEventListener('scroll', handleScroll);
    handleScroll();

    // 3. Mobile Menu Logic
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navMenu = document.querySelector('.nav-menu');

    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const icon = mobileMenuBtn.querySelector('i');
            if (navMenu.classList.contains('active')) {
                icon.setAttribute('data-lucide', 'x');
            } else {
                icon.setAttribute('data-lucide', 'menu');
            }
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        });

        // Close menu when clicking a link
        const navLinks = navMenu.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                const icon = mobileMenuBtn.querySelector('i');
                if (icon) {
                    icon.setAttribute('data-lucide', 'menu');
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons();
                    }
                }
            });
        });
    }

    // 3. FAB (Floating Action Button) Logic
    const fabTrigger = document.getElementById('fabTrigger');
    const fabContainer = document.querySelector('.fab-container');

    if (fabTrigger && fabContainer) {
        fabTrigger.addEventListener('click', () => {
            fabContainer.classList.toggle('active');
            
            // Change icon based on state
            const icon = fabTrigger.querySelector('i');
            if (fabContainer.classList.contains('active')) {
                icon.setAttribute('data-lucide', 'x');
            } else {
                icon.setAttribute('data-lucide', 'plus');
            }
            // Re-render the specific icon
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        });

        // Close FAB when clicking outside
        document.addEventListener('click', (event) => {
            if (!fabContainer.contains(event.target)) {
                fabContainer.classList.remove('active');
                const icon = fabTrigger.querySelector('i');
                if (icon) {
                    icon.setAttribute('data-lucide', 'plus');
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons();
                    }
                }
            }
        });
    }
});
