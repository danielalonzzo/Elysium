import { auth, db, hasPersistentCache } from './firebase-config.js';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    updateProfile,
    sendPasswordResetEmail,
    sendEmailVerification,
    reload as reloadUser
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp,
    addDoc,
    collection,
    query,
    where,
    getDocs,
    onSnapshot,
    terminate,
    clearIndexedDbPersistence
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import {
    timestampMillis,
    subscriptionStatus,
    projectIdsMatch,
    isLegacyProjectId,
    submissionMatchesProject,
    completedProjectIds,
    projectOnboardingCompleted as isProjectOnboardingCompleted,
    normalizeProjects as normalizeProjectList
} from './elysium-domain.js';

const IS_DEV = ['localhost', '127.0.0.1', 'web.app'].some(h => location.hostname.includes(h));
const logger = {
    log:   (...a) => IS_DEV && console.log('[Elysium Portal]', ...a),
    warn:  (...a) => IS_DEV && console.warn('[Elysium Portal]', ...a),
    error: (...a) => console.error('[Elysium Portal]', ...a)
};

const SUPER_ADMIN_EMAIL = 'daniel.morales@elysiumdr.eu';

const PLANS = {
    hosting:      { code: 'H0ST', price: { monthly: null, annual: 99 },    tier: 1 },
    basic:        { code: 'EC01', price: { monthly: 70,   annual: 700 },   tier: 2 },
    preferential: { code: 'EC02', price: { monthly: 99,   annual: 990 },   tier: 3 },
    advanced:     { code: 'EC03', price: { monthly: 120,  annual: 1200 },  tier: 3 }
};

const pathParts = window.location.pathname.split('/').filter(Boolean);
const supportedLanguages = new Set(['en', 'es', 'pt']);
const LANGUAGE_LOCALES = { en: 'en-GB', es: 'es-CR', pt: 'pt-PT' };
const requestedLanguage = new URLSearchParams(window.location.search).get('lang');
const pathLanguage = supportedLanguages.has(pathParts[0]) ? pathParts[0] : null;
const storedLanguage = localStorage.getItem('elysium_lang');
let currentLang = supportedLanguages.has(requestedLanguage)
    ? requestedLanguage
    : pathLanguage || (supportedLanguages.has(storedLanguage) ? storedLanguage : 'en');
let locale = LANGUAGE_LOCALES[currentLang];

function localizedPath(path = '', language = currentLang) {
    const clean = String(path || '').replace(/^\/+|\/+$/g, '');
    const base = clean ? `/${clean}` : '/';
    return language === 'en' ? base : `/${language}${base}`;
}

function localizedProfilePath(language = currentLang) {
    return language === 'en' ? '/profiles' : `/profiles?lang=${language}`;
}

function updateLocalizedLinks() {
    document.querySelectorAll('[data-localized-route]').forEach(link => {
        link.href = localizedPath(link.dataset.localizedRoute || '');
    });
    document.querySelectorAll('[data-localized-profile]').forEach(link => {
        link.href = localizedProfilePath();
    });
}

const COPY = {
    en: {
        portal: 'Client portal', dashboard: 'Dashboard', overview: 'Overview', projects: 'Projects', documents: 'Documents',
        subscription: 'Subscription', billing: 'Billing', profile: 'Profile', onboarding: 'Onboarding', onboardings: 'Onboardings', signOut: 'Sign out',
        support: 'Support', greeting: 'Good to see you', overviewLead: 'Your projects, onboarding and account in one place.',
        currentPlan: 'Current plan', noPlan: 'No plan yet', status: 'Status', active: 'Active', pending_payment: 'Payment pending',
        suspended: 'Suspended', canceled: 'Cancelled', cancelled: 'Cancelled', projectsCount: 'Projects', nextRenewal: 'Next renewal',
        noRenewal: 'Not scheduled', onboardingStatus: 'Onboarding', notStarted: 'Not started', inProgress: 'In progress', completed: 'Completed',
        onboardingTitle: 'Onboarding', onboardingBody: 'The Elysium team fills the onboarding in with you in a joint session. Once published, you will have it here.',
        onboardingGuided: 'Completed with your team in a guided session', onboardingInSession: 'Session in progress with your team',
        viewOnboarding: 'View onboarding', module: 'Module', of: 'of',
        onboardingHistoryTitle: 'Onboarding history', onboardingHistoryLead: 'Every delivery your team has published, by project.',
        onboardingHistoryEmpty: 'No onboarding has been published yet. Your team completes it with you in a guided session.', onboardingHistoryUnavailable: 'Your onboarding history could not be loaded. Try again shortly.',
        deliveryNumber: 'Delivery', deliveries: 'deliveries', submitted: 'Submitted', version: 'Version', viewReview: 'View',
        nextMeeting: 'Next meeting', joinMeeting: 'Join meeting', minutesShort: 'min',
        submissionDetails: 'Onboarding delivery', submittedInformation: 'Submitted information', submittedFiles: 'Submitted files', noSubmittedInformation: 'No additional information was included.',
        accountOnboarding: 'Account onboarding', projectIdentifier: 'Project ID', yes: 'Yes', no: 'No',
        projectTitle: 'Your projects', projectLead: 'Follow every delivery and open a safe preview.', noProjects: 'No projects have been assigned yet.',
        noProjectsBody: 'Once your project is created by the Elysium team, its progress and preview will appear here.',
        openProject: 'Open project', preview: 'Preview', previewUnavailable: 'This site cannot be embedded safely. Open it in a new tab instead.',
        stage: 'Stage', updated: 'Updated', prospect: 'Planning', first_contact: 'Discovery', prototyping: 'Prototype', development: 'Development',
        testing: 'Testing', delivery: 'Delivery', deployment: 'Delivery', maintenance: 'Live & evolving', project: 'Project',
        documentsTitle: 'Documents & reports', documentsLead: 'Files shared by your Elysium team.', noDocuments: 'No documents have been shared yet.',
        download: 'Open document', amount: 'Amount', date: 'Date',
        subscriptionTitle: 'Plans and subscription', subscriptionLead: 'See your current service and compare the available options.',
        monthly: 'Monthly', annual: 'Annual', twoMonthsIncluded: '2 months included', selectPlan: 'Choose plan', currentPlanButton: 'Current plan',
        contactPlan: 'Request this plan', planHosting: 'Hosting', planBasic: 'Presence',
        planPreferential: 'Infrastructure', planAdvanced: 'Ecosystem', perMonth: '/ month', perYear: '/ year', mostPopular: 'Most popular',
        hostingFeatures: ['Domain management and identity', 'High-availability hosting', 'Infrastructure updates'],
        basicFeatures: ['Website, domain, email and hosting', 'Online booking and client records', 'One hour of changes per month'],
        preferentialFeatures: ['Everything in Presence', 'Multiple languages and adaptive interface', 'Advanced integrations and automation'],
        advancedFeatures: ['Everything in Infrastructure', 'Private operational dashboard', 'Custom scalable software'],
        planDialogTitle: 'Subscription request', planRequestBody: 'Tell us and we will activate this plan with you. Your team sets it up and the licence appears here.',
        viewPlans: 'View plans',
        contactUs: 'Request by email', close: 'Close', billingTitle: 'Billing history', billingLead: 'Payments and invoices associated with your account.',
        noPayments: 'No payments have been recorded yet.', loadPayments: 'Load billing history', retry: 'Try again', paymentUnavailable: 'Billing history could not be loaded.',
        method: 'Method', invoice: 'Invoice', license: 'License', manual: 'Manual', online: 'Online', viewInvoice: 'View invoice',
        profileTitle: 'Profile & security', profileLead: 'Keep your contact information accurate and protect access to your account.',
        fullName: 'Full name', company: 'Company', email: 'Account email', phone: 'Phone', billingEmail: 'Billing email', language: 'Preferred language',
        saveChanges: 'Save changes', saving: 'Saving…', profileSaved: 'Profile updated.', profileSaveError: 'Your profile could not be updated.',
        security: 'Account security', emailVerified: 'Email verified', emailNotVerified: 'Email not verified', verifyEmail: 'Send verification email',
        verificationSent: 'Verification email sent. Check your inbox and spam folder.', changePassword: 'Send password-change email',
        passwordEmailSent: 'Password-change email requested. Check your inbox and spam folder.',
        authLoadError: 'We could not load your account. Check your connection and try again.', accountDisabled: 'This account has been deactivated. Contact support to restore access.',
        loadingAccount: 'Loading your account…', secureSender: 'Security messages are sent through Elysium’s verified email infrastructure.',
        secureSenderElysium: 'The sender is info@elysiumdr.eu. If nothing arrives, the account may be registered under a different address.',
        secureSenderFirebase: 'The sender is noreply@elysiumdr-eu.firebaseapp.com. If nothing arrives, the account may be registered under a different address.',
        resetSending: 'Sending…',
        resetNotice: 'If an account exists for {email}, a recovery link is on its way. It may take a few minutes. Check spam too.',
        resetInvalid: 'Enter a valid email address.', resetTooMany: 'Too many attempts. Wait a few minutes and try again.',
        resetNetwork: 'The authentication service could not be reached. Check your connection.', resetFailed: 'The recovery link could not be requested. Try again or contact support.',
        invalidCredentials: 'The email or password is incorrect.', requiredName: 'Enter your full name.', passwordShort: 'Use at least 8 characters.',
        passwordMismatch: 'The passwords do not match.', emailInUse: 'That email is already registered. Sign in or recover your password.',
        registrationFailed: 'The account could not be created. Try again.', projectRequestFailed: 'The request could not be sent. Try again.',
        projectRequestSent: 'Your request was sent. We will contact you shortly.', subscriptionAttention: 'Your subscription needs attention.',
        previewTitle: 'Project preview',
        navServices: 'Services', navPortfolio: 'Portfolio', navResearch: 'Research', navAbout: 'About', navAccount: 'Account', navContact: 'Contact',
        heroTitle: 'Partner Portal', heroSubtitle: 'Exclusive access for Elysium partners',
        loginTitle: 'Login', loginSubtitle: 'Enter your credentials to access', emailAddress: 'Email Address', passwordField: 'Password',
        forgotPassword: 'Forgot password?', signInBtn: 'Sign In', noAccount: 'Don\'t have an account?', createOne: 'Create one',
        resetTitle: 'Reset Password', resetSubtitle: 'Enter your email to receive a reset link', sendReset: 'Send Reset Link',
        rememberedPassword: 'Remembered your password?', signInText: 'Sign in',
        joinTitle: 'Join Elysium', joinSubtitle: 'Create your partner account — free to start',
        fullNameField: 'Full Name *', companyNameField: 'Company Name', optionalText: '(optional)', repeatPassword: 'Repeat Password *', createAccount: 'Create Account',
        accountTitle: 'Account — Elysium λ', authLanguage: 'Interface language', emailPlaceholder: 'name@company.com', passwordPlaceholder: 'Your password',
        newPasswordPlaceholder: 'At least 8 characters', namePlaceholder: 'Full name', companyPlaceholder: 'Company name', alreadyHaveAccount: 'Already have an account?',
        startProjectInquiry: 'Start a project inquiry', startProjectTitle: 'Start a Project', startProjectSubtitle: 'Tell us what you would like to create',
        companyRequiredField: 'Company Name *', emailRequiredField: 'Email Address *', passwordRequiredField: 'Password *', personalEmailPlaceholder: 'Personal email',
        projectDescriptionField: 'Brief Project Description', projectDescriptionPlaceholder: 'What would you like to build?', alreadyClient: 'Are you already a client?',
        licenseNumberField: 'Elysium λ Licence Number *', sendProjectRequest: 'Send Project Request', haveLicense: 'Have a licence?', registerAsClient: 'Register as a client',
        passwordResetComplete: 'Your password has been changed. You can now sign in with the new password.',
        footerLocation: 'Portugal, European Union', footerCompany: 'Company', footerLegal: 'Legal', footerConnect: 'Connect', privacyPolicy: 'Privacy Policy',
        termsOfService: 'Terms of Service', copyright: '© 2026 Elysium λ Development & Research. All rights reserved.'
    },
    es: {
        portal: 'Portal de clientes', dashboard: 'Panel', overview: 'Resumen', projects: 'Proyectos', documents: 'Documentos',
        subscription: 'Suscripción', billing: 'Facturación', profile: 'Perfil', onboarding: 'Onboarding', onboardings: 'Onboardings', signOut: 'Cerrar sesión',
        support: 'Soporte', greeting: 'Nos alegra verte', overviewLead: 'Tus proyectos, onboarding y cuenta en un solo lugar.',
        currentPlan: 'Plan actual', noPlan: 'Sin plan todavía', status: 'Estado', active: 'Activa', pending_payment: 'Pago pendiente',
        suspended: 'Suspendida', canceled: 'Cancelada', cancelled: 'Cancelada', projectsCount: 'Proyectos', nextRenewal: 'Próxima renovación',
        noRenewal: 'Sin programar', onboardingStatus: 'Onboarding', notStarted: 'Sin iniciar', inProgress: 'En progreso', completed: 'Completado',
        onboardingTitle: 'Onboarding', onboardingBody: 'El equipo de Elysium rellena el onboarding con usted en una sesión conjunta. Cuando lo publique, lo tendrá aquí.',
        onboardingGuided: 'Se completa contigo en una sesión con tu equipo', onboardingInSession: 'Sesión en curso con tu equipo',
        viewOnboarding: 'Ver onboarding', module: 'Módulo', of: 'de',
        onboardingHistoryTitle: 'Historial de onboardings', onboardingHistoryLead: 'Todas las entregas publicadas por tu equipo, por proyecto.',
        onboardingHistoryEmpty: 'Aún no hay ningún onboarding publicado. Tu equipo lo completa contigo en una sesión conjunta.', onboardingHistoryUnavailable: 'No se pudo cargar tu historial de onboardings. Inténtalo de nuevo en unos instantes.',
        deliveryNumber: 'Entrega', deliveries: 'entregas', submitted: 'Enviado', version: 'Versión', viewReview: 'Ver',
        nextMeeting: 'Próxima reunión', joinMeeting: 'Entrar a la reunión', minutesShort: 'min',
        submissionDetails: 'Entrega de onboarding', submittedInformation: 'Información enviada', submittedFiles: 'Archivos enviados', noSubmittedInformation: 'No se incluyó información adicional.',
        accountOnboarding: 'Onboarding de la cuenta', projectIdentifier: 'ID del proyecto', yes: 'Sí', no: 'No',
        projectTitle: 'Tus proyectos', projectLead: 'Sigue cada entrega y abre una vista previa segura.', noProjects: 'Todavía no hay proyectos asignados.',
        noProjectsBody: 'Cuando el equipo de Elysium cree tu proyecto, aquí verás su avance y vista previa.',
        openProject: 'Abrir proyecto', preview: 'Vista previa', previewUnavailable: 'Este sitio no permite una vista incrustada segura. Ábrelo en una pestaña nueva.',
        stage: 'Etapa', updated: 'Actualizado', prospect: 'Planificación', first_contact: 'Descubrimiento', prototyping: 'Prototipo', development: 'Desarrollo',
        testing: 'Pruebas', delivery: 'Entrega', deployment: 'Entrega', maintenance: 'En vivo y evolucionando', project: 'Proyecto',
        documentsTitle: 'Documentos e informes', documentsLead: 'Archivos compartidos por tu equipo de Elysium.', noDocuments: 'Todavía no se han compartido documentos.',
        download: 'Abrir documento', amount: 'Importe', date: 'Fecha',
        subscriptionTitle: 'Planes y suscripción', subscriptionLead: 'Consulta tu servicio actual y compara las opciones disponibles.',
        monthly: 'Mensual', annual: 'Anual', twoMonthsIncluded: '2 meses incluidos', selectPlan: 'Elegir plan', currentPlanButton: 'Plan actual',
        contactPlan: 'Solicitar este plan', planHosting: 'Alojamiento', planBasic: 'Presencia',
        planPreferential: 'Infraestructura', planAdvanced: 'Ecosistema', perMonth: '/ mes', perYear: '/ año', mostPopular: 'Más popular',
        hostingFeatures: ['Gestión de dominio e identidad', 'Hosting de alta disponibilidad', 'Actualizaciones de infraestructura'],
        basicFeatures: ['Web, dominio, correo y hosting', 'Reservas online y registro de clientes', 'Una hora de cambios al mes'],
        preferentialFeatures: ['Todo lo incluido en Presencia', 'Varios idiomas e interfaz adaptable', 'Integraciones y automatización avanzada'],
        advancedFeatures: ['Todo lo incluido en Infraestructura', 'Panel operativo privado', 'Software personalizado y escalable'],
        planDialogTitle: 'Solicitud de suscripción', planRequestBody: 'Cuéntanoslo y activamos el plan contigo. Tu equipo lo configura y la licencia aparece aquí.',
        viewPlans: 'Ver planes',
        contactUs: 'Solicitar por correo', close: 'Cerrar', billingTitle: 'Historial de facturación', billingLead: 'Pagos y facturas asociados a tu cuenta.',
        noPayments: 'Todavía no hay pagos registrados.', loadPayments: 'Cargar historial', retry: 'Reintentar', paymentUnavailable: 'No se pudo cargar el historial de facturación.',
        method: 'Método', invoice: 'Factura', license: 'Licencia', manual: 'Manual', online: 'Online', viewInvoice: 'Ver factura',
        profileTitle: 'Perfil y seguridad', profileLead: 'Mantén tus datos actualizados y protege el acceso a tu cuenta.',
        fullName: 'Nombre completo', company: 'Empresa', email: 'Correo de la cuenta', phone: 'Teléfono', billingEmail: 'Correo de facturación', language: 'Idioma preferido',
        saveChanges: 'Guardar cambios', saving: 'Guardando…', profileSaved: 'Perfil actualizado.', profileSaveError: 'No se pudo actualizar el perfil.',
        security: 'Seguridad de la cuenta', emailVerified: 'Correo verificado', emailNotVerified: 'Correo sin verificar', verifyEmail: 'Enviar verificación',
        verificationSent: 'Correo de verificación enviado. Revisa también spam.', changePassword: 'Enviar correo para cambiar contraseña',
        passwordEmailSent: 'Correo para cambiar la contraseña solicitado. Revisa la bandeja de entrada y spam.',
        authLoadError: 'No pudimos cargar tu cuenta. Revisa la conexión e inténtalo de nuevo.', accountDisabled: 'Esta cuenta está desactivada. Contacta con soporte para recuperar el acceso.',
        loadingAccount: 'Cargando tu cuenta…', secureSender: 'Los correos de seguridad se envían mediante la infraestructura verificada de Elysium.',
        secureSenderElysium: 'El remitente es info@elysiumdr.eu. Si no llega nada, puede que la cuenta esté registrada con otra dirección.',
        secureSenderFirebase: 'El remitente es noreply@elysiumdr-eu.firebaseapp.com. Si no llega nada, puede que la cuenta esté registrada con otra dirección.',
        resetSending: 'Enviando…',
        resetNotice: 'Si existe una cuenta para {email}, el enlace de recuperación va en camino. Puede tardar unos minutos. Revisa también spam.',
        resetInvalid: 'Introduce una dirección de correo válida.', resetTooMany: 'Demasiados intentos. Espera unos minutos y vuelve a intentarlo.',
        resetNetwork: 'No se pudo contactar con el servicio de autenticación. Revisa tu conexión.', resetFailed: 'No se pudo solicitar el enlace. Inténtalo de nuevo o contacta con soporte.',
        invalidCredentials: 'El correo o la contraseña no son correctos.', requiredName: 'Introduce tu nombre completo.', passwordShort: 'Usa al menos 8 caracteres.',
        passwordMismatch: 'Las contraseñas no coinciden.', emailInUse: 'Ese correo ya está registrado. Inicia sesión o recupera la contraseña.',
        registrationFailed: 'No se pudo crear la cuenta. Inténtalo de nuevo.', projectRequestFailed: 'No se pudo enviar la solicitud. Inténtalo de nuevo.',
        projectRequestSent: 'Tu solicitud fue enviada. Te contactaremos pronto.', subscriptionAttention: 'Tu suscripción requiere atención.',
        previewTitle: 'Vista previa del proyecto',
        navServices: 'Servicios', navPortfolio: 'Portafolio', navResearch: 'Investigación', navAbout: 'Nosotros', navAccount: 'Cuenta', navContact: 'Contacto',
        heroTitle: 'Portal de Clientes', heroSubtitle: 'Acceso exclusivo para clientes de Elysium',
        loginTitle: 'Iniciar sesión', loginSubtitle: 'Introduce tus credenciales para acceder', emailAddress: 'Correo electrónico', passwordField: 'Contraseña',
        forgotPassword: '¿Olvidaste tu contraseña?', signInBtn: 'Entrar', noAccount: '¿No tienes cuenta?', createOne: 'Crear una',
        resetTitle: 'Restablecer contraseña', resetSubtitle: 'Introduce tu correo para recibir un enlace', sendReset: 'Enviar enlace',
        rememberedPassword: '¿Recordaste tu contraseña?', signInText: 'Inicia sesión',
        joinTitle: 'Únete a Elysium', joinSubtitle: 'Crea tu cuenta de cliente — empezar es gratis',
        fullNameField: 'Nombre completo *', companyNameField: 'Empresa', optionalText: '(opcional)', repeatPassword: 'Repetir contraseña *', createAccount: 'Crear cuenta',
        accountTitle: 'Cuenta — Elysium λ', authLanguage: 'Idioma de la interfaz', emailPlaceholder: 'nombre@empresa.com', passwordPlaceholder: 'Tu contraseña',
        newPasswordPlaceholder: 'Mínimo 8 caracteres', namePlaceholder: 'Nombre completo', companyPlaceholder: 'Nombre de la empresa', alreadyHaveAccount: '¿Ya tienes una cuenta?',
        startProjectInquiry: 'Iniciar una consulta de proyecto', startProjectTitle: 'Iniciar un proyecto', startProjectSubtitle: 'Cuéntanos qué te gustaría crear',
        companyRequiredField: 'Empresa *', emailRequiredField: 'Correo electrónico *', passwordRequiredField: 'Contraseña *', personalEmailPlaceholder: 'Correo personal',
        projectDescriptionField: 'Descripción breve del proyecto', projectDescriptionPlaceholder: '¿Qué te gustaría construir?', alreadyClient: '¿Ya eres cliente?',
        licenseNumberField: 'Número de licencia Elysium λ *', sendProjectRequest: 'Enviar solicitud', haveLicense: '¿Tienes una licencia?', registerAsClient: 'Registrarte como cliente',
        passwordResetComplete: 'Tu contraseña se cambió correctamente. Ya puedes iniciar sesión con la nueva contraseña.',
        footerLocation: 'Portugal, Unión Europea', footerCompany: 'Empresa', footerLegal: 'Legal', footerConnect: 'Contacto', privacyPolicy: 'Política de privacidad',
        termsOfService: 'Términos del servicio', copyright: '© 2026 Elysium λ Development & Research. Todos los derechos reservados.'
    },
    pt: {
        portal: 'Portal de clientes', dashboard: 'Painel', overview: 'Resumo', projects: 'Projetos', documents: 'Documentos',
        subscription: 'Subscrição', billing: 'Faturação', profile: 'Perfil', onboarding: 'Onboarding', onboardings: 'Onboardings', signOut: 'Terminar sessão',
        support: 'Suporte', greeting: 'É bom tê-lo de volta', overviewLead: 'Os seus projetos, onboarding e conta num só lugar.',
        currentPlan: 'Plano atual', noPlan: 'Ainda sem plano', status: 'Estado', active: 'Ativa', pending_payment: 'Pagamento pendente',
        suspended: 'Suspensa', canceled: 'Cancelada', cancelled: 'Cancelada', projectsCount: 'Projetos', nextRenewal: 'Próxima renovação',
        noRenewal: 'Não agendada', onboardingStatus: 'Onboarding', notStarted: 'Não iniciado', inProgress: 'Em curso', completed: 'Concluído',
        onboardingTitle: 'Onboarding', onboardingBody: 'A equipa da Elysium preenche o onboarding consigo numa sessão conjunta. Assim que for publicado, encontra-o aqui.',
        onboardingGuided: 'É preenchido consigo numa sessão com a sua equipa', onboardingInSession: 'Sessão em curso com a sua equipa',
        viewOnboarding: 'Ver onboarding', module: 'Módulo', of: 'de',
        onboardingHistoryTitle: 'Histórico de onboardings', onboardingHistoryLead: 'Todas as entregas publicadas pela sua equipa, por projeto.',
        onboardingHistoryEmpty: 'Ainda não há nenhum onboarding publicado. A sua equipa preenche-o consigo numa sessão conjunta.', onboardingHistoryUnavailable: 'Não foi possível carregar o seu histórico de onboardings. Tente novamente dentro de instantes.',
        deliveryNumber: 'Entrega', deliveries: 'entregas', submitted: 'Enviado', version: 'Versão', viewReview: 'Ver',
        nextMeeting: 'Próxima reunião', joinMeeting: 'Entrar na reunião', minutesShort: 'min',
        submissionDetails: 'Entrega de onboarding', submittedInformation: 'Informação enviada', submittedFiles: 'Ficheiros enviados', noSubmittedInformation: 'Não foi incluída informação adicional.',
        accountOnboarding: 'Onboarding da conta', projectIdentifier: 'ID do projeto', yes: 'Sim', no: 'Não',
        projectTitle: 'Os seus projetos', projectLead: 'Acompanhe cada entrega e abra uma pré-visualização segura.', noProjects: 'Ainda não existem projetos atribuídos.',
        noProjectsBody: 'Quando a equipa Elysium criar o seu projeto, o progresso e a pré-visualização aparecerão aqui.',
        openProject: 'Abrir projeto', preview: 'Pré-visualizar', previewUnavailable: 'Este site não permite uma incorporação segura. Abra-o num novo separador.',
        stage: 'Etapa', updated: 'Atualizado', prospect: 'Planeamento', first_contact: 'Descoberta', prototyping: 'Protótipo', development: 'Desenvolvimento',
        testing: 'Testes', delivery: 'Entrega', deployment: 'Entrega', maintenance: 'Online e em evolução', project: 'Projeto',
        documentsTitle: 'Documentos e relatórios', documentsLead: 'Ficheiros partilhados pela sua equipa Elysium.', noDocuments: 'Ainda não foram partilhados documentos.',
        download: 'Abrir documento', amount: 'Montante', date: 'Data',
        subscriptionTitle: 'Planos e subscrição', subscriptionLead: 'Consulte o seu serviço atual e compare as opções disponíveis.',
        monthly: 'Mensal', annual: 'Anual', twoMonthsIncluded: '2 meses incluídos', selectPlan: 'Escolher plano', currentPlanButton: 'Plano atual',
        contactPlan: 'Pedir este plano', planHosting: 'Alojamento', planBasic: 'Presença',
        planPreferential: 'Infraestrutura', planAdvanced: 'Ecossistema', perMonth: '/ mês', perYear: '/ ano', mostPopular: 'Mais popular',
        hostingFeatures: ['Gestão de domínio e identidade', 'Alojamento de alta disponibilidade', 'Atualizações de infraestrutura'],
        basicFeatures: ['Site, domínio, email e alojamento', 'Marcações online e registo de clientes', 'Uma hora de alterações por mês'],
        preferentialFeatures: ['Tudo o que está incluído em Presença', 'Vários idiomas e interface adaptável', 'Integrações e automatização avançada'],
        advancedFeatures: ['Tudo o que está incluído em Infraestrutura', 'Painel operacional privado', 'Software personalizado e escalável'],
        planDialogTitle: 'Pedido de subscrição', planRequestBody: 'Diga-nos e ativamos o plano consigo. A sua equipa configura-o e a licença aparece aqui.',
        viewPlans: 'Ver planos',
        contactUs: 'Pedir por email', close: 'Fechar', billingTitle: 'Histórico de faturação', billingLead: 'Pagamentos e faturas associados à sua conta.',
        noPayments: 'Ainda não existem pagamentos registados.', loadPayments: 'Carregar histórico', retry: 'Tentar novamente', paymentUnavailable: 'Não foi possível carregar o histórico de faturação.',
        method: 'Método', invoice: 'Fatura', license: 'Licença', manual: 'Manual', online: 'Online', viewInvoice: 'Ver fatura',
        profileTitle: 'Perfil e segurança', profileLead: 'Mantenha os seus dados atualizados e proteja o acesso à sua conta.',
        fullName: 'Nome completo', company: 'Empresa', email: 'Email da conta', phone: 'Telefone', billingEmail: 'Email de faturação', language: 'Idioma preferido',
        saveChanges: 'Guardar alterações', saving: 'A guardar…', profileSaved: 'Perfil atualizado.', profileSaveError: 'Não foi possível atualizar o perfil.',
        security: 'Segurança da conta', emailVerified: 'Email verificado', emailNotVerified: 'Email não verificado', verifyEmail: 'Enviar verificação',
        verificationSent: 'Email de verificação enviado. Verifique também o spam.', changePassword: 'Enviar email para alterar palavra-passe',
        passwordEmailSent: 'Email para alterar a palavra-passe solicitado. Verifique a caixa de entrada e o spam.',
        authLoadError: 'Não foi possível carregar a sua conta. Verifique a ligação e tente novamente.', accountDisabled: 'Esta conta está desativada. Contacte o suporte para recuperar o acesso.',
        loadingAccount: 'A carregar a sua conta…', secureSender: 'Os emails de segurança são enviados pela infraestrutura verificada da Elysium.',
        secureSenderElysium: 'O remetente é info@elysiumdr.eu. Se não chegar nada, a conta pode estar registada com outro endereço.',
        secureSenderFirebase: 'O remetente é noreply@elysiumdr-eu.firebaseapp.com. Se não chegar nada, a conta pode estar registada com outro endereço.',
        resetSending: 'A enviar…',
        resetNotice: 'Se existir uma conta para {email}, o link de recuperação está a caminho. Pode demorar alguns minutos. Verifique também o spam.',
        resetInvalid: 'Introduza um endereço de email válido.', resetTooMany: 'Demasiadas tentativas. Aguarde alguns minutos e tente novamente.',
        resetNetwork: 'Não foi possível contactar o serviço de autenticação. Verifique a ligação.', resetFailed: 'Não foi possível pedir o link. Tente novamente ou contacte o suporte.',
        invalidCredentials: 'O email ou a palavra-passe estão incorretos.', requiredName: 'Introduza o seu nome completo.', passwordShort: 'Utilize pelo menos 8 caracteres.',
        passwordMismatch: 'As palavras-passe não coincidem.', emailInUse: 'Esse email já está registado. Inicie sessão ou recupere a palavra-passe.',
        registrationFailed: 'Não foi possível criar a conta. Tente novamente.', projectRequestFailed: 'Não foi possível enviar o pedido. Tente novamente.',
        projectRequestSent: 'O seu pedido foi enviado. Entraremos em contacto em breve.', subscriptionAttention: 'A sua subscrição requer atenção.',
        previewTitle: 'Pré-visualização do projeto',
        navServices: 'Serviços', navPortfolio: 'Portefólio', navResearch: 'Investigação', navAbout: 'Sobre', navAccount: 'Conta', navContact: 'Contacto',
        heroTitle: 'Portal de Clientes', heroSubtitle: 'Acesso exclusivo para clientes da Elysium',
        loginTitle: 'Iniciar sessão', loginSubtitle: 'Introduza as suas credenciais para aceder', emailAddress: 'Endereço de email', passwordField: 'Palavra-passe',
        forgotPassword: 'Esqueceu-se da palavra-passe?', signInBtn: 'Entrar', noAccount: 'Não tem conta?', createOne: 'Criar uma',
        resetTitle: 'Repor palavra-passe', resetSubtitle: 'Introduza o seu email para receber um link', sendReset: 'Enviar link',
        rememberedPassword: 'Lembrou-se da palavra-passe?', signInText: 'Iniciar sessão',
        joinTitle: 'Junte-se à Elysium', joinSubtitle: 'Crie a sua conta de cliente — começar é grátis',
        fullNameField: 'Nome completo *', companyNameField: 'Empresa', optionalText: '(opcional)', repeatPassword: 'Repetir palavra-passe *', createAccount: 'Criar conta',
        accountTitle: 'Conta — Elysium λ', authLanguage: 'Idioma da interface', emailPlaceholder: 'nome@empresa.com', passwordPlaceholder: 'A sua palavra-passe',
        newPasswordPlaceholder: 'Mínimo de 8 caracteres', namePlaceholder: 'Nome completo', companyPlaceholder: 'Nome da empresa', alreadyHaveAccount: 'Já tem uma conta?',
        startProjectInquiry: 'Iniciar um pedido de projeto', startProjectTitle: 'Iniciar um projeto', startProjectSubtitle: 'Conte-nos o que gostaria de criar',
        companyRequiredField: 'Empresa *', emailRequiredField: 'Endereço de email *', passwordRequiredField: 'Palavra-passe *', personalEmailPlaceholder: 'Email pessoal',
        projectDescriptionField: 'Descrição breve do projeto', projectDescriptionPlaceholder: 'O que gostaria de criar?', alreadyClient: 'Já é cliente?',
        licenseNumberField: 'Número de licença Elysium λ *', sendProjectRequest: 'Enviar pedido', haveLicense: 'Tem uma licença?', registerAsClient: 'Registar-se como cliente',
        passwordResetComplete: 'A sua palavra-passe foi alterada. Já pode iniciar sessão com a nova palavra-passe.',
        footerLocation: 'Portugal, União Europeia', footerCompany: 'Empresa', footerLegal: 'Legal', footerConnect: 'Contacto', privacyPolicy: 'Política de privacidade',
        termsOfService: 'Termos do serviço', copyright: '© 2026 Elysium λ Development & Research. Todos os direitos reservados.'
    }
};
let t = COPY[currentLang];

window.changeLanguage = function(newLang, { updateUrl = true } = {}) {
    if (!supportedLanguages.has(newLang)) return;
    currentLang = newLang;
    localStorage.setItem('elysium_lang', newLang);
    locale = LANGUAGE_LOCALES[currentLang];
    t = COPY[currentLang];
    document.documentElement.lang = currentLang;
    document.title = t.accountTitle;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.placeholder = t[key];
            else el.textContent = t[key];
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const value = t[element.dataset.i18nPlaceholder];
        if (value) element.placeholder = value;
    });

    document.querySelectorAll('[data-i18n-aria]').forEach(element => {
        const value = t[element.dataset.i18nAria];
        if (value) element.setAttribute('aria-label', value);
    });

    document.querySelectorAll('.lang-select').forEach(btn => {
        btn.setAttribute('aria-pressed', String(btn.dataset.lang === currentLang));
    });

    document.querySelectorAll('.lang-current-label').forEach(label => {
        label.textContent = currentLang.toUpperCase();
    });
    updateLocalizedLinks();

    if (updateUrl && /(?:^|\/)profiles\/?$/.test(window.location.pathname)) {
        const url = new URL(window.location.href);
        url.pathname = '/profiles';
        if (currentLang === 'en') url.searchParams.delete('lang');
        else url.searchParams.set('lang', currentLang);
        window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
    }

    if (currentUserData) {
        updateDashboardChrome();
        if (currentUserData.isDeactivated === true) renderDisabledAccount();
        else renderDashboard();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.lang-select').forEach(btn => {
        if (btn.closest('#profile-section')) return;
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            changeLanguage(e.currentTarget.dataset.lang);
        });
    });
    changeLanguage(currentLang, { updateUrl: false });
});

const DOM = {
    loginView: document.getElementById('login-view'),
    signupView: document.getElementById('signup-view'),
    resetView: document.getElementById('reset-password-view'),
    prospectView: document.getElementById('prospect-view'),
    authSection: document.getElementById('auth-section'),
    profileSection: document.getElementById('profile-section'),
    message: document.getElementById('error-message'),
    loginForm: document.getElementById('login-form'),
    signupForm: document.getElementById('signup-form'),
    resetForm: document.getElementById('reset-password-form'),
    prospectForm: document.getElementById('prospect-form')
};

let currentUser = null;
let currentUserData = null;
let currentDraft = null;
let currentDrafts = [];
let currentOnboardingSubmissions = [];
let currentMeetings = [];
let onboardingHistoryError = false;
let registrationInFlight = false;
let memberUnsubscribe = null;
let draftUnsubscribe = null;
let submissionUnsubscribe = null;
let meetingUnsubscribe = null;
let completedOnboardingProjectIds = new Set();
let billingHistory = null;
let billingLoading = false;
let selectedBillingCycle = 'monthly';
let activePortalSection = 'overview';
let lastFocusedElement = null;
let dashboardLoadVersion = 0;
let billingLoadVersion = 0;
let accountDisabled = false;
let profileFormDirty = false;
let pendingPasswordResetNotice = new URLSearchParams(window.location.search).get('passwordReset') === 'complete';

function playSound(type) {
    window.ElysiumAudio?.play(type === 'error' ? 'error' : 'success');
}

function escapeHTML(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function safeHttpUrl(value) {
    if (!value) return null;
    try {
        const url = new URL(String(value), window.location.origin);
        return ['http:', 'https:'].includes(url.protocol) ? url : null;
    } catch (_) {
        return null;
    }
}

function safeMailto(subject) {
    return `mailto:info@elysiumdr.eu?subject=${encodeURIComponent(subject)}`;
}

function formatDate(value) {
    if (!value) return '—';
    let date;
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [year, month, day] = value.split('-').map(Number);
        date = new Date(year, month - 1, day);
    } else {
        date = value.seconds ? new Date(value.seconds * 1000) : new Date(value);
    }
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function formatMoney(amount, currency = 'EUR') {
    const numeric = Number(amount);
    if (!Number.isFinite(numeric)) return '—';
    return new Intl.NumberFormat(locale, { style: 'currency', currency: String(currency).toUpperCase() }).format(numeric);
}

/**
 * The platform service stores a meeting's start as `startAt`. Reading only
 * `startsAt` here is what left the next-meeting card permanently empty: every
 * meeting resolved to 0 and was filtered out as already finished. Accept both
 * names, the way the CRM's own normalizeMeeting already does.
 */
function meetingStartMillis(meeting) {
    return timestampMillis(meeting?.startAt ?? meeting?.startsAt);
}

function authMessage(text, kind = 'error') {
    if (!DOM.message) return;
    DOM.message.textContent = text;
    DOM.message.classList.toggle('is-notice', kind !== 'error');
    DOM.message.setAttribute('role', kind === 'error' ? 'alert' : 'status');
    DOM.message.setAttribute('aria-live', kind === 'error' ? 'assertive' : 'polite');
    DOM.message.classList.remove('hidden');
    if (kind === 'error') playSound('error');
}

function clearAuthMessage() {
    DOM.message?.classList.add('hidden');
}

function showAuthView(view) {
    const views = { login: DOM.loginView, signup: DOM.signupView, reset: DOM.resetView, prospect: DOM.prospectView };
    Object.values(views).forEach(element => element?.classList.add('hidden'));
    views[view]?.classList.remove('hidden');
    clearAuthMessage();
    views[view]?.querySelector('input:not([type="hidden"])')?.focus();
}

function planLabel(planType) {
    return {
        hosting: t.planHosting,
        basic: t.planBasic,
        preferential: t.planPreferential,
        advanced: t.planAdvanced
    }[planType] || t.noPlan;
}

function setCurrentDrafts(snapshot) {
    currentDrafts = snapshot.docs
        .map(item => ({ ...item.data(), _documentId: item.id }))
        .sort((a, b) => timestampMillis(b.updatedAt) - timestampMillis(a.updatedAt));
    currentDraft = currentDrafts[0] || null;
}

function compareOnboardingSubmissions(a, b) {
    const dateDifference = timestampMillis(b.submittedAt) - timestampMillis(a.submittedAt);
    return dateDifference || String(b._documentId || '').localeCompare(String(a._documentId || ''));
}

function setOnboardingSubmissions(snapshot) {
    currentOnboardingSubmissions = snapshot.docs
        .map(item => ({ ...item.data(), _documentId: item.id }))
        .filter(item => item.userId === currentUser?.uid)
        .sort(compareOnboardingSubmissions);
    // Las entregas sin `projectId` cuentan para el proyecto heredado, así que
    // la canonicalización la hace el módulo compartido y no se pierde ninguna.
    completedOnboardingProjectIds = completedProjectIds(currentOnboardingSubmissions);
    onboardingHistoryError = false;
}

function normalizeProjects(userData) {
    return normalizeProjectList(userData, t.project);
}

function onboardingState(userData, draft) {
    const projects = normalizeProjects(userData);
    const complete = projects.length
        ? projects.every(project => projectOnboardingCompleted(project, userData))
        : Boolean(userData?.onboardingCompleted);
    if (complete) return { key: 'completed', progress: 100, label: t.completed };
    // Un borrador sin `projectId` es de cuenta: abre el proyecto heredado, o la
    // cuenta entera si todavía no hay ninguno.
    const draftMatchesIncompleteProject = (isLegacyProjectId(draft?.projectId) && projects.length === 0)
        || projects.some(project => projectIdsMatch(draft?.projectId, project.id)
            && !projectOnboardingCompleted(project, userData));
    if (draft && draftMatchesIncompleteProject) {
        const current = Math.max(1, Number(draft.currentModule) || 1);
        const total = Math.max(current, Number(draft.totalModules) || current);
        return { key: 'in-progress', progress: Math.round((current / total) * 100), label: t.inProgress, current, total };
    }
    return { key: 'not-started', progress: 0, label: t.notStarted };
}

function latestActionableDraft(userData) {
    const projects = normalizeProjects(userData);
    return currentDrafts.find(draft =>
        (isLegacyProjectId(draft.projectId) && projects.length === 0)
        || projects.some(project => projectIdsMatch(draft.projectId, project.id)
            && !projectOnboardingCompleted(project, userData))) || null;
}

/** El predicado compartido, con el conjunto de entregas de este cliente. */
function projectOnboardingCompleted(project, userData = currentUserData) {
    return isProjectOnboardingCompleted(project, userData, completedOnboardingProjectIds);
}

function projectStage(project) {
    const rawKey = project.projectStage || 'first_contact';
    const aliases = { testing: 'development', deployment: 'delivery' };
    const key = aliases[rawKey] || rawKey;
    const stages = ['prospect', 'first_contact', 'prototyping', 'development', 'delivery', 'maintenance'];
    const index = Math.max(0, stages.indexOf(key));
    return { key, label: t[rawKey] || t[key] || key, progress: Math.round(((index + 1) / stages.length) * 100) };
}

function canEmbedProject(url) {
    if (!url) return false;
    const allowedHosts = new Set([
        window.location.hostname,
        'elysiumdr.eu', 'www.elysiumdr.eu',
        'moyracr.com', 'www.moyracr.com',
        'pmorais.pt', 'www.pmorais.pt',
        'selva-y-sal.danielalonzzo.workers.dev'
    ]);
    return allowedHosts.has(url.hostname);
}

function ensureDashboardShell() {
    if (!DOM.profileSection) return;
    if (DOM.profileSection.parentElement !== document.body) document.body.appendChild(DOM.profileSection);
    if (DOM.profileSection.dataset.portalShell === 'true') return;

    DOM.profileSection.dataset.portalShell = 'true';
    DOM.profileSection.className = 'hidden customer-portal';
    DOM.profileSection.innerHTML = `
        <header class="portal-mobile-header">
            <a class="portal-brand" href="${localizedPath('')}" aria-label="Elysium"><span>λ</span> ELYSIUM</a>
            <button type="button" class="portal-mobile-menu" data-action="toggle-menu" aria-expanded="false" aria-controls="portal-sidebar"><span aria-hidden="true">☰</span><span class="sr-only">${escapeHTML(t.dashboard)}</span></button>
        </header>
        <aside class="portal-sidebar" id="portal-sidebar">
            <a class="portal-brand" href="${localizedPath('')}" aria-label="Elysium"><span>λ</span> ELYSIUM</a>
            <div class="portal-user-card">
                <div class="sidebar-admin-avatar" id="portal-avatar" aria-hidden="true">E</div>
                <div><strong id="portal-user-name">—</strong><span id="portal-user-company">${escapeHTML(t.portal)}</span></div>
            </div>
            <nav class="portal-nav" aria-label="${escapeHTML(t.portal)}">
                ${navButton('overview', icon('grid'), t.overview, true)}
                ${navButton('projects', icon('monitor'), t.projects)}
                ${navButton('onboardings', icon('clipboard'), t.onboardings)}
                ${navButton('documents', icon('file'), t.documents)}
                ${navButton('subscription', icon('layers'), t.subscription)}
                ${navButton('billing', icon('card'), t.billing)}
                ${navButton('profile', icon('user'), t.profile)}
            </nav>
            <div class="portal-sidebar-footer">
                <div class="admin-lang-switch">
                    <button type="button" class="lang-select" data-lang="en" aria-label="English" aria-pressed="${currentLang === 'en' ? 'true' : 'false'}">EN</button>
                    <button type="button" class="lang-select" data-lang="es" aria-label="Español" aria-pressed="${currentLang === 'es' ? 'true' : 'false'}">ES</button>
                    <button type="button" class="lang-select" data-lang="pt" aria-label="Português" aria-pressed="${currentLang === 'pt' ? 'true' : 'false'}">PT</button>
                </div>
                <a class="portal-support-link" href="mailto:info@elysiumdr.eu" aria-label="${escapeHTML(t.support)}" title="${escapeHTML(t.support)}">${icon('message')}<span>${escapeHTML(t.support)}</span></a>
                <button type="button" class="sidebar-logout-btn" data-action="logout" aria-label="${escapeHTML(t.signOut)}" title="${escapeHTML(t.signOut)}">${icon('logout')}<span>${escapeHTML(t.signOut)}</span></button>
            </div>
        </aside>
        <main class="portal-main" id="portal-main" tabindex="-1">
            <div id="portal-global-alert" class="portal-alert hidden" role="status" aria-live="polite"></div>
            ${portalSection('overview', true)}
            ${portalSection('projects')}
            ${portalSection('onboardings')}
            ${portalSection('documents')}
            ${portalSection('subscription')}
            ${portalSection('billing')}
            ${portalSection('profile')}
        </main>
        <div id="portal-modal-root"></div>
    `;
    bindPortalEvents();
}

function updateDashboardChrome() {
    const navLabels = {
        overview: t.overview,
        projects: t.projects,
        onboardings: t.onboardings,
        documents: t.documents,
        subscription: t.subscription,
        billing: t.billing,
        profile: t.profile
    };
    document.querySelectorAll('.portal-nav-item[data-target]').forEach(button => {
        const label = navLabels[button.dataset.target];
        if (!label) return;
        const text = button.querySelector('span');
        if (text) text.textContent = label;
        button.setAttribute('aria-label', label);
        button.title = label;
    });
    const portalNav = document.querySelector('.portal-nav');
    if (portalNav) portalNav.setAttribute('aria-label', t.portal);
    document.querySelectorAll('.portal-brand').forEach(link => {
        link.href = localizedPath('');
    });
    const mobileMenuLabel = document.querySelector('.portal-mobile-menu .sr-only');
    if (mobileMenuLabel) mobileMenuLabel.textContent = t.dashboard;
    const support = document.querySelector('.portal-support-link');
    if (support) {
        support.setAttribute('aria-label', t.support);
        support.title = t.support;
        const label = support.querySelector('span');
        if (label) label.textContent = t.support;
    }
    const logout = document.querySelector('.sidebar-logout-btn');
    if (logout) {
        logout.setAttribute('aria-label', t.signOut);
        logout.title = t.signOut;
        const label = logout.querySelector('span');
        if (label) label.textContent = t.signOut;
    }
}

function navButton(target, svg, label, active = false) {
    return `<button type="button" class="portal-nav-item${active ? ' active' : ''}" data-target="${target}" aria-label="${escapeHTML(label)}" title="${escapeHTML(label)}" aria-controls="portal-${target}" aria-current="${active ? 'page' : 'false'}">${svg}<span>${escapeHTML(label)}</span></button>`;
}

function portalSection(id, active = false) {
    return `<section id="portal-${id}" class="portal-section${active ? ' active' : ''}"${active ? '' : ' hidden'} aria-labelledby="portal-${id}-title"><div class="portal-loading"><span class="premium-loader" aria-hidden="true"></span><span>${escapeHTML(t.loadingAccount)}</span></div></section>`;
}

function icon(name) {
    const paths = {
        grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
        monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
        file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
        layers: '<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/>',
        card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
        user: '<path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/>',
        message: '<path d="M21 15a3 3 0 0 1-3 3H8l-5 3V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3z"/>',
        logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
        external: '<path d="M14 3h7v7M10 14 21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/>',
        eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
        clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5V3h6v1.5M9 9h6M9 13h6M9 17h4"/>',
        check: '<path d="m5 12 4 4L19 6"/>',
        lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>'
    };
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">${paths[name] || ''}</svg>`;
}

function enterDashboard() {
    ensureDashboardShell();
    DOM.authSection?.closest('.section')?.classList.add('hidden');
    document.querySelector('.page-header')?.classList.add('hidden');
    document.querySelector('.navbar')?.classList.add('hidden');
    document.querySelector('footer')?.classList.add('hidden');
    DOM.profileSection?.classList.remove('hidden');
    document.body.classList.add('portal-open');
}

function leaveDashboard() {
    dashboardLoadVersion++;
    billingLoadVersion++;
    memberUnsubscribe?.();
    draftUnsubscribe?.();
    submissionUnsubscribe?.();
    meetingUnsubscribe?.();
    memberUnsubscribe = null;
    draftUnsubscribe = null;
    submissionUnsubscribe = null;
    meetingUnsubscribe = null;
    completedOnboardingProjectIds = new Set();
    currentOnboardingSubmissions = [];
    currentMeetings = [];
    onboardingHistoryError = false;
    billingHistory = null;
    billingLoading = false;
    accountDisabled = false;
    profileFormDirty = false;
    activePortalSection = 'overview';
    DOM.profileSection?.classList.add('hidden');
    DOM.authSection?.closest('.section')?.classList.remove('hidden');
    document.querySelector('.page-header')?.classList.remove('hidden');
    document.querySelector('.navbar')?.classList.remove('hidden');
    document.querySelector('footer')?.classList.remove('hidden');
    document.body.classList.remove('portal-open');
    closeModal();
    [DOM.loginForm, DOM.signupForm, DOM.resetForm].forEach(form => {
        form?.reset();
        const submit = form?.querySelector('button[type="submit"]');
        if (submit) submit.disabled = false;
    });
    showAuthView('login');
    if (pendingPasswordResetNotice) {
        pendingPasswordResetNotice = false;
        authMessage(t.passwordResetComplete, 'notice');
        const url = new URL(window.location.href);
        url.searchParams.delete('passwordReset');
        window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
    }
}

function portalAlert(message, kind = 'notice') {
    const alert = document.getElementById('portal-global-alert');
    if (!alert) return;
    alert.textContent = message;
    alert.className = `portal-alert ${kind}`;
    alert.setAttribute('role', kind === 'error' ? 'alert' : 'status');
    window.setTimeout(() => alert.classList.add('hidden'), 7000);
}

function activateSection(target) {
    if (accountDisabled && target !== 'overview') return;
    if (!document.getElementById(`portal-${target}`)) return;
    activePortalSection = target;
    document.querySelectorAll('.portal-nav-item').forEach(button => {
        const active = button.dataset.target === target;
        button.classList.toggle('active', active);
        button.setAttribute('aria-current', active ? 'page' : 'false');
    });
    document.querySelectorAll('.portal-section').forEach(section => {
        const active = section.id === `portal-${target}`;
        section.classList.toggle('active', active);
        section.hidden = !active;
    });
    document.querySelector('.portal-sidebar')?.classList.remove('is-open');
    document.querySelector('.portal-mobile-menu')?.setAttribute('aria-expanded', 'false');
    document.getElementById('portal-main')?.focus({ preventScroll: true });
    if (target === 'billing' && billingHistory === null && !billingLoading) loadBillingHistory();
}

function bindPortalEvents() {
    if (!DOM.profileSection || DOM.profileSection.dataset.eventsBound === 'true') return;
    DOM.profileSection.dataset.eventsBound = 'true';
    DOM.profileSection.addEventListener('click', async event => {
        const langButton = event.target.closest('.lang-select');
        if (langButton) {
            event.preventDefault();
            changeLanguage(langButton.dataset.lang);
            return;
        }
        const targetButton = event.target.closest('[data-target]');
        if (targetButton) return activateSection(targetButton.dataset.target);
        const actionElement = event.target.closest('[data-action]');
        if (!actionElement) return;
        const action = actionElement.dataset.action;
        if (action === 'logout') await signOut(auth);
        if (action === 'toggle-menu') {
            const sidebar = document.querySelector('.portal-sidebar');
            const open = !sidebar?.classList.contains('is-open');
            sidebar?.classList.toggle('is-open', open);
            actionElement.setAttribute('aria-expanded', String(open));
        }
        if (action === 'preview-project') openProjectPreview(Number(actionElement.dataset.projectIndex));
        if (action === 'review-onboarding') openOnboardingSubmission(actionElement.dataset.submissionId);
        if (action === 'choose-plan') showPlanDialog(actionElement.dataset.plan);
        if (action === 'billing-cycle') {
            selectedBillingCycle = actionElement.dataset.cycle === 'annual' ? 'annual' : 'monthly';
            renderSubscriptionSection();
        }
        if (action === 'load-billing' || action === 'retry-billing') await loadBillingHistory(true);
        if (action === 'reload') window.location.reload();
        if (action === 'send-password-email') await requestSignedInPasswordEmail(actionElement);
        if (action === 'verify-email') await requestVerificationEmail(actionElement);
        if (action === 'close-modal') closeModal();
    });
    DOM.profileSection.addEventListener('submit', event => {
        if (event.target.id === 'portal-profile-form') saveProfile(event);
    });
    DOM.profileSection.addEventListener('input', event => {
        if (event.target.closest('#portal-profile-form')) profileFormDirty = true;
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && document.querySelector('.portal-modal')) closeModal();
        if (event.key === 'Tab' && document.querySelector('.portal-modal')) trapModalFocus(event);
    });
}

async function loadMemberDashboard(user) {
    const loadVersion = ++dashboardLoadVersion;
    const userId = user.uid;
    if (currentUser?.uid && currentUser.uid !== userId) {
        billingLoadVersion++;
        memberUnsubscribe?.();
        draftUnsubscribe?.();
        submissionUnsubscribe?.();
        meetingUnsubscribe?.();
        memberUnsubscribe = null;
        draftUnsubscribe = null;
        submissionUnsubscribe = null;
        meetingUnsubscribe = null;
        currentMeetings = [];
        currentUserData = null;
        currentDraft = null;
        currentDrafts = [];
        currentOnboardingSubmissions = [];
        onboardingHistoryError = false;
        completedOnboardingProjectIds = new Set();
        billingHistory = null;
        billingLoading = false;
        profileFormDirty = false;
        activePortalSection = 'overview';
        closeModal();
    }
    currentUser = user;
    accountDisabled = false;
    activePortalSection = 'overview';
    enterDashboard();
    renderLoadingState();
    try {
        const memberRef = doc(db, 'members', userId);
        let memberSnap = await getDoc(memberRef);
        if (!dashboardLoadIsCurrent(userId, loadVersion)) return;
        if (!memberSnap.exists()) {
            const safeFallbackName = String(user.displayName || (user.email ? user.email.split('@')[0] : 'Partner'))
                .replace(/[<>]/g, '')
                .trim()
                .slice(0, 120) || 'Partner';
            const fallback = {
                name: safeFallbackName,
                company: null,
                email: user.email || '',
                role: 'partner',
                subscription: null,
                onboardingCompleted: false,
                createdAt: serverTimestamp()
            };
            await setDoc(memberRef, fallback);
            memberSnap = await getDoc(memberRef);
            if (!dashboardLoadIsCurrent(userId, loadVersion)) return;
        }
        currentUserData = memberSnap.data();
        if (currentUserData.isDeactivated === true) {
            renderDisabledAccount();
            return;
        }
        try {
            const draftSnap = await getDocs(query(
                collection(db, 'onboarding_drafts'),
                where('userId', '==', userId)
            ));
            if (!dashboardLoadIsCurrent(userId, loadVersion)) return;
            setCurrentDrafts(draftSnap);
        } catch (_) {
            if (!dashboardLoadIsCurrent(userId, loadVersion)) return;
            currentDraft = null;
            currentDrafts = [];
        }
        try {
            const submissions = await getDocs(query(collection(db, 'onboarding_submissions'), where('userId', '==', userId)));
            if (!dashboardLoadIsCurrent(userId, loadVersion)) return;
            setOnboardingSubmissions(submissions);
        } catch (error) {
            if (!dashboardLoadIsCurrent(userId, loadVersion)) return;
            logger.warn('[portal] onboarding history', error);
            currentOnboardingSubmissions = [];
            completedOnboardingProjectIds = new Set();
            onboardingHistoryError = true;
        }
        if (!dashboardLoadIsCurrent(userId, loadVersion)) return;
        renderDashboard();
        watchMember(memberRef, userId);
        watchDraft(userId);
        watchSubmissions(userId);
        watchMeetings(userId);
        handlePendingSubscriptionIntent();
    } catch (error) {
        if (!dashboardLoadIsCurrent(userId, loadVersion)) return;
        logger.error('[portal] account load failed', error);
        renderLoadError();
    }
}

/**
 * Borra la caché en disco del socio. `terminate` deja la instancia inservible,
 * así que la página se recarga: no hay forma de seguir usando `db` después de
 * esto, y volver al formulario de acceso es justo lo que toca.
 */
async function purgeLocalCache() {
    if (!hasPersistentCache) return;
    try {
        await terminate(db);
        await clearIndexedDbPersistence(db);
    } catch (error) {
        // `failed-precondition` significa que otra pestaña sigue abierta con la
        // sesión viva. No es un fallo: allí la caché aún tiene dueño.
        logger.warn('[portal] local cache purge', error);
    } finally {
        window.location.replace('/profiles');
    }
}

function dashboardLoadIsCurrent(userId, loadVersion) {
    return loadVersion === dashboardLoadVersion
        && currentUser?.uid === userId
        && auth.currentUser?.uid === userId;
}

function watchMember(memberRef, userId) {
    memberUnsubscribe?.();
    memberUnsubscribe = onSnapshot(memberRef, snapshot => {
        if (currentUser?.uid !== userId) return;
        if (!snapshot.exists()) return;
        const wasDisabled = accountDisabled;
        currentUserData = snapshot.data();
        if (currentUserData.isDeactivated === true) renderDisabledAccount();
        else {
            renderDashboard();
            if (wasDisabled) {
                watchDraft(userId);
                watchSubmissions(userId);
                watchMeetings(userId);
            }
        }
    }, error => logger.warn('[portal] member listener', error));
}

function watchDraft(userId) {
    draftUnsubscribe?.();
    draftUnsubscribe = onSnapshot(query(
        collection(db, 'onboarding_drafts'),
        where('userId', '==', userId)
    ), snapshot => {
        if (currentUser?.uid !== userId || accountDisabled) return;
        setCurrentDrafts(snapshot);
        if (currentUserData) {
            renderOverviewSection();
            renderProjectsSection();
        }
    }, error => logger.warn('[portal] draft listener', error));
}

function watchSubmissions(userId) {
    submissionUnsubscribe?.();
    submissionUnsubscribe = onSnapshot(
        query(collection(db, 'onboarding_submissions'), where('userId', '==', userId)),
        snapshot => {
            if (currentUser?.uid !== userId || accountDisabled) return;
            setOnboardingSubmissions(snapshot);
            if (currentUserData) {
                renderOverviewSection();
                renderProjectsSection();
                renderOnboardingsSection();
            }
        },
        error => {
            logger.warn('[portal] onboarding history listener', error);
            onboardingHistoryError = true;
            if (currentUserData) renderOnboardingsSection();
        }
    );
}

// The administrator schedules meetings from the CRM straight into Firestore;
// the client reads their own so the portal always shows what is coming.
function watchMeetings(userId) {
    meetingUnsubscribe?.();
    meetingUnsubscribe = onSnapshot(
        query(collection(db, 'meetings'), where('userId', '==', userId)),
        snapshot => {
            if (currentUser?.uid !== userId || accountDisabled) return;
            currentMeetings = snapshot.docs.map(item => ({ ...item.data(), _documentId: item.id }));
            if (currentUserData) renderOverviewSection();
        },
        error => logger.warn('[portal] meeting listener', error)
    );
}

function upcomingMeetings() {
    const now = Date.now();
    return currentMeetings
        .filter(meeting => {
            if (meeting.status === 'cancelled' || meeting.cancelledAt) return false;
            const start = meetingStartMillis(meeting);
            const duration = Number(meeting.durationMinutes) || 60;
            return start && start + duration * 60_000 > now;
        })
        .sort((a, b) => meetingStartMillis(a) - meetingStartMillis(b));
}

function renderLoadingState() {
    document.querySelectorAll('.portal-section').forEach(section => {
        section.innerHTML = `<div class="portal-loading"><span class="premium-loader" aria-hidden="true"></span><span>${escapeHTML(t.loadingAccount)}</span></div>`;
    });
}

function renderLoadError() {
    const section = document.getElementById('portal-overview');
    if (!section) return;
    section.innerHTML = `<div class="portal-empty error"><span class="welcome-lambda">λ</span><h1>${escapeHTML(t.authLoadError)}</h1><div class="project-actions"><button type="button" class="btn btn-primary" data-action="reload">${escapeHTML(t.retry)}</button><button type="button" class="btn" data-action="logout">${escapeHTML(t.signOut)}</button></div></div>`;
}

function renderDisabledAccount() {
    accountDisabled = true;
    billingLoadVersion++;
    billingLoading = false;
    draftUnsubscribe?.();
    draftUnsubscribe = null;
    submissionUnsubscribe?.();
    submissionUnsubscribe = null;
    activePortalSection = 'overview';
    setIdentity();
    const section = document.getElementById('portal-overview');
    document.querySelectorAll('.portal-nav-item').forEach(button => { button.disabled = true; button.setAttribute('aria-disabled', 'true'); });
    document.querySelectorAll('.portal-section').forEach(item => { item.hidden = item !== section; item.classList.toggle('active', item === section); });
    if (section) section.innerHTML = `<div class="portal-empty error">${icon('lock')}<h1>${escapeHTML(t.accountDisabled)}</h1><a class="btn btn-primary" href="mailto:info@elysiumdr.eu">${escapeHTML(t.support)}</a><button type="button" class="btn" data-action="logout">${escapeHTML(t.signOut)}</button></div>`;
}

function renderDashboard() {
    if (!currentUserData || !currentUser) return;
    accountDisabled = false;
    document.querySelectorAll('.portal-nav-item').forEach(button => { button.disabled = false; button.removeAttribute('aria-disabled'); });
    setIdentity();
    renderOverviewSection();
    renderProjectsSection();
    renderOnboardingsSection();
    renderDocumentsSection();
    renderSubscriptionSection();
    renderBillingSection();
    if (!profileFormDirty) renderProfileSection();
    activateSection(activePortalSection);
}

function setIdentity() {
    const name = currentUserData?.name || currentUser?.displayName || 'Partner';
    const company = currentUserData?.company || t.portal;
    const nameEl = document.getElementById('portal-user-name');
    const companyEl = document.getElementById('portal-user-company');
    const avatar = document.getElementById('portal-avatar');
    if (nameEl) nameEl.textContent = name;
    if (companyEl) companyEl.textContent = company;
    if (avatar) avatar.textContent = name.slice(0, 1).toUpperCase();
}

function sectionHeader(id, title, lead, action = '') {
    return `<div class="portal-header"><div><span class="portal-eyebrow">${escapeHTML(t.portal)}</span><h1 id="portal-${id}-title">${escapeHTML(title)}</h1><p>${escapeHTML(lead)}</p></div>${action}</div>`;
}

function renderOverviewSection() {
    const section = document.getElementById('portal-overview');
    if (!section || !currentUserData) return;
    const projects = normalizeProjects(currentUserData);
    const sub = currentUserData.subscription;
    const status = subscriptionStatus(sub);
    const actionableDraft = latestActionableDraft(currentUserData);
    const onboarding = onboardingState(currentUserData, actionableDraft);
    const firstProject = projects[0];
    const draftProject = actionableDraft
        ? projects.find(project => projectIdsMatch(actionableDraft.projectId, project.id)
            && !projectOnboardingCompleted(project, currentUserData))
        : null;
    const onboardingProject = draftProject || projects.find(project => !projectOnboardingCompleted(project, currentUserData)) || firstProject;
    const name = currentUserData.name || currentUser?.displayName || '';
    const nextBilling = sub?.nextBillingDate ? formatDate(sub.nextBillingDate) : t.noRenewal;

    section.innerHTML = `
        ${sectionHeader('overview', `${t.greeting}${name ? `, ${name.split(' ')[0]}` : ''}.`, t.overviewLead, `<a class="btn" href="mailto:info@elysiumdr.eu">${escapeHTML(t.support)}</a>`)}
        ${status && status !== 'active' ? `<div class="portal-alert warning" role="alert">${escapeHTML(t.subscriptionAttention)} ${escapeHTML(t[status] || status)}</div>` : ''}
        <div class="portal-kpi-grid">
            ${kpi(t.currentPlan, sub?.planType ? planLabel(sub.planType) : t.noPlan, status ? `<span class="status-chip ${escapeHTML(status)}">${escapeHTML(t[status] || status)}</span>` : '', true)}
            ${kpi(t.projectsCount, String(projects.length), projects.length ? projectStage(firstProject).label : t.noProjects)}
            ${kpi(t.onboardingStatus, onboarding.label, onboarding.key === 'in-progress' ? `${t.module} ${onboarding.current} ${t.of} ${onboarding.total}` : '')}
            ${kpi(t.nextRenewal, nextBilling, sub?.billingCycle === 'annual' ? t.annual : sub ? t.monthly : '')}
        </div>
        ${onboardingCard(onboarding, onboardingProject?.id)}
        ${meetingCard()}
        <div class="portal-grid portal-grid-two">
            <article class="portal-card">
                <div class="portal-card-heading"><div><span>${escapeHTML(t.projects)}</span><h2>${escapeHTML(firstProject?.name || t.noProjects)}</h2></div>${firstProject ? `<button type="button" class="portal-link-button" data-target="projects">${escapeHTML(t.projects)} →</button>` : ''}</div>
                ${firstProject ? projectCompact(firstProject, 0) : emptyState(t.noProjectsBody)}
            </article>
            <article class="portal-card">
                <div class="portal-card-heading"><div><span>${escapeHTML(t.subscription)}</span><h2>${escapeHTML(sub?.planType ? planLabel(sub.planType) : t.noPlan)}</h2></div></div>
                <p>${escapeHTML(t.subscriptionLead)}</p>
                <button type="button" class="btn btn-primary" data-target="subscription">${escapeHTML(sub ? t.viewPlans : t.selectPlan)}</button>
            </article>
        </div>
    `;
}

function meetingCard() {
    const [next] = upcomingMeetings();
    if (!next) return '';
    const zone = next.clientTimeZone && isValidTimeZone(next.clientTimeZone)
        ? next.clientTimeZone
        : Intl.DateTimeFormat().resolvedOptions().timeZone;
    const when = new Intl.DateTimeFormat(locale, {
        timeZone: zone, weekday: 'long', day: 'numeric', month: 'long',
        hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
    }).format(new Date(meetingStartMillis(next)));
    const link = safeHttpUrl(next.meetingUrl);
    return `<article class="portal-card meeting-next-card">
        <div><span class="status-chip active">${escapeHTML(t.nextMeeting)}</span>
            <h2>${escapeHTML(next.title || t.nextMeeting)}</h2>
            <p>${escapeHTML(when)} · ${escapeHTML(String(Number(next.durationMinutes) || 60))} ${escapeHTML(t.minutesShort)}</p>
            ${next.notes ? `<p>${escapeHTML(next.notes)}</p>` : ''}
        </div>
        ${link ? `<a class="btn btn-primary" href="${escapeHTML(link.href)}" target="_blank" rel="noopener noreferrer">${escapeHTML(t.joinMeeting)}</a>` : ''}
    </article>`;
}

function isValidTimeZone(zone) {
    try {
        new Intl.DateTimeFormat('en-GB', { timeZone: String(zone) }).format();
        return true;
    } catch {
        return false;
    }
}

function kpi(label, value, detail = '', trustedDetailHTML = false) {
    return `<article class="portal-kpi"><span>${escapeHTML(label)}</span><strong>${escapeHTML(value)}</strong><small>${trustedDetailHTML ? detail : escapeHTML(detail)}</small></article>`;
}

function onboardingCard(state, projectId) {
    const action = onboardingAction(state.key, projectId, 'btn btn-primary');
    // Una vez publicado no hay nada que explicar ni ninguna barra que avanzar:
    // la tarjeta se queda en el título y el estado.
    const completed = state.key === 'completed';
    return `<article class="portal-card onboarding-card">
        <div class="onboarding-card-copy"><span class="status-chip ${state.key}">${escapeHTML(state.label)}</span><h2>${escapeHTML(t.onboardingTitle)}</h2>${completed ? '' : `<p>${escapeHTML(t.onboardingBody)}</p>
            <div class="onboarding-progress" role="progressbar" aria-label="${escapeHTML(t.onboardingStatus)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${state.progress}"><span style="width:${state.progress}%"></span></div>`}
            ${state.key === 'in-progress' ? `<small>${escapeHTML(`${t.module} ${state.current} ${t.of} ${state.total}`)}</small>` : ''}
        </div>
        ${action}
    </article>`;
}

function projectCompact(project, index) {
    const stage = projectStage(project);
    const url = safeHttpUrl(project.projectUrl);
    return `<div class="project-compact"><div><span class="status-chip active">${escapeHTML(stage.label)}</span><div class="onboarding-progress"><span style="width:${stage.progress}%"></span></div></div><div class="project-actions">${url ? `<button type="button" class="btn" data-action="preview-project" data-project-index="${index}">${icon('eye')}${escapeHTML(t.preview)}</button><a class="btn btn-primary" href="${escapeHTML(url.href)}" target="_blank" rel="noopener noreferrer">${icon('external')}${escapeHTML(t.openProject)}</a>` : ''}</div></div>`;
}

function emptyState(body) {
    return `<div class="portal-empty"><span aria-hidden="true">λ</span><p>${escapeHTML(body)}</p></div>`;
}

function renderProjectsSection() {
    const section = document.getElementById('portal-projects');
    if (!section || !currentUserData) return;
    const projects = normalizeProjects(currentUserData);
    section.innerHTML = `${sectionHeader('projects', t.projectTitle, t.projectLead)}${projects.length ? `<div class="project-grid">${projects.map(projectCard).join('')}</div>` : `<article class="portal-card">${emptyState(t.noProjectsBody)}</article>`}`;
}

function projectCard(project, index) {
    const stage = projectStage(project);
    const url = safeHttpUrl(project.projectUrl);
    const onboarding = projectOnboardingCompleted(project, currentUserData);
    const hasMatchingDraft = !onboarding
        && currentDrafts.some(draft => projectIdsMatch(draft.projectId, project.id));
    const onboardingStateKey = onboarding ? 'completed' : hasMatchingDraft ? 'in-progress' : 'not-started';
    return `<article class="project-card">
        <div class="project-preview">
            ${url && canEmbedProject(url) ? `<iframe class="project-preview-frame" src="${escapeHTML(url.href)}" title="${escapeHTML(`${t.previewTitle}: ${project.name || t.project}`)}" loading="lazy" sandbox="allow-scripts allow-forms allow-popups allow-same-origin" referrerpolicy="no-referrer" tabindex="-1"></iframe>` : `<div class="project-preview-fallback"><span>λ</span><strong>${escapeHTML(url?.hostname || t.project)}</strong></div>`}
        </div>
        <div class="project-card-body"><div class="project-card-title"><div><span class="status-chip active">${escapeHTML(stage.label)}</span><h2>${escapeHTML(project.name || `${t.project} ${index + 1}`)}</h2></div><strong>${stage.progress}%</strong></div>
        <div class="onboarding-progress"><span style="width:${stage.progress}%"></span></div>
        <dl class="project-meta"><div><dt>${escapeHTML(t.stage)}</dt><dd>${escapeHTML(stage.label)}</dd></div><div><dt>${escapeHTML(t.onboardingStatus)}</dt><dd>${escapeHTML(onboarding ? t.completed : hasMatchingDraft ? t.inProgress : t.notStarted)}</dd></div>${project.lastUpdated ? `<div><dt>${escapeHTML(t.updated)}</dt><dd>${escapeHTML(formatDate(project.lastUpdated))}</dd></div>` : ''}</dl>
        <div class="project-actions">${url ? `<button type="button" class="btn" data-action="preview-project" data-project-index="${index}">${icon('eye')}${escapeHTML(t.preview)}</button><a class="btn btn-primary" href="${escapeHTML(url.href)}" target="_blank" rel="noopener noreferrer">${icon('external')}${escapeHTML(t.openProject)}</a>` : ''}${onboardingAction(onboardingStateKey, project.id, 'btn')}</div></div>
    </article>`;
}

/** Newest delivery of a project, or of the account when it has no project id. */
function latestSubmissionForProject(projectId) {
    const matching = currentOnboardingSubmissions
        .filter(submission => submissionMatchesProject(submission, projectId));
    // currentOnboardingSubmissions is already sorted newest first
    return matching[0] || null;
}

/**
 * The onboarding is filled by the Elysium team together with the client, so the
 * portal never links to the form: it either opens the published delivery or
 * explains where the onboarding comes from.
 */
function onboardingAction(state, projectId, className = 'btn') {
    if (state === 'completed') {
        const submission = latestSubmissionForProject(projectId);
        if (submission) {
            return `<button type="button" class="${className}" data-action="review-onboarding" data-submission-id="${escapeHTML(submission._documentId)}">${icon('eye')}${escapeHTML(t.viewOnboarding)}</button>`;
        }
    }
    return `<span class="onboarding-guided-note">${escapeHTML(state === 'in-progress' ? t.onboardingInSession : t.onboardingGuided)}</span>`;
}

function submissionProjectMeta(submission) {
    const projectId = submission?.projectId == null || String(submission.projectId).length === 0
        ? null
        : String(submission.projectId);
    const project = projectId == null
        ? null
        : normalizeProjects(currentUserData).find(item => String(item.id) === projectId);
    return {
        id: projectId,
        name: project?.name || (projectId ? `${t.project} · ${projectId}` : t.accountOnboarding)
    };
}

function onboardingSubmissionGroups() {
    const groups = new Map();
    currentOnboardingSubmissions.forEach(submission => {
        const project = submissionProjectMeta(submission);
        const key = project.id == null ? '\u0000account' : `project:${project.id}`;
        if (!groups.has(key)) groups.set(key, { project, submissions: [] });
        groups.get(key).submissions.push(submission);
    });
    return Array.from(groups.values())
        .map(group => ({ ...group, submissions: group.submissions.sort(compareOnboardingSubmissions) }))
        .sort((a, b) => compareOnboardingSubmissions(a.submissions[0], b.submissions[0]));
}

function chronologicalDeliveryNumbers(submissions) {
    const chronological = [...submissions].sort((a, b) => {
        const dateDifference = timestampMillis(a.submittedAt) - timestampMillis(b.submittedAt);
        return dateDifference || String(a._documentId || '').localeCompare(String(b._documentId || ''));
    });
    return new Map(chronological.map((submission, index) => [submission._documentId, index + 1]));
}

function renderOnboardingsSection() {
    const section = document.getElementById('portal-onboardings');
    if (!section || !currentUserData) return;
    const errorNotice = onboardingHistoryError
        ? `<div class="portal-alert warning" role="alert">${escapeHTML(t.onboardingHistoryUnavailable)}</div>`
        : '';
    const groups = onboardingSubmissionGroups();
    const history = groups.length
        ? `<div class="onboarding-history">${groups.map(onboardingProjectGroup).join('')}</div>`
        : `<article class="portal-card">${emptyState(t.onboardingHistoryEmpty)}</article>`;
    section.innerHTML = `${sectionHeader('onboardings', t.onboardingHistoryTitle, t.onboardingHistoryLead)}${errorNotice}${history}`;
}

function onboardingProjectGroup(group, groupIndex) {
    const numbers = chronologicalDeliveryNumbers(group.submissions);
    const headingId = `onboarding-project-${groupIndex}`;
    const countLabel = group.submissions.length === 1 ? t.deliveryNumber.toLocaleLowerCase(locale) : t.deliveries;
    return `<section class="onboarding-history-group" aria-labelledby="${headingId}">
        <header class="onboarding-history-group-header">
            <div><span>${escapeHTML(t.project)}</span><h2 id="${headingId}">${escapeHTML(group.project.name)}</h2>${group.project.id ? `<small>${escapeHTML(t.projectIdentifier)}: ${escapeHTML(group.project.id)}</small>` : ''}</div>
            <span class="onboarding-history-count">${group.submissions.length} ${escapeHTML(countLabel)}</span>
        </header>
        <ol class="onboarding-delivery-list">${group.submissions.map(submission => onboardingDeliveryCard(submission, numbers.get(submission._documentId))).join('')}</ol>
    </section>`;
}

function onboardingDeliveryCard(submission, deliveryNumber) {
    const version = Math.max(1, Math.floor(Number(submission.formVersion) || 1));
    return `<li class="onboarding-delivery-card">
        <div class="onboarding-delivery-number" aria-hidden="true">${deliveryNumber}</div>
        <div class="onboarding-delivery-content">
            <div class="onboarding-delivery-heading"><div><span>${escapeHTML(`${t.deliveryNumber} #${deliveryNumber}`)}</span><h3>${escapeHTML(formatDate(submission.submittedAt))}</h3></div><span class="status-chip completed">${escapeHTML(t.submitted)}</span></div>
            <dl class="onboarding-delivery-meta">
                <div><dt>${escapeHTML(t.date)}</dt><dd>${escapeHTML(formatDate(submission.submittedAt))}</dd></div>
                <div><dt>${escapeHTML(t.currentPlan)}</dt><dd>${escapeHTML(planLabel(submission.planType))}</dd></div>
                <div><dt>${escapeHTML(t.version)}</dt><dd>v${version}</dd></div>
                <div><dt>${escapeHTML(t.status)}</dt><dd>${escapeHTML(t.submitted)}</dd></div>
            </dl>
            <div class="onboarding-delivery-actions">
                <button type="button" class="btn btn-primary" data-action="review-onboarding" data-submission-id="${escapeHTML(submission._documentId)}">${icon('eye')}${escapeHTML(t.viewReview)}</button>
            </div>
        </div>
    </li>`;
}

function humanizeSubmissionField(key) {
    const words = String(key).replace(/[_-]+/g, ' ').trim();
    return words ? words.charAt(0).toLocaleUpperCase(locale) + words.slice(1) : '—';
}

function submissionValueText(value) {
    if (value === true) return t.yes;
    if (value === false) return t.no;
    if (value == null || value === '') return '—';
    if (Array.isArray(value)) {
        if (!value.length) return '—';
        return value.map(item => {
            if (item && typeof item === 'object') {
                try { return JSON.stringify(item); } catch (_) { return String(item); }
            }
            return String(item);
        }).join(' · ');
    }
    if (typeof value === 'object') {
        try { return JSON.stringify(value); } catch (_) { return String(value); }
    }
    return String(value);
}

function renderSubmissionReviewFields(formData) {
    if (!formData || typeof formData !== 'object' || Array.isArray(formData)) return emptyState(t.noSubmittedInformation);
    const fields = Object.entries(formData)
        .filter(([key]) => key !== 'uploaded_files')
        .map(([key, value]) => `<div class="onboarding-review-field"><dt>${escapeHTML(humanizeSubmissionField(key))}</dt><dd>${escapeHTML(submissionValueText(value))}</dd></div>`)
        .join('');
    return fields ? `<dl class="onboarding-review-fields">${fields}</dl>` : emptyState(t.noSubmittedInformation);
}

function renderSubmissionReviewFiles(formData) {
    const files = Array.isArray(formData?.uploaded_files)
        ? formData.uploaded_files.filter(file => file && typeof file === 'object')
        : [];
    if (!files.length) return '';
    return `<section class="onboarding-review-files" aria-labelledby="onboarding-review-files-title"><h3 id="onboarding-review-files-title">${escapeHTML(t.submittedFiles)}</h3><ul>${files.map((file, index) => {
        const url = safeHttpUrl(file.url);
        const name = file.name || `${t.submittedFiles} ${index + 1}`;
        const category = file.category ? humanizeSubmissionField(file.category) : '';
        return `<li>${icon('file')}<div><strong>${escapeHTML(name)}</strong>${category ? `<span>${escapeHTML(category)}</span>` : ''}</div>${url ? `<a class="btn" href="${escapeHTML(url.href)}" target="_blank" rel="noopener noreferrer">${escapeHTML(t.download)}</a>` : ''}</li>`;
    }).join('')}</ul></section>`;
}

function openOnboardingSubmission(submissionId) {
    const submission = currentOnboardingSubmissions.find(item => item._documentId === submissionId);
    if (!submission) return;
    const project = submissionProjectMeta(submission);
    const projectSubmissions = currentOnboardingSubmissions.filter(item => submissionProjectMeta(item).id === project.id);
    const deliveryNumber = chronologicalDeliveryNumbers(projectSubmissions).get(submission._documentId);
    const version = Math.max(1, Math.floor(Number(submission.formVersion) || 1));
    lastFocusedElement = document.activeElement;
    openModal(`<div class="onboarding-review">
        <span class="portal-eyebrow">${escapeHTML(`${t.deliveryNumber} #${deliveryNumber}`)}</span>
        <h2 id="portal-dialog-title">${escapeHTML(t.submissionDetails)}</h2>
        <p>${escapeHTML(project.name)}</p>
        <dl class="onboarding-review-summary"><div><dt>${escapeHTML(t.date)}</dt><dd>${escapeHTML(formatDate(submission.submittedAt))}</dd></div><div><dt>${escapeHTML(t.currentPlan)}</dt><dd>${escapeHTML(planLabel(submission.planType))}</dd></div><div><dt>${escapeHTML(t.version)}</dt><dd>v${version}</dd></div><div><dt>${escapeHTML(t.status)}</dt><dd><span class="status-chip completed">${escapeHTML(t.submitted)}</span></dd></div></dl>
        <section class="onboarding-review-information" aria-labelledby="onboarding-review-information-title"><h3 id="onboarding-review-information-title">${escapeHTML(t.submittedInformation)}</h3>${renderSubmissionReviewFields(submission.formData)}</section>
        ${renderSubmissionReviewFiles(submission.formData)}
        <div class="portal-actions"><button type="button" class="btn btn-primary" data-action="close-modal">${escapeHTML(t.close)}</button></div>
    </div>`);
}

function renderDocumentsSection() {
    const section = document.getElementById('portal-documents');
    if (!section || !currentUserData) return;
    const documents = normalizeProjects(currentUserData).flatMap((project, projectIndex) =>
        (Array.isArray(project.reports) ? project.reports : []).map(report => ({ ...report, projectName: project.name, projectIndex }))
    );
    const rows = documents.map((report, index) => {
        const url = safeHttpUrl(report.url);
        return `<li class="document-row"><div class="document-icon">${icon('file')}</div><div><strong>${escapeHTML(report.title || `${t.documents} ${index + 1}`)}</strong><span>${escapeHTML(report.projectName || t.project)}${report.date ? ` · ${escapeHTML(formatDate(report.date))}` : ''}</span></div>${report.amount ? `<span>${escapeHTML(formatMoney(report.amount, report.currency || 'EUR'))}</span>` : ''}${url ? `<a class="btn" href="${escapeHTML(url.href)}" target="_blank" rel="noopener noreferrer">${escapeHTML(t.download)}</a>` : ''}</li>`;
    }).join('');
    section.innerHTML = `${sectionHeader('documents', t.documentsTitle, t.documentsLead)}<article class="portal-card">${rows ? `<ul class="document-list">${rows}</ul>` : emptyState(t.noDocuments)}</article>`;
}

function renderSubscriptionSection() {
    const section = document.getElementById('portal-subscription');
    if (!section || !currentUserData) return;
    const sub = currentUserData.subscription;
    const status = subscriptionStatus(sub);
    const plans = Object.keys(PLANS).filter(key => !PLANS[key].retired);
    section.innerHTML = `
        ${sectionHeader('subscription', t.subscriptionTitle, t.subscriptionLead)}
        ${sub ? `<article class="portal-card current-subscription"><div><span>${escapeHTML(t.currentPlan)}</span><h2>${escapeHTML(planLabel(sub.planType))}</h2><span class="status-chip ${escapeHTML(status)}">${escapeHTML(t[status] || status)}</span></div><dl><div><dt>${escapeHTML(t.nextRenewal)}</dt><dd>${escapeHTML(sub.nextBillingDate ? formatDate(sub.nextBillingDate) : t.noRenewal)}</dd></div><div><dt>${escapeHTML(t.license)}</dt><dd>${escapeHTML(sub.licenseCode || '—')}</dd></div></dl></article>` : ''}
        <div class="billing-cycle-toggle" role="group" aria-label="${escapeHTML(t.subscription)}"><button type="button" data-action="billing-cycle" data-cycle="monthly" aria-pressed="${selectedBillingCycle === 'monthly'}" class="${selectedBillingCycle === 'monthly' ? 'active' : ''}">${escapeHTML(t.monthly)}</button><button type="button" data-action="billing-cycle" data-cycle="annual" aria-pressed="${selectedBillingCycle === 'annual'}" class="${selectedBillingCycle === 'annual' ? 'active' : ''}">${escapeHTML(t.annual)} <small>${escapeHTML(t.twoMonthsIncluded)}</small></button></div>
        <div class="plan-grid">${plans.map(planCard).join('')}</div>
    `;
}

function planCard(planType) {
    const plan = PLANS[planType];
    const currentStatus = subscriptionStatus(currentUserData.subscription);
    const current = currentUserData.subscription?.planType === planType
        && ['active', 'pending_payment'].includes(currentStatus);
    const cycle = planType === 'hosting' ? 'annual' : selectedBillingCycle;
    const price = plan.price[cycle];
    const features = { hosting: t.hostingFeatures, basic: t.basicFeatures, preferential: t.preferentialFeatures, advanced: t.advancedFeatures }[planType];
    return `<article class="plan-card${planType === 'preferential' ? ' featured' : ''}${current ? ' current' : ''}">${planType === 'preferential' ? `<span class="plan-badge">${escapeHTML(t.mostPopular)}</span>` : ''}<div><span class="plan-code">${escapeHTML(plan.code)}</span><h2>${escapeHTML(planLabel(planType))}</h2><p class="plan-price">${escapeHTML(formatMoney(price, 'EUR'))}<small>${escapeHTML(cycle === 'annual' ? t.perYear : t.perMonth)}</small></p><ul>${features.map(feature => `<li>${icon('check')}${escapeHTML(feature)}</li>`).join('')}</ul></div><button type="button" class="btn ${current ? '' : 'btn-primary'}" ${current ? 'disabled' : `data-action="choose-plan" data-plan="${planType}"`}>${escapeHTML(current ? t.currentPlanButton : currentUserData.subscription ? t.contactPlan : t.selectPlan)}</button></article>`;
}

function renderBillingSection() {
    const section = document.getElementById('portal-billing');
    if (!section) return;
    let content;
    if (billingLoading) content = `<div class="portal-loading"><span class="premium-loader"></span><span>${escapeHTML(t.loadingAccount)}</span></div>`;
    else if (billingHistory === null) content = `<div class="portal-empty"><p>${escapeHTML(t.billingLead)}</p><button type="button" class="btn btn-primary" data-action="load-billing">${escapeHTML(t.loadPayments)}</button></div>`;
    else if (billingHistory.error) content = `<div class="portal-empty error"><p>${escapeHTML(t.paymentUnavailable)}</p><button type="button" class="btn btn-primary" data-action="retry-billing">${escapeHTML(t.retry)}</button></div>`;
    else if (!billingHistory.length) content = emptyState(t.noPayments);
    else content = billingTable(billingHistory);
    section.innerHTML = `${sectionHeader('billing', t.billingTitle, t.billingLead)}<article class="portal-card">${content}</article>`;
}

function billingTable(payments) {
    const rows = payments.map(payment => {
        const invoice = safeHttpUrl(payment.invoiceUrl);
        const method = payment.source === 'manual' || payment.method === 'manual' ? t.manual : t.online;
        return `<tr><td>${escapeHTML(formatDate(payment.paymentDate))}</td><td><strong>${escapeHTML(formatMoney(payment.amount, payment.currency || 'EUR'))}</strong></td><td>${escapeHTML(planLabel(payment.planType))}</td><td>${escapeHTML(method)}</td><td>${invoice ? `<a href="${escapeHTML(invoice.href)}" target="_blank" rel="noopener noreferrer">${escapeHTML(t.viewInvoice)}</a>` : '—'}</td></tr>`;
    }).join('');
    return `<div class="billing-table-wrap"><table class="billing-table"><caption class="sr-only">${escapeHTML(t.billingTitle)}</caption><thead><tr><th scope="col">${escapeHTML(t.date)}</th><th scope="col">${escapeHTML(t.amount)}</th><th scope="col">${escapeHTML(t.currentPlan)}</th><th scope="col">${escapeHTML(t.method)}</th><th scope="col">${escapeHTML(t.invoice)}</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

async function loadBillingHistory(force = false) {
    if (!currentUser || billingLoading || (billingHistory !== null && !force)) return;
    const userId = currentUser.uid;
    const loadVersion = ++billingLoadVersion;
    billingLoading = true;
    renderBillingSection();
    try {
        const result = await getDocs(query(collection(db, 'subscription_payments'), where('userId', '==', userId)));
        if (loadVersion !== billingLoadVersion || currentUser?.uid !== userId) return;
        billingHistory = result.docs.map(item => ({ id: item.id, ...item.data() })).sort((a, b) => timestampMillis(b.paymentDate) - timestampMillis(a.paymentDate));
    } catch (error) {
        if (loadVersion !== billingLoadVersion || currentUser?.uid !== userId) return;
        logger.error('[portal] billing history', error);
        billingHistory = { error: true };
    } finally {
        if (loadVersion !== billingLoadVersion || currentUser?.uid !== userId) return;
        billingLoading = false;
        renderBillingSection();
    }
}

function renderProfileSection() {
    const section = document.getElementById('portal-profile');
    if (!section || !currentUserData || !currentUser) return;
    section.innerHTML = `
        ${sectionHeader('profile', t.profileTitle, t.profileLead)}
        <div class="portal-grid portal-grid-profile">
            <article class="portal-card"><form id="portal-profile-form" class="profile-form"><div class="profile-form-grid">
                ${profileField('profile-full-name', t.fullName, currentUserData.name || currentUser.displayName || '', 'text', 'name', true, false, 120)}
                ${profileField('profile-company', t.company, currentUserData.company || '', 'text', 'organization', false, false, 120)}
                ${profileField('profile-email', t.email, currentUser.email || currentUserData.email || '', 'email', 'email', false, true, 254)}
                ${profileField('profile-phone', t.phone, currentUserData.phone || '', 'tel', 'tel', false, false, 40)}
                ${profileField('profile-billing-email', t.billingEmail, currentUserData.billingEmail || '', 'email', 'email', false, false, 254)}
                <label class="portal-field" for="profile-language"><span>${escapeHTML(t.language)}</span><select id="profile-language" name="preferredLanguage"><option value="en" ${currentUserData.preferredLanguage === 'en' ? 'selected' : ''}>English</option><option value="es" ${currentUserData.preferredLanguage === 'es' || !currentUserData.preferredLanguage && currentLang === 'es' ? 'selected' : ''}>Español</option><option value="pt" ${currentUserData.preferredLanguage === 'pt' || !currentUserData.preferredLanguage && currentLang === 'pt' ? 'selected' : ''}>Português</option></select></label>
            </div><div class="portal-actions"><button type="submit" class="btn btn-primary">${escapeHTML(t.saveChanges)}</button><span id="profile-save-status" role="status" aria-live="polite"></span></div></form></article>
            <article class="portal-card security-card"><span>${icon('lock')}</span><h2>${escapeHTML(t.security)}</h2><p><span class="status-chip ${currentUser.emailVerified ? 'completed' : 'warning'}">${escapeHTML(currentUser.emailVerified ? t.emailVerified : t.emailNotVerified)}</span></p><div class="portal-actions">${currentUser.emailVerified ? '' : `<button type="button" class="btn" data-action="verify-email">${escapeHTML(t.verifyEmail)}</button>`}<button type="button" class="btn btn-primary" data-action="send-password-email">${escapeHTML(t.changePassword)}</button></div><small>${escapeHTML(t.secureSender)}</small></article>
        </div>`;
}

function profileField(id, label, value, type, autocomplete, required = false, readonly = false, maxLength = 160) {
    return `<label class="portal-field" for="${id}"><span>${escapeHTML(label)}</span><input id="${id}" name="${id}" type="${type}" value="${escapeHTML(value)}" autocomplete="${autocomplete}" maxlength="${maxLength}" ${required ? 'required' : ''} ${readonly ? 'readonly aria-readonly="true"' : ''}></label>`;
}

async function saveProfile(event) {
    event.preventDefault();
    if (!currentUser || !currentUserData) return;
    const user = currentUser;
    const userId = user.uid;
    const form = event.target;
    const button = form.querySelector('button[type="submit"]');
    const status = document.getElementById('profile-save-status');
    const name = form.querySelector('#profile-full-name')?.value.trim() || '';
    const company = form.querySelector('#profile-company')?.value.trim() || '';
    const phone = form.querySelector('#profile-phone')?.value.trim() || '';
    const billingEmail = form.querySelector('#profile-billing-email')?.value.trim().toLowerCase() || '';
    const preferredLanguage = form.querySelector('#profile-language')?.value || currentLang;
    if (!form.reportValidity()) return;
    if (!name) {
        if (status) status.textContent = t.requiredName;
        return;
    }
    if ([name, company, phone, billingEmail].some(value => /[<>]/.test(value))) {
        if (status) status.textContent = t.profileSaveError;
        return;
    }
    button.disabled = true;
    button.textContent = t.saving;
    if (status) status.textContent = '';
    try {
        const updates = { name, company: company || null, phone: phone || null, billingEmail: billingEmail || null, preferredLanguage, lastUpdated: serverTimestamp() };
        await updateDoc(doc(db, 'members', userId), updates);
        try {
            await updateProfile(user, { displayName: name });
        } catch (error) {
            logger.warn('[portal] auth display name update', error);
        }
        if (currentUser?.uid !== userId) return;
        currentUserData = { ...currentUserData, ...updates };
        profileFormDirty = false;
        if (status) status.textContent = t.profileSaved;
        playSound('success');
        setIdentity();
        if (preferredLanguage !== currentLang) {
            changeLanguage(preferredLanguage);
        }
    } catch (error) {
        logger.error('[portal] profile update', error);
        if (status) status.textContent = t.profileSaveError;
        playSound('error');
    } finally {
        button.disabled = false;
        button.textContent = t.saveChanges;
    }
}

/**
 * Los planes se contratan hablando con el equipo: la suscripción y su licencia
 * las asigna el administrador desde el CRM. No hay cobro con tarjeta en el
 * portal, así que el diálogo solo abre la petición por correo.
 */
function showPlanDialog(planType) {
    const plan = PLANS[planType];
    if (!plan || plan.retired) return;
    lastFocusedElement = document.activeElement;
    openModal(`
        <span class="portal-eyebrow">${escapeHTML(plan.code)}</span><h2 id="portal-dialog-title">${escapeHTML(t.planDialogTitle)}</h2><h3>${escapeHTML(planLabel(planType))}</h3>
        <p>${escapeHTML(t.planRequestBody)}</p>
        <div class="portal-actions vertical"><a class="btn btn-primary" href="${safeMailto(`${t.planDialogTitle}: ${planLabel(planType)}`)}">${escapeHTML(t.contactUs)}</a><button type="button" class="btn" data-action="close-modal">${escapeHTML(t.close)}</button></div>
    `);
}

function openProjectPreview(index) {
    const project = normalizeProjects(currentUserData)[index];
    const url = safeHttpUrl(project?.projectUrl);
    if (!project || !url) return;
    lastFocusedElement = document.activeElement;
    /* `allow-same-origin` es imprescindible: sin él el marco recibe un origen
       opaco y `localStorage` lanza SecurityError. Las aplicaciones que servimos
       lo tocan al arrancar, así que React no llegaba a montar y la vista previa
       salía en blanco —solo el color de fondo del proyecto—. Concederlo aquí es
       seguro porque `canEmbedProject` limita el marco a sitios propios. */
    const preview = canEmbedProject(url)
        ? `<div class="portal-modal-preview"><iframe src="${escapeHTML(url.href)}" title="${escapeHTML(`${t.previewTitle}: ${project.name || t.project}`)}" sandbox="allow-scripts allow-forms allow-popups allow-same-origin" referrerpolicy="no-referrer"></iframe></div>`
        : `<div class="portal-empty"><p>${escapeHTML(t.previewUnavailable)}</p></div>`;
    openModal(`<h2 id="portal-dialog-title">${escapeHTML(project.name || t.previewTitle)}</h2>${preview}<div class="portal-actions"><a class="btn btn-primary" href="${escapeHTML(url.href)}" target="_blank" rel="noopener noreferrer">${escapeHTML(t.openProject)}</a><button type="button" class="btn" data-action="close-modal">${escapeHTML(t.close)}</button></div>`);
}

function openModal(content) {
    const root = document.getElementById('portal-modal-root');
    if (!root) return;
    root.innerHTML = `<div class="portal-modal" role="dialog" aria-modal="true" aria-labelledby="portal-dialog-title"><div class="portal-modal-card"><button type="button" class="portal-modal-close" data-action="close-modal" aria-label="${escapeHTML(t.close)}">×</button>${content}</div></div>`;
    root.querySelector('.portal-modal')?.addEventListener('mousedown', event => { if (event.target === event.currentTarget) closeModal(); });
    root.querySelector('button, a')?.focus();
}

function closeModal() {
    const root = document.getElementById('portal-modal-root');
    if (root) root.innerHTML = '';
    lastFocusedElement?.focus?.();
    lastFocusedElement = null;
}

function trapModalFocus(event) {
    const modal = document.querySelector('.portal-modal');
    if (!modal) return;
    const focusable = Array.from(modal.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
}

async function requestSignedInPasswordEmail(button) {
    if (!currentUser?.email) return;
    button.disabled = true;
    try {
        auth.languageCode = currentLang;
        const { sender } = await sendResetEmail(currentUser.email);
        portalAlert(`${t.passwordEmailSent} ${resetSenderCopy(sender)}`, 'success');
        playSound('success');
    } catch (error) {
        logger.error('[portal] password email', error);
        portalAlert(resetErrorMessage(error), 'error');
    } finally {
        button.disabled = false;
    }
}

async function requestVerificationEmail(button) {
    if (!currentUser) return;
    button.disabled = true;
    try {
        auth.languageCode = currentLang;
        await sendVerification(currentUser);
        portalAlert(t.verificationSent, 'success');
        playSound('success');
    } catch (error) {
        logger.error('[portal] verification email', error);
        portalAlert(resetErrorMessage(error), 'error');
    } finally {
        button.disabled = false;
    }
}

let verificationRefreshInFlight = false;
async function refreshVerificationState() {
    const user = currentUser;
    if (!user || user.uid === 'local-preview' || user.emailVerified || verificationRefreshInFlight) return;
    verificationRefreshInFlight = true;
    try {
        await reloadUser(user);
        if (currentUser?.uid === user.uid && user.emailVerified) renderDashboard();
    } catch (error) {
        logger.warn('[auth] verification refresh', error?.code || error);
    } finally {
        verificationRefreshInFlight = false;
    }
}

async function sendVerification(user) {
    try {
        await sendEmailVerification(user, { url: `${window.location.origin}${localizedProfilePath()}` });
    } catch (error) {
        const fallbackCodes = ['auth/unauthorized-continue-uri', 'auth/invalid-continue-uri', 'auth/missing-continue-uri'];
        if (!fallbackCodes.includes(error?.code)) throw error;
        logger.warn(`[email-verification] continue URL rejected: ${error.code}`);
        await sendEmailVerification(user);
    }
}

async function sendFirebaseResetEmail(email) {
    try {
        await sendPasswordResetEmail(auth, email, { url: `${window.location.origin}${localizedProfilePath()}`, handleCodeInApp: false });
    } catch (error) {
        const fallbackCodes = ['auth/unauthorized-continue-uri', 'auth/invalid-continue-uri', 'auth/missing-continue-uri'];
        if (!fallbackCodes.includes(error?.code)) throw error;
        logger.warn(`[password-reset] continue URL rejected: ${error.code}`);
        await sendPasswordResetEmail(auth, email);
    }
}

/* ── Quién manda el correo de recuperación ───────────────────────────────────
   Primero el backend: /api/auth/password-reset genera el enlace con el Admin
   SDK y lo envía por SMTP desde info@elysiumdr.eu, el mismo buzón que ya manda
   los correos de la agenda. Firebase queda de reserva.

   El orden importa porque Firebase envía desde
   noreply@elysiumdr-eu.firebaseapp.com, una dirección que no alinea con el
   dominio: los proveedores la descartan en silencio y el remitente no se entera
   de nada. El correo salía, pero no llegaba.

   Este endpoint ya existió aquí y se retiró porque entonces no estaba
   desplegado; peor aún, una respuesta inesperada se tomaba por éxito y no se
   enviaba nada. Por eso ahora solo cuenta como enviado un 202 con `ok: true`
   literal: cualquier otra cosa —otro estado, un cuerpo raro, un fallo de red o
   un timeout— cae a Firebase, que al menos lo intenta.
   ─────────────────────────────────────────────────────────────────────────── */

const RESET_API_TIMEOUT_MS = 15000;

function platformApiOrigin() {
    return String(window.ELYSIUM_API_URL || '').trim().replace(/\/$/, '');
}

/** Devuelve true solo si el backend confirma el envío. Nunca lanza. */
async function sendBrandedResetEmail(email) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), RESET_API_TIMEOUT_MS);
    try {
        const response = await fetch(`${platformApiOrigin()}/api/auth/password-reset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, locale: currentLang }),
            signal: controller.signal
        });
        if (response.status !== 202) return false;
        const payload = await response.json().catch(() => null);
        return payload?.ok === true;
    } catch (error) {
        logger.warn(`[password-reset] branded sender unavailable: ${error?.name || error}`);
        return false;
    } finally {
        window.clearTimeout(timer);
    }
}

async function sendResetEmail(email) {
    if (await sendBrandedResetEmail(email)) return { sender: 'elysium' };
    await sendFirebaseResetEmail(email);
    return { sender: 'firebase' };
}

function resetSenderCopy(sender) {
    return sender === 'elysium' ? t.secureSenderElysium : t.secureSenderFirebase;
}

function resetErrorMessage(error) {
    if (error?.code === 'auth/invalid-email') return t.resetInvalid;
    // Firebase's own rate limit, not a local one: it clears on its own.
    if (error?.code === 'auth/too-many-requests') return t.resetTooMany;
    if (error?.code === 'auth/network-request-failed' || error?.name === 'AbortError') return t.resetNetwork;
    return t.resetFailed;
}

function setupAuthNavigation() {
    const handlers = {
        'show-signup': 'signup', 'show-login': 'login', 'show-reset-password': 'reset', 'back-to-login': 'login',
        'show-prospect-from-signup': 'prospect', 'show-login-from-prospect': 'login', 'show-signup-from-prospect': 'signup'
    };
    Object.entries(handlers).forEach(([id, view]) => document.getElementById(id)?.addEventListener('click', event => { event.preventDefault(); showAuthView(view); }));
    document.getElementById('show-reset-password')?.addEventListener('click', () => {
        const loginEmail = document.getElementById('login-email')?.value.trim();
        if (loginEmail) document.getElementById('reset-email').value = loginEmail;
    });
    const clientToggle = document.getElementById('prospect-is-client');
    clientToggle?.addEventListener('change', event => syncProspectClientFields(event.target.checked));
}

function syncProspectClientFields(isClient) {
    const group = document.getElementById('prospect-license-group');
    const input = document.getElementById('prospect-license');
    group?.classList.toggle('hidden', !isClient);
    input?.toggleAttribute('required', Boolean(isClient));
    if (!isClient && input) input.value = '';
}

function enhanceAuthForms() {
    const attributes = {
        'login-email': ['email', 'username'], 'login-password': ['password', 'current-password'], 'reset-email': ['email', 'email'],
        'signup-name': ['text', 'name'], 'signup-company': ['text', 'organization'], 'signup-email': ['email', 'email'],
        'signup-password': ['password', 'new-password'], 'signup-password-repeat': ['password', 'new-password'],
        'prospect-name': ['text', 'name'], 'prospect-company': ['text', 'organization'], 'prospect-email': ['email', 'email'],
        'prospect-license': ['text', 'off'], 'prospect-description': ['text', 'off']
    };
    Object.entries(attributes).forEach(([id, [type, autocomplete]]) => {
        const input = document.getElementById(id);
        if (!input) return;
        if (input instanceof HTMLInputElement) input.type = type;
        input.autocomplete = autocomplete;
        const label = input.closest('.form-group')?.querySelector('label');
        if (label) label.htmlFor = id;
    });
    document.getElementById('signup-password')?.setAttribute('minlength', '8');
    document.getElementById('signup-password-repeat')?.setAttribute('minlength', '8');
    document.getElementById('signup-name')?.setAttribute('maxlength', '120');
    document.getElementById('signup-company')?.setAttribute('maxlength', '120');
    document.getElementById('signup-email')?.setAttribute('maxlength', '254');
    document.getElementById('prospect-name')?.setAttribute('maxlength', '120');
    document.getElementById('prospect-company')?.setAttribute('maxlength', '120');
    document.getElementById('prospect-email')?.setAttribute('maxlength', '254');
    document.getElementById('prospect-description')?.setAttribute('maxlength', '2000');
}

DOM.loginForm?.addEventListener('submit', async event => {
    event.preventDefault();
    clearAuthMessage();
    // `event.currentTarget` is null after the first await: keep the form itself.
    const form = event.currentTarget;
    const button = form.querySelector('button[type="submit"]');
    const email = document.getElementById('login-email')?.value.trim().toLowerCase() || '';
    const password = document.getElementById('login-password')?.value || '';
    button.disabled = true;
    try {
        auth.languageCode = currentLang;
        await signInWithEmailAndPassword(auth, email, password);
        form.reset();
        playSound('success');
    } catch (error) {
        logger.error('[auth] sign in', error?.code || error);
        authMessage(t.invalidCredentials);
        button.disabled = false;
    }
});

DOM.resetForm?.addEventListener('submit', async event => {
    event.preventDefault();
    // `event.currentTarget` is null after the first await: keep the form itself.
    const form = event.currentTarget;
    const button = form.querySelector('button[type="submit"]');
    const original = button.textContent;
    const email = document.getElementById('reset-email')?.value.trim().toLowerCase() || '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return authMessage(t.resetInvalid);
    button.disabled = true;
    button.textContent = t.resetSending;
    clearAuthMessage();
    auth.languageCode = currentLang;
    try {
        const { sender } = await sendResetEmail(email);
        authMessage(`${t.resetNotice.replace('{email}', email)} ${resetSenderCopy(sender)}`, 'notice');
        form.reset();
        playSound('success');
    } catch (error) {
        logger.error('[auth] password reset', error?.code || error);
        // A missing account is never revealed: Firebase's enumeration
        // protection makes that indistinguishable from a successful send.
        if (error?.code === 'auth/user-not-found') {
            authMessage(`${t.resetNotice.replace('{email}', email)} ${resetSenderCopy('firebase')}`, 'notice');
            form.reset();
        } else {
            authMessage(resetErrorMessage(error), 'error');
        }
    } finally {
        // No local cooldown: a failed attempt must be retriable straight away.
        button.disabled = false;
        button.textContent = original;
    }
});

DOM.signupForm?.addEventListener('submit', async event => {
    event.preventDefault();
    registrationInFlight = true;
    // `event.currentTarget` is null after the first await: keep the form itself.
    const form = event.currentTarget;
    const button = form.querySelector('button[type="submit"]');
    const name = document.getElementById('signup-name')?.value.trim() || '';
    const company = document.getElementById('signup-company')?.value.trim() || '';
    const email = document.getElementById('signup-email')?.value.trim().toLowerCase() || '';
    const password = document.getElementById('signup-password')?.value || '';
    const repeat = document.getElementById('signup-password-repeat')?.value || '';
    if (!name) { registrationInFlight = false; return authMessage(t.requiredName); }
    if (/[<>]/.test(name) || /[<>]/.test(company)) { registrationInFlight = false; return authMessage(t.registrationFailed); }
    if (password.length < 8) { registrationInFlight = false; return authMessage(t.passwordShort); }
    if (password !== repeat) { registrationInFlight = false; return authMessage(t.passwordMismatch); }
    button.disabled = true;
    clearAuthMessage();
    let createdUser = null;
    try {
        auth.languageCode = currentLang;
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        createdUser = credential.user;
        try {
            await updateProfile(credential.user, { displayName: name });
        } catch (error) {
            logger.warn('[auth] display name update', error);
        }
        await setDoc(doc(db, 'members', credential.user.uid), {
            name, company: company || null, email, role: 'partner', subscription: null,
            onboardingCompleted: false, createdAt: serverTimestamp()
        });
        addDoc(collection(db, 'activities'), {
            memberId: credential.user.uid, memberName: name, type: 'member_registered', payload: {},
            actorUid: credential.user.uid, actorEmail: email, actorRole: 'member', createdAt: serverTimestamp()
        }).catch(error => logger.warn('[auth] activity log', error));
        sendVerification(credential.user).catch(error => logger.warn('[auth] verification email', error));
        registrationInFlight = false;
        form.reset();
        button.disabled = false;
        await loadMemberDashboard(credential.user);
        playSound('success');
    } catch (error) {
        registrationInFlight = false;
        button.disabled = false;
        logger.error('[auth] registration', error?.code || error);
        if (createdUser && auth.currentUser?.uid === createdUser.uid) {
            try {
                await loadMemberDashboard(createdUser);
                sendVerification(createdUser).catch(sendError => logger.warn('[auth] verification email', sendError));
                return;
            } catch (loadError) {
                logger.error('[auth] partial registration recovery', loadError);
            }
        }
        authMessage(error?.code === 'auth/email-already-in-use' ? t.emailInUse : t.registrationFailed);
    }
});

DOM.prospectForm?.addEventListener('submit', async event => {
    event.preventDefault();
    // `event.currentTarget` is null after the first await: keep the form itself.
    const form = event.currentTarget;
    const button = form.querySelector('button[type="submit"]');
    const name = document.getElementById('prospect-name')?.value.trim() || '';
    const company = document.getElementById('prospect-company')?.value.trim() || '';
    const email = document.getElementById('prospect-email')?.value.trim().toLowerCase() || '';
    const description = document.getElementById('prospect-description')?.value.trim() || '';
    const isClient = Boolean(document.getElementById('prospect-is-client')?.checked);
    const licenseCode = document.getElementById('prospect-license')?.value.trim().toUpperCase() || '';
    const website = document.getElementById('prospect-website')?.value || '';
    if (!name || !company || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return authMessage(t.projectRequestFailed);
    if ([name, company, description].some(value => /[<>]/.test(value))) return authMessage(t.projectRequestFailed);
    if (isClient && !/^ELY-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4,20}$/.test(licenseCode)) return authMessage(t.projectRequestFailed);
    button.disabled = true;
    try {
        const response = await fetch(`${platformApiOrigin()}/api/prospects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name.slice(0, 120),
                company: company.slice(0, 120),
                email: email.slice(0, 254),
                projectDescription: description.slice(0, 2000),
                isExistingClient: isClient,
                licenseCode: isClient ? licenseCode : null,
                website
            })
        });
        if (!response.ok) throw new Error(`prospect_${response.status}`);
        form.reset();
        syncProspectClientFields(false);
        authMessage(t.projectRequestSent, 'notice');
        playSound('success');
    } catch (error) {
        logger.error('[prospect] submit', error);
        authMessage(t.projectRequestFailed);
    } finally {
        button.disabled = false;
    }
});

function handlePendingSubscriptionIntent() {
    const params = new URLSearchParams(window.location.search);
    const requestedSection = params.get('section');
    if (requestedSection && document.getElementById(`portal-${requestedSection}`)) {
        activateSection(requestedSection);
        params.delete('section');
    }
    // Anyone who reaches the form directly is sent back here: the onboarding is
    // filled by the Elysium team together with the client.
    if (['onboarding_guided', 'onboarding_requires_plan'].includes(params.get('notice'))) {
        portalAlert(t.onboardingGuided, 'notice');
        params.delete('notice');
    }
    const raw = params.get('subscribe') || sessionStorage.getItem('pending_subscribe');
    if (!raw) {
        if (params.toString() !== new URLSearchParams(window.location.search).toString()) {
            window.history.replaceState({}, document.title, `${window.location.pathname}${params.size ? `?${params}` : ''}`);
        }
        return;
    }
    const map = { domain_hosting: 'hosting', basic_maintenance: 'basic', preferential_maintenance: 'preferential', advanced_maintenance: 'advanced' };
    const plan = map[raw] || raw;
    sessionStorage.removeItem('pending_subscribe');
    params.delete('subscribe');
    window.history.replaceState({}, document.title, `${window.location.pathname}${params.size ? `?${params}` : ''}`);
    activateSection('subscription');
    if (PLANS[plan] && !PLANS[plan].retired) showPlanDialog(plan);
}

const localPreviewState = ['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? new URLSearchParams(window.location.search).get('portalPreview')
    : null;
if (localPreviewState) {
    // Deterministic, localhost-only fixture for visual QA. It never authenticates
    // or writes to Firebase and is intentionally unavailable in production.
    currentUser = {
        uid: 'local-preview',
        email: 'cliente@example.com',
        displayName: 'Alex Rivera',
        emailVerified: localPreviewState !== 'unverified',
        getIdToken: async () => ''
    };
    const previewStatus = ['pending_payment', 'suspended', 'canceled'].includes(localPreviewState)
        ? localPreviewState
        : 'active';
    currentUserData = {
        name: 'Alex Rivera',
        company: 'Atelier Norte',
        email: currentUser.email,
        phone: '+351 900 000 000',
        billingEmail: 'billing@example.com',
        preferredLanguage: currentLang,
        onboardingCompleted: localPreviewState === 'completed',
        subscription: localPreviewState === 'empty' ? null : {
            planType: 'preferential', billingCycle: 'monthly', status: previewStatus,
            source: 'manual', accessGranted: !['suspended', 'canceled'].includes(previewStatus),
            licenseCode: 'ELY-EC02-M3N1-DEMO2026', startDate: new Date('2026-06-01'),
            nextBillingDate: new Date('2026-09-01')
        },
        projects: localPreviewState === 'empty' ? [] : [{
            id: 'preview-project', name: 'Atelier Norte Digital', projectStage: 'development',
            projectUrl: `${window.location.origin}/prototype-valtrix.html`, onboardingCompleted: localPreviewState === 'completed',
            lastUpdated: new Date(), reports: [{ title: 'Monthly delivery report', date: '2026-08-01', amount: 99, currency: 'EUR', url: `${window.location.origin}/privacy.html` }]
        }]
    };
    currentDraft = currentUserData.onboardingCompleted || localPreviewState === 'empty'
        ? null
        : { projectId: 'preview-project', currentModule: 4, totalModules: 10 };
    currentDrafts = currentDraft ? [currentDraft] : [];
    currentMeetings = [{
        _documentId: 'preview-meeting',
        userId: currentUser.uid,
        title: 'Revisión de arquitectura',
        // `startAt` is the field name the platform service writes, so the
        // fixture exercises the real document shape.
        startAt: new Date(Date.now() + 36 * 3_600_000).toISOString(),
        durationMinutes: 60,
        clientTimeZone: 'America/Costa_Rica',
        meetingUrl: 'https://meet.google.com/example-preview',
        notes: 'Validar alcance y próximos hitos.',
        status: 'scheduled'
    }];
    currentOnboardingSubmissions = [
        {
            _documentId: '550e8400-e29b-41d4-a716-446655440002',
            userId: currentUser.uid,
            projectId: 'preview-project',
            planType: 'preferential',
            formVersion: 2,
            submittedAt: new Date('2026-08-03T09:30:00Z'),
            formData: {
                contact_name: 'Alex Rivera',
                company_name: 'Atelier Norte',
                project_goal: 'Launch the new multilingual digital experience.',
                site_languages: ['Português', 'English', 'Español'],
                privacy_consent: true,
                uploaded_files: [{ name: 'brand-guidelines.pdf', category: 'identity', url: `${window.location.origin}/privacy.html` }]
            }
        },
        {
            _documentId: '550e8400-e29b-41d4-a716-446655440001',
            userId: currentUser.uid,
            projectId: 'preview-project',
            planType: 'basic',
            formVersion: 1,
            submittedAt: new Date('2026-06-14T14:15:00Z'),
            formData: {
                contact_name: 'Alex Rivera',
                company_name: 'Atelier Norte',
                project_goal: 'Establish the first digital presence.',
                privacy_consent: true
            }
        }
    ].sort(compareOnboardingSubmissions);
    completedOnboardingProjectIds = new Set(['preview-project']);
    billingHistory = currentUserData.subscription ? [{
        paymentDate: new Date('2026-08-01'), amount: 99, currency: 'EUR', planType: 'preferential',
        source: 'manual', invoiceUrl: `${window.location.origin}/privacy.html`
    }] : [];
    enterDashboard();
    renderDashboard();
    handlePendingSubscriptionIntent();
} else {
    onAuthStateChanged(auth, async user => {
        if (registrationInFlight) {
            currentUser = user;
            return;
        }
        if (!user) {
            const hadSession = Boolean(currentUser);
            currentUser = null;
            currentUserData = null;
            currentDraft = null;
            currentDrafts = [];
            leaveDashboard();
            // Al perderse la sesión —el botón de salir, la expiración del token
            // o un cierre desde otra pestaña— la caché en disco se queda sin
            // dueño. Va aquí y no en el manejador del botón porque el botón es
            // solo una de las tres formas de salir.
            if (hadSession) purgeLocalCache();
            return;
        }
        // El panel de administración reutiliza esta misma sesión de Elysium.
        // Solo las cuentas con el permiso administrativo vigente se redirigen.
        const claims = await user.getIdTokenResult().then(result => result?.claims).catch(() => null);
        const normalizedEmail = String(user.email || '').toLowerCase();
        const isAdmin = claims?.admin === true || normalizedEmail === SUPER_ADMIN_EMAIL;
        const searchParams = new URLSearchParams(window.location.search);
        const isClientPreview = searchParams.get('view') === 'client'
            || searchParams.get('preview') === '1'
            || sessionStorage.getItem('client_preview') === 'true';

        if (isAdmin && !isClientPreview) {
            window.location.assign('/admin');
            return;
        }
        await loadMemberDashboard(user);
    });
}

setupAuthNavigation();
enhanceAuthForms();
window.addEventListener('focus', refreshVerificationState);
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refreshVerificationState();
});

const initialParams = new URLSearchParams(window.location.search);
if (initialParams.has('subscribe')) sessionStorage.setItem('pending_subscribe', initialParams.get('subscribe'));
