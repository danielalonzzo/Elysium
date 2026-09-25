/**
 * Elysium λ — Library (elysiumdr.eu/library)
 *
 * Una sola URL para los tres idiomas: el índice y el lector los sirve
 * `worker/library.js` desde una plantilla, y este script pone los textos en
 * inglés británico, español de Costa Rica (de usted) o portugués europeo.
 * El idioma sale, por este orden, de `?lang=`, de la preferencia que guarda el
 * selector del sitio (`elysium_lang_pref`), de la página de la que se viene,
 * en el lector del idioma del propio libro —quien llega desde un buscador a un
 * libro en portugués lo lee todo en portugués— y del navegador. Cambiarlo no
 * recarga: `main.js` se aparta porque el `<html>` declara
 * `data-lang-switch="inline"`.
 *
 * El lector tiene además un modo de pantalla completa: el libro ocupa toda la
 * pantalla, sin cabecera ni pie, y en los navegadores que lo permiten también
 * sin la interfaz del navegador (Fullscreen API). Se sale con la X roja, con
 * Escape o con el gesto de volver del sistema.
 *
 * La publicación de libros vive aparte, en `library-admin.js`, que solo se
 * descarga si se abre «Administración» o si este navegador ya se identificó
 * antes como administrador: quien solo lee no carga Firebase.
 */
(function () {
    'use strict';

    var SUPPORTED = ['en', 'es', 'pt'];
    var HTML_LANG = { en: 'en-GB', es: 'es-CR', pt: 'pt-PT' };
    var ADMIN_HINT_KEY = 'elysium_library_admin';

    var COPY = {
        en: {
            navServices: 'Services',
            navPortfolio: 'Portfolio',
            navResearch: 'Research',
            navAbout: 'About',
            navAccount: 'Account',
            navContact: 'Contact',
            selectLanguage: 'Select language',
            footerAbout: 'About Us',
            footerCompany: 'Company',
            footerConnect: 'Connect',
            footerPrivacy: 'Privacy Policy',
            footerTerms: 'Terms of Service',
            footerLocation: 'Portugal, European Union',
            footerAmericas: 'Also serving the Americas.',
            footerRights: 'All rights reserved.',
            footerLibrary: 'Library',

            libraryName: 'Elysium λ Library',
            indexDocumentTitle: 'Library: read online, full screen or as an audiobook — Elysium λ',
            indexDescription: 'Books and study materials to read online, full screen on any device, or to listen to as audiobooks. Free, to encourage reading and research.',
            indexTitle: 'Library',
            indexKicker: 'Read · Listen',
            indexEyebrow: 'Elysium λ Library',
            shelfTitle: 'On the shelf',
            indexIntro: 'Knowledge that already exists, adapted to the way we read today. Books and study materials to read online on any screen, full screen, or to listen to as audiobooks with ElevenReader. Free, to encourage reading and research.',
            missingBook: 'That book is not in the library. It may have been removed, or its address may have changed.',
            emptyLibrary: 'The library is empty for now.',
            read: 'Read',
            audiobook: 'Audiobook',
            remove: 'Remove',
            removing: 'Removing…',
            removeConfirm: 'Remove “{title}” from the library? Its address will stop working.',
            removeFailed: 'The book could not be removed. Try again in a moment.',
            addedOn: 'Added {date}',
            backToLibrary: 'Library',
            close: 'Close',
            fullscreen: 'Full screen',
            readFullscreen: 'Read full screen',
            fullscreenClose: 'Exit full screen',
            aboutBook: 'About this book',
            factLanguage: 'Language',
            factAdded: 'Added',
            factAccess: 'Access',
            factAccessValue: 'Free · online and audiobook',
            contents: 'Contents',
            moreBooks: 'More in the library',

            audioTitle: 'Listen to this book',
            audioIntro: 'To listen to it as an audiobook, you need an ElevenReader account. It is free and includes 10 hours of listening every month.',
            audioStep1: 'Create your free ElevenReader account.',
            audioStep2: 'Download this book’s HTML file.',
            audioStep3: 'Upload the file to ElevenReader and enjoy listening.',
            openElevenReader: 'Go to ElevenReader',
            downloadHtml: 'Download HTML',

            adminEyebrow: 'Administration',
            adminTitle: 'Publish a book',
            adminChecking: 'Checking your session…',
            adminUnavailable: 'The administration tools could not load. Check your connection and reload the page.',
            adminSignedOut: 'Only the administrator can publish in the library. Sign in with your Elysium account.',
            adminForbidden: 'This account cannot publish in the library.',
            adminNotConfigured: 'The library storage is not connected to this deployment yet.',
            emailLabel: 'Email',
            passwordLabel: 'Password',
            signIn: 'Sign in',
            signingIn: 'Signing in…',
            signOut: 'Sign out',
            signInMissing: 'Enter your email and password.',
            signInFailed: 'The email or password is not correct.',
            signInTooMany: 'Too many attempts. Wait a few minutes and try again.',
            signInNetwork: 'There is no connection with the server. Check your connection and try again.',
            dropTitle: 'Choose an HTML file or drop it here',
            dropHint: 'Only .html files, up to 24 MB, saved as UTF-8.',
            titleLabel: 'Title',
            slugLabel: 'Web address',
            descriptionLabel: 'Description (optional)',
            replaceLabel: 'Replace the book already published at this address',
            publish: 'Publish',
            publishing: 'Publishing… {percent}%',
            processing: 'Checking the file…',
            published: 'Published. It is already live at',
            replaced: 'Updated. The new version is already live at',
            propagation: 'It can take up to a minute to appear everywhere.',
            fileMissing: 'Choose an HTML file first.',
            fileNotHtml: 'Only HTML documents (.html) can be published.',
            fileTooLarge: 'The file is larger than 24 MB.',
            fileEmpty: 'The file is empty.',
            fileNotUtf8: 'The file must be saved as UTF-8.',
            titleMissing: 'Give the book a title.',
            slugInvalid: 'The web address may only use lowercase letters, numbers and hyphens.',
            slugTaken: 'A book already uses that address. Tick the box to replace it, or choose another address.',
            sessionExpired: 'Your session has expired. Sign in again.',
            uploadFailed: 'The book could not be published. Try again in a moment.',
            networkError: 'There is no connection with the server. Check your connection and try again.'
        },
        es: {
            navServices: 'Servicios',
            navPortfolio: 'Portafolio',
            navResearch: 'Investigación',
            navAbout: 'Nosotros',
            navAccount: 'Cuenta',
            navContact: 'Contacto',
            selectLanguage: 'Seleccionar idioma',
            footerAbout: 'Nosotros',
            footerCompany: 'Empresa',
            footerConnect: 'Conectar',
            footerPrivacy: 'Política de privacidad',
            footerTerms: 'Términos de servicio',
            footerLocation: 'Portugal, Unión Europea',
            footerAmericas: 'También en todas las Américas.',
            footerRights: 'Todos los derechos reservados.',
            footerLibrary: 'Biblioteca',

            libraryName: 'Biblioteca Elysium λ',
            indexDocumentTitle: 'Biblioteca: leer en línea, a pantalla completa o como audiolibro — Elysium λ',
            indexDescription: 'Libros y materiales de estudio para leer en línea, a pantalla completa en cualquier dispositivo, o escuchar como audiolibros. Gratis, para fomentar la lectura y la investigación.',
            indexTitle: 'Biblioteca',
            indexKicker: 'Leer · Escuchar',
            indexEyebrow: 'Biblioteca Elysium λ',
            shelfTitle: 'En la estantería',
            indexIntro: 'Conocimiento que ya existe, adaptado a la forma en que leemos hoy. Libros y materiales de estudio para leer en línea en cualquier pantalla, a pantalla completa, o escuchar como audiolibros con ElevenReader. Gratis, para fomentar la lectura y la investigación.',
            missingBook: 'Ese libro no está en la biblioteca. Puede que se haya retirado o que su dirección haya cambiado.',
            emptyLibrary: 'Por ahora la biblioteca está vacía.',
            read: 'Leer',
            audiobook: 'Audiolibro',
            remove: 'Retirar',
            removing: 'Retirando…',
            removeConfirm: '¿Retirar «{title}» de la biblioteca? Su dirección dejará de funcionar.',
            removeFailed: 'No se pudo retirar el libro. Inténtelo de nuevo en un momento.',
            addedOn: 'Añadido el {date}',
            backToLibrary: 'Biblioteca',
            close: 'Cerrar',
            fullscreen: 'Pantalla completa',
            readFullscreen: 'Leer a pantalla completa',
            fullscreenClose: 'Salir de la pantalla completa',
            aboutBook: 'Sobre este libro',
            factLanguage: 'Idioma',
            factAdded: 'Añadido',
            factAccess: 'Acceso',
            factAccessValue: 'Gratis · en línea y en audiolibro',
            contents: 'Índice',
            moreBooks: 'Más en la biblioteca',

            audioTitle: 'Escuche este libro',
            audioIntro: 'Para escucharlo como audiolibro, debe crearse una cuenta en ElevenReader. Es gratuita e incluye 10 horas de escucha al mes.',
            audioStep1: 'Cree su cuenta gratuita en ElevenReader.',
            audioStep2: 'Descargue el archivo HTML de este libro.',
            audioStep3: 'Súbalo a ElevenReader y disfrute de la escucha.',
            openElevenReader: 'Ir a ElevenReader',
            downloadHtml: 'Descargar HTML',

            adminEyebrow: 'Administración',
            adminTitle: 'Publicar un libro',
            adminChecking: 'Comprobando su sesión…',
            adminUnavailable: 'No se pudieron cargar las herramientas de administración. Revise su conexión y recargue la página.',
            adminSignedOut: 'Solo el administrador puede publicar en la biblioteca. Inicie sesión con su cuenta de Elysium.',
            adminForbidden: 'Esta cuenta no puede publicar en la biblioteca.',
            adminNotConfigured: 'El almacenamiento de la biblioteca todavía no está conectado a este despliegue.',
            emailLabel: 'Correo electrónico',
            passwordLabel: 'Contraseña',
            signIn: 'Iniciar sesión',
            signingIn: 'Iniciando sesión…',
            signOut: 'Cerrar sesión',
            signInMissing: 'Escriba su correo y su contraseña.',
            signInFailed: 'El correo o la contraseña no son correctos.',
            signInTooMany: 'Demasiados intentos. Espere unos minutos e inténtelo de nuevo.',
            signInNetwork: 'No hay conexión con el servidor. Revise su conexión e inténtelo de nuevo.',
            dropTitle: 'Elija un archivo HTML o suéltelo aquí',
            dropHint: 'Solo archivos .html, de hasta 24 MB, guardados en UTF-8.',
            titleLabel: 'Título',
            slugLabel: 'Dirección web',
            descriptionLabel: 'Descripción (opcional)',
            replaceLabel: 'Reemplazar el libro ya publicado en esta dirección',
            publish: 'Publicar',
            publishing: 'Publicando… {percent} %',
            processing: 'Revisando el archivo…',
            published: 'Publicado. Ya está en línea en',
            replaced: 'Actualizado. La nueva versión ya está en línea en',
            propagation: 'Puede tardar hasta un minuto en verse en todas partes.',
            fileMissing: 'Primero elija un archivo HTML.',
            fileNotHtml: 'Solo se pueden publicar documentos HTML (.html).',
            fileTooLarge: 'El archivo pesa más de 24 MB.',
            fileEmpty: 'El archivo está vacío.',
            fileNotUtf8: 'El archivo debe estar guardado en UTF-8.',
            titleMissing: 'Póngale un título al libro.',
            slugInvalid: 'La dirección web solo puede llevar minúsculas, números y guiones.',
            slugTaken: 'Ya hay un libro en esa dirección. Marque la casilla para reemplazarlo o elija otra dirección.',
            sessionExpired: 'Su sesión expiró. Inicie sesión de nuevo.',
            uploadFailed: 'No se pudo publicar el libro. Inténtelo de nuevo en un momento.',
            networkError: 'No hay conexión con el servidor. Revise su conexión e inténtelo de nuevo.'
        },
        pt: {
            navServices: 'Serviços',
            navPortfolio: 'Portefólio',
            navResearch: 'Investigação',
            navAbout: 'Sobre nós',
            navAccount: 'Conta',
            navContact: 'Contacto',
            selectLanguage: 'Selecionar idioma',
            footerAbout: 'Sobre nós',
            footerCompany: 'Empresa',
            footerConnect: 'Ligação',
            footerPrivacy: 'Política de privacidade',
            footerTerms: 'Termos de serviço',
            footerLocation: 'Portugal, União Europeia',
            footerAmericas: 'Também em todas as Américas.',
            footerRights: 'Todos os direitos reservados.',
            footerLibrary: 'Biblioteca',

            libraryName: 'Biblioteca Elysium λ',
            indexDocumentTitle: 'Biblioteca: ler online, em ecrã inteiro ou como audiolivro — Elysium λ',
            indexDescription: 'Livros e materiais de estudo para ler online, em ecrã inteiro em qualquer dispositivo, ou ouvir como audiolivros. Gratuitos, para promover a leitura e a investigação.',
            indexTitle: 'Biblioteca',
            indexKicker: 'Ler · Ouvir',
            indexEyebrow: 'Biblioteca Elysium λ',
            shelfTitle: 'Na estante',
            indexIntro: 'Conhecimento que já existe, adaptado à forma como lemos hoje. Livros e materiais de estudo para ler online em qualquer ecrã, em ecrã inteiro, ou ouvir como audiolivros com o ElevenReader. Gratuitos, para promover a leitura e a investigação.',
            missingBook: 'Esse livro não está na biblioteca. Pode ter sido retirado ou o endereço pode ter mudado.',
            emptyLibrary: 'Por agora, a biblioteca está vazia.',
            read: 'Ler',
            audiobook: 'Audiolivro',
            remove: 'Retirar',
            removing: 'A retirar…',
            removeConfirm: 'Retirar «{title}» da biblioteca? O endereço deixará de funcionar.',
            removeFailed: 'Não foi possível retirar o livro. Tente novamente dentro de momentos.',
            addedOn: 'Adicionado a {date}',
            backToLibrary: 'Biblioteca',
            close: 'Fechar',
            fullscreen: 'Ecrã inteiro',
            readFullscreen: 'Ler em ecrã inteiro',
            fullscreenClose: 'Sair do ecrã inteiro',
            aboutBook: 'Sobre este livro',
            factLanguage: 'Idioma',
            factAdded: 'Adicionado',
            factAccess: 'Acesso',
            factAccessValue: 'Gratuito · online e em audiolivro',
            contents: 'Índice',
            moreBooks: 'Mais na biblioteca',

            audioTitle: 'Ouça este livro',
            audioIntro: 'Para o ouvir como audiolivro, precisa de criar uma conta no ElevenReader. É gratuita e inclui 10 horas de audição por mês.',
            audioStep1: 'Crie a sua conta gratuita no ElevenReader.',
            audioStep2: 'Descarregue o ficheiro HTML deste livro.',
            audioStep3: 'Carregue-o no ElevenReader e desfrute da audição.',
            openElevenReader: 'Ir para o ElevenReader',
            downloadHtml: 'Descarregar HTML',

            adminEyebrow: 'Administração',
            adminTitle: 'Publicar um livro',
            adminChecking: 'A verificar a sua sessão…',
            adminUnavailable: 'Não foi possível carregar as ferramentas de administração. Verifique a sua ligação e recarregue a página.',
            adminSignedOut: 'Só o administrador pode publicar na biblioteca. Inicie sessão com a sua conta Elysium.',
            adminForbidden: 'Esta conta não pode publicar na biblioteca.',
            adminNotConfigured: 'O armazenamento da biblioteca ainda não está ligado a esta implementação.',
            emailLabel: 'E-mail',
            passwordLabel: 'Palavra-passe',
            signIn: 'Iniciar sessão',
            signingIn: 'A iniciar sessão…',
            signOut: 'Terminar sessão',
            signInMissing: 'Introduza o seu e-mail e a palavra-passe.',
            signInFailed: 'O e-mail ou a palavra-passe não estão corretos.',
            signInTooMany: 'Demasiadas tentativas. Aguarde alguns minutos e tente novamente.',
            signInNetwork: 'Não há ligação ao servidor. Verifique a sua ligação e tente novamente.',
            dropTitle: 'Escolha um ficheiro HTML ou largue-o aqui',
            dropHint: 'Apenas ficheiros .html, até 24 MB, guardados em UTF-8.',
            titleLabel: 'Título',
            slugLabel: 'Endereço web',
            descriptionLabel: 'Descrição (opcional)',
            replaceLabel: 'Substituir o livro já publicado neste endereço',
            publish: 'Publicar',
            publishing: 'A publicar… {percent} %',
            processing: 'A verificar o ficheiro…',
            published: 'Publicado. Já está disponível em',
            replaced: 'Atualizado. A nova versão já está disponível em',
            propagation: 'Pode demorar até um minuto a aparecer em todo o lado.',
            fileMissing: 'Escolha primeiro um ficheiro HTML.',
            fileNotHtml: 'Só é possível publicar documentos HTML (.html).',
            fileTooLarge: 'O ficheiro tem mais de 24 MB.',
            fileEmpty: 'O ficheiro está vazio.',
            fileNotUtf8: 'O ficheiro tem de estar guardado em UTF-8.',
            titleMissing: 'Dê um título ao livro.',
            slugInvalid: 'O endereço web só pode ter letras minúsculas, números e hífenes.',
            slugTaken: 'Já existe um livro nesse endereço. Assinale a caixa para o substituir ou escolha outro endereço.',
            sessionExpired: 'A sua sessão expirou. Inicie sessão novamente.',
            uploadFailed: 'Não foi possível publicar o livro. Tente novamente dentro de momentos.',
            networkError: 'Não há ligação ao servidor. Verifique a sua ligação e tente novamente.'
        }
    };

    // ── Datos de la página ───────────────────────────────────────────────────

    var page = document.body.getAttribute('data-library-page');

    function readJson(id) {
        var node = document.getElementById(id);
        if (!node) return null;
        try { return JSON.parse(node.textContent); } catch (error) { return null; }
    }

    var catalog = page === 'index' ? (readJson('library-data') || {}) : {};
    var books = Array.isArray(catalog.books) ? catalog.books : [];
    var book = page === 'reader' ? readJson('library-book') : null;
    var isAdmin = false;
    var adminApi = null;

    // ── Idioma ───────────────────────────────────────────────────────────────

    function storageGet(key) {
        try { return window.localStorage.getItem(key); } catch (error) { return null; }
    }

    function storageSet(key, value) {
        try { window.localStorage.setItem(key, value); } catch (error) { /* modo privado */ }
    }

    function initialLanguage() {
        var requested = new URLSearchParams(window.location.search).get('lang');
        if (SUPPORTED.indexOf(requested) !== -1) return requested;

        var saved = storageGet('elysium_lang_pref');
        if (SUPPORTED.indexOf(saved) !== -1) return saved;

        // Quien llega desde /es/… o /pt/… del propio sitio, o desde los
        // dominios nacionales (que solo mandan el origen), sigue en su idioma.
        try {
            var referrer = new URL(document.referrer);
            if (referrer.origin === window.location.origin) {
                var match = /^\/(es|pt)(?:\/|$)/.exec(referrer.pathname);
                if (match) return match[1];
            }
            var national = /(?:^|\.)elysiumdr\.(es|pt)$/.exec(referrer.hostname);
            if (national) return national[1];
        } catch (error) { /* sin referrer */ }

        if (book && book.lang) {
            var bookLanguage = String(book.lang).slice(0, 2).toLowerCase();
            if (SUPPORTED.indexOf(bookLanguage) !== -1) return bookLanguage;
        }

        var preferred = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
        for (var i = 0; i < preferred.length; i += 1) {
            var code = String(preferred[i] || '').slice(0, 2).toLowerCase();
            if (SUPPORTED.indexOf(code) !== -1) return code;
        }
        return 'en';
    }

    var language = initialLanguage();
    var listeners = [];

    function t(key, values) {
        var text = (COPY[language] && COPY[language][key]) || COPY.en[key] || key;
        if (values) {
            Object.keys(values).forEach(function (name) {
                text = text.split('{' + name + '}').join(values[name]);
            });
        }
        return text;
    }

    function localizedPath(page) {
        if (page === 'profiles') return language === 'en' ? '/profiles' : '/profiles?lang=' + language;
        var prefix = language === 'en' ? '' : '/' + language;
        return page ? prefix + '/' + page : prefix + '/';
    }

    function applyCopy() {
        document.documentElement.lang = HTML_LANG[language];
        document.querySelectorAll('[data-i18n]').forEach(function (element) {
            element.textContent = t(element.getAttribute('data-i18n'));
        });
        document.querySelectorAll('[data-i18n-aria]').forEach(function (element) {
            element.setAttribute('aria-label', t(element.getAttribute('data-i18n-aria')));
        });
        document.querySelectorAll('[data-library-nav]').forEach(function (link) {
            link.setAttribute('href', localizedPath(link.getAttribute('data-library-nav')));
        });
        document.querySelectorAll('.lang-switcher-menu [data-lang]').forEach(function (option) {
            var code = option.getAttribute('data-lang');
            option.setAttribute('href', '?lang=' + code);
            if (code === language) option.setAttribute('aria-current', 'true');
            else option.removeAttribute('aria-current');
        });
        // Lo que el servidor escribió en inglés: el nombre del idioma y la fecha.
        document.querySelectorAll('[data-library-language]').forEach(function (node) {
            var name = languageName(node.getAttribute('data-library-language'));
            if (name) node.textContent = name;
        });
        document.querySelectorAll('time[data-library-date]').forEach(function (node) {
            var date = formatDate(node.getAttribute('datetime'));
            if (date) node.textContent = date;
        });
        if (page === 'index') {
            document.title = t('indexDocumentTitle');
            var description = document.querySelector('meta[name="description"]');
            if (description) description.setAttribute('content', t('indexDescription'));
        } else if (book) {
            document.title = book.title + ' — ' + t('libraryName');
        }
    }

    function setLanguage(next) {
        if (SUPPORTED.indexOf(next) === -1 || next === language) return;
        language = next;
        storageSet('elysium_lang_pref', next);
        storageSet('langOverride', 'true');

        var url = new URL(window.location.href);
        if (next === 'en') url.searchParams.delete('lang');
        else url.searchParams.set('lang', next);
        window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);

        applyCopy();
        if (page === 'index') renderBooks();
        // `main.js` vuelve a pintar la etiqueta y la bandera de los selectores.
        document.dispatchEvent(new CustomEvent('elysium:languagechange', { detail: { language: next } }));
        listeners.forEach(function (listener) { listener(next); });
    }

    document.querySelectorAll('.lang-switcher-menu [data-lang]').forEach(function (option) {
        option.addEventListener('click', function (event) {
            event.preventDefault();
            setLanguage(option.getAttribute('data-lang'));
        });
    });

    // ── Formato ──────────────────────────────────────────────────────────────

    function formatSize(bytes) {
        if (!bytes) return '';
        var megabytes = bytes / (1024 * 1024);
        var value = megabytes >= 1 ? megabytes : bytes / 1024;
        var unit = megabytes >= 1 ? 'MB' : 'KB';
        try {
            return new Intl.NumberFormat(HTML_LANG[language], { maximumFractionDigits: 1 }).format(value) + ' ' + unit;
        } catch (error) {
            return value.toFixed(1) + ' ' + unit;
        }
    }

    function formatDate(iso) {
        if (!iso) return '';
        var date = new Date(iso);
        if (isNaN(date.getTime())) return '';
        try {
            return new Intl.DateTimeFormat(HTML_LANG[language], { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
        } catch (error) {
            return date.toISOString().slice(0, 10);
        }
    }

    function languageName(tag) {
        if (!tag) return '';
        var base = tag.split('-')[0].toLowerCase();
        try {
            var name = new Intl.DisplayNames([HTML_LANG[language]], { type: 'language' }).of(base);
            if (name && name.toLowerCase() !== base) return name;
        } catch (error) { /* navegador antiguo */ }
        return base.toUpperCase();
    }

    // ── Catálogo ─────────────────────────────────────────────────────────────

    function element(tag, className, text) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function bookUrl(slug) {
        var url = '/library/' + encodeURIComponent(slug);
        return language === 'en' ? url : url + '?lang=' + language;
    }

    function renderBooks() {
        var grid = document.querySelector('[data-library-grid]');
        var empty = document.querySelector('[data-library-empty]');
        if (!grid) return;
        grid.replaceChildren();

        books.forEach(function (entry) {
            var card = element('article', 'library-card');
            card.setAttribute('data-book', entry.slug);

            var top = element('div', 'library-card-top');
            var chip = element('span', 'library-chip', languageName(entry.lang) || 'HTML');
            if (entry.lang) chip.setAttribute('lang', HTML_LANG[language]);
            top.append(chip, element('span', 'library-card-size', formatSize(entry.size)));

            var body = element('div', 'library-card-body');
            var heading = element('h3');
            var titleLink = element('a', '', entry.title);
            titleLink.href = bookUrl(entry.slug);
            if (entry.lang) heading.setAttribute('lang', entry.lang);
            heading.append(titleLink);
            body.append(heading);

            if (entry.description) {
                var description = element('p', 'library-card-description', entry.description);
                if (entry.lang) description.setAttribute('lang', entry.lang);
                body.append(description);
            }
            var date = formatDate(entry.uploadedAt);
            body.append(element('p', 'library-card-date', date ? t('addedOn', { date: date }) : ''));

            var actions = element('div', 'library-card-actions');
            var read = element('a', 'btn btn-primary', t('read'));
            read.href = bookUrl(entry.slug);
            var listen = element('button', 'btn library-audio-button');
            listen.type = 'button';
            listen.setAttribute('data-audiobook', entry.slug);
            listen.append(headphonesIcon(), element('span', '', t('audiobook')));
            actions.append(read, listen);
            body.append(actions);

            if (isAdmin && adminApi) {
                var remove = element('button', 'library-delete', t('remove'));
                remove.type = 'button';
                remove.addEventListener('click', function () { removeBook(entry, remove); });
                body.append(remove);
            }

            card.append(top, body);
            grid.append(card);
        });

        if (empty) empty.hidden = books.length > 0;
    }

    function headphonesIcon() {
        var ns = 'http://www.w3.org/2000/svg';
        var svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('width', '18');
        svg.setAttribute('height', '18');
        svg.setAttribute('aria-hidden', 'true');
        var arc = document.createElementNS(ns, 'path');
        arc.setAttribute('d', 'M4 14v-2a8 8 0 0 1 16 0v2');
        arc.setAttribute('fill', 'none');
        arc.setAttribute('stroke', 'currentColor');
        arc.setAttribute('stroke-width', '1.8');
        arc.setAttribute('stroke-linecap', 'round');
        svg.append(arc);
        [3, 16.5].forEach(function (x) {
            var cup = document.createElementNS(ns, 'rect');
            cup.setAttribute('x', String(x));
            cup.setAttribute('y', '13');
            cup.setAttribute('width', '4.5');
            cup.setAttribute('height', '7');
            cup.setAttribute('rx', '1.6');
            cup.setAttribute('fill', 'currentColor');
            svg.append(cup);
        });
        return svg;
    }

    function removeBook(entry, button) {
        if (!adminApi) return;
        if (!window.confirm(t('removeConfirm', { title: entry.title }))) return;
        button.disabled = true;
        button.textContent = t('removing');
        adminApi.remove(entry.slug).then(function () {
            books = books.filter(function (item) { return item.slug !== entry.slug; });
            renderBooks();
        }).catch(function (error) {
            button.disabled = false;
            button.textContent = t('remove');
            window.alert(error && error.userMessage ? error.userMessage : t('removeFailed'));
        });
    }

    // ── Audiolibro ───────────────────────────────────────────────────────────

    var dialog = document.querySelector('[data-audiobook-dialog]');

    function findBook(slug) {
        if (book && book.slug === slug) return book;
        for (var i = 0; i < books.length; i += 1) if (books[i].slug === slug) return books[i];
        return null;
    }

    function openAudiobook(slug, trigger) {
        var entry = findBook(slug);
        if (!dialog || !entry) return;
        var name = dialog.querySelector('[data-audiobook-book]');
        if (name) {
            name.textContent = entry.title;
            if (entry.lang) name.setAttribute('lang', entry.lang);
        }
        var download = dialog.querySelector('[data-audiobook-download]');
        if (download) download.setAttribute('href', '/library/' + encodeURIComponent(entry.slug) + '/download');
        dialog.returnFocusTo = trigger || null;
        if (typeof dialog.showModal === 'function') dialog.showModal();
        else dialog.setAttribute('open', '');
    }

    if (dialog) {
        document.addEventListener('click', function (event) {
            var trigger = event.target.closest && event.target.closest('[data-audiobook]');
            if (trigger) openAudiobook(trigger.getAttribute('data-audiobook'), trigger);
        });
        // Un clic fuera de la tarjeta (en el fondo) cierra, como en el resto
        // de ventanas del sitio.
        dialog.addEventListener('click', function (event) {
            if (event.target === dialog) dialog.close();
        });
        dialog.addEventListener('close', function () {
            if (dialog.returnFocusTo && typeof dialog.returnFocusTo.focus === 'function') {
                dialog.returnFocusTo.focus();
            }
        });
    }

    // ── Lector ───────────────────────────────────────────────────────────────

    if (page === 'reader') {
        var frame = document.querySelector('.library-frame');
        if (frame) {
            // Un enlace compartido con #capítulo abre el libro en ese punto.
            if (window.location.hash) frame.src = frame.getAttribute('src') + window.location.hash;
            frame.addEventListener('mouseenter', function () {
                document.documentElement.classList.add('library-cursor-off');
            });
            frame.addEventListener('mouseleave', function () {
                document.documentElement.classList.remove('library-cursor-off');
            });
        }
        var back = document.querySelector('.library-back');
        if (back) {
            listeners.push(function () {
                back.setAttribute('href', language === 'en' ? '/library' : '/library?lang=' + language);
            });
        }

        // El índice de capítulos navega el iframe por su nombre (funciona sin
        // JavaScript); aquí solo se sube hasta el lector para verlo.
        document.querySelectorAll('[data-library-toc]').forEach(function (link) {
            link.addEventListener('click', function (event) {
                if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
            });
        });

        setupImmersive(frame);
    }

    function reducedMotion() {
        return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    // ── Pantalla completa ────────────────────────────────────────────────────

    /**
     * Dos capas: la clase `library-immersive` esconde la cabecera, la barra y
     * el pie y deja el libro a toda la pantalla (funciona en todas partes), y
     * la Fullscreen API esconde además la interfaz del navegador donde se
     * puede (escritorio, Android, iPad; en el iPhone solo lo consigue la app
     * instalada). Salir de cualquiera de las dos cierra las dos.
     *
     * La X se esconde mientras se lee y vuelve al acercar el puntero al borde
     * de arriba o al desplazarse hacia arriba, como en macOS. Lo que pasa
     * dentro del iframe lo cuenta el propio libro (`BOOK_HELPER`, en
     * `worker/library.js`) con `postMessage`.
     */
    function setupImmersive(frame) {
        var root = document.documentElement;
        var close = document.querySelector('[data-immersive-close]');
        var openers = document.querySelectorAll('[data-immersive-open]');
        if (!frame || !close || !openers.length) return;

        var active = false;
        var native = false;
        var hideTimer = 0;
        var returnFocus = null;

        function fullscreenElement() {
            return document.fullscreenElement || document.webkitFullscreenElement || null;
        }

        function quietly(result) {
            if (result && typeof result.catch === 'function') result.catch(function () { /* se queda en el modo de la página */ });
        }

        function showClose(duration) {
            window.clearTimeout(hideTimer);
            close.classList.add('is-visible');
            if (duration) hideTimer = window.setTimeout(hideClose, duration);
        }

        function hideClose() {
            window.clearTimeout(hideTimer);
            if (close.matches(':hover') || close.matches(':focus-visible')) return;
            close.classList.remove('is-visible');
        }

        function hideSoon(delay) {
            window.clearTimeout(hideTimer);
            hideTimer = window.setTimeout(hideClose, delay);
        }

        function enter(trigger) {
            if (active) return;
            active = true;
            returnFocus = trigger || null;
            root.classList.add('library-immersive');
            var request = root.requestFullscreen || root.webkitRequestFullscreen;
            if (request) {
                try { quietly(request.call(root, { navigationUI: 'hide' })); } catch (error) { /* sin permiso */ }
            }
            showClose(3200);
            try { frame.focus({ preventScroll: true }); } catch (error) { frame.focus(); }
        }

        function exit() {
            if (!active) return;
            active = false;
            window.clearTimeout(hideTimer);
            close.classList.remove('is-visible');
            root.classList.remove('library-immersive');
            if (fullscreenElement()) {
                var leave = document.exitFullscreen || document.webkitExitFullscreen;
                if (leave) {
                    try { quietly(leave.call(document)); } catch (error) { /* ya no estaba */ }
                }
            }
            if (returnFocus && typeof returnFocus.focus === 'function') {
                try { returnFocus.focus({ preventScroll: true }); } catch (error) { returnFocus.focus(); }
            }
        }

        openers.forEach(function (button) {
            button.addEventListener('click', function () { enter(button); });
        });
        close.addEventListener('click', exit);
        close.addEventListener('mouseleave', function () { if (active) hideSoon(1200); });
        close.addEventListener('blur', function () { if (active) hideSoon(1200); });

        function onFullscreenChange() {
            if (fullscreenElement()) {
                native = true;
            } else if (native) {
                // Escape, el botón de volver de Android o el menú del
                // navegador sacaron la página de la pantalla completa.
                native = false;
                exit();
            }
        }
        document.addEventListener('fullscreenchange', onFullscreenChange);
        document.addEventListener('webkitfullscreenchange', onFullscreenChange);

        document.addEventListener('keydown', function (event) {
            if (active && event.key === 'Escape' && !fullscreenElement()) exit();
        });

        window.addEventListener('message', function (event) {
            if (!active || event.source !== frame.contentWindow) return;
            var data = event.data;
            if (!data || typeof data.elysiumLibrary !== 'string') return;
            if (data.elysiumLibrary === 'pointer') {
                if (data.value === true) showClose();
                else hideSoon(1200);
            } else if (data.elysiumLibrary === 'scroll') {
                if (data.value === 'up') showClose(2600);
                else hideClose();
            } else if (data.elysiumLibrary === 'escape' && !fullscreenElement()) {
                exit();
            }
        });
    }

    // ── Administración (carga diferida) ──────────────────────────────────────

    var adminPanel = document.querySelector('[data-library-admin]');
    var adminLoading = null;

    function loadAdmin() {
        if (adminLoading) return adminLoading;
        adminLoading = import('/JS/library-admin.js?v=20260924').then(function (module) {
            return module.initLibraryAdmin(api);
        }).catch(function (error) {
            console.warn('[library] administration unavailable:', error);
            document.querySelectorAll('[data-admin-state]').forEach(function (node) {
                node.hidden = node.getAttribute('data-admin-state') !== 'unavailable';
            });
        });
        return adminLoading;
    }

    if (page === 'index' && adminPanel) {
        adminPanel.addEventListener('toggle', function () {
            if (adminPanel.open) loadAdmin();
        });
        if (storageGet(ADMIN_HINT_KEY) === '1') {
            if ('requestIdleCallback' in window) window.requestIdleCallback(loadAdmin, { timeout: 2000 });
            else window.setTimeout(loadAdmin, 300);
        }
    }

    // ── API compartida con library-admin.js ─────────────────────────────────

    var api = {
        t: t,
        language: function () { return language; },
        onLanguageChange: function (listener) { listeners.push(listener); },
        configured: catalog.configured !== false,
        books: function () { return books.slice(); },
        upsertBook: function (entry) {
            books = [entry].concat(books.filter(function (item) { return item.slug !== entry.slug; }));
            renderBooks();
        },
        setAdmin: function (value, providedApi) {
            isAdmin = Boolean(value);
            adminApi = isAdmin ? providedApi : null;
            if (isAdmin) {
                storageSet(ADMIN_HINT_KEY, '1');
                if (adminPanel) adminPanel.open = true;
            } else {
                try { window.localStorage.removeItem(ADMIN_HINT_KEY); } catch (error) { /* modo privado */ }
            }
            renderBooks();
        },
        bookUrl: bookUrl
    };

    // ── Arranque ─────────────────────────────────────────────────────────────

    applyCopy();
    if (page === 'reader') listeners.forEach(function (listener) { listener(language); });
    if (page === 'index') {
        renderBooks();
        var missing = document.querySelector('[data-library-missing]');
        if (missing && catalog.missing) missing.hidden = false;
    }
})();
