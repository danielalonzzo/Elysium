/**
 * Elysium — traducción dinámica de los sitios nacionales.
 *
 * Este fichero tiene un límite deliberado: solo actúa en elysiumdr.es,
 * elysiumdr.pt y elysiumdr.com/cr/. El dominio europeo usa documentos físicos
 * (/ , /es/ y /pt/) para sus tres idiomas nativos y no pasa por aquí; sus otros
 * 22 idiomas los traduce en vivo `JS/elysium-translate.js` (Google Website
 * Translator), que a su vez solo actúa en `.eu`.
 *
 * Para pruebas locales se puede activar explícitamente con
 * `?national=es`, `?national=pt` o `?national=cr` (o visitando `/cr/`). Sin
 * eso localhost se comporta igual que el dominio europeo y este motor queda
 * inerte.
 */
(function () {
    'use strict';

    const SUPPORTED_LANGUAGES = new Set(['en', 'es', 'pt']);
    const STORAGE_KEY = 'elysium_lang_pref';
    const QUERY_OVERRIDE_KEY_PREFIX = 'elysium_lang_query_override:';
    const ENGINE_MARKER = '__elysiumNationalI18n';

    const LANGUAGE_TAGS = {
        en: 'en-GB',
        es: 'es-ES',
        pt: 'pt-PT'
    };

    // Las banderas representan la opción lingüística dentro de los dos
    // dominios nacionales. Las rutas desde la raíz funcionan en cualquier
    // profundidad y en ambos hosts.
    const LANGUAGE_UI = {
        en: {
            shortLabel: 'EN',
            image: '/Images/Optimized/flag-eu-64.webp',
            imageAlt: 'EU',
            names: { en: 'English', es: 'Inglés', pt: 'Inglês' }
        },
        es: {
            shortLabel: 'ES',
            image: '/Images/Optimized/flag-es-64.webp',
            imageAlt: 'ES',
            names: { en: 'Spanish', es: 'Español', pt: 'Espanhol' }
        },
        pt: {
            shortLabel: 'PT',
            image: '/Images/Optimized/flag-pt-64.webp',
            imageAlt: 'PT',
            names: { en: 'Portuguese', es: 'Portugués', pt: 'Português' }
        }
    };

    const INTERFACE_TEXT = {
        en: {
            selectLanguage: 'Select language',
            switchTo: 'Switch language to',
            selectRegion: 'Select region',
            closeDialog: 'Close dialog',
            regions: { EU: 'EUROPE', ES: 'SPAIN', PT: 'PORTUGAL', CR: 'COSTA RICA', GLOBAL: 'GLOBAL' }
        },
        es: {
            selectLanguage: 'Seleccionar idioma',
            switchTo: 'Cambiar idioma a',
            selectRegion: 'Seleccionar región',
            closeDialog: 'Cerrar diálogo',
            regions: { EU: 'EUROPA', ES: 'ESPAÑA', PT: 'PORTUGAL', CR: 'COSTA RICA', GLOBAL: 'GLOBAL' }
        },
        pt: {
            selectLanguage: 'Selecionar idioma',
            switchTo: 'Mudar idioma para',
            selectRegion: 'Selecionar região',
            closeDialog: 'Fechar diálogo',
            regions: { EU: 'EUROPA', ES: 'ESPANHA', PT: 'PORTUGAL', CR: 'COSTA RICA', GLOBAL: 'GLOBAL' }
        }
    };

    // Solo estos atributos contienen lenguaje humano. Los atributos de estado
    // (por ejemplo aria-expanded) se conservan para no romper widgets abiertos.
    const TRANSLATABLE_ATTRIBUTES = [
        'aria-label',
        'aria-description',
        'aria-placeholder',
        'aria-roledescription',
        'aria-valuetext',
        'title',
        'placeholder',
        'alt'
    ];

    const PROTECTED_SELECTOR = '.region-switcher-dropdown, .lang-switcher-dropdown';
    const SKIPPED_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE']);
    const TRANSIENT_CLASSES = new Set([
        'active', 'closing', 'fade-in', 'hidden', 'is-expanded', 'is-loaded',
        'is-open', 'is-visible', 'reveal-pending', 'slide-in', 'slide-out'
    ]);

    const HOME_COPY = {
        ES: {
            en: {
                hero: 'Digital Infrastructure for small businesses and entrepreneurs in Spain:',
                ctaTitle: 'Elevate Your Digital Presence',
                ctaText: 'Digital ecosystem for your business. Built on Spanish values.',
                ctaButton: 'Schedule a Consultation',
                footer: 'Elysium λ Development & Research<br>Spain, European Union',
                serviceNote: 'Serving businesses throughout Europe and the Americas.',
                description: 'Subscription-based digital infrastructure for small businesses and entrepreneurs in Spain: cloud systems, bespoke CRM, cybersecurity and applied R&D, with no development costs.'
            },
            es: {
                hero: 'Infraestructura Digital para pequeñas empresas y emprendedores de España:',
                ctaTitle: 'Eleve su presencia digital',
                ctaText: 'Ecosistema digital para su empresa. Construido sobre valores españoles.',
                ctaButton: 'Agendar consulta',
                footer: 'Elysium λ Development & Research<br>España, Unión Europea',
                serviceNote: 'Prestamos servicio a empresas de toda Europa y las Américas.',
                description: 'Infraestructura digital por suscripción para pequeñas empresas y emprendedores en España: sistemas cloud, CRM a medida, ciberseguridad e I+D aplicada, sin costes de desarrollo.'
            },
            pt: {
                hero: 'Infraestrutura Digital para pequenas empresas e empreendedores de Espanha:',
                ctaTitle: 'Eleve a sua presença digital',
                ctaText: 'Ecossistema digital para a sua empresa. Construído sobre valores espanhóis.',
                ctaButton: 'Agendar consulta',
                footer: 'Elysium λ Development & Research<br>Espanha, União Europeia',
                serviceNote: 'Prestamos serviços a empresas em toda a Europa e nas Américas.',
                description: 'Infraestrutura digital por subscrição para pequenas empresas e empreendedores em Espanha: sistemas cloud, CRM à medida, cibersegurança e I&D aplicada, sem custos de desenvolvimento.'
            }
        },
        PT: {
            en: {
                hero: 'Digital Infrastructure for small businesses and startups in Portugal:',
                ctaTitle: 'Elevate Your Digital Presence',
                ctaText: 'Digital ecosystem for your business. Built on Portuguese values.',
                ctaButton: 'Schedule a Consultation',
                footer: 'Elysium λ Development & Research<br>Portugal, European Union',
                serviceNote: 'Serving businesses throughout Europe and the Americas.',
                description: 'Subscription-based digital infrastructure for small businesses and startups in Portugal: cloud systems, bespoke CRM, cybersecurity and applied R&D, with no development costs.'
            },
            es: {
                hero: 'Infraestructura Digital para pequeñas empresas y startups de Portugal:',
                ctaTitle: 'Eleve su presencia digital',
                ctaText: 'Ecosistema digital para su empresa. Construido sobre valores portugueses.',
                ctaButton: 'Agendar consulta',
                footer: 'Elysium λ Development & Research<br>Portugal, Unión Europea',
                serviceNote: 'Prestamos servicio a empresas de toda Europa y las Américas.',
                description: 'Infraestructura digital por suscripción para pequeñas empresas y startups en Portugal: sistemas cloud, CRM a medida, ciberseguridad e I+D aplicada, sin costes de desarrollo.'
            },
            pt: {
                hero: 'Infraestrutura Digital para pequenas empresas e startups de Portugal:',
                ctaTitle: 'Eleve a sua presença digital',
                ctaText: 'Ecossistema digital para a sua empresa. Construído sobre valores portugueses.',
                ctaButton: 'Agendar consulta',
                footer: 'Elysium λ Development & Research<br>Portugal, União Europeia',
                serviceNote: 'Prestamos serviços a empresas em toda a Europa e nas Américas.',
                description: 'Infraestrutura digital por subscrição para pequenas empresas e startups em Portugal: sistemas cloud, CRM à medida, cibersegurança e I&D aplicada, sem custos de desenvolvimento.'
            }
        },
        CR: {
            en: {
                hero: 'Digital Infrastructure for small businesses and entrepreneurs in Costa Rica:',
                ctaTitle: 'Elevate Your Digital Presence',
                ctaText: 'Digital ecosystem for your business. Built to empower businesses in Costa Rica.',
                ctaButton: 'Schedule a Consultation',
                footer: 'Elysium λ Development & Research<br>Costa Rica',
                serviceNote: 'Serving businesses throughout Costa Rica, the Americas, and Europe.',
                description: 'Subscription-based digital infrastructure for small businesses and entrepreneurs in Costa Rica: cloud systems, bespoke CRM, cybersecurity and applied R&D, with no development costs.'
            },
            es: {
                hero: 'Infraestructura Digital para pequeñas empresas y emprendedores de Costa Rica:',
                ctaTitle: 'Eleve su Presencia Digital',
                ctaText: 'Ecosistema digital para su empresa. Construido para impulsar empresas de Costa Rica.',
                ctaButton: 'Agendar Consulta',
                footer: 'Elysium λ Development & Research<br>Costa Rica',
                serviceNote: 'Damos servicio a empresas en toda Costa Rica, Iberoamérica y Europa.',
                description: 'Infraestructura digital por suscripción para pequeñas empresas y emprendedores en Costa Rica: sistemas cloud, CRM a medida, ciberseguridad e I+D aplicada, sin costos de desarrollo.'
            },
            pt: {
                hero: 'Infraestrutura Digital para pequenas empresas e empreendedores da Costa Rica:',
                ctaTitle: 'Eleve a sua presença digital',
                ctaText: 'Ecossistema digital para a sua empresa. Construído para impulsionar empresas na Costa Rica.',
                ctaButton: 'Agendar consulta',
                footer: 'Elysium λ Development & Research<br>Costa Rica',
                serviceNote: 'Prestamos serviços a empresas em toda a Costa Rica, nas Américas e na Europa.',
                description: 'Infraestrutura digital por subscrição para pequenas empresas e empreendedores na Costa Rica: sistemas cloud, CRM à medida, cibersegurança e I&D aplicada, sem custos de desenvolvimento.'
            }
        }
    };

    /*
     * Las traducciones físicas de .eu describen Europa/Costa Rica/Portugal.
     * Estas frases dependen, en cambio, del dominio nacional que se está
     * visitando. Se aplican después de cada morph para que cambiar de idioma
     * nunca importe la jurisdicción de la copia usada como fuente.
     */
    const REGIONAL_PAGE_COPY = {
        ES: {
            en: {
                home: {
                    behaviour: 'We design ergonomic interfaces adapted to people and businesses in Spain.',
                    governance: 'We implement the highest cybersecurity standards and Spanish governance protocols.',
                    complianceTitle: 'Legal and Regulatory Compliance:',
                    compliance: ' We design your infrastructure in accordance with the GDPR, Spain\'s Organic Law 3/2018 (LOPDGDD), and guidance from the Spanish Data Protection Agency (AEPD).',
                    timeline: 'Testing, validation of security mechanisms (access control), and regulatory compliance audits (GDPR/LOPDGDD).',
                    research: 'Elysium λ Development & Research operates as an independent engineering, research, and IT consultancy laboratory in Spain.<br><br>Our purpose is to democratise access to high-level digital infrastructure, enabling small businesses and entrepreneurs in Spain to scale through a technological ecosystem.<br><br>We combine scientific thinking, ergonomic design, and continuous experimentation to deliver software that resolves structural inefficiencies.'
                },
                about: {
                    mission: 'To democratise access to digital infrastructure by equipping small businesses, entrepreneurs, and startups in Spain with accessible technology ecosystems that automate operations and support sustainable growth. We provide infrastructure that evolves with each business.',
                    vision: 'To become the Elysium λ Institute of Development & Research: an institute devoted to the study, development, and application of digital infrastructure, and to training new generations of scientists and developers. We aim to contribute to an innovative, increasingly digital Spain.',
                    historyIntro: 'Elysium λ Development & Research was founded with a clear purpose: to work alongside small businesses and entrepreneurs in Spain, strengthen their digital presence, and give them access to infrastructure that can scale with them.',
                    economy: 'Small businesses and entrepreneurs form the backbone of Spain\'s economy. Many remain excluded from the benefits of technological transformation by barriers of complexity, cost, and digital literacy. Elysium λ researches and develops infrastructure that makes advanced technology more accessible, transparent, and dependable for the people navigating that transformation.',
                    nameIntro: 'The name Elysium λ reflects the soul of this project:',
                    aspiration: 'Within this project, <strong>Elysium λ</strong> symbolises the aspiration to contribute to an increasingly digital and connected Spain.',
                    future: 'Beginning with digital infrastructure for small businesses and entrepreneurs, Elysium λ aims to evolve towards research and the training of scientific developers who support a Spanish digital future centred on R&D.',
                    location: 'Elysium λ Development & Research operates in Spain, providing small businesses and entrepreneurs with accessible digital infrastructure and research.',
                    description: 'Learn about the mission, vision, and history of Elysium λ Development & Research in Spain and our work on accessible digital infrastructure for small businesses and entrepreneurs.'
                },
                contact: {
                    phoneLabel: 'Telephone',
                    phoneSuffix: 'service for Spain and the European Union',
                    coverageLabel: 'Coverage',
                    coverage: 'Remote service throughout Spain and the European Union.',
                    description: 'Contact Elysium λ Development & Research in Spain about digital infrastructure, software engineering, cybersecurity, and applied research projects.'
                },
                onboarding: {
                    files: 'If these files contain third-party personal data, they are processed under our <a href="privacy" target="_blank" style="color: var(--color-accent);">Privacy Policy</a> (GDPR and LOPDGDD) exclusively to build your system.',
                    health: 'Health data (GDPR Art. 9 and LOPDGDD)',
                    consent: 'I authorise the processing of the files and datasets I have uploaded exclusively to develop my system (GDPR Art. 28 and LOPDGDD).'
                },
                services: {
                    compliance: 'GDPR, LOPDGDD, and up-to-date legal notices',
                    description: 'Digital infrastructure services for Spain, including website development, cloud systems, bespoke CRM, cybersecurity, and compliance with the GDPR and LOPDGDD.'
                },
                legal: {
                    privacyLaw: '<strong>Spain\'s Organic Law 3/2018 (LOPDGDD)</strong>',
                    territory: 'Spain and the European Union',
                    authorityName: 'Spanish Data Protection Agency (AEPD)',
                    authorityUrl: 'https://www.aepd.es',
                    cookieRule: 'Spain\'s <strong>Law 34/2002 on information society services and electronic commerce (LSSI-CE)</strong>',
                    withdrawalHeading: '3. Right of withdrawal (Spain and European Union)',
                    withdrawalBody: 'Where the client is legally a consumer and the distance contract is governed by <strong>Royal Legislative Decree 1/2007</strong>, the client will generally have <strong>14 calendar days</strong> to exercise the right of withdrawal, subject to the statutory exceptions.',
                    taxBody: 'Quotes and contracts state whether taxes are included. Transactions taxable in Spain are subject to VAT under <strong>Law 37/1992 on Value Added Tax</strong>, taking into account the place of supply, the nature of the service, and the client\'s tax status. Each invoice will show the treatment applicable to the transaction.',
                    disputeBody: 'We first seek an amicable solution through <a href="mailto:info@elysiumdr.eu">info@elysiumdr.eu</a>. If no agreement is reached, consumers may contact the competent public consumer authorities in Spain and exercise all remedies available under applicable consumer law.',
                    governingBody: 'These Terms are governed by the laws of <strong>Spain and the European Union</strong>. Disputes will be submitted to the courts with jurisdiction under applicable law. Where the user is a consumer, mandatory jurisdiction and consumer-protection rules linked to their place of residence remain unaffected.',
                    privacyDescription: 'How Elysium λ Development & Research processes and protects personal data in Spain under the GDPR and Organic Law 3/2018 (LOPDGDD), including retention, security, and data-subject rights.',
                    termsDescription: 'Terms governing Elysium λ Development & Research services in Spain, including withdrawal rights, privacy, taxation, dispute resolution, and applicable law.',
                    privacyFooter: '© 2026 Elysium λ Development & Research. All rights reserved. | <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none;">Spanish Data Protection Agency</a>',
                    termsFooter: '© 2026 Elysium λ Development & Research. All rights reserved.'
                }
            },
            es: {
                home: {
                    behaviour: 'Diseñamos interfaces ergonómicas adaptadas a las personas y empresas de España.',
                    governance: 'Implementamos los más altos estándares de ciberseguridad y protocolos de gobernanza españoles.',
                    complianceTitle: 'Cumplimiento legal y normativo:',
                    compliance: ' Diseñamos su infraestructura conforme al RGPD, la Ley Orgánica 3/2018 (LOPDGDD) y las directrices de la Agencia Española de Protección de Datos (AEPD).',
                    timeline: 'Realización de pruebas, validación de mecanismos de seguridad (control de accesos) y auditorías de cumplimiento normativo (RGPD/LOPDGDD).',
                    research: 'Elysium λ Development & Research opera como un laboratorio independiente de ingeniería, investigación y consultoría informática en España.<br><br>Nuestro propósito es democratizar el acceso a infraestructura digital de alto nivel para que las pequeñas empresas y los emprendedores de España puedan escalar mediante un ecosistema tecnológico.<br><br>Combinamos pensamiento científico, diseño ergonómico y experimentación continua para crear software que resuelve ineficiencias estructurales.'
                },
                about: {
                    mission: 'Democratizar el acceso a la infraestructura digital, dotando a las pequeñas empresas, emprendedores y startups de España de ecosistemas tecnológicos accesibles que automaticen operaciones y favorezcan un crecimiento sostenible. Proporcionamos infraestructura que evoluciona con cada negocio.',
                    vision: 'Ser el Elysium λ Institute of Development & Research: un instituto dedicado al estudio, desarrollo y aplicación de infraestructuras digitales, así como a la formación de nuevas generaciones de científicos y desarrolladores. Aspiramos a contribuir a una España innovadora y cada vez más digital.',
                    historyIntro: 'Elysium λ Development & Research fue fundada con un propósito claro: trabajar junto a las pequeñas empresas y emprendedores de España, impulsar su presencia digital y facilitarles infraestructura capaz de crecer con ellos.',
                    economy: 'Las pequeñas empresas y los emprendedores representan la columna vertebral de la economía de España. Muchas siguen excluidas de los beneficios de la transformación tecnológica por barreras de complejidad, coste y alfabetización digital. Elysium λ investiga y desarrolla infraestructuras que hacen la tecnología avanzada más accesible, transparente y fiable para quienes atraviesan esa transformación.',
                    nameIntro: 'El nombre Elysium λ refleja el alma de este proyecto:',
                    aspiration: 'En el contexto de este proyecto, <strong>Elysium λ</strong> simboliza la aspiración de contribuir a una España cada vez más digitalizada y conectada.',
                    future: 'Comenzando con infraestructura digital para pequeñas empresas y emprendedores, Elysium λ pretende evolucionar hacia la investigación y formación de desarrolladores científicos que apoyen un futuro digital español centrado en I+D.',
                    location: 'Elysium λ Development & Research opera en España ofreciendo a pequeñas empresas y emprendedores infraestructura digital e investigación accesible.',
                    description: 'Conozca la misión, visión e historia de Elysium λ Development & Research en España y nuestro trabajo en infraestructura digital accesible para pequeñas empresas y emprendedores.'
                },
                contact: {
                    phoneLabel: 'Teléfono',
                    phoneSuffix: 'atención para España y la Unión Europea',
                    coverageLabel: 'Cobertura',
                    coverage: 'Atención remota en toda España y la Unión Europea.',
                    description: 'Contacte con Elysium λ Development & Research en España para proyectos de infraestructura digital, ingeniería de software, ciberseguridad e investigación aplicada.'
                },
                onboarding: {
                    files: 'Si estos archivos contienen datos personales de terceros, se tratan conforme a nuestra <a href="privacy" target="_blank" style="color: var(--color-accent);">Política de Privacidad</a> (RGPD y LOPDGDD) exclusivamente para construir su sistema.',
                    health: 'Datos de salud (Art. 9 RGPD y LOPDGDD)',
                    consent: 'Autorizo el tratamiento de los archivos y datos que he subido exclusivamente para desarrollar mi sistema (Art. 28 RGPD y LOPDGDD).'
                },
                services: {
                    compliance: 'Cumplimiento del RGPD, la LOPDGDD y avisos legales al día',
                    description: 'Servicios de infraestructura digital para España: desarrollo web, sistemas cloud, CRM a medida, ciberseguridad y cumplimiento del RGPD y la LOPDGDD.'
                },
                legal: {
                    privacyLaw: '<strong>Ley Orgánica 3/2018 (LOPDGDD) de España</strong>',
                    territory: 'España y la Unión Europea',
                    authorityName: 'Agencia Española de Protección de Datos (AEPD)',
                    authorityUrl: 'https://www.aepd.es',
                    cookieRule: '<strong>Ley 34/2002, de servicios de la sociedad de la información y de comercio electrónico (LSSI-CE)</strong> de España',
                    withdrawalHeading: '3. Derecho de desistimiento (España y Unión Europea)',
                    withdrawalBody: 'Cuando el cliente tenga la condición legal de consumidor y el contrato a distancia esté sujeto al <strong>Real Decreto Legislativo 1/2007</strong>, dispondrá, con carácter general, de <strong>14 días naturales</strong> para ejercer el derecho de desistimiento, salvo las excepciones previstas legalmente.',
                    taxBody: 'Los presupuestos y contratos indicarán si los importes incluyen impuestos. Las operaciones sujetas en España aplicarán el IVA conforme a la <strong>Ley 37/1992, del Impuesto sobre el Valor Añadido</strong>, atendiendo a la localización de la operación, la naturaleza del servicio y la condición fiscal del cliente. Cada factura reflejará el tratamiento aplicable.',
                    disputeBody: 'Buscamos primero una solución amistosa a través de <a href="mailto:info@elysiumdr.eu">info@elysiumdr.eu</a>. Si no se alcanza un acuerdo, los consumidores podrán acudir a los organismos públicos de consumo competentes en España y ejercer todas las acciones reconocidas por la normativa aplicable.',
                    governingBody: 'Estos Términos se rigen por las leyes de <strong>España y de la Unión Europea</strong>. Las controversias se someterán a los juzgados y tribunales competentes conforme a la normativa aplicable. Cuando el usuario sea consumidor, se respetarán las reglas imperativas de competencia y protección vinculadas a su domicilio.',
                    privacyDescription: 'Cómo Elysium λ Development & Research trata y protege datos personales en España conforme al RGPD y la Ley Orgánica 3/2018 (LOPDGDD): conservación, seguridad y derechos.',
                    termsDescription: 'Términos que regulan los servicios de Elysium λ Development & Research en España: desistimiento, privacidad, fiscalidad, conflictos y ley aplicable.',
                    privacyFooter: '© 2026 Elysium λ Development & Research. Todos los derechos reservados. | <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none;">Agencia Española de Protección de Datos</a>',
                    termsFooter: '© 2026 Elysium λ Development & Research. Todos los derechos reservados.'
                }
            },
            pt: {
                home: {
                    behaviour: 'Concebemos interfaces ergonómicas adaptadas às pessoas e empresas de Espanha.',
                    governance: 'Implementamos os mais elevados padrões de cibersegurança e protocolos de governação espanhóis.',
                    complianceTitle: 'Conformidade legal e regulamentar:',
                    compliance: ' Concebemos a sua infraestrutura em conformidade com o RGPD, a Lei Orgânica 3/2018 (LOPDGDD) e as orientações da Agência Espanhola de Proteção de Dados (AEPD).',
                    timeline: 'Realização de testes, validação dos mecanismos de segurança (controlo de acessos) e auditorias de conformidade regulamentar (RGPD/LOPDGDD).',
                    research: 'A Elysium λ Development & Research opera como um laboratório independente de engenharia, investigação e consultoria informática em Espanha.<br><br>O nosso propósito é democratizar o acesso a infraestruturas digitais de alto nível, permitindo que pequenas empresas e empreendedores em Espanha cresçam através de um ecossistema tecnológico.<br><br>Combinamos pensamento científico, design ergonómico e experimentação contínua para criar software que resolve ineficiências estruturais.'
                },
                about: {
                    mission: 'Democratizar o acesso à infraestrutura digital, dotando pequenas empresas, empreendedores e startups em Espanha de ecossistemas tecnológicos acessíveis que automatizam operações e apoiam um crescimento sustentável. Disponibilizamos infraestrutura que evolui com cada negócio.',
                    vision: 'Tornar-nos o Elysium λ Institute of Development & Research: um instituto dedicado ao estudo, desenvolvimento e aplicação de infraestruturas digitais, bem como à formação de novas gerações de cientistas e programadores. Pretendemos contribuir para uma Espanha inovadora e cada vez mais digital.',
                    historyIntro: 'A Elysium λ Development & Research foi fundada com um propósito claro: trabalhar com pequenas empresas e empreendedores em Espanha, reforçar a sua presença digital e dar-lhes acesso a infraestrutura capaz de crescer com eles.',
                    economy: 'As pequenas empresas e os empreendedores são a espinha dorsal da economia de Espanha. Muitos continuam excluídos dos benefícios da transformação tecnológica devido a barreiras de complexidade, custo e literacia digital. A Elysium λ investiga e desenvolve infraestruturas que tornam a tecnologia avançada mais acessível, transparente e fiável para quem atravessa essa transformação.',
                    nameIntro: 'O nome Elysium λ reflete a alma deste projeto:',
                    aspiration: 'No contexto deste projeto, <strong>Elysium λ</strong> simboliza a aspiração de contribuir para uma Espanha cada vez mais digitalizada e conectada.',
                    future: 'Começando por infraestrutura digital para pequenas empresas e empreendedores, a Elysium λ pretende evoluir para a investigação e formação de programadores científicos que apoiem um futuro digital espanhol centrado em I&D.',
                    location: 'A Elysium λ Development & Research opera em Espanha, disponibilizando a pequenas empresas e empreendedores infraestrutura digital e investigação acessíveis.',
                    description: 'Conheça a missão, visão e história da Elysium λ Development & Research em Espanha e o nosso trabalho em infraestrutura digital acessível para pequenas empresas e empreendedores.'
                },
                contact: {
                    phoneLabel: 'Telefone',
                    phoneSuffix: 'atendimento para Espanha e União Europeia',
                    coverageLabel: 'Cobertura',
                    coverage: 'Atendimento remoto em toda a Espanha e União Europeia.',
                    description: 'Contacte a Elysium λ Development & Research em Espanha para projetos de infraestrutura digital, engenharia de software, cibersegurança e investigação aplicada.'
                },
                onboarding: {
                    files: 'Se estes ficheiros contiverem dados pessoais de terceiros, são tratados ao abrigo da nossa <a href="privacy" target="_blank" style="color: var(--color-accent);">Política de Privacidade</a> (RGPD e LOPDGDD) exclusivamente para construir o seu sistema.',
                    health: 'Dados de saúde (art. 9.º RGPD e LOPDGDD)',
                    consent: 'Autorizo o tratamento dos ficheiros e dados que carreguei exclusivamente para desenvolver o meu sistema (art. 28.º RGPD e LOPDGDD).'
                },
                services: {
                    compliance: 'Conformidade com o RGPD, a LOPDGDD e avisos legais atualizados',
                    description: 'Serviços de infraestrutura digital para Espanha: desenvolvimento web, sistemas cloud, CRM à medida, cibersegurança e conformidade com o RGPD e a LOPDGDD.'
                },
                legal: {
                    privacyLaw: '<strong>Lei Orgânica 3/2018 (LOPDGDD) de Espanha</strong>',
                    territory: 'Espanha e a União Europeia',
                    authorityName: 'Agência Espanhola de Proteção de Dados (AEPD)',
                    authorityUrl: 'https://www.aepd.es',
                    cookieRule: '<strong>Lei 34/2002 relativa aos serviços da sociedade da informação e ao comércio eletrónico (LSSI-CE)</strong> de Espanha',
                    withdrawalHeading: '3. Direito de livre resolução (Espanha e União Europeia)',
                    withdrawalBody: 'Quando o cliente tiver a qualidade legal de consumidor e o contrato à distância estiver sujeito ao <strong>Real Decreto Legislativo 1/2007</strong>, dispõe, em regra, de <strong>14 dias seguidos</strong> para exercer o direito de livre resolução, sem prejuízo das exceções previstas na lei.',
                    taxBody: 'Os orçamentos e contratos indicam se os montantes incluem impostos. As operações tributáveis em Espanha ficam sujeitas ao IVA nos termos da <strong>Lei 37/1992 do Imposto sobre o Valor Acrescentado</strong>, tendo em conta o local da operação, a natureza do serviço e a situação fiscal do cliente. Cada fatura indicará o tratamento aplicável.',
                    disputeBody: 'Procuramos primeiro uma solução amigável através de <a href="mailto:info@elysiumdr.eu">info@elysiumdr.eu</a>. Não sendo alcançado um acordo, os consumidores podem recorrer às entidades públicas de defesa do consumidor competentes em Espanha e exercer todos os meios previstos na legislação aplicável.',
                    governingBody: 'Os presentes Termos regem-se pelas leis de <strong>Espanha e da União Europeia</strong>. Os litígios serão submetidos aos tribunais competentes nos termos da lei aplicável. Quando o utilizador seja consumidor, mantêm-se as regras imperativas de competência e proteção associadas ao seu domicílio.',
                    privacyDescription: 'Como a Elysium λ Development & Research trata e protege dados pessoais em Espanha ao abrigo do RGPD e da Lei Orgânica 3/2018 (LOPDGDD): conservação, segurança e direitos.',
                    termsDescription: 'Termos que regulam os serviços da Elysium λ Development & Research em Espanha: livre resolução, privacidade, fiscalidade, litígios e lei aplicável.',
                    privacyFooter: '© 2026 Elysium λ Development & Research. Todos os direitos reservados. | <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none;">Agência Espanhola de Proteção de Dados</a>',
                    termsFooter: '© 2026 Elysium λ Development & Research. Todos os direitos reservados.'
                }
            }
        },
        PT: {
            en: {
                home: {
                    behaviour: 'We design ergonomic interfaces adapted to people and businesses in Portugal.',
                    governance: 'We implement the highest cybersecurity standards and Portuguese governance protocols.',
                    complianceTitle: 'Legal and Regulatory Compliance:',
                    compliance: ' We design your infrastructure in accordance with the GDPR, Portugal\'s Law No. 58/2019, and guidance from the Portuguese Data Protection Authority (CNPD).',
                    timeline: 'Testing, validation of security mechanisms (access control), and regulatory compliance audits (GDPR/Law No. 58/2019).',
                    research: 'Elysium λ Development & Research operates as an independent engineering, research, and IT consultancy laboratory in Portugal.<br><br>Our purpose is to democratise access to high-level digital infrastructure, enabling small businesses and startups in Portugal to scale through a technological ecosystem.<br><br>We combine scientific thinking, ergonomic design, and continuous experimentation to deliver software that resolves structural inefficiencies.'
                },
                about: {
                    mission: 'To democratise access to digital infrastructure by equipping small businesses, entrepreneurs, and startups in Portugal with accessible technology ecosystems that automate operations and support sustainable growth. We provide infrastructure that evolves with each business.',
                    vision: 'To become the Elysium λ Institute of Development & Research: an institute devoted to the study, development, and application of digital infrastructure, and to training new generations of scientists and developers. We aim to contribute to an innovative, increasingly digital Portugal.',
                    historyIntro: 'Elysium λ Development & Research was founded with a clear purpose: to work alongside small businesses and entrepreneurs in Portugal, strengthen their digital presence, and give them access to infrastructure that can scale with them.',
                    economy: 'Small businesses, entrepreneurs, and startups form the backbone of Portugal\'s economy. Many remain excluded from the benefits of technological transformation by barriers of complexity, cost, and digital literacy. Elysium λ researches and develops infrastructure that makes advanced technology more accessible, transparent, and dependable for the people navigating that transformation.',
                    nameIntro: 'The name Elysium λ reflects the soul of this project:',
                    aspiration: 'Within this project, <strong>Elysium λ</strong> symbolises the aspiration to contribute to an increasingly digital and connected Portugal.',
                    future: 'Beginning with digital infrastructure for small businesses and startups, Elysium λ aims to evolve towards research and the training of scientific developers who support a Portuguese digital future centred on R&D.',
                    location: 'Elysium λ Development & Research is established in Portugal, providing small businesses and startups with accessible digital infrastructure and research.',
                    description: 'Learn about the mission, vision, and history of Elysium λ Development & Research in Portugal and our work on accessible digital infrastructure for small businesses and startups.'
                },
                contact: {
                    phoneLabel: 'Telephone',
                    phoneSuffix: 'service for Portugal and the European Union',
                    coverageLabel: 'Coverage',
                    coverage: 'Remote service throughout Portugal and the European Union.',
                    description: 'Contact Elysium λ Development & Research in Portugal about digital infrastructure, software engineering, cybersecurity, and applied research projects.'
                },
                onboarding: {
                    files: 'If these files contain third-party personal data, they are processed under our <a href="privacy" target="_blank" style="color: var(--color-accent);">Privacy Policy</a> (GDPR and Portugal\'s Law No. 58/2019) exclusively to build your system.',
                    health: 'Health data (GDPR Art. 9 and Portugal\'s Law No. 58/2019)',
                    consent: 'I authorise the processing of the files and datasets I have uploaded exclusively to develop my system (GDPR Art. 28 and Portugal\'s Law No. 58/2019).'
                },
                services: {
                    compliance: 'GDPR, Law No. 58/2019, and up-to-date legal notices',
                    description: 'Digital infrastructure services for Portugal, including website development, cloud systems, bespoke CRM, cybersecurity, and compliance with the GDPR and Law No. 58/2019.'
                },
                legal: {
                    privacyLaw: '<strong>Portugal\'s Law No. 58/2019</strong>',
                    territory: 'Portugal and the European Union',
                    authorityName: 'Portuguese Data Protection Authority (CNPD)',
                    authorityUrl: 'https://www.cnpd.pt',
                    cookieRule: 'Portugal\'s <strong>Law No. 41/2004</strong> and the applicable ePrivacy rules',
                    withdrawalHeading: '3. Right of withdrawal — cooling-off period (Portugal and EU)',
                    withdrawalBody: 'Under <strong>Directive 2011/83/EU</strong>, as transposed into Portuguese law by <strong>Decree-Law No. 24/2014</strong>, consumers generally have <strong>14 calendar days</strong> to withdraw from a distance contract, subject to the statutory exceptions.',
                    taxBody: 'Quotes and contracts state whether taxes are included. Transactions taxable in Portugal are subject to the applicable VAT treatment under the <strong>Portuguese VAT Code (CIVA)</strong>, taking into account the place of supply, the nature of the service, and the client\'s tax status. Each invoice will show the treatment applicable to the transaction.',
                    disputeBody: 'We first seek an amicable solution through <a href="mailto:info@elysiumdr.eu">info@elysiumdr.eu</a>. Consumers may also use Portugal\'s <a href="https://www.livroreclamacoes.pt/Pedido/Reclamacao" target="_blank" rel="noopener noreferrer">Electronic Complaints Book</a> or contact the competent consumer arbitration centre.',
                    governingBody: 'These Terms are governed by the laws of <strong>Portugal and the European Union</strong>. Disputes will be submitted to the Portuguese courts with jurisdiction under applicable law. Where the user is a consumer, mandatory jurisdiction and consumer-protection rules linked to their place of residence remain unaffected.',
                    privacyDescription: 'How Elysium λ Development & Research processes and protects personal data in Portugal under the GDPR and Law No. 58/2019, including retention, security, and data-subject rights.',
                    termsDescription: 'Terms governing Elysium λ Development & Research services in Portugal, including withdrawal rights, privacy, taxation, dispute resolution, and applicable law.',
                    privacyFooter: '© 2026 Elysium λ Development & Research. All rights reserved. | <a href="https://www.livroreclamacoes.pt/Pedido/Reclamacao" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none;">Electronic Complaints Book</a>',
                    termsFooter: '© 2026 Elysium λ Development & Research. All rights reserved. | <a href="https://www.livroreclamacoes.pt/Pedido/Reclamacao" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none;">Electronic Complaints Book</a>'
                }
            },
            es: {
                home: {
                    behaviour: 'Diseñamos interfaces ergonómicas adaptadas a las personas y empresas de Portugal.',
                    governance: 'Implementamos los más altos estándares de ciberseguridad y protocolos de gobernanza portugueses.',
                    complianceTitle: 'Cumplimiento legal y normativo:',
                    compliance: ' Diseñamos su infraestructura conforme al RGPD, la Ley n.º 58/2019 de Portugal y las directrices de la Comisión Nacional de Protección de Datos (CNPD).',
                    timeline: 'Realización de pruebas, validación de mecanismos de seguridad (control de accesos) y auditorías de cumplimiento normativo (RGPD/Ley n.º 58/2019).',
                    research: 'Elysium λ Development & Research opera como un laboratorio independiente de ingeniería, investigación y consultoría informática en Portugal.<br><br>Nuestro propósito es democratizar el acceso a infraestructura digital de alto nivel para que las pequeñas empresas y startups de Portugal puedan escalar mediante un ecosistema tecnológico.<br><br>Combinamos pensamiento científico, diseño ergonómico y experimentación continua para crear software que resuelve ineficiencias estructurales.'
                },
                about: {
                    mission: 'Democratizar el acceso a la infraestructura digital, dotando a las pequeñas empresas, emprendedores y startups de Portugal de ecosistemas tecnológicos accesibles que automaticen operaciones y favorezcan un crecimiento sostenible. Proporcionamos infraestructura que evoluciona con cada negocio.',
                    vision: 'Ser el Elysium λ Institute of Development & Research: un instituto dedicado al estudio, desarrollo y aplicación de infraestructuras digitales, así como a la formación de nuevas generaciones de científicos y desarrolladores. Aspiramos a contribuir a un Portugal innovador y cada vez más digital.',
                    historyIntro: 'Elysium λ Development & Research fue fundada con un propósito claro: trabajar junto a las pequeñas empresas y emprendedores de Portugal, impulsar su presencia digital y facilitarles infraestructura capaz de crecer con ellos.',
                    economy: 'Las pequeñas empresas, los emprendedores y las startups representan la columna vertebral de la economía de Portugal. Muchas siguen excluidas de los beneficios de la transformación tecnológica por barreras de complejidad, coste y alfabetización digital. Elysium λ investiga y desarrolla infraestructuras que hacen la tecnología avanzada más accesible, transparente y fiable para quienes atraviesan esa transformación.',
                    nameIntro: 'El nombre Elysium λ refleja el alma de este proyecto:',
                    aspiration: 'En el contexto de este proyecto, <strong>Elysium λ</strong> simboliza la aspiración de contribuir a un Portugal cada vez más digitalizado y conectado.',
                    future: 'Comenzando con infraestructura digital para pequeñas empresas y startups, Elysium λ pretende evolucionar hacia la investigación y formación de desarrolladores científicos que apoyen un futuro digital portugués centrado en I+D.',
                    location: 'Elysium λ Development & Research está establecida en Portugal y ofrece a pequeñas empresas y startups infraestructura digital e investigación accesible.',
                    description: 'Conozca la misión, visión e historia de Elysium λ Development & Research en Portugal y nuestro trabajo en infraestructura digital accesible para pequeñas empresas y startups.'
                },
                contact: {
                    phoneLabel: 'Teléfono',
                    phoneSuffix: 'atención para Portugal y la Unión Europea',
                    coverageLabel: 'Cobertura',
                    coverage: 'Atención remota en todo Portugal y la Unión Europea.',
                    description: 'Contacte con Elysium λ Development & Research en Portugal para proyectos de infraestructura digital, ingeniería de software, ciberseguridad e investigación aplicada.'
                },
                onboarding: {
                    files: 'Si estos archivos contienen datos personales de terceros, se tratan conforme a nuestra <a href="privacy" target="_blank" style="color: var(--color-accent);">Política de Privacidad</a> (RGPD y Ley n.º 58/2019 de Portugal) exclusivamente para construir su sistema.',
                    health: 'Datos de salud (Art. 9 RGPD y Ley n.º 58/2019 de Portugal)',
                    consent: 'Autorizo el tratamiento de los archivos y datos que he subido exclusivamente para desarrollar mi sistema (Art. 28 RGPD y Ley n.º 58/2019 de Portugal).'
                },
                services: {
                    compliance: 'Cumplimiento del RGPD, la Ley n.º 58/2019 y avisos legales al día',
                    description: 'Servicios de infraestructura digital para Portugal: desarrollo web, sistemas cloud, CRM a medida, ciberseguridad y cumplimiento del RGPD y la Ley n.º 58/2019.'
                },
                legal: {
                    privacyLaw: '<strong>Ley n.º 58/2019 de Portugal</strong>',
                    territory: 'Portugal y la Unión Europea',
                    authorityName: 'Comisión Nacional de Protección de Datos de Portugal (CNPD)',
                    authorityUrl: 'https://www.cnpd.pt',
                    cookieRule: '<strong>Ley n.º 41/2004 de Portugal</strong> y la normativa ePrivacy aplicable',
                    withdrawalHeading: '3. Derecho de desistimiento (Portugal y Unión Europea)',
                    withdrawalBody: 'Conforme a la <strong>Directiva 2011/83/UE</strong>, transpuesta al derecho portugués mediante el <strong>Decreto-Lei n.º 24/2014</strong>, los consumidores disponen, con carácter general, de <strong>14 días naturales</strong> para desistir de un contrato a distancia, salvo las excepciones previstas legalmente.',
                    taxBody: 'Los presupuestos y contratos indicarán si los importes incluyen impuestos. Las operaciones sujetas en Portugal aplicarán el IVA conforme al <strong>Código portugués del IVA (CIVA)</strong>, atendiendo a la localización de la operación, la naturaleza del servicio y la condición fiscal del cliente. Cada factura reflejará el tratamiento aplicable.',
                    disputeBody: 'Buscamos primero una solución amistosa a través de <a href="mailto:info@elysiumdr.eu">info@elysiumdr.eu</a>. Los consumidores también pueden utilizar el <a href="https://www.livroreclamacoes.pt/Pedido/Reclamacao" target="_blank" rel="noopener noreferrer">Libro de Reclamaciones electrónico de Portugal</a> o acudir al centro de arbitraje de consumo competente.',
                    governingBody: 'Estos Términos se rigen por las leyes de <strong>Portugal y de la Unión Europea</strong>. Las controversias se someterán a los tribunales portugueses competentes conforme a la normativa aplicable. Cuando el usuario sea consumidor, se respetarán las reglas imperativas de competencia y protección vinculadas a su domicilio.',
                    privacyDescription: 'Cómo Elysium λ Development & Research trata y protege datos personales en Portugal conforme al RGPD y la Ley n.º 58/2019: conservación, seguridad y derechos.',
                    termsDescription: 'Términos que regulan los servicios de Elysium λ Development & Research en Portugal: desistimiento, privacidad, fiscalidad, conflictos y ley aplicable.',
                    privacyFooter: '© 2026 Elysium λ Development & Research. Todos los derechos reservados. | <a href="https://www.livroreclamacoes.pt/Pedido/Reclamacao" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none;">Libro de Reclamaciones electrónico</a>',
                    termsFooter: '© 2026 Elysium λ Development & Research. Todos los derechos reservados. | <a href="https://www.livroreclamacoes.pt/Pedido/Reclamacao" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none;">Libro de Reclamaciones electrónico</a>'
                }
            },
            pt: {
                home: {
                    behaviour: 'Concebemos interfaces ergonómicas adaptadas às pessoas e empresas de Portugal.',
                    governance: 'Implementamos os mais elevados padrões de cibersegurança e protocolos de governação portugueses.',
                    complianceTitle: 'Conformidade legal e regulamentar:',
                    compliance: ' Concebemos a sua infraestrutura em conformidade com o RGPD, a Lei n.º 58/2019 de Portugal e as orientações da Comissão Nacional de Proteção de Dados (CNPD).',
                    timeline: 'Realização de testes, validação dos mecanismos de segurança (controlo de acessos) e auditorias de conformidade regulamentar (RGPD/Lei n.º 58/2019).',
                    research: 'A Elysium λ Development & Research opera como um laboratório independente de engenharia, investigação e consultoria informática em Portugal.<br><br>O nosso propósito é democratizar o acesso a infraestruturas digitais de alto nível, permitindo que pequenas empresas e startups em Portugal cresçam através de um ecossistema tecnológico.<br><br>Combinamos pensamento científico, design ergonómico e experimentação contínua para criar software que resolve ineficiências estruturais.'
                },
                about: {
                    mission: 'Democratizar o acesso à infraestrutura digital, dotando pequenas empresas, empreendedores e startups em Portugal de ecossistemas tecnológicos acessíveis que automatizam operações e apoiam um crescimento sustentável. Disponibilizamos infraestrutura que evolui com cada negócio.',
                    vision: 'Tornar-nos o Elysium λ Institute of Development & Research: um instituto dedicado ao estudo, desenvolvimento e aplicação de infraestruturas digitais, bem como à formação de novas gerações de cientistas e programadores. Pretendemos contribuir para um Portugal inovador e cada vez mais digital.',
                    historyIntro: 'A Elysium λ Development & Research foi fundada com um propósito claro: trabalhar com pequenas empresas e empreendedores em Portugal, reforçar a sua presença digital e dar-lhes acesso a infraestrutura capaz de crescer com eles.',
                    economy: 'As pequenas empresas, os empreendedores e as startups são a espinha dorsal da economia de Portugal. Muitos continuam excluídos dos benefícios da transformação tecnológica devido a barreiras de complexidade, custo e literacia digital. A Elysium λ investiga e desenvolve infraestruturas que tornam a tecnologia avançada mais acessível, transparente e fiável para quem atravessa essa transformação.',
                    nameIntro: 'O nome Elysium λ reflete a alma deste projeto:',
                    aspiration: 'No contexto deste projeto, <strong>Elysium λ</strong> simboliza a aspiração de contribuir para um Portugal cada vez mais digitalizado e conectado.',
                    future: 'Começando por infraestrutura digital para pequenas empresas e startups, a Elysium λ pretende evoluir para a investigação e formação de programadores científicos que apoiem um futuro digital português centrado em I&D.',
                    location: 'A Elysium λ Development & Research está estabelecida em Portugal e disponibiliza a pequenas empresas e startups infraestrutura digital e investigação acessíveis.',
                    description: 'Conheça a missão, visão e história da Elysium λ Development & Research em Portugal e o nosso trabalho em infraestrutura digital acessível para pequenas empresas e startups.'
                },
                contact: {
                    phoneLabel: 'Telefone',
                    phoneSuffix: 'atendimento para Portugal e União Europeia',
                    coverageLabel: 'Cobertura',
                    coverage: 'Atendimento remoto em todo o território português e na União Europeia.',
                    description: 'Contacte a Elysium λ Development & Research em Portugal para projetos de infraestrutura digital, engenharia de software, cibersegurança e investigação aplicada.'
                },
                onboarding: {
                    files: 'Se estes ficheiros contiverem dados pessoais de terceiros, são tratados ao abrigo da nossa <a href="privacy" target="_blank" style="color: var(--color-accent);">Política de Privacidade</a> (RGPD e Lei n.º 58/2019) exclusivamente para construir o seu sistema.',
                    health: 'Dados de saúde (art. 9.º RGPD e Lei n.º 58/2019)',
                    consent: 'Autorizo o tratamento dos ficheiros e dados que carreguei exclusivamente para desenvolver o meu sistema (art. 28.º RGPD e Lei n.º 58/2019).'
                },
                services: {
                    compliance: 'Conformidade com o RGPD, a Lei n.º 58/2019 e avisos legais atualizados',
                    description: 'Serviços de infraestrutura digital para Portugal: desenvolvimento web, sistemas cloud, CRM à medida, cibersegurança e conformidade com o RGPD e a Lei n.º 58/2019.'
                },
                legal: {
                    privacyLaw: '<strong>Lei n.º 58/2019 de Portugal</strong>',
                    territory: 'Portugal e a União Europeia',
                    authorityName: 'Comissão Nacional de Proteção de Dados (CNPD)',
                    authorityUrl: 'https://www.cnpd.pt',
                    cookieRule: '<strong>Lei n.º 41/2004 de Portugal</strong> e as regras ePrivacy aplicáveis',
                    withdrawalHeading: '3. Direito de livre resolução (Portugal e União Europeia)',
                    withdrawalBody: 'Nos termos da <strong>Diretiva 2011/83/UE</strong>, transposta para o direito português pelo <strong>Decreto-Lei n.º 24/2014</strong>, os consumidores dispõem, em regra, de <strong>14 dias seguidos</strong> para resolver um contrato celebrado à distância, sem prejuízo das exceções previstas na lei.',
                    taxBody: 'Os orçamentos e contratos indicam se os montantes incluem impostos. As operações tributáveis em Portugal ficam sujeitas ao IVA nos termos do <strong>Código do IVA (CIVA)</strong>, tendo em conta o local da operação, a natureza do serviço e a situação fiscal do cliente. Cada fatura indicará o tratamento aplicável.',
                    disputeBody: 'Procuramos primeiro uma solução amigável através de <a href="mailto:info@elysiumdr.eu">info@elysiumdr.eu</a>. Os consumidores podem também utilizar o <a href="https://www.livroreclamacoes.pt/Pedido/Reclamacao" target="_blank" rel="noopener noreferrer">Livro de Reclamações Eletrónico</a> ou recorrer ao centro de arbitragem de conflitos de consumo competente.',
                    governingBody: 'Os presentes Termos regem-se pelas leis de <strong>Portugal e da União Europeia</strong>. Os litígios serão submetidos aos tribunais portugueses competentes nos termos da lei aplicável. Quando o utilizador seja consumidor, mantêm-se as regras imperativas de competência e proteção associadas ao seu domicílio.',
                    privacyDescription: 'Como a Elysium λ Development & Research trata e protege dados pessoais em Portugal ao abrigo do RGPD e da Lei n.º 58/2019: conservação, segurança e direitos.',
                    termsDescription: 'Termos que regulam os serviços da Elysium λ Development & Research em Portugal: livre resolução, privacidade, fiscalidade, litígios e lei aplicável.',
                    privacyFooter: '© 2026 Elysium λ Development & Research. Todos os direitos reservados. | <a href="https://www.livroreclamacoes.pt/Pedido/Reclamacao" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none;">Livro de Reclamações</a>',
                    termsFooter: '© 2026 Elysium λ Development & Research. Todos os direitos reservados. | <a href="https://www.livroreclamacoes.pt/Pedido/Reclamacao" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none;">Livro de Reclamações</a>'
                }
            }
        },
        CR: {
            en: {
                home: {
                    behaviour: 'We design ergonomic interfaces adapted to people and businesses in Costa Rica.',
                    governance: 'We implement the highest cybersecurity standards and governance protocols in Costa Rica.',
                    complianceTitle: 'Legal and Regulatory Compliance:',
                    compliance: ' We design your infrastructure in accordance with Costa Rica\'s Data Protection Law No. 8968, guidance from PRODHAB, and the European GDPR.',
                    timeline: 'Testing, validation of security mechanisms (access control), and regulatory compliance audits (Law No. 8968 / GDPR).',
                    research: 'Elysium λ Development & Research operates as an independent engineering, research, and IT consultancy laboratory in Costa Rica.<br><br>Our purpose is to democratise access to high-level digital infrastructure, enabling small businesses and entrepreneurs in Costa Rica to scale through a technological ecosystem.<br><br>We combine scientific thinking, ergonomic design, and continuous experimentation to deliver software that resolves structural inefficiencies.'
                },
                about: {
                    mission: 'To democratise access to digital infrastructure by equipping small businesses, entrepreneurs, and startups in Costa Rica with accessible technology ecosystems that automate operations and support sustainable growth. We provide infrastructure that evolves with each business.',
                    vision: 'To become the Elysium λ Institute of Development & Research: an institute devoted to the study, development, and application of digital infrastructure, and to training new generations of scientists and developers. We aim to contribute to an innovative, increasingly digital Costa Rica.',
                    historyIntro: 'Elysium λ Development & Research was founded with a clear purpose: to work alongside small businesses and entrepreneurs in Costa Rica, strengthen their digital presence, and give them access to infrastructure that can scale with them.',
                    economy: 'Small businesses and entrepreneurs form the backbone of Costa Rica\'s economy. Many remain excluded from the benefits of technological transformation by barriers of complexity, cost, and digital literacy. Elysium λ researches and develops infrastructure that makes advanced technology more accessible, transparent, and dependable for the people navigating that transformation.',
                    nameIntro: 'The name Elysium λ reflects the soul of this project:',
                    aspiration: 'Within this project, <strong>Elysium λ</strong> symbolises the aspiration to contribute to an increasingly digital and connected Costa Rica.',
                    future: 'Beginning with digital infrastructure for small businesses and entrepreneurs, Elysium λ aims to evolve towards research and the training of scientific developers who support a Costa Rican digital future centred on R&D.',
                    location: 'Elysium λ Development & Research operates in Costa Rica, providing small businesses and entrepreneurs with accessible digital infrastructure and research.',
                    description: 'Learn about the mission, vision, and history of Elysium λ Development & Research in Costa Rica and our work on accessible digital infrastructure for small businesses and entrepreneurs.'
                },
                contact: {
                    phoneLabel: 'Telephone / WhatsApp',
                    phoneSuffix: 'direct service for Costa Rica via WhatsApp',
                    coverageLabel: 'Coverage',
                    coverage: 'Remote service across all 7 provinces of Costa Rica.',
                    description: 'Contact Elysium λ Development & Research in Costa Rica about digital infrastructure, software engineering, cybersecurity, and applied research projects.'
                },
                onboarding: {
                    files: 'If these files contain third-party personal data, they are processed under our <a href="privacy" target="_blank" style="color: var(--color-accent);">Privacy Policy</a> (Law No. 8968 and GDPR) exclusively to build your system.',
                    health: 'Sensitive health data (Law No. 8968 Art. 9 and GDPR Art. 9)',
                    consent: 'I authorise the processing of the files and datasets I have uploaded exclusively to develop my system (Law No. 8968 and GDPR Art. 28).',
                    phonePlaceholder: '+506 8000 0000'
                },
                services: {
                    compliance: 'Compliance with Law No. 8968, GDPR, and up-to-date legal notices',
                    description: 'Digital infrastructure services for Costa Rica, including website development, cloud systems, bespoke CRM, cybersecurity, and compliance with Law No. 8968 and the GDPR.'
                },
                legal: {
                    privacyLaw: '<strong>Costa Rica\'s Law No. 8968 on the Protection of Individuals with Regard to the Processing of Their Personal Data</strong> and its Regulation (Executive Decree No. 37554-JP)',
                    territory: 'Costa Rica and the European Union',
                    authorityName: 'Inhabitants\' Data Protection Agency of Costa Rica (PRODHAB)',
                    authorityUrl: 'https://www.prodhab.go.cr',
                    cookieRule: 'Costa Rica\'s <strong>Law No. 8968 and Executive Decree No. 37554-JP</strong>',
                    scopeBody: 'Elysium λ Development & Research provides professional services in software engineering, web development, systems architecture, digital research, and related technical consulting. These services are delivered under the subscription model published on the Services page and may include, depending on the plan contracted, website development, domain, email and hosting, compliance with Costa Rica\'s Law No. 8968, the GDPR and legal notices, a public agenda with automatic reminders, client records, a private client area with login and history, an administrator CRM, online payments and session packs, and occupancy and no-show reporting. Specific deliverables, deadlines, and pricing are governed by individual service agreements issued separately.',
                    withdrawalHeading: '3. Right of withdrawal (Costa Rica — Law No. 7472)',
                    withdrawalBody: 'Where the client is legally a consumer or end user in Costa Rica and enters into a distance or electronic contract under <strong>Costa Rica\'s Law on the Promotion of Competition and Effective Consumer Protection (Law No. 7472, Art. 40)</strong> and its Regulation, the client will generally have <strong>8 working days</strong> from the conclusion of the contract to exercise the right of withdrawal without penalty, subject to the statutory exceptions for bespoke or fully performed services.',
                    taxBody: 'Quotes and contracts state whether taxes are included. Where transactions are taxable or consumed in Costa Rica, Value Added Tax (VAT / IVA) applies where required under <strong>Law No. 9635 on Strengthening Public Finances</strong> and applicable tax regulations, taking into account the place of supply, the cross-border nature of the digital service, and the client\'s tax status. Each invoice or receipt will state the applicable tax treatment.',
                    disputeBody: 'We first seek an amicable solution through <a href="mailto:info@elysiumdr.eu">info@elysiumdr.eu</a>. If no agreement is reached, consumers in Costa Rica may bring a claim before the <strong>National Consumer Commission (CNC)</strong> of the <strong>Ministry of Economy, Industry and Commerce (MEIC)</strong> via <a href="https://www.consumidorenlinea.go.cr" target="_blank" rel="noopener noreferrer">Consumidor en Línea (www.consumidorenlinea.go.cr)</a> and exercise all remedies under Law No. 7472.',
                    governingBody: 'For services provided to clients in <strong>Costa Rica</strong>, these Terms are governed and interpreted in accordance with the mandatory public-policy rules of the Republic of Costa Rica — in particular Law No. 7472 and Law No. 8968 — without prejudice to European rules applicable to the provider\'s registered office. Where the user is a consumer in Costa Rica, the competent Costa Rican administrative authorities and courts shall have jurisdiction as provided by law.',
                    privacyDescription: 'How Elysium λ Development & Research processes and protects personal data in Costa Rica under Law No. 8968 (PRODHAB) and the GDPR, including retention, security, and informational self-determination rights.',
                    termsDescription: 'Terms governing Elysium λ Development & Research services in Costa Rica, including the 8-working-day withdrawal right under Law No. 7472, privacy, taxation, dispute resolution, and applicable law.',
                    privacyFooter: '© 2026 Elysium λ Development & Research. All rights reserved. | <a href="https://www.prodhab.go.cr" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none;">PRODHAB Costa Rica</a>',
                    termsFooter: '© 2026 Elysium λ Development & Research. All rights reserved.'
                }
            },
            es: {
                home: {
                    behaviour: 'Diseñamos interfaces ergonómicas adaptadas a las personas y empresas de Costa Rica.',
                    governance: 'Implementamos los más altos estándares en ciberseguridad y protocolos de gobernanza en Costa Rica.',
                    complianceTitle: 'Cumplimiento Legal y Normativo:',
                    compliance: ' Diseñamos su infraestructura conforme a la Ley N.º 8968 de Protección de Datos de Costa Rica, las directrices de la PRODHAB y el Reglamento Europeo (RGPD).',
                    timeline: 'Realización de pruebas, validación de los mecanismos de seguridad (control de accesos) y auditorías de cumplimiento normativo (Ley N.º 8968 / RGPD).',
                    research: 'Elysium λ Development & Research opera como un laboratorio independiente de ingeniería, investigación y consultoría informática en Costa Rica.<br><br>Nuestro propósito es democratizar el acceso a infraestructura digital de alto nivel, permitiendo a pequeñas empresas y emprendedores en Costa Rica escalar mediante un ecosistema tecnológico.<br><br>Combinamos pensamiento científico, diseño ergonómico y experimentación continua para entregar software que resuelve ineficiencias estructurales.'
                },
                about: {
                    mission: 'Democratizar el acceso a la infraestructura digital, dotando a las pequeñas empresas, emprendedores y startups de Costa Rica de ecosistemas tecnológicos accesibles que automaticen operaciones y favorezcan un crecimiento sostenible. Proporcionamos infraestructura que evoluciona con cada negocio.',
                    vision: 'Ser el Elysium λ Institute of Development & Research: un instituto dedicado al estudio, desarrollo y aplicación de infraestructuras digitales, así como a la formación de nuevas generaciones de científicos y desarrolladores. Aspiramos a contribuir a una Costa Rica innovadora y cada vez más digital.',
                    historyIntro: 'Elysium λ Development & Research fue fundada con un propósito claro: trabajar junto a las pequeñas empresas y emprendedores de Costa Rica, impulsar su presencia digital y facilitarles infraestructura capaz de crecer con ellos.',
                    economy: 'Las pequeñas empresas y los emprendedores representan la columna vertebral de la economía de Costa Rica. Muchas siguen excluidas de los beneficios de la transformación tecnológica por barreras de complejidad, costo y alfabetización digital. Elysium λ investiga y desarrolla infraestructuras que hacen la tecnología avanzada más accesible, transparente y confiable para quienes atraviesan esa transformación.',
                    nameIntro: 'El nombre Elysium λ refleja el alma de este proyecto:',
                    aspiration: 'En el contexto de este proyecto, <strong>Elysium λ</strong> simboliza la aspiración de contribuir a una Costa Rica cada vez más digitalizada y conectada.',
                    future: 'Comenzando con infraestructura digital para pequeñas empresas y emprendedores, Elysium λ pretende evolucionar hacia la investigación y formación de desarrolladores científicos que apoyen un futuro digital costarricense centrado en I+D.',
                    location: 'Elysium λ Development & Research opera en Costa Rica ofreciendo a pequeñas empresas y emprendedores infraestructura digital e investigación accesible.',
                    description: 'Conozca la misión, visión e historia de Elysium λ Development & Research en Costa Rica y nuestro trabajo en infraestructura digital accesible para pequeñas empresas y emprendedores.'
                },
                contact: {
                    phoneLabel: 'Teléfono / WhatsApp',
                    phoneSuffix: 'atención directa para Costa Rica por WhatsApp',
                    coverageLabel: 'Cobertura',
                    coverage: 'Atención remota en las 7 provincias de Costa Rica.',
                    description: 'Contacte con Elysium λ Development & Research en Costa Rica para proyectos de infraestructura digital, ingeniería de software, ciberseguridad e investigación aplicada.'
                },
                onboarding: {
                    files: 'Si estos archivos contienen datos personales de terceros, se tratan conforme a nuestra <a href="privacy" target="_blank" style="color: var(--color-accent);">Política de Privacidad</a> (Ley N.º 8968 y RGPD) exclusivamente para construir su sistema.',
                    health: 'Datos sensibles de salud (Art. 9 Ley N.º 8968 y Art. 9 RGPD)',
                    consent: 'Autorizo el tratamiento de los archivos y datos que he subido exclusivamente para desarrollar mi sistema (Ley N.º 8968 y Art. 28 RGPD).',
                    phonePlaceholder: '+506 8000 0000'
                },
                services: {
                    compliance: 'Cumplimiento de la Ley N.º 8968, el RGPD y avisos legales al día',
                    description: 'Servicios de infraestructura digital para Costa Rica: desarrollo web, sistemas cloud, CRM a medida, ciberseguridad y cumplimiento de la Ley N.º 8968 y el RGPD.'
                },
                legal: {
                    privacyLaw: 'la <strong>Ley N.º 8968 de Protección de la Persona frente al Tratamiento de sus Datos Personales de Costa Rica</strong> y su Reglamento (Decreto Ejecutivo N.º 37554-JP)',
                    territory: 'Costa Rica y la Unión Europea',
                    authorityName: 'Agencia de Protección de los Datos de los Habitantes de Costa Rica (PRODHAB)',
                    authorityUrl: 'https://www.prodhab.go.cr',
                    cookieRule: 'la <strong>Ley N.º 8968 y su Reglamento (Decreto Ejecutivo N.º 37554-JP)</strong> de Costa Rica',
                    scopeBody: 'Elysium λ Development & Research presta servicios profesionales en ingeniería de software, desarrollo web, arquitectura de sistemas, investigación digital y consultoría técnica afín. Estos servicios se prestan bajo el modelo de suscripción publicado en la página de Servicios y pueden incluir, según el plan contratado, desarrollo de la web, dominio, correo y alojamiento, cumplimiento de la Ley N.º 8968, RGPD y avisos legales, agenda pública con recordatorios automáticos, ficha de cliente, área privada del cliente con acceso e historial, CRM del administrador, cobro online y bonos de sesiones, e informes de ocupación y ausencias. Las condiciones específicas de cada proyecto (entregables, plazos, precios) se rigen por acuerdos de servicio individuales emitidos por separado.',
                    withdrawalHeading: '3. Derecho de retracto (Costa Rica — Ley N.º 7472)',
                    withdrawalBody: 'Cuando el cliente tenga la condición legal de consumidor o usuario final en Costa Rica y contrate a distancia o por medios electrónicos conforme a la <strong>Ley de Promoción de la Competencia y Defensa Efectiva del Consumidor (Ley N.º 7472, Art. 40)</strong> y su Reglamento, dispondrá de un plazo de <strong>8 días hábiles</strong> contados desde el perfeccionamiento del contrato para ejercer el derecho de retracto sin penalización, salvo las excepciones previstas por la ley para servicios personalizados o ya ejecutados.',
                    taxBody: 'Los presupuestos y contratos indicarán si los montos incluyen impuestos. En las operaciones gravadas o consumidas en Costa Rica, el Impuesto sobre el Valor Agregado (IVA) se aplicará cuando corresponda conforme a la <strong>Ley de Fortalecimiento de las Finanzas Públicas (Ley N.º 9635)</strong> y la normativa tributaria aplicable, atendiendo a la localización de la operación, la naturaleza transfronteriza del servicio digital y la condición fiscal del cliente. Cada factura o comprobante reflejará el tratamiento tributario aplicable.',
                    disputeBody: 'Ante cualquier controversia, promovemos en primer lugar la resolución amistosa mediante contacto directo a <a href="mailto:info@elysiumdr.eu">info@elysiumdr.eu</a>. Si no se alcanza un acuerdo, las personas consumidoras en Costa Rica podrán acudir ante la <strong>Comisión Nacional del Consumidor (CNC)</strong> del <strong>Ministerio de Economía, Industria y Comercio (MEIC)</strong> a través de la plataforma <a href="https://www.consumidorenlinea.go.cr" target="_blank" rel="noopener noreferrer">Consumidor en Línea (www.consumidorenlinea.go.cr)</a> y ejercer las acciones reconocidas por la Ley N.º 7472.',
                    governingBody: 'Para los servicios prestados a clientes en <strong>Costa Rica</strong>, estos Términos se rigen e interpretan respetando las normas imperativas y de orden público de la República de Costa Rica —en particular la Ley N.º 7472 y la Ley N.º 8968—, sin perjuicio de las normas europeas aplicables al domicilio social del prestador. Cuando el usuario tenga la condición de consumidor en Costa Rica, serán competentes las autoridades administrativas y los tribunales costarricenses que correspondan conforme a la ley.',
                    privacyDescription: 'Cómo Elysium λ Development & Research trata y protege datos personales en Costa Rica conforme a la Ley N.º 8968 (PRODHAB) y el RGPD: conservación, seguridad y autodeterminación informativa.',
                    termsDescription: 'Términos que regulan los servicios de Elysium λ Development & Research en Costa Rica: derecho de retracto (Ley N.º 7472), privacidad, tributación, conflictos y ley aplicable.',
                    privacyFooter: '© 2026 Elysium λ Development & Research. Todos los derechos reservados. | <a href="https://www.prodhab.go.cr" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none;">PRODHAB Costa Rica</a>',
                    termsFooter: '© 2026 Elysium λ Development & Research. Todos los derechos reservados.'
                }
            },
            pt: {
                home: {
                    behaviour: 'Concebemos interfaces ergonómicas adaptadas às pessoas e empresas da Costa Rica.',
                    governance: 'Implementamos os mais elevados padrões de cibersegurança e protocolos de governação na Costa Rica.',
                    complianceTitle: 'Conformidade legal e regulamentar:',
                    compliance: ' Concebemos a sua infraestrutura em conformidade com a Lei n.º 8968 de Proteção de Dados da Costa Rica, as orientações da PRODHAB e o RGPD europeu.',
                    timeline: 'Realização de testes, validação dos mecanismos de segurança (controlo de acessos) e auditorias de conformidade regulamentar (Lei n.º 8968 / RGPD).',
                    research: 'A Elysium λ Development & Research opera como um laboratório independente de engenharia, investigação e consultoria informática na Costa Rica.<br><br>O nosso propósito é democratizar o acesso a infraestruturas digitais de alto nível, permitindo que pequenas empresas e empreendedores na Costa Rica cresçam através de um ecossistema tecnológico.<br><br>Combinamos pensamento científico, design ergonómico e experimentação contínua para criar software que resolve ineficiências estruturais.'
                },
                about: {
                    mission: 'Democratizar o acesso à infraestrutura digital, dotando pequenas empresas, empreendedores e startups na Costa Rica de ecossistemas tecnológicos acessíveis que automatizam operações e apoiam um crescimento sustentável. Disponibilizamos infraestrutura que evolui com cada negócio.',
                    vision: 'Tornar-nos o Elysium λ Institute of Development & Research: um instituto dedicado ao estudo, desenvolvimento e aplicação de infraestruturas digitais, bem como à formação de novas gerações de cientistas e programadores. Pretendemos contribuir para uma Costa Rica inovadora e cada vez mais digital.',
                    historyIntro: 'A Elysium λ Development & Research foi fundada com um propósito claro: trabalhar com pequenas empresas e empreendedores na Costa Rica, reforçar a sua presença digital e dar-lhes acesso a infraestrutura capaz de crescer com eles.',
                    economy: 'As pequenas empresas e os empreendedores são a espinha dorsal da economia da Costa Rica. Muitos continuam excluídos dos benefícios da transformação tecnológica devido a barreiras de complexidade, custo e literacia digital. A Elysium λ investiga e desenvolve infraestruturas que tornam a tecnologia avançada mais acessível, transparente e fiável para quem atravessa essa transformação.',
                    nameIntro: 'O nome Elysium λ reflete a alma deste projeto:',
                    aspiration: 'No contexto deste projeto, <strong>Elysium λ</strong> simboliza a aspiração de contribuir para uma Costa Rica cada vez mais digitalizada e conectada.',
                    future: 'Começando por infraestrutura digital para pequenas empresas e empreendedores, a Elysium λ pretende evoluir para a investigação e formação de programadores científicos que apoiem um futuro digital costa-riquenho centrado em I&D.',
                    location: 'A Elysium λ Development & Research opera na Costa Rica, disponibilizando a pequenas empresas e empreendedores infraestrutura digital e investigação acessíveis.',
                    description: 'Conheça a missão, visão e história da Elysium λ Development & Research na Costa Rica e o nosso trabalho em infraestrutura digital acessível para pequenas empresas e empreendedores.'
                },
                contact: {
                    phoneLabel: 'Telefone / WhatsApp',
                    phoneSuffix: 'atendimento direto para a Costa Rica por WhatsApp',
                    coverageLabel: 'Cobertura',
                    coverage: 'Atendimento remoto nas 7 províncias da Costa Rica.',
                    description: 'Contacte a Elysium λ Development & Research na Costa Rica para projetos de infraestrutura digital, engenharia de software, cibersegurança e investigação aplicada.'
                },
                onboarding: {
                    files: 'Se estes ficheiros contiverem dados pessoais de terceiros, são tratados ao abrigo da nossa <a href="privacy" target="_blank" style="color: var(--color-accent);">Política de Privacidade</a> (Lei n.º 8968 e RGPD) exclusivamente para construir o seu sistema.',
                    health: 'Dados sensíveis de saúde (art. 9.º Lei n.º 8968 e art. 9.º RGPD)',
                    consent: 'Autorizo o tratamento dos ficheiros e dados que carreguei exclusivamente para desenvolver o meu sistema (Lei n.º 8968 e art. 28.º RGPD).',
                    phonePlaceholder: '+506 8000 0000'
                },
                services: {
                    compliance: 'Conformidade com a Lei n.º 8968, o RGPD e avisos legais atualizados',
                    description: 'Serviços de infraestrutura digital para a Costa Rica: desenvolvimento web, sistemas cloud, CRM à medida, cibersegurança e conformidade com a Lei n.º 8968 e o RGPD.'
                },
                legal: {
                    privacyLaw: 'a <strong>Lei n.º 8968 de Proteção da Pessoa face ao Tratamento dos seus Dados Pessoais da Costa Rica</strong> e o respetivo Regulamento (Decreto Executivo n.º 37554-JP)',
                    territory: 'Costa Rica e a União Europeia',
                    authorityName: 'Agência de Proteção dos Dados dos Habitantes da Costa Rica (PRODHAB)',
                    authorityUrl: 'https://www.prodhab.go.cr',
                    cookieRule: 'a <strong>Lei n.º 8968 e o Decreto Executivo n.º 37554-JP</strong> da Costa Rica',
                    scopeBody: 'A Elysium λ Development & Research presta serviços profissionais nas áreas de engenharia de software, desenvolvimento web, arquitetura de sistemas, investigação digital e consultoria técnica afim. Estes serviços são prestados ao abrigo do modelo de subscrição publicado na página de Serviços e podem incluir, consoante o plano contratado, desenvolvimento web, domínio, e-mail e alojamento, conformidade com a Lei n.º 8968 da Costa Rica, o RGPD e avisos legais, agenda pública com lembretes automáticos, ficha de cliente, área privada do cliente com login e histórico, CRM do administrador, pagamentos online e pacotes de sessões, e relatórios de ocupação e faltas. As condições específicas de cada projeto (entregáveis, prazos, preços) regem-se por acordos de serviço individuais emitidos separadamente.',
                    withdrawalHeading: '3. Direito de retratação (Costa Rica — Lei n.º 7472)',
                    withdrawalBody: 'Quando o cliente tiver a qualidade legal de consumidor ou utilizador final na Costa Rica e celebrar um contrato à distância ou por meios eletrónicos ao abrigo da <strong>Lei de Promoção da Concorrência e Defesa Efetiva do Consumidor (Lei n.º 7472, art. 40.º)</strong> e respetivo Regulamento, dispõe, em regra, de um prazo de <strong>8 dias úteis</strong> a contar da celebração do contrato para exercer o direito de retratação sem penalização, salvo as exceções previstas na lei para serviços personalizados ou já executados.',
                    taxBody: 'Os orçamentos e contratos indicam se os montantes incluem impostos. Nas operações tributáveis ou consumidas na Costa Rica, o Imposto sobre o Valor Acrescentado (IVA) aplica-se quando devido nos termos da <strong>Lei de Fortalecimento das Finanças Públicas (Lei n.º 9635)</strong> e da legislação fiscal aplicável, tendo em conta a localização da operação, a natureza transfronteiriça do serviço digital e a situação fiscal do cliente. Cada fatura ou comprovativo indicará o enquadramento fiscal aplicável.',
                    disputeBody: 'Procuramos primeiro uma solução amigável através de <a href="mailto:info@elysiumdr.eu">info@elysiumdr.eu</a>. Não sendo alcançado um acordo, os consumidores na Costa Rica podem recorrer à <strong>Comissão Nacional do Consumidor (CNC)</strong> do <strong>Ministério da Economia, Indústria e Comércio (MEIC)</strong> através da plataforma <a href="https://www.consumidorenlinea.go.cr" target="_blank" rel="noopener noreferrer">Consumidor en Línea (www.consumidorenlinea.go.cr)</a> e exercer todos os meios previstos na Lei n.º 7472.',
                    governingBody: 'Para os serviços prestados a clientes na <strong>Costa Rica</strong>, os presentes Termos regem-se e interpretam-se no respeito pelas normas imperativas e de ordem pública da República da Costa Rica — em especial a Lei n.º 7472 e a Lei n.º 8968 —, sem prejuízo das normas europeias aplicáveis à sede social do prestador. Quando o utilizador tiver a qualidade de consumidor na Costa Rica, serão competentes as autoridades administrativas e os tribunais costa-riquenhos nos termos da lei.',
                    privacyDescription: 'Como a Elysium λ Development & Research trata e protege dados pessoais na Costa Rica ao abrigo da Lei n.º 8968 (PRODHAB) e do RGPD: conservação, segurança e autodeterminação informativa.',
                    termsDescription: 'Termos que regulam os serviços da Elysium λ Development & Research na Costa Rica: direito de retratação (Lei n.º 7472), privacidade, fiscalidade, litígios e lei aplicável.',
                    privacyFooter: '© 2026 Elysium λ Development & Research. Todos os direitos reservados. | <a href="https://www.prodhab.go.cr" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none;">PRODHAB Costa Rica</a>',
                    termsFooter: '© 2026 Elysium λ Development & Research. Todos os direitos reservados.'
                }
            }
        }
    };

    function normalizeLanguage(value) {
        if (typeof value !== 'string') return null;
        const match = /^(en|es|pt)(?:[-_][a-z]{2})?$/i.exec(value.trim());
        const normalized = match ? match[1].toLowerCase() : null;
        return normalized && SUPPORTED_LANGUAGES.has(normalized) ? normalized : null;
    }

    function getRuntimeConfiguration() {
        const hostname = (window.location.hostname || '').toLowerCase();
        const pathname = window.location.pathname || '/';
        if (hostname === 'elysiumdr.es') return { nativeLanguage: 'es', region: 'ES', isLocal: false };
        if (hostname === 'elysiumdr.pt') return { nativeLanguage: 'pt', region: 'PT', isLocal: false };
        if ((hostname === 'elysiumdr.com' || hostname === 'www.elysiumdr.com') && (pathname === '/cr' || pathname.startsWith('/cr/'))) {
            return { nativeLanguage: 'es', region: 'CR', isLocal: false };
        }

        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
        if (!isLocalhost) return null;

        let requestedNational = null;
        try {
            requestedNational = new URLSearchParams(window.location.search).get('national');
        } catch (error) {
            requestedNational = null;
        }

        if (requestedNational === 'es') return { nativeLanguage: 'es', region: 'ES', isLocal: true };
        if (requestedNational === 'pt') return { nativeLanguage: 'pt', region: 'PT', isLocal: true };
        if (requestedNational === 'cr' || pathname === '/cr' || pathname.startsWith('/cr/') || pathname.startsWith('/_national/cr/')) {
            return { nativeLanguage: 'es', region: 'CR', isLocal: true };
        }
        return null;
    }

    const configuration = getRuntimeConfiguration();
    if (configuration && configuration.region === 'CR') {
        LANGUAGE_TAGS.es = 'es-CR';
        LANGUAGE_UI.es.image = '/Images/Optimized/flag-cr-64.webp';
        LANGUAGE_UI.es.imageAlt = 'CR';
    }

    // A second script tag must not initialise or bind the document twice.
    if (window.ElysiumI18n && window.ElysiumI18n[ENGINE_MARKER]) return;

    if (!configuration) {
        // Expose a small, inert API for diagnostics without touching the DOM,
        // storage, fetch or any switcher on the European domain.
        window.ElysiumI18n = Object.freeze({
            [ENGINE_MARKER]: true,
            enabled: false,
            init: function () { return Promise.resolve(false); },
            translate: function () { return Promise.resolve(false); }
        });
        return;
    }

    const state = {
        activeLanguage: configuration.nativeLanguage,
        nativeSnapshot: null,
        initialized: false,
        initPromise: null,
        requestNumber: 0,
        requestController: null,
        sourceCache: new Map(),
        optionLanguages: new WeakMap()
    };

    function queryLanguageOverrideKey(queryLanguage) {
        return `${QUERY_OVERRIDE_KEY_PREFIX}${window.location.pathname}${window.location.search}:${queryLanguage}`;
    }

    function isQueryLanguageSuperseded(queryLanguage) {
        if (!queryLanguage) return false;
        try {
            const manualLanguage = normalizeLanguage(
                window.sessionStorage.getItem(queryLanguageOverrideKey(queryLanguage))
            );
            return Boolean(manualLanguage && manualLanguage !== queryLanguage);
        } catch (error) {
            return false;
        }
    }

    function readQueryLanguage() {
        let queryLanguage = null;
        try {
            queryLanguage = normalizeLanguage(new URLSearchParams(window.location.search).get('lang'));
        } catch (error) {
            queryLanguage = null;
        }
        return queryLanguage;
    }

    function readPreferredLanguage() {
        const queryLanguage = readQueryLanguage();
        if (queryLanguage && !isQueryLanguageSuperseded(queryLanguage)) {
            return { language: queryLanguage, source: 'query' };
        }

        let regionParam = null;
        try {
            regionParam = new URLSearchParams(window.location.search).get('region');
        } catch (error) {
            regionParam = null;
        }

        if (regionParam === 'ES' || (!queryLanguage && configuration && configuration.region === 'ES' && configuration.isLocal)) {
            return { language: 'es', source: 'region' };
        }
        if (regionParam === 'CR' || (!queryLanguage && configuration && configuration.region === 'CR' && configuration.isLocal)) {
            return { language: 'es', source: 'region' };
        }
        if (regionParam === 'PT' || (!queryLanguage && configuration && configuration.region === 'PT' && configuration.isLocal)) {
            return { language: 'pt', source: 'region' };
        }

        let storedLanguage = null;
        try {
            storedLanguage = normalizeLanguage(window.localStorage.getItem(STORAGE_KEY));
        } catch (error) {
            storedLanguage = null;
        }
        if (storedLanguage) return { language: storedLanguage, source: 'storage' };

        // Deliberadamente no se consulta navigator.language: cada dominio
        // nacional abre primero en su idioma nativo.
        return { language: configuration.nativeLanguage, source: 'native' };
    }

    function persistLanguage(language) {
        try {
            window.localStorage.setItem(STORAGE_KEY, language);
            // Conserva compatibilidad con el redirector histórico de .eu.
            window.localStorage.setItem('langOverride', 'true');
        } catch (error) {
            // El almacenamiento puede estar bloqueado; traducir debe continuar.
        }

        // El `?lang` de un cambio de región es un hand-off de una sola vez. Se
        // respeta la primera vez, pero si la persona elige después otro idioma
        // se recuerda esa decisión para los reloads de ESTA URL sin modificarla.
        const queryLanguage = readQueryLanguage();
        if (!queryLanguage) return;
        try {
            const key = queryLanguageOverrideKey(queryLanguage);
            if (language === queryLanguage) window.sessionStorage.removeItem(key);
            else window.sessionStorage.setItem(key, language);
        } catch (error) {
            // sessionStorage también puede estar bloqueado; la sesión actual
            // mantiene el idioma aunque un reload vuelva a aplicar el hand-off.
        }
    }

    function parseHTML(html) {
        const parsed = new DOMParser().parseFromString(html, 'text/html');
        if (!parsed || !parsed.documentElement || !parsed.body) {
            throw new Error('The translation response is not a complete HTML document.');
        }
        return parsed;
    }

    function captureNativeSnapshot() {
        if (state.nativeSnapshot) return;
        state.nativeSnapshot = parseHTML(document.documentElement.outerHTML);
        state.sourceCache.set(configuration.nativeLanguage, state.nativeSnapshot);
    }

    function isProtected(element) {
        return Boolean(element && element.closest && element.closest(PROTECTED_SELECTOR));
    }

    function stableClassSignature(element) {
        return Array.from(element.classList || [])
            .filter(className => !TRANSIENT_CLASSES.has(className))
            .sort()
            .join('.');
    }

    function normalizedHref(element) {
        if (element.tagName !== 'A') return '';
        const href = (element.getAttribute('href') || '').split('#')[0].split('?')[0];
        return href
            .replace(/^(?:\.\.\/|\.\/)+/, '')
            .replace(/^\/(?:es|pt|cr)\//, '/')
            .replace(/^(?:es|pt|cr)\//, '')
            .replace(/\.html$/, '')
            .replace(/\/$/, '');
    }

    function strongElementKey(element) {
        if (element.id) return `id:${element.id}`;
        const i18nKey = element.getAttribute('data-i18n');
        if (i18nKey) return `i18n:${i18nKey}`;
        const name = element.getAttribute('name');
        if (name && /^(?:INPUT|SELECT|TEXTAREA|FORM)$/.test(element.tagName)) {
            return `${element.tagName}:name:${name}`;
        }
        return null;
    }

    function softElementKey(element) {
        const role = element.getAttribute('role') || '';
        const type = element.getAttribute('type') || '';
        const href = normalizedHref(element);
        const optionValue = element.tagName === 'OPTION' ? element.getAttribute('value') || '' : '';
        return [element.tagName, stableClassSignature(element), role, type, href, optionValue].join('|');
    }

    function syncTranslatedAttributes(target, source) {
        TRANSLATABLE_ATTRIBUTES.forEach(attribute => {
            if (source.hasAttribute(attribute)) {
                target.setAttribute(attribute, source.getAttribute(attribute));
            }
        });

        // Submit/reset/button inputs render their value as visible text. Values
        // typed by visitors into normal form controls are intentionally kept.
        if (target.tagName === 'INPUT' && /^(?:button|reset|submit)$/i.test(target.type || '')) {
            if (source.hasAttribute('value')) target.setAttribute('value', source.getAttribute('value'));
        }
    }

    function meaningfulTextNodes(element) {
        return Array.from(element.childNodes).filter(node => (
            node.nodeType === Node.TEXT_NODE && /\S/.test(node.nodeValue || '')
        ));
    }

    function descendantTextNodes(element) {
        const texts = [];
        function visit(parent) {
            Array.from(parent.childNodes).forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    if (/\S/.test(node.nodeValue || '')) texts.push(node);
                    return;
                }
                if (node.nodeType !== Node.ELEMENT_NODE) return;
                if (isProtected(node) || SKIPPED_TAGS.has(node.tagName)) return;
                visit(node);
            });
        }
        visit(element);
        return texts;
    }

    /**
     * Empareja hijos sin depender solamente de su posición. Primero usa IDs y
     * claves i18n, después una LCS de firmas estructurales y finalmente el tag
     * más cercano. De este modo una pequeña diferencia entre las copias físicas
     * no desplaza la traducción del resto de la página.
     */
    function pairElementChildren(targetParent, sourceParent) {
        const targets = Array.from(targetParent.children);
        const sources = Array.from(sourceParent.children);
        const pairs = [];
        const usedTargets = new Set();
        const usedSources = new Set();

        const sourceByStrongKey = new Map();
        sources.forEach((source, index) => {
            const key = strongElementKey(source);
            if (!key) return;
            if (sourceByStrongKey.has(key)) sourceByStrongKey.set(key, null);
            else sourceByStrongKey.set(key, index);
        });

        targets.forEach((target, targetIndex) => {
            const key = strongElementKey(target);
            const sourceIndex = key ? sourceByStrongKey.get(key) : null;
            if (sourceIndex === null || sourceIndex === undefined || usedSources.has(sourceIndex)) return;
            if (target.tagName !== sources[sourceIndex].tagName) return;
            pairs.push([targetIndex, sourceIndex]);
            usedTargets.add(targetIndex);
            usedSources.add(sourceIndex);
        });

        const remainingTargets = targets.map((_, index) => index).filter(index => !usedTargets.has(index));
        const remainingSources = sources.map((_, index) => index).filter(index => !usedSources.has(index));
        const rows = remainingTargets.length + 1;
        const columns = remainingSources.length + 1;
        const lcs = Array.from({ length: rows }, () => new Uint16Array(columns));

        for (let row = 1; row < rows; row += 1) {
            for (let column = 1; column < columns; column += 1) {
                const target = targets[remainingTargets[row - 1]];
                const source = sources[remainingSources[column - 1]];
                if (softElementKey(target) === softElementKey(source)) {
                    lcs[row][column] = lcs[row - 1][column - 1] + 1;
                } else {
                    lcs[row][column] = Math.max(lcs[row - 1][column], lcs[row][column - 1]);
                }
            }
        }

        let row = remainingTargets.length;
        let column = remainingSources.length;
        while (row > 0 && column > 0) {
            const targetIndex = remainingTargets[row - 1];
            const sourceIndex = remainingSources[column - 1];
            if (softElementKey(targets[targetIndex]) === softElementKey(sources[sourceIndex])) {
                pairs.push([targetIndex, sourceIndex]);
                usedTargets.add(targetIndex);
                usedSources.add(sourceIndex);
                row -= 1;
                column -= 1;
            } else if (lcs[row - 1][column] >= lcs[row][column - 1]) {
                row -= 1;
            } else {
                column -= 1;
            }
        }

        // Estructuras casi iguales pueden cambiar una clase o un slug. El tag
        // equivalente más cercano es un último emparejamiento seguro.
        targets.forEach((target, targetIndex) => {
            if (usedTargets.has(targetIndex)) return;
            let bestSourceIndex = -1;
            let bestDistance = Infinity;
            sources.forEach((source, sourceIndex) => {
                if (usedSources.has(sourceIndex) || source.tagName !== target.tagName) return;
                const distance = Math.abs(sourceIndex - targetIndex);
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestSourceIndex = sourceIndex;
                }
            });
            if (bestSourceIndex >= 0) {
                pairs.push([targetIndex, bestSourceIndex]);
                usedTargets.add(targetIndex);
                usedSources.add(bestSourceIndex);
            }
        });

        return pairs
            .sort((left, right) => left[0] - right[0])
            .map(([targetIndex, sourceIndex]) => [targets[targetIndex], sources[sourceIndex]]);
    }

    function morphElement(target, source) {
        if (!target || !source || target.tagName !== source.tagName) return;
        if (isProtected(target) || isProtected(source) || SKIPPED_TAGS.has(target.tagName)) return;

        syncTranslatedAttributes(target, source);

        const targetTexts = meaningfulTextNodes(target);
        const sourceTexts = meaningfulTextNodes(source);
        let pairedTargetTexts = targetTexts;
        let pairedSourceTexts = sourceTexts;

        // Algunas copias envuelven una frase en <span data-i18n> y otras la
        // dejan como texto directo. Cuando eso ocurre, alinear el pequeño flujo
        // textual del componente traduce la frase sin reemplazar el wrapper ni
        // su listener. El límite evita una alineación global demasiado laxa.
        if (targetTexts.length !== sourceTexts.length) {
            const targetDescendants = descendantTextNodes(target);
            const sourceDescendants = descendantTextNodes(source);
            if (
                targetDescendants.length === sourceDescendants.length &&
                targetDescendants.length > 0 &&
                targetDescendants.length <= 40
            ) {
                pairedTargetTexts = targetDescendants;
                pairedSourceTexts = sourceDescendants;
            }
        }

        const textCount = Math.min(pairedTargetTexts.length, pairedSourceTexts.length);
        for (let index = 0; index < textCount; index += 1) {
            if (pairedTargetTexts[index].nodeValue !== pairedSourceTexts[index].nodeValue) {
                pairedTargetTexts[index].nodeValue = pairedSourceTexts[index].nodeValue;
            }
        }

        pairElementChildren(target, source).forEach(([targetChild, sourceChild]) => {
            morphElement(targetChild, sourceChild);
        });
    }

    function capturePremiumDialogContext() {
        const dialog = document.getElementById('premiumServiceModal');
        if (!dialog || !dialog.open) return null;
        const currentTitle = (dialog.querySelector('#premiumServiceModalTitle')?.textContent || '').trim();
        const cards = Array.from(document.querySelectorAll('.services .card'));
        const cardIndex = cards.findIndex(card => (
            (card.querySelector('.card-summary p')?.textContent || '').trim() === currentTitle
        ));
        return cardIndex >= 0 ? { dialog, cardIndex } : null;
    }

    function refreshPremiumDialog(context) {
        if (!context || !context.dialog.isConnected || !context.dialog.open) return;
        const card = document.querySelectorAll('.services .card')[context.cardIndex];
        if (!card) return;
        const title = context.dialog.querySelector('#premiumServiceModalTitle');
        const details = context.dialog.querySelector('#premiumServiceModalDetails');
        const cardTitle = card.querySelector('.card-summary p');
        const cardDetails = card.querySelector('.card-details');
        if (title && cardTitle) title.textContent = cardTitle.textContent;
        if (details && cardDetails) details.innerHTML = cardDetails.innerHTML;
    }

    function applyDocumentSource(source) {
        if (!source || !source.body) throw new Error('Translation source has no body.');
        const premiumDialogContext = capturePremiumDialogContext();
        morphElement(document.body, source.body);
        refreshPremiumDialog(premiumDialogContext);

        const sourceTitle = source.querySelector('head > title');
        if (sourceTitle && sourceTitle.textContent.trim()) document.title = sourceTitle.textContent;

        const sourceDescription = source.querySelector('meta[name="description" i]');
        const targetDescription = document.querySelector('meta[name="description" i]');
        if (sourceDescription && targetDescription && sourceDescription.hasAttribute('content')) {
            targetDescription.setAttribute('content', sourceDescription.getAttribute('content'));
        }
    }

    async function getLanguageSource(language, signal) {
        if (state.sourceCache.has(language)) return state.sourceCache.get(language);

        const endpoint = new URL('/__i18n', window.location.origin);
        endpoint.searchParams.set('lang', language);
        endpoint.searchParams.set('path', window.location.pathname);

        const response = await window.fetch(endpoint.href, {
            method: 'GET',
            credentials: 'same-origin',
            headers: { Accept: 'text/html' },
            signal
        });
        if (!response.ok) throw new Error(`Translation request failed with HTTP ${response.status}.`);

        const source = parseHTML(await response.text());
        state.sourceCache.set(language, source);
        return source;
    }

    function stripDiacritics(value) {
        return value.normalize ? value.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : value;
    }

    function inferOptionLanguage(option) {
        const remembered = state.optionLanguages.get(option);
        if (remembered) return remembered;

        const declared = normalizeLanguage(option.getAttribute('data-lang'));
        if (declared) {
            state.optionLanguages.set(option, declared);
            return declared;
        }

        const image = option.querySelector('img');
        const evidence = stripDiacritics([
            option.textContent || '',
            option.getAttribute('aria-label') || '',
            image ? image.getAttribute('src') || '' : '',
            image ? image.getAttribute('alt') || '' : ''
        ].join(' ').toLowerCase());

        let inferred = null;
        if (/\b(?:english|ingles|en|eu)\b|flag-eu/.test(evidence)) inferred = 'en';
        else if (/\b(?:espanol|spanish|es)\b|flag-(?:es|cr)/.test(evidence)) inferred = 'es';
        else if (/\b(?:portugues|portuguese|pt)\b|flag-pt/.test(evidence)) inferred = 'pt';

        if (inferred) {
            option.setAttribute('data-lang', inferred);
            state.optionLanguages.set(option, inferred);
        }
        return inferred;
    }

    function replaceVisibleLabel(element, label) {
        const textNodes = Array.from(element.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);
        const visibleText = textNodes.find(node => /\S/.test(node.nodeValue || ''));
        if (visibleText) {
            visibleText.nodeValue = `${label} `;
            textNodes.forEach(node => {
                if (node !== visibleText && /\S/.test(node.nodeValue || '')) node.nodeValue = ' ';
            });
        } else {
            element.insertBefore(document.createTextNode(`${label} `), element.firstChild);
        }
    }

    function updateLanguageSwitcher(language) {
        const interfaceText = INTERFACE_TEXT[language];

        document.querySelectorAll('.lang-switcher-dropdown').forEach(dropdown => {
            const trigger = dropdown.querySelector('.lang-switcher-trigger');
            if (trigger) {
                trigger.setAttribute('aria-label', interfaceText.selectLanguage);
                const currentLabel = trigger.querySelector('.lang-current-label');
                if (currentLabel) currentLabel.textContent = LANGUAGE_UI[language].shortLabel;
                const currentFlag = trigger.querySelector('img.flag-icon, img');
                if (currentFlag) {
                    currentFlag.setAttribute('src', LANGUAGE_UI[language].image);
                    currentFlag.setAttribute('alt', LANGUAGE_UI[language].imageAlt);
                }
            }

            dropdown.querySelectorAll('.lang-switcher-menu a, .lang-switcher-menu button').forEach(option => {
                const optionLanguage = inferOptionLanguage(option);
                if (!optionLanguage) return;

                const languageName = LANGUAGE_UI[optionLanguage].names[language];
                replaceVisibleLabel(option, languageName);
                option.setAttribute('data-lang', optionLanguage);
                option.setAttribute('aria-label', `${interfaceText.switchTo} ${languageName}`);
                option.classList.toggle('active', optionLanguage === language);
                if (optionLanguage === language) option.setAttribute('aria-current', 'true');
                else option.removeAttribute('aria-current');

                const flag = option.querySelector('img.flag-icon, img');
                if (flag) {
                    flag.setAttribute('src', LANGUAGE_UI[optionLanguage].image);
                    flag.setAttribute('alt', LANGUAGE_UI[optionLanguage].imageAlt);
                }
            });
        });
    }

    function updateRegionSwitcher(language) {
        const interfaceText = INTERFACE_TEXT[language];
        document.querySelectorAll('.region-switcher-dropdown').forEach(dropdown => {
            const trigger = dropdown.querySelector('.region-switcher-trigger');
            if (trigger) trigger.setAttribute('aria-label', interfaceText.selectRegion);

            const regionTag = dropdown.querySelector('.region-tag');
            if (regionTag) regionTag.textContent = interfaceText.regions[configuration.region];

            dropdown.querySelectorAll('.region-switcher-menu .region-item').forEach(item => {
                const region = (item.getAttribute('data-region') || '').toUpperCase();
                const label = interfaceText.regions[region];
                if (!label) return;
                replaceVisibleLabel(item, label);
                item.setAttribute('aria-label', label);
            });
        });
    }

    function currentPageName() {
        const segments = (window.location.pathname || '/')
            .split('/')
            .filter(Boolean);
        let page = segments.length ? segments[segments.length - 1] : 'index';
        page = page.replace(/\.html?$/i, '').toLowerCase();

        // En local también admite /es/, /pt/, /cr/ y las copias bajo _national.
        if (!page || page === configuration.nativeLanguage || page === 'cr' || page === '_national') return 'index';
        return page;
    }

    function isHomePage() {
        return currentPageName() === 'index';
    }

    function setHeroPrefix(heading, prefix) {
        const suffix = heading.querySelector('.hero-title-suffix');
        if (!suffix) {
            heading.textContent = prefix;
            return;
        }

        let prefixWasSet = false;
        Array.from(heading.childNodes).forEach(node => {
            if (node === suffix) return;
            if (node.nodeType === Node.TEXT_NODE) {
                if (!prefixWasSet) {
                    node.nodeValue = `${prefix} `;
                    prefixWasSet = true;
                } else if (/\S/.test(node.nodeValue || '')) {
                    node.nodeValue = ' ';
                }
            }
        });
        if (!prefixWasSet) heading.insertBefore(document.createTextNode(`${prefix} `), suffix);
    }

    function setMetadataDescription(description) {
        if (!description) return;
        [
            'meta[name="description" i]',
            'meta[property="og:description" i]',
            'meta[name="twitter:description" i]'
        ].forEach(selector => {
            const metadata = document.querySelector(selector);
            if (metadata) metadata.setAttribute('content', description);
        });
    }

    function applyRegionalHomeCopy(copy) {
        const premiumDialogContext = capturePremiumDialogContext();
        const cards = Array.from(document.querySelectorAll('.services .card-grid > .card'));

        const firstSummary = cards[0]?.querySelector('.card-summary p');
        if (firstSummary) firstSummary.textContent = copy.behaviour;

        const fourthSummary = cards[3]?.querySelector('.card-summary p');
        if (fourthSummary) fourthSummary.textContent = copy.governance;

        const complianceItem = cards[3]?.querySelector('.card-details li:nth-child(3)');
        if (complianceItem) {
            const title = complianceItem.querySelector('strong');
            const description = complianceItem.querySelector('span');
            if (title) title.textContent = copy.complianceTitle;
            if (description) description.textContent = copy.compliance;
        }

        const auditStep = Array.from(document.querySelectorAll('.timeline-section .timeline-item')).find(item => (
            (item.querySelector('.step-number')?.textContent || '').trim() === '09'
        ));
        const auditDescription = auditStep?.querySelector('.step-desc');
        if (auditDescription) auditDescription.textContent = copy.timeline;

        const research = document.querySelector('.research-teaser .research-teaser-flex > div:first-child > p.mb-md');
        if (research) research.innerHTML = copy.research;

        // Si la ficha 01/04 estaba abierta, sincroniza también el diálogo con
        // las correcciones regionales que se acaban de aplicar a la tarjeta.
        refreshPremiumDialog(premiumDialogContext);
    }

    function applyRegionalAboutCopy(copy) {
        const ethosCards = document.querySelectorAll('.page-header + .section .card-grid > .card');
        const mission = ethosCards[0]?.querySelector('p');
        const vision = ethosCards[1]?.querySelector('p');
        if (mission) mission.textContent = copy.mission;
        if (vision) vision.textContent = copy.vision;

        const story = document.getElementById('story-read-more');
        if (story) {
            const storyContainer = story.parentElement;
            const historyIntro = Array.from(storyContainer?.children || []).find(element => (
                element.tagName === 'P' && element.classList.contains('mb-md')
            ));
            if (historyIntro) historyIntro.textContent = copy.historyIntro;

            const paragraphs = story.querySelectorAll(':scope > p.mb-md');
            if (paragraphs[0]) paragraphs[0].textContent = copy.economy;
            if (paragraphs[1]) paragraphs[1].textContent = copy.nameIntro;
            // Los párrafos sobre Grecia/Beethoven y lambda son hechos
            // históricos compartidos y se conservan tal como los tradujo la fuente.
            if (paragraphs[4]) paragraphs[4].innerHTML = copy.aspiration;

            const future = story.nextElementSibling?.querySelector('p.mb-0');
            if (future) future.textContent = copy.future;
        }

        const developersSection = document.querySelector('.developers-grid')?.closest('section');
        const location = developersSection?.nextElementSibling?.querySelector('.section-header + div > p:first-child');
        if (location) location.textContent = copy.location;
        setMetadataDescription(copy.description);
    }

    function applyRegionalContactCopy(copy) {
        const contactInfo = document.querySelector('.contact-grid > div:first-child');
        if (contactInfo) {
            const blocks = Array.from(contactInfo.children).filter(element => element.classList.contains('mb-md'));
            const phoneBlock = blocks[1];
            const coverageBlock = blocks[2];

            const phoneHeading = phoneBlock?.querySelector('h5');
            const phone = phoneBlock?.querySelector('p');
            if (phoneHeading) phoneHeading.textContent = copy.phoneLabel;
            if (phone) {
                phone.innerHTML = `<a href="tel:+351934086075" style="font-size: 1.2rem;">+351 934 086 075</a> (${copy.phoneSuffix})`;
            }

            const coverageHeading = coverageBlock?.querySelector('h5');
            const coverage = coverageBlock?.querySelector('p');
            if (coverageHeading) coverageHeading.textContent = copy.coverageLabel;
            if (coverage) coverage.textContent = copy.coverage;
        }
        setMetadataDescription(copy.description);
    }

    function applyRegionalServicesCopy(copy) {
        const compliance = document.querySelector('#matrixLabels > .matrix-label-cell:nth-child(4)');
        if (compliance) compliance.textContent = copy.compliance;
        setMetadataDescription(copy.description);
    }

    function applyRegionalOnboardingCopy(copy) {
        const fileNotice = document.querySelector('.upload-zone[data-upload-category="data"] + .micro-copy');
        if (fileNotice) fileNotice.innerHTML = copy.files;

        const healthInput = document.querySelector('input[name="sensitive_data"][value="health"]');
        const healthLabel = healthInput?.closest('label');
        if (healthInput && healthLabel) {
            Array.from(healthLabel.childNodes).forEach(node => {
                if (node !== healthInput) node.remove();
            });
            healthLabel.appendChild(document.createTextNode(` ${copy.health}`));
        }

        const filesConsent = document.querySelector('input[name="files_consent"] + span');
        if (filesConsent) filesConsent.textContent = copy.consent;

        if (copy.phonePlaceholder) {
            const phoneInput = document.querySelector('input[name="contact_phone"]');
            if (phoneInput) phoneInput.setAttribute('placeholder', copy.phonePlaceholder);
        }
    }

    function legalContentSections() {
        const header = document.querySelector('.page-header');
        const section = header?.nextElementSibling;
        const container = section && Array.from(section.children).find(element => (
            element.classList.contains('container')
        ));
        if (!container) return [];
        return Array.from(container.children).filter(element => (
            element.classList.contains('mb-lg') && element.querySelector('h2')
        ));
    }

    function replaceLegalSections(replacements) {
        const sections = legalContentSections();
        Object.entries(replacements).forEach(([number, html]) => {
            const section = sections.find(candidate => {
                const heading = (candidate.querySelector('h2')?.textContent || '').trim();
                return heading.startsWith(`${number}.`);
            });
            if (section) section.innerHTML = html;
        });
    }

    function buildPrivacySections(language, legal) {
        if (language === 'en') {
            return {
                3: `<h2 class="mb-sm">3. Special-category data — health information (GDPR Art. 9)</h2><p>Where a project involves health-related or clinically sensitive information, it is <strong>special-category personal data</strong> under Article 9 of the GDPR and ${legal.privacyLaw}.</p><p>We process it only where a valid condition under GDPR Article 9 applies. Where that condition is explicit consent, the consent is documented and may be withdrawn at any time without affecting prior lawful processing.</p>`,
                4: `<h2 class="mb-sm">4. Legal bases for processing</h2><p>We process personal data on the following legal bases:</p><ul><li><strong>Consent:</strong> when you voluntarily submit a form or specifically authorise processing.</li><li><strong>Pre-contractual steps and contract:</strong> to prepare a quote, proposal, technical assessment, or deliver an agreed service.</li><li><strong>Legitimate interests:</strong> to maintain the security, integrity, and proper operation of our systems, after balancing those interests against your rights.</li><li><strong>Legal obligation:</strong> to meet fiscal, regulatory, and security obligations applicable in ${legal.territory}.</li></ul>`,
                5: '<h2 class="mb-sm">5. Retention and secure deletion</h2><p>We keep personal data only for as long as necessary for the purpose for which it was collected and for any applicable legal, fiscal, or regulatory period.</p><ul><li><strong>Health and clinical data:</strong> anonymised after <strong>5 years of inactivity</strong>, unless an applicable law or active contract requires a different period.</li><li><strong>Fiscal and user-profile data:</strong> restricted for the applicable statutory period and then securely deleted or anonymised.</li></ul><p>Scheduled backend tasks enforce deletion and anonymisation controls.</p>',
                6: `<h2 class="mb-sm">6. Your data-protection rights</h2><p>Under the GDPR and ${legal.privacyLaw}, you may exercise the following rights free of charge:</p><ul><li><strong>Access</strong> to your personal data.</li><li><strong>Rectification</strong> of inaccurate or incomplete data.</li><li><strong>Erasure</strong> where the statutory conditions apply.</li><li><strong>Restriction</strong> of processing in the cases provided by law.</li><li><strong>Data portability</strong> in a structured, commonly used format.</li><li><strong>Objection</strong> to processing based on legitimate interests or direct marketing.</li><li><strong>Withdrawal of consent</strong> at any time, without affecting prior lawful processing.</li></ul><p>Send requests to <strong>info@elysiumdr.eu</strong>.</p>`,
                8: '<h2 class="mb-sm">8. International data transfers</h2><p>Global providers such as Google Cloud may process data outside the European Economic Area (EEA). Where this occurs, we use a valid GDPR transfer mechanism, such as an adequacy decision or <strong>Standard Contractual Clauses (SCCs)</strong> approved by the European Commission, together with supplementary safeguards where required.</p>',
                10: '<h2 class="mb-sm">10. Infrastructure certifications</h2><p>Our platform uses <strong>Google Cloud / Firebase</strong>. Google publishes compliance documentation for eligible services and configurations, including:</p><ul><li><strong>ISO/IEC 27001, 27017, 27018</strong> — information security and cloud-security management.</li><li><strong>SOC 1, SOC 2, SOC 3</strong> reports.</li><li><strong>PCI-DSS</strong> coverage for services and configurations identified by the provider as eligible.</li></ul><p>These certifications and reports belong to the infrastructure provider; they are not certifications held by Elysium λ Development & Research.</p>',
                11: `<h2 class="mb-sm">11. Cookies</h2><p>Our site uses technical cookies required for navigation and basic security. Any non-essential cookie is subject to the information and, where required, prior consent rules in ${legal.cookieRule}, the GDPR, and applicable European law.</p>`,
                13: `<h2 class="mb-sm">13. Right to lodge a complaint</h2><p>If you believe your data-protection rights have been infringed, you may lodge a complaint with the competent supervisory authority:</p><ul><li><strong>${legal.authorityName}:</strong> <a href="${legal.authorityUrl}" target="_blank" rel="noopener noreferrer">${legal.authorityUrl.replace('https://', '')}</a></li></ul>`
            };
        }

        if (language === 'es') {
            return {
                3: `<h2 class="mb-sm">3. Datos de categoría especial — información de salud (Art. 9 RGPD)</h2><p>Cuando un proyecto implique información de salud o clínicamente sensible, esta constituye <strong>datos personales de categoría especial</strong> conforme al Art. 9 del RGPD y a ${legal.privacyLaw}.</p><p>Solo la tratamos cuando concurre una condición válida del Art. 9 RGPD. Cuando esa condición sea el consentimiento explícito, quedará documentado y podrá retirarse en cualquier momento sin afectar al tratamiento lícito anterior.</p>`,
                4: `<h2 class="mb-sm">4. Bases jurídicas del tratamiento</h2><p>Tratamos datos personales conforme a las siguientes bases jurídicas:</p><ul><li><strong>Consentimiento:</strong> cuando envía voluntariamente un formulario o autoriza un tratamiento específico.</li><li><strong>Medidas precontractuales y contrato:</strong> para preparar un presupuesto, propuesta o evaluación técnica, o prestar un servicio acordado.</li><li><strong>Interés legítimo:</strong> para mantener la seguridad, integridad y operación adecuada de nuestros sistemas, tras ponderarlo con sus derechos.</li><li><strong>Obligación legal:</strong> para cumplir obligaciones fiscales, regulatorias y de seguridad aplicables en ${legal.territory}.</li></ul>`,
                5: '<h2 class="mb-sm">5. Conservación y eliminación segura</h2><p>Conservamos los datos personales solo durante el tiempo necesario para la finalidad para la que se recogieron y durante los plazos legales, fiscales o regulatorios aplicables.</p><ul><li><strong>Datos de salud y clínicos:</strong> se anonimizan tras <strong>5 años de inactividad</strong>, salvo que una ley o contrato vigente exija otro plazo.</li><li><strong>Datos fiscales y de perfil:</strong> se bloquean durante el plazo legal aplicable y después se eliminan o anonimizan de forma segura.</li></ul><p>Las tareas programadas del backend aplican los controles de eliminación y anonimización.</p>',
                6: `<h2 class="mb-sm">6. Sus derechos de protección de datos</h2><p>Conforme al RGPD y a ${legal.privacyLaw}, puede ejercer gratuitamente:</p><ul><li><strong>Acceso</strong> a sus datos personales.</li><li><strong>Rectificación</strong> de datos inexactos o incompletos.</li><li><strong>Supresión</strong> cuando se cumplan los requisitos legales.</li><li><strong>Limitación</strong> del tratamiento en los casos previstos por la ley.</li><li><strong>Portabilidad</strong> en un formato estructurado y de uso común.</li><li><strong>Oposición</strong> al tratamiento basado en interés legítimo o mercadotecnia directa.</li><li><strong>Retirada del consentimiento</strong> en cualquier momento, sin afectar al tratamiento lícito anterior.</li></ul><p>Envíe sus solicitudes a <strong>info@elysiumdr.eu</strong>.</p>`,
                8: '<h2 class="mb-sm">8. Transferencias internacionales de datos</h2><p>Proveedores globales como Google Cloud pueden tratar datos fuera del Espacio Económico Europeo (EEE). Cuando esto ocurra, utilizamos un mecanismo válido del RGPD, como una decisión de adecuación o <strong>Cláusulas Contractuales Tipo (CCT)</strong> aprobadas por la Comisión Europea, junto con medidas adicionales cuando sean necesarias.</p>',
                10: '<h2 class="mb-sm">10. Certificaciones de infraestructura</h2><p>Nuestra plataforma utiliza <strong>Google Cloud / Firebase</strong>. Google publica documentación de cumplimiento para determinados servicios y configuraciones, entre ella:</p><ul><li><strong>ISO/IEC 27001, 27017, 27018</strong> — gestión de seguridad de la información y seguridad en la nube.</li><li>Informes <strong>SOC 1, SOC 2 y SOC 3</strong>.</li><li><strong>PCI-DSS</strong> para los servicios y configuraciones que el proveedor declara elegibles.</li></ul><p>Estas certificaciones e informes corresponden al proveedor de infraestructura; no son certificaciones propias de Elysium λ Development & Research.</p>',
                11: `<h2 class="mb-sm">11. Cookies</h2><p>Nuestro sitio utiliza cookies técnicas necesarias para la navegación y la seguridad básica. Cualquier cookie no esencial queda sujeta a los deberes de información y, cuando proceda, consentimiento previo de ${legal.cookieRule}, el RGPD y la normativa europea aplicable.</p>`,
                13: `<h2 class="mb-sm">13. Derecho a reclamar</h2><p>Si considera vulnerados sus derechos de protección de datos, puede presentar una reclamación ante la autoridad de control competente:</p><ul><li><strong>${legal.authorityName}:</strong> <a href="${legal.authorityUrl}" target="_blank" rel="noopener noreferrer">${legal.authorityUrl.replace('https://', '')}</a></li></ul>`
            };
        }

        return {
            3: `<h2 class="mb-sm">3. Dados de categoria especial — informação de saúde (art. 9.º RGPD)</h2><p>Quando um projeto envolva informação de saúde ou clinicamente sensível, esta constitui <strong>dados pessoais de categoria especial</strong> nos termos do art. 9.º do RGPD e de ${legal.privacyLaw}.</p><p>Apenas a tratamos quando se verifique uma condição válida do art. 9.º do RGPD. Quando essa condição seja o consentimento explícito, este fica documentado e pode ser retirado a qualquer momento sem afetar o tratamento lícito anterior.</p>`,
            4: `<h2 class="mb-sm">4. Fundamentos jurídicos do tratamento</h2><p>Tratamos dados pessoais com base nos seguintes fundamentos:</p><ul><li><strong>Consentimento:</strong> quando envia voluntariamente um formulário ou autoriza um tratamento específico.</li><li><strong>Diligências pré-contratuais e contrato:</strong> para preparar um orçamento, proposta ou avaliação técnica, ou prestar um serviço acordado.</li><li><strong>Interesse legítimo:</strong> para manter a segurança, integridade e operação adequada dos sistemas, após ponderação com os seus direitos.</li><li><strong>Obrigação legal:</strong> para cumprir obrigações fiscais, regulamentares e de segurança aplicáveis em ${legal.territory}.</li></ul>`,
            5: '<h2 class="mb-sm">5. Conservação e eliminação segura</h2><p>Conservamos os dados pessoais apenas durante o tempo necessário para a finalidade da recolha e durante os prazos legais, fiscais ou regulamentares aplicáveis.</p><ul><li><strong>Dados de saúde e clínicos:</strong> anonimizados após <strong>5 anos de inatividade</strong>, salvo se uma lei ou contrato em vigor exigir outro prazo.</li><li><strong>Dados fiscais e de perfil:</strong> bloqueados durante o prazo legal aplicável e depois eliminados ou anonimizados de forma segura.</li></ul><p>As tarefas programadas do backend aplicam os controlos de eliminação e anonimização.</p>',
            6: `<h2 class="mb-sm">6. Os seus direitos de proteção de dados</h2><p>Nos termos do RGPD e de ${legal.privacyLaw}, pode exercer gratuitamente:</p><ul><li><strong>Acesso</strong> aos seus dados pessoais.</li><li><strong>Retificação</strong> de dados inexatos ou incompletos.</li><li><strong>Apagamento</strong> quando se verifiquem os requisitos legais.</li><li><strong>Limitação</strong> do tratamento nos casos previstos na lei.</li><li><strong>Portabilidade</strong> num formato estruturado e de uso corrente.</li><li><strong>Oposição</strong> ao tratamento baseado em interesse legítimo ou marketing direto.</li><li><strong>Retirada do consentimento</strong> a qualquer momento, sem afetar o tratamento lícito anterior.</li></ul><p>Envie os pedidos para <strong>info@elysiumdr.eu</strong>.</p>`,
            8: '<h2 class="mb-sm">8. Transferências internacionais de dados</h2><p>Prestadores globais como a Google Cloud podem tratar dados fora do Espaço Económico Europeu (EEE). Quando tal aconteça, utilizamos um mecanismo válido do RGPD, como uma decisão de adequação ou <strong>Cláusulas Contratuais-Tipo (CCT)</strong> aprovadas pela Comissão Europeia, juntamente com medidas adicionais quando necessário.</p>',
            10: '<h2 class="mb-sm">10. Certificações de infraestrutura</h2><p>A nossa plataforma utiliza <strong>Google Cloud / Firebase</strong>. A Google publica documentação de conformidade para determinados serviços e configurações, incluindo:</p><ul><li><strong>ISO/IEC 27001, 27017, 27018</strong> — gestão da segurança da informação e segurança na cloud.</li><li>Relatórios <strong>SOC 1, SOC 2 e SOC 3</strong>.</li><li><strong>PCI-DSS</strong> para os serviços e configurações que o fornecedor declara elegíveis.</li></ul><p>Estas certificações e relatórios pertencem ao fornecedor de infraestrutura; não são certificações da Elysium λ Development & Research.</p>',
            11: `<h2 class="mb-sm">11. Cookies</h2><p>O nosso site utiliza cookies técnicos necessários à navegação e à segurança básica. Qualquer cookie não essencial fica sujeito aos deveres de informação e, quando aplicável, consentimento prévio previstos em ${legal.cookieRule}, no RGPD e na legislação europeia aplicável.</p>`,
            13: `<h2 class="mb-sm">13. Direito a apresentar reclamação</h2><p>Se considerar que os seus direitos de proteção de dados foram violados, pode apresentar reclamação à autoridade de controlo competente:</p><ul><li><strong>${legal.authorityName}:</strong> <a href="${legal.authorityUrl}" target="_blank" rel="noopener noreferrer">${legal.authorityUrl.replace('https://', '')}</a></li></ul>`
        };
    }

    function buildTermsSections(language, legal) {
        if (language === 'en') {
            const sections = {
                3: `<h2 class="mb-sm">${legal.withdrawalHeading}</h2><p>${legal.withdrawalBody}</p><p>To exercise this right, send an unequivocal request to <a href="mailto:info@elysiumdr.eu">info@elysiumdr.eu</a> before the deadline. If you ask us to begin during that period, you may owe a proportionate amount for work already performed; the right may end after full performance where the consent and acknowledgement required by law were given.</p>`,
                4: `<h2 class="mb-sm">4. Data protection and privacy</h2><p>Personal-data processing is governed by our <a href="privacy">Privacy Policy</a>, incorporated into these Terms by reference. We comply with:</p><ul><li><strong>GDPR (EU 2016/679)</strong>.</li><li>${legal.privacyLaw}.</li></ul><p>Special-category data is processed only where a valid condition under GDPR Article 9 and the applicable national law exists.</p>`,
                7: `<h2 class="mb-sm">7. Tax obligations</h2><p>${legal.taxBody}</p>`,
                8: `<h2 class="mb-sm">8. Dispute resolution</h2><p>${legal.disputeBody}</p>`,
                9: `<h2 class="mb-sm">9. Governing law and jurisdiction</h2><p>${legal.governingBody}</p>`,
                10: '<h2 class="mb-sm">10. Infrastructure and security certifications</h2><p>Our services use <strong>Google Cloud / Firebase</strong>. Google publishes compliance documentation for eligible services and configurations, including ISO/IEC 27001, 27017 and 27018, SOC reports, and PCI-DSS coverage.</p><p>Those certifications and reports belong to the infrastructure provider and do not constitute certification of Elysium λ Development & Research. Our own controls include HSTS, Content Security Policy, and HMAC-SHA256 token signing.</p>'
            };
            if (legal.scopeBody) sections[2] = `<h2 class="mb-sm">2. Scope of services</h2><p>${legal.scopeBody}</p>`;
            return sections;
        }

        if (language === 'es') {
            const sections = {
                3: `<h2 class="mb-sm">${legal.withdrawalHeading}</h2><p>${legal.withdrawalBody}</p><p>Para ejercer este derecho, envíe una solicitud inequívoca a <a href="mailto:info@elysiumdr.eu">info@elysiumdr.eu</a> antes de que venza el plazo. Si solicita el inicio del servicio durante ese periodo, podrá exigirse el importe proporcional de lo ya ejecutado; el derecho podrá extinguirse tras la ejecución completa cuando se hayan prestado el consentimiento y reconocimiento exigidos por la ley.</p>`,
                4: `<h2 class="mb-sm">4. Protección de datos personales</h2><p>El tratamiento de datos personales se rige por nuestra <a href="privacy">Política de Privacidad</a>, incorporada por referencia a estos Términos. Cumplimos con:</p><ul><li><strong>RGPD (UE 2016/679)</strong>.</li><li>${legal.privacyLaw}.</li></ul><p>Los datos de categoría especial solo se tratan cuando existe una condición válida conforme al Art. 9 RGPD y a la normativa nacional aplicable.</p>`,
                7: `<h2 class="mb-sm">7. Obligaciones tributarias</h2><p>${legal.taxBody}</p>`,
                8: `<h2 class="mb-sm">8. Resolución de conflictos</h2><p>${legal.disputeBody}</p>`,
                9: `<h2 class="mb-sm">9. Ley aplicable y jurisdicción</h2><p>${legal.governingBody}</p>`,
                10: '<h2 class="mb-sm">10. Certificaciones de infraestructura y seguridad</h2><p>Nuestros servicios utilizan <strong>Google Cloud / Firebase</strong>. Google publica documentación de cumplimiento para servicios y configuraciones elegibles, incluidas ISO/IEC 27001, 27017 y 27018, informes SOC y cobertura PCI-DSS.</p><p>Esas certificaciones e informes corresponden al proveedor de infraestructura y no certifican a Elysium λ Development & Research. Nuestros propios controles incluyen HSTS, Política de Seguridad de Contenido y firma de tokens HMAC-SHA256.</p>'
            };
            if (legal.scopeBody) sections[2] = `<h2 class="mb-sm">2. Alcance de los servicios</h2><p>${legal.scopeBody}</p>`;
            return sections;
        }

        const sections = {
            3: `<h2 class="mb-sm">${legal.withdrawalHeading}</h2><p>${legal.withdrawalBody}</p><p>Para exercer este direito, envie uma declaração inequívoca para <a href="mailto:info@elysiumdr.eu">info@elysiumdr.eu</a> antes do fim do prazo. Se solicitar o início do serviço durante esse período, poderá ser devido o montante proporcional ao trabalho já realizado; o direito pode cessar após a execução integral quando tenham sido prestados o consentimento e reconhecimento exigidos por lei.</p>`,
            4: `<h2 class="mb-sm">4. Proteção de dados e privacidade</h2><p>O tratamento de dados pessoais rege-se pela nossa <a href="privacy">Política de Privacidade</a>, incorporada por referência nestes Termos. Cumprimos:</p><ul><li><strong>RGPD (UE 2016/679)</strong>.</li><li>${legal.privacyLaw}.</li></ul><p>Os dados de categoria especial só são tratados quando exista uma condição válida nos termos do art. 9.º do RGPD e da lei nacional aplicável.</p>`,
            7: `<h2 class="mb-sm">7. Obrigações fiscais</h2><p>${legal.taxBody}</p>`,
            8: `<h2 class="mb-sm">8. Resolução de litígios</h2><p>${legal.disputeBody}</p>`,
            9: `<h2 class="mb-sm">9. Lei aplicável e jurisdição</h2><p>${legal.governingBody}</p>`,
            10: '<h2 class="mb-sm">10. Certificações de infraestrutura e segurança</h2><p>Os nossos serviços utilizam <strong>Google Cloud / Firebase</strong>. A Google publica documentação de conformidade para serviços e configurações elegíveis, incluindo ISO/IEC 27001, 27017 e 27018, relatórios SOC e cobertura PCI-DSS.</p><p>Essas certificações e relatórios pertencem ao fornecedor de infraestrutura e não certificam a Elysium λ Development & Research. Os nossos próprios controlos incluem HSTS, Content Security Policy e assinatura de tokens HMAC-SHA256.</p>'
        };
        if (legal.scopeBody) sections[2] = `<h2 class="mb-sm">2. Âmbito dos serviços</h2><p>${legal.scopeBody}</p>`;
        return sections;
    }

    function applyRegionalPrivacyCopy(language, legal) {
        replaceLegalSections(buildPrivacySections(language, legal));
        setMetadataDescription(legal.privacyDescription);
        const footerCopyright = document.querySelector('footer .footer-bottom-left > span:first-child');
        if (footerCopyright) footerCopyright.innerHTML = legal.privacyFooter;
    }

    function applyRegionalTermsCopy(language, legal) {
        replaceLegalSections(buildTermsSections(language, legal));
        setMetadataDescription(legal.termsDescription);
        const footerCopyright = document.querySelector('footer .footer-bottom-left > span:first-child');
        if (footerCopyright) footerCopyright.innerHTML = legal.termsFooter;
    }

    function applyRegionalPageOverrides(language) {
        const copy = REGIONAL_PAGE_COPY[configuration.region]?.[language];
        if (!copy) return;

        switch (currentPageName()) {
            case 'index':
                applyRegionalHomeCopy(copy.home);
                break;
            case 'about':
                applyRegionalAboutCopy(copy.about);
                break;
            case 'contact':
                applyRegionalContactCopy(copy.contact);
                break;
            case 'services':
                applyRegionalServicesCopy(copy.services);
                break;
            case 'onboarding':
                applyRegionalOnboardingCopy(copy.onboarding);
                break;
            case 'privacy':
                applyRegionalPrivacyCopy(language, copy.legal);
                break;
            case 'terms':
                applyRegionalTermsCopy(language, copy.legal);
                break;
            default:
                break;
        }
    }

    function applyNationalOverrides(language) {
        const copy = HOME_COPY[configuration.region][language];
        if (!copy) return;

        // El footer es regional en todas las rutas, aunque su idioma cambie.
        const footerFirstColumn = document.querySelector('footer .footer-grid .footer-col:first-child');
        if (footerFirstColumn) {
            const serviceNote = footerFirstColumn.querySelector('.footer-service-note');
            const taglineCandidates = Array.from(footerFirstColumn.children).filter(element => (
                element.tagName === 'P' && !element.classList.contains('footer-service-note')
            ));
            if (taglineCandidates[0]) taglineCandidates[0].innerHTML = copy.footer;
            if (serviceNote) serviceNote.textContent = copy.serviceNote;
        }

        if (isHomePage()) {
            const heroHeading = document.querySelector('.hero h1');
            if (heroHeading) setHeroPrefix(heroHeading, copy.hero);

            const cta = document.querySelector('.cta-final');
            if (cta) {
                const title = cta.querySelector('h2');
                const text = cta.querySelector('p');
                const button = cta.querySelector('a.btn, button.btn');
                if (title) title.textContent = copy.ctaTitle;
                if (text) text.textContent = copy.ctaText;
                if (button) button.textContent = copy.ctaButton;
            }

            setMetadataDescription(copy.description);
        }

        applyRegionalPageOverrides(language);
    }

    function updateDocumentLanguage(language) {
        document.documentElement.lang = LANGUAGE_TAGS[language];
        document.body.dataset.activeLanguage = language;
        updateLanguageSwitcher(language);
        updateRegionSwitcher(language);
        applyNationalOverrides(language);
        const premiumModalClose = document.getElementById('premiumServiceModalClose');
        if (premiumModalClose) premiumModalClose.setAttribute('aria-label', INTERFACE_TEXT[language].closeDialog);
    }

    function closeLanguageMenus() {
        document.querySelectorAll('.lang-switcher-dropdown').forEach(dropdown => {
            dropdown.classList.remove('is-open');
            const trigger = dropdown.querySelector('.lang-switcher-trigger');
            if (trigger) trigger.setAttribute('aria-expanded', 'false');
        });
    }

    function dispatchLanguageChange(language, previousLanguage, reason, extra) {
        document.dispatchEvent(new CustomEvent('elysium:languagechange', {
            bubbles: true,
            detail: Object.assign({
                language,
                previousLanguage,
                nativeLanguage: configuration.nativeLanguage,
                region: configuration.region,
                reason
            }, extra || {})
        }));
    }

    async function changeLanguage(requestedLanguage, options) {
        const language = normalizeLanguage(requestedLanguage);
        if (!language) return false;

        const settings = Object.assign({ persist: false, reason: 'api' }, options || {});
        const previousLanguage = state.activeLanguage;
        const requestNumber = ++state.requestNumber;

        if (state.requestController) state.requestController.abort();
        state.requestController = typeof AbortController === 'function' ? new AbortController() : null;
        const signal = state.requestController ? state.requestController.signal : undefined;

        document.documentElement.setAttribute('data-i18n-loading', language);

        try {
            const source = language === configuration.nativeLanguage
                ? state.nativeSnapshot
                : await getLanguageSource(language, signal);

            if (requestNumber !== state.requestNumber) return false;
            applyDocumentSource(source);
            state.activeLanguage = language;
            updateDocumentLanguage(language);
            if (settings.persist) persistLanguage(language);
            closeLanguageMenus();
            dispatchLanguageChange(language, previousLanguage, settings.reason);
            return true;
        } catch (error) {
            if ((error && error.name === 'AbortError') || requestNumber !== state.requestNumber) return false;

            // Un fallo de red nunca deja idioma, URL y contenido en estados
            // distintos: se restaura inmediatamente el snapshot nativo.
            applyDocumentSource(state.nativeSnapshot);
            state.activeLanguage = configuration.nativeLanguage;
            updateDocumentLanguage(configuration.nativeLanguage);
            persistLanguage(configuration.nativeLanguage);
            closeLanguageMenus();
            dispatchLanguageChange(configuration.nativeLanguage, previousLanguage, 'fallback', {
                requestedLanguage: language,
                error
            });
            return false;
        } finally {
            if (requestNumber === state.requestNumber) {
                document.documentElement.removeAttribute('data-i18n-loading');
                state.requestController = null;
            }
        }
    }

    function languageOptionFromEvent(event) {
        const rawTarget = event.target;
        const target = rawTarget instanceof Element ? rawTarget : rawTarget && rawTarget.parentElement;
        const option = target && target.closest('a, button');
        if (!option || !option.closest('.lang-switcher-menu')) return null;
        return option;
    }

    function handleLanguageOptionClick(event) {
        const option = languageOptionFromEvent(event);
        if (!option) return;

        // Capture + stopImmediatePropagation prevents both the anchor default
        // and any legacy navigation listener registered later by main.js.
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        const language = inferOptionLanguage(option);
        if (language) changeLanguage(language, { persist: true, reason: 'switcher' });
    }

    function preventAuxiliaryLanguageNavigation(event) {
        if (!languageOptionFromEvent(event)) return;
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
    }

    function bindLanguageSwitcher() {
        // Un único handler delegado cubre encabezado, footer y menús que se
        // añadan posteriormente. No se registra ningún handler de región.
        document.addEventListener('click', handleLanguageOptionClick, true);
        document.addEventListener('auxclick', preventAuxiliaryLanguageNavigation, true);
    }

    function initialise() {
        if (state.initPromise) return state.initPromise;

        state.initPromise = Promise.resolve().then(async function () {
            if (state.initialized) return true;
            captureNativeSnapshot();
            bindLanguageSwitcher();
            state.initialized = true;

            const preference = readPreferredLanguage();
            return changeLanguage(preference.language, {
                persist: preference.source === 'query',
                reason: `initial-${preference.source}`
            });
        });
        return state.initPromise;
    }

    const publicAPI = {
        [ENGINE_MARKER]: true,
        enabled: true,
        nativeLanguage: configuration.nativeLanguage,
        region: configuration.region,
        get language() { return state.activeLanguage; },
        init: initialise,
        // Mantiene compatibilidad con la firma anterior translate(lang, manual).
        translate: function (language, manual) {
            const persist = manual === undefined ? true : Boolean(manual);
            if (!state.initialized) {
                return initialise().then(() => changeLanguage(language, { persist, reason: 'api' }));
            }
            return changeLanguage(language, { persist, reason: 'api' });
        }
    };

    window.ElysiumI18n = publicAPI;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialise, { once: true });
    } else {
        initialise();
    }
})();
