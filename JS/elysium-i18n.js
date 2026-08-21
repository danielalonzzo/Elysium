/**
 * Elysium Client-Side Dynamic Translation & Localization Engine
 * Idiomas soportados: Español de España (es-ES, por defecto), UK English (en-GB), Português Europeu (pt-PT).
 */

(function () {
    const I18N_DICTIONARY = {
        'en': {
            'nav.services': 'Services',
            'nav.portfolio': 'Portfolio',
            'nav.research': 'Research',
            'nav.about': 'About Us',
            'nav.account': 'Account',
            'nav.contact': 'Contact',
            'hero.subtitle': 'Development & Research',
            'hero.title': 'Digital Infrastructure for small businesses and entrepreneurs in Spain: <span class="hero-title-suffix">Zero Development Costs</span>',
            'hero.cta_start': 'Start a project',
            'hero.cta_services': 'View services',
            'tools.title': 'Our tools',
            'services.header_title': 'Areas of Expertise',
            'services.header_desc': 'Digital Infrastructure Included in your Monthly Subscription',
            'services.card1_summary': 'We design ergonomic interfaces adapted to Spanish user behaviour',
            'services.card1_b1_title': 'Optimisation:',
            'services.card1_b1_desc': ' We build platforms that respond instantaneously.',
            'services.card1_b2_title': 'Simplified Workflows:',
            'services.card1_b2_desc': ' We turn complex processes (such as booking appointments or lengthy forms) into intuitive steps to reduce cognitive load.',
            'services.card1_b3_title': 'Cross-Device Accessibility:',
            'services.card1_b3_desc': ' Fully responsive, accessible, and legible on mobiles, tablets, and desktop computers.',
            'services.card2_summary': 'We develop cloud infrastructure and database systems',
            'services.card2_b1_title': 'High Availability:',
            'services.card2_b1_desc': ' Cloud tech scaling automatically with traffic peaks, zero downtime.',
            'services.card2_b2_title': 'Data Synchronisation:',
            'services.card2_b2_desc': ' Instant multi-user real-time updates.',
            'services.card2_b3_title': 'Ecosystem Integration:',
            'services.card2_b3_desc': ' Connecting seamlessly with third-party payment gateways and calendars.',
            'services.card3_summary': 'We build bespoke CRM & Management Infrastructures',
            'services.card3_b1_title': 'Custom Software:',
            'services.card3_b1_desc': ' Crafted from scratch to match your unique operational rules.',
            'services.card3_b2_title': 'Automation:',
            'services.card3_b2_desc': ' Eliminating repetitive manual administrative tasks.',
            'services.card3_b3_title': 'Unified Dashboard:',
            'services.card3_b3_desc': ' All key business data accessible in one secure control panel.',
            'services.card4_summary': 'We implement the highest cybersecurity standards and Spanish governance protocols',
            'services.card4_b1_title': 'Data Protection:',
            'services.card4_b1_desc': ' Top-tier encryption and security compliance.',
            'services.card4_b2_title': 'Strict Access Control:',
            'services.card4_b2_desc': ' Role-based granular permissions protecting critical business assets.',
            'services.card4_b3_title': 'Regulatory Compliance:',
            'services.card4_b3_desc': ' Fully aligned with European GDPR, Spanish AEPD requirements, and international privacy standards.',
            'pricing.title': 'Subscription Plans',
            'pricing.subtitle': 'Zero upfront development fee',
            'pricing.plan_presence': 'Presence',
            'pricing.plan_infrastructure': 'Infrastructure',
            'pricing.plan_ecosystem': 'Ecosystem',
            'pricing.popular_badge': 'Most Popular',
            'pricing.month': '/ month',
            'pricing.yearly_opt_presence': 'Optional: <span class="dynamic-price" data-base-price="700">700 €</span> / year — two months free',
            'pricing.yearly_opt_infra': 'Optional: <span class="dynamic-price" data-base-price="990">990 €</span> / year — two months free',
            'pricing.yearly_opt_eco': 'Optional: <span class="dynamic-price" data-base-price="1200">1200 €</span> / year — two months free',
            'pricing.btn_subscribe': 'Subscribe',
            'pricing.explore_all': 'Explore all services',
            'team.title': 'Our Developers',
            'team.dan_title': 'Founder & Software Engineer',
            'team.dan_link': 'View Full Profile <span class="arrow">↗</span>',
            'methodology.title': 'Scientific Methodology',
            'methodology.subtitle': 'λ Framework Development Model',
            'research.title': 'Research & Development (R&D)',
            'research.desc': 'Elysium λ Development & Research operates as an independent engineering, research, and IT consultancy laboratory in Spain.<br><br>Our purpose is to democratise access to high-level digital infrastructure, enabling small businesses and entrepreneurs to scale their operations through a technological ecosystem.<br><br>We do not build simple interfaces; we combine scientific thinking, ergonomic design, and continuous experimentation to deliver software that resolves structural inefficiencies.',
            'research.btn': 'Research Lab',
            'research.mission_title': 'Mission Statement',
            'research.mission_desc': 'Democratising access to digital infrastructure, equipping small businesses and entrepreneurs with accessible tech ecosystems that automate operations and guarantee scalability.',
            'testimonials.title': 'Partner Testimonials',
            'standalone.title': 'Standalone Services',
            'standalone.subtitle': 'Optimum Performance, Operational Security & High Lead Retention',
            'cta.title': 'Elevate Your Digital Presence',
            'cta.text': 'Digital ecosystem for your enterprise. Built on Spanish values.',
            'cta.btn': 'Schedule consultation',
            'footer.tagline': 'Elysium λ Development & Research<br>Spain & Portugal, European Union',
            'footer.company': 'Company',
            'footer.legal': 'Legal',
            'footer.connect': 'Connect',
            'footer.rights': '© 2026 Elysium λ Development & Research. All rights reserved.'
        },
        'pt': {
            'nav.services': 'Serviços',
            'nav.portfolio': 'Portfólio',
            'nav.research': 'Investigação',
            'nav.about': 'Sobre nós',
            'nav.account': 'Conta',
            'nav.contact': 'Contacto',
            'hero.subtitle': 'Development & Research',
            'hero.title': 'Infraestrutura Digital para pequenas empresas e empreendedores em Espanha: <span class="hero-title-suffix">Sem Custos de Desenvolvimento</span>',
            'hero.cta_start': 'Iniciar um projeto',
            'hero.cta_services': 'Ver serviços',
            'tools.title': 'As nossas ferramentas',
            'services.header_title': 'Áreas de Especialização',
            'services.header_desc': 'Infraestrutura Digital Incluída na sua Subscrição Mensal',
            'services.card1_summary': 'Concebemos interfaces ergonómicas e adaptadas ao comportamento dos utilizadores espanhóis',
            'services.card1_b1_title': 'Otimização:',
            'services.card1_b1_desc': ' Desenvolvemos plataformas com resposta instantânea.',
            'services.card1_b2_title': 'Fluxos de Trabalho Simplificados:',
            'services.card1_b2_desc': ' Transformamos processos complexos em passos simples e intuitivos para reduzir a carga cognitiva.',
            'services.card1_b3_title': 'Acessibilidade Total:',
            'services.card1_b3_desc': ' Plataformas totalmente responsivas e legíveis em telemóveis, tablets e computadores.',
            'services.card2_summary': 'Desenvolvemos a infraestrutura digital na cloud (bases de dados)',
            'services.card2_b1_title': 'Alta Disponibilidade:',
            'services.card2_b1_desc': ' Tecnologia na cloud que se ajusta automaticamente a picos de tráfego, sem quebras de serviço.',
            'services.card2_b2_title': 'Sincronização em Tempo Real:',
            'services.card2_b2_desc': ' Atualizações instantâneas e consistentes para toda a equipa.',
            'services.card2_b3_title': 'Integração de Ecossistemas:',
            'services.card2_b3_desc': ' Ligação direta com métodos de pagamento e calendários corporativos.',
            'services.card3_summary': 'Programamos Infraestruturas de Gestão (CRM) à Medida',
            'services.card3_b1_title': 'Desenvolvimento Personalizado:',
            'services.card3_b1_desc': ' Software criado de raiz adaptado com precisão às regras do seu negócio.',
            'services.card3_b2_title': 'Automatização Operacional:',
            'services.card3_b2_desc': ' Eliminação de tarefas manuais repetitivas.',
            'services.card3_b3_title': 'Painel de Controlo Centralizado:',
            'services.card3_b3_desc': ' Todos os dados estratégicos reunidos numa interface segura e intuitiva.',
            'services.card4_summary': 'Implementamos os mais elevados padrões de cibersegurança e protocolos de governação espanhóis',
            'services.card4_b1_title': 'Proteção de Dados:',
            'services.card4_b1_desc': ' Criptografia e salvaguarda segundo as melhores práticas do setor.',
            'services.card4_b2_title': 'Controlo de Acessos Rigoroso:',
            'services.card4_b2_desc': ' Gestão granular de permissões por perfil de utilizador.',
            'services.card4_b3_title': 'Conformidade Legal:',
            'services.card4_b3_desc': ' Total cumprimento do RGPD europeu e normativas de privacidade.',
            'pricing.title': 'Planos de Subscrição',
            'pricing.subtitle': 'Não paga pelo desenvolvimento de software',
            'pricing.plan_presence': 'Presence',
            'pricing.plan_infrastructure': 'Infrastructure',
            'pricing.plan_ecosystem': 'Ecosystem',
            'pricing.popular_badge': 'Mais Popular',
            'pricing.month': '/ mês',
            'pricing.yearly_opt_presence': 'Opcional: <span class="dynamic-price" data-base-price="700">700 €</span> / ano — dois meses grátis',
            'pricing.yearly_opt_infra': 'Opcional: <span class="dynamic-price" data-base-price="990">990 €</span> / ano — dois meses grátis',
            'pricing.yearly_opt_eco': 'Opcional: <span class="dynamic-price" data-base-price="1200">1200 €</span> / ano — dois meses grátis',
            'pricing.btn_subscribe': 'Subscrever',
            'pricing.explore_all': 'Explorar todos os serviços',
            'team.title': 'Os Nossos Desenvolvedores',
            'team.dan_title': 'Fundador & Engenheiro Informático',
            'team.dan_link': 'Ver Perfil Completo <span class="arrow">↗</span>',
            'methodology.title': 'Metodologia Científica',
            'methodology.subtitle': 'Modelo λ de Desenvolvimento Framework',
            'research.title': 'Investigação e Desenvolvimento (I&D)',
            'research.desc': 'A Elysium λ Development & Research opera como um laboratório independente de engenharia, investigação e consultoria informática em Espanha.<br><br>O nosso propósito é democratizar o acesso a infraestruturas digitais de alto nível, permitindo às pequenas empresas e aos empreendedores escalar as suas operações através de um ecossistema tecnológico.<br><br>Não construímos simples interfaces; combinamos pensamento científico, design ergonómico e experimentação contínua para entregar software que resolve ineficiências estruturais.',
            'research.btn': 'Research Lab',
            'research.mission_title': 'Declaração de Missão',
            'research.mission_desc': 'Democratizar o acesso a infraestruturas digitais, dotando pequenas empresas e empreendedores de ecossistemas tecnológicos acessíveis que automatizam processos e garantem escalabilidade.',
            'testimonials.title': 'Testemunhos dos Nossos Parceiros',
            'standalone.title': 'Serviços Independentes',
            'standalone.subtitle': 'Desempenho Ótimo, Segurança Operacional e Alta Retenção de Clientes',
            'cta.title': 'Eleve a sua presença digital',
            'cta.text': 'Ecossistema digital para a sua empresa. Construído sobre valores espanhóis.',
            'cta.btn': 'Agendar consulta',
            'footer.tagline': 'Elysium λ Development & Research<br>Espanha & Portugal, União Europeia',
            'footer.company': 'Empresa',
            'footer.legal': 'Legal',
            'footer.connect': 'Ligar',
            'footer.rights': '© 2026 Elysium λ Development & Research. Todos os direitos reservados.'
        }
    };

    const originalSpanishMap = new Map();

    function captureOriginals() {
        if (originalSpanishMap.size > 0) return;
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (key) {
                originalSpanishMap.set(key, el.innerHTML);
            }
        });
    }

    const FLAG_PATHS = {
        'es': '../Images/Optimized/flag-es-64.webp',
        'en': '../Images/Optimized/flag-eu-64.webp',
        'pt': '../Images/Optimized/flag-pt-64.webp'
    };

    const LANG_LABELS = {
        'es': 'ES',
        'en': 'EN',
        'pt': 'PT'
    };

    function updateLanguageDropdownUI(lang) {
        document.querySelectorAll('.lang-switcher-dropdown').forEach(dropdown => {
            const label = dropdown.querySelector('.lang-current-label');
            const flag = dropdown.querySelector('.lang-switcher-trigger .flag-icon');
            if (label) label.textContent = LANG_LABELS[lang] || lang.toUpperCase();
            if (flag && FLAG_PATHS[lang]) flag.src = FLAG_PATHS[lang];
        });
    }

    function applyTranslation(targetLang, isManual = false) {
        captureOriginals();
        const normalized = (targetLang || 'es').slice(0, 2).toLowerCase();

        if (normalized === 'es') {
            originalSpanishMap.forEach((html, key) => {
                const elements = document.querySelectorAll(`[data-i18n="${key}"]`);
                elements.forEach(el => { el.innerHTML = html; });
            });
            document.documentElement.lang = 'es-ES';
            updateLanguageDropdownUI('es');
            if (isManual) {
                try { localStorage.setItem('elysium_lang_pref', 'es'); } catch (e) {}
            }
            return;
        }

        const dict = I18N_DICTIONARY[normalized];
        if (!dict) return;

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key]) {
                el.innerHTML = dict[key];
            }
        });

        document.documentElement.lang = normalized === 'en' ? 'en-GB' : 'pt-PT';
        updateLanguageDropdownUI(normalized);

        if (isManual) {
            try { localStorage.setItem('elysium_lang_pref', normalized); } catch (e) {}
        }
    }

    function initDynamicLocalization() {
        captureOriginals();

        let activeLang = null;
        try {
            activeLang = localStorage.getItem('elysium_lang_pref');
        } catch (e) {}

        if (!activeLang) {
            const rawNav = (navigator.language || navigator.userLanguage || 'es').toLowerCase();
            if (rawNav.startsWith('en')) {
                activeLang = 'en';
            } else if (rawNav.startsWith('pt')) {
                activeLang = 'pt';
            } else {
                activeLang = 'es';
            }
        }

        if (activeLang && activeLang !== 'es') {
            applyTranslation(activeLang, false);
        } else {
            updateLanguageDropdownUI('es');
        }

        // 3. Attach event listeners to language switcher options
        document.querySelectorAll('.lang-switcher-menu .lang-option, .lang-switcher-menu button[data-lang], .lang-switcher-menu a[data-lang]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const selected = btn.getAttribute('data-lang');
                if (selected) {
                    applyTranslation(selected, true);
                    document.querySelectorAll('.lang-switcher-dropdown').forEach(d => d.classList.remove('is-open'));
                }
            });
        });

        // 4. Attach event listeners to region switcher dropdown
        document.querySelectorAll('.region-switcher-dropdown').forEach(dropdown => {
            const trigger = dropdown.querySelector('.region-switcher-trigger');
            const menu = dropdown.querySelector('.region-switcher-menu');
            if (trigger && menu) {
                trigger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    document.querySelectorAll('.lang-switcher-dropdown').forEach(d => d.classList.remove('is-open'));
                    dropdown.classList.toggle('is-open');
                    trigger.setAttribute('aria-expanded', dropdown.classList.contains('is-open'));
                });

                menu.querySelectorAll('.region-item').forEach(item => {
                    item.addEventListener('click', () => {
                        try {
                            localStorage.setItem('elysium_region_override', 'true');
                            document.cookie = "elysium_region_override=true; path=/; max-age=31536000; SameSite=Lax";
                        } catch (err) {}
                    });
                });
            }
        });

        // Close dropdowns on outside click
        document.addEventListener('click', () => {
            document.querySelectorAll('.region-switcher-dropdown, .lang-switcher-dropdown').forEach(d => {
                d.classList.remove('is-open');
                const trigger = d.querySelector('button');
                if (trigger) trigger.setAttribute('aria-expanded', 'false');
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDynamicLocalization);
    } else {
        initDynamicLocalization();
    }

    window.ElysiumI18n = {
        translate: applyTranslation,
        init: initDynamicLocalization
    };
})();
