import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    collection, 
    getDocs, 
    doc, 
    getDoc, 
    query, 
    where, 
    orderBy,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const SUPER_ADMIN_EMAIL = 'danielalonzzo@icloud.com';

const translations = {
    en: {
        nav_overview: "Overview",
        nav_clients: "Clients",
        nav_licenses: "Licenses",
        logout: "Logout",
        welcome: "Welcome back, Super Admin.",
        total_clients: "Total Clients",
        total_licenses: "Total Licenses",
        available_licenses: "Available Licenses",
        used_licenses: "Used Licenses",
        clients_title: "Clients",
        clients_desc: "Manage and view all registered partners.",
        licenses_title: "Licenses",
        licenses_desc: "Overview of all generated and available licenses.",
        table_code: "Code",
        table_status: "Status",
        table_assigned: "Assigned To",
        table_used: "Used At",
        unnamed_client: "Unnamed Client",
        no_company: "No Company",
        completed: "✓ Completed",
        pending: "○ Pending",
        none: "None",
        accepted: "✓ Accepted",
        not_found: "✗ Not Found",
        rejected: "✗ Rejected",
        yes: "Yes",
        no: "No",
        error_stats: "Error loading dashboard stats.",
        error_clients: "Error loading clients list.",
        error_licenses: "Error loading licenses.",
        // Detail View Keys
        step1_title: "1. Primary Contact Info",
        full_name: "Full Name",
        role_pos: "Position / Role",
        email: "Email",
        country: "Country",
        phone_wa: "Phone / WhatsApp",
        step2_title: "2. Company Information",
        company_name: "Company Name",
        industry_sector: "Industry Sector",
        org_size: "Organization Size",
        curr_website: "Current Website",
        business_desc: "Business Description",
        step3_title: "3. Interests & Needs",
        services_interest: "Services of Interest",
        main_needs: "Main Needs",
        step4_title: "4. Project Stage & History",
        curr_stage: "Current Stage",
        prev_provider: "Previous Provider?",
        provider_name: "Provider Name",
        no_provider_reason: "Reason for No Provider",
        prev_experience: "Previous Experience",
        improvement_wishes: "Improvement Wishes",
        step5_title: "5. Problems & Objectives",
        company_vision: "Company Vision",
        company_mission: "Company Mission",
        prob_solve: "Problem to Solve",
        goal_desc: "Goal Description",
        main_priorities: "Main Priorities",
        step6_title: "6. Digital Presence",
        curr_site_status: "Current Website Status",
        active_assets: "Active Assets",
        curr_frustrations: "Current Frustrations",
        step7_title: "7. Audience & Clients",
        ideal_customer: "Ideal Customer Profile",
        target_categories: "Target Audience Categories",
        step8_title: "8. Functional Scope",
        req_features: "Required Features",
        web_sections_req: "Web Sections Required",
        app_intended_users: "App Intended Users",
        other_func_req: "Other Functional Requirements",
        step9_title: "9. Content & Materials",
        texts_ready: "Texts Ready?",
        visuals_ready: "Visuals Ready?",
        branding_ready: "Branding Ready?",
        step10_title: "10. Brand Style & Visual Feeling",
        brand_feeling: "Brand Feeling Keywords",
        design_avoid: "What to avoid in design",
        step11_title: "11. Integrations",
        tools_integrate: "Tools to Integrate",
        integ_workflow: "Integration Workflow Description",
        step12_title: "12. Operations & Admin",
        who_updates: "Who updates content?",
        change_freq: "Change Frequency",
        ongoing_support: "Ongoing Support Interest",
        step13_title: "13. Security & Performance",
        tech_priorities: "Technical Priorities",
        past_tech_problems: "Past Technical Problems",
        step14_title: "14. SEO & Visibility",
        seo_priority_lvl: "SEO Priority Level",
        step15_title: "15. Time & Urgency",
        pref_start: "Preferred Start",
        spec_deadline: "Specific Deadline?",
        urgency_lvl: "Urgency Level (1-5)",
        step16_title: "16. Budget & Payment",
        invest_range: "Investment Range",
        payment_pref: "Payment Preferences",
        step17_title: "17. Decision Making",
        decision_makers: "Decision Makers",
        referral_source: "Referral Source",
        trust_factor: "Key Trust Factor",
        step18_title: "18. Final Thoughts",
        impact_success: "Impact of Success",
        main_project_worries: "Main Project Worries",
        ideal_exp_replicate: "Ideal Experience to Replicate",
        step19_title: "19. Privacy & Consent",
        privacy_consent: "Privacy Consent",
        marketing_consent: "Marketing Consent",
        pdf_briefing: "Partner Briefing",
        pdf_confidential: "Confidential",
        pdf_footer_text: "© 2024 Elysium λ Development — Confidential Internal Document",
        project_link: "Project Link",
        save_link: "Save Link",
        download_pdf: "Download PDF",
        saving: "Saving...",
        saved: "Saved!",
        flag: "🇬🇧"
    },
    es: {
        nav_overview: "Resumen",
        nav_clients: "Clientes",
        nav_licenses: "Licencias",
        logout: "Cerrar Sesión",
        welcome: "Bienvenido de nuevo, Súper Admin.",
        total_clients: "Total de Clientes",
        total_licenses: "Total de Licencias",
        available_licenses: "Licencias Disponibles",
        used_licenses: "Licencias Usadas",
        clients_title: "Clientes",
        clients_desc: "Administra y visualiza todos los socios registrados.",
        licenses_title: "Licencias",
        licenses_desc: "Resumen de todas las licencias generadas y disponibles.",
        table_code: "Código",
        table_status: "Estado",
        table_assigned: "Asignado a",
        table_used: "Usado en",
        unnamed_client: "Cliente sin nombre",
        no_company: "Sin Empresa",
        completed: "✓ Completado",
        pending: "○ Pendiente",
        none: "Ninguno",
        accepted: "✓ Aceptado",
        not_found: "✗ No encontrado",
        rejected: "✗ Rechazado",
        yes: "Sí",
        no: "No",
        error_stats: "Error al cargar estadísticas.",
        error_clients: "Error al cargar lista de clientes.",
        error_licenses: "Error al cargar licencias.",
        // Detail View Keys
        step1_title: "1. Información de Contacto Principal",
        full_name: "Nombre Completo",
        role_pos: "Posición / Rol",
        email: "Correo Electrónico",
        country: "País",
        phone_wa: "Teléfono / WhatsApp",
        step2_title: "2. Información de la Empresa",
        company_name: "Nombre de la Empresa",
        industry_sector: "Sector Industrial",
        org_size: "Tamaño de la Organización",
        curr_website: "Sitio Web Actual",
        business_desc: "Descripción del Negocio",
        step3_title: "3. Intereses y Necesidades",
        services_interest: "Servicios de Interés",
        main_needs: "Necesidades Principales",
        step4_title: "4. Etapa del Proyecto e Historial",
        curr_stage: "Etapa Actual",
        prev_provider: "¿Proveedor Anterior?",
        provider_name: "Nombre del Proveedor",
        no_provider_reason: "Razón para no tener Proveedor",
        prev_experience: "Experiencia Previa",
        improvement_wishes: "Deseos de Mejora",
        step5_title: "5. Problemas y Objetivos",
        company_vision: "Visión de la Empresa",
        company_mission: "Misión de la Empresa",
        prob_solve: "Problema a Resolver",
        goal_desc: "Descripción de la Meta",
        main_priorities: "Prioridades Principales",
        step6_title: "6. Presencia Digital",
        curr_site_status: "Estado del Sitio Web Actual",
        active_assets: "Activos Activos",
        curr_frustrations: "Frustraciones Actuales",
        step7_title: "7. Audiencia y Clientes",
        ideal_customer: "Perfil del Cliente Ideal",
        target_categories: "Categorías de Audiencia Objetivo",
        step8_title: "8. Alcance Funcional",
        req_features: "Funcionalidades Requeridas",
        web_sections_req: "Secciones Web Requeridas",
        app_intended_users: "Usuarios Previstos de la App",
        other_func_req: "Otros Requerimientos Funcionales",
        step9_title: "9. Contenido y Materiales",
        texts_ready: "¿Textos Listos?",
        visuals_ready: "¿Visuales Listos?",
        branding_ready: "¿Branding Listo?",
        step10_title: "10. Estilo de Marca y Feeling Visual",
        brand_feeling: "Palabras Clave de Feeling de Marca",
        design_avoid: "Qué evitar en el diseño",
        step11_title: "11. Integraciones",
        tools_integrate: "Herramientas a Integrar",
        integ_workflow: "Descripción del Flujo de Integración",
        step12_title: "12. Operaciones y Administración",
        who_updates: "¿Quién actualiza el contenido?",
        change_freq: "Frecuencia de Cambios",
        ongoing_support: "Interés en Soporte Continuo",
        step13_title: "13. Seguridad y Rendimiento",
        tech_priorities: "Prioridades Técnicas",
        past_tech_problems: "Problemas Técnicos Pasados",
        step14_title: "14. SEO y Visibilidad",
        seo_priority_lvl: "Nivel de Prioridad SEO",
        step15_title: "15. Tiempo y Urgencia",
        pref_start: "Inicio Preferido",
        spec_deadline: "¿Fecha Límite Específica?",
        urgency_lvl: "Nivel de Urgencia (1-5)",
        step16_title: "16. Presupuesto y Pago",
        invest_range: "Rango de Inversión",
        payment_pref: "Preferencias de Pago",
        step17_title: "17. Toma de Decisiones",
        decision_makers: "Tomadores de Decisiones",
        referral_source: "Fuente de Referencia",
        trust_factor: "Factor de Confianza Clave",
        step18_title: "18. Pensamientos Finales",
        impact_success: "Impacto del Éxito",
        main_project_worries: "Preocupaciones Principales del Proyecto",
        ideal_exp_replicate: "Experiencia Ideal a Replicar",
        step19_title: "19. Privacidad y Consentimiento",
        privacy_consent: "Consentimiento de Privacidad",
        marketing_consent: "Consentimiento de Marketing",
        pdf_briefing: "Resumen del Socio",
        pdf_confidential: "Confidencial",
        pdf_footer_text: "© 2024 Elysium λ Development — Documento Interno Confidencial",
        project_link: "Enlace del Proyecto",
        save_link: "Guardar Enlace",
        download_pdf: "Descargar PDF",
        saving: "Guardando...",
        saved: "¡Guardado!",
        flag: "🇨🇷"
    },
    pt: {
        nav_overview: "Visão Geral",
        nav_clients: "Clientes",
        nav_licenses: "Licenças",
        logout: "Sair",
        welcome: "Bem-vindo de volta, Super Admin.",
        total_clients: "Total de Clientes",
        total_licenses: "Total de Licenças",
        available_licenses: "Licenças Disponíveis",
        used_licenses: "Licenças Usadas",
        clients_title: "Clientes",
        clients_desc: "Gerencie e visualize todos os parceiros registrados.",
        licenses_title: "Licenças",
        licenses_desc: "Visão geral de todas as licenças geradas e disponíveis.",
        table_code: "Código",
        table_status: "Status",
        table_assigned: "Atribuído a",
        table_used: "Usado em",
        unnamed_client: "Cliente sem nome",
        no_company: "Sem Empresa",
        completed: "✓ Concluído",
        pending: "○ Pendente",
        none: "Nenhum",
        accepted: "✓ Aceito",
        not_found: "✗ Não encontrado",
        rejected: "✗ Rejeitado",
        yes: "Sim",
        no: "Não",
        error_stats: "Erro ao carregar estatísticas.",
        error_clients: "Erro ao carregar lista de clientes.",
        error_licenses: "Erro ao carregar licenças.",
        // Detail View Keys
        step1_title: "1. Informação de Contacto Principal",
        full_name: "Nome Completo",
        role_pos: "Cargo / Papel",
        email: "E-mail",
        country: "País",
        phone_wa: "Telefone / WhatsApp",
        step2_title: "2. Informações da Empresa",
        company_name: "Nome da Empresa",
        industry_sector: "Sector Industrial",
        org_size: "Tamanho da Organização",
        curr_website: "Website Actual",
        business_desc: "Descrição do Negócio",
        step3_title: "3. Interesses e Necessidades",
        services_interest: "Serviços de Interesse",
        main_needs: "Necessidades Principais",
        step4_title: "4. Estágio do Projecto e Histórico",
        curr_stage: "Estágio Actual",
        prev_provider: "Fornecedor Anterior?",
        provider_name: "Nome do Fornecedor",
        no_provider_reason: "Razão para não ter Fornecedor",
        prev_experience: "Experiência Anterior",
        improvement_wishes: "Desejos de Melhoria",
        step5_title: "5. Problemas e Objectivos",
        company_vision: "Visão da Empresa",
        company_mission: "Missão da Empresa",
        prob_solve: "Problema a Resolver",
        goal_desc: "Descrição do Objectivo",
        main_priorities: "Prioridades Principais",
        step6_title: "6. Presença Digital",
        curr_site_status: "Estado do Website Actual",
        active_assets: "Activos Activos",
        curr_frustrations: "Frustrações Actuais",
        step7_title: "7. Audiência e Clientes",
        ideal_customer: "Perfil do Cliente Ideal",
        target_categories: "Categorias de Audiência Alvo",
        step8_title: "8. Escopo Funcional",
        req_features: "Funcionalidades Requeridas",
        web_sections_req: "Secções Web Requeridas",
        app_intended_users: "Utilizadores Alvo da App",
        other_func_req: "Outros Requisitos Funcionais",
        step9_title: "9. Conteúdo e Materiais",
        texts_ready: "Textos Prontos?",
        visuals_ready: "Visuais Prontos?",
        branding_ready: "Branding Pronto?",
        step10_title: "10. Estilo de Marca e Sensação Visual",
        brand_feeling: "Palavras-chave de Sensação de Marca",
        design_avoid: "O que evitar no design",
        step11_title: "11. Integrações",
        tools_integrate: "Ferramentas a Integrar",
        integ_workflow: "Descrição do Fluxo de Integração",
        step12_title: "12. Operações e Administração",
        who_updates: "Quem actualiza o conteúdo?",
        change_freq: "Frequência de Alterações",
        ongoing_support: "Interesse em Suporte Contínuo",
        step13_title: "13. Segurança e Performance",
        tech_priorities: "Prioridades Técnicas",
        past_tech_problems: "Problemas Técnicos Passados",
        step14_title: "14. SEO e Visibilidade",
        seo_priority_lvl: "Nível de Prioridade SEO",
        step15_title: "15. Tempo e Urgência",
        pref_start: "Início Preferido",
        spec_deadline: "Prazo Específico?",
        urgency_lvl: "Nível de Urgência (1-5)",
        step16_title: "16. Orçamento e Pagamento",
        invest_range: "Faixa de Investimento",
        payment_pref: "Preferências de Pagamento",
        step17_title: "17. Tomada de Decisão",
        decision_makers: "Tomadores de Decisão",
        referral_source: "Fonte de Referência",
        trust_factor: "Factor de Confiança Chave",
        step18_title: "18. Considerações Finais",
        impact_success: "Impacto do Sucesso",
        main_project_worries: "Preocupações Principais do Projecto",
        ideal_exp_replicate: "Experiência Ideal a Replicar",
        step19_title: "19. Privacidade e Consentimento",
        privacy_consent: "Consentimento de Privacidade",
        marketing_consent: "Consentimento de Marketing",
        pdf_briefing: "Resumo do Parceiro",
        pdf_confidential: "Confidencial",
        pdf_footer_text: "© 2024 Elysium λ Development — Documento Interno Confidencial",
        project_link: "Link do Projecto",
        save_link: "Salvar Link",
        download_pdf: "Baixar PDF",
        saving: "Salvando...",
        saved: "Salvo!",
        flag: "🇵🇹"
    }
};

let currentLang = localStorage.getItem('elysium_lang') || 'en';

document.addEventListener('DOMContentLoaded', () => {
    // Auth Guard
    onAuthStateChanged(auth, async (user) => {
        if (!user || user.email !== SUPER_ADMIN_EMAIL) {
            window.location.href = 'profiles.html';
            return;
        }
        
        // Remove preloader
        const preloader = document.getElementById('elysium-preloader');
        if (preloader) {
            setTimeout(() => {
                preloader.classList.add('is-loaded');
                setTimeout(() => preloader.remove(), 800);
            }, 1000);
        }

        applyTranslations();
        initDashboard();
    });

    // Mobile Navigation Toggle
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            document.body.classList.toggle('mobile-menu-open');

            // Toggle icon between hamburger and close
            if (navLinks.classList.contains('active')) {
                mobileToggle.textContent = '✕';
                document.body.style.overflow = 'hidden'; // Prevent scrolling when menu is open
            } else {
                mobileToggle.textContent = '☰';
                document.body.style.overflow = '';
            }
        });

        // Close menu when clicking a language select
        document.querySelectorAll('.lang-select').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                document.body.classList.remove('mobile-menu-open');
                mobileToggle.textContent = '☰';
                document.body.style.overflow = '';
            });
        });
    }

    // Language switcher
    const langTrigger = document.querySelector('.lang-switcher-trigger');
    const langDropdown = document.querySelector('.lang-switcher-dropdown');
    
    if (langTrigger) {
        langTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            langDropdown.classList.toggle('is-open');
        });
    }

    document.addEventListener('click', () => {
        if (langDropdown) langDropdown.classList.remove('is-open');
    });

    document.querySelectorAll('.lang-select').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const lang = e.currentTarget.dataset.lang;
            currentLang = lang;
            localStorage.setItem('elysium_lang', lang);
            localStorage.setItem('langOverride', 'true');
            applyTranslations();
            
            // Reload current section views to apply translations to dynamic content
            const activeSection = document.querySelector('.admin-section.active').id;
            if (activeSection === 'overview') loadStats();
            else if (activeSection === 'clients') loadClients();
            else if (activeSection === 'licenses') loadLicenses();
        });
    });

    // Sidebar Navigation
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.admin-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.dataset.target;
            
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            sections.forEach(s => {
                s.classList.remove('active');
                if (s.id === target) s.classList.add('active');
            });

            localStorage.setItem('elysium_admin_tab', target);

            if (target === 'overview') loadStats();
            if (target === 'clients') loadClients();
            if (target === 'licenses') loadLicenses();
        });
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        signOut(auth);
    });

    // Modal Close
    const detailOverlay = document.getElementById('client-detail-overlay');
    document.getElementById('close-detail').addEventListener('click', () => {
        detailOverlay.style.display = 'none';
    });

    detailOverlay.addEventListener('click', (e) => {
        if (e.target === detailOverlay) detailOverlay.style.display = 'none';
    });
});

function applyTranslations() {
    const t = translations[currentLang];
    
    // Update navbar current label and logo link
    const label = document.querySelector('.lang-current-label');
    const brandLink = document.querySelector('.nav-brand');
    
    // Update logo link to localized index
    if (brandLink) {
        brandLink.href = currentLang === 'en' ? 'index.html' : `${currentLang}/index.html`;
    }
    
    if (label) label.textContent = currentLang.toUpperCase();
    
    const flagEl = document.querySelector('.lang-current-flag');
    if (flagEl) flagEl.textContent = t.flag;

    // Update Sidebar
    document.querySelector('[data-target="overview"] span').textContent = t.nav_overview;
    document.querySelector('[data-target="clients"] span').textContent = t.nav_clients;
    document.querySelector('[data-target="licenses"] span').textContent = t.nav_licenses;
    document.getElementById('logoutBtn').textContent = t.logout;

    // Update section headers (static parts)
    document.querySelector('#overview h1').textContent = currentLang === 'en' ? 'Dashboard' : (currentLang === 'es' ? 'Tablero' : 'Painel');
    document.querySelector('#overview p').textContent = t.welcome;
    
    document.querySelector('#clients h1').textContent = t.clients_title;
    document.querySelector('#clients p').textContent = t.clients_desc;
    
    document.querySelector('#licenses h1').textContent = t.licenses_title;
    document.querySelector('#licenses p').textContent = t.licenses_desc;

    // Update table headers
    const ths = document.querySelectorAll('.admin-table th');
    if (ths.length > 0) {
        ths[0].textContent = t.table_code;
        ths[1].textContent = t.table_status;
        ths[2].textContent = t.table_assigned;
        ths[3].textContent = t.table_used;
    }
}

async function initDashboard() {
    const savedTab = localStorage.getItem('elysium_admin_tab') || 'overview';
    
    // Restore saved tab visually
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.admin-section');
    
    navItems.forEach(i => i.classList.remove('active'));
    document.querySelector(`.nav-item[data-target="${savedTab}"]`)?.classList.add('active');
    
    sections.forEach(s => s.classList.remove('active'));
    document.getElementById(savedTab)?.classList.add('active');

    // Load content for the active tab
    if (savedTab === 'overview') loadStats();
    if (savedTab === 'clients') loadClients();
    if (savedTab === 'licenses') loadLicenses();
}

async function loadStats() {
    const statsContainer = document.getElementById('stats-overview');
    statsContainer.innerHTML = '<div class="premium-loader"></div>';
    const t = translations[currentLang];

    try {
        const membersSnap = await getDocs(collection(db, 'members'));
        const licensesSnap = await getDocs(collection(db, 'licenses'));
        
        const totalClients = membersSnap.size;
        const totalLicenses = licensesSnap.size;
        const activeLicenses = licensesSnap.docs.filter(d => d.data().status === 'active').length;
        const usedLicenses = licensesSnap.docs.filter(d => d.data().status === 'used').length;

        statsContainer.innerHTML = `
            <div class="client-card" style="cursor: default;">
                <div class="client-name">${totalClients}</div>
                <div class="client-company">${t.total_clients}</div>
            </div>
            <div class="client-card" style="cursor: default;">
                <div class="client-name">${totalLicenses}</div>
                <div class="client-company">${t.total_licenses}</div>
            </div>
            <div class="client-card" style="cursor: default;">
                <div class="client-name">${activeLicenses}</div>
                <div class="client-company">${t.available_licenses}</div>
            </div>
            <div class="client-card" style="cursor: default;">
                <div class="client-name">${usedLicenses}</div>
                <div class="client-company">${t.used_licenses}</div>
            </div>
        `;
    } catch (error) {
        console.error("Error loading stats:", error);
        statsContainer.innerHTML = `<p class="color-text-error">${t.error_stats}<br><small style="font-size: 0.8em; opacity: 0.8;">${error.message}</small></p>`;
    }
}

async function loadClients() {
    const clientsList = document.getElementById('clients-list');
    clientsList.innerHTML = '<div class="premium-loader"></div>';
    const t = translations[currentLang];

    try {
        const q = query(collection(db, 'members'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        clientsList.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.email === SUPER_ADMIN_EMAIL) return; // Skip self

            const card = document.createElement('div');
            card.className = 'client-card';
            card.innerHTML = `
                <div class="client-name">${data.name || t.unnamed_client}</div>
                <div class="client-company">${data.company || t.no_company}</div>
                <div class="client-meta">
                    <span>${data.email}</span>
                    <span>${data.onboardingCompleted ? t.completed : t.pending}</span>
                </div>
            `;
            card.addEventListener('click', () => showClientDetail(doc.id, data));
            clientsList.appendChild(card);
        });
    } catch (error) {
        console.error("Error loading clients:", error);
        clientsList.innerHTML = `<p class="color-text-error">${t.error_clients}<br><small style="font-size: 0.8em; opacity: 0.8;">${error.message}</small></p>`;
    }
}

async function loadLicenses() {
    const licensesList = document.getElementById('licenses-list');
    licensesList.innerHTML = '<tr><td colspan="4" style="text-align: center;"><div class="premium-loader"></div></td></tr>';
    const t = translations[currentLang];

    try {
        const querySnapshot = await getDocs(collection(db, 'licenses'));
        
        let licenses = [];
        querySnapshot.forEach((doc) => {
            licenses.push(doc.data());
        });

        licenses.sort((a, b) => {
            if (a.status === 'used' && b.status !== 'used') return -1;
            if (a.status !== 'used' && b.status === 'used') return 1;
            
            if (a.status === 'used' && b.status === 'used') {
                const nameA = a.assignedTo || '';
                const nameB = b.assignedTo || '';
                return nameA.localeCompare(nameB);
            }
            
            // For available/active ones, sort by code or created at? Let's just maintain code or let them be.
            const codeA = a.code || '';
            const codeB = b.code || '';
            return codeA.localeCompare(codeB);
        });
        
        licensesList.innerHTML = '';
        licenses.forEach((data) => {
            const usedAtStr = data.usedAt ? new Date(data.usedAt.seconds * 1000).toLocaleDateString() : '-';
            
            let displayStatus = data.status.toUpperCase();
            if (data.status === 'active') {
                displayStatus = currentLang === 'es' ? 'DISPONIBLE' : (currentLang === 'pt' ? 'DISPONÍVEL' : 'AVAILABLE');
            } else if (data.status === 'used') {
                displayStatus = currentLang === 'es' ? 'USADA' : (currentLang === 'pt' ? 'USADA' : 'USED');
            }
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-family: monospace; font-weight: bold; color: var(--color-accent);">${data.code}</td>
                <td><span class="status-badge status-${data.status}">${displayStatus}</span></td>
                <td style="font-size: 0.9rem;">${data.assignedTo || '-'}</td>
                <td style="font-size: 0.85rem; opacity: 0.7;">${usedAtStr}</td>
            `;
            licensesList.appendChild(tr);
        });
    } catch (error) {
        console.error("Error loading licenses:", error);
        licensesList.innerHTML = `<tr><td colspan="4" class="color-text-error">${t.error_licenses}<br><small style="font-size: 0.8em; opacity: 0.8;">${error.message}</small></td></tr>`;
    }
}

async function showClientDetail(userId, memberData) {
    const detailOverlay = document.getElementById('client-detail-overlay');
    const detailContent = document.getElementById('detail-content');
    detailContent.innerHTML = '<div class="premium-loader"></div>';
    detailOverlay.style.display = 'flex';

    try {
        // Fetch onboarding submission
        const q = query(collection(db, 'onboarding_submissions'), where('userId', '==', userId));
        const submissionSnap = await getDocs(q);
        let onboardingData = null;
        if (!submissionSnap.empty) {
            onboardingData = submissionSnap.docs[0].data().formData;
        }

        renderDetail(memberData, onboardingData, userId);
    } catch (error) {
        console.error("Error showing client detail:", error);
        detailContent.innerHTML = `<p class="color-text-error">Error loading client detail.<br><small style="font-size: 0.8em; opacity: 0.8;">${error.message}</small></p>`;
    }
}

function renderDetail(member, onboarding, userId) {
    const detailContent = document.getElementById('detail-content');
    const t = translations[currentLang];
    
    // Helper to format list items as tags
    const renderTags = (items) => {
        if (!items || !Array.isArray(items) || items.length === 0) return t.none;
        return `<div class="tag-list">${items.map(i => `<span class="tag">${i}</span>`).join('')}</div>`;
    };

    // Helper to render field
    const f = (val) => val || '-';
    
    // Helper for yes/no translation
    const yn = (val) => {
        if (val === 'yes') return t.yes;
        if (val === 'no') return t.no;
        return f(val);
    };

    detailContent.innerHTML = `
        <div class="dashboard-header" style="margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: flex-start; padding-right: 80px;">
            <div>
                <h1 style="font-size: 3rem;">${member.name}</h1>
                <p class="color-text-secondary">${member.company || t.no_company}</p>
            </div>
            <button id="btn-download-pdf" class="btn btn-outline" style="min-width: 140px; margin-top: 0.5rem;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 1rem; height: 1rem; margin-right: 0.5rem;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                ${t.download_pdf}
            </button>
        </div>

        <div class="detail-section" style="background: rgba(41, 151, 255, 0.05); padding: 1.5rem; border-radius: var(--radius-md); margin-bottom: 2rem; border: 1px solid rgba(41, 151, 255, 0.2);">
            <h3 style="margin-bottom: 1rem; color: var(--color-accent);">${t.project_link}</h3>
            <div style="display: flex; gap: 1rem;">
                <input type="url" id="project-url-input" class="form-control" placeholder="https://..." value="${member.projectUrl || ''}" style="flex: 1;">
                <button id="btn-save-project" class="btn btn-primary">${t.save_link}</button>
            </div>
            <p id="project-save-msg" style="margin-top: 0.5rem; font-size: 0.9rem; display: none;"></p>
        </div>

        <div id="pdf-content-wrapper">
            <!-- Step 1: Primary Contact Info -->
            <div class="detail-section">
                <h3>${t.step1_title}</h3>
                <div class="info-grid">
                    <div class="info-item"><label>${t.full_name}</label><span>${f(onboarding?.contact_name || member.name)}</span></div>
                    <div class="info-item"><label>${t.role_pos}</label><span>${f(onboarding?.contact_role)}</span></div>
                    <div class="info-item"><label>${t.email}</label><span>${f(onboarding?.contact_email || member.email)}</span></div>
                    <div class="info-item"><label>${t.country}</label><span>${f(onboarding?.contact_country)}</span></div>
                    <div class="info-item"><label>${t.phone_wa}</label><span>${f(onboarding?.contact_phone)}</span></div>
                </div>
            </div>

            <!-- Step 2: Company Information -->
            <div class="detail-section">
                <h3>${t.step2_title}</h3>
                <div class="info-grid" style="margin-bottom: 1rem;">
                    <div class="info-item"><label>${t.company_name}</label><span>${f(onboarding?.company_name || member.company)}</span></div>
                    <div class="info-item"><label>${t.industry_sector}</label><span>${f(onboarding?.company_sector)}</span></div>
                    <div class="info-item"><label>${t.org_size}</label><span>${f(onboarding?.company_size)}</span></div>
                    <div class="info-item"><label>${t.curr_website}</label><span>${f(onboarding?.company_website)}</span></div>
                </div>
                <div class="info-item">
                    <label>${t.business_desc}</label>
                    <p>${f(onboarding?.company_description)}</p>
                </div>
            </div>

            <!-- Step 3: Interests & Needs -->
            <div class="detail-section">
                <h3>${t.step3_title}</h3>
                <div class="info-item" style="margin-bottom: 1.5rem;">
                    <label>${t.services_interest}</label>
                    ${renderTags(onboarding?.interests)}
                </div>
                <div class="info-item">
                    <label>${t.main_needs}</label>
                    ${renderTags(onboarding?.main_need)}
                </div>
            </div>

            <!-- Step 4: Project Stage -->
            <div class="detail-section">
                <h3>${t.step4_title}</h3>
                <div class="info-item" style="margin-bottom: 1.5rem;">
                    <label>${t.curr_stage}</label>
                    ${renderTags(onboarding?.project_stage)}
                </div>
                <div class="info-grid">
                    <div class="info-item"><label>${t.prev_provider}</label><span>${yn(onboarding?.previous_provider)}</span></div>
                    ${onboarding?.previous_provider === 'yes' ? `
                        <div class="info-item"><label>${t.provider_name}</label><span>${f(onboarding?.provider_name)}</span></div>
                    ` : `
                        <div class="info-item"><label>${t.no_provider_reason}</label><span>${f(onboarding?.no_previous_provider_reason)}</span></div>
                    `}
                </div>
                ${onboarding?.previous_provider === 'yes' ? `
                    <div style="margin-top: 1rem;">
                        <div class="info-item"><label>${t.prev_experience}</label><p>${f(onboarding?.previous_experience)}</p></div>
                        <div class="info-item" style="margin-top: 0.5rem;"><label>${t.improvement_wishes}</label><p>${f(onboarding?.improvement_wishes)}</p></div>
                    </div>
                ` : ''}
            </div>

            <!-- Step 5: Problems & Objectives -->
            <div class="detail-section">
                <h3>${t.step5_title}</h3>
                <div class="info-item" style="margin-bottom: 1.5rem;">
                    <label>${t.company_vision}</label>
                    <p>${f(onboarding?.company_vision)}</p>
                </div>
                <div class="info-item" style="margin-bottom: 1.5rem;">
                    <label>${t.company_mission}</label>
                    <p>${f(onboarding?.company_mission)}</p>
                </div>
                <div class="info-item" style="margin-bottom: 1.5rem;">
                    <label>${t.prob_solve}</label>
                    <p>${f(onboarding?.problem_description)}</p>
                </div>
                <div class="info-item" style="margin-bottom: 1.5rem;">
                    <label>${t.goal_desc}</label>
                    <p>${f(onboarding?.goal_description)}</p>
                </div>
                <div class="info-item">
                    <label>${t.main_priorities}</label>
                    ${renderTags(onboarding?.main_priority)}
                </div>
            </div>

            <!-- Step 6: Digital Presence -->
            <div class="detail-section">
                <h3>${t.step6_title}</h3>
                <div class="info-grid" style="margin-bottom: 1.5rem;">
                    <div class="info-item"><label>${t.curr_site_status}</label><span>${f(onboarding?.has_website)}</span></div>
                    <div class="info-item"><label>${t.active_assets}</label>${renderTags(onboarding?.current_assets)}</div>
                </div>
                <div class="info-item">
                    <label>${t.curr_frustrations}</label>
                    ${renderTags(onboarding?.frustrations)}
                </div>
            </div>

            <!-- Step 7: Audience -->
            <div class="detail-section">
                <h3>${t.step7_title}</h3>
                <div class="info-item" style="margin-bottom: 1.5rem;">
                    <label>${t.ideal_customer}</label>
                    <p>${f(onboarding?.ideal_customer)}</p>
                </div>
                <div class="info-item">
                    <label>${t.target_categories}</label>
                    ${renderTags(onboarding?.target_audience)}
                </div>
            </div>

            <!-- Step 8: Functional Scope -->
            <div class="detail-section">
                <h3>${t.step8_title}</h3>
                <div class="info-item" style="margin-bottom: 1.5rem;">
                    <label>${t.req_features}</label>
                    ${renderTags(onboarding?.features)}
                </div>
                <div class="info-grid">
                    <div class="info-item"><label>${t.web_sections_req}</label>${renderTags(onboarding?.web_sections)}</div>
                    <div class="info-item"><label>${t.app_intended_users}</label>${renderTags(onboarding?.app_users)}</div>
                </div>
                <div class="info-item" style="margin-top: 1rem;">
                    <label>${t.other_func_req}</label>
                    <p>${f(onboarding?.features_other || onboarding?.web_sections_other)}</p>
                </div>
            </div>

            <!-- Step 9: Available Content -->
            <div class="detail-section">
                <h3>${t.step9_title}</h3>
                <div class="info-grid">
                    <div class="info-item"><label>${t.texts_ready}</label><span>${f(onboarding?.content_texts)}</span></div>
                    <div class="info-item"><label>${t.visuals_ready}</label><span>${f(onboarding?.content_visuals)}</span></div>
                    <div class="info-item"><label>${t.branding_ready}</label><span>${f(onboarding?.content_branding)}</span></div>
                </div>
            </div>

            <!-- Step 10: Brand Style -->
            <div class="detail-section">
                <h3>${t.step10_title}</h3>
                <div class="info-item" style="margin-bottom: 1.5rem;">
                    <label>${t.brand_feeling}</label>
                    ${renderTags(onboarding?.brand_feeling)}
                </div>
                <div class="info-item">
                    <label>${t.design_avoid}</label>
                    <p>${f(onboarding?.design_avoids)}</p>
                </div>
            </div>

            <!-- Step 11: Integrations -->
            <div class="detail-section">
                <h3>${t.step11_title}</h3>
                <div class="info-item" style="margin-bottom: 1.5rem;">
                    <label>${t.tools_integrate}</label>
                    ${renderTags(onboarding?.integrations)}
                </div>
                <div class="info-item">
                    <label>${t.integ_workflow}</label>
                    <p>${f(onboarding?.integration_desc)}</p>
                </div>
            </div>

            <!-- Step 12: Operations & Admin -->
            <div class="detail-section">
                <h3>${t.step12_title}</h3>
                <div class="info-grid">
                    <div class="info-item"><label>${t.who_updates}</label><span>${f(onboarding?.ops_updates)}</span></div>
                    <div class="info-item"><label>${t.change_freq}</label><span>${f(onboarding?.ops_frequency)}</span></div>
                    <div class="info-item"><label>${t.ongoing_support}</label><span>${f(onboarding?.support_interest)}</span></div>
                </div>
            </div>

            <!-- Step 13: Security & Performance -->
            <div class="detail-section">
                <h3>${t.step13_title}</h3>
                <div class="info-item" style="margin-bottom: 1.5rem;">
                    <label>${t.tech_priorities}</label>
                    ${renderTags(onboarding?.tech_priorities)}
                </div>
                <div class="info-item">
                    <label>${t.past_tech_problems}</label>
                    ${renderTags(onboarding?.past_problems)}
                </div>
            </div>

            <!-- Step 14: SEO & Visibility -->
            <div class="detail-section">
                <h3>${t.step14_title}</h3>
                <div class="info-item">
                    <label>${t.seo_priority_lvl}</label>
                    <span>${f(onboarding?.seo_priority)}</span>
                </div>
            </div>

            <!-- Step 15: Time & Urgency -->
            <div class="detail-section">
                <h3>${t.step15_title}</h3>
                <div class="info-grid">
                    <div class="info-item"><label>${t.pref_start}</label><span>${f(onboarding?.start_time)}</span></div>
                    <div class="info-item"><label>${t.spec_deadline}</label><span>${onboarding?.has_deadline === 'yes' ? f(onboarding?.deadline_date) : t.no}</span></div>
                    <div class="info-item"><label>${t.urgency_lvl}</label><span>${f(onboarding?.urgency)}</span></div>
                </div>
            </div>

            <!-- Step 16: Budget -->
            <div class="detail-section">
                <h3>${t.step16_title}</h3>
                <div class="info-grid">
                    <div class="info-item"><label>${t.invest_range}</label><span style="color: var(--color-accent); font-weight: bold;">${f(onboarding?.budget_range)}</span></div>
                    <div class="info-item"><label>${t.payment_pref}</label>${renderTags(onboarding?.payment_pref)}</div>
                </div>
            </div>

            <!-- Step 17: Decision Making -->
            <div class="detail-section">
                <h3>${t.step17_title}</h3>
                <div class="info-item" style="margin-bottom: 1.5rem;">
                    <label>${t.decision_makers}</label>
                    ${renderTags(onboarding?.decision_makers)}
                </div>
                <div class="info-grid">
                    <div class="info-item"><label>${t.referral_source}</label><span>${f(onboarding?.referral_source)}</span></div>
                    <div class="info-item"><label>${t.trust_factor}</label><span>${f(onboarding?.trust_factor)}</span></div>
                </div>
            </div>

            <!-- Step 18: Final Thoughts -->
            <div class="detail-section">
                <h3>${t.step18_title}</h3>
                <div class="info-item" style="margin-bottom: 1.5rem;">
                    <label>${t.impact_success}</label>
                    <p>${f(onboarding?.success_impact)}</p>
                </div>
                <div class="info-item" style="margin-bottom: 1.5rem;">
                    <label>${t.main_project_worries}</label>
                    <p>${f(onboarding?.project_worries)}</p>
                </div>
                <div class="info-item">
                    <label>${t.ideal_exp_replicate}</label>
                    <p>${f(onboarding?.ideal_experience)}</p>
                </div>
            </div>

            <!-- Step 19: Privacy & Consent -->
            <div class="detail-section">
                <h3>${t.step19_title}</h3>
                <div class="info-grid">
                    <div class="info-item"><label>${t.privacy_consent}</label><span>${onboarding?.privacy_consent ? t.accepted : t.not_found}</span></div>
                    <div class="info-item"><label>${t.marketing_consent}</label><span>${onboarding?.marketing_consent ? t.accepted : t.rejected}</span></div>
                </div>
            </div>
        </div>
    `;

    // Attach Event Listeners
    const saveBtn = document.getElementById('btn-save-project');
    const msgLabel = document.getElementById('project-save-msg');
    
    saveBtn.addEventListener('click', async () => {
        const url = document.getElementById('project-url-input').value.trim();
        saveBtn.disabled = true;
        saveBtn.textContent = t.saving;
        msgLabel.style.display = 'none';
        
        try {
            await updateDoc(doc(db, 'members', userId), { projectUrl: url });
            msgLabel.textContent = t.saved;
            msgLabel.style.color = '#4CAF50';
            msgLabel.style.display = 'block';
            member.projectUrl = url; // update local cache
        } catch (error) {
            console.error(error);
            msgLabel.textContent = error.message;
            msgLabel.style.color = '#f44336';
            msgLabel.style.display = 'block';
        }
        
        saveBtn.disabled = false;
        saveBtn.textContent = t.save_link;
        setTimeout(() => { msgLabel.style.display = 'none'; }, 3000);
    });

    const pdfBtn = document.getElementById('btn-download-pdf');
    if (pdfBtn) {
        pdfBtn.addEventListener('click', () => {
            console.log("Downloading PDF for", member.name);
            generateClientPDF(member, onboarding, t);
        });
    }
}

function generateClientPDF(member, onboarding, t) {
    if (typeof html2pdf === 'undefined') {
        alert("PDF Generator library is loading or failed to load. Please try again.");
        return;
    }

    const mainWrapper = document.getElementById('pdf-content-wrapper');
    if (!mainWrapper) return;
    const sourceHTML = mainWrapper.innerHTML;

    const currentDate = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    const fileName = `Elysium_Brief_${member.name.replace(/\s+/g, '_')}.pdf`;

    // Construct the complete PDF layout as a string, without hardcoded width to allow auto-scaling 
    const htmlString = `
        <div style="background: #ffffff; padding: 25px 15px 40px; font-family: 'Manrope', sans-serif; color: #1d1d1f;">
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');
                * { box-sizing: border-box; -webkit-print-color-adjust: exact; }
                
                .pdf-header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #f0f0f5; }
                .pdf-logo { font-size: 38px; color: #2997ff; font-weight: 700; margin-bottom: 5px; line-height: 1; }
                .pdf-brand { margin: 0; font-size: 24px; color: #1d1d1f; font-family: 'Playfair Display', serif; letter-spacing: 3px; font-weight: 700; }
                .pdf-subbrand { margin: 6px 0 0 0; color: #86868b; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; }
                
                .client-info { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px; }
                .client-info h2 { margin: 0; font-size: 26px; color: #1d1d1f; font-weight: 700; }
                .client-info p { margin: 4px 0 0 0; color: #2997ff; font-size: 14px; font-weight: 600; }
                .client-info .date { color: #86868b; font-size: 11px; font-weight: 600; text-align: right; }
                
                .detail-section { display: block; margin-bottom: 25px; page-break-inside: avoid; break-inside: avoid-page; background: #fafafa; border: 1px solid #eaeaea; padding: 20px; border-radius: 8px; }
                .detail-section h3 { color: #2997ff !important; margin-top: 0; margin-bottom: 15px; font-size: 15px; font-weight: 700; border-left: 3px solid #2997ff; padding-left: 12px; line-height: 1.2; text-transform: uppercase; letter-spacing: 1px; }
                
                /* Ensuring grid stays responsive strictly within available page space */
                .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 15px; page-break-inside: avoid; break-inside: avoid; }
                .info-item { margin-bottom: 10px; display: block; overflow: hidden; word-wrap: break-word; }
                .info-item label { color: #86868b !important; font-size: 10px; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 4px; letter-spacing: 0.5px; opacity: 0.8; }
                .info-item span, .info-item p { color: #1d1d1f !important; font-size: 13px; margin: 0; font-weight: 500; line-height: 1.4; word-wrap: break-word; white-space: normal; }
                
                .tag-list { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
                .tag { background: #ffffff !important; color: #1d1d1f !important; border: 1px solid #d2d2d7 !important; display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; }
                
                .pdf-footer { text-align: center; margin-top: 30px; padding-top: 15px; padding-bottom: 20px; border-top: 1px solid #f0f0f5; color: #a1a1a6; font-size: 10px; font-weight: 500; page-break-inside: avoid; }
            </style>
            
            <div class="pdf-header">
                <div class="pdf-logo">λ</div>
                <h1 class="pdf-brand">ELYSIUM</h1>
                <p class="pdf-subbrand">${t.pdf_briefing} • ${t.pdf_confidential}</p>
            </div>
            
            <div class="client-info">
                <div>
                    <h2>${member.name}</h2>
                    <p>${member.company || t.no_company}</p>
                </div>
                <div class="date">${currentDate}</div>
            </div>

            <div id="pdf-sections-clone">
                ${sourceHTML}
            </div>
            
            <div class="pdf-footer">
                <span>${t.pdf_footer_text.replace('2024', new Date().getFullYear())}</span>
            </div>
        </div>
    `;

    const container = document.createElement('div');
    container.innerHTML = htmlString;

    // Remove windowWidth enforcement and switch format explicitly
    const opt = {
        margin:       10, // 10mm margins standard
        filename:     fileName,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { 
            scale: 2, 
            useCORS: true, 
            backgroundColor: '#ffffff',
            letterRendering: true
        },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().set(opt).from(container).save().catch(error => {
        console.error("PDF generation failed:", error);
        alert("Failed to create PDF. Please try again.");
    });
}

// Ensure it's globally available
window.generateClientPDF = generateClientPDF;
