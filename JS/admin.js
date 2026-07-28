import { auth, db, storage } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    collection,
    getDocs,
    doc,
    getDoc,
    query,
    where,
    orderBy,
    limit,
    updateDoc,
    deleteDoc,
    setDoc,
    addDoc,
    serverTimestamp,
    writeBatch,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
    ref, 
    uploadBytes,
    uploadBytesResumable, 
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const SUPER_ADMIN_EMAIL = 'danielalonzzo@icloud.com';

const SUBSCRIPTION_PLANS = {
    hosting:      { code: 'H0ST', label: 'Domain & Hosting' },
    basic:        { code: 'EC01', label: 'Basic Maintenance' },
    preferential: { code: 'EC02', label: 'Preferential Maintenance' },
    advanced:     { code: 'EC03', label: 'Advanced Maintenance' },
    crm:          { code: 'CRMP', label: 'Custom Core CRM' }
};

/**
 * External/manual licenses encode the commercial agreement itself:
 * ELY-{plan}-{M3N|ANL}{1..9}-{business tax/registration ID}.
 * Stripe licenses keep their separate webhook-derived identifier.
 */
function buildManualLicense(planType, contractUnit, contractLength, businessId) {
    const planCode = SUBSCRIPTION_PLANS[planType]?.code || 'CSTM';
    const length = Math.min(9, Math.max(1, Number(contractLength) || 1));
    const periodCode = `${contractUnit === 'years' ? 'ANL' : 'M3N'}${length}`;
    const normalizedBusinessId = String(businessId || '').replace(/\D/g, '');
    return {
        licenseCode: `ELY-${planCode}-${periodCode}-${normalizedBusinessId}`,
        periodCode,
        businessId: normalizedBusinessId,
        contractLength: length,
        contractUnit: contractUnit === 'years' ? 'years' : 'months'
    };
}

// ── Conditional Logger ──────────────────────────────────────────────────────
// In production (elysiumdr.eu) all logs are silenced to prevent leaking
// sensitive partner data through the browser console.
const IS_DEV = ['localhost', '127.0.0.1', 'web.app'].some(h => location.hostname.includes(h));
const logger = {
    log:   (...a) => IS_DEV && console.log('[Elysium CRM]', ...a),
    warn:  (...a) => IS_DEV && console.warn('[Elysium CRM]', ...a),
    error: (...a) => console.error('[Elysium CRM]', ...a)  // errors always surface
};

// ── CRM State ───────────────────────────────────────────────────────────────
// Holds all loaded clients in memory so search/sort never re-hits Firestore.
let _allClients   = [];
let _sortAZ       = true;    // true = A→Z, false = newest first
let _activeFilter = 'all';   // pipeline stage filter on clients tab
let _draftUnsub   = null;    // live onboarding-draft listener (Co-Pilot panel)

// ── Helpers ──────────────────────────────────────────────────────────────────
/**
 * Classify a partner document into one of 4 pipeline stages.
 * Prospect   → registered, onboarding not complete
 * Onboarding → onboarding complete, no projectUrl
 * Active     → has projectUrl assigned
 * Delivered  → has deliveredAt field set
 */
function getPartnerStage(data) {
    if (data.deliveredAt)                        return 'delivered';
    if (data.projectUrl)                         return 'active';
    if (data.onboardingCompleted)                return 'onboarding';
    return 'prospect';
}

/** Escape a string for safe interpolation into innerHTML */
function esc(str) {
    return String(str ?? '').replace(/[&<>"']/g, ch => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
    ));
}

function formatAdminDate(value) {
    if (!value) return '—';
    const date = value.seconds ? new Date(value.seconds * 1000) : new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    const locale = currentLang === 'es' ? 'es-CR' : currentLang === 'pt' ? 'pt-PT' : 'en-GB';
    return date.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
}

function subscriptionStatus(subscription) {
    if (!subscription) return null;
    const storedStatus = subscription.status || 'active';
    if (!subscription.nextBillingDate || ['suspended', 'canceled', 'cancelled'].includes(storedStatus)) return storedStatus;

    const renewal = subscription.nextBillingDate.seconds
        ? subscription.nextBillingDate.seconds * 1000
        : new Date(subscription.nextBillingDate).getTime();
    if (!Number.isFinite(renewal) || Date.now() <= renewal) return storedStatus;

    const grace = subscription.gracePeriodEnd
        ? (subscription.gracePeriodEnd.seconds
            ? subscription.gracePeriodEnd.seconds * 1000
            : new Date(subscription.gracePeriodEnd).getTime())
        : renewal + (15 * 86400000);
    return Date.now() > grace ? 'suspended' : 'pending_payment';
}

/**
 * Append an event to the immutable activity log (fire-and-forget).
 * Never blocks or fails the operation that triggered it.
 */
function logActivity(memberId, memberName, type, payload = {}) {
    return addDoc(collection(db, 'activities'), {
        memberId,
        memberName: memberName || null,
        type,
        payload,
        actorUid:   auth.currentUser?.uid   || null,
        actorEmail: auth.currentUser?.email || null,
        actorRole:  'admin',
        createdAt:  serverTimestamp()
    }).catch(err => logger.warn('logActivity failed:', err));
}

/** Human-readable relative time from Firestore timestamp */
function timeAgo(ts) {
    if (!ts) return '';
    const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    const diff = Date.now() - d.getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins  <  2) return 'just now';
    if (mins  < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days  <  2) return 'yesterday';
    if (days  < 30) return `${days}d ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Animate a progress bar fill after a paint frame */
function animateProgress(el, pct) {
    if (!el) return;
    requestAnimationFrame(() => {
        setTimeout(() => { el.style.width = `${Math.min(100, Math.max(0, pct))}%`; }, 60);
    });
}

/** Get the first character(s) to use as avatar initials */
function initials(name) {
    if (!name) return '?';
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

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
        licenses_desc: "Licenses assigned by active subscriptions, whether paid online or recorded manually.",
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
        project_link_title: "Project Link",
        save_link: "Save Link",
        project_cost: "Project Cost",
        monthly_fee: "Monthly Maint. Fee",
        discount: "Discount",
        status_prospect: "Prospect (No Billing)",
        status_dev: "In Development",
        status_free: "Free Tier",
        status_active: "Active Maintenance",
        save_financials: "Save Financials",
        saved: "Saved!",
        invoices_reports: "Invoices & Reports",
        no_reports: "No reports uploaded yet.",
        upload_new: "Upload New Document",
        title_placeholder: "Title (e.g. Invoice Feb 2026)",
        amount_placeholder: "Amount",
        choose_file: "Choose File...",
        upload_btn: "Upload",
        uploading: "Uploading...",
        error_upload: "Error uploading report:",
        error_title_file: "Title and File are required.",
        onboarding_empty: "The user has not completed the onboarding for this project.",
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
        stage_contact: "First Contact",
        stage_proto: "Prototyping",
        stage_dev: "Development",
        stage_delivery: "Delivery & Publication",
        stage_maint: "Maintenance",
        nav_contacts: "Inquiries",
        contacts_title: "Inquiries",
        contacts_desc: "Review contact form submissions.",
        table_date: "Date",
        table_name: "Name",
        table_email: "Email",
        table_phone: "Phone",
        table_service: "Interest",
        table_message: "Message",
        flagSrc: "Images/Banderas/union-europea.png",
        flagAlt: "EU"
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
        licenses_desc: "Licencias asignadas por suscripciones, tanto por pago web como por registro manual.",
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
        error_clients: "Error al cargar lista de clientes.",
        error_licenses: "Error al cargar licencias.",
        // Detail View Keys
        project_link_title: "Enlace del Proyecto",
        save_link: "Guardar Enlace",
        project_cost: "Costo del Proyecto",
        monthly_fee: "Mensualidad",
        discount: "Descuento",
        status_prospect: "Prospecto (Sin Facturación)",
        status_dev: "En Desarrollo",
        status_free: "Plan Gratuito",
        status_active: "Mantenimiento Activo",
        save_financials: "Guardar Finanzas",
        saved: "¡Guardado!",
        invoices_reports: "Facturas y Reportes",
        no_reports: "Aún no hay reportes subidos.",
        upload_new: "Subir Nuevo Documento",
        title_placeholder: "Título (ej. Factura Feb 2026)",
        amount_placeholder: "Monto",
        choose_file: "Elegir Archivo...",
        upload_btn: "Subir",
        uploading: "Subiendo...",
        error_upload: "Error al subir reporte:",
        error_title_file: "Título y Archivo son obligatorios.",
        onboarding_empty: "El usuario no ha completado el onboarding para este proyecto.",
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
        stage_contact: "Primer Contacto",
        stage_proto: "Prototipado",
        stage_dev: "Desarrollo",
        stage_delivery: "Entrega y publicación",
        stage_maint: "Mantenimiento",
        nav_contacts: "Consultas",
        contacts_title: "Consultas",
        contacts_desc: "Revisa los formularios de contacto recibidos.",
        table_date: "Fecha",
        table_name: "Nombre",
        table_email: "Correo",
        table_phone: "Teléfono",
        table_service: "Interés",
        table_message: "Mensaje",
        flagSrc: "Images/Banderas/costa-rica.png",
        flagAlt: "CR"
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
        licenses_desc: "Licenças atribuídas por subscrições, por pagamento online ou registo manual.",
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
        project_link_title: "Link do Projeto",
        save_link: "Salvar Link",
        project_cost: "Custo do Projeto",
        monthly_fee: "Mensalidade",
        discount: "Desconto",
        status_prospect: "Prospecto (Sem Faturamento)",
        status_dev: "Em Desenvolvimento",
        status_free: "Plano Gratuito",
        status_active: "Manutenção Ativa",
        save_financials: "Salvar Finanças",
        saved: "Salvo!",
        invoices_reports: "Faturas e Relatórios",
        no_reports: "Ainda não há relatórios enviados.",
        upload_new: "Enviar Novo Documento",
        title_placeholder: "Título (ex. Fatura Fev 2026)",
        amount_placeholder: "Valor",
        choose_file: "Escolher Arquivo...",
        upload_btn: "Enviar",
        uploading: "Enviando...",
        error_upload: "Erro ao enviar relatório:",
        error_title_file: "Título e Arquivo são obrigatórios.",
        onboarding_empty: "O utilizador não concluiu o onboarding para este projeto.",
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
        stage_contact: "Primeiro Contacto",
        stage_proto: "Prototipagem",
        stage_dev: "Desenvolvimento",
        stage_delivery: "Entrega e publicação",
        stage_maint: "Manutenção",
        nav_contacts: "Consultas",
        contacts_title: "Consultas",
        contacts_desc: "Reveja as submissões de formulários de contacto.",
        table_date: "Data",
        table_name: "Nome",
        table_email: "E-mail",
        table_phone: "Telefone",
        table_service: "Interesse",
        table_message: "Mensagem",
        flagSrc: "Images/Banderas/portugal.png",
        flagAlt: "PT"
    }
};

let currentLang = localStorage.getItem('elysium_lang') || 'en';

document.addEventListener('DOMContentLoaded', () => {
    // Auth Guard
    onAuthStateChanged(auth, async (user) => {
        if (!user || user.email !== SUPER_ADMIN_EMAIL) {
            window.location.href = 'profiles';
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
            else if (activeSection === 'pipeline') loadPipeline();
            else if (activeSection === 'contacts') loadContacts();
        });
    });

    // Sidebar Navigation
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.admin-section');

    function navigateTo(target) {
        navItems.forEach(i => i.classList.remove('active'));
        document.querySelector(`.nav-item[data-target="${target}"]`)?.classList.add('active');

        sections.forEach(s => {
            s.classList.remove('active');
            if (s.id === target) s.classList.add('active');
        });

        localStorage.setItem('elysium_admin_tab', target);

        if (target === 'overview') loadStats();
        if (target === 'clients') loadClients();
        if (target === 'pipeline') loadPipeline();
        if (target === 'licenses') loadLicenses();
        if (target === 'contacts') loadContacts();
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => navigateTo(item.dataset.target));
    });

    // "View all" links inside overview panels
    document.querySelectorAll('[data-target-nav]').forEach(link => {
        link.addEventListener('click', () => navigateTo(link.dataset.targetNav));
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
        brandLink.href = currentLang === 'en' ? './' : `${currentLang}/`;
    }
    
    if (label) label.textContent = currentLang.toUpperCase();
    
    const flagEl = document.querySelector('.lang-current-flag');
    if (flagEl) flagEl.innerHTML = `<img src="${t.flagSrc}" alt="${t.flagAlt}" class="flag-icon" style="width: 1.2em; height: auto; vertical-align: middle; display: inline-block;">`;

    // Update Sidebar nav labels (each nav-item has an SVG + span, target only the span)
    const navOverview  = document.querySelector('[data-target="overview"] span:not(.sidebar-badge)');
    const navPipeline  = document.querySelector('[data-target="pipeline"] span:not(.sidebar-badge)');
    const navClients   = document.querySelector('[data-target="clients"] span:not(.sidebar-badge)');
    const navLicenses  = document.querySelector('[data-target="licenses"] span:not(.sidebar-badge)');
    if (navOverview) navOverview.textContent = t.nav_overview;
    if (navPipeline) navPipeline.textContent = 'Pipeline';
    if (navClients)  navClients.textContent  = t.nav_clients;
    if (navLicenses) navLicenses.textContent = t.nav_licenses;
    const navContacts = document.querySelector('[data-target="contacts"] span:not(.sidebar-badge)');
    if (navContacts) navContacts.textContent = t.nav_contacts || "Inquiries";

    // Logout button has SVG + span — only update the span
    const logoutSpan = document.querySelector('#logoutBtn span');
    if (logoutSpan) logoutSpan.textContent = t.logout;

    // Update section headers (static parts)
    const ovH1 = document.querySelector('#overview h1');
    const ovP  = document.querySelector('#overview p.color-text-secondary');
    if (ovH1) ovH1.textContent = currentLang === 'en' ? 'Dashboard' : (currentLang === 'es' ? 'Tablero' : 'Painel');
    if (ovP)  ovP.textContent  = t.welcome;
    
    const cliH1 = document.querySelector('#clients h1');
    const cliP  = document.querySelector('#clients p.color-text-secondary');
    if (cliH1) cliH1.textContent = t.clients_title;
    if (cliP)  cliP.textContent  = t.clients_desc;
    
    const licH1 = document.querySelector('#licenses h1');
    const licP  = document.querySelector('#licenses p.color-text-secondary');
    if (licH1) licH1.textContent = t.licenses_title;
    if (licP)  licP.textContent  = t.licenses_desc;

    const conH1 = document.querySelector('#contacts-title');
    const conP  = document.querySelector('#contacts-desc');
    if (conH1) conH1.textContent = t.contacts_title || "Inquiries";
    if (conP)  conP.textContent  = t.contacts_desc || "Review contact form submissions.";

    // Update table headers
    const ths = document.querySelectorAll('.admin-table th');
    if (ths.length > 0) {
        ths[0].textContent = t.table_code;
        ths[1].textContent = t.table_status;
        ths[2].textContent = t.table_assigned;
        ths[3].textContent = t.table_used;
    }

    const thDate = document.getElementById('th-date');
    const thName = document.getElementById('th-name');
    const thEmail = document.getElementById('th-email');
    const thPhone = document.getElementById('th-phone');
    const thService = document.getElementById('th-service');
    const thMessage = document.getElementById('th-message');
    if (thDate) thDate.textContent = t.table_date || "Date";
    if (thName) thName.textContent = t.table_name || "Name";
    if (thEmail) thEmail.textContent = t.table_email || "Email";
    if (thPhone) thPhone.textContent = t.table_phone || "Phone";
    if (thService) thService.textContent = t.table_service || "Interest";
    if (thMessage) thMessage.textContent = t.table_message || "Message";
}

async function initDashboard() {
    const savedTab = localStorage.getItem('elysium_admin_tab') || 'overview';

    // Set dashboard date
    const dateEl = document.getElementById('dashboard-date');
    if (dateEl) {
        const now = new Date();
        dateEl.innerHTML = now.toLocaleDateString(undefined, {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    }

    // Restore saved tab visually
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.admin-section');

    navItems.forEach(i => i.classList.remove('active'));
    document.querySelector(`.nav-item[data-target="${savedTab}"]`)?.classList.add('active');

    sections.forEach(s => s.classList.remove('active'));
    document.getElementById(savedTab)?.classList.add('active');

    // Load content for the active tab
    if (savedTab === 'overview')  loadStats();
    if (savedTab === 'clients')   loadClients();
    if (savedTab === 'pipeline')  loadPipeline();
    if (savedTab === 'licenses')  loadLicenses();
    if (savedTab === 'contacts')  loadContacts();
}

async function loadStats() {
    const statsContainer = document.getElementById('stats-overview');
    statsContainer.innerHTML = '<div class="premium-loader"></div>';
    const t = translations[currentLang];

    try {
        const membersSnap  = await getDocs(collection(db, 'members'));
        
        let prospectsSnap = null;
        try {
            prospectsSnap = await getDocs(collection(db, 'prospects'));
        } catch (e) {
            console.warn('Could not load prospects (permission denied or missing collection).', e);
        }
        
        // Filter real partners
        const partnerDocs = membersSnap.docs.filter(d => {
            const r = d.data().role;
            return r !== 'admin' && r !== 'root' && d.data().email !== SUPER_ADMIN_EMAIL;
        });

        // Sync _allClients for pipeline/feed if not yet loaded
        if (_allClients.length === 0) {
            _allClients = partnerDocs.map(d => {
                const data = d.data();
                
                // --- Legacy Migration for Projects ---
                // If they don't have a projects array but have legacy data, create one project from the root fields
                if (!data.projects) {
                    data.projects = [];
                    // Even if they don't have projectUrl, they might have a project in progress (onboarding)
                    if (data.projectUrl || data.onboardingCompleted || data.financials || data.projectStage) {
                        data.projects.push({
                            id: 'project-1',
                            name: data.company || data.name || 'Proyecto 1',
                            projectUrl: data.projectUrl || null,
                            projectStage: data.projectStage || 'first_contact',
                            financials: data.financials || null,
                            reports: data.reports || [],
                            timeline: data.timeline || [],
                            projectDescription: data.projectDescription || ''
                        });
                    }
                }
                // One-time auto cleanup logic for duplicated or misnamed projects
                if (data.projects) {
                    let needsUpdate = false;
                    let cleanedProjects = [];
                    let seenIds = new Set();
                    data.projects.forEach(p => {
                        if (p.name === 'Main Project') {
                            p.name = data.company || data.name || 'Proyecto 1';
                            needsUpdate = true;
                        }
                        if (!seenIds.has(p.id)) {
                            seenIds.add(p.id);
                            cleanedProjects.push(p);
                        } else {
                            needsUpdate = true; // It's a duplicate
                        }
                    });
                    
                    if (needsUpdate) {
                        data.projects = cleanedProjects;
                        // Fire and forget update to clean the database
                        updateDoc(doc(db, 'members', d.id), { projects: cleanedProjects }).catch(console.error);
                    }
                }

                return { id: d.id, ...data };
            });
            
            // Add prospects to _allClients, giving them a role to identify them
            if (prospectsSnap) {
                prospectsSnap.forEach(d => {
                    _allClients.push({
                        id: d.id,
                        role: 'prospect', // mark as prospect specifically
                        ...d.data()
                    });
                });
            }
        }

        const totalPartners     = partnerDocs.length;
        const completedOB       = partnerDocs.filter(d => d.data().onboardingCompleted).length;
        const onboardingRate    = totalPartners > 0 ? Math.round((completedOB / totalPartners) * 100) : 0;
        const activeProjects    = partnerDocs.filter(d => d.data().projectUrl).length;
        const subscribedPartners = partnerDocs.filter(d => d.data().subscription?.licenseCode);
        const totalLicenses      = subscribedPartners.length;
        const activeLicenses     = subscribedPartners.filter(d => subscriptionStatus(d.data().subscription) === 'active').length;
        const automaticLicenses  = subscribedPartners.filter(d => d.data().subscription?.source === 'stripe').length;
        const licenseHealth      = totalLicenses > 0 ? Math.round((activeLicenses / totalLicenses) * 100) : 0;

        // Update sidebar counts
        const sidebarPartners  = document.getElementById('sidebar-clients-count');
        const sidebarPipeline  = document.getElementById('sidebar-pipeline-count');
        if (sidebarPartners)  sidebarPartners.textContent  = totalPartners;
        if (sidebarPipeline)  sidebarPipeline.textContent  = activeProjects;

        try {
            const contactsSnap = await getDocs(collection(db, 'contacts'));
            const contactsBadge = document.getElementById('sidebar-contacts-count');
            if (contactsBadge) contactsBadge.textContent = contactsSnap.size;
        } catch (e) {
            console.warn('Could not load contacts count.', e);
        }

        logger.log(`Stats — partners: ${totalPartners}, OB rate: ${onboardingRate}%, active: ${activeProjects}`);

        // ── KPI card builder ────────────────────────────────────────────
        const kpiCard = ({ id, value, label, sub, colorClass, iconSvg, progress, progressLabel, progressFillClass, trend, trendClass }) => `
            <div class="kpi-card ${colorClass}">
                <div class="kpi-card-top">
                    <div class="kpi-icon icon-${colorClass.replace('kpi-', '')}">
                        ${iconSvg}
                    </div>
                    <span class="kpi-trend ${trendClass}">${trend}</span>
                </div>
                <div class="kpi-value">${value}</div>
                <div class="kpi-label">${label}</div>
                <div class="kpi-progress-bar"><div class="kpi-progress-fill fill-${colorClass.replace('kpi-', '')}" id="kpi-fill-${id}" style="width:0"></div></div>
                <div class="kpi-progress-label"><span>${sub}</span><span>${progressLabel}</span></div>
            </div>`;

        statsContainer.className = 'kpi-grid';
        statsContainer.innerHTML =
            kpiCard({
                id: 'partners', value: totalPartners, label: 'Total Partners',
                sub: `${completedOB} onboarded`, progressLabel: `${onboardingRate}%`,
                colorClass: 'kpi-blue', trendClass: 'trend-neutral', trend: 'Partners',
                iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
            }) +
            kpiCard({
                id: 'rate', value: `${onboardingRate}%`, label: 'Onboarding Rate',
                sub: `${completedOB} of ${totalPartners}`, progressLabel: `${completedOB} done`,
                colorClass: 'kpi-green', trendClass: onboardingRate >= 80 ? 'trend-up' : 'trend-neutral', trend: onboardingRate >= 80 ? '↑ High' : '→ Mid',
                iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
            }) +
            kpiCard({
                id: 'active', value: activeProjects, label: 'Active Projects',
                sub: `${totalPartners - activeProjects} awaiting`, progressLabel: `${totalPartners > 0 ? Math.round((activeProjects/totalPartners)*100) : 0}%`,
                colorClass: 'kpi-gold', trendClass: 'trend-neutral', trend: 'Projects',
                iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`
            }) +
            kpiCard({
                id: 'licenses', value: activeLicenses, label: 'Active Subscription Licenses',
                sub: `${totalLicenses} assigned`, progressLabel: `${automaticLicenses} automatic`,
                colorClass: licenseHealth >= 80 ? 'kpi-green' : 'kpi-blue',
                trendClass: 'trend-neutral',
                trend: totalLicenses ? `${licenseHealth}% active` : 'No subscriptions',
                iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`
            });

        // Animate progress bars after render
        animateProgress(document.getElementById('kpi-fill-partners'), onboardingRate);
        animateProgress(document.getElementById('kpi-fill-rate'),     onboardingRate);
        animateProgress(document.getElementById('kpi-fill-active'),   totalPartners > 0 ? (activeProjects / totalPartners) * 100 : 0);
        animateProgress(document.getElementById('kpi-fill-licenses'), licenseHealth);

        // Load supplementary panels
        loadRecentActivity();
        loadPipelineSnapshot();
        renderGlobalRevenueChart();

    } catch (error) {
        logger.error('Error loading stats:', error);
        statsContainer.innerHTML = `<p class="color-text-error">${t.error_stats}<br><small style="font-size: 0.8em; opacity: 0.8;">${error.message}</small></p>`;
    }
}

// ── RECENT ACTIVITY FEED ─────────────────────────────────────────────────────
const FEED_ICONS = {
    user:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    monitor: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
    slash:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>`,
    check:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`,
    file:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`
};

/** Humanize a pipeline stage key: 'first_contact' → 'first contact' */
const stageName = s => String(s || '—').replace(/_/g, ' ');

// How each activity type renders (dot class, icon, timeline label, subtitle builder)
const ACTIVITY_PRESENTATION = {
    member_registered:     { dot: 'feed-dot-join',    icon: 'user',    label: 'Account created',        sub: () => 'Joined as partner' },
    onboarding_completed:  { dot: 'feed-dot-onboard', icon: 'check',   label: 'Onboarding submitted',   sub: () => 'Onboarding completed' },
    stage_changed:         { dot: 'feed-dot-project', icon: 'check',   label: 'Pipeline stage updated', sub: p => `Stage: ${stageName(p.fromStage)} → ${stageName(p.toStage)}` },
    project_url_set:       { dot: 'feed-dot-project', icon: 'monitor', label: 'Project published',      sub: () => 'Project URL assigned' },
    financials_updated:    { dot: 'feed-dot-project', icon: 'file',    label: 'Financial terms updated', sub: () => 'Financials updated' },
    report_added:          { dot: 'feed-dot-project', icon: 'file',    label: 'Report delivered',       sub: p => p.title ? `Report added · ${p.title}` : 'Report added' },
    report_removed:        { dot: 'feed-dot-suspend', icon: 'file',    label: 'Report removed',         sub: p => p.title ? `Report removed · ${p.title}` : 'Report removed' },
    subscription_assigned: { dot: 'feed-dot-onboard', icon: 'file',    label: 'Subscription activated', sub: p => `Subscription assigned${p.planType ? ' · ' + p.planType : ''}` },
    subscription_updated:  { dot: 'feed-dot-project', icon: 'file',    label: 'Subscription updated',   sub: p => `Status: ${p.status || 'updated'}` },
    subscription_payment_received: { dot: 'feed-dot-onboard', icon: 'check', label: 'Subscription payment received', sub: p => `License renewed${p.planType ? ' · ' + p.planType : ''}` },
    subscription_payment_failed: { dot: 'feed-dot-suspend', icon: 'slash', label: 'Subscription payment failed', sub: () => 'Payment requires attention' },
    subscription_canceled: { dot: 'feed-dot-suspend', icon: 'slash', label: 'Subscription canceled', sub: () => 'License access canceled' },
    prospect_promoted:     { dot: 'feed-dot-join',    icon: 'user',    label: 'Prospect converted',     sub: p => p.prospectName ? `Prospect converted · ${p.prospectName}` : 'Prospect converted to project' },
    notes_updated:         { dot: 'feed-dot-project', icon: 'file',    label: 'Internal note updated',  sub: () => 'Internal notes updated' },
    account_suspended:     { dot: 'feed-dot-suspend', icon: 'slash',   label: 'Account suspended',      sub: () => 'Account suspended' },
    account_reactivated:   { dot: 'feed-dot-onboard', icon: 'check',   label: 'Account reactivated',    sub: () => 'Account reactivated' }
};

async function loadRecentActivity() {
    const container = document.getElementById('activity-feed-container');
    if (!container) return;

    try {
        // ── Real events from the append-only activity log ──
        let logged = [];
        try {
            const snap = await getDocs(query(collection(db, 'activities'), orderBy('createdAt', 'desc'), limit(15)));
            logged = snap.docs.map(d => d.data());
        } catch (err) {
            logger.warn('Activity log unavailable, falling back to derived feed:', err);
        }

        const events = logged.map(a => {
            const pres = ACTIVITY_PRESENTATION[a.type] || { dot: 'feed-dot-project', icon: 'file', sub: () => a.type };
            return {
                ts: a.createdAt,
                title: a.memberName || 'Unknown',
                sub: pres.sub(a.payload || {}),
                dotClass: pres.dot,
                icon: FEED_ICONS[pres.icon],
                partnerId: a.memberId
            };
        });

        // ── Legacy derived events (history predating the activity log) ──
        // Skipped for members whose equivalent event already exists in the log.
        const idsWith = type => new Set(logged.filter(a => a.type === type).map(a => a.memberId));
        const loggedJoin    = idsWith('member_registered');
        const loggedUrl     = idsWith('project_url_set');
        const loggedSuspend = idsWith('account_suspended');

        _allClients.forEach(c => {
            if (c.createdAt && !loggedJoin.has(c.id)) {
                events.push({
                    ts: c.createdAt,
                    title: c.name || 'Unknown',
                    sub: `Joined as partner${c.company ? ' · ' + c.company : ''}`,
                    dotClass: 'feed-dot-join', icon: FEED_ICONS.user, partnerId: c.id
                });
            }
            if (c.projectUrl && !loggedUrl.has(c.id)) {
                events.push({
                    ts: c.createdAt, // proxy date — no real timestamp pre-ledger
                    title: c.name || 'Unknown',
                    sub: 'Project URL assigned',
                    dotClass: 'feed-dot-project', icon: FEED_ICONS.monitor, partnerId: c.id
                });
            }
            if (c.isDeactivated && !loggedSuspend.has(c.id)) {
                events.push({
                    ts: c.createdAt, // proxy date — no real timestamp pre-ledger
                    title: c.name || 'Unknown',
                    sub: 'Account suspended',
                    dotClass: 'feed-dot-suspend', icon: FEED_ICONS.slash, partnerId: c.id
                });
            }
        });

        // Sort by timestamp desc, take top 7
        events.sort((a, b) => (b.ts?.seconds ?? 0) - (a.ts?.seconds ?? 0));
        const top = events.slice(0, 7);

        if (top.length === 0) {
            container.innerHTML = `<p style="font-size:0.82rem;opacity:0.4;text-align:center;padding:1rem 0;">No recent activity.</p>`;
            return;
        }

        container.innerHTML = `<div class="feed-list">${top.map(ev => `
            <div class="feed-item" style="cursor:pointer;" data-partner-id="${esc(ev.partnerId)}">
                <div class="feed-item-dot ${ev.dotClass}">${ev.icon}</div>
                <div class="feed-item-body">
                    <div class="feed-item-title">${esc(ev.title)}</div>
                    <div class="feed-item-sub">${esc(ev.sub)}</div>
                </div>
                <div class="feed-item-time">${timeAgo(ev.ts)}</div>
            </div>`).join('')}</div>`;

        // Click opens detail panel (only for members still loaded in memory)
        container.querySelectorAll('.feed-item').forEach(item => {
            item.addEventListener('click', () => {
                const partner = _allClients.find(c => c.id === item.dataset.partnerId);
                if (partner) showClientDetail(partner.id, partner);
            });
        });

    } catch (error) {
        logger.error('loadRecentActivity:', error);
    }
}

// ── CLIENT TIMELINE (Vista 360, inside detail panel) ────────────────────────
async function loadClientTimeline(userId, member) {
    const container = document.getElementById('client-timeline-container');
    if (!container) return;

    let acts = [];
    try {
        // Equality-only query → automatic single-field index; sorted client-side
        // so no composite-index deploy is required.
        const snap = await getDocs(query(collection(db, 'activities'), where('memberId', '==', userId), limit(100)));
        acts = snap.docs.map(d => d.data());
        acts.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
    } catch (err) {
        logger.warn('Client timeline unavailable:', err);
        container.innerHTML = `<p class="timeline-empty">Activity log unavailable.</p>`;
        return;
    }

    const fmtFull = ts => ts?.seconds
        ? new Date(ts.seconds * 1000).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '';

    const arrowSvg = `<svg class="tl-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;

    const items = acts.map(a => {
        const pres = ACTIVITY_PRESENTATION[a.type] || { dot: 'feed-dot-project', icon: 'file', label: a.type, sub: () => '' };
        const p = a.payload || {};
        const detail = a.type === 'stage_changed'
            ? `<span class="tl-stage-flow">
                   <span class="tl-stage-pill">${esc(stageName(p.fromStage))}</span>${arrowSvg}
                   <span class="tl-stage-pill tl-stage-pill-active">${esc(stageName(p.toStage))}</span>
               </span>`
            : `<span class="tl-desc">${esc(pres.sub(p))}</span>`;

        return `
            <div class="tl-item">
                <div class="tl-node ${pres.dot}">${FEED_ICONS[pres.icon]}</div>
                <div class="tl-card">
                    <div class="tl-card-head">
                        <span class="tl-label">${esc(pres.label || a.type)}</span>
                        <span class="tl-time">${timeAgo(a.createdAt)}</span>
                    </div>
                    ${detail}
                    <div class="tl-meta">
                        <span class="tl-actor ${a.actorRole === 'admin' ? 'tl-actor-admin' : 'tl-actor-member'}">${a.actorRole === 'admin' ? 'Admin' : 'Client'}</span>
                        <span class="tl-date">${esc(fmtFull(a.createdAt))}</span>
                    </div>
                </div>
            </div>`;
    });

    // Genesis node — account creation predating the activity ledger
    if (member?.createdAt && !acts.some(a => a.type === 'member_registered')) {
        items.push(`
            <div class="tl-item">
                <div class="tl-node feed-dot-join">${FEED_ICONS.user}</div>
                <div class="tl-card">
                    <div class="tl-card-head">
                        <span class="tl-label">${member.role === 'prospect' ? 'Request received' : 'Account created'}</span>
                        <span class="tl-time">${timeAgo(member.createdAt)}</span>
                    </div>
                    <span class="tl-desc">${esc(member.company ? 'Member · ' + member.company : 'Member since')}</span>
                    <div class="tl-meta">
                        <span class="tl-actor tl-actor-member">Client</span>
                        <span class="tl-date">${esc(fmtFull(member.createdAt))}</span>
                    </div>
                </div>
            </div>`);
    }

    container.innerHTML = items.length === 0
        ? `<p class="timeline-empty">No recorded activity yet. New events will appear here as they happen.</p>`
        : `<div class="tl">${items.join('')}</div>`;
}

// ── PIPELINE SNAPSHOT (overview panel mini-version) ──────────────────────────
function loadPipelineSnapshot() {
    const container = document.getElementById('pipeline-snapshot-container');
    if (!container) return;

    const t = translations[currentLang];
    const stages = { prospect: 0, first_contact: 0, prototyping: 0, development: 0, delivery: 0, maintenance: 0 };
    let total = 0;
    _allClients.forEach(c => {
        // If it's a pure prospect (no account yet)
        if (c.role === 'prospect') {
            stages['prospect']++;
            total++;
            return;
        }

        if (c.projects && Array.isArray(c.projects)) {
            c.projects.forEach(p => {
                const stage = p.projectStage || 'first_contact';
                if (stages[stage] !== undefined) {
                    stages[stage]++;
                } else {
                    stages['first_contact']++;
                }
                total++;
            });
        } else {
            const stage = c.projectStage || 'first_contact';
            if (stages[stage] !== undefined) {
                stages[stage]++;
            } else {
                stages['first_contact']++;
            }
            total++;
        }
    });
    if (total === 0) total = 1;

    const rows = [
        { key: 'prospect',      label: 'Prospect',                                 cls: 'snap-prospect' },
        { key: 'first_contact', label: t.stage_contact || 'First Contact',         cls: 'snap-first_contact' },
        { key: 'prototyping',   label: t.stage_proto || 'Prototyping',             cls: 'snap-prototyping'   },
        { key: 'development',   label: t.stage_dev || 'Development',               cls: 'snap-development'   },
        { key: 'delivery',      label: t.stage_delivery || 'Delivery & Pub',       cls: 'snap-delivery'      },
        { key: 'maintenance',   label: t.stage_maint || 'Maintenance',             cls: 'snap-maintenance'   },
    ];

    container.innerHTML = `<div class="pipeline-snapshot">${rows.map((r, i) => `
        <div class="pipeline-snapshot-row ${r.cls}">
            <div class="pipeline-snapshot-label">${r.label}</div>
            <div class="pipeline-snapshot-bar"><div class="pipeline-snapshot-fill" id="ps-fill-${i}" style="width:0"></div></div>
            <div class="pipeline-snapshot-count">${stages[r.key]}</div>
        </div>`).join('')}</div>`;

    rows.forEach((r, i) => {
        animateProgress(document.getElementById(`ps-fill-${i}`), (stages[r.key] / total) * 100);
    });
}

// ── FULL PIPELINE KANBAN ──────────────────────────────────────────────────────
async function loadPipeline() {
    const board = document.getElementById('pipeline-board');
    if (!board) return;

    // If clients not loaded yet, fetch them first
    if (_allClients.length === 0) {
        board.innerHTML = '<div class="premium-loader"></div>';
        const q = query(collection(db, 'members'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        _allClients = [];
        snap.forEach(docSnap => {
            const data = docSnap.data();
            if (data.email === SUPER_ADMIN_EMAIL || data.role === 'admin' || data.role === 'root') return;
            _allClients.push({ id: docSnap.id, ...data });
        });
        
        try {
            const prospectsSnap = await getDocs(collection(db, 'prospects'));
            prospectsSnap.forEach(d => {
                _allClients.push({
                    id: d.id,
                    role: 'prospect',
                    ...d.data()
                });
            });
        } catch(e) {
            console.warn("Could not load prospects for pipeline: ", e);
        }
    }

    const t = translations[currentLang];
    const stages = {
        prospect:      { label: 'Prospect',                                 cls: 'stage-prospect',      clients: [] },
        first_contact: { label: t.stage_contact || 'First Contact',         cls: 'stage-first_contact', clients: [] },
        prototyping:   { label: t.stage_proto || 'Prototyping',             cls: 'stage-prototyping',   clients: [] },
        development:   { label: t.stage_dev || 'Development',               cls: 'stage-development',   clients: [] },
        delivery:      { label: t.stage_delivery || 'Delivery & Pub',       cls: 'stage-delivery',      clients: [] },
        maintenance:   { label: t.stage_maint || 'Maintenance',             cls: 'stage-maintenance',   clients: [] },
    };

    _allClients.forEach(c => {
        if (c.role === 'prospect') {
            stages['prospect'].clients.push({ client: c, project: null });
            return;
        }

        if (c.projects && Array.isArray(c.projects) && c.projects.length > 0) {
            c.projects.forEach(p => {
                const stage = p.projectStage || 'first_contact';
                if (stages[stage]) {
                    stages[stage].clients.push({ client: c, project: p });
                } else {
                    stages['first_contact'].clients.push({ client: c, project: p });
                }
            });
        } else {
            const stage = c.projectStage || 'first_contact';
            if (stages[stage]) {
                stages[stage].clients.push({ client: c, project: null });
            } else {
                stages['first_contact'].clients.push({ client: c, project: null });
            }
        }
    });

    board.innerHTML = Object.values(stages).map(col => `
        <div class="pipeline-column ${col.cls}">
            <div class="pipeline-col-header">
                <div class="pipeline-col-title"><div class="pipeline-col-dot"></div><span>${esc(col.label)}</span></div>
                <span class="pipeline-col-count">${col.clients.length}</span>
            </div>
            <div class="pipeline-col-cards">
                ${col.clients.length === 0
                    ? '<div class="pipeline-col-empty">No projects here</div>'
                    : col.clients.map(item => {
                        const c = item.client;
                        const p = item.project;
                        const cardName = p ? p.name : (c.name || 'Unnamed');
                        const cardCompany = c.company || c.email || '';
                        return `
                        <div class="pipeline-card" data-partner-id="${c.id}" data-project-id="${p ? p.id : ''}">
                            <div class="pipeline-card-avatar">${esc(initials(cardName))}</div>
                            <div class="pipeline-card-body">
                                <div class="pipeline-card-name">${esc(cardName)}</div>
                                <div class="pipeline-card-company">${esc(cardCompany)}</div>
                            </div>
                        </div>`;
                    }).join('')
                }
            </div>
        </div>`).join('');

    // Click pipeline card → open detail
    board.querySelectorAll('.pipeline-card').forEach(card => {
        card.addEventListener('click', () => {
            const pid = card.dataset.partnerId;
            const projId = card.dataset.projectId;
            const partner = _allClients.find(c => c.id === pid);
            if (partner) showClientDetail(partner.id, partner, projId);
        });
    });

    logger.log('Pipeline loaded:', Object.fromEntries(
        Object.entries(stages).map(([k, v]) => [k, v.clients.length])
    ));
}

async function loadClients() {
    const clientsList = document.getElementById('clients-list');
    const toolbar     = document.getElementById('crm-toolbar');
    clientsList.innerHTML = '<div class="loader-container"><div class="premium-loader"></div></div>';
    if (toolbar) toolbar.style.display = 'none';
    const t = translations[currentLang];

    try {
        const q = query(collection(db, 'members'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        // Filter out admins and self, keep only real partners
        _allClients = [];
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (
                data.email === SUPER_ADMIN_EMAIL ||
                data.role === 'admin' ||
                data.role === 'root'
            ) return;
            _allClients.push({ id: docSnap.id, ...data });
        });
        
        try {
            const prospectsSnap = await getDocs(collection(db, 'prospects'));
            prospectsSnap.forEach(d => {
                _allClients.push({
                    id: d.id,
                    role: 'prospect', // mark as prospect specifically
                    ...d.data()
                });
            });
        } catch(e) {
            console.warn("Could not load prospects for grid: ", e);
        }

        logger.log(`Loaded ${_allClients.length} partners and prospects from Firestore.`);

        // Show toolbar once data is ready
        if (toolbar) toolbar.style.display = 'flex';

        // Initial render
        renderClientGrid(_allClients, t);

        // ── Search handler ────────────────────────────────────────────────
        const searchInput = document.getElementById('crm-search');
        if (searchInput) {
            // Remove any stale listener by replacing the node
            const fresh = searchInput.cloneNode(true);
            searchInput.parentNode.replaceChild(fresh, searchInput);
            fresh.addEventListener('input', () => {
                const term = fresh.value.trim().toLowerCase();
                const filtered = term
                    ? _allClients.filter(c =>
                        (c.name    || '').toLowerCase().includes(term) ||
                        (c.company || '').toLowerCase().includes(term) ||
                        (c.email   || '').toLowerCase().includes(term)
                    )
                    : _allClients;
                renderClientGrid(filtered, t);
            });
        }

        // ── Sort handler ──────────────────────────────────────────────────
        const sortBtn = document.getElementById('crm-sort-btn');
        if (sortBtn) {
            const freshBtn = sortBtn.cloneNode(true);
            sortBtn.parentNode.replaceChild(freshBtn, sortBtn);
            freshBtn.addEventListener('click', () => {
                _sortAZ = !_sortAZ;
                const label = document.getElementById('crm-sort-label');
                if (label) label.textContent = _sortAZ ? 'A → Z' : 'Newest';
                freshBtn.classList.toggle('is-active', !_sortAZ);
                const term = document.getElementById('crm-search')?.value.trim().toLowerCase() || '';
                const filtered = term
                    ? _allClients.filter(c =>
                        (c.name || '').toLowerCase().includes(term) ||
                        (c.company || '').toLowerCase().includes(term) ||
                        (c.email   || '').toLowerCase().includes(term)
                    )
                    : _allClients;
                renderClientGrid(filtered, t);
            });
        }
        // ── Filter pills ──────────────────────────────────────────────────
        const pillContainer = document.getElementById('crm-filter-pills');
        if (pillContainer) {
            const freshPills = pillContainer.cloneNode(true);
            pillContainer.parentNode.replaceChild(freshPills, pillContainer);
            freshPills.querySelectorAll('.crm-pill').forEach(pill => {
                pill.addEventListener('click', () => {
                    freshPills.querySelectorAll('.crm-pill').forEach(p => p.classList.remove('active'));
                    pill.classList.add('active');
                    _activeFilter = pill.dataset.filter || 'all';
                    const term = document.getElementById('crm-search')?.value.trim().toLowerCase() || '';
                    const base = term
                        ? _allClients.filter(c =>
                            (c.name    || '').toLowerCase().includes(term) ||
                            (c.company || '').toLowerCase().includes(term) ||
                            (c.email   || '').toLowerCase().includes(term)
                        )
                        : _allClients;
                    renderClientGrid(base, t);
                });
            });
        }

    } catch (error) {
        logger.error("Error loading clients:", error);
        clientsList.innerHTML = `<p class="color-text-error">${t.error_clients}<br><small style="font-size: 0.8em; opacity: 0.8;">${error.message}</small></p>`;
    }
}

function renderClientGrid(clients, t) {
    const clientsList = document.getElementById('clients-list');
    const countEl     = document.getElementById('crm-results-count');
    if (!clientsList) return;

    // Apply active pill filter
    let filtered = clients;
    if (_activeFilter !== 'all') {
        filtered = clients.filter(c => getPartnerStage(c) === _activeFilter);
    }

    // Apply current sort
    const sorted = [...filtered].sort((a, b) => {
        if (_sortAZ) return (a.name || '').localeCompare(b.name || '');
        const tsA = a.createdAt?.seconds ?? 0;
        const tsB = b.createdAt?.seconds ?? 0;
        return tsB - tsA;
    });

    if (countEl) countEl.textContent = `${sorted.length} partner${sorted.length !== 1 ? 's' : ''}`;

    if (sorted.length === 0) {
        clientsList.innerHTML = `<p style="grid-column:1/-1;text-align:center;opacity:0.4;padding:3rem 0;">
            No partners found${_activeFilter !== 'all' ? ' in this stage' : ''}.
        </p>`;
        return;
    }

    clientsList.innerHTML = '';
    sorted.forEach(data => {
        const isSuspended = data.isDeactivated === true;
        const stage       = getPartnerStage(data);
        const stageLabels = { prospect: 'Prospect', onboarding: 'Onboarding', active: 'Active', delivered: 'Delivered' };

        const card = document.createElement('div');
        card.className = `client-card${isSuspended ? ' is-suspended' : ''}`;
        card.setAttribute('data-stage', stage);
        card.innerHTML = `
            <div class="client-card-header">
                <div class="client-card-avatar">${initials(data.name)}</div>
                <span class="client-card-stage-badge stage-badge-${stage}">${stageLabels[stage]}</span>
            </div>
            <div class="client-name">${data.name || t.unnamed_client}</div>
            <div class="client-company">${data.company || t.no_company}</div>
            ${data.projects && data.projects.length > 0 ? 
                `<div class="client-projects" style="font-size:0.75rem; color:var(--color-text-secondary); margin-top:8px; margin-bottom:8px;">
                    ${data.projects.map(p => `<span style="background:var(--glass-bg); padding:2px 6px; border-radius:4px; margin-right:4px; border:1px solid var(--glass-border); display:inline-block; margin-bottom:4px;">${p.name || 'Unnamed Project'}</span>`).join('')}
                </div>` 
                : ''}
            <div class="client-meta" style="margin-top:auto; padding-top:12px;">
                <span class="client-meta-email" title="${data.email}">${data.email}</span>
                <span class="client-joined">${timeAgo(data.createdAt)}</span>
            </div>
            ${isSuspended ? '<div class="suspended-badge">Suspended</div>' : ''}
        `;
        card.addEventListener('click', () => showClientDetail(data.id, data));
        clientsList.appendChild(card);
    });
}

async function loadLicenses() {
    const licensesList = document.getElementById('licenses-list');
    const summary = document.getElementById('licenses-summary');
    licensesList.innerHTML = '<tr><td colspan="6" style="text-align: center;"><div class="premium-loader"></div></td></tr>';
    const t = translations[currentLang];

    try {
        // A license exists because a member has a subscription. The old pool is
        // deliberately not listed: unassigned codes are no longer inventory.
        const membersSnap = await getDocs(collection(db, 'members'));
        const licenses = membersSnap.docs.flatMap(memberDoc => {
            const member = memberDoc.data();

            // Keep old assigned codes visible until their first subscription
            // renewal migrates them to the new structure.
            const sub = member.subscription || (member.licenseCode ? {
                planType: 'legacy',
                planLabel: 'Legacy license',
                billingCycle: '—',
                licenseCode: member.licenseCode,
                status: 'active',
                source: 'legacy',
                nextBillingDate: null
            } : null);
            if (!sub?.licenseCode) return [];

            return [{
                userId: memberDoc.id,
                userName: member.name || member.company || '—',
                userEmail: member.email || '—',
                memberRecord: { id: memberDoc.id, ...member },
                ...sub,
                status: subscriptionStatus(sub)
            }];
        });

        const statusOrder = { active: 0, pending_payment: 1, suspended: 2, canceled: 3, cancelled: 3 };
        licenses.sort((a, b) => {
            const byStatus = (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9);
            return byStatus || a.userName.localeCompare(b.userName);
        });

        const counts = licenses.reduce((acc, item) => {
            const status = item.status || 'active';
            acc.total += 1;
            acc.active += status === 'active' ? 1 : 0;
            acc.attention += ['pending_payment', 'suspended'].includes(status) ? 1 : 0;
            acc.automatic += item.source === 'stripe' ? 1 : 0;
            return acc;
        }, { total: 0, active: 0, attention: 0, automatic: 0 });

        const copy = {
            en: { total: 'Assigned', active: 'Active', attention: 'Needs attention', automatic: 'Automatic', empty: 'No subscription licenses have been assigned yet.', manual: 'Manual', stripe: 'Web / Stripe', legacy: 'Legacy', monthly: 'Monthly', annual: 'Annual', pending_payment: 'Payment pending', suspended: 'Suspended', canceled: 'Canceled', cancelled: 'Canceled' },
            es: { total: 'Asignadas', active: 'Activas', attention: 'Requieren atención', automatic: 'Automáticas', empty: 'Aún no hay licencias asignadas por suscripción.', manual: 'Manual', stripe: 'Web / Stripe', legacy: 'Anterior', monthly: 'Mensual', annual: 'Anual', pending_payment: 'Pago pendiente', suspended: 'Suspendida', canceled: 'Cancelada', cancelled: 'Cancelada' },
            pt: { total: 'Atribuídas', active: 'Ativas', attention: 'Requer atenção', automatic: 'Automáticas', empty: 'Ainda não existem licenças atribuídas por subscrição.', manual: 'Manual', stripe: 'Web / Stripe', legacy: 'Anterior', monthly: 'Mensal', annual: 'Anual', pending_payment: 'Pagamento pendente', suspended: 'Suspensa', canceled: 'Cancelada', cancelled: 'Cancelada' }
        }[currentLang] || null;

        if (summary) {
            summary.innerHTML = [
                [counts.total, copy.total, 'license-metric-blue'],
                [counts.active, copy.active, 'license-metric-green'],
                [counts.attention, copy.attention, 'license-metric-gold'],
                [counts.automatic, copy.automatic, 'license-metric-purple']
            ].map(([value, label, cls]) => `
                <div class="license-metric ${cls}">
                    <strong>${value}</strong><span>${label}</span>
                </div>`).join('');
        }

        if (licenses.length === 0) {
            licensesList.innerHTML = `<tr><td colspan="6" class="license-empty">${copy.empty}</td></tr>`;
            return;
        }

        licensesList.innerHTML = '';
        licenses.forEach((data) => {
            const status = data.status || 'active';
            const displayStatus = copy[status] || (status === 'active' ? copy.active : status.replaceAll('_', ' '));
            const source = data.source === 'stripe' ? copy.stripe : data.source === 'legacy' ? copy.legacy : copy.manual;
            const sourceClass = data.source === 'stripe' ? 'license-source-auto' : 'license-source-manual';
            const cycle = data.contractPeriodCode || copy[data.billingCycle] || data.billingCycle || '—';
            const renewal = formatAdminDate(data.nextBillingDate);
            const tr = document.createElement('tr');
            tr.dataset.userId = data.userId;
            tr.className = 'license-row';
            tr.innerHTML = `
                <td class="license-code-cell">${esc(data.licenseCode)}</td>
                <td><strong>${esc(data.userName)}</strong><small>${esc(data.userEmail)}</small></td>
                <td><strong>${esc(data.planLabel || data.planType || '—')}</strong><small>${esc(cycle)}</small></td>
                <td><span class="license-source ${sourceClass}">${esc(source)}</span></td>
                <td><span class="status-badge status-${esc(status)}">${esc(displayStatus)}</span></td>
                <td>${esc(renewal)}</td>
            `;
            licensesList.appendChild(tr);
        });

        licensesList.querySelectorAll('.license-row').forEach(row => {
            row.addEventListener('click', () => {
                const member = _allClients.find(client => client.id === row.dataset.userId)
                    || licenses.find(item => item.userId === row.dataset.userId)?.memberRecord;
                if (member) showClientDetail(member.id, member);
            });
        });
    } catch (error) {
        console.error("Error loading licenses:", error);
        licensesList.innerHTML = `<tr><td colspan="6" class="color-text-error">${t.error_licenses}<br><small style="font-size: 0.8em; opacity: 0.8;">${esc(error.message)}</small></td></tr>`;
    }
}

async function showClientDetail(userId, memberData, selectedProjectId = null) {
    const detailOverlay = document.getElementById('client-detail-overlay');
    const detailContent = document.getElementById('detail-content');
    detailContent.innerHTML = '<div class="premium-loader"></div>';
    detailOverlay.style.display = 'flex';

    // Stop any Co-Pilot draft listener from a previously opened client
    if (_draftUnsub) { _draftUnsub(); _draftUnsub = null; }

    try {
        if (!selectedProjectId && memberData.projects && memberData.projects.length > 0) {
            selectedProjectId = memberData.projects[0].id;
        }

        // Fetch onboarding submission
        const q = query(collection(db, 'onboarding_submissions'), where('userId', '==', userId));
        const submissionSnap = await getDocs(q);
        let onboardingData = null;
        let submissionTimestamp = null;
        let submissionVersion = 1;

        if (!submissionSnap.empty) {
            let subDoc = null;
            if (selectedProjectId) {
                const exactMatch = submissionSnap.docs.find(d => d.data().projectId === selectedProjectId);
                if (exactMatch) {
                    subDoc = exactMatch.data();
                } else if (selectedProjectId === 'project-1' || selectedProjectId === 'legacy') {
                    const legacyMatch = submissionSnap.docs.find(d => !d.data().projectId);
                    if (legacyMatch) subDoc = legacyMatch.data();
                }
            } else {
                // Should not happen since we default to the first project, but fallback safely
                subDoc = submissionSnap.docs[0].data();
            }

            if (subDoc) {
                onboardingData      = subDoc.formData;
                submissionTimestamp = subDoc.submittedAt || subDoc.createdAt || null;
                submissionVersion   = Number(subDoc.formVersion) || 1;
            }
        }

        logger.log(`Loaded detail for partner: ${memberData.name} (${userId})`);

        renderDetail(memberData, onboardingData, userId, submissionTimestamp, selectedProjectId, submissionVersion);
    } catch (error) {
        logger.error("Error showing client detail:", error);
        detailContent.innerHTML = `<p class="color-text-error">Error loading client detail.<br><small style="font-size: 0.8em; opacity: 0.8;">${error.message}</small></p>`;
    }
}

// ── ONBOARDING V2 (λ Immersion Protocol) ─────────────────────────────────────
// Labels for the v2 tier-adaptive onboarding. v1 submissions keep the legacy
// step-by-step renderer below; v2 submissions render module-based sections.
const V2_LABELS = {
    en: {
        v2_badge: 'Onboarding v2 — λ Immersion Protocol', files_short: 'files',
        m1: 'λ 01 · Organization & Contacts', m2: 'λ 01 · Operational Telemetry', m3: 'λ 01 · Team & Ergonomics',
        m4: 'λ 02 · Technical Inventory', m5: 'λ 02 · Asset Ingestion', m6: 'λ 03–04 · Problem & Measurable Objective',
        m7: 'λ 07 · Security & RBAC', m8: 'λ 06 · Functional Scope & Integrations', m9: 'λ 06 · Identity & Design',
        m10: 'λ 08–10 · Operations & Launch', m11: 'Consent',
        full_name: 'Full Name', role: 'Role', email: 'Email', country: 'Country', phone: 'Phone / WhatsApp',
        company: 'Company', website: 'Current Website', sector: 'Sector', org_size: 'Organization Size',
        description: 'Business Description', project_lead: 'Project Lead', tech_contact: 'Technical Contact',
        tech_email: 'Technical Contact Email',
        journey: 'Day-to-day process', bottleneck: 'Main bottleneck', tools: 'Tools in use',
        status_quo: 'Cost of changing nothing (2 years)',
        team_size: 'Daily users', digital_level: 'Digital literacy', devices: 'Primary device',
        website_status: 'Website status', assets: 'Existing assets', access: 'Access checklist',
        acc_domain: 'Domain / DNS', acc_hosting: 'Hosting', acc_google: 'Google Business', acc_meta: 'Meta Business', acc_email: 'Corporate email',
        legacy: 'Legacy data', legacy_records: 'Approx. records', legacy_source: 'Data source',
        files: 'Uploaded files', no_files: 'No files uploaded', pending: 'Pending materials',
        vision: 'Vision', mission: 'Mission', problem: 'Core problem', goal: 'Objective',
        kpi: 'Success metric (KPI)', ideal_customer: 'Ideal customer', audience: 'Target audience',
        rbac: 'Access levels', admins: 'Administrators', editors: 'Editors', viewers: 'Read-only',
        sensitive: 'Sensitive data', restricted: 'Hidden from standard employees', past_problems: 'Past incidents',
        features: 'Required functions', web_sections: 'Website sections', app_users: 'Internal app users',
        integrations: 'Integrations', integration_desc: 'Integration workflow / active accounts',
        brand_feeling: 'Design should transmit', design_refs: 'Reference sites', design_avoids: 'Avoid in design',
        languages: 'Site languages', color_scheme: 'Color scheme',
        ops_updates: 'Content updated by', ops_frequency: 'Change frequency', seo: 'SEO priority',
        deadline: 'Target launch date', launch_event: 'Tied to event', tester: 'Acceptance tester / training',
        privacy: 'Privacy consent', files_consent: 'Files processing consent', marketing: 'Marketing consent',
        accepted: 'Accepted', rejected: 'Not granted', none: '—',
        copilot_title: 'Co-Pilot — Live Onboarding Session',
        copilot_waiting: 'Waiting for the client to start the onboarding…',
        copilot_module: 'Current module', copilot_updated: 'Last update', copilot_files: 'Files uploaded',
        suggest_proto: 'Onboarding completed — this project is still in First Contact.',
        suggest_btn: 'Move to Prototyping'
    },
    es: {
        v2_badge: 'Onboarding v2 — Protocolo λ de Inmersión', files_short: 'archivos',
        m1: 'λ 01 · Organización y Contactos', m2: 'λ 01 · Telemetría Operativa', m3: 'λ 01 · Equipo y Ergonomía',
        m4: 'λ 02 · Inventario Técnico', m5: 'λ 02 · Ingesta de Activos', m6: 'λ 03–04 · Problema y Objetivo Medible',
        m7: 'λ 07 · Seguridad y RBAC', m8: 'λ 06 · Alcance Funcional e Integraciones', m9: 'λ 06 · Identidad y Diseño',
        m10: 'λ 08–10 · Operación y Lanzamiento', m11: 'Consentimiento',
        full_name: 'Nombre Completo', role: 'Rol', email: 'Email', country: 'País', phone: 'Teléfono / WhatsApp',
        company: 'Empresa', website: 'Sitio Web Actual', sector: 'Sector', org_size: 'Tamaño de la Organización',
        description: 'Descripción del Negocio', project_lead: 'Líder del Proyecto', tech_contact: 'Contacto Técnico',
        tech_email: 'Email del Contacto Técnico',
        journey: 'Proceso del día a día', bottleneck: 'Cuello de botella principal', tools: 'Herramientas en uso',
        status_quo: 'Coste de no cambiar nada (2 años)',
        team_size: 'Usuarios diarios', digital_level: 'Alfabetización digital', devices: 'Dispositivo principal',
        website_status: 'Estado del sitio web', assets: 'Activos existentes', access: 'Checklist de accesos',
        acc_domain: 'Dominio / DNS', acc_hosting: 'Hosting', acc_google: 'Google Business', acc_meta: 'Meta Business', acc_email: 'Email corporativo',
        legacy: 'Datos legados', legacy_records: 'Registros aprox.', legacy_source: 'Origen de los datos',
        files: 'Archivos subidos', no_files: 'Sin archivos subidos', pending: 'Materiales pendientes',
        vision: 'Visión', mission: 'Misión', problem: 'Problema central', goal: 'Objetivo',
        kpi: 'Métrica de éxito (KPI)', ideal_customer: 'Cliente ideal', audience: 'Audiencia objetivo',
        rbac: 'Niveles de acceso', admins: 'Administradores', editors: 'Editores', viewers: 'Solo lectura',
        sensitive: 'Datos sensibles', restricted: 'Oculto a empleados estándar', past_problems: 'Incidentes pasados',
        features: 'Funciones requeridas', web_sections: 'Secciones del sitio', app_users: 'Usuarios de la app interna',
        integrations: 'Integraciones', integration_desc: 'Flujo de integraciones / cuentas activas',
        brand_feeling: 'El diseño debe transmitir', design_refs: 'Sitios de referencia', design_avoids: 'Evitar en el diseño',
        languages: 'Idiomas del sitio', color_scheme: 'Esquema de color',
        ops_updates: 'Contenido actualizado por', ops_frequency: 'Frecuencia de cambios', seo: 'Prioridad SEO',
        deadline: 'Fecha objetivo de lanzamiento', launch_event: 'Ligado a evento', tester: 'Tester de aceptación / formación',
        privacy: 'Consentimiento de privacidad', files_consent: 'Consentimiento de archivos', marketing: 'Consentimiento de marketing',
        accepted: 'Aceptado', rejected: 'No otorgado', none: '—',
        copilot_title: 'Co-Piloto — Sesión de Onboarding en Vivo',
        copilot_waiting: 'Esperando a que el cliente comience el onboarding…',
        copilot_module: 'Módulo actual', copilot_updated: 'Última actualización', copilot_files: 'Archivos subidos',
        suggest_proto: 'Onboarding completado — este proyecto sigue en Primer Contacto.',
        suggest_btn: 'Mover a Prototipado'
    },
    pt: {
        v2_badge: 'Onboarding v2 — Protocolo λ de Imersão', files_short: 'ficheiros',
        m1: 'λ 01 · Organização e Contactos', m2: 'λ 01 · Telemetria Operacional', m3: 'λ 01 · Equipa e Ergonomia',
        m4: 'λ 02 · Inventário Técnico', m5: 'λ 02 · Ingestão de Ativos', m6: 'λ 03–04 · Problema e Objetivo Mensurável',
        m7: 'λ 07 · Segurança e RBAC', m8: 'λ 06 · Âmbito Funcional e Integrações', m9: 'λ 06 · Identidade e Design',
        m10: 'λ 08–10 · Operação e Lançamento', m11: 'Consentimento',
        full_name: 'Nome Completo', role: 'Função', email: 'Email', country: 'País', phone: 'Telefone / WhatsApp',
        company: 'Empresa', website: 'Website Atual', sector: 'Setor', org_size: 'Dimensão da Organização',
        description: 'Descrição do Negócio', project_lead: 'Líder do Projeto', tech_contact: 'Contacto Técnico',
        tech_email: 'Email do Contacto Técnico',
        journey: 'Processo do dia a dia', bottleneck: 'Principal estrangulamento', tools: 'Ferramentas em uso',
        status_quo: 'Custo de não mudar nada (2 anos)',
        team_size: 'Utilizadores diários', digital_level: 'Literacia digital', devices: 'Dispositivo principal',
        website_status: 'Estado do website', assets: 'Ativos existentes', access: 'Checklist de acessos',
        acc_domain: 'Domínio / DNS', acc_hosting: 'Alojamento', acc_google: 'Google Business', acc_meta: 'Meta Business', acc_email: 'Email corporativo',
        legacy: 'Dados legados', legacy_records: 'Registos aprox.', legacy_source: 'Origem dos dados',
        files: 'Ficheiros carregados', no_files: 'Sem ficheiros carregados', pending: 'Materiais pendentes',
        vision: 'Visão', mission: 'Missão', problem: 'Problema central', goal: 'Objetivo',
        kpi: 'Métrica de sucesso (KPI)', ideal_customer: 'Cliente ideal', audience: 'Público-alvo',
        rbac: 'Níveis de acesso', admins: 'Administradores', editors: 'Editores', viewers: 'Apenas leitura',
        sensitive: 'Dados sensíveis', restricted: 'Oculto a colaboradores padrão', past_problems: 'Incidentes passados',
        features: 'Funções necessárias', web_sections: 'Secções do site', app_users: 'Utilizadores da app interna',
        integrations: 'Integrações', integration_desc: 'Fluxo de integrações / contas ativas',
        brand_feeling: 'O design deve transmitir', design_refs: 'Sites de referência', design_avoids: 'Evitar no design',
        languages: 'Idiomas do site', color_scheme: 'Esquema de cores',
        ops_updates: 'Conteúdo atualizado por', ops_frequency: 'Frequência de alterações', seo: 'Prioridade SEO',
        deadline: 'Data-alvo de lançamento', launch_event: 'Ligado a evento', tester: 'Tester de aceitação / formação',
        privacy: 'Consentimento de privacidade', files_consent: 'Consentimento de ficheiros', marketing: 'Consentimento de marketing',
        accepted: 'Aceite', rejected: 'Não concedido', none: '—',
        copilot_title: 'Co-Piloto — Sessão de Onboarding ao Vivo',
        copilot_waiting: 'A aguardar que o cliente inicie o onboarding…',
        copilot_module: 'Módulo atual', copilot_updated: 'Última atualização', copilot_files: 'Ficheiros carregados',
        suggest_proto: 'Onboarding concluído — este projeto ainda está em Primeiro Contacto.',
        suggest_btn: 'Mover para Prototipagem'
    }
};

/** Render a v2 (λ Immersion Protocol) submission as module-based sections. */
function renderOnboardingV2(ob) {
    const L = V2_LABELS[currentLang] || V2_LABELS.en;
    const hv = (v) => (v === undefined || v === null || String(v).trim() === '') ? '-' : esc(String(v)).replace(/_/g, ' ');
    const tags = (items) => (!Array.isArray(items) || items.length === 0)
        ? L.none
        : `<div class="tag-list">${items.map(i => `<span class="tag">${esc(String(i)).replace(/_/g, ' ')}</span>`).join('')}</div>`;
    const item = (label, value) => `<div class="info-item"><label>${label}</label><span>${hv(value)}</span></div>`;
    const block = (label, value) => `<div class="info-item" style="margin-bottom: 1rem;"><label>${label}</label><p>${hv(value)}</p></div>`;
    const tagItem = (label, items) => `<div class="info-item" style="margin-bottom: 1rem;"><label>${label}</label>${tags(items)}</div>`;
    const bool = (v) => v === true ? L.accepted : L.rejected;
    const has = (...keys) => keys.some(k => {
        const v = ob[k];
        return Array.isArray(v) ? v.length > 0 : (v !== undefined && v !== null && String(v).trim() !== '');
    });
    const sec = (title, inner, show = true) => show ? `<div class="detail-section"><h3>${title}</h3>${inner}</div>` : '';

    const files = Array.isArray(ob.uploaded_files) ? ob.uploaded_files : [];
    const filesHTML = files.length
        ? `<div class="tag-list">${files.map(f => {
            const label = `${esc(f.name || 'file')}${f.category ? ` (${esc(f.category)})` : ''}`;
            return f.url
                ? `<a class="tag" href="${esc(f.url)}" target="_blank" rel="noopener" style="text-decoration: none;">${label}</a>`
                : `<span class="tag">${label}</span>`;
        }).join('')}</div>`
        : `<span>${L.no_files}</span>`;

    return `
        <div style="padding: 0.75rem 1rem; background: rgba(41, 151, 255, 0.06); border: 1px solid rgba(41, 151, 255, 0.2); border-radius: var(--radius-sm); margin-bottom: 1.5rem;">
            <span style="font-size: 0.8rem; letter-spacing: 0.05em; text-transform: uppercase; color: var(--color-accent);">
                ${L.v2_badge}${files.length ? ` · ${files.length} ${L.files_short}` : ''}
            </span>
        </div>

        ${sec(L.m1, `
            <div class="info-grid" style="margin-bottom: 1rem;">
                ${item(L.full_name, ob.contact_name)}
                ${item(L.role, ob.contact_role)}
                ${item(L.email, ob.contact_email)}
                ${item(L.country, ob.contact_country)}
                ${item(L.phone, ob.contact_phone)}
                ${item(L.company, ob.company_name)}
                ${item(L.website, ob.company_website)}
                ${item(L.sector, ob.company_sector)}
                ${item(L.org_size, ob.company_size)}
                ${item(L.project_lead, ob.project_lead_name)}
                ${item(L.tech_contact, ob.tech_contact_name)}
                ${item(L.tech_email, ob.tech_contact_email)}
            </div>
            ${block(L.description, ob.company_description)}
        `)}

        ${sec(L.m2, `
            ${block(L.journey, ob.process_journey)}
            ${block(L.bottleneck, ob.process_bottleneck)}
            ${tagItem(L.tools, ob.process_tools)}
            ${ob.process_tools_other ? block('+', ob.process_tools_other) : ''}
            ${block(L.status_quo, ob.status_quo_risk)}
        `, has('process_journey', 'process_bottleneck', 'process_tools', 'status_quo_risk'))}

        ${sec(L.m3, `
            <div class="info-grid">
                ${item(L.team_size, ob.team_size_daily)}
                ${item(L.digital_level, ob.team_digital_level)}
                ${item(L.devices, ob.team_devices)}
            </div>
        `, has('team_size_daily', 'team_digital_level', 'team_devices'))}

        ${sec(L.m4, `
            <div class="info-grid" style="margin-bottom: 1rem;">
                ${item(L.website_status, ob.has_website)}
                ${item(L.legacy, ob.legacy_data)}
                ${item(L.legacy_records, ob.legacy_records)}
                ${item(L.legacy_source, ob.legacy_source)}
            </div>
            ${tagItem(L.assets, ob.current_assets)}
            <div class="info-item" style="margin-bottom: 1rem;"><label>${L.access}</label>
                <div class="info-grid" style="margin-top: 0.5rem;">
                    ${item(L.acc_domain, ob.access_domain)}
                    ${item(L.acc_hosting, ob.access_hosting)}
                    ${item(L.acc_google, ob.access_google_business)}
                    ${item(L.acc_meta, ob.access_meta)}
                    ${item(L.acc_email, ob.access_corporate_email)}
                </div>
            </div>
        `, has('has_website', 'current_assets', 'access_domain', 'legacy_data'))}

        ${sec(L.m5, `
            <div class="info-item" style="margin-bottom: 1rem;"><label>${L.files}</label>${filesHTML}</div>
            ${tagItem(L.pending, ob.pending_assets)}
        `, files.length > 0 || has('pending_assets'))}

        ${sec(L.m6, `
            ${block(L.vision, ob.company_vision)}
            ${block(L.mission, ob.company_mission)}
            ${block(L.problem, ob.problem_description)}
            ${block(L.goal, ob.goal_description)}
            <div class="info-item" style="margin-bottom: 1rem;"><label>${L.kpi}</label><span style="color: var(--color-accent); font-weight: bold;">${hv(ob.kpi_metric)}</span></div>
            ${block(L.ideal_customer, ob.ideal_customer)}
            ${tagItem(L.audience, ob.target_audience)}
        `, has('problem_description', 'goal_description', 'kpi_metric', 'ideal_customer'))}

        ${sec(L.m7, `
            <div class="info-grid" style="margin-bottom: 1rem;">
                ${item(L.admins, ob.rbac_admins)}
                ${item(L.editors, ob.rbac_editors)}
                ${item(L.viewers, ob.rbac_viewers)}
            </div>
            ${tagItem(L.sensitive, ob.sensitive_data)}
            ${block(L.restricted, ob.restricted_info)}
            ${tagItem(L.past_problems, ob.past_problems)}
        `, has('rbac_admins', 'rbac_editors', 'rbac_viewers', 'sensitive_data', 'past_problems'))}

        ${sec(L.m8, `
            ${tagItem(L.features, ob.features)}
            ${ob.feature_other ? block('+', ob.feature_other) : ''}
            ${tagItem(L.web_sections, ob.web_sections)}
            ${tagItem(L.app_users, ob.app_users)}
            ${tagItem(L.integrations, ob.integrations)}
            ${ob.integration_other ? block('+', ob.integration_other) : ''}
            ${block(L.integration_desc, ob.integration_desc)}
        `, has('features', 'integrations', 'web_sections', 'app_users'))}

        ${sec(L.m9, `
            ${tagItem(L.brand_feeling, ob.brand_feeling)}
            ${ob.brand_feeling_other ? block('+', ob.brand_feeling_other) : ''}
            ${block(L.design_refs, ob.design_refs)}
            ${block(L.design_avoids, ob.design_avoids)}
            ${tagItem(L.languages, ob.site_languages)}
            <div class="info-grid">${item(L.color_scheme, ob.color_scheme)}</div>
        `, has('brand_feeling', 'design_refs', 'color_scheme'))}

        ${sec(L.m10, `
            <div class="info-grid">
                ${item(L.ops_updates, ob.ops_updates)}
                ${item(L.ops_frequency, ob.ops_frequency)}
                ${item(L.seo, ob.seo_priority)}
                ${item(L.deadline, ob.has_deadline === 'yes' ? ob.deadline_date : (ob.has_deadline || '-'))}
                ${item(L.launch_event, ob.launch_event)}
                ${item(L.tester, ob.acceptance_tester)}
            </div>
        `)}

        ${sec(L.m11, `
            <div class="info-grid">
                ${item(L.privacy, bool(ob.privacy_consent))}
                ${item(L.files_consent, bool(ob.files_consent))}
                ${item(L.marketing, bool(ob.marketing_consent))}
            </div>
        `)}
    `;
}

/** Co-Pilot: live view of the client's onboarding draft while they fill it. */
function watchOnboardingDraft(userId) {
    const container = document.getElementById('copilot-draft-container');
    if (!container) return;
    if (_draftUnsub) { _draftUnsub(); _draftUnsub = null; }

    const L = V2_LABELS[currentLang] || V2_LABELS.en;

    _draftUnsub = onSnapshot(doc(db, 'onboarding_drafts', userId), (snap) => {
        if (!snap.exists()) {
            container.innerHTML = `<p class="timeline-empty">${L.copilot_waiting}</p>`;
            return;
        }
        const d = snap.data();
        const data = d.data || {};
        const answered = Object.entries(data).filter(([, v]) =>
            Array.isArray(v) ? v.length > 0 : (v !== '' && v !== null && v !== undefined && v !== false));
        const files = Array.isArray(d.uploadedFiles) ? d.uploadedFiles : [];

        const rows = answered.map(([k, v]) => {
            const val = Array.isArray(v) ? v.join(', ') : (v === true ? '✓' : String(v));
            return `<div class="info-item"><label>${esc(k.replace(/_/g, ' '))}</label><span>${esc(val).replace(/_/g, ' ')}</span></div>`;
        }).join('');

        container.innerHTML = `
            <div style="display: flex; gap: 1.5rem; flex-wrap: wrap; margin-bottom: 1rem; font-size: 0.85rem; color: var(--color-text-secondary);">
                <span>${L.copilot_module}: <strong style="color: var(--color-platinum);">${Number(d.currentModule) || 1}${d.totalModules ? `/${d.totalModules}` : ''}</strong>${d.currentModuleLabel ? ` — ${esc(d.currentModuleLabel)}` : ''}</span>
                <span>${L.copilot_updated}: <strong style="color: var(--color-platinum);">${d.updatedAt ? timeAgo(d.updatedAt) : '—'}</strong></span>
                <span>${L.copilot_files}: <strong style="color: var(--color-platinum);">${files.length}</strong></span>
            </div>
            ${answered.length ? `<div class="info-grid">${rows}</div>` : `<p class="timeline-empty">${L.copilot_waiting}</p>`}
        `;
    }, (err) => {
        logger.error('Co-Pilot draft listener error:', err);
        container.innerHTML = `<p class="timeline-empty">${esc(err.message)}</p>`;
    });
}

function renderDetail(member, onboarding, userId, submissionTimestamp = null, selectedProjectId = null, formVersion = 1) {
    const detailContent = document.getElementById('detail-content');
    const t = translations[currentLang];
    const L = V2_LABELS[currentLang] || V2_LABELS.en;
    const isSuspended = member.isDeactivated === true;
    const existingContractUnit = member.subscription?.contractUnit
        || (member.subscription?.billingCycle === 'annual' ? 'years' : 'months');
    const periodLength = Number(String(member.subscription?.contractPeriodCode || '').match(/(\d)$/)?.[1]);
    const existingContractLength = Number(member.subscription?.contractLength) || periodLength || 1;
    const existingBusinessId = member.subscription?.businessId || member.businessId || '';
    
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

    // Format Firestore timestamps
    const fmtDate = (ts) => {
        if (!ts) return null;
        const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    };
    const fmtTime = (ts) => {
        if (!ts) return '';
        const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
        return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    };

    const registrationDate = fmtDate(member.createdAt);
    const registrationTime = fmtTime(member.createdAt);
    const onboardingDate   = fmtDate(submissionTimestamp);
    const onboardingTime   = fmtTime(submissionTimestamp);

    // ── Find Current Project ──
    const projects = member.projects || [];
    let currentProject = projects.find(p => p.id === selectedProjectId);
    
    // Fallback to legacy root fields if no project is found (e.g. before migration runs properly)
    if (!currentProject) {
        currentProject = {
            id: 'legacy',
            name: member.company || member.name || 'Proyecto 1',
            projectUrl: member.projectUrl,
            projectStage: member.projectStage,
            financials: member.financials,
            reports: member.reports,
            timeline: member.timeline,
            projectDescription: member.projectDescription
        };
    }

    // ── Prepare Financials & Reports data
    const fin = currentProject.financials || { projectCost: 0, maintenanceFee: 0, discount: '', status: 'prospect', currency: 'EUR' };
    const reports = currentProject.reports || [];
    const customTimeline = currentProject.timeline || [];
    
    const currencyMap = { 'EUR': '€', 'USD': '$', 'CRC': '₡' };
    const curSym = currencyMap[fin.currency] || '€';

    // ── Build suspend button label
    const suspendBtnLabel = isSuspended
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg> Reactivate Account`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg> Suspend Account`;

    detailContent.innerHTML = `
        ${isSuspended ? `
        <div class="suspended-detail-banner">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
            This account has been suspended.
        </div>` : ''}
        <div class="dashboard-header" style="margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: flex-start; padding-right: 80px;">
            <div>
                <h1 style="font-size: 3rem;">${member.name}${isSuspended ? '<span class="suspended-title-tag">Suspended</span>' : ''}</h1>
                <p class="color-text-secondary">${member.company || t.no_company}</p>
                <div style="margin-top:0.75rem; display:flex; gap:0.75rem; flex-wrap:wrap; align-items:center;">
                    <span class="onboarding-status ${member.onboardingCompleted ? 'status-done' : 'status-pending'}">
                        ${member.onboardingCompleted ? t.completed : t.pending}
                    </span>
                    <button id="btn-suspend-toggle" class="btn-suspend ${isSuspended ? 'is-active' : ''}">
                        ${suspendBtnLabel}
                    </button>
                </div>
            </div>
            <button id="btn-download-pdf" class="btn btn-outline" style="min-width: 140px; margin-top: 0.5rem;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 1rem; height: 1rem; margin-right: 0.5rem;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                ${t.download_pdf}
            </button>
        </div>

        ${member.onboardingCompleted && (currentProject.projectStage || 'first_contact') === 'first_contact' ? `
        <div id="stage-suggestion-banner" style="display: flex; align-items: center; gap: 1rem; justify-content: space-between; flex-wrap: wrap; background: rgba(41, 151, 255, 0.07); border: 1px solid rgba(41, 151, 255, 0.25); border-radius: var(--radius-md); padding: 1rem 1.5rem; margin-bottom: 2rem;">
            <span style="font-size: 0.9rem;">${L.suggest_proto}</span>
            <button id="btn-suggest-prototyping" class="btn btn-outline" style="min-width: 170px;">${L.suggest_btn}</button>
        </div>
        ` : ''}

        ${member.role === 'prospect' ? `
        <div class="detail-section" style="background: rgba(255, 171, 0, 0.05); padding: 1.5rem; border-radius: var(--radius-md); margin-bottom: 2rem; border: 1px solid rgba(255, 171, 0, 0.2);">
            <h3 style="color: #ffab00; margin-top:0; margin-bottom: 1rem;">Prospect Details</h3>
            <div style="margin-bottom: 1.5rem;">
                <label style="display:block; font-size:0.8rem; text-transform:uppercase; color:var(--color-text-secondary); margin-bottom:0.5rem;">Project Description</label>
                <p style="margin:0; line-height: 1.5;">${f(currentProject.projectDescription)}</p>
            </div>
            
            <div style="display: flex; gap: 1rem; align-items: flex-end;">
                <div style="flex: 1;">
                    <label style="display:block; font-size:0.8rem; text-transform:uppercase; color:var(--color-text-secondary); margin-bottom:0.5rem;">Existing License Code (if any)</label>
                    <input type="text" id="prospect-link-license" class="form-control" value="${member.licenseCode || ''}" placeholder="ELY-XXXX-XXXX-XXXX">
                </div>
                <button id="btn-link-prospect" class="btn btn-primary" style="background: #ffab00; color: #000; border-color: #ffab00;">Vincular con Cliente Registrado</button>
            </div>
            <p id="prospect-link-msg" style="margin-top: 0.5rem; font-size: 0.9rem; display: none; color: #00c875;">Linked successfully!</p>
        </div>
        ` : ''}

        ${projects.length > 1 ? `
        <div class="project-tabs" style="display: flex; gap: 1rem; margin-bottom: 1rem; border-bottom: 1px solid var(--glass-border);">
            ${projects.map((p, idx) => `
                <button class="project-tab-btn ${p.id === currentProject.id ? 'active' : ''}" data-project-id="${p.id}" style="background: none; border: none; padding: 0.5rem 1rem; color: ${p.id === currentProject.id ? 'var(--color-accent)' : 'var(--color-text-secondary)'}; cursor: pointer; border-bottom: ${p.id === currentProject.id ? '2px solid var(--color-accent)' : '2px solid transparent'};">
                    ${p.name || `Proyecto ${idx + 1}`}
                </button>
            `).join('')}
        </div>
        ` : ''}

        <div class="detail-section" style="background: rgba(41, 151, 255, 0.05); padding: 1.5rem; border-radius: var(--radius-md); margin-bottom: 2rem; border: 1px solid rgba(41, 151, 255, 0.2);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
                <h3 style="color: var(--color-accent); margin:0;">${t.project_link_title}</h3>
                <button id="btn-edit-project" class="report-btn" title="Edit"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
            </div>
            
            <div id="project-link-view">
                ${currentProject.projectUrl ? `<a href="${currentProject.projectUrl}" target="_blank" style="color:#fff; text-decoration:underline; font-size:1.1rem;">${currentProject.projectUrl}</a>` : `<span style="opacity:0.5;">-</span>`}
            </div>

            <div id="project-link-edit" style="display: none; gap: 1rem;">
                <input type="url" id="project-url-input" class="form-control" placeholder="https://..." value="${currentProject.projectUrl || ''}" style="flex: 1;">
                <button id="btn-save-project" class="btn btn-primary">${t.save_link}</button>
            </div>
            <p id="project-save-msg" style="margin-top: 0.5rem; font-size: 0.9rem; display: none;">${t.saved}</p>
        </div>

        <!-- ── Financials & Reports ── -->
        <div class="detail-section" style="margin-bottom: 2rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.5rem; margin-bottom: 1rem;">
                <h3 style="color: var(--color-accent); margin:0;">Financials & Billing</h3>
                <button id="btn-edit-fin" class="report-btn" title="Edit"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
            </div>
            
            <div id="fin-view-mode">
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap:1rem; background:rgba(0,0,0,0.15); padding:1rem; border-radius:var(--radius-sm); margin-bottom:2rem;">
                    <div><div style="font-size:0.75rem; color:var(--color-text-secondary); text-transform:uppercase;">${t.project_cost}</div><div style="font-size:1.2rem; font-weight:700;">${curSym}${fin.projectCost}</div></div>
                    <div><div style="font-size:0.75rem; color:var(--color-text-secondary); text-transform:uppercase;">${t.monthly_fee}</div><div style="font-size:1.2rem; font-weight:700;">${curSym}${fin.maintenanceFee}</div></div>
                    <div><div style="font-size:0.75rem; color:var(--color-text-secondary); text-transform:uppercase;">${t.discount}</div><div style="font-size:1.2rem; font-weight:700;">${fin.discount || '-'}</div></div>
                    <div><div style="font-size:0.75rem; color:var(--color-text-secondary); text-transform:uppercase;">Status</div><div style="font-size:1rem; font-weight:500; color:var(--color-accent);">${t['status_' + (fin.status === 'active_maintenance' ? 'active' : fin.status === 'free_tier' ? 'free' : fin.status === 'development' ? 'dev' : 'prospect')] || fin.status}</div></div>
                </div>
            </div>

            <div id="fin-edit-mode" style="display:none;">
                <div class="fin-card-grid">
                    <div class="fin-card">
                        <label>${t.project_cost}</label>
                        <input type="number" id="fin-cost" value="${fin.projectCost}">
                        <span class="currency-symbol">${curSym}</span>
                    </div>
                    <div class="fin-card">
                        <label>${t.monthly_fee}</label>
                        <input type="number" id="fin-fee" value="${fin.maintenanceFee}">
                        <span class="currency-symbol">${curSym}</span>
                    </div>
                    <div class="fin-card">
                        <label>${t.discount}</label>
                        <input type="text" id="fin-discount" value="${fin.discount || ''}" placeholder="e.g. 40%">
                    </div>
                </div>
                
                <div style="display: flex; gap: 1rem; margin-bottom: 2rem;">
                    <select id="fin-currency" class="form-control" style="max-width: 120px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border);">
                        <option value="EUR" ${(!fin.currency || fin.currency === 'EUR') ? 'selected' : ''}>EUR (€)</option>
                        <option value="USD" ${fin.currency === 'USD' ? 'selected' : ''}>USD ($)</option>
                        <option value="CRC" ${fin.currency === 'CRC' ? 'selected' : ''}>CRC (₡)</option>
                    </select>
                    <select id="fin-status" class="form-control" style="max-width: 200px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border);">
                        <option value="prospect" ${fin.status === 'prospect' ? 'selected' : ''}>${t.status_prospect}</option>
                        <option value="development" ${fin.status === 'development' ? 'selected' : ''}>${t.status_dev}</option>
                        <option value="free_tier" ${fin.status === 'free_tier' ? 'selected' : ''}>${t.status_free}</option>
                        <option value="active_maintenance" ${fin.status === 'active_maintenance' ? 'selected' : ''}>${t.status_active}</option>
                    </select>
                    <button id="btn-save-financials" class="btn btn-primary">${t.save_financials}</button>
                    <span id="fin-save-msg" style="display:none; align-self:center; font-size: 0.85rem; color: #00c875;">${t.saved}</span>
                </div>
            </div>

            <h3 style="color: var(--color-accent); border-bottom: 1px solid var(--glass-border); padding-bottom: 0.5rem; margin-bottom: 1rem;">${t.invoices_reports}</h3>
            
            <div class="report-list" id="report-list-container">
                ${reports.length === 0 ? `<p style="opacity: 0.5; font-size: 0.85rem;">${t.no_reports}</p>` : ''}
                ${reports.map((r, i) => `
                    <div class="report-item">
                        <div class="report-info">
                            <svg class="report-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                            <div>
                                <div class="report-title">${r.title}</div>
                                <div class="report-date">
                                    ${r.date} ${r.amount ? `&middot; <strong style="color:var(--color-accent)">${currencyMap[r.currency] || curSym}${r.amount}</strong>` : ''}
                                </div>
                            </div>
                        </div>
                        <div class="report-actions">
                            <a href="${r.url}" target="_blank" class="report-btn" title="View/Download">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                            </a>
                            <button class="report-btn btn-delete btn-delete-report" data-index="${i}" title="Delete">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="report-upload-card">
                <h4>${t.upload_new}</h4>
                <div class="report-inputs-grid">
                    <input type="text" id="report-title-input" placeholder="${t.title_placeholder}">
                    <input type="date" id="report-date-input" title="Date">
                    <div style="display:flex; gap:0.25rem;">
                        <input type="number" id="report-amount-input" placeholder="${t.amount_placeholder}" style="flex:1;">
                        <select id="report-currency-input" style="width: 60px; background: rgba(255, 255, 255, 0.03); border: 1px solid var(--glass-border); padding: 0.65rem 0.25rem; border-radius: var(--radius-sm); color: var(--color-text-primary); font-size: 0.85rem;">
                            <option value="EUR" ${(!fin.currency || fin.currency === 'EUR') ? 'selected' : ''}>€</option>
                            <option value="USD" ${fin.currency === 'USD' ? 'selected' : ''}>$</option>
                            <option value="CRC" ${fin.currency === 'CRC' ? 'selected' : ''}>₡</option>
                        </select>
                    </div>
                </div>
                <div class="report-upload-footer">
                    <div class="report-file-input-wrapper">
                        <input type="file" id="report-file-input" accept="application/pdf,image/*">
                        <div class="report-file-btn">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                            <span id="report-file-name-label">${t.choose_file}</span>
                        </div>
                    </div>
                    <button id="btn-add-report" class="btn btn-primary" style="padding: 0.65rem 1.5rem;">${t.upload_btn}</button>
                </div>
            </div>
        </div>
        </div>

        <!-- ── Project Pipeline & Revenue ── -->
        <div class="detail-section" style="margin-bottom: 2rem;">
            <div style="display:flex; justify-content:space-between; align-items:flex-end; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.5rem; margin-bottom: 1.5rem;">
                <h3 style="color: var(--color-accent); margin:0;">Activity & Notes (Pipeline & Revenue)</h3>
            </div>
            
            <!-- Pipeline / Stepper -->
            <div class="project-pipeline-container" style="margin-bottom: 2rem;">
                <label style="display:block; font-size:0.8rem; text-transform:uppercase; letter-spacing:0.05em; color:var(--color-text-secondary); margin-bottom:1rem; font-weight:600;">Current Stage (Click to update)</label>
                <div class="pipeline-stepper" id="pipeline-stepper-ui">
                    ${['prospect', 'first_contact', 'prototyping', 'development', 'delivery', 'maintenance'].map((stage, idx, arr) => {
                        const defaultStage = member.role === 'prospect' ? 'prospect' : 'first_contact';
                        const currentStageIdx = arr.indexOf(currentProject?.projectStage || member.projectStage || defaultStage);
                        const isCompleted = idx < currentStageIdx;
                        const isActive = idx === currentStageIdx;
                        let statusClass = isActive ? 'active' : (isCompleted ? 'completed' : 'pending');
                        const labels = {
                            prospect: 'Prospect',
                            first_contact: t.stage_contact || 'First Contact',
                            prototyping: t.stage_proto || 'Prototyping',
                            development: t.stage_dev || 'Development',
                            delivery: t.stage_delivery || 'Delivery',
                            maintenance: t.stage_maint || 'Maintenance'
                        };
                        return `
                        <div class="pipeline-step ${statusClass}" data-stage="${stage}">
                            <div class="step-circle">${isCompleted ? '✓' : (idx + 1)}</div>
                            <div class="step-label">${labels[stage]}</div>
                            ${idx < arr.length - 1 ? '<div class="step-line"></div>' : ''}
                        </div>`;
                    }).join('')}
                </div>
                <div id="pipeline-save-msg" style="display:none; color:#00c875; font-size:0.85rem; margin-top:0.5rem;">${t.saved}</div>
            </div>

            <!-- Client Revenue Chart -->
            <div class="client-revenue-container">
                <label style="display:block; font-size:0.8rem; text-transform:uppercase; letter-spacing:0.05em; color:var(--color-text-secondary); margin-bottom:1rem; font-weight:600;">Income Overview</label>
                <div style="height: 200px; width: 100%; position: relative;">
                    <canvas id="clientRevenueChart"></canvas>
                </div>
            </div>
        </div>

        <!-- ── SUBSCRIPTION MANAGEMENT (Admin) ── -->
        <div class="detail-section" style="margin-bottom: 2rem; border: 1px solid rgba(41,151,255,0.25); border-radius: var(--radius-md); padding: 1.5rem; background: rgba(41,151,255,0.04);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; border-bottom:1px solid var(--glass-border); padding-bottom:0.75rem;">
                <h3 style="color:var(--color-accent); margin:0;">Subscription Management</h3>
                ${(() => {
                    const sub = member.subscription;
                    if (!sub || !sub.planType) return '<span style="font-size:0.8rem;color:var(--color-text-secondary);">No active subscription</span>';
                    const status = subscriptionStatus(sub);
                    const statusColors = { active: '#00c875', pending_payment: '#ffaa00', suspended: '#ff4444', canceled: '#ff4444', cancelled: '#ff4444' };
                    const color = statusColors[status] || '#888';
                    return `<span style="font-size:0.8rem;font-weight:700;color:${color};">● ${(status || '').replace('_', ' ').toUpperCase()}</span>`;
                })()}
            </div>

            ${(() => {
                const sub = member.subscription;
                if (sub && sub.planType) {
                    const status = subscriptionStatus(sub);
                    const statusLabels = { active: 'Active', pending_payment: 'Payment Pending', suspended: 'Suspended', canceled: 'Canceled', cancelled: 'Canceled' };
                    const statusColors = { active: '#00c875', pending_payment: '#ffaa00', suspended: '#ff4444', canceled: '#ff4444', cancelled: '#ff4444' };
                    const col = statusColors[status] || '#888';
                    const sourceLabel = sub.source === 'stripe' ? 'Web / Stripe' : sub.source === 'legacy' ? 'Legacy' : 'Manual / External';
                    return `
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem;margin-bottom:1.5rem;">
                        <div style="background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:8px;padding:1rem;">
                            <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--color-text-secondary);margin-bottom:0.3rem;">Plan</div>
                            <div style="font-size:0.9rem;font-weight:700;color:var(--color-accent);">${sub.planLabel || sub.planType}</div>
                        </div>
                        <div style="background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:8px;padding:1rem;">
                            <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--color-text-secondary);margin-bottom:0.3rem;">Status</div>
                            <div style="font-size:0.9rem;font-weight:700;color:${col};">${statusLabels[status] || status}</div>
                        </div>
                        <div style="background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:8px;padding:1rem;">
                            <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--color-text-secondary);margin-bottom:0.3rem;">Origin</div>
                            <div style="font-size:0.9rem;font-weight:700;color:var(--color-platinum);">${sourceLabel}</div>
                        </div>
                        <div style="background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:8px;padding:1rem;">
                            <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--color-text-secondary);margin-bottom:0.3rem;">Contract</div>
                            <div style="font-size:0.9rem;font-weight:700;color:var(--color-platinum);">${esc(sub.contractPeriodCode || (sub.billingCycle === 'annual' ? 'ANL1' : 'M3N1'))}</div>
                        </div>
                        <div style="background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:8px;padding:1rem;">
                            <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--color-text-secondary);margin-bottom:0.3rem;">Business ID</div>
                            <div style="font-size:0.9rem;font-weight:700;color:var(--color-platinum);font-family:monospace;">${esc(sub.businessId || member.businessId || '—')}</div>
                        </div>
                        <div style="background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:8px;padding:1rem;">
                            <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--color-text-secondary);margin-bottom:0.3rem;">License Code</div>
                            <div style="font-size:0.8rem;font-weight:700;color:var(--color-accent);font-family:monospace;letter-spacing:0.05em;">${sub.licenseCode || '—'}</div>
                        </div>
                        <div style="background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:8px;padding:1rem;">
                            <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--color-text-secondary);margin-bottom:0.3rem;">Next Billing</div>
                            <div style="font-size:0.9rem;color:var(--color-platinum);">${sub.nextBillingDate ? fmtDate(sub.nextBillingDate) : '—'}</div>
                        </div>
                    </div>`;
                }
                return '';
            })()}

            <!-- Manual Assignment Form -->
            <div id="sub-assign-form">
                <h4 style="margin-bottom:1rem;font-size:0.9rem;color:var(--color-platinum);">
                    ${member.subscription ? 'Register External Payment / Update Subscription' : 'Activate Subscription from External Payment'}
                </h4>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;margin-bottom:1rem;">
                    <div>
                        <label style="display:block;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-secondary);margin-bottom:0.4rem;">Plan</label>
                        <select id="sub-plan-select" class="form-control" style="background:rgba(255,255,255,0.05);border:1px solid var(--glass-border);">
                            <option value="hosting"      ${member.subscription?.planType === 'hosting'      ? 'selected' : ''}>Domain & Hosting (€99/yr)</option>
                            <option value="basic"        ${member.subscription?.planType === 'basic'        ? 'selected' : ''}>Basic Maintenance (€70/mo)</option>
                            <option value="preferential" ${member.subscription?.planType === 'preferential' ? 'selected' : ''}>Preferential Maintenance (€99/mo)</option>
                            <option value="advanced"     ${member.subscription?.planType === 'advanced'     ? 'selected' : ''}>Advanced Maintenance (€120/mo)</option>
                            <option value="crm"          ${member.subscription?.planType === 'crm'          ? 'selected' : ''}>Custom Core CRM (€50/mo)</option>
                        </select>
                    </div>
                    <div>
                        <label style="display:block;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-secondary);margin-bottom:0.4rem;">Contract Unit</label>
                        <select id="sub-contract-unit" class="form-control" style="background:rgba(255,255,255,0.05);border:1px solid var(--glass-border);">
                            <option value="months" ${existingContractUnit === 'months' ? 'selected' : ''}>Months (M3N)</option>
                            <option value="years"  ${existingContractUnit === 'years'  ? 'selected' : ''}>Years (ANL)</option>
                        </select>
                    </div>
                    <div>
                        <label style="display:block;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-secondary);margin-bottom:0.4rem;">Contract Length</label>
                        <select id="sub-contract-length" class="form-control" style="background:rgba(255,255,255,0.05);border:1px solid var(--glass-border);">
                            ${Array.from({ length: 9 }, (_, index) => {
                                const length = index + 1;
                                return `<option value="${length}" ${existingContractLength === length ? 'selected' : ''}>${length}</option>`;
                            }).join('')}
                        </select>
                    </div>
                    <div>
                        <label style="display:block;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-secondary);margin-bottom:0.4rem;">Business Identification</label>
                        <input type="text" inputmode="numeric" autocomplete="off" id="sub-business-id" class="form-control" value="${esc(existingBusinessId)}" placeholder="321979257" style="background:rgba(255,255,255,0.05);border:1px solid var(--glass-border);">
                    </div>
                    <div>
                        <label style="display:block;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-secondary);margin-bottom:0.4rem;">Payment Date</label>
                        <input type="date" id="sub-start-date" class="form-control" value="${new Date().toISOString().split('T')[0]}" style="background:rgba(255,255,255,0.05);border:1px solid var(--glass-border);">
                    </div>
                    <div>
                        <label style="display:block;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-secondary);margin-bottom:0.4rem;">Amount Paid</label>
                        <div style="display:flex;gap:0.25rem;">
                            <input type="number" id="sub-amount" class="form-control" placeholder="70" style="flex:1;background:rgba(255,255,255,0.05);border:1px solid var(--glass-border);">
                            <select id="sub-currency" style="width:60px;background:rgba(255,255,255,0.05);border:1px solid var(--glass-border);padding:0.65rem 0.25rem;border-radius:var(--radius-sm);color:var(--color-text-primary);font-size:0.85rem;">
                                <option value="EUR">€</option><option value="USD">$</option><option value="CRC">₡</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div id="sub-license-preview" style="margin:-0.25rem 0 1rem;font:600 0.78rem/1.4 monospace;color:var(--color-accent);"></div>
                <div style="margin-bottom:1rem;">
                    <label style="display:block;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-secondary);margin-bottom:0.4rem;">Invoice PDF (optional)</label>
                    <div class="report-file-input-wrapper">
                        <input type="file" id="sub-invoice-file" accept="application/pdf,image/*">
                        <div class="report-file-btn">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                            <span id="sub-invoice-label">Choose invoice file...</span>
                        </div>
                    </div>
                </div>
                <div style="display:flex;gap:1rem;align-items:center;">
                    <button id="btn-assign-subscription" class="btn btn-primary">
                        ${member.subscription ? 'Register External Payment' : 'Activate Subscription'}
                    </button>
                    <span id="sub-assign-msg" style="display:none;color:#00c875;font-size:0.875rem;"></span>
                </div>
            </div>

            <!-- Payment History for this client -->
            <div id="sub-payment-history" style="margin-top:2rem;">
                <h4 style="font-size:0.85rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-secondary);margin-bottom:1rem;border-top:1px solid var(--glass-border);padding-top:1rem;">Payment History</h4>
                <div id="sub-payment-list"><div class="premium-loader" style="width:24px;height:24px;"></div></div>
            </div>
        </div>

        <div id="pdf-content-wrapper">
            ${onboarding ? (Number(formVersion) >= 2 ? renderOnboardingV2(onboarding) : `
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
            `) : `
                <div style="padding: 2rem; text-align: center; color: var(--color-text-secondary); background: var(--glass-bg); border-radius: var(--radius-md); border: 1px solid var(--glass-border); margin-top: 1rem;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 48px; height: 48px; margin-bottom: 1rem; opacity: 0.5;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    <p style="font-size: 1.1rem; opacity: 0.8;">${t.onboarding_empty}</p>
                </div>
            `}
        </div>

        </div>

        ${!member.onboardingCompleted ? `
        <!-- ── Co-Pilot: live onboarding draft (admin-only view) ── -->
        <div class="detail-section" style="margin-bottom: 2.5rem; border: 1px solid rgba(0, 200, 117, 0.25); background: rgba(0, 200, 117, 0.04); border-radius: var(--radius-md); padding: 1.5rem;">
            <h3 style="margin-top: 0;">${L.copilot_title}</h3>
            <div id="copilot-draft-container">
                <p class="timeline-empty">${L.copilot_waiting}</p>
            </div>
        </div>
        ` : ''}

        <!-- ── Client Timeline (Vista 360) ─────────────────────── -->
        <div class="detail-section" style="margin-bottom: 2.5rem;">
            <h3>Activity Timeline</h3>
            <div id="client-timeline-container">
                <p class="timeline-empty">Loading activity…</p>
            </div>
        </div>

        <!-- ── Admin Notes ─────────────────────────────────────── -->
        <div class="admin-notes-section">
            <label style="display:block; font-size:0.8rem; text-transform:uppercase; letter-spacing:0.05em; color:var(--color-text-secondary); margin-bottom:0.6rem; font-weight:600; opacity:0.7;">Internal Notes (admin only)</label>
            <textarea id="admin-notes-input" class="admin-notes-area" placeholder="Add private notes about this partner…">${member.adminNotes || ''}</textarea>
            <div class="admin-notes-actions">
                <button id="btn-save-notes" class="btn btn-primary" style="min-width:120px;">Save Note</button>
                <span id="notes-save-msg" class="admin-notes-save-msg"></span>
            </div>
        </div>
    `;

    // Load the Vista 360 timeline from the activity ledger (async, non-blocking)
    loadClientTimeline(userId, member);

    // Co-Pilot: follow the client's onboarding draft in real time
    if (!member.onboardingCompleted) watchOnboardingDraft(userId);

    // ── Helper to update project fields ──
    const updateCurrentProjectFields = async (updates) => {
        if (!member.projects) member.projects = [];
        
        Object.assign(currentProject, updates);
        
        const projIndex = member.projects.findIndex(p => p.id === currentProject.id);
        if (projIndex !== -1) {
            member.projects[projIndex] = currentProject;
        } else {
            // Handle legacy project being pushed back
            member.projects.push(currentProject);
        }

        await updateDoc(doc(db, 'members', userId), { projects: member.projects });
        
        const idx = _allClients.findIndex(c => c.id === userId);
        if (idx !== -1) _allClients[idx].projects = member.projects;
    };

    // ── Event Listeners ──────────────────────────────────────────────────────

    // Pipeline suggestion: onboarding done but project still in first_contact
    const btnSuggestProto = document.getElementById('btn-suggest-prototyping');
    if (btnSuggestProto) {
        btnSuggestProto.addEventListener('click', async () => {
            btnSuggestProto.disabled = true;
            try {
                const fromStage = currentProject.projectStage || 'first_contact';
                await updateCurrentProjectFields({ projectStage: 'prototyping' });
                logActivity(userId, member.name, 'stage_changed', { fromStage, toStage: 'prototyping', projectId: currentProject.id });
                document.getElementById('stage-suggestion-banner')?.remove();
            } catch (err) {
                logger.error('Stage suggestion failed:', err);
                btnSuggestProto.disabled = false;
            }
        });
    }

    // Project Tabs
    const tabBtns = document.querySelectorAll('.project-tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const pid = btn.getAttribute('data-project-id');
            // Must fetch the specific onboarding submission for the new project
            showClientDetail(userId, member, pid);
        });
    });

    // Prospect Link
    const btnLinkProspect = document.getElementById('btn-link-prospect');
    if (btnLinkProspect) {
        btnLinkProspect.addEventListener('click', async () => {
            const licenseInput = document.getElementById('prospect-link-license').value.trim();
            const msgEl = document.getElementById('prospect-link-msg');
            
            if (!licenseInput) {
                msgEl.textContent = 'Please provide a license code.';
                msgEl.style.color = '#f44336';
                msgEl.style.display = 'block';
                return;
            }

            btnLinkProspect.disabled = true;
            btnLinkProspect.textContent = 'Linking...';

            try {
                // 1. Verify license exists
                const licenseRef = doc(db, 'licenses', licenseInput);
                const licenseSnap = await getDoc(licenseRef);
                
                if (!licenseSnap.exists()) {
                    throw new Error('Invalid license code.');
                }

                // 2. Find the auth user who holds this license
                const membersQuery = query(collection(db, 'members'), where('licenseCode', '==', licenseInput));
                const targetMembersSnap = await getDocs(membersQuery);
                
                if (targetMembersSnap.empty) {
                    throw new Error('No user found with this license code.');
                }
                
                const targetDoc = targetMembersSnap.docs[0];
                const targetMemberData = targetDoc.data();
                
                // 3. Prepare projects array
                let targetProjects = targetMemberData.projects || [];
                if (targetProjects.length === 0 && (targetMemberData.projectUrl || targetMemberData.onboardingCompleted)) {
                    // Legacy migration for target member if not already done
                    targetProjects.push({
                        id: 'project-1',
                        name: targetMemberData.company || targetMemberData.name || 'Proyecto 1',
                        projectUrl: targetMemberData.projectUrl || null,
                        projectStage: targetMemberData.projectStage || 'first_contact',
                        financials: targetMemberData.financials || null,
                        reports: targetMemberData.reports || [],
                        timeline: targetMemberData.timeline || [],
                        projectDescription: targetMemberData.projectDescription || ''
                    });
                }
                
                // 4. Create new project from prospect data
                const newProjectId = 'proj_' + userId;
                if (!targetProjects.find(p => p.id === newProjectId)) {
                    const newProject = {
                        id: newProjectId,
                        name: member.company || 'New Project',
                        projectStage: 'prospect',
                        onboardingCompleted: false,
                        projectDescription: member.projectDescription || '',
                        financials: { projectCost: 0, maintenanceFee: 0, discount: '', status: 'prospect', currency: 'EUR' },
                        reports: [],
                        timeline: [],
                        linkedFromProspect: true
                    };
                    
                    targetProjects.push(newProject);
                }
                
                // 5. Update target member
                await updateDoc(doc(db, 'members', targetDoc.id), { projects: targetProjects });
                logActivity(targetDoc.id, targetMemberData.name, 'prospect_promoted', { prospectId: userId, prospectName: member.name || null, projectId: newProjectId });
                
                // 6. Delete the prospect document
                await deleteDoc(doc(db, 'prospects', userId));
                
                msgEl.textContent = 'Linked successfully! The prospect has been converted to a project on the target account.';
                msgEl.style.color = '#00c875';
                msgEl.style.display = 'block';
                
                // 7. Update in-memory & close modal
                const pIndex = _allClients.findIndex(c => c.id === userId);
                if (pIndex !== -1) {
                    _allClients.splice(pIndex, 1); // Remove prospect
                }
                
                const mIndex = _allClients.findIndex(c => c.id === targetDoc.id);
                if (mIndex !== -1) {
                    _allClients[mIndex].projects = targetProjects;
                }
                
                setTimeout(() => {
                    const detailOverlay = document.getElementById('client-detail-overlay');
                    if (detailOverlay) detailOverlay.style.display = 'none';
                    loadStats(); // refresh view
                }, 1500);

            } catch (err) {
                msgEl.textContent = err.message;
                msgEl.style.color = '#f44336';
                msgEl.style.display = 'block';
            }
            btnLinkProspect.disabled = false;
            btnLinkProspect.textContent = 'Vincular con Cliente Registrado';
        });
    }

    // Save Project URL
    const btnEditProject = document.getElementById('btn-edit-project');
    const projectView = document.getElementById('project-link-view');
    const projectEdit = document.getElementById('project-link-edit');
    if (btnEditProject) {
        btnEditProject.addEventListener('click', () => {
            projectView.style.display = 'none';
            projectEdit.style.display = 'flex';
            btnEditProject.style.display = 'none';
        });
    }

    const saveBtn = document.getElementById('btn-save-project');
    const msgLabel = document.getElementById('project-save-msg');
    
    saveBtn.addEventListener('click', async () => {
        const url = document.getElementById('project-url-input').value.trim();
        saveBtn.disabled = true;
        saveBtn.textContent = t.saving;
        msgLabel.style.display = 'none';
        
        try {
            await updateCurrentProjectFields({ projectUrl: url });
            logActivity(userId, member.name, 'project_url_set', { projectId: currentProject.id || null, url });
            msgLabel.textContent = t.saved;
            msgLabel.style.color = '#4CAF50';
            msgLabel.style.display = 'block';
            
            // Re-render to update the view mode
            setTimeout(() => {
                showClientDetail(userId, member);
            }, 500);
        } catch (error) {
            logger.error('Save project URL:', error);
            msgLabel.textContent = error.message;
            msgLabel.style.color = '#f44336';
            msgLabel.style.display = 'block';
        }
        
        saveBtn.disabled = false;
        saveBtn.textContent = t.save_link;
        setTimeout(() => { msgLabel.style.display = 'none'; }, 3000);
    });

    // ── Financials Handlers ──────────────────────────────────────────────────
    
    const btnEditFin = document.getElementById('btn-edit-fin');
    const finView = document.getElementById('fin-view-mode');
    const finEdit = document.getElementById('fin-edit-mode');
    
    if (btnEditFin) {
        btnEditFin.addEventListener('click', () => {
            finView.style.display = 'none';
            finEdit.style.display = 'block';
            btnEditFin.style.display = 'none';
        });
    }

    const btnSaveFin = document.getElementById('btn-save-financials');
    if (btnSaveFin) {
        btnSaveFin.addEventListener('click', async () => {
            const newFin = {
                projectCost: parseFloat(document.getElementById('fin-cost').value) || 0,
                maintenanceFee: parseFloat(document.getElementById('fin-fee').value) || 0,
                discount: document.getElementById('fin-discount').value.trim(),
                status: document.getElementById('fin-status').value,
                currency: document.getElementById('fin-currency').value
            };
            
            btnSaveFin.disabled = true;
            btnSaveFin.textContent = 'Saving...';
            try {
                await updateCurrentProjectFields({ financials: newFin });
                logActivity(userId, member.name, 'financials_updated', { projectId: currentProject.id || null });
                
                const msg = document.getElementById('fin-save-msg');
                msg.textContent = t.saved;
                msg.style.display = 'inline';
                msg.style.color = '#00c875';
                
                setTimeout(() => {
                    msg.style.display = 'none';
                    showClientDetail(userId, member); // Re-render to show read mode
                }, 500);
            } catch (err) {
                alert('Error saving financials: ' + err.message);
            }
            btnSaveFin.disabled = false;
            btnSaveFin.textContent = t.save_financials;
        });
    }

    // ── SUBSCRIPTION MANAGEMENT LISTENERS ──
    const subInvoiceFile  = document.getElementById('sub-invoice-file');
    const subInvoiceLabel = document.getElementById('sub-invoice-label');
    if (subInvoiceFile && subInvoiceLabel) {
        subInvoiceFile.addEventListener('change', (e) => {
            const f = e.target.files[0];
            if (f) {
                let name = f.name;
                if (name.length > 30) name = name.substring(0, 27) + '...';
                subInvoiceLabel.textContent = name;
                subInvoiceLabel.style.color = '#fff';
            } else {
                subInvoiceLabel.textContent = 'Choose invoice file...';
                subInvoiceLabel.style.color = '';
            }
        });
    }

    const btnAssignSub = document.getElementById('btn-assign-subscription');
    const subPlanSelect = document.getElementById('sub-plan-select');
    const subContractUnit = document.getElementById('sub-contract-unit');
    const subContractLength = document.getElementById('sub-contract-length');
    const subBusinessId = document.getElementById('sub-business-id');
    const subLicensePreview = document.getElementById('sub-license-preview');
    const updateManualLicensePreview = () => {
        if (!subPlanSelect || !subContractUnit || !subContractLength || !subBusinessId || !subLicensePreview) return;
        const businessId = subBusinessId.value.replace(/\D/g, '');
        const manualLicense = buildManualLicense(subPlanSelect.value, subContractUnit.value, subContractLength.value, businessId);
        subLicensePreview.textContent = businessId
            ? `License: ${manualLicense.licenseCode}`
            : 'License: enter the business identification number';
    };
    const syncAllowedContractUnit = () => {
        if (!subPlanSelect || !subContractUnit) return;
        const monthlyOption = subContractUnit.querySelector('option[value="months"]');
        const annualOnly = subPlanSelect.value === 'hosting';
        if (monthlyOption) monthlyOption.disabled = annualOnly;
        if (annualOnly) subContractUnit.value = 'years';
        updateManualLicensePreview();
    };
    subPlanSelect?.addEventListener('change', syncAllowedContractUnit);
    subContractUnit?.addEventListener('change', updateManualLicensePreview);
    subContractLength?.addEventListener('change', updateManualLicensePreview);
    subBusinessId?.addEventListener('input', updateManualLicensePreview);
    syncAllowedContractUnit();

    if (btnAssignSub) {
        btnAssignSub.addEventListener('click', async () => {
            const planType = document.getElementById('sub-plan-select').value;
            const contractUnit = document.getElementById('sub-contract-unit').value;
            const contractLength = Number(document.getElementById('sub-contract-length').value);
            const businessId = document.getElementById('sub-business-id').value.replace(/\D/g, '');
            const cycle = contractUnit === 'years' ? 'annual' : 'monthly';
            const startDate  = document.getElementById('sub-start-date').value;
            const amount     = parseFloat(document.getElementById('sub-amount').value) || 0;
            const currency   = document.getElementById('sub-currency').value;
            const invoiceInp = document.getElementById('sub-invoice-file');
            const invoiceFile = invoiceInp?.files[0] || null;
            const msgEl      = document.getElementById('sub-assign-msg');

            if (!startDate) return alert('Please set a payment date.');
            if (!Number.isInteger(contractLength) || contractLength < 1 || contractLength > 9) {
                return alert('Contract length must be between 1 and 9.');
            }
            if (!/^\d{5,20}$/.test(businessId)) {
                return alert('Please enter a valid business identification number (digits only).');
            }

            btnAssignSub.disabled = true;
            btnAssignSub.textContent = 'Saving…';

            try {
                const d = new Date(startDate + 'T12:00:00');
                const manualLicense = buildManualLicense(planType, contractUnit, contractLength, businessId);
                const previousLicense = member.subscription?.licenseCode || member.licenseCode || null;
                const { licenseCode, periodCode } = manualLicense;

                // Compute next billing date
                const nextDate = new Date(d);
                if (contractUnit === 'months') nextDate.setMonth(nextDate.getMonth() + contractLength);
                else nextDate.setFullYear(nextDate.getFullYear() + contractLength);

                // Upload invoice if provided
                let invoiceUrl = null;
                if (invoiceFile) {
                    const ts = Date.now();
                    const safeName = invoiceFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
                    const storageRef = ref(storage, `members/${userId}/invoices/${ts}_${safeName}`);
                    const uploadSnap = await uploadBytes(storageRef, invoiceFile);
                    invoiceUrl = await getDownloadURL(uploadSnap.ref);
                }

                // Build subscription object
                const subscription = {
                    planType,
                    planLabel: SUBSCRIPTION_PLANS[planType].label,
                    billingCycle: cycle,
                    contractUnit,
                    contractLength,
                    contractPeriodCode: periodCode,
                    businessId,
                    status: 'active',
                    licenseCode,
                    source: 'manual',
                    isManual: true,
                    startDate: member.subscription?.startDate || d,
                    contractStartDate: d,
                    nextBillingDate: nextDate,
                    gracePeriodEnd: null,
                    stripeCustomerId: null,
                    stripeSubscriptionId: null,
                    updatedAt: serverTimestamp()
                };

                // Member, license and payment are committed together so the CRM
                // can never show a paid subscription without its license.
                const memberRef = doc(db, 'members', userId);
                const licenseRef = doc(db, 'licenses', licenseCode);
                const paymentRef = doc(collection(db, 'subscription_payments'));
                const batch = writeBatch(db);
                batch.update(memberRef, { subscription, licenseCode, businessId });
                batch.set(licenseRef, {
                    code: licenseCode,
                    userId,
                    userName: member.name || null,
                    userEmail: member.email || null,
                    planType,
                    planLabel: SUBSCRIPTION_PLANS[planType].label,
                    billingCycle: cycle,
                    contractUnit,
                    contractLength,
                    contractPeriodCode: periodCode,
                    businessId,
                    status: 'active',
                    source: 'manual',
                    assignedTo: member.name || member.email,
                    assignedAt: member.subscription?.startDate || d,
                    nextBillingDate: nextDate,
                    updatedAt: serverTimestamp()
                }, { merge: true });
                batch.set(paymentRef, {
                    userId,
                    userName: member.name || null,
                    userEmail: member.email || null,
                    planType,
                    planLabel: SUBSCRIPTION_PLANS[planType].label,
                    billingCycle: cycle,
                    contractUnit,
                    contractLength,
                    contractPeriodCode: periodCode,
                    businessId,
                    licenseCode,
                    amount,
                    currency,
                    invoiceUrl,
                    paymentDate: d,
                    recordedAt: serverTimestamp(),
                    recordedBy: 'admin',
                    source: 'manual'
                });
                if (previousLicense && previousLicense !== licenseCode) {
                    batch.delete(doc(db, 'licenses', previousLicense));
                }
                await batch.commit();

                logActivity(userId, member.name, 'subscription_assigned', {
                    planType,
                    billingCycle: cycle,
                    contractPeriodCode: periodCode,
                    businessId,
                    licenseCode,
                    amount,
                    currency
                });

                // Update in-memory cache
                const cacheIdx = _allClients.findIndex(c => c.id === userId);
                if (cacheIdx !== -1) {
                    _allClients[cacheIdx].subscription = subscription;
                    _allClients[cacheIdx].licenseCode = licenseCode;
                    _allClients[cacheIdx].businessId = businessId;
                }

                msgEl.textContent = `✓ Subscription activated! License: ${licenseCode}`;
                msgEl.style.display = 'inline';
                msgEl.style.color = '#00c875';

                // Reload detail after 1.5s
                setTimeout(() => showClientDetail(userId, { ...member, subscription, licenseCode, businessId }), 1500);

            } catch (err) {
                logger.error('Assign subscription:', err);
                alert('Error: ' + err.message);
            }
            btnAssignSub.disabled = false;
            btnAssignSub.textContent = member.subscription ? 'Register External Payment' : 'Activate Subscription';
        });
    }

    // Load payment history for this client
    (async () => {
        const listEl = document.getElementById('sub-payment-list');
        if (!listEl) return;
        try {
            const q = query(collection(db, 'subscription_payments'), where('userId', '==', userId), orderBy('paymentDate', 'desc'));
            const snap = await getDocs(q);
            if (snap.empty) {
                listEl.innerHTML = '<p style="font-size:0.85rem;opacity:0.5;">No payments recorded yet.</p>';
                return;
            }
            const currMap = { EUR: '€', USD: '$', CRC: '₡' };
            listEl.innerHTML = snap.docs.map(d => {
                const p = d.data();
                const dateStr = p.paymentDate?.seconds ? new Date(p.paymentDate.seconds * 1000).toLocaleDateString() : (p.paymentDate || '—');
                const sym = currMap[p.currency] || '€';
                return `<div style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem 0;border-bottom:1px solid var(--glass-border);gap:1rem;">
                    <div>
                        <div style="font-size:0.85rem;font-weight:600;color:var(--color-platinum);">${p.planLabel || p.planType}</div>
                        <div style="font-size:0.75rem;color:var(--color-text-secondary);">${dateStr} · <span style="font-family:monospace;color:var(--color-accent);">${p.licenseCode}</span></div>
                    </div>
                    <div style="display:flex;gap:0.75rem;align-items:center;">
                        <span style="font-weight:700;color:#00c875;">${sym}${p.amount || 0}</span>
                        ${p.invoiceUrl ? `<a href="${p.invoiceUrl}" target="_blank" class="report-btn" title="Download Invoice"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg></a>` : ''}
                    </div>
                </div>`;
            }).join('');
        } catch (err) {
            console.warn('Payment history load:', err);
            const listEl2 = document.getElementById('sub-payment-list');
            if (listEl2) listEl2.innerHTML = '<p style="font-size:0.8rem;opacity:0.5;">Could not load history.</p>';
        }
    })();

    const fileInputEl = document.getElementById('report-file-input');
    const fileNameLabel = document.getElementById('report-file-name-label');
    if (fileInputEl && fileNameLabel) {
        fileInputEl.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                // Truncate name if it's too long
                let name = file.name;
                if (name.length > 25) name = name.substring(0, 22) + '...';
                fileNameLabel.textContent = name;
                fileNameLabel.style.color = '#fff';
            } else {
                fileNameLabel.textContent = 'Choose File...';
                fileNameLabel.style.color = '';
            }
        });
    }

    const btnAddReport = document.getElementById('btn-add-report');
    if (btnAddReport) {
        btnAddReport.addEventListener('click', async () => {
            const title = document.getElementById('report-title-input').value.trim();
            const date = document.getElementById('report-date-input').value;
            const amount = document.getElementById('report-amount-input').value.trim();
            const currency = document.getElementById('report-currency-input').value;
            const fileInput = document.getElementById('report-file-input');
            const file = fileInput.files[0];
            
            if (!title || !file) return alert(t.error_title_file);
            
            btnAddReport.disabled = true;
            btnAddReport.textContent = t.uploading;
            
            try {
                // Upload file to Firebase Storage
                const timestamp = Date.now();
                const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
                const filePath = `members/${userId}/reports/${timestamp}_${safeName}`;
                const storageRef = ref(storage, filePath);
                
                // Use uploadBytes instead of uploadBytesResumable to avoid infinite hangs,
                // and wrap it in a timeout (15 seconds max)
                const uploadPromise = uploadBytes(storageRef, file);
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error("Upload timed out (15s). Please check your internet connection or Storage Rules.")), 15000);
                });
                
                const uploadTask = await Promise.race([uploadPromise, timeoutPromise]);
                const downloadURL = await getDownloadURL(uploadTask.ref);
                
                // Add to Firestore array
                const newReports = [...(currentProject.reports || []), { title, date, amount, currency, url: downloadURL, filePath }];
                await updateCurrentProjectFields({ reports: newReports });
                logActivity(userId, member.name, 'report_added', { projectId: currentProject.id || null, title });

                // Re-render
                showClientDetail(userId, member);
            } catch (err) {
                alert(t.error_upload + ' ' + err.message);
                btnAddReport.disabled = false;
                btnAddReport.textContent = t.upload_btn;
            }
        });
    }

    // Delete Report listeners
    document.querySelectorAll('.btn-delete-report').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (!confirm('Are you sure you want to remove this report?')) return;
            const idx = parseInt(btn.dataset.index);
            const reportToDelete = currentProject.reports[idx];
            const newReports = [...currentProject.reports];
            newReports.splice(idx, 1);
            
            try {
                // 1. Delete from Storage if filePath exists
                if (reportToDelete.filePath) {
                    const storageRef = ref(storage, reportToDelete.filePath);
                    await deleteObject(storageRef).catch(e => console.warn('Could not delete from storage:', e));
                }
                
                // 2. Delete from Firestore
                await updateCurrentProjectFields({ reports: newReports });
                logActivity(userId, member.name, 'report_removed', { projectId: currentProject.id || null, title: reportToDelete.title || null });
                renderDetail(member, onboarding, userId, submissionTimestamp, currentProject.id);
            } catch (err) {
                alert('Error deleting report: ' + err.message);
            }
        });
    });

    // Pipeline Stepper listeners
    const pipelineSteps = document.querySelectorAll('.pipeline-step');
    const pipelineSaveMsg = document.getElementById('pipeline-save-msg');
    pipelineSteps.forEach(step => {
        step.addEventListener('click', async () => {
            const newStage = step.dataset.stage;
            if (!newStage || newStage === currentProject.projectStage) return;
            const fromStage = currentProject.projectStage || null;

            try {
                await updateCurrentProjectFields({ projectStage: newStage });
                logActivity(userId, member.name, 'stage_changed', { projectId: currentProject.id || null, fromStage, toStage: newStage });
                
                // Re-render UI to update colors
                renderDetail(member, onboarding, userId, submissionTimestamp, currentProject.id);
                
                // Show saved msg
                setTimeout(() => {
                    const msg = document.getElementById('pipeline-save-msg');
                    if (msg) {
                        msg.style.display = 'block';
                        setTimeout(() => msg.style.display = 'none', 3000);
                    }
                }, 100);
            } catch (err) {
                alert('Error updating stage: ' + err.message);
            }
        });
    });


    // Save Admin Notes
    const notesBtn = document.getElementById('btn-save-notes');
    const notesMsgEl = document.getElementById('notes-save-msg');
    if (notesBtn) {
        notesBtn.addEventListener('click', async () => {
            const notes = document.getElementById('admin-notes-input')?.value || '';
            notesBtn.disabled = true;
            notesBtn.textContent = 'Saving…';

            try {
                await updateDoc(doc(db, 'members', userId), { adminNotes: notes });
                logActivity(userId, member.name, 'notes_updated', {});
                member.adminNotes = notes;
                // Update in-memory cache
                const idx = _allClients.findIndex(c => c.id === userId);
                if (idx !== -1) _allClients[idx].adminNotes = notes;

                notesMsgEl.textContent = '✓ Saved';
                notesMsgEl.style.color = '#00c875';
                notesMsgEl.classList.add('is-visible');
                logger.log(`Admin notes saved for ${member.name}`);
            } catch (error) {
                logger.error('Save admin notes:', error);
                notesMsgEl.textContent = error.message;
                notesMsgEl.style.color = '#ff3b30';
                notesMsgEl.classList.add('is-visible');
            }

            notesBtn.disabled = false;
            notesBtn.textContent = 'Save Note';
            setTimeout(() => notesMsgEl.classList.remove('is-visible'), 3000);
        });
        // Render Revenue Chart
        setTimeout(() => {
            renderClientRevenueChart(currentProject);
        }, 50);
    }

    // Suspend / Reactivate Toggle
    const suspendBtn = document.getElementById('btn-suspend-toggle');
    if (suspendBtn) {
        suspendBtn.addEventListener('click', async () => {
            const newState = !member.isDeactivated;
            const action   = newState ? 'Suspending' : 'Reactivating';
            suspendBtn.disabled = true;
            suspendBtn.textContent = `${action}…`;

            try {
                await updateDoc(doc(db, 'members', userId), { isDeactivated: newState });
                logActivity(userId, member.name, newState ? 'account_suspended' : 'account_reactivated', {});
                member.isDeactivated = newState;

                // Update in-memory cache so search/sort stays consistent
                const idx = _allClients.findIndex(c => c.id === userId);
                if (idx !== -1) _allClients[idx].isDeactivated = newState;

                logger.log(`Account ${newState ? 'suspended' : 'reactivated'} for ${member.name}`);

                // Re-render detail panel to reflect new state
                renderDetail(member, onboarding, userId, submissionTimestamp);

                // Refresh client grid in background
                const term = document.getElementById('crm-search')?.value.trim().toLowerCase() || '';
                const tCurrent = translations[currentLang];
                const filtered = term
                    ? _allClients.filter(c =>
                        (c.name || '').toLowerCase().includes(term) ||
                        (c.company || '').toLowerCase().includes(term) ||
                        (c.email   || '').toLowerCase().includes(term)
                    )
                    : _allClients;
                renderClientGrid(filtered, tCurrent);
            } catch (error) {
                logger.error('Suspend toggle:', error);
                suspendBtn.disabled = false;
                suspendBtn.textContent = member.isDeactivated ? 'Reactivate Account' : 'Suspend Account';
                alert('Error updating account status: ' + error.message);
            }
        });
    }

    // Download PDF
    const pdfBtn = document.getElementById('btn-download-pdf');
    if (pdfBtn) {
        pdfBtn.addEventListener('click', () => {
            logger.log('Generating PDF for', member.name);
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

// ── REVENUE CHARTS ───────────────────────────────────────────────────────────
let globalRevenueChartInstance = null;
let clientRevenueChartInstance = null;

function renderGlobalRevenueChart() {
    const canvas = document.getElementById('globalRevenueChart');
    if (!canvas) return;
    
    // Process _allClients to get revenue by month and currency
    const monthlyData = {}; // Format: { 'YYYY-MM': { EUR: 0, USD: 0, CRC: 0 } }
    
    // Pre-fill last 6 months so chart always has context even if empty
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
        monthlyData[k] = { EUR: 0, USD: 0, CRC: 0 };
    }
    
    _allClients.forEach(client => {
        const processReports = (reports) => {
            if (reports && Array.isArray(reports)) {
                reports.forEach(r => {
                    if (!r.amount) return;
                    const amt = parseFloat(r.amount) || 0;
                    const cur = r.currency || 'EUR';
                    
                    let mKey = null;
                    if (r.date && typeof r.date === 'string' && r.date.length >= 7) {
                        mKey = r.date.substring(0, 7); // Format: 'YYYY-MM'
                    } else if (r.timestamp) {
                        const dateObj = new Date(r.timestamp);
                        if (!isNaN(dateObj.getTime())) {
                            mKey = dateObj.getFullYear() + '-' + String(dateObj.getMonth() + 1).padStart(2, '0');
                        }
                    }
                    
                    if (!mKey) {
                        const d = new Date();
                        mKey = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
                    }
                    
                    if (monthlyData[mKey] !== undefined) {
                        if (monthlyData[mKey][cur] !== undefined) {
                            monthlyData[mKey][cur] += amt;
                        }
                    }
                });
            }
        };

        if (client.projects && Array.isArray(client.projects)) {
            client.projects.forEach(p => processReports(p.reports));
        } else {
            processReports(client.reports);
        }
    });

    const labels = Object.keys(monthlyData).sort();
    const dataEUR = labels.map(l => monthlyData[l].EUR);
    const dataUSD = labels.map(l => monthlyData[l].USD);
    const dataCRC = labels.map(l => monthlyData[l].CRC);

    if (globalRevenueChartInstance) {
        globalRevenueChartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    
    // Set chart.js defaults for dark theme if body has dark mode, but we will use fixed styling for Elysium
    Chart.defaults.color = 'rgba(255, 255, 255, 0.6)';
    Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';
    Chart.defaults.font.family = "'Manrope', sans-serif";

    globalRevenueChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'EUR (€)',
                    data: dataEUR,
                    backgroundColor: 'rgba(59, 130, 246, 0.7)',
                    borderColor: 'rgb(59, 130, 246)',
                    borderWidth: 1,
                    borderRadius: 4
                },
                {
                    label: 'USD ($)',
                    data: dataUSD,
                    backgroundColor: 'rgba(16, 185, 129, 0.7)',
                    borderColor: 'rgb(16, 185, 129)',
                    borderWidth: 1,
                    borderRadius: 4
                },
                {
                    label: 'CRC (₡)',
                    data: dataCRC,
                    backgroundColor: 'rgba(245, 158, 11, 0.7)',
                    borderColor: 'rgb(245, 158, 11)',
                    borderWidth: 1,
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { usePointStyle: true, padding: 20 } },
                tooltip: { mode: 'index', intersect: false }
            },
            scales: {
                x: { grid: { display: false } },
                y: { beginAtZero: true }
            }
        }
    });
}

function renderClientRevenueChart(clientData) {
    const canvas = document.getElementById('clientRevenueChart');
    if (!canvas) return;

    if (clientRevenueChartInstance) {
        clientRevenueChartInstance.destroy();
    }

    const reports = clientData.reports || [];
    const validReports = reports.filter(r => r.amount && parseFloat(r.amount) > 0);
    
    if (validReports.length === 0) {
        canvas.parentElement.innerHTML = '<p class="color-text-secondary" style="font-size: 0.9em;">No financial data available yet.</p>';
        return;
    }

    // Sort valid reports by date ascending
    validReports.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));

    const labels = validReports.map(r => {
        if (!r.date) return 'Unk';
        const parts = r.date.split('-');
        if (parts.length === 3) {
            const d = new Date(parts[0], parts[1] - 1, parts[2]);
            return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        }
        return r.date;
    });
    
    const data = validReports.map(r => parseFloat(r.amount));
    // Determine main currency
    const mainCur = validReports[0].currency || 'EUR';
    let curSymbol = '€';
    if (mainCur === 'USD') curSymbol = '$';
    if (mainCur === 'CRC') curSymbol = '₡';

    const ctx = canvas.getContext('2d');

    clientRevenueChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `Revenue (${mainCur})`,
                data: data,
                borderColor: 'rgba(59, 130, 246, 1)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                pointRadius: 4,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { 
                    callbacks: {
                        label: function(context) {
                            return curSymbol + ' ' + context.parsed.y;
                        }
                    }
                }
            },
            scales: {
                x: { grid: { display: false } },
                y: { beginAtZero: true }
            }
        }
    });
}

async function loadContacts() {
    const contactsList = document.getElementById('contacts-list');
    const badge = document.getElementById('sidebar-contacts-count');
    contactsList.innerHTML = '<tr><td colspan="5"><div class="loader-container"><div class="premium-loader"></div></div></td></tr>';

    try {
        const q = query(collection(db, 'contacts'), orderBy('submittedAt', 'desc'));
        const snap = await getDocs(q);
        
        if (badge) badge.textContent = snap.size;
        
        if (snap.empty) {
            contactsList.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--color-text-secondary); padding: 2rem;">No inquiries found.</td></tr>';
            return;
        }

        let html = '';
        snap.forEach(doc => {
            const data = doc.data();
            const date = data.submittedAt ? new Date(data.submittedAt.seconds * 1000).toLocaleDateString() : '-';
            html += `
                <tr>
                    <td>${date}</td>
                    <td><strong>${esc(data.name) || '-'}</strong></td>
                    <td><a href="mailto:${esc(data.email) || ''}" style="color: var(--color-accent); text-decoration: none;">${esc(data.email) || '-'}</a></td>
                    <td><a href="tel:${esc(data.phone) || ''}" style="color: var(--color-accent); text-decoration: none;">${esc(data.phone) || '-'}</a></td>
                    <td><span class="status-badge" style="background: rgba(41, 151, 255, 0.1); color: var(--color-accent);">${esc(data.service) || '-'}</span></td>
                    <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${esc(data.message) || ''}">${esc(data.message) || '-'}</td>
                </tr>
            `;
        });
        contactsList.innerHTML = html;
    } catch (e) {
        logger.error("Error loading contacts:", e);
        contactsList.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #ff4444; padding: 2rem;">Error loading inquiries.</td></tr>';
    }
}
