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
        error_stats: "Error loading dashboard stats.",
        error_clients: "Error loading clients list.",
        error_licenses: "Error loading licenses.",
        user_profile: "1. User Profile",
        contact_name: "Contact Name",
        email: "Email",
        phone: "Phone",
        role: "Role/Position",
        country: "Country",
        license_code: "License Code",
        company_context: "Company Context",
        sector: "Sector",
        size: "Size",
        website: "Website",
        work_info: "2. Work / Project Info",
        needs_services: "Needs & Services",
        main_need: "Main Need",
        current_stage: "Current Stage",
        core_objectives: "Core Objectives",
        goal: "Goal",
        problem: "Problem to solve",
        main_priority: "Main Priority",
        investment: "Investment Range",
        timeline: "Timeline",
        urgency: "Urgency (1-5)",
        requirements: "Key Requirements & Concerns",
        frustrations: "Frustrations",
        worries: "Worries",
        trust: "Trust Factors",
        integrations: "Integrations",
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
        error_stats: "Error al cargar estadísticas.",
        error_clients: "Error al cargar lista de clientes.",
        error_licenses: "Error al cargar licencias.",
        user_profile: "1. Perfil de Usuario",
        contact_name: "Nombre de Contacto",
        email: "Correo",
        phone: "Teléfono",
        role: "Rol/Posición",
        country: "País",
        license_code: "Código de Licencia",
        company_context: "Contexto de la Empresa",
        sector: "Sector",
        size: "Tamaño",
        website: "Sitio Web",
        work_info: "2. Información de Trabajo / Proyecto",
        needs_services: "Necesidades y Servicios",
        main_need: "Necesidad Principal",
        current_stage: "Etapa Actual",
        core_objectives: "Objetivos Principais",
        goal: "Meta",
        problem: "Problema a resolver",
        main_priority: "Prioridad Principal",
        investment: "Rango de Inversión",
        timeline: "Cronograma",
        urgency: "Urgencia (1-5)",
        requirements: "Requerimientos y Preocupaciones Clave",
        frustrations: "Frustraciones",
        worries: "Preocupaciones",
        trust: "Factores de Confianza",
        integrations: "Integraciones",
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
        error_stats: "Erro ao carregar estatísticas.",
        error_clients: "Erro ao carregar lista de clientes.",
        error_licenses: "Erro ao carregar licenças.",
        user_profile: "1. Perfil do Usuário",
        contact_name: "Nome de Contato",
        email: "E-mail",
        phone: "Telefone",
        role: "Papel/Posição",
        country: "País",
        license_code: "Código de Licença",
        company_context: "Contexto da Empresa",
        sector: "Setor",
        size: "Tamanho",
        website: "Web site",
        work_info: "2. Informações de Trabalho / Projeto",
        needs_services: "Necesidades e Serviços",
        main_need: "Necessidade Principal",
        current_stage: "Estágio Atual",
        core_objectives: "Objetivos Principais",
        goal: "Objetivo",
        problem: "Problema a resolver",
        main_priority: "Prioridade Principal",
        investment: "Faixa de Investimento",
        timeline: "Cronograma",
        urgency: "Urgência (1-5)",
        requirements: "Requisitos e Preocupações Principais",
        frustrations: "Frustrações",
        worries: "Preocupações",
        trust: "Fatores de Confiança",
        integrations: "Integrações",
        project_link: "Link do Projeto",
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
    loadStats();
    // Default view is overview, which loadStats handles
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
        const q = query(collection(db, 'licenses'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        licensesList.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const usedAtStr = data.usedAt ? new Date(data.usedAt.seconds * 1000).toLocaleDateString() : '-';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-family: monospace; font-weight: bold; color: var(--color-accent);">${data.code}</td>
                <td><span class="status-badge status-${data.status}">${data.status.toUpperCase()}</span></td>
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
        if (!items || !Array.isArray(items)) return currentLang === 'en' ? 'None' : (currentLang === 'es' ? 'Ninguno' : 'Nenhum');
        return `<div class="tag-list">${items.map(i => `<span class="tag">${i}</span>`).join('')}</div>`;
    };

    // Helper to render field
    const f = (val) => val || '-';

    detailContent.innerHTML = `
        <div class="dashboard-header" style="margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
                <h1 style="font-size: 3rem;">${member.name}</h1>
                <p class="color-text-secondary">${member.company || t.no_company}</p>
            </div>
            <button id="btn-download-pdf" class="btn btn-outline" style="min-width: 140px;">
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
            <div class="detail-section">
                <h3>${t.user_profile}</h3>
                <div class="info-grid">
                    <div class="info-item"><label>${t.contact_name}</label><span>${f(member.name)}</span></div>
                    <div class="info-item"><label>${t.email}</label><span>${member.email}</span></div>
                    <div class="info-item"><label>${t.phone}</label><span>${f(onboarding?.contact_phone)}</span></div>
                    <div class="info-item"><label>${t.role}</label><span>${f(onboarding?.contact_role)}</span></div>
                    <div class="info-item"><label>${t.country}</label><span>${f(onboarding?.contact_country)}</span></div>
                    <div class="info-item"><label>${t.license_code}</label><span>${f(member.licenseCode)}</span></div>
                </div>
                
                <div style="margin-top: 2rem;">
                    <div class="info-item">
                        <label>${t.company_context}</label>
                        <p>${f(onboarding?.company_description)}</p>
                    </div>
                </div>
                
                <div class="info-grid" style="margin-top: 1.5rem;">
                    <div class="info-item"><label>${t.sector}</label><span>${f(onboarding?.company_sector)}</span></div>
                    <div class="info-item"><label>${t.size}</label><span>${f(onboarding?.company_size)}</span></div>
                    <div class="info-item"><label>${t.website}</label><span>${f(onboarding?.company_website)}</span></div>
                </div>
            </div>

            <div class="detail-section">
                <h3>${t.work_info}</h3>
                <div class="info-item" style="margin-bottom: 2rem;">
                    <label>${t.needs_services}</label>
                    ${renderTags(onboarding?.interests)}
                </div>

                <div class="info-grid" style="margin-bottom: 2rem;">
                    <div class="info-item">
                        <label>${t.main_need}</label>
                        <p>${f(onboarding?.main_need)}</p>
                    </div>
                    <div class="info-item">
                        <label>${t.current_stage}</label>
                        <p>${f(onboarding?.project_stage)}</p>
                    </div>
                </div>

                <div class="info-item" style="margin-bottom: 2rem;">
                    <label>${t.core_objectives}</label>
                    <p><strong>${t.goal}:</strong> ${f(onboarding?.goal_description)}</p>
                    <p style="margin-top: 0.5rem;"><strong>${t.problem}:</strong> ${f(onboarding?.problem_description)}</p>
                </div>

                <div class="info-grid" style="margin-bottom: 2rem;">
                    <div class="info-item">
                        <label>${t.main_priority}</label>
                        <p>${f(onboarding?.main_priority)}</p>
                    </div>
                    <div class="info-item">
                        <label>${t.investment}</label>
                        <p>${f(onboarding?.budget_range)}</p>
                    </div>
                    <div class="info-item">
                        <label>${t.timeline}</label>
                        <p>${f(onboarding?.start_time)}</p>
                    </div>
                    <div class="info-item">
                        <label>${t.urgency}</label>
                        <p>${f(onboarding?.urgency)}</p>
                    </div>
                </div>

                <div class="info-item">
                    <label>${t.requirements}</label>
                    <p style="margin-bottom: 1rem;"><strong>${t.frustrations}:</strong> ${renderTags(onboarding?.frustrations)}</p>
                    <p style="margin-bottom: 1rem;"><strong>${t.worries}:</strong> ${f(onboarding?.project_worries)}</p>
                    <p style="margin-bottom: 1rem;"><strong>${t.trust}:</strong> ${f(onboarding?.trust_factor)}</p>
                    <p><strong>${t.integrations}:</strong> ${f(onboarding?.integration_desc)}</p>
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

    document.getElementById('btn-download-pdf').addEventListener('click', () => {
        generateClientPDF(member, onboarding, t);
    });
}

function generateClientPDF(member, onboarding, t) {
    // Check if html2pdf is available
    if (typeof html2pdf === 'undefined') {
        alert("PDF Generator library is loading or failed to load. Please try again.");
        return;
    }

    // Create a temporary detached container for the PDF layout
    const clone = document.createElement('div');
    clone.style.padding = '40px';
    clone.style.background = '#ffffff';
    clone.style.color = '#000000';
    clone.style.fontFamily = "'Manrope', sans-serif";
    
    // We clone the inner content of the PDF wrapper
    const contentHtml = document.getElementById('pdf-content-wrapper').innerHTML;

    clone.innerHTML = `
        <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #2997ff; padding-bottom: 20px;">
            <div style="font-size: 40px; color: #2997ff; font-weight: bold; margin-bottom: 10px;">λ</div>
            <h1 style="margin: 0; font-size: 24px; color: #1d1d1f; font-family: 'Playfair Display', serif;">ELYSIUM</h1>
            <p style="margin: 5px 0 0 0; color: #86868b; font-size: 12px; text-transform: uppercase;">Development & Research</p>
        </div>
        
        <div style="margin-bottom: 30px;">
            <h2 style="margin: 0; font-size: 28px; color: #1d1d1f;">${member.name}</h2>
            <p style="margin: 5px 0 0 0; color: #86868b; font-size: 16px;">${member.company || t.no_company}</p>
        </div>

        <div style="font-size: 14px; line-height: 1.6;">
            ${contentHtml}
        </div>
        
        <div style="margin-top: 50px; text-align: center; border-top: 1px solid #e5e5e5; padding-top: 20px; color: #86868b; font-size: 10px;">
            <p>&copy; ${new Date().getFullYear()} Elysium Development & Research. Confidential Internal Document.</p>
            <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>
    `;

    // Apply PDF-specific styles to strip out dark mode artifacts
    const style = document.createElement('style');
    style.innerHTML = `
        * { color: #1d1d1f !important; }
        .tag { background: #f5f5f7 !important; color: #1d1d1f !important; border: 1px solid #d2d2d7 !important; display: inline-block; padding: 4px 8px; border-radius: 4px; margin: 2px; font-size: 12px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .info-item label { color: #86868b !important; font-size: 12px; font-weight: bold; text-transform: uppercase; display: block; margin-bottom: 4px; }
        h3 { color: #2997ff !important; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid #e5e5e5; padding-bottom: 5px; }
    `;
    clone.appendChild(style);

    const opt = {
        margin:       0,
        filename:     `Elysium_Client_${member.name.replace(/\s+/g, '_')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(clone).save();
}
