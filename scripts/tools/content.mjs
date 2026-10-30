/**
 * Elysium Tools (tools.elysiumdr.eu) — el contenido de las páginas públicas.
 *
 * `scripts/build-tools.mjs` lo convierte en `tools/**` (HTML), el sitemap, el
 * robots.txt, los `llms.txt` y el catálogo. Se edita aquí y se regenera; las
 * páginas no se tocan a mano.
 *
 * Todo lo que se afirma tiene que ser verdad el día que se publica: Google y
 * los modelos de lenguaje lo citan tal cual. Las plataformas salen de una sonda
 * desde Cloud Run (29/10/2026 y 30/10/2026); una que deje de funcionar se marca
 * `available: false` y desaparece de las promesas, de las listas y del
 * sitemap, no solo del menú. YouTube está así hasta que el servicio salga por
 * un proxy residencial: desde las IP de Google pide «confirmar que no es un bot».
 *
 * Registro: en español se trata de tú (es una herramienta de consumo, como el
 * propio interfaz de las herramientas); en portugués, el europeo formal del
 * resto del sitio.
 */

export const ORIGIN = 'https://tools.elysiumdr.eu';
export const LANGUAGES = ['en', 'es', 'pt'];
export const LOCALES = { en: 'en-GB', es: 'es', pt: 'pt-PT' };
export const OG_LOCALES = { en: 'en_GB', es: 'es_ES', pt: 'pt_PT' };
export const MAIN_SITE = { en: 'https://elysiumdr.eu/', es: 'https://elysiumdr.eu/es/', pt: 'https://elysiumdr.eu/pt/' };

/** Los límites que aplica de verdad la pasarela pública (backend/tools/public-tools.js). */
export const LIMITS = {
    videoMaxMb: 250,
    pdfEditMaxMb: 200,
    pdfConvertMaxMb: 30,
    pdfConvertMaxPages: 500,
    inspectionsPerHour: 30,
    downloadsPerHour: 10,
    conversionsPerHour: 10,
    fileMinutes: 15
};

/** Comprobadas desde Cloud Run. El orden es el de las listas visibles. */
export const PLATFORMS = [
    { id: 'tiktok', name: 'TikTok', available: true },
    { id: 'instagram', name: 'Instagram', available: true },
    { id: 'facebook', name: 'Facebook', available: true },
    { id: 'pinterest', name: 'Pinterest', available: true },
    { id: 'twitch', name: 'Twitch', available: true },
    { id: 'linkedin', name: 'LinkedIn', available: true },
    { id: 'snapchat', name: 'Snapchat', available: true },
    { id: 'bluesky', name: 'Bluesky', available: true },
    { id: 'youtube', name: 'YouTube', available: false }
];

/** La fecha que se publica como `lastmod`. Se cambia al cambiar el contenido. */
export const UPDATED = '2026-10-30';

/** Nombre corto de cada página: menú, migas, pie y enlaces relacionados. */
export const LABELS = {
    home: { en: 'All tools', es: 'Todas las herramientas', pt: 'Todas as ferramentas' },
    video: { en: 'Video downloader', es: 'Descargar videos', pt: 'Descarregar vídeos' },
    pdf: { en: 'PDF editor', es: 'Editor de PDF', pt: 'Editor de PDF' },
    merge: { en: 'Merge PDF', es: 'Unir PDF', pt: 'Juntar PDF' },
    'pdf-to-word': { en: 'PDF to Word', es: 'PDF a Word', pt: 'PDF para Word' },
    rotate: { en: 'Rotate PDF', es: 'Girar PDF', pt: 'Rodar PDF' },
    'delete-pages': { en: 'Delete PDF pages', es: 'Eliminar páginas', pt: 'Eliminar páginas' },
    organize: { en: 'Reorder PDF pages', es: 'Ordenar páginas', pt: 'Ordenar páginas' },
    extract: { en: 'Extract PDF pages', es: 'Extraer páginas', pt: 'Extrair páginas' },
    legal: { en: 'Privacy and terms', es: 'Privacidad y condiciones', pt: 'Privacidade e condições' }
};

/** Una línea por página para las tarjetas de la portada y de los índices. */
export const CARDS = {
    tiktok: { en: 'Without watermark, as MP4 or MP3.', es: 'Sin marca de agua, en MP4 o MP3.', pt: 'Sem marca de água, em MP4 ou MP3.' },
    instagram: { en: 'Reels, posts and carousels.', es: 'Reels, publicaciones y carruseles.', pt: 'Reels, publicações e carrosséis.' },
    facebook: { en: 'Public videos from pages and profiles.', es: 'Videos públicos de páginas y perfiles.', pt: 'Vídeos públicos de páginas e perfis.' },
    pinterest: { en: 'Video pins in every resolution.', es: 'Pines de video en todas sus resoluciones.', pt: 'Pins de vídeo em todas as resoluções.' },
    twitch: { en: 'Clips and past broadcasts.', es: 'Clips y emisiones pasadas.', pt: 'Clips e emissões anteriores.' },
    linkedin: { en: 'Videos from public posts.', es: 'Videos de publicaciones públicas.', pt: 'Vídeos de publicações públicas.' },
    merge: { en: 'Combine several PDFs into one.', es: 'Combina varios PDF en uno.', pt: 'Combine vários PDF num só.' },
    'pdf-to-word': { en: 'Editable .docx for Word, Pages or Docs.', es: 'Un .docx editable para Word, Pages o Docs.', pt: 'Um .docx editável para Word, Pages ou Docs.' },
    rotate: { en: 'Turn sideways or upside-down pages.', es: 'Endereza páginas de lado o al revés.', pt: 'Endireite páginas de lado ou ao contrário.' },
    'delete-pages': { en: 'Remove the pages you do not need.', es: 'Quita las páginas que sobran.', pt: 'Retire as páginas que sobram.' },
    organize: { en: 'Drag the pages into a new order.', es: 'Arrastra las páginas a un nuevo orden.', pt: 'Arraste as páginas para uma nova ordem.' },
    extract: { en: 'Save a selection as a new PDF.', es: 'Guarda una selección como PDF nuevo.', pt: 'Guarde uma seleção como PDF novo.' }
};

/* ── Textos compartidos ──────────────────────────────────────────────────── */

export const UI = {
    en: {
        skip: 'Skip to content',
        siteName: 'Elysium Tools',
        navVideo: 'Video downloader',
        navPdf: 'PDF editor',
        navAll: 'All tools',
        language: 'Language',
        badges: ['100% free', 'No ads', 'No sign-up'],
        crumbHome: 'Tools',
        breadcrumb: 'Breadcrumb',
        how: 'How it works',
        faq: 'Frequently asked questions',
        relatedVideo: 'Download from other platforms',
        relatedPdf: 'More free PDF tools',
        relatedTools: 'Other tools',
        footerTools: 'Tools',
        footerPlatforms: 'Video platforms',
        footerPdf: 'PDF tools',
        footerAbout: 'About',
        legal: 'Privacy and terms',
        mainSite: 'Elysium λ Development & Research',
        aboutText: 'Elysium Tools is made by Elysium λ Development & Research, a digital-infrastructure company based in Portugal. The tools are free and carry no advertising.',
        pending: names => `Coming soon: ${names}.`,
        open: 'Open the tool',
        soon: 'Coming soon',
        noscript: 'This tool needs JavaScript. Everything else on this page works without it.',
        responsible: 'Download only content you own or have permission to use. Respect the rights of creators and the terms of each platform.',
        sharedFaqVideo: [
            ['Is it really free?', 'Yes. There are no ads, subscriptions or accounts. Fair-use limits keep the service available for everyone: {inspections} link checks, {downloads} downloads and {conversions} Word conversions per hour.'],
            ['Can I download any video?', 'Only public videos. Content that is private, requires signing in, is age-restricted or is a live stream in progress cannot be downloaded. Download only videos you own or have permission to use.']
        ],
        sharedFaqPdf: [
            ['Are my PDF files uploaded?', 'Not to edit them: merging, reordering, rotating, deleting and extracting pages happen inside your browser and the file never leaves your device. Only “Convert to Word” sends the edited PDF to the Elysium server, which deletes it as soon as the Word file exists.'],
            ['Is it free?', 'Yes, with no ads, watermarks or sign-up. Word conversion allows {conversions} documents per hour per visitor so the service stays available.']
        ]
    },
    es: {
        skip: 'Ir al contenido',
        siteName: 'Elysium Tools',
        navVideo: 'Descargar videos',
        navPdf: 'Editor de PDF',
        navAll: 'Todas las herramientas',
        language: 'Idioma',
        badges: ['100 % gratis', 'Sin anuncios', 'Sin registro'],
        crumbHome: 'Herramientas',
        breadcrumb: 'Ruta de navegación',
        how: 'Cómo funciona',
        faq: 'Preguntas frecuentes',
        relatedVideo: 'Descargar de otras plataformas',
        relatedPdf: 'Más herramientas PDF gratis',
        relatedTools: 'Otras herramientas',
        footerTools: 'Herramientas',
        footerPlatforms: 'Plataformas de video',
        footerPdf: 'Herramientas PDF',
        footerAbout: 'Quiénes somos',
        legal: 'Privacidad y condiciones',
        mainSite: 'Elysium λ Development & Research',
        aboutText: 'Elysium Tools es un proyecto de Elysium λ Development & Research, empresa de infraestructura digital con sede en Portugal. Las herramientas son gratis y no llevan publicidad.',
        pending: names => `Próximamente: ${names}.`,
        open: 'Abrir la herramienta',
        soon: 'Próximamente',
        noscript: 'Esta herramienta necesita JavaScript. El resto de la página funciona sin él.',
        responsible: 'Descarga solo contenido propio o que tengas permiso para usar. Respeta los derechos de quien lo creó y las condiciones de cada plataforma.',
        sharedFaqVideo: [
            ['¿De verdad es gratis?', 'Sí. No hay anuncios, suscripciones ni cuentas. Para que el servicio siga disponible para todos hay límites de uso justo: {inspections} análisis, {downloads} descargas y {conversions} conversiones a Word por hora.'],
            ['¿Puedo descargar cualquier video?', 'Solo videos públicos. No se puede descargar contenido privado, que exija iniciar sesión, con restricción de edad o una transmisión en directo que no ha terminado. Descarga solo videos propios o que tengas permiso para usar.']
        ],
        sharedFaqPdf: [
            ['¿Se suben mis PDF a algún servidor?', 'Para editarlos, no: unir, ordenar, girar, eliminar y extraer páginas ocurre dentro de tu navegador y el archivo no sale de tu dispositivo. Solo «Convertir a Word» envía el PDF editado al servidor de Elysium, que lo borra en cuanto existe el Word.'],
            ['¿Es gratis?', 'Sí, sin anuncios, sin marcas de agua y sin registro. La conversión a Word admite {conversions} documentos por hora y visitante para que el servicio siga disponible.']
        ]
    },
    pt: {
        skip: 'Saltar para o conteúdo',
        siteName: 'Elysium Tools',
        navVideo: 'Descarregar vídeos',
        navPdf: 'Editor de PDF',
        navAll: 'Todas as ferramentas',
        language: 'Idioma',
        badges: ['100% grátis', 'Sem anúncios', 'Sem registo'],
        crumbHome: 'Ferramentas',
        breadcrumb: 'Caminho de navegação',
        how: 'Como funciona',
        faq: 'Perguntas frequentes',
        relatedVideo: 'Descarregar de outras plataformas',
        relatedPdf: 'Mais ferramentas PDF grátis',
        relatedTools: 'Outras ferramentas',
        footerTools: 'Ferramentas',
        footerPlatforms: 'Plataformas de vídeo',
        footerPdf: 'Ferramentas PDF',
        footerAbout: 'Quem somos',
        legal: 'Privacidade e condições',
        mainSite: 'Elysium λ Development & Research',
        aboutText: 'A Elysium Tools é um projeto da Elysium λ Development & Research, empresa de infraestrutura digital sediada em Portugal. As ferramentas são grátis e não têm publicidade.',
        pending: names => `Em breve: ${names}.`,
        open: 'Abrir a ferramenta',
        soon: 'Em breve',
        noscript: 'Esta ferramenta precisa de JavaScript. O resto da página funciona sem ele.',
        responsible: 'Descarregue apenas conteúdo próprio ou que tenha autorização para usar. Respeite os direitos de quem o criou e as condições de cada plataforma.',
        sharedFaqVideo: [
            ['É mesmo grátis?', 'Sim. Não há anúncios, subscrições nem contas. Para o serviço continuar disponível para todos, há limites de utilização justa: {inspections} análises, {downloads} transferências e {conversions} conversões para Word por hora.'],
            ['Posso descarregar qualquer vídeo?', 'Apenas vídeos públicos. Não é possível descarregar conteúdo privado, que exija sessão iniciada, com restrição de idade ou uma emissão em direto ainda a decorrer. Descarregue apenas vídeos próprios ou que tenha autorização para usar.']
        ],
        sharedFaqPdf: [
            ['Os meus PDF são enviados para algum servidor?', 'Para os editar, não: juntar, ordenar, rodar, eliminar e extrair páginas acontece dentro do seu navegador e o ficheiro não sai do seu dispositivo. Só «Converter para Word» envia o PDF editado para o servidor da Elysium, que o apaga assim que o Word existe.'],
            ['É grátis?', 'Sim, sem anúncios, marcas de água nem registo. A conversão para Word admite {conversions} documentos por hora e visitante para o serviço continuar disponível.']
        ]
    }
};

/* ── Páginas ─────────────────────────────────────────────────────────────── */

/**
 * `tool`: qué herramienta lleva la página (`video`, `pdf` o ninguna).
 * `platform`: en las páginas de plataforma, su id en PLATFORMS; si deja de
 * estar disponible, la página no se genera.
 * `placeholder`: el ejemplo del campo de enlace.
 */
export const PAGES = [
    {
        id: 'home',
        type: 'home',
        slugs: { en: '', es: '', pt: '' },
        copy: {
            en: {
                title: 'Free video downloader & PDF editor',
                description: 'Download videos from TikTok, Instagram, Facebook and more in their original resolution, and merge, edit or convert PDFs to Word. 100% free, no ads.',
                h1: 'Free online tools, with no ads and no sign-up',
                lead: 'Save videos from TikTok, Instagram, Facebook and other platforms in every resolution they offer, and merge, reorder or convert your PDFs to Word. Everything is free and nothing gets in your way.',
                cardVideo: 'Paste a link and choose the quality: from 360p up to 4K or 8K when the platform has it, or just the audio as MP3 or M4A.',
                cardPdf: 'Merge PDFs, reorder, rotate or delete pages and extract the ones you need — inside your browser. Convert to Word when you need to edit the text.',
                cardFuture: 'More everyday tools are on the way. Each one will appear here once it works and its limits are clear.',
                future: 'More tools',
                why: 'Why these tools are free',
                whyText: [
                    'Elysium builds digital infrastructure for small businesses. These tools come from that work and we keep them open for anyone: no ads, no trackers and no account to create.',
                    'They are fast because they do as little as possible on our side. PDF pages are edited in your own browser; videos are fetched from the platform, delivered to you and deleted after {fileMinutes} minutes.'
                ],
                faq: [
                    ['Do I need to install anything?', 'No. The tools run in any modern browser on a computer, tablet or phone.'],
                    ['Why are there usage limits?', 'So that the service stays fast and free for everyone. The limits are generous for personal use and reset every hour.'],
                    ['Do you keep my files?', 'No. Downloaded videos and converted Word files are available for {fileMinutes} minutes and then deleted. PDFs edited in the browser never reach our servers.']
                ]
            },
            es: {
                title: 'Descargar videos y editar PDF gratis',
                description: 'Descarga videos de TikTok, Instagram, Facebook y más en su resolución original, y une, edita o convierte PDF a Word. 100 % gratis y sin anuncios.',
                h1: 'Herramientas online gratis, sin anuncios ni registro',
                lead: 'Guarda videos de TikTok, Instagram, Facebook y otras plataformas en todas las resoluciones que ofrecen, y une, ordena o convierte tus PDF a Word. Todo gratis y sin nada que te estorbe.',
                cardVideo: 'Pega un enlace y elige la calidad: de 360p a 4K u 8K cuando la plataforma la tiene, o solo el audio en MP3 o M4A.',
                cardPdf: 'Une PDF, ordena, gira o elimina páginas y extrae las que necesitas, dentro de tu navegador. Conviértelo a Word cuando tengas que editar el texto.',
                cardFuture: 'Vienen más herramientas para el día a día. Cada una aparecerá aquí cuando funcione y sus límites estén claros.',
                future: 'Más herramientas',
                why: 'Por qué estas herramientas son gratis',
                whyText: [
                    'Elysium crea infraestructura digital para pequeñas empresas. Estas herramientas salen de ese trabajo y las dejamos abiertas para cualquiera: sin anuncios, sin rastreadores y sin cuenta que crear.',
                    'Son rápidas porque hacen lo mínimo de nuestro lado. Las páginas de los PDF se editan en tu propio navegador; los videos se obtienen de la plataforma, se te entregan y se borran a los {fileMinutes} minutos.'
                ],
                faq: [
                    ['¿Tengo que instalar algo?', 'No. Las herramientas funcionan en cualquier navegador moderno, en computadora, tableta o teléfono.'],
                    ['¿Por qué hay límites de uso?', 'Para que el servicio siga siendo rápido y gratis para todos. Los límites son generosos para el uso personal y se renuevan cada hora.'],
                    ['¿Guardan mis archivos?', 'No. Los videos descargados y los Word convertidos están disponibles {fileMinutes} minutos y luego se borran. Los PDF que editas en el navegador nunca llegan a nuestros servidores.']
                ]
            },
            pt: {
                title: 'Descarregar vídeos e editar PDF grátis',
                description: 'Descarregue vídeos do TikTok, Instagram, Facebook e mais na resolução original, e junte, edite ou converta PDF para Word. 100% grátis e sem anúncios.',
                h1: 'Ferramentas online grátis, sem anúncios nem registo',
                lead: 'Guarde vídeos do TikTok, Instagram, Facebook e outras plataformas em todas as resoluções que oferecem, e junte, ordene ou converta os seus PDF para Word. Tudo grátis e sem nada pelo meio.',
                cardVideo: 'Cole uma ligação e escolha a qualidade: de 360p a 4K ou 8K quando a plataforma a tem, ou só o áudio em MP3 ou M4A.',
                cardPdf: 'Junte PDF, ordene, rode ou elimine páginas e extraia as que precisa, dentro do seu navegador. Converta para Word quando tiver de editar o texto.',
                cardFuture: 'Estão a caminho mais ferramentas para o dia a dia. Cada uma aparecerá aqui quando funcionar e os seus limites estiverem claros.',
                future: 'Mais ferramentas',
                why: 'Porque é que estas ferramentas são grátis',
                whyText: [
                    'A Elysium cria infraestrutura digital para pequenas empresas. Estas ferramentas nascem desse trabalho e deixamo-las abertas para qualquer pessoa: sem anúncios, sem rastreadores e sem conta para criar.',
                    'São rápidas porque fazem o mínimo do nosso lado. As páginas dos PDF são editadas no seu próprio navegador; os vídeos são obtidos da plataforma, entregues e apagados ao fim de {fileMinutes} minutos.'
                ],
                faq: [
                    ['Tenho de instalar alguma coisa?', 'Não. As ferramentas funcionam em qualquer navegador moderno, no computador, tablet ou telemóvel.'],
                    ['Porque há limites de utilização?', 'Para o serviço continuar rápido e grátis para todos. Os limites são generosos para uso pessoal e renovam-se a cada hora.'],
                    ['Guardam os meus ficheiros?', 'Não. Os vídeos descarregados e os Word convertidos ficam disponíveis {fileMinutes} minutos e depois são apagados. Os PDF que edita no navegador nunca chegam aos nossos servidores.']
                ]
            }
        }
    },
    {
        id: 'video',
        type: 'video',
        tool: 'video',
        slugs: { en: 'video-downloader', es: 'descargar-videos', pt: 'descarregar-videos' },
        placeholder: 'https://www.tiktok.com/@…/video/…',
        copy: {
            en: {
                title: 'Download videos from TikTok, Instagram & more',
                description: 'Free online video downloader for TikTok, Instagram, Facebook, Pinterest, Twitch and more. Every available resolution up to 4K/8K, MP4, MP3 or M4A. No ads.',
                h1: 'Free online video downloader',
                lead: 'Paste the link of a public video from TikTok, Instagram, Facebook, Pinterest, Twitch, LinkedIn, Snapchat or Bluesky and save it in any resolution the platform offers, or as MP3/M4A audio.',
                steps: [
                    'Copy the link of the video from the app or the browser (in most apps: Share → Copy link) and paste it above.',
                    'Choose a quality. You see the real resolutions of that video, from 360p up to 4K or 8K when they exist, with an estimate of the file size.',
                    'Press Download. A progress bar shows each step and the file is saved to your device when it is ready.'
                ],
                sections: [
                    ['Every resolution the video has', 'The downloader offers exactly the resolutions the platform publishes for that video — nothing is upscaled or invented. Up to 1080p the files use H.264 and AAC in MP4, which open everywhere: phones, QuickTime, Keynote, editors and the platforms themselves. Above 1080p some platforms only offer VP9 or AV1, and the downloader tells you before you choose.'],
                    ['Audio only: MP3 or M4A', 'Choose MP3 for maximum compatibility or M4A to keep the original audio without re-encoding. It is useful for interviews, podcasts in video form or your own clips.'],
                    ['Posts with several videos', 'When a link contains several videos — an Instagram carousel or a playlist — you see the list and choose which one to download.']
                ],
                faq: [
                    ['Which platforms are supported?', 'TikTok, Instagram, Facebook, Pinterest, Twitch, LinkedIn, Snapchat and Bluesky, always with public links. YouTube is coming soon.'],
                    ['What is the maximum file size?', 'Up to {videoMaxMb} MB per file. For long videos, a lower resolution usually fits.'],
                    ['Where is the file saved?', 'In your browser’s usual downloads folder. On a phone, in the Files or Downloads app.']
                ]
            },
            es: {
                title: 'Descargar videos de TikTok, Instagram y más',
                description: 'Descargador de videos gratis para TikTok, Instagram, Facebook, Pinterest, Twitch y más. Todas las resoluciones hasta 4K/8K, MP4, MP3 o M4A. Sin anuncios.',
                h1: 'Descargar videos online gratis',
                lead: 'Pega el enlace de un video público de TikTok, Instagram, Facebook, Pinterest, Twitch, LinkedIn, Snapchat o Bluesky y guárdalo en cualquier resolución que ofrezca la plataforma, o solo el audio en MP3 o M4A.',
                steps: [
                    'Copia el enlace del video desde la app o el navegador (en casi todas las apps: Compartir → Copiar enlace) y pégalo arriba.',
                    'Elige la calidad. Verás las resoluciones reales de ese video, de 360p a 4K u 8K cuando existen, con el tamaño aproximado del archivo.',
                    'Pulsa Descargar. Una barra de progreso muestra cada paso y el archivo se guarda en tu dispositivo cuando está listo.'
                ],
                sections: [
                    ['Todas las resoluciones del video', 'El descargador ofrece exactamente las resoluciones que publica la plataforma para ese video: no se aumenta ni se inventa ninguna. Hasta 1080p los archivos van en MP4 con H.264 y AAC, que se abren en todas partes: teléfonos, QuickTime, Keynote, editores y las propias redes. Por encima de 1080p algunas plataformas solo ofrecen VP9 o AV1, y el descargador te lo avisa antes de elegir.'],
                    ['Solo el audio: MP3 o M4A', 'Elige MP3 para la máxima compatibilidad o M4A para conservar el audio original sin recodificarlo. Es útil para entrevistas, pódcast en video o tus propios clips.'],
                    ['Publicaciones con varios videos', 'Cuando un enlace contiene varios videos —un carrusel de Instagram o una lista—, verás la lista y elegirás cuál descargar.']
                ],
                faq: [
                    ['¿Qué plataformas son compatibles?', 'TikTok, Instagram, Facebook, Pinterest, Twitch, LinkedIn, Snapchat y Bluesky, siempre con enlaces públicos. YouTube llegará pronto.'],
                    ['¿Cuál es el tamaño máximo?', 'Hasta {videoMaxMb} MB por archivo. En videos largos, una resolución menor suele caber.'],
                    ['¿Dónde se guarda el archivo?', 'En la carpeta de descargas habitual de tu navegador. En el teléfono, en la app Archivos o Descargas.']
                ]
            },
            pt: {
                title: 'Descarregar vídeos do TikTok, Instagram e mais',
                description: 'Descarregador de vídeos grátis para TikTok, Instagram, Facebook, Pinterest, Twitch e mais. Todas as resoluções até 4K/8K, MP4, MP3 ou M4A. Sem anúncios.',
                h1: 'Descarregar vídeos online grátis',
                lead: 'Cole a ligação de um vídeo público do TikTok, Instagram, Facebook, Pinterest, Twitch, LinkedIn, Snapchat ou Bluesky e guarde-o em qualquer resolução que a plataforma ofereça, ou só o áudio em MP3 ou M4A.',
                steps: [
                    'Copie a ligação do vídeo na app ou no navegador (na maioria das apps: Partilhar → Copiar ligação) e cole-a acima.',
                    'Escolha a qualidade. Verá as resoluções reais desse vídeo, de 360p a 4K ou 8K quando existem, com o tamanho aproximado do ficheiro.',
                    'Prima Transferir. Uma barra de progresso mostra cada passo e o ficheiro é guardado no seu dispositivo quando está pronto.'
                ],
                sections: [
                    ['Todas as resoluções do vídeo', 'O descarregador oferece exatamente as resoluções que a plataforma publica para esse vídeo: nenhuma é aumentada ou inventada. Até 1080p os ficheiros vêm em MP4 com H.264 e AAC, que abrem em todo o lado: telemóveis, QuickTime, Keynote, editores e as próprias redes. Acima de 1080p algumas plataformas só oferecem VP9 ou AV1, e o descarregador avisa antes de escolher.'],
                    ['Só o áudio: MP3 ou M4A', 'Escolha MP3 para a máxima compatibilidade ou M4A para manter o áudio original sem o recodificar. É útil para entrevistas, podcasts em vídeo ou os seus próprios clips.'],
                    ['Publicações com vários vídeos', 'Quando uma ligação contém vários vídeos — um carrossel do Instagram ou uma lista —, verá a lista e escolherá qual descarregar.']
                ],
                faq: [
                    ['Que plataformas são compatíveis?', 'TikTok, Instagram, Facebook, Pinterest, Twitch, LinkedIn, Snapchat e Bluesky, sempre com ligações públicas. O YouTube chegará em breve.'],
                    ['Qual é o tamanho máximo?', 'Até {videoMaxMb} MB por ficheiro. Em vídeos longos, uma resolução menor costuma caber.'],
                    ['Onde é guardado o ficheiro?', 'Na pasta de transferências habitual do seu navegador. No telemóvel, na app Ficheiros ou Transferências.']
                ]
            }
        }
    },
    {
        id: 'tiktok',
        type: 'platform',
        tool: 'video',
        platform: 'tiktok',
        slugs: { en: 'tiktok-video-downloader', es: 'descargar-videos-tiktok', pt: 'descarregar-videos-tiktok' },
        placeholder: 'https://www.tiktok.com/@…/video/…',
        copy: {
            en: {
                title: 'TikTok video downloader without watermark',
                description: 'Download TikTok videos without watermark in their original quality, as MP4 or as MP3/M4A audio. Free, no ads, no app and no sign-up.',
                h1: 'Download TikTok videos without watermark',
                lead: 'Save public TikTok videos as the original file the platform serves: no TikTok logo moving across the screen and no username stamped on top.',
                steps: [
                    'In TikTok, open the video, tap Share → Copy link. Short links like vm.tiktok.com work too.',
                    'Paste the link above. You will see the available qualities — usually 540p, 720p or 1080p.',
                    'Choose MP4 for the video or MP3/M4A for the sound, and press Download.'
                ],
                sections: [
                    ['Without the watermark', 'The file you get is the video stream TikTok delivers to its own player, not the copy it generates for sharing, so it has no watermark. Use it to keep your own videos, repost your content elsewhere or edit it.'],
                    ['Quality and format', 'TikTok publishes several versions of each video. When it offers both, the downloader prefers H.264 for maximum compatibility; the highest quality can be HEVC (H.265), which plays on iPhone, Mac and most modern devices.']
                ],
                faq: [
                    ['Does the creator know I downloaded the video?', 'No. Downloading a public video does not notify anyone. Even so, only download videos you own or may use.'],
                    ['Can I download TikTok photo slideshows?', 'Not yet. The downloader works with videos; posts made only of photos are not supported.'],
                    ['Can I get only the sound of a TikTok?', 'Yes. Choose MP3 or M4A and you will get the audio of that video.']
                ]
            },
            es: {
                title: 'Descargar videos de TikTok sin marca de agua',
                description: 'Descarga videos de TikTok sin marca de agua y en su calidad original, en MP4 o solo el audio en MP3/M4A. Gratis, sin anuncios, sin app y sin registro.',
                h1: 'Descargar videos de TikTok sin marca de agua',
                lead: 'Guarda videos públicos de TikTok tal como los sirve la plataforma: sin el logotipo de TikTok moviéndose por la pantalla y sin el nombre de usuario encima.',
                steps: [
                    'En TikTok, abre el video y toca Compartir → Copiar enlace. Los enlaces cortos como vm.tiktok.com también funcionan.',
                    'Pega el enlace arriba. Verás las calidades disponibles, normalmente 540p, 720p o 1080p.',
                    'Elige MP4 para el video o MP3/M4A para el sonido y pulsa Descargar.'
                ],
                sections: [
                    ['Sin marca de agua', 'El archivo que recibes es el video que TikTok entrega a su propio reproductor, no la copia que genera para compartir, así que no lleva marca de agua. Úsalo para guardar tus propios videos, publicar tu contenido en otro sitio o editarlo.'],
                    ['Calidad y formato', 'TikTok publica varias versiones de cada video. Cuando ofrece ambas, el descargador prefiere H.264 por compatibilidad; la calidad más alta puede venir en HEVC (H.265), que se reproduce en iPhone, Mac y la mayoría de dispositivos actuales.']
                ],
                faq: [
                    ['¿Se entera quien publicó el video?', 'No. Descargar un video público no avisa a nadie. Aun así, descarga solo videos propios o que puedas usar.'],
                    ['¿Puedo descargar presentaciones de fotos de TikTok?', 'Todavía no. El descargador funciona con videos; las publicaciones hechas solo de fotos no son compatibles.'],
                    ['¿Puedo bajar solo el sonido de un TikTok?', 'Sí. Elige MP3 o M4A y tendrás el audio de ese video.']
                ]
            },
            pt: {
                title: 'Descarregar vídeos do TikTok sem marca de água',
                description: 'Descarregue vídeos do TikTok sem marca de água e na qualidade original, em MP4 ou só o áudio em MP3/M4A. Grátis, sem anúncios, sem app e sem registo.',
                h1: 'Descarregar vídeos do TikTok sem marca de água',
                lead: 'Guarde vídeos públicos do TikTok tal como a plataforma os serve: sem o logótipo do TikTok a mexer-se no ecrã e sem o nome de utilizador por cima.',
                steps: [
                    'No TikTok, abra o vídeo e toque em Partilhar → Copiar ligação. As ligações curtas como vm.tiktok.com também funcionam.',
                    'Cole a ligação acima. Verá as qualidades disponíveis, normalmente 540p, 720p ou 1080p.',
                    'Escolha MP4 para o vídeo ou MP3/M4A para o som e prima Transferir.'
                ],
                sections: [
                    ['Sem marca de água', 'O ficheiro que recebe é o vídeo que o TikTok entrega ao seu próprio leitor, não a cópia que gera para partilhar, por isso não tem marca de água. Use-o para guardar os seus vídeos, publicar o seu conteúdo noutro sítio ou editá-lo.'],
                    ['Qualidade e formato', 'O TikTok publica várias versões de cada vídeo. Quando oferece ambas, o descarregador prefere H.264 por compatibilidade; a qualidade mais alta pode vir em HEVC (H.265), que é reproduzido no iPhone, no Mac e na maioria dos dispositivos atuais.']
                ],
                faq: [
                    ['Quem publicou o vídeo fica a saber?', 'Não. Descarregar um vídeo público não avisa ninguém. Ainda assim, descarregue apenas vídeos próprios ou que possa usar.'],
                    ['Posso descarregar apresentações de fotos do TikTok?', 'Ainda não. O descarregador funciona com vídeos; as publicações feitas só de fotos não são compatíveis.'],
                    ['Posso ficar só com o som de um TikTok?', 'Sim. Escolha MP3 ou M4A e terá o áudio desse vídeo.']
                ]
            }
        }
    },
    {
        id: 'instagram',
        type: 'platform',
        tool: 'video',
        platform: 'instagram',
        slugs: { en: 'instagram-video-downloader', es: 'descargar-videos-instagram', pt: 'descarregar-videos-instagram' },
        placeholder: 'https://www.instagram.com/reel/…',
        copy: {
            en: {
                title: 'Instagram video & Reels downloader',
                description: 'Download Instagram Reels and videos from public posts in their original quality, including videos inside carousels. Free, no ads and no login.',
                h1: 'Download Instagram videos and Reels',
                lead: 'Save Reels and videos from public Instagram posts in the quality Instagram stores them, without logging in and without installing anything.',
                steps: [
                    'In Instagram, open the Reel or post, tap the paper-plane or ⋯ menu and choose Copy link.',
                    'Paste the link above. If the post is a carousel with several videos, choose the one you want.',
                    'Pick the quality or MP3/M4A audio and press Download.'
                ],
                sections: [
                    ['Reels, posts and carousels', 'Any public Reel or video post works, and so do carousels: the downloader lists every video in the post so you can save the one you need. Instagram usually stores videos at up to 1080 pixels wide.'],
                    ['What cannot be downloaded', 'Stories, private accounts and anything that requires signing in to Instagram are not available, because the downloader never uses an Instagram account.']
                ],
                faq: [
                    ['Can I download Instagram Stories?', 'No. Stories require an Instagram session, and the downloader works without logging in.'],
                    ['Does the account owner get notified?', 'No. Downloading a public Reel does not notify anyone. Only download content you own or have permission to use.'],
                    ['Why does a link fail?', 'The account may be private, the post may have been deleted, or Instagram may be limiting anonymous requests at that moment. Try again a little later.']
                ]
            },
            es: {
                title: 'Descargar videos y reels de Instagram',
                description: 'Descarga reels y videos públicos de Instagram en su calidad original, también de carruseles. Gratis, sin anuncios y sin iniciar sesión.',
                h1: 'Descargar videos y reels de Instagram',
                lead: 'Guarda reels y videos de publicaciones públicas de Instagram en la calidad en que Instagram los almacena, sin iniciar sesión y sin instalar nada.',
                steps: [
                    'En Instagram, abre el reel o la publicación, toca el avión de papel o el menú ⋯ y elige Copiar enlace.',
                    'Pega el enlace arriba. Si la publicación es un carrusel con varios videos, elige el que quieras.',
                    'Escoge la calidad o el audio MP3/M4A y pulsa Descargar.'
                ],
                sections: [
                    ['Reels, publicaciones y carruseles', 'Funciona con cualquier reel o publicación de video pública, y también con los carruseles: el descargador muestra todos los videos de la publicación para que guardes el que necesitas. Instagram suele guardar los videos con hasta 1080 píxeles de ancho.'],
                    ['Lo que no se puede descargar', 'Las historias, las cuentas privadas y todo lo que exige iniciar sesión en Instagram no están disponibles, porque el descargador nunca usa una cuenta de Instagram.']
                ],
                faq: [
                    ['¿Puedo descargar historias de Instagram?', 'No. Las historias exigen una sesión de Instagram, y el descargador funciona sin iniciar sesión.'],
                    ['¿Se entera el dueño de la cuenta?', 'No. Descargar un reel público no avisa a nadie. Descarga solo contenido propio o que tengas permiso para usar.'],
                    ['¿Por qué falla un enlace?', 'Puede que la cuenta sea privada, que la publicación se haya borrado o que Instagram esté limitando las peticiones anónimas en ese momento. Inténtalo un poco más tarde.']
                ]
            },
            pt: {
                title: 'Descarregar vídeos e reels do Instagram',
                description: 'Descarregue reels e vídeos públicos do Instagram na qualidade original, também de carrosséis. Grátis, sem anúncios e sem iniciar sessão.',
                h1: 'Descarregar vídeos e reels do Instagram',
                lead: 'Guarde reels e vídeos de publicações públicas do Instagram na qualidade em que o Instagram os guarda, sem iniciar sessão e sem instalar nada.',
                steps: [
                    'No Instagram, abra o reel ou a publicação, toque no avião de papel ou no menu ⋯ e escolha Copiar ligação.',
                    'Cole a ligação acima. Se a publicação for um carrossel com vários vídeos, escolha o que pretende.',
                    'Escolha a qualidade ou o áudio MP3/M4A e prima Transferir.'
                ],
                sections: [
                    ['Reels, publicações e carrosséis', 'Funciona com qualquer reel ou publicação de vídeo pública, e também com os carrosséis: o descarregador mostra todos os vídeos da publicação para guardar o que precisa. O Instagram costuma guardar os vídeos com até 1080 píxeis de largura.'],
                    ['O que não é possível descarregar', 'As histórias, as contas privadas e tudo o que exige sessão iniciada no Instagram não estão disponíveis, porque o descarregador nunca usa uma conta do Instagram.']
                ],
                faq: [
                    ['Posso descarregar histórias do Instagram?', 'Não. As histórias exigem uma sessão do Instagram, e o descarregador funciona sem iniciar sessão.'],
                    ['O dono da conta fica a saber?', 'Não. Descarregar um reel público não avisa ninguém. Descarregue apenas conteúdo próprio ou que tenha autorização para usar.'],
                    ['Porque falha uma ligação?', 'A conta pode ser privada, a publicação pode ter sido apagada ou o Instagram pode estar a limitar os pedidos anónimos nesse momento. Tente um pouco mais tarde.']
                ]
            }
        }
    },
    {
        id: 'facebook',
        type: 'platform',
        tool: 'video',
        platform: 'facebook',
        slugs: { en: 'facebook-video-downloader', es: 'descargar-videos-facebook', pt: 'descarregar-videos-facebook' },
        placeholder: 'https://www.facebook.com/watch/?v=…',
        copy: {
            en: {
                title: 'Download Facebook videos for free',
                description: 'Download public Facebook videos in every quality available, as MP4 or MP3/M4A audio. Free online Facebook video downloader with no ads and no login.',
                h1: 'Download Facebook videos',
                lead: 'Save public videos from Facebook pages and profiles in the qualities Facebook offers, or keep just the audio.',
                steps: [
                    'On Facebook, open the video, choose Share → Copy link (or copy the address from your browser).',
                    'Paste the link above and wait a moment while the available qualities load.',
                    'Choose the quality or MP3/M4A and press Download.'
                ],
                sections: [
                    ['Public videos only', 'The downloader works with videos anyone can watch without signing in: posts from public pages, public profiles and Facebook Watch. Videos shared only with friends or inside private groups are not available.'],
                    ['Quality', 'Facebook often keeps separate versions in standard and high definition. You choose between the ones that exist for that video; when the image and sound come separately, they are joined into a single MP4.']
                ],
                faq: [
                    ['Can I download videos from private groups?', 'No. Only videos that are public on Facebook can be downloaded.'],
                    ['Why does a Facebook video fail?', 'It may be private, deleted, region-restricted or require signing in. Try another public link.'],
                    ['Is the downloaded video the original quality?', 'It is the best version Facebook makes available publicly for that video, without re-encoding when MP4 is possible.']
                ]
            },
            es: {
                title: 'Descargar videos de Facebook gratis',
                description: 'Descarga videos públicos de Facebook en todas las calidades disponibles, en MP4 o el audio en MP3/M4A. Gratis, sin anuncios y sin iniciar sesión.',
                h1: 'Descargar videos de Facebook',
                lead: 'Guarda videos públicos de páginas y perfiles de Facebook en las calidades que ofrece Facebook, o quédate solo con el audio.',
                steps: [
                    'En Facebook, abre el video y elige Compartir → Copiar enlace (o copia la dirección del navegador).',
                    'Pega el enlace arriba y espera un momento mientras se cargan las calidades disponibles.',
                    'Elige la calidad o MP3/M4A y pulsa Descargar.'
                ],
                sections: [
                    ['Solo videos públicos', 'El descargador funciona con videos que cualquiera puede ver sin iniciar sesión: publicaciones de páginas públicas, perfiles públicos y Facebook Watch. Los videos compartidos solo con amigos o dentro de grupos privados no están disponibles.'],
                    ['Calidad', 'Facebook suele guardar versiones separadas en definición estándar y alta. Eliges entre las que existen para ese video; cuando la imagen y el sonido vienen por separado, se unen en un solo MP4.']
                ],
                faq: [
                    ['¿Puedo descargar videos de grupos privados?', 'No. Solo se pueden descargar los videos que son públicos en Facebook.'],
                    ['¿Por qué falla un video de Facebook?', 'Puede ser privado, estar borrado, tener restricción regional o exigir iniciar sesión. Prueba con otro enlace público.'],
                    ['¿El video descargado tiene la calidad original?', 'Es la mejor versión que Facebook ofrece públicamente para ese video, sin recodificar cuando es posible el MP4.']
                ]
            },
            pt: {
                title: 'Descarregar vídeos do Facebook grátis',
                description: 'Descarregue vídeos públicos do Facebook em todas as qualidades disponíveis, em MP4 ou o áudio em MP3/M4A. Grátis, sem anúncios e sem iniciar sessão.',
                h1: 'Descarregar vídeos do Facebook',
                lead: 'Guarde vídeos públicos de páginas e perfis do Facebook nas qualidades que o Facebook oferece, ou fique só com o áudio.',
                steps: [
                    'No Facebook, abra o vídeo e escolha Partilhar → Copiar ligação (ou copie o endereço do navegador).',
                    'Cole a ligação acima e aguarde um momento enquanto as qualidades disponíveis são carregadas.',
                    'Escolha a qualidade ou MP3/M4A e prima Transferir.'
                ],
                sections: [
                    ['Só vídeos públicos', 'O descarregador funciona com vídeos que qualquer pessoa pode ver sem iniciar sessão: publicações de páginas públicas, perfis públicos e Facebook Watch. Os vídeos partilhados só com amigos ou dentro de grupos privados não estão disponíveis.'],
                    ['Qualidade', 'O Facebook costuma guardar versões separadas em definição normal e alta. Escolhe entre as que existem para esse vídeo; quando a imagem e o som vêm separados, são juntos num único MP4.']
                ],
                faq: [
                    ['Posso descarregar vídeos de grupos privados?', 'Não. Só é possível descarregar os vídeos que são públicos no Facebook.'],
                    ['Porque falha um vídeo do Facebook?', 'Pode ser privado, ter sido apagado, ter restrição regional ou exigir sessão iniciada. Experimente outra ligação pública.'],
                    ['O vídeo descarregado tem a qualidade original?', 'É a melhor versão que o Facebook disponibiliza publicamente para esse vídeo, sem recodificar quando o MP4 é possível.']
                ]
            }
        }
    },
    {
        id: 'pinterest',
        type: 'platform',
        tool: 'video',
        platform: 'pinterest',
        slugs: { en: 'pinterest-video-downloader', es: 'descargar-videos-pinterest', pt: 'descarregar-videos-pinterest' },
        placeholder: 'https://www.pinterest.com/pin/…',
        copy: {
            en: {
                title: 'Pinterest video downloader',
                description: 'Download Pinterest video pins in their original resolution, up to 1080p when available, as MP4. Free, no ads, no Pinterest account needed.',
                h1: 'Download Pinterest videos',
                lead: 'Save video pins from Pinterest in the resolutions they were uploaded in — often up to 1080p — to keep recipes, tutorials and ideas offline.',
                steps: [
                    'Open the video pin on Pinterest and copy its link (Share → Copy link, or the address bar).',
                    'Paste it above. If you have a short pin.it link, open it first and copy the full Pinterest address.',
                    'Choose the resolution and press Download.'
                ],
                sections: [
                    ['Video pins in every resolution', 'Pinterest stores video pins in several sizes. The downloader lists them all so you can choose a light file for your phone or the full-resolution one for editing.'],
                    ['Only videos', 'Image pins and boards are not downloaded: the tool is for video pins.']
                ],
                faq: [
                    ['Can I download whole Pinterest boards?', 'No. The downloader saves one video pin at a time.'],
                    ['Do I need a Pinterest account?', 'No. Public video pins can be downloaded without signing in.'],
                    ['Can I save only the audio?', 'Yes, choose MP3 or M4A if the pin has sound.']
                ]
            },
            es: {
                title: 'Descargar videos de Pinterest',
                description: 'Descarga pines de video de Pinterest en su resolución original, hasta 1080p cuando existe, en MP4. Gratis, sin anuncios y sin cuenta de Pinterest.',
                h1: 'Descargar videos de Pinterest',
                lead: 'Guarda pines de video de Pinterest en las resoluciones en que se subieron —a menudo hasta 1080p— para tener recetas, tutoriales e ideas sin conexión.',
                steps: [
                    'Abre el pin de video en Pinterest y copia su enlace (Compartir → Copiar enlace, o la barra de direcciones).',
                    'Pégalo arriba. Si tienes un enlace corto pin.it, ábrelo antes y copia la dirección completa de Pinterest.',
                    'Elige la resolución y pulsa Descargar.'
                ],
                sections: [
                    ['Pines de video en todas sus resoluciones', 'Pinterest guarda los pines de video en varios tamaños. El descargador los muestra todos para que elijas un archivo ligero para el teléfono o el de máxima resolución para editar.'],
                    ['Solo videos', 'Los pines de imagen y los tableros no se descargan: la herramienta es para pines de video.']
                ],
                faq: [
                    ['¿Puedo descargar tableros enteros de Pinterest?', 'No. El descargador guarda un pin de video cada vez.'],
                    ['¿Necesito una cuenta de Pinterest?', 'No. Los pines de video públicos se descargan sin iniciar sesión.'],
                    ['¿Puedo guardar solo el audio?', 'Sí, elige MP3 o M4A si el pin tiene sonido.']
                ]
            },
            pt: {
                title: 'Descarregar vídeos do Pinterest',
                description: 'Descarregue pins de vídeo do Pinterest na resolução original, até 1080p quando existe, em MP4. Grátis, sem anúncios e sem conta do Pinterest.',
                h1: 'Descarregar vídeos do Pinterest',
                lead: 'Guarde pins de vídeo do Pinterest nas resoluções em que foram carregados — muitas vezes até 1080p — para ter receitas, tutoriais e ideias sem ligação.',
                steps: [
                    'Abra o pin de vídeo no Pinterest e copie a ligação (Partilhar → Copiar ligação, ou a barra de endereço).',
                    'Cole-a acima. Se tiver uma ligação curta pin.it, abra-a primeiro e copie o endereço completo do Pinterest.',
                    'Escolha a resolução e prima Transferir.'
                ],
                sections: [
                    ['Pins de vídeo em todas as resoluções', 'O Pinterest guarda os pins de vídeo em vários tamanhos. O descarregador mostra-os todos para escolher um ficheiro leve para o telemóvel ou o de resolução máxima para editar.'],
                    ['Só vídeos', 'Os pins de imagem e os quadros não são descarregados: a ferramenta é para pins de vídeo.']
                ],
                faq: [
                    ['Posso descarregar quadros inteiros do Pinterest?', 'Não. O descarregador guarda um pin de vídeo de cada vez.'],
                    ['Preciso de uma conta do Pinterest?', 'Não. Os pins de vídeo públicos são descarregados sem iniciar sessão.'],
                    ['Posso guardar só o áudio?', 'Sim, escolha MP3 ou M4A se o pin tiver som.']
                ]
            }
        }
    },
    {
        id: 'twitch',
        type: 'platform',
        tool: 'video',
        platform: 'twitch',
        slugs: { en: 'twitch-clip-downloader', es: 'descargar-clips-twitch', pt: 'descarregar-clips-twitch' },
        placeholder: 'https://clips.twitch.tv/…',
        copy: {
            en: {
                title: 'Twitch clip downloader',
                description: 'Download Twitch clips as MP4 in 1080p or the best quality available, or as MP3/M4A. Free online Twitch clip downloader, no ads and no login.',
                h1: 'Download Twitch clips',
                lead: 'Save your favourite Twitch clips — or the clips of your own channel — as MP4 files in the best quality Twitch offers, ready to edit or share.',
                steps: [
                    'Open the clip on Twitch and copy its link (Share → Copy link). Both clips.twitch.tv and twitch.tv/…/clip/… links work.',
                    'Paste the link above and choose a quality — clips are often available in 1080p.',
                    'Press Download and the clip is saved as an MP4.'
                ],
                sections: [
                    ['Clips and past broadcasts', 'Clips are the fastest way: they are short and usually in 1080p. Past broadcasts that the channel keeps public can be downloaded too, within the size limit of {videoMaxMb} MB per file — for long broadcasts, choose a lower quality.'],
                    ['What is not supported', 'Streams that are live right now, subscriber-only videos and anything that requires a Twitch login are not available.']
                ],
                faq: [
                    ['Can I download a live stream?', 'Not while it is live. When the broadcast ends and the channel saves it, its link can be downloaded.'],
                    ['Can I download clips from any channel?', 'Any public clip can be downloaded. Use the clips of other creators only with their permission.'],
                    ['Why is a long broadcast refused?', 'Each file can be up to {videoMaxMb} MB. Choose a lower resolution or download a clip instead.']
                ]
            },
            es: {
                title: 'Descargar clips de Twitch',
                description: 'Descarga clips de Twitch en MP4 a 1080p o en la mejor calidad disponible, o solo el audio en MP3/M4A. Gratis, sin anuncios y sin iniciar sesión.',
                h1: 'Descargar clips de Twitch',
                lead: 'Guarda tus clips favoritos de Twitch —o los de tu propio canal— en MP4 con la mejor calidad que ofrece Twitch, listos para editar o compartir.',
                steps: [
                    'Abre el clip en Twitch y copia su enlace (Compartir → Copiar enlace). Funcionan los enlaces clips.twitch.tv y twitch.tv/…/clip/….',
                    'Pega el enlace arriba y elige una calidad: los clips suelen estar en 1080p.',
                    'Pulsa Descargar y el clip se guarda en MP4.'
                ],
                sections: [
                    ['Clips y emisiones pasadas', 'Los clips son lo más rápido: son cortos y suelen estar en 1080p. Las emisiones pasadas que el canal mantiene públicas también se pueden descargar, dentro del límite de {videoMaxMb} MB por archivo: en emisiones largas, elige una calidad menor.'],
                    ['Lo que no es compatible', 'Las transmisiones que están en directo, los videos solo para suscriptores y todo lo que exige iniciar sesión en Twitch no están disponibles.']
                ],
                faq: [
                    ['¿Puedo descargar un directo?', 'Mientras está en directo, no. Cuando la emisión termina y el canal la guarda, su enlace se puede descargar.'],
                    ['¿Puedo descargar clips de cualquier canal?', 'Cualquier clip público se puede descargar. Usa los clips de otros creadores solo con su permiso.'],
                    ['¿Por qué se rechaza una emisión larga?', 'Cada archivo puede tener hasta {videoMaxMb} MB. Elige una resolución menor o descarga un clip.']
                ]
            },
            pt: {
                title: 'Descarregar clips da Twitch',
                description: 'Descarregue clips da Twitch em MP4 a 1080p ou na melhor qualidade disponível, ou só o áudio em MP3/M4A. Grátis, sem anúncios e sem iniciar sessão.',
                h1: 'Descarregar clips da Twitch',
                lead: 'Guarde os seus clips favoritos da Twitch — ou os do seu próprio canal — em MP4 com a melhor qualidade que a Twitch oferece, prontos para editar ou partilhar.',
                steps: [
                    'Abra o clip na Twitch e copie a ligação (Partilhar → Copiar ligação). Funcionam as ligações clips.twitch.tv e twitch.tv/…/clip/….',
                    'Cole a ligação acima e escolha uma qualidade: os clips costumam estar em 1080p.',
                    'Prima Transferir e o clip é guardado em MP4.'
                ],
                sections: [
                    ['Clips e emissões anteriores', 'Os clips são o mais rápido: são curtos e costumam estar em 1080p. As emissões anteriores que o canal mantém públicas também podem ser descarregadas, dentro do limite de {videoMaxMb} MB por ficheiro: em emissões longas, escolha uma qualidade menor.'],
                    ['O que não é compatível', 'As emissões que estão em direto, os vídeos só para subscritores e tudo o que exige sessão iniciada na Twitch não estão disponíveis.']
                ],
                faq: [
                    ['Posso descarregar um direto?', 'Enquanto está em direto, não. Quando a emissão termina e o canal a guarda, a ligação pode ser descarregada.'],
                    ['Posso descarregar clips de qualquer canal?', 'Qualquer clip público pode ser descarregado. Use os clips de outros criadores apenas com a sua autorização.'],
                    ['Porque é recusada uma emissão longa?', 'Cada ficheiro pode ter até {videoMaxMb} MB. Escolha uma resolução menor ou descarregue um clip.']
                ]
            }
        }
    },
    {
        id: 'linkedin',
        type: 'platform',
        tool: 'video',
        platform: 'linkedin',
        slugs: { en: 'linkedin-video-downloader', es: 'descargar-videos-linkedin', pt: 'descarregar-videos-linkedin' },
        placeholder: 'https://www.linkedin.com/posts/…',
        copy: {
            en: {
                title: 'LinkedIn video downloader',
                description: 'Download videos from public LinkedIn posts as MP4, or keep the audio as MP3/M4A. Free, no ads, no LinkedIn login. Ideal for keeping your own posts.',
                h1: 'Download LinkedIn videos',
                lead: 'Save the videos of public LinkedIn posts — your company’s, your own or ones you have permission to reuse — as MP4 files.',
                steps: [
                    'On LinkedIn, open the post, click ⋯ → Copy link to post.',
                    'Paste the link above and wait for the available qualities.',
                    'Choose the quality or MP3/M4A and press Download.'
                ],
                sections: [
                    ['Native videos from public posts', 'The downloader works with videos uploaded directly to a public LinkedIn post. It is handy for archiving your company’s videos, reusing your own content in presentations or keeping a talk you were part of.'],
                    ['Limits', 'Posts visible only to connections, LinkedIn Learning courses and anything behind a login are not available.']
                ],
                faq: [
                    ['Can I download LinkedIn Learning courses?', 'No. Courses require a subscription and a login, so they are not supported.'],
                    ['Does it work with videos linked from YouTube?', 'No. It works with videos uploaded to LinkedIn itself.'],
                    ['Is my LinkedIn account used?', 'Never. The downloader does not sign in to LinkedIn, which is why only public posts work.']
                ]
            },
            es: {
                title: 'Descargar videos de LinkedIn',
                description: 'Descarga videos de publicaciones públicas de LinkedIn en MP4, o el audio en MP3/M4A. Gratis, sin anuncios y sin iniciar sesión.',
                h1: 'Descargar videos de LinkedIn',
                lead: 'Guarda los videos de publicaciones públicas de LinkedIn —los de tu empresa, los tuyos o los que tengas permiso para reutilizar— en MP4.',
                steps: [
                    'En LinkedIn, abre la publicación y haz clic en ⋯ → Copiar enlace de la publicación.',
                    'Pega el enlace arriba y espera a que aparezcan las calidades disponibles.',
                    'Elige la calidad o MP3/M4A y pulsa Descargar.'
                ],
                sections: [
                    ['Videos nativos de publicaciones públicas', 'El descargador funciona con videos subidos directamente a una publicación pública de LinkedIn. Es útil para archivar los videos de tu empresa, reutilizar tu propio contenido en presentaciones o guardar una charla en la que participaste.'],
                    ['Límites', 'Las publicaciones visibles solo para contactos, los cursos de LinkedIn Learning y todo lo que exige iniciar sesión no están disponibles.']
                ],
                faq: [
                    ['¿Puedo descargar cursos de LinkedIn Learning?', 'No. Los cursos exigen suscripción e iniciar sesión, así que no son compatibles.'],
                    ['¿Funciona con videos enlazados desde YouTube?', 'No. Funciona con videos subidos a LinkedIn.'],
                    ['¿Se usa mi cuenta de LinkedIn?', 'Nunca. El descargador no inicia sesión en LinkedIn; por eso solo funcionan las publicaciones públicas.']
                ]
            },
            pt: {
                title: 'Descarregar vídeos do LinkedIn',
                description: 'Descarregue vídeos de publicações públicas do LinkedIn em MP4, ou o áudio em MP3/M4A. Grátis, sem anúncios e sem iniciar sessão.',
                h1: 'Descarregar vídeos do LinkedIn',
                lead: 'Guarde os vídeos de publicações públicas do LinkedIn — os da sua empresa, os seus ou os que tenha autorização para reutilizar — em MP4.',
                steps: [
                    'No LinkedIn, abra a publicação e clique em ⋯ → Copiar ligação para a publicação.',
                    'Cole a ligação acima e aguarde as qualidades disponíveis.',
                    'Escolha a qualidade ou MP3/M4A e prima Transferir.'
                ],
                sections: [
                    ['Vídeos nativos de publicações públicas', 'O descarregador funciona com vídeos carregados diretamente numa publicação pública do LinkedIn. É útil para arquivar os vídeos da sua empresa, reutilizar o seu próprio conteúdo em apresentações ou guardar uma palestra em que participou.'],
                    ['Limites', 'As publicações visíveis apenas para ligações, os cursos do LinkedIn Learning e tudo o que exige sessão iniciada não estão disponíveis.']
                ],
                faq: [
                    ['Posso descarregar cursos do LinkedIn Learning?', 'Não. Os cursos exigem subscrição e sessão iniciada, por isso não são compatíveis.'],
                    ['Funciona com vídeos ligados a partir do YouTube?', 'Não. Funciona com vídeos carregados no próprio LinkedIn.'],
                    ['A minha conta do LinkedIn é usada?', 'Nunca. O descarregador não inicia sessão no LinkedIn; por isso só funcionam as publicações públicas.']
                ]
            }
        }
    },
    {
        id: 'pdf',
        type: 'pdf',
        tool: 'pdf',
        slugs: { en: 'pdf-editor', es: 'editor-pdf', pt: 'editor-pdf' },
        copy: {
            en: {
                title: 'Free online PDF editor: merge, organise, convert',
                description: 'Merge PDFs, reorder, rotate and delete pages, extract a selection and convert PDF to Word. Pages are edited in your browser. Free, no ads, no watermark.',
                h1: 'Free online PDF editor',
                lead: 'Merge several PDFs, reorder pages by dragging them, rotate or delete the ones you do not need and save the result — all inside your browser. Convert to Word when you need to edit the text.',
                steps: [
                    'Drop one or more PDF files above, or choose them from your device.',
                    'Drag the pages into the order you want; select pages to rotate, delete or extract them. Undo is always one click away.',
                    'Download the new PDF, only the selected pages, or convert the result to Word.'
                ],
                sections: [
                    ['Your PDF stays on your device', 'Merging, reordering, rotating, deleting and extracting pages are done by your browser with open-source libraries (pdf.js and pdf-lib). The document is never uploaded for these tasks, so they also work with confidential files.'],
                    ['Word, Pages and Google Docs', '“Convert to Word” rebuilds the paragraphs, tables and images of the PDF in a .docx file, which opens in Microsoft Word, Apple Pages, Google Docs and LibreOffice. Scanned PDFs become pages with images, because there is no text to recognise.']
                ],
                faq: [
                    ['How big can my PDF be?', 'Up to {pdfEditMaxMb} MB per file for editing. Word conversion accepts up to {pdfConvertMaxMb} MB and {pdfConvertMaxPages} pages.'],
                    ['Can I edit password-protected PDFs?', 'No. Remove the password first. PDFs with permission restrictions can be converted to Word as they are, but not rewritten.'],
                    ['Does it add a watermark?', 'No. The PDF you download contains only your pages.']
                ]
            },
            es: {
                title: 'Editor de PDF online gratis: unir, ordenar, convertir',
                description: 'Une PDF, ordena, gira, elimina y extrae páginas en tu navegador, y convierte PDF a Word. Gratis, sin anuncios ni marca de agua.',
                h1: 'Editor de PDF online gratis',
                lead: 'Une varios PDF, ordena las páginas arrastrándolas, gira o elimina las que no necesitas y guarda el resultado, todo dentro de tu navegador. Conviértelo a Word cuando tengas que editar el texto.',
                steps: [
                    'Suelta uno o varios PDF arriba, o elígelos desde tu dispositivo.',
                    'Arrastra las páginas al orden que quieras; selecciona páginas para girarlas, eliminarlas o extraerlas. Deshacer está siempre a un clic.',
                    'Descarga el PDF nuevo, solo las páginas seleccionadas, o convierte el resultado a Word.'
                ],
                sections: [
                    ['Tu PDF no sale de tu dispositivo', 'Unir, ordenar, girar, eliminar y extraer páginas lo hace tu navegador con bibliotecas de código abierto (pdf.js y pdf-lib). Para estas tareas el documento nunca se sube, así que también sirven para archivos confidenciales.'],
                    ['Word, Pages y Google Docs', '«Convertir a Word» reconstruye los párrafos, las tablas y las imágenes del PDF en un .docx que se abre en Microsoft Word, Apple Pages, Google Docs y LibreOffice. Los PDF escaneados quedan como páginas con imágenes, porque no hay texto que reconocer.']
                ],
                faq: [
                    ['¿De qué tamaño puede ser mi PDF?', 'Hasta {pdfEditMaxMb} MB por archivo para editar. La conversión a Word admite hasta {pdfConvertMaxMb} MB y {pdfConvertMaxPages} páginas.'],
                    ['¿Puedo editar PDF con contraseña?', 'No. Quítale antes la contraseña. Los PDF con restricciones de permisos se pueden convertir a Word tal cual, pero no reescribir.'],
                    ['¿Añade marca de agua?', 'No. El PDF que descargas solo contiene tus páginas.']
                ]
            },
            pt: {
                title: 'Editor de PDF grátis: juntar, ordenar, converter',
                description: 'Junte PDF, ordene, rode, elimine e extraia páginas no seu navegador, e converta PDF para Word. Grátis, sem anúncios nem marca de água.',
                h1: 'Editor de PDF online grátis',
                lead: 'Junte vários PDF, ordene as páginas arrastando-as, rode ou elimine as que não precisa e guarde o resultado, tudo dentro do seu navegador. Converta para Word quando tiver de editar o texto.',
                steps: [
                    'Largue um ou vários PDF acima, ou escolha-os no seu dispositivo.',
                    'Arraste as páginas para a ordem que quiser; selecione páginas para as rodar, eliminar ou extrair. Anular está sempre a um clique.',
                    'Transfira o PDF novo, só as páginas selecionadas, ou converta o resultado para Word.'
                ],
                sections: [
                    ['O seu PDF não sai do seu dispositivo', 'Juntar, ordenar, rodar, eliminar e extrair páginas é feito pelo seu navegador com bibliotecas de código aberto (pdf.js e pdf-lib). Para estas tarefas o documento nunca é enviado, por isso também servem para ficheiros confidenciais.'],
                    ['Word, Pages e Google Docs', '«Converter para Word» reconstrói os parágrafos, as tabelas e as imagens do PDF num .docx que abre no Microsoft Word, no Apple Pages, no Google Docs e no LibreOffice. Os PDF digitalizados ficam como páginas com imagens, porque não há texto para reconhecer.']
                ],
                faq: [
                    ['Que tamanho pode ter o meu PDF?', 'Até {pdfEditMaxMb} MB por ficheiro para editar. A conversão para Word aceita até {pdfConvertMaxMb} MB e {pdfConvertMaxPages} páginas.'],
                    ['Posso editar PDF com palavra-passe?', 'Não. Retire primeiro a palavra-passe. Os PDF com restrições de permissões podem ser convertidos para Word tal como estão, mas não reescritos.'],
                    ['Acrescenta marca de água?', 'Não. O PDF que transfere contém apenas as suas páginas.']
                ]
            }
        }
    },
    {
        id: 'merge',
        type: 'pdf-task',
        tool: 'pdf',
        slugs: { en: 'merge-pdf', es: 'unir-pdf', pt: 'juntar-pdf' },
        copy: {
            en: {
                title: 'Merge PDF files online for free',
                description: 'Combine several PDF files into one, in the order you choose. Your files are merged in your browser and never uploaded. Free, no ads, no watermark.',
                h1: 'Merge PDF files',
                lead: 'Combine two or more PDFs into a single document in the order you choose. The files are joined inside your browser: nothing is uploaded.',
                steps: [
                    'Drop all the PDFs you want to combine above, or add them one by one with “+ Add PDF”.',
                    'Drag the pages — or whole groups of selected pages — into the final order. Each file has its own letter and colour so you can tell them apart.',
                    'Write a name for the file and press Download PDF.'
                ],
                sections: [
                    ['Order exactly as you want', 'You are not limited to putting one file after another: you can interleave pages from different files, remove covers or blank pages and rotate scanned sheets before saving.'],
                    ['Private by design', 'Merging happens on your device, so it works offline once the page has loaded and is suitable for contracts, invoices and other confidential documents.']
                ],
                faq: [
                    ['How many PDFs can I merge?', 'As many as your device can handle; each file can be up to {pdfEditMaxMb} MB.'],
                    ['Will the merged PDF keep its text and links?', 'Yes. Pages are copied as they are, so text remains selectable and searchable.'],
                    ['Can I merge PDFs on my phone?', 'Yes. On a touch screen, hold a page for a moment and drag it to reorder.']
                ]
            },
            es: {
                title: 'Unir PDF online gratis',
                description: 'Combina varios archivos PDF en uno, en el orden que elijas. Se unen en tu navegador y nunca se suben. Gratis, sin anuncios y sin marca de agua.',
                h1: 'Unir archivos PDF',
                lead: 'Combina dos o más PDF en un solo documento en el orden que elijas. Los archivos se unen dentro de tu navegador: no se sube nada.',
                steps: [
                    'Suelta arriba todos los PDF que quieras combinar, o añádelos uno a uno con «+ Añadir PDF».',
                    'Arrastra las páginas —o grupos de páginas seleccionadas— al orden final. Cada archivo tiene su letra y su color para distinguirlos.',
                    'Escribe un nombre para el archivo y pulsa Descargar PDF.'
                ],
                sections: [
                    ['El orden exacto que quieras', 'No estás limitado a poner un archivo detrás de otro: puedes intercalar páginas de distintos archivos, quitar portadas o páginas en blanco y girar hojas escaneadas antes de guardar.'],
                    ['Privado por diseño', 'La unión se hace en tu dispositivo, así que funciona aunque te quedes sin conexión una vez cargada la página y sirve para contratos, facturas y otros documentos confidenciales.']
                ],
                faq: [
                    ['¿Cuántos PDF puedo unir?', 'Tantos como aguante tu dispositivo; cada archivo puede tener hasta {pdfEditMaxMb} MB.'],
                    ['¿El PDF unido conserva el texto y los enlaces?', 'Sí. Las páginas se copian tal cual, así que el texto sigue siendo seleccionable y se puede buscar.'],
                    ['¿Puedo unir PDF en el teléfono?', 'Sí. En una pantalla táctil, mantén pulsada una página un momento y arrástrala para ordenarla.']
                ]
            },
            pt: {
                title: 'Juntar PDF online grátis',
                description: 'Combine vários ficheiros PDF num só, pela ordem que escolher. São juntos no seu navegador e nunca são enviados. Grátis, sem anúncios e sem marca de água.',
                h1: 'Juntar ficheiros PDF',
                lead: 'Combine dois ou mais PDF num único documento pela ordem que escolher. Os ficheiros são juntos dentro do seu navegador: nada é enviado.',
                steps: [
                    'Largue acima todos os PDF que quer combinar, ou adicione-os um a um com «+ Adicionar PDF».',
                    'Arraste as páginas — ou grupos de páginas selecionadas — para a ordem final. Cada ficheiro tem a sua letra e a sua cor para os distinguir.',
                    'Escreva um nome para o ficheiro e prima Transferir PDF.'
                ],
                sections: [
                    ['A ordem exata que quiser', 'Não está limitado a pôr um ficheiro atrás do outro: pode intercalar páginas de ficheiros diferentes, retirar capas ou páginas em branco e rodar folhas digitalizadas antes de guardar.'],
                    ['Privado por conceção', 'A junção é feita no seu dispositivo, por isso funciona mesmo sem ligação depois de a página carregar e serve para contratos, faturas e outros documentos confidenciais.']
                ],
                faq: [
                    ['Quantos PDF posso juntar?', 'Tantos quantos o seu dispositivo aguentar; cada ficheiro pode ter até {pdfEditMaxMb} MB.'],
                    ['O PDF junto mantém o texto e as ligações?', 'Sim. As páginas são copiadas tal como estão, por isso o texto continua selecionável e pesquisável.'],
                    ['Posso juntar PDF no telemóvel?', 'Sim. Num ecrã tátil, mantenha uma página premida por um momento e arraste-a para a ordenar.']
                ]
            }
        }
    },
    {
        id: 'pdf-to-word',
        type: 'pdf-task',
        tool: 'pdf',
        slugs: { en: 'pdf-to-word', es: 'pdf-a-word', pt: 'pdf-para-word' },
        copy: {
            en: {
                title: 'PDF to Word converter online, free',
                description: 'Convert PDF to editable Word (.docx) with paragraphs, tables and images rebuilt. Opens in Word, Pages and Google Docs. Free, no ads, files deleted.',
                h1: 'Convert PDF to Word',
                lead: 'Turn a PDF into an editable Word document. Paragraphs, tables and images are rebuilt in a .docx file that opens in Word, Pages, Google Docs and LibreOffice.',
                steps: [
                    'Drop your PDF above. If you only need some pages, delete or reorder the rest first.',
                    'Press Convert to Word and follow the progress page by page.',
                    'The .docx file downloads automatically when it is ready.'
                ],
                sections: [
                    ['How the conversion works', 'The edited PDF is sent to the Elysium server, which analyses the layout of every page and writes the equivalent Word document. The PDF is deleted as soon as the .docx exists, and the .docx is deleted after {fileMinutes} minutes.'],
                    ['What to expect', 'Text, tables, images and basic formatting are kept so you can edit them. Complex designs — several columns, text over images — may need adjustments. Scanned PDFs have no text, so the pages arrive as images.']
                ],
                faq: [
                    ['Can I open the result in Pages?', 'Yes. Pages opens .docx files directly, and so do Word, Google Docs and LibreOffice.'],
                    ['Does it recognise text in scanned PDFs (OCR)?', 'Not yet. If the PDF is a scan, the page will be inserted as an image and the tool will tell you.'],
                    ['What are the limits?', 'Up to {pdfConvertMaxMb} MB and {pdfConvertMaxPages} pages per PDF, and {conversions} conversions per hour.']
                ]
            },
            es: {
                title: 'Convertir PDF a Word online gratis',
                description: 'Convierte PDF a Word (.docx) editable, con párrafos, tablas e imágenes. Se abre en Word, Pages y Google Docs. Gratis, sin anuncios; los archivos se borran.',
                h1: 'Convertir PDF a Word',
                lead: 'Convierte un PDF en un documento de Word editable. Los párrafos, las tablas y las imágenes se reconstruyen en un .docx que se abre en Word, Pages, Google Docs y LibreOffice.',
                steps: [
                    'Suelta tu PDF arriba. Si solo necesitas algunas páginas, elimina u ordena antes el resto.',
                    'Pulsa Convertir a Word y sigue el progreso página a página.',
                    'El .docx se descarga solo cuando está listo.'
                ],
                sections: [
                    ['Cómo funciona la conversión', 'El PDF editado se envía al servidor de Elysium, que analiza el diseño de cada página y escribe el documento de Word equivalente. El PDF se borra en cuanto existe el .docx, y el .docx se borra a los {fileMinutes} minutos.'],
                    ['Qué esperar', 'Se conservan el texto, las tablas, las imágenes y el formato básico para que puedas editarlos. Los diseños complejos —varias columnas, texto sobre imágenes— pueden necesitar ajustes. Los PDF escaneados no tienen texto, así que las páginas llegan como imágenes.']
                ],
                faq: [
                    ['¿Puedo abrir el resultado en Pages?', 'Sí. Pages abre los .docx directamente, igual que Word, Google Docs y LibreOffice.'],
                    ['¿Reconoce el texto de los PDF escaneados (OCR)?', 'Todavía no. Si el PDF es un escaneo, la página se inserta como imagen y la herramienta te avisa.'],
                    ['¿Cuáles son los límites?', 'Hasta {pdfConvertMaxMb} MB y {pdfConvertMaxPages} páginas por PDF, y {conversions} conversiones por hora.']
                ]
            },
            pt: {
                title: 'Converter PDF para Word online grátis',
                description: 'Converta PDF para Word (.docx) editável, com parágrafos, tabelas e imagens. Abre no Word, Pages e Google Docs. Grátis, sem anúncios; ficheiros apagados.',
                h1: 'Converter PDF para Word',
                lead: 'Transforme um PDF num documento Word editável. Os parágrafos, as tabelas e as imagens são reconstruídos num .docx que abre no Word, no Pages, no Google Docs e no LibreOffice.',
                steps: [
                    'Largue o seu PDF acima. Se só precisar de algumas páginas, elimine ou ordene primeiro as restantes.',
                    'Prima Converter para Word e acompanhe o progresso página a página.',
                    'O .docx é transferido automaticamente quando estiver pronto.'
                ],
                sections: [
                    ['Como funciona a conversão', 'O PDF editado é enviado para o servidor da Elysium, que analisa a paginação de cada página e escreve o documento Word equivalente. O PDF é apagado assim que o .docx existe, e o .docx é apagado ao fim de {fileMinutes} minutos.'],
                    ['O que esperar', 'O texto, as tabelas, as imagens e a formatação básica são mantidos para os poder editar. As paginações complexas — várias colunas, texto sobre imagens — podem precisar de ajustes. Os PDF digitalizados não têm texto, por isso as páginas chegam como imagens.']
                ],
                faq: [
                    ['Posso abrir o resultado no Pages?', 'Sim. O Pages abre ficheiros .docx diretamente, tal como o Word, o Google Docs e o LibreOffice.'],
                    ['Reconhece o texto de PDF digitalizados (OCR)?', 'Ainda não. Se o PDF for uma digitalização, a página é inserida como imagem e a ferramenta avisa.'],
                    ['Quais são os limites?', 'Até {pdfConvertMaxMb} MB e {pdfConvertMaxPages} páginas por PDF, e {conversions} conversões por hora.']
                ]
            }
        }
    },
    {
        id: 'rotate',
        type: 'pdf-task',
        tool: 'pdf',
        slugs: { en: 'rotate-pdf', es: 'girar-pdf', pt: 'rodar-pdf' },
        copy: {
            en: {
                title: 'Rotate PDF pages online for free',
                description: 'Rotate one, several or all pages of a PDF by 90°, 180° or 270° and save the result. Done in your browser, no upload, no quality loss. Free, no ads.',
                h1: 'Rotate PDF pages',
                lead: 'Fix pages that came out sideways or upside down. Rotate one page, a selection or the whole document and save it again — without uploading it.',
                steps: [
                    'Drop the PDF above. Every page appears as a thumbnail.',
                    'Click the pages you want to turn (Shift-click selects a range) and press Rotate; each click turns them 90° clockwise. The ↻ button on a page turns just that one.',
                    'Press Download PDF when every page faces the right way.'
                ],
                sections: [
                    ['No loss of quality', 'Rotation changes the orientation recorded in the PDF; the content of the page is not redrawn, so text stays sharp and selectable.'],
                    ['Mixed documents', 'Scanned contracts often mix portrait and landscape pages. You can turn only the ones that need it and leave the rest as they are.']
                ],
                faq: [
                    ['Can I rotate only some pages?', 'Yes. Select those pages and press Rotate, or use the ↻ button on each page.'],
                    ['Is the rotation permanent?', 'Yes, in the PDF you download. Your original file is not modified.'],
                    ['Can I undo a rotation?', 'Yes, with Undo, or by rotating the page three more times.']
                ]
            },
            es: {
                title: 'Girar páginas de PDF online gratis',
                description: 'Gira una, varias o todas las páginas de un PDF 90°, 180° o 270°. En tu navegador, sin subirlo y sin perder calidad. Gratis y sin anuncios.',
                h1: 'Girar páginas de un PDF',
                lead: 'Arregla las páginas que salieron de lado o al revés. Gira una página, una selección o todo el documento y vuelve a guardarlo, sin subirlo.',
                steps: [
                    'Suelta el PDF arriba. Cada página aparece en miniatura.',
                    'Haz clic en las páginas que quieres girar (con Mayús seleccionas un rango) y pulsa Girar; cada clic las gira 90° en el sentido de las agujas del reloj. El botón ↻ de una página gira solo esa.',
                    'Pulsa Descargar PDF cuando todas las páginas estén derechas.'
                ],
                sections: [
                    ['Sin perder calidad', 'El giro cambia la orientación que guarda el PDF; el contenido de la página no se vuelve a dibujar, así que el texto sigue nítido y seleccionable.'],
                    ['Documentos mezclados', 'Los contratos escaneados suelen mezclar páginas verticales y horizontales. Puedes girar solo las que lo necesitan y dejar el resto como está.']
                ],
                faq: [
                    ['¿Puedo girar solo algunas páginas?', 'Sí. Selecciónalas y pulsa Girar, o usa el botón ↻ de cada página.'],
                    ['¿El giro es permanente?', 'Sí, en el PDF que descargas. Tu archivo original no se modifica.'],
                    ['¿Puedo deshacer un giro?', 'Sí, con Deshacer, o girando la página tres veces más.']
                ]
            },
            pt: {
                title: 'Rodar páginas de PDF online grátis',
                description: 'Rode uma, várias ou todas as páginas de um PDF 90°, 180° ou 270°. No seu navegador, sem envio e sem perder qualidade. Grátis e sem anúncios.',
                h1: 'Rodar páginas de um PDF',
                lead: 'Corrija as páginas que ficaram de lado ou ao contrário. Rode uma página, uma seleção ou o documento inteiro e guarde-o de novo, sem o enviar.',
                steps: [
                    'Largue o PDF acima. Cada página aparece em miniatura.',
                    'Clique nas páginas que quer rodar (com Shift seleciona um intervalo) e prima Rodar; cada clique roda-as 90° no sentido dos ponteiros do relógio. O botão ↻ de uma página roda só essa.',
                    'Prima Transferir PDF quando todas as páginas estiverem direitas.'
                ],
                sections: [
                    ['Sem perder qualidade', 'A rotação altera a orientação que o PDF guarda; o conteúdo da página não é redesenhado, por isso o texto continua nítido e selecionável.'],
                    ['Documentos mistos', 'Os contratos digitalizados misturam muitas vezes páginas verticais e horizontais. Pode rodar só as que precisam e deixar as restantes como estão.']
                ],
                faq: [
                    ['Posso rodar só algumas páginas?', 'Sim. Selecione-as e prima Rodar, ou use o botão ↻ de cada página.'],
                    ['A rotação é permanente?', 'Sim, no PDF que transfere. O seu ficheiro original não é alterado.'],
                    ['Posso anular uma rotação?', 'Sim, com Anular, ou rodando a página mais três vezes.']
                ]
            }
        }
    },
    {
        id: 'delete-pages',
        type: 'pdf-task',
        tool: 'pdf',
        slugs: { en: 'delete-pdf-pages', es: 'eliminar-paginas-pdf', pt: 'eliminar-paginas-pdf' },
        copy: {
            en: {
                title: 'Delete pages from a PDF online, free',
                description: 'Remove pages from a PDF and download the shorter document. Select the pages, delete them and undo if needed. Done in your browser, no upload. Free, no ads.',
                h1: 'Delete pages from a PDF',
                lead: 'Remove blank pages, covers, duplicates or anything you do not want to share, and save a clean copy of the PDF.',
                steps: [
                    'Drop the PDF above and look through the thumbnails.',
                    'Click the pages to remove and press Delete — or use the × on a single page. Undo brings them back.',
                    'Press Download PDF to save the document without those pages.'
                ],
                sections: [
                    ['A clean copy to share', 'Deleting pages is the quickest way to send only the part of a document that matters: the signed page of a contract, one chapter of a report, the invoices of a single month.'],
                    ['Nothing leaves your device', 'Pages are removed by your browser. The PDF is not uploaded, so you can use it with documents that contain personal data.']
                ],
                faq: [
                    ['Is my original PDF changed?', 'No. You download a new PDF; the original file stays as it was.'],
                    ['Can I delete many pages at once?', 'Yes. Use Select all or Shift-click to select a range, then press Delete.'],
                    ['Can I recover a deleted page?', 'Yes, with Undo, as long as you have not reset the editor.']
                ]
            },
            es: {
                title: 'Eliminar páginas de un PDF online gratis',
                description: 'Quita páginas de un PDF y descarga el documento más corto. Selecciona las páginas, elimínalas y deshaz si hace falta. En tu navegador, sin subirlo. Gratis.',
                h1: 'Eliminar páginas de un PDF',
                lead: 'Quita páginas en blanco, portadas, duplicados o lo que no quieras compartir, y guarda una copia limpia del PDF.',
                steps: [
                    'Suelta el PDF arriba y revisa las miniaturas.',
                    'Haz clic en las páginas que quieres quitar y pulsa Eliminar, o usa la × de una página. Deshacer las recupera.',
                    'Pulsa Descargar PDF para guardar el documento sin esas páginas.'
                ],
                sections: [
                    ['Una copia limpia para compartir', 'Eliminar páginas es la forma más rápida de enviar solo la parte que importa de un documento: la página firmada de un contrato, un capítulo de un informe, las facturas de un solo mes.'],
                    ['Nada sale de tu dispositivo', 'Las páginas las quita tu navegador. El PDF no se sube, así que puedes usarlo con documentos que contienen datos personales.']
                ],
                faq: [
                    ['¿Se modifica mi PDF original?', 'No. Descargas un PDF nuevo; el archivo original queda como estaba.'],
                    ['¿Puedo eliminar muchas páginas a la vez?', 'Sí. Usa Seleccionar todo o haz clic con Mayús para seleccionar un rango, y pulsa Eliminar.'],
                    ['¿Puedo recuperar una página eliminada?', 'Sí, con Deshacer, siempre que no hayas reiniciado el editor.']
                ]
            },
            pt: {
                title: 'Eliminar páginas de um PDF online grátis',
                description: 'Retire páginas de um PDF e transfira o documento mais curto. Selecione as páginas, elimine-as e anule se for preciso. No seu navegador, sem envio. Grátis.',
                h1: 'Eliminar páginas de um PDF',
                lead: 'Retire páginas em branco, capas, duplicados ou o que não quer partilhar, e guarde uma cópia limpa do PDF.',
                steps: [
                    'Largue o PDF acima e reveja as miniaturas.',
                    'Clique nas páginas a retirar e prima Eliminar, ou use o × de uma página. Anular recupera-as.',
                    'Prima Transferir PDF para guardar o documento sem essas páginas.'
                ],
                sections: [
                    ['Uma cópia limpa para partilhar', 'Eliminar páginas é a forma mais rápida de enviar só a parte importante de um documento: a página assinada de um contrato, um capítulo de um relatório, as faturas de um só mês.'],
                    ['Nada sai do seu dispositivo', 'As páginas são retiradas pelo seu navegador. O PDF não é enviado, por isso pode usá-lo com documentos que contêm dados pessoais.']
                ],
                faq: [
                    ['O meu PDF original é alterado?', 'Não. Transfere um PDF novo; o ficheiro original fica como estava.'],
                    ['Posso eliminar muitas páginas de uma vez?', 'Sim. Use Selecionar tudo ou clique com Shift para selecionar um intervalo, e prima Eliminar.'],
                    ['Posso recuperar uma página eliminada?', 'Sim, com Anular, desde que não tenha recomeçado o editor.']
                ]
            }
        }
    },
    {
        id: 'organize',
        type: 'pdf-task',
        tool: 'pdf',
        slugs: { en: 'organize-pdf', es: 'ordenar-paginas-pdf', pt: 'ordenar-paginas-pdf' },
        copy: {
            en: {
                title: 'Reorder PDF pages online for free',
                description: 'Change the order of the pages of a PDF by dragging them, then save the new document. Works on computer and phone, in your browser, no upload. Free, no ads.',
                h1: 'Reorder the pages of a PDF',
                lead: 'Put the pages of a PDF in the right order by dragging them. Move one page or a whole selection, then download the reorganised document.',
                steps: [
                    'Drop the PDF above. Each page appears with its number.',
                    'Drag a page to its new place. If several pages are selected, they move together. On a phone, hold a page for a moment before dragging.',
                    'Press Download PDF to save the new order.'
                ],
                sections: [
                    ['Drag, keyboard or buttons', 'Use whatever is most comfortable: drag with the mouse, use the ‹ and › buttons on each page, or focus a page and press Alt + arrow keys to move it.'],
                    ['Across several files', 'Add more PDFs to the editor and you can mix their pages in a single new order before saving.']
                ],
                faq: [
                    ['Can I move several pages at once?', 'Yes. Select them first; dragging one of them moves the whole selection.'],
                    ['Does it work on a phone or tablet?', 'Yes. Hold a page until it lifts, then drag it.'],
                    ['Can I undo a move?', 'Yes. Undo goes back step by step.']
                ]
            },
            es: {
                title: 'Ordenar páginas de un PDF online gratis',
                description: 'Cambia el orden de las páginas de un PDF arrastrándolas y guarda el documento nuevo, en tu navegador y sin subirlo. Gratis y sin anuncios.',
                h1: 'Ordenar las páginas de un PDF',
                lead: 'Pon las páginas de un PDF en el orden correcto arrastrándolas. Mueve una página o una selección entera y descarga el documento reorganizado.',
                steps: [
                    'Suelta el PDF arriba. Cada página aparece con su número.',
                    'Arrastra una página a su nuevo sitio. Si hay varias seleccionadas, se mueven juntas. En el teléfono, mantén pulsada la página un momento antes de arrastrar.',
                    'Pulsa Descargar PDF para guardar el nuevo orden.'
                ],
                sections: [
                    ['Arrastrar, teclado o botones', 'Usa lo que te resulte más cómodo: arrastrar con el ratón, los botones ‹ y › de cada página, o seleccionar una página y pulsar Alt + flechas para moverla.'],
                    ['Entre varios archivos', 'Añade más PDF al editor y podrás mezclar sus páginas en un único orden nuevo antes de guardar.']
                ],
                faq: [
                    ['¿Puedo mover varias páginas a la vez?', 'Sí. Selecciónalas primero; al arrastrar una de ellas se mueve toda la selección.'],
                    ['¿Funciona en el teléfono o la tableta?', 'Sí. Mantén pulsada una página hasta que se levante y arrástrala.'],
                    ['¿Puedo deshacer un movimiento?', 'Sí. Deshacer vuelve atrás paso a paso.']
                ]
            },
            pt: {
                title: 'Ordenar páginas de um PDF online grátis',
                description: 'Mude a ordem das páginas de um PDF arrastando-as e guarde o documento novo. No computador e no telemóvel, no seu navegador, sem envio. Grátis e sem anúncios.',
                h1: 'Ordenar as páginas de um PDF',
                lead: 'Ponha as páginas de um PDF na ordem certa arrastando-as. Mova uma página ou uma seleção inteira e transfira o documento reorganizado.',
                steps: [
                    'Largue o PDF acima. Cada página aparece com o seu número.',
                    'Arraste uma página para o novo lugar. Se houver várias selecionadas, movem-se juntas. No telemóvel, mantenha a página premida um momento antes de arrastar.',
                    'Prima Transferir PDF para guardar a nova ordem.'
                ],
                sections: [
                    ['Arrastar, teclado ou botões', 'Use o que for mais confortável: arrastar com o rato, os botões ‹ e › de cada página, ou selecionar uma página e premir Alt + setas para a mover.'],
                    ['Entre vários ficheiros', 'Adicione mais PDF ao editor e poderá misturar as suas páginas numa única ordem nova antes de guardar.']
                ],
                faq: [
                    ['Posso mover várias páginas de uma vez?', 'Sim. Selecione-as primeiro; ao arrastar uma delas move-se a seleção inteira.'],
                    ['Funciona no telemóvel ou no tablet?', 'Sim. Mantenha uma página premida até levantar e arraste-a.'],
                    ['Posso anular um movimento?', 'Sim. Anular volta atrás passo a passo.']
                ]
            }
        }
    },
    {
        id: 'extract',
        type: 'pdf-task',
        tool: 'pdf',
        slugs: { en: 'extract-pdf-pages', es: 'extraer-paginas-pdf', pt: 'extrair-paginas-pdf' },
        copy: {
            en: {
                title: 'Extract pages from a PDF online, free',
                description: 'Select pages of a PDF and download them as a new file. Ideal for splitting a PDF or sending only part of it. In your browser, no upload. Free, no ads.',
                h1: 'Extract pages from a PDF',
                lead: 'Pick the pages you need and save them as a new PDF, leaving the original untouched. A simple way to split a document.',
                steps: [
                    'Drop the PDF above.',
                    'Click the pages you want to keep; Shift-click selects a whole range.',
                    'Press Download selected pages. Repeat with another selection to split the document into several files.'
                ],
                sections: [
                    ['Split a PDF in parts', 'To split a document, select the first part and download it, then select the next one. Each download is an independent PDF with its own name.'],
                    ['Keep the order you choose', 'The extracted file keeps the order shown in the editor, so you can also reorder or rotate pages before extracting them.']
                ],
                faq: [
                    ['Does extracting remove pages from my original?', 'No. The original file is not modified; you get a new PDF with the selected pages.'],
                    ['Can I extract pages from several PDFs at once?', 'Yes. Add the files, select pages from any of them and download the selection as one PDF.'],
                    ['Is there a page limit?', 'No fixed limit; files can be up to {pdfEditMaxMb} MB each.']
                ]
            },
            es: {
                title: 'Extraer páginas de un PDF online gratis',
                description: 'Selecciona páginas de un PDF y descárgalas como un archivo nuevo. Ideal para dividir un PDF o enviar solo una parte. En tu navegador, sin subirlo. Gratis.',
                h1: 'Extraer páginas de un PDF',
                lead: 'Elige las páginas que necesitas y guárdalas como un PDF nuevo, sin tocar el original. Una forma sencilla de dividir un documento.',
                steps: [
                    'Suelta el PDF arriba.',
                    'Haz clic en las páginas que quieres conservar; con Mayús seleccionas un rango entero.',
                    'Pulsa Descargar páginas seleccionadas. Repite con otra selección para dividir el documento en varios archivos.'
                ],
                sections: [
                    ['Dividir un PDF en partes', 'Para dividir un documento, selecciona la primera parte y descárgala; luego selecciona la siguiente. Cada descarga es un PDF independiente con su propio nombre.'],
                    ['Con el orden que elijas', 'El archivo extraído conserva el orden que ves en el editor, así que también puedes ordenar o girar páginas antes de extraerlas.']
                ],
                faq: [
                    ['¿Extraer quita páginas de mi original?', 'No. El archivo original no se modifica; recibes un PDF nuevo con las páginas seleccionadas.'],
                    ['¿Puedo extraer páginas de varios PDF a la vez?', 'Sí. Añade los archivos, selecciona páginas de cualquiera de ellos y descarga la selección como un solo PDF.'],
                    ['¿Hay un límite de páginas?', 'No hay un límite fijo; cada archivo puede tener hasta {pdfEditMaxMb} MB.']
                ]
            },
            pt: {
                title: 'Extrair páginas de um PDF online grátis',
                description: 'Selecione páginas de um PDF e transfira-as como um ficheiro novo. Ideal para dividir um PDF ou enviar só uma parte. No seu navegador, sem envio. Grátis.',
                h1: 'Extrair páginas de um PDF',
                lead: 'Escolha as páginas de que precisa e guarde-as como um PDF novo, sem tocar no original. Uma forma simples de dividir um documento.',
                steps: [
                    'Largue o PDF acima.',
                    'Clique nas páginas que quer manter; com Shift seleciona um intervalo inteiro.',
                    'Prima Transferir páginas selecionadas. Repita com outra seleção para dividir o documento em vários ficheiros.'
                ],
                sections: [
                    ['Dividir um PDF em partes', 'Para dividir um documento, selecione a primeira parte e transfira-a; depois selecione a seguinte. Cada transferência é um PDF independente com o seu próprio nome.'],
                    ['Com a ordem que escolher', 'O ficheiro extraído mantém a ordem que vê no editor, por isso também pode ordenar ou rodar páginas antes de as extrair.']
                ],
                faq: [
                    ['Extrair retira páginas do meu original?', 'Não. O ficheiro original não é alterado; recebe um PDF novo com as páginas selecionadas.'],
                    ['Posso extrair páginas de vários PDF de uma vez?', 'Sim. Adicione os ficheiros, selecione páginas de qualquer um e transfira a seleção como um único PDF.'],
                    ['Há um limite de páginas?', 'Não há um limite fixo; cada ficheiro pode ter até {pdfEditMaxMb} MB.']
                ]
            }
        }
    },
    {
        id: 'legal',
        type: 'legal',
        slugs: { en: 'privacy-and-terms', es: 'privacidad-y-condiciones', pt: 'privacidade-e-condicoes' },
        copy: {
            en: {
                title: 'Privacy and terms of use',
                description: 'How Elysium Tools handles your links and files, what data is processed and the terms for using the free video downloader and PDF editor.',
                h1: 'Privacy and terms of use',
                lead: 'Elysium Tools is run by Elysium λ Development & Research (NIF 321979257PT, Bragança, Portugal). This page explains what happens to your data and the rules for using the tools. Questions: info@elysiumdr.eu.',
                sections: [
                    ['What we process', 'To download a video, the server receives the link you paste, fetches the video from the platform and keeps the resulting file for {fileMinutes} minutes so your browser can save it; then it is deleted. To convert a PDF to Word, the server receives the edited PDF, deletes it as soon as the Word file exists and deletes the Word file after {fileMinutes} minutes. PDF pages edited in the browser (merge, reorder, rotate, delete, extract) never reach our servers.'],
                    ['IP address, limits and protection against abuse', 'To keep the service free and available, each operation is checked by Cloudflare Turnstile, which helps tell people from automated abuse, and counted against hourly limits. The limits use a one-way, keyed hash of your IP address that is kept in memory for one hour and never stored with your links or files. Cloudflare processes connection data as our infrastructure provider.'],
                    ['No ads, no tracking, no accounts', 'The tools have no advertising, no advertising or analytics cookies and no user accounts. We do not sell or share data. The legal basis for the processing described is your request to use the tool and our legitimate interest in preventing abuse (Article 6(1)(b) and (f) GDPR). You can exercise your rights of access, erasure, objection and the others in the GDPR by writing to info@elysiumdr.eu, and complain to the Portuguese data-protection authority (CNPD).'],
                    ['Acceptable use and copyright', 'Use the tools only with content you own or have permission to use, and respect the terms of each platform. Do not use the tools to infringe copyright or for automated bulk downloading. Rights holders can report misuse to info@elysiumdr.eu. The tools do not store or republish content.'],
                    ['No warranty', 'The tools are provided free of charge, as they are, without guarantees of availability or results. Platforms change constantly and a link that works today may stop working. To the extent permitted by law, Elysium is not liable for losses arising from their use. These terms are governed by Portuguese law.'],
                    ['Open-source software', 'The PDF editor runs pdf.js (Apache 2.0) and pdf-lib (MIT) in your browser. On the server, the video downloader uses yt-dlp (Unlicense) and FFmpeg (LGPL/GPL), and Word conversion uses pdf2docx (MIT) with PyMuPDF (GNU AGPL v3), all without modifications. The source code of the Elysium components that work with them is available on request at info@elysiumdr.eu.']
                ]
            },
            es: {
                title: 'Privacidad y condiciones de uso',
                description: 'Cómo trata Elysium Tools tus enlaces y archivos, qué datos se procesan y las condiciones de uso del descargador de videos y el editor de PDF gratis.',
                h1: 'Privacidad y condiciones de uso',
                lead: 'Elysium Tools lo gestiona Elysium λ Development & Research (NIF 321979257PT, Bragança, Portugal). Esta página explica qué ocurre con tus datos y las reglas de uso de las herramientas. Dudas: info@elysiumdr.eu.',
                sections: [
                    ['Qué procesamos', 'Para descargar un video, el servidor recibe el enlace que pegas, obtiene el video de la plataforma y guarda el archivo resultante {fileMinutes} minutos para que tu navegador lo descargue; después se borra. Para convertir un PDF a Word, el servidor recibe el PDF editado, lo borra en cuanto existe el Word y borra el Word a los {fileMinutes} minutos. Las páginas de PDF que editas en el navegador (unir, ordenar, girar, eliminar, extraer) nunca llegan a nuestros servidores.'],
                    ['Dirección IP, límites y protección contra abusos', 'Para que el servicio siga siendo gratis y disponible, cada operación pasa por Cloudflare Turnstile, que ayuda a distinguir a las personas del abuso automatizado, y cuenta para los límites por hora. Los límites usan un resumen cifrado e irreversible de tu dirección IP que se guarda en memoria durante una hora y nunca junto a tus enlaces o archivos. Cloudflare trata los datos de conexión como proveedor de nuestra infraestructura.'],
                    ['Sin anuncios, sin rastreo, sin cuentas', 'Las herramientas no tienen publicidad, ni cookies publicitarias o de analítica, ni cuentas de usuario. No vendemos ni cedemos datos. La base legal del tratamiento descrito es tu solicitud de usar la herramienta y nuestro interés legítimo en evitar abusos (artículo 6.1.b y 6.1.f del RGPD). Puedes ejercer tus derechos de acceso, supresión, oposición y los demás del RGPD escribiendo a info@elysiumdr.eu, y reclamar ante la autoridad portuguesa de protección de datos (CNPD).'],
                    ['Uso aceptable y derechos de autor', 'Usa las herramientas solo con contenido propio o que tengas permiso para usar, y respeta las condiciones de cada plataforma. No las uses para infringir derechos de autor ni para descargas masivas automatizadas. Quien tenga derechos sobre un contenido puede comunicar un uso indebido a info@elysiumdr.eu. Las herramientas no almacenan ni republican contenido.'],
                    ['Sin garantía', 'Las herramientas se ofrecen gratis, tal como son, sin garantías de disponibilidad ni de resultados. Las plataformas cambian constantemente y un enlace que funciona hoy puede dejar de hacerlo. En la medida en que la ley lo permite, Elysium no responde de los perjuicios derivados de su uso. Estas condiciones se rigen por la ley portuguesa.'],
                    ['Software de código abierto', 'El editor de PDF usa pdf.js (Apache 2.0) y pdf-lib (MIT) en tu navegador. En el servidor, el descargador de videos usa yt-dlp (Unlicense) y FFmpeg (LGPL/GPL), y la conversión a Word usa pdf2docx (MIT) con PyMuPDF (GNU AGPL v3), todos sin modificar. El código de los componentes de Elysium que trabajan con ellos está disponible a petición en info@elysiumdr.eu.']
                ]
            },
            pt: {
                title: 'Privacidade e condições de utilização',
                description: 'Como a Elysium Tools trata as suas ligações e ficheiros, que dados processa e as condições de utilização do descarregador de vídeos e do editor de PDF.',
                h1: 'Privacidade e condições de utilização',
                lead: 'A Elysium Tools é gerida pela Elysium λ Development & Research (NIF 321979257PT, Bragança, Portugal). Esta página explica o que acontece aos seus dados e as regras de utilização das ferramentas. Dúvidas: info@elysiumdr.eu.',
                sections: [
                    ['O que processamos', 'Para descarregar um vídeo, o servidor recebe a ligação que cola, obtém o vídeo da plataforma e guarda o ficheiro resultante {fileMinutes} minutos para o seu navegador o transferir; depois é apagado. Para converter um PDF para Word, o servidor recebe o PDF editado, apaga-o assim que o Word existe e apaga o Word ao fim de {fileMinutes} minutos. As páginas de PDF que edita no navegador (juntar, ordenar, rodar, eliminar, extrair) nunca chegam aos nossos servidores.'],
                    ['Endereço IP, limites e proteção contra abusos', 'Para o serviço continuar grátis e disponível, cada operação passa pelo Cloudflare Turnstile, que ajuda a distinguir as pessoas do abuso automatizado, e conta para os limites por hora. Os limites usam um resumo cifrado e irreversível do seu endereço IP, guardado em memória durante uma hora e nunca junto das suas ligações ou ficheiros. A Cloudflare trata os dados de ligação como fornecedora da nossa infraestrutura.'],
                    ['Sem anúncios, sem rastreio, sem contas', 'As ferramentas não têm publicidade, nem cookies publicitários ou de análise, nem contas de utilizador. Não vendemos nem cedemos dados. O fundamento jurídico do tratamento descrito é o seu pedido de utilizar a ferramenta e o nosso interesse legítimo em evitar abusos (artigo 6.º, n.º 1, alíneas b) e f), do RGPD). Pode exercer os seus direitos de acesso, apagamento, oposição e os restantes do RGPD escrevendo para info@elysiumdr.eu, e apresentar reclamação à CNPD.'],
                    ['Utilização aceitável e direitos de autor', 'Use as ferramentas apenas com conteúdo próprio ou que tenha autorização para usar, e respeite as condições de cada plataforma. Não as use para violar direitos de autor nem para descargas massivas automatizadas. Quem tenha direitos sobre um conteúdo pode comunicar uma utilização indevida para info@elysiumdr.eu. As ferramentas não armazenam nem republicam conteúdo.'],
                    ['Sem garantia', 'As ferramentas são oferecidas gratuitamente, tal como são, sem garantias de disponibilidade nem de resultados. As plataformas mudam constantemente e uma ligação que funciona hoje pode deixar de funcionar. Na medida permitida por lei, a Elysium não responde por prejuízos decorrentes da sua utilização. Estas condições regem-se pela lei portuguesa.'],
                    ['Software de código aberto', 'O editor de PDF usa o pdf.js (Apache 2.0) e o pdf-lib (MIT) no seu navegador. No servidor, o descarregador de vídeos usa o yt-dlp (Unlicense) e o FFmpeg (LGPL/GPL), e a conversão para Word usa o pdf2docx (MIT) com o PyMuPDF (GNU AGPL v3), todos sem modificações. O código dos componentes da Elysium que trabalham com eles está disponível a pedido em info@elysiumdr.eu.']
                ]
            }
        }
    }
];

/** Los textos del 404, por idioma. */
export const NOT_FOUND = {
    en: { title: 'Page not found', h1: 'This page does not exist', lead: 'The address may be mistyped or the tool may have moved. These are the tools available today:' },
    es: { title: 'Página no encontrada', h1: 'Esta página no existe', lead: 'Puede que la dirección esté mal escrita o que la herramienta se haya movido. Estas son las herramientas disponibles hoy:' },
    pt: { title: 'Página não encontrada', h1: 'Esta página não existe', lead: 'O endereço pode estar mal escrito ou a ferramenta pode ter mudado de sítio. Estas são as ferramentas disponíveis hoje:' }
};
