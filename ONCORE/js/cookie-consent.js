document.addEventListener('DOMContentLoaded', () => {
    const banner = document.getElementById('cookie-banner');
    const btnAccept = document.getElementById('btn-accept-cookies');
    const btnReject = document.getElementById('btn-reject-cookies');

    // Check if the user has already given consent
    const consent = localStorage.getItem('oncore_cookie_consent');

    if (!consent) {
        // Show banner if no consent is found
        banner.setAttribute('aria-hidden', 'false');
    } else if (consent === 'accepted') {
        // Here you would initialize your non-essential cookies/analytics
        initAnalytics();
    }

    // Accept cookies
    if (btnAccept) {
        btnAccept.addEventListener('click', () => {
            localStorage.setItem('oncore_cookie_consent', 'accepted');
            banner.setAttribute('aria-hidden', 'true');
            initAnalytics();
        });
    }

    // Reject non-essential cookies
    if (btnReject) {
        btnReject.addEventListener('click', () => {
            localStorage.setItem('oncore_cookie_consent', 'rejected');
            banner.setAttribute('aria-hidden', 'true');
            // Do not initialize analytics
        });
    }

    // Function to load non-essential scripts only when accepted
    function initAnalytics() {
        console.log('Non-essential cookies accepted. Initializing analytics...');
        // Example: load Google Analytics or Facebook Pixel here
        /*
        const script = document.createElement('script');
        script.src = 'https://www.googletagmanager.com/gtag/js?id=YOUR-ID';
        script.async = true;
        document.head.appendChild(script);
        */
    }
});
