const ACCOUNT_LABELS = { en: 'Account', es: 'Cuenta', pt: 'Conta' };
const PROFILE_ROUTE = /^\/(?:es\/|pt\/|cr\/)?profiles(?:\.html)?\/?$/;
const CONTACT_ROUTE = /^\/(?:es\/|pt\/|cr\/)?contact(?:\.html)?\/?$/;
const LINK_CLASSES = ['nav-link', 'btn', 'btn-primary'];

function setLinkStyle(link, classes) {
    for (const name of LINK_CLASSES) link.classList.toggle(name, classes.includes(name));
}

function setupHeaderAccount(nav) {
    const links = [...nav.querySelectorAll(':scope > a[href]')];
    const findRoute = route => links.find(link => link.origin === location.origin && route.test(link.pathname));
    const contact = findRoute(CONTACT_ROUTE);
    if (!contact) return;

    const account = findRoute(PROFILE_ROUTE);
    const accountButton = account || document.createElement('a');
    const contactGuestStyle = LINK_CLASSES.filter(name => contact.classList.contains(name));
    const accountGuestStyle = LINK_CLASSES.filter(name => accountButton.classList.contains(name));
    let signedIn = false;

    function localizeAccountButton() {
        const language = document.documentElement.lang.slice(0, 2);
        const url = new URL('/profiles', location.origin);
        if (language === 'es' || language === 'pt') url.searchParams.set('lang', language);
        if (contact.pathname.startsWith('/cr/')) url.searchParams.set('region', 'CR');
        accountButton.href = url.href;
        accountButton.textContent = ACCOUNT_LABELS[language] || ACCOUNT_LABELS.en;
    }

    if (!account) {
        document.addEventListener('elysium:languagechange', () => {
            if (signedIn) localizeAccountButton();
        });
    }

    function updateSession(user) {
        const hasSession = Boolean(user);
        if (hasSession === signedIn) return;
        signedIn = hasSession;

        setLinkStyle(accountButton, signedIn ? ['btn', 'btn-primary'] : accountGuestStyle);
        setLinkStyle(contact, signedIn ? ['nav-link'] : contactGuestStyle);

        const focusedLink = document.activeElement;
        if (signedIn) {
            if (!account) localizeAccountButton();
            contact.after(accountButton);
        } else if (account) {
            account.after(contact);
        } else {
            accountButton.remove();
        }

        if (focusedLink === accountButton || focusedLink === contact) {
            (focusedLink.isConnected ? focusedLink : contact).focus({ preventScroll: true });
        }
    }

    import('./firebase-auth.js')
        .then(({ auth, onAuthStateChanged }) => onAuthStateChanged(auth, updateSession))
        .catch(() => {
            // Keep the public navigation available if Firebase fails to load.
        });
}

const nav = document.querySelector('.navbar .nav-links');
if (nav) setupHeaderAccount(nav);
