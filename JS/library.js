/**
 * Elysium λ — Library (/library, en los cuatro dominios)
 *
 * Una sola URL para los tres idiomas: el índice y el lector los sirve
 * `worker/library.js` desde una plantilla, y este script pone los textos en
 * inglés británico, español (de España en `.eu` y `.es`, de Costa Rica en
 * `.com`) o portugués europeo.
 *
 * La biblioteca respeta la región en la que se está, igual que el resto del
 * sitio: se abre en el idioma de SU región, no en el del navegador ni en el del
 * libro. El orden es `?lang=`; en `.es` y `.pt`, la elección guardada por la
 * traducción del sitio (`elysium_lang_pref`) y, si no hay, el idioma del
 * dominio; en `.eu` y `.com`, que son físicos, el de la carpeta (`/es/`, `/pt/`)
 * o el `?lang=` de la página de la que se viene, y si no, inglés. Cambiarlo no
 * recarga: `main.js` se aparta porque el `<html>` declara
 * `data-lang-switch="inline"`.
 *
 * El lector tiene además un modo de pantalla completa: el libro ocupa toda la
 * pantalla, sin cabecera ni pie, y en los navegadores que lo permiten también
 * sin la interfaz del navegador (Fullscreen API). Se sale con el botón que
 * el propio libro enseña junto a su botón de tema, o con Escape.
 *
 * La publicación de libros vive aparte, en `library-admin.js`, que solo se
 * descarga si se abre «Administración» o si este navegador ya se identificó
 * antes como administrador: quien solo lee no carga Firebase.
 */
(function () {
    'use strict';

    var SUPPORTED = ['en', 'es', 'pt'];
    var ADMIN_HINT_KEY = 'elysium_library_admin';

    // La región es la del dominio. `.es` y `.pt` traducen en vivo (sin carpetas
    // de idioma en la URL); `.eu` y `.com` son físicos (`/`, `/es/`, `/pt/`).
    var HOSTNAME = window.location.hostname.toLowerCase();
    var NATIONAL = /(?:^|\.)elysiumdr\.(es|pt)$/.exec(HOSTNAME);
    var NATIVE_LANGUAGE = NATIONAL ? NATIONAL[1] : null;
    var IS_GLOBAL = /(?:^|\.)elysiumdr\.com$/.test(HOSTNAME);
    // Solo `.eu` publica y administra: la sesión de administrador y los
    // dominios autorizados de Firebase son suyos.
    var CAN_ADMINISTER = !NATIONAL && !IS_GLOBAL;
    var HTML_LANG = { en: 'en-GB', es: IS_GLOBAL ? 'es-CR' : 'es-ES', pt: 'pt-PT' };

    var COPY = {
        en: {
            navServices: 'Services',
            navPortfolio: 'Portfolio',
            navResearch: 'Research',
            navLibrary: 'Library',
            navPatrimonio: 'Wealth Manager',
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
            footerPatrimonio: 'Wealth Manager',

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
            bookLanguage: 'Language of the book',
            originalLanguage: 'Original',
            readFullscreen: 'Read full screen',
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
            dropHint: 'Only .html files, up to 100 MB, saved as UTF-8.',
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
            fileTooLarge: 'The file is larger than 100 MB.',
            fileEmpty: 'The file is empty.',
            fileNotUtf8: 'The file must be saved as UTF-8.',
            titleMissing: 'Give the book a title.',
            slugInvalid: 'The web address may only use lowercase letters, numbers and hyphens.',
            slugTaken: 'A book already uses that address. Tick the box to replace it, or choose another address.',
            sessionExpired: 'Your session has expired. Sign in again.',
            uploadFailed: 'The book could not be published. Try again in a moment.',
            networkError: 'There is no connection with the server. Check your connection and try again.',

            proposalEyebrow: 'Digitisation & Transcription',
            proposalTitle: 'Propose a book or document',
            proposalIntro: 'Have a printed book, PDF, scan, or study document you would like to see in the library? Send your proposal with the file or details so our team can review and transcribe it.',
            proposalNameLabel: 'Full name',
            proposalNamePlaceholder: 'Name and surname',
            proposalEmailLabel: 'Email address',
            proposalEmailPlaceholder: 'name@example.com',
            proposalFileLabel: 'File (image, PDF, Word, TXT, etc.)',
            proposalDropTitle: 'Choose a file or drop it here',
            proposalDropHint: 'PDF, Word, images, TXT or scans up to 24 MB',
            proposalMessageLabel: 'Proposal details and notes',
            proposalMessagePlaceholder: 'Title of the book, author, edition, transcription instructions, or notes about the document…',
            proposalSubmit: 'Submit proposal',
            proposalSending: 'Sending proposal…',
            proposalSuccess: 'Thank you! Your proposal has been received. Our team will review the document and contact you if needed.',
            proposalError: 'The proposal could not be sent. Check your connection and try again.',
            proposalFileTooLarge: 'The file exceeds the 24 MB limit.',
            adminAccessLink: 'Administrator access',
            removeSelectedFile: 'Remove file'
        },
        es: {
            navServices: 'Servicios',
            navPortfolio: 'Portafolio',
            navResearch: 'Investigación',
            navLibrary: 'Biblioteca',
            navPatrimonio: 'Gestor de Patrimonio',
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
            footerPatrimonio: 'Gestor de Patrimonio',

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
            bookLanguage: 'Idioma del libro',
            originalLanguage: 'Original',
            readFullscreen: 'Leer a pantalla completa',
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
            dropHint: 'Solo archivos .html, de hasta 100 MB, guardados en UTF-8.',
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
            fileTooLarge: 'El archivo pesa más de 100 MB.',
            fileEmpty: 'El archivo está vacío.',
            fileNotUtf8: 'El archivo debe estar guardado en UTF-8.',
            titleMissing: 'Póngale un título al libro.',
            slugInvalid: 'La dirección web solo puede llevar minúsculas, números y guiones.',
            slugTaken: 'Ya hay un libro en esa dirección. Marque la casilla para reemplazarlo o elija otra dirección.',
            sessionExpired: 'Su sesión expiró. Inicie sesión de nuevo.',
            uploadFailed: 'No se pudo publicar el libro. Inténtelo de nuevo en un momento.',
            networkError: 'No hay conexión con el servidor. Revise su conexión e inténtelo de nuevo.',

            proposalEyebrow: 'Digitalización y transcripción',
            proposalTitle: 'Proponga un libro o documento',
            proposalIntro: '¿Tiene un libro impreso, PDF, escaneo o material de estudio que desearía ver en la biblioteca? Envíe su propuesta con el archivo o los detalles para su valoración y transcripción por nuestro equipo.',
            proposalNameLabel: 'Nombre completo',
            proposalNamePlaceholder: 'Nombre y apellidos',
            proposalEmailLabel: 'Correo electrónico',
            proposalEmailPlaceholder: 'nombre@ejemplo.com',
            proposalFileLabel: 'Archivo (imagen, PDF, Word, TXT, etc.)',
            proposalDropTitle: 'Seleccione un archivo o arrástrelo aquí',
            proposalDropHint: 'PDF, Word, imágenes, TXT o escaneos de hasta 24 MB',
            proposalMessageLabel: 'Detalles de la propuesta y notas',
            proposalMessagePlaceholder: 'Título de la obra, autor, edición, instrucciones de transcripción o notas sobre el documento…',
            proposalSubmit: 'Enviar propuesta',
            proposalSending: 'Enviando propuesta…',
            proposalSuccess: '¡Muchas gracias! Su propuesta ha sido recibida. Nuestro equipo valorará el documento y le contactará de ser necesario.',
            proposalError: 'No se pudo enviar la propuesta. Compruebe su conexión y vuelva a probar.',
            proposalFileTooLarge: 'El archivo supera el límite de 24 MB.',
            adminAccessLink: 'Acceso de administración',
            removeSelectedFile: 'Quitar archivo'
        },
        pt: {
            navServices: 'Serviços',
            navPortfolio: 'Portefólio',
            navResearch: 'Investigação',
            navLibrary: 'Biblioteca',
            navPatrimonio: 'Gestor de Património',
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
            footerPatrimonio: 'Gestor de Património',

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
            bookLanguage: 'Idioma do livro',
            originalLanguage: 'Original',
            readFullscreen: 'Ler em ecrã inteiro',
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
            dropHint: 'Apenas ficheiros .html, até 100 MB, guardados em UTF-8.',
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
            fileTooLarge: 'O ficheiro tem mais de 100 MB.',
            fileEmpty: 'O ficheiro está vazio.',
            fileNotUtf8: 'O ficheiro tem de estar guardado em UTF-8.',
            titleMissing: 'Dê um título ao livro.',
            slugInvalid: 'O endereço web só pode ter letras minúsculas, números e hífenes.',
            slugTaken: 'Já existe um livro nesse endereço. Assinale a caixa para o substituir ou escolha outro endereço.',
            sessionExpired: 'A sua sessão expirou. Inicie sessão novamente.',
            uploadFailed: 'Não foi possível publicar o livro. Tente novamente dentro de momentos.',
            networkError: 'Não há ligação ao servidor. Verifique a sua ligação e tente novamente.',

            proposalEyebrow: 'Digitalização e transcrição',
            proposalTitle: 'Proponha um livro ou documento',
            proposalIntro: 'Tem um livro impresso, PDF, digitalização ou material de estudo que gostaria de ver na biblioteca? Envie a sua proposta com o ficheiro ou os detalhes para a nossa equipa rever e transcrever.',
            proposalNameLabel: 'Nome completo',
            proposalNamePlaceholder: 'Nome e apelido',
            proposalEmailLabel: 'Endereço de correio eletrónico',
            proposalEmailPlaceholder: 'nome@exemplo.com',
            proposalFileLabel: 'Ficheiro (imagem, PDF, Word, TXT, etc.)',
            proposalDropTitle: 'Selecione um ficheiro ou arraste-o para aqui',
            proposalDropHint: 'PDF, Word, imagens, TXT ou digitalizações até 24 MB',
            proposalMessageLabel: 'Detalhes da proposta e notas',
            proposalMessagePlaceholder: 'Título da obra, autor, edição, instruções de transcrição ou notas sobre o documento…',
            proposalSubmit: 'Enviar proposta',
            proposalSending: 'A enviar proposta…',
            proposalSuccess: 'Muito obrigado! A sua proposta foi recebida. A nossa equipa irá rever o documento e entrará em contacto se for necessário.',
            proposalError: 'Não foi possível enviar a proposta. Verifique a sua ligação e tente novamente.',
            proposalFileTooLarge: 'O ficheiro excede o limite de 24 MB.',
            adminAccessLink: 'Acesso de administração',
            removeSelectedFile: 'Remover ficheiro'
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

    /** El idioma que pide una página del propio sitio: `?lang=` o la carpeta `/es/`, `/pt/`. */
    function languageOfSitePage(address) {
        var requested = address.searchParams.get('lang');
        if (SUPPORTED.indexOf(requested) !== -1) return requested;
        var folder = /^\/(es|pt)(?:\/|$)/.exec(address.pathname);
        return folder ? folder[1] : null;
    }

    function initialLanguage() {
        var requested = new URLSearchParams(window.location.search).get('lang');
        if (SUPPORTED.indexOf(requested) !== -1) return requested;

        if (NATIVE_LANGUAGE) {
            // `.es` y `.pt`: la elección que hizo quien tradujo el sitio, y si no, la del dominio.
            var saved = storageGet('elysium_lang_pref');
            return SUPPORTED.indexOf(saved) !== -1 ? saved : NATIVE_LANGUAGE;
        }

        // `.eu` y `.com`: el idioma de la página de la que se viene (su carpeta
        // o su `?lang=`), para no perderlo al abrir la biblioteca desde `/es/…`
        // ni al pasar del índice a un libro. Nunca el del navegador ni el del
        // libro: cada región se abre en el suyo.
        try {
            var referrer = new URL(document.referrer);
            if (referrer.origin === window.location.origin) {
                var inherited = languageOfSitePage(referrer);
                if (inherited) return inherited;
            }
        } catch (error) { /* sin referrer */ }
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
        // En `.es` y `.pt` el idioma no vive en la URL: la traducción del sitio
        // lo recuerda (`elysium_lang_pref`, que `setLanguage` escribe).
        if (NATIONAL) return page ? '/' + page : '/';
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
        document.querySelectorAll('[data-i18n-placeholder]').forEach(function (element) {
            element.setAttribute('placeholder', t(element.getAttribute('data-i18n-placeholder')));
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
            var langs = element('span', 'library-card-langs');
            var chip = element('span', 'library-chip', languageName(entry.lang) || 'HTML');
            if (entry.lang) chip.setAttribute('lang', HTML_LANG[language]);
            langs.append(chip);
            // Una etiqueta más por cada traducción guardada del libro.
            (entry.translations || []).forEach(function (code) {
                var extra = element('span', 'library-chip library-chip-translation', languageName(code));
                extra.setAttribute('lang', HTML_LANG[language]);
                langs.append(extra);
            });
            top.append(langs, element('span', 'library-card-size', formatSize(entry.size)));

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
    /** La traducción que se está leyendo en el lector ('' = original). */
    var activeBookLanguage = '';

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
        var translated = book && entry.slug === book.slug && activeBookLanguage ? '?lang=' + activeBookLanguage : '';
        if (download) download.setAttribute('href', '/library/' + encodeURIComponent(entry.slug) + '/download' + translated);
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
        setupBookLanguage(frame);
    }

    // ── Idioma del libro ─────────────────────────────────────────────────────

    /**
     * El original y las traducciones guardadas del libro, como el selector de
     * idioma del sitio: cada una es un documento que ya existe. Cambiar recarga
     * el iframe con `?lang=` en el último ancla que el lector tenía encima (se
     * lo dice el propio libro), así que no se pierde la posición.
     */
    function setupBookLanguage(frame) {
        var BOOK_LANGUAGES = {
            'en-GB': { name: 'English (UK)', short: 'English', flag: '/Images/Optimized/flag-gb-64.webp' },
            'es-ES': { name: 'Español (España)', short: 'Español', flag: '/Images/Optimized/flag-es-64.webp' },
            'pt-PT': { name: 'Português (Portugal)', short: 'Português', flag: '/Images/Optimized/flag-pt-64.webp' }
        };
        var FLAG_BY_BASE = { en: BOOK_LANGUAGES['en-GB'].flag, es: BOOK_LANGUAGES['es-ES'].flag, pt: BOOK_LANGUAGES['pt-PT'].flag };

        var box = document.querySelector('[data-library-lang]');
        var translations = book && Array.isArray(book.translations) ? book.translations.filter(function (code) { return BOOK_LANGUAGES[code]; }) : [];
        if (!box || !frame || !translations.length) return;
        var toggle = box.querySelector('[data-lang-toggle]');
        var menu = box.querySelector('[data-lang-menu]');
        var flag = box.querySelector('[data-lang-flag]');
        var label = box.querySelector('[data-lang-label]');
        var base = String(book.lang || '').slice(0, 2).toLowerCase();
        var current = '';

        function originalName() {
            try {
                var name = new Intl.DisplayNames([book.lang || base], { type: 'language' }).of(base);
                if (name) return name.charAt(0).toUpperCase() + name.slice(1);
            } catch (error) { /* navegador antiguo */ }
            return base.toUpperCase();
        }

        function paint() {
            var entry = current ? BOOK_LANGUAGES[current] : null;
            flag.src = entry ? entry.flag : (FLAG_BY_BASE[base] || '');
            flag.hidden = !flag.getAttribute('src');
            label.textContent = entry ? entry.short : t('originalLanguage');
            menu.querySelectorAll('[data-book-lang]').forEach(function (item) {
                item.setAttribute('aria-checked', String(item.getAttribute('data-book-lang') === current));
            });
        }

        function item(code, text, image) {
            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'library-lang-item';
            button.setAttribute('role', 'menuitemradio');
            button.setAttribute('data-book-lang', code);
            if (image) {
                var img = document.createElement('img');
                img.src = image; img.alt = ''; img.width = 20; img.height = 20;
                button.append(img);
            }
            var span = document.createElement('span');
            span.textContent = text;
            button.append(span);
            button.addEventListener('click', function () { choose(code); });
            return button;
        }

        function build() {
            menu.replaceChildren(item('', originalName() + ' · ' + t('originalLanguage'), FLAG_BY_BASE[base]));
            translations.forEach(function (code) { menu.append(item(code, BOOK_LANGUAGES[code].name, BOOK_LANGUAGES[code].flag)); });
            paint();
        }

        function open(state) {
            menu.hidden = !state;
            toggle.setAttribute('aria-expanded', String(state));
        }

        function bookPath(code, anchor) {
            var path = '/library/' + encodeURIComponent(book.slug) + '/book' + (code ? '?lang=' + code : '');
            return path + (anchor ? '#' + encodeURIComponent(anchor) : '');
        }

        function whereIsTheReader() {
            return new Promise(function (resolve) {
                var done = false;
                function answer(event) {
                    if (event.source !== frame.contentWindow || !event.data || event.data.elysiumLibrary !== 'here') return;
                    finish(String(event.data.value || ''));
                }
                function finish(value) {
                    if (done) return;
                    done = true;
                    window.removeEventListener('message', answer);
                    resolve(value);
                }
                window.addEventListener('message', answer);
                try { frame.contentWindow.postMessage({ elysiumLibrary: 'where' }, '*'); } catch (error) { finish(''); }
                window.setTimeout(function () { finish(''); }, 400);
            });
        }

        function choose(code) {
            open(false);
            if (code === current) return;
            whereIsTheReader().then(function (anchor) {
                current = code;
                activeBookLanguage = code;
                frame.src = bookPath(code, anchor);
                // La descarga para ElevenReader y el índice siguen al idioma elegido.
                var download = document.querySelector('[data-audiobook-download]');
                if (download) download.setAttribute('href', '/library/' + encodeURIComponent(book.slug) + '/download' + (code ? '?lang=' + code : ''));
                document.querySelectorAll('[data-library-toc]').forEach(function (link) {
                    var hash = (link.getAttribute('href') || '').split('#')[1] || '';
                    link.setAttribute('href', bookPath(code, decodeURIComponent(hash)));
                });
                paint();
            });
        }

        toggle.addEventListener('click', function () { open(menu.hidden); });
        document.addEventListener('click', function (event) { if (!box.contains(event.target)) open(false); });
        document.addEventListener('keydown', function (event) { if (event.key === 'Escape') open(false); });
        listeners.push(build);
        build();
        box.hidden = false;
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
     * Encima del libro no se pone nada: el botón de salir es del propio
     * libro, junto a su botón de tema. Esta página le dice al libro cuándo
     * está a pantalla completa para que lo enseñe, y el libro le devuelve el
     * clic y también Escape, que pulsado dentro del iframe no llega aquí. Lo
     * hace `BOOK_HELPER`, que el Worker inyecta en cada libro
     * (`worker/library.js`), con `postMessage`.
     */
    function setupImmersive(frame) {
        var root = document.documentElement;
        var openers = document.querySelectorAll('[data-immersive-open]');
        if (!frame || !openers.length) return;

        var active = false;
        var native = false;
        var returnFocus = null;

        function fullscreenElement() {
            return document.fullscreenElement || document.webkitFullscreenElement || null;
        }

        function quietly(result) {
            if (result && typeof result.catch === 'function') result.catch(function () { /* se queda en el modo de la página */ });
        }

        // El libro vive en un origen opaco (sandbox): solo se le puede
        // escribir con destino `*`. No se le cuenta nada más que el modo.
        function tellBook() {
            try { frame.contentWindow.postMessage({ elysiumLibrary: 'immersive', value: active }, '*'); } catch (error) { /* sin libro */ }
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
            tellBook();
            try { frame.focus({ preventScroll: true }); } catch (error) { frame.focus(); }
        }

        function exit() {
            if (!active) return;
            active = false;
            root.classList.remove('library-immersive');
            tellBook();
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
            var type = event.data && event.data.elysiumLibrary;
            if (type === 'exit') exit();
            else if (type === 'escape' && !fullscreenElement()) exit();
            else if (type === 'ready') tellBook();
        });
    }

    // ── Propuestas y Administración (index) ─────────────────────────────────

    var adminSection = document.querySelector('[data-library-admin-section]');
    var adminPanel = document.querySelector('[data-library-admin]');
    var proposalSection = document.querySelector('[data-library-proposal-section]');
    var proposalForm = document.querySelector('[data-proposal-form]');
    var proposalDropzone = document.querySelector('[data-proposal-dropzone]');
    var proposalFileInput = document.querySelector('[data-proposal-file-input]');
    var proposalFileInfo = document.querySelector('[data-proposal-file-info]');
    var proposalFileName = document.querySelector('[data-proposal-file-name]');
    var proposalFileSize = document.querySelector('[data-proposal-file-size]');
    var proposalFileRemove = document.querySelector('[data-proposal-file-remove]');
    var proposalSubmitBtn = document.querySelector('[data-proposal-submit]');
    var proposalStatus = document.querySelector('[data-proposal-status]');
    var openAdminSigninBtn = document.querySelector('[data-open-admin-signin]');

    function updateAdminVisibility(adminState) {
        if (adminSection) adminSection.hidden = !adminState;
        if (proposalSection) proposalSection.hidden = adminState;
    }

    var adminLoading = null;

    function loadAdmin() {
        if (adminLoading) return adminLoading;
        adminLoading = import('/JS/library-admin.js?v=20261001').then(function (module) {
            return module.initLibraryAdmin(api);
        }).catch(function (error) {
            console.warn('[library] administration unavailable:', error);
            document.querySelectorAll('[data-admin-state]').forEach(function (node) {
                node.hidden = node.getAttribute('data-admin-state') !== 'unavailable';
            });
        });
        return adminLoading;
    }

    function formatBytes(bytes) {
        if (!bytes || bytes <= 0) return '0 B';
        var units = ['B', 'KB', 'MB', 'GB'];
        var i = Math.floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i];
    }

    if (page === 'index') {
        var hasAdminHint = CAN_ADMINISTER && storageGet(ADMIN_HINT_KEY) === '1';
        updateAdminVisibility(hasAdminHint);

        if (adminPanel) {
            adminPanel.addEventListener('toggle', function () {
                if (adminPanel.open) loadAdmin();
            });
            if (hasAdminHint) {
                if ('requestIdleCallback' in window) window.requestIdleCallback(loadAdmin, { timeout: 2000 });
                else window.setTimeout(loadAdmin, 300);
            }
        }

        if (openAdminSigninBtn) {
            openAdminSigninBtn.addEventListener('click', function () {
                if (!CAN_ADMINISTER) {
                    // La administración vive en `.eu`: allí está la sesión.
                    window.location.assign('https://elysiumdr.eu/library');
                    return;
                }
                if (adminSection) adminSection.hidden = false;
                if (adminPanel) {
                    adminPanel.open = true;
                    loadAdmin();
                    adminPanel.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }

        if (proposalForm) {
            var selectedProposalFile = null;

            function setProposalStatus(tone, copyKey) {
                if (!proposalStatus) return;
                proposalStatus.removeAttribute('data-tone');
                if (!copyKey) {
                    proposalStatus.textContent = '';
                    return;
                }
                if (tone) proposalStatus.setAttribute('data-tone', tone);
                proposalStatus.textContent = t(copyKey);
            }

            function handleFileSelection(file) {
                setProposalStatus('', '');
                if (!file) {
                    selectedProposalFile = null;
                    if (proposalFileInput) proposalFileInput.value = '';
                    if (proposalFileInfo) proposalFileInfo.hidden = true;
                    return;
                }
                if (file.size > 24 * 1024 * 1024) {
                    setProposalStatus('error', 'proposalFileTooLarge');
                    if (proposalFileInput) proposalFileInput.value = '';
                    selectedProposalFile = null;
                    if (proposalFileInfo) proposalFileInfo.hidden = true;
                    return;
                }
                selectedProposalFile = file;
                if (proposalFileName) proposalFileName.textContent = file.name;
                if (proposalFileSize) proposalFileSize.textContent = ' (' + formatBytes(file.size) + ')';
                if (proposalFileInfo) proposalFileInfo.hidden = false;
            }

            if (proposalFileInput) {
                proposalFileInput.addEventListener('change', function () {
                    var file = proposalFileInput.files && proposalFileInput.files[0];
                    handleFileSelection(file);
                });
            }

            if (proposalFileRemove) {
                proposalFileRemove.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    handleFileSelection(null);
                });
            }

            if (proposalDropzone) {
                ['dragenter', 'dragover'].forEach(function (eventName) {
                    proposalDropzone.addEventListener(eventName, function (e) {
                        e.preventDefault();
                        proposalDropzone.classList.add('is-dragover');
                    });
                });
                ['dragleave', 'drop'].forEach(function (eventName) {
                    proposalDropzone.addEventListener(eventName, function (e) {
                        e.preventDefault();
                        proposalDropzone.classList.remove('is-dragover');
                    });
                });
                proposalDropzone.addEventListener('drop', function (e) {
                    var files = e.dataTransfer && e.dataTransfer.files;
                    if (files && files.length > 0) {
                        handleFileSelection(files[0]);
                    }
                });
            }

            proposalForm.addEventListener('submit', function (event) {
                event.preventDefault();
                var name = String(proposalForm.elements.name ? proposalForm.elements.name.value : '').trim();
                var email = String(proposalForm.elements.email ? proposalForm.elements.email.value : '').trim();
                var message = String(proposalForm.elements.message ? proposalForm.elements.message.value : '').trim();

                if (!name || !email || !message) {
                    setProposalStatus('error', 'proposalError');
                    return;
                }

                var formData = new FormData();
                formData.append('name', name);
                formData.append('email', email);
                formData.append('message', message);
                formData.append('lang', language);
                if (selectedProposalFile) {
                    formData.append('file', selectedProposalFile, selectedProposalFile.name);
                }

                if (proposalSubmitBtn) proposalSubmitBtn.disabled = true;
                setProposalStatus('', 'proposalSending');

                fetch('/library/api/proposals', {
                    method: 'POST',
                    body: formData
                }).then(function (res) {
                    if (!res.ok) throw new Error('status_' + res.status);
                    return res.json();
                }).then(function () {
                    proposalForm.reset();
                    handleFileSelection(null);
                    setProposalStatus('success', 'proposalSuccess');
                }).catch(function (error) {
                    console.warn('[library] proposal submit failed:', error);
                    setProposalStatus('error', 'proposalError');
                }).finally(function () {
                    if (proposalSubmitBtn) proposalSubmitBtn.disabled = false;
                });
            });
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
                updateAdminVisibility(true);
                if (adminPanel) adminPanel.open = true;
            } else {
                try { window.localStorage.removeItem(ADMIN_HINT_KEY); } catch (error) { /* modo privado */ }
                updateAdminVisibility(false);
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
