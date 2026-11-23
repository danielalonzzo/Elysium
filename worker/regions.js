export const REGION_PATH = '/__region';

const HOMES = {
    EU: 'https://elysiumdr.eu/',
    ES: 'https://elysiumdr.es/',
    PT: 'https://elysiumdr.pt/',
    CR: 'https://elysiumdr.cr/',
    GLOBAL: 'https://elysiumdr.com/'
};

// Europa según la clasificación M49 de la ONU, más Chipre y Kosovo.
const EUROPE = new Set([
    'AD', 'AL', 'AT', 'AX', 'BA', 'BE', 'BG', 'BY', 'CH', 'CY', 'CZ', 'DE',
    'DK', 'EE', 'FI', 'FO', 'FR', 'GB', 'GG', 'GI', 'GR', 'HR', 'HU', 'IE',
    'IM', 'IS', 'IT', 'JE', 'LI', 'LT', 'LU', 'LV', 'MC', 'MD', 'ME', 'MK',
    'MT', 'NL', 'NO', 'PL', 'RO', 'RS', 'RU', 'SE', 'SI', 'SJ', 'SK', 'SM',
    'UA', 'VA', 'XK'
]);

export function regionForCountry(country) {
    if (!/^[A-Z]{2}$/.test(country) || country === 'XX') return null;
    if (country === 'ES' || country === 'PT' || country === 'CR') return country;
    return EUROPE.has(country) ? 'EU' : 'GLOBAL';
}

export function regionForUrl(url, pathname = url.pathname) {
    switch (url.hostname) {
        case 'elysiumdr.eu': return 'EU';
        case 'elysiumdr.es': return 'ES';
        case 'elysiumdr.pt': return 'PT';
        case 'elysiumdr.cr': return 'CR';
        case 'elysiumdr.com': return 'GLOBAL';
        default: return null;
    }
}

export function regionalPage(pathname, region) {
    let path = region === 'CR' ? pathname.replace(/^\/cr(?=\/|$)/, '') : pathname;
    if (region === 'EU' || region === 'GLOBAL' || region === 'CR') {
        path = path.replace(/^\/(?:es|pt)(?=\/|$)/, '');
    }
    const page = path.replace(/^\//, '').replace(/\/$/, '').replace(/\.html$/, '');
    return page === 'index' ? '' : page;
}

export function regionalUrl(region, page) {
    return new URL(page, HOMES[region]).href;
}
