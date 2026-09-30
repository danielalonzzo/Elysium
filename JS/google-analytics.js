(function () {
    'use strict';

    const measurementId = 'G-PY4LMCTNG9';
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
        window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', measurementId);

    if (document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${measurementId}"]`)) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
}());
