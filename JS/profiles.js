import { auth, db } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
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
    orderBy,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const initialUrlParams = new URLSearchParams(window.location.search);
if (initialUrlParams.has('subscribe')) {
    sessionStorage.setItem('pending_subscribe', initialUrlParams.get('subscribe'));
}

// ── Constants ────────────────────────────────────────────────────────────────
const SUPER_ADMIN_EMAIL = 'danielalonzzo@icloud.com';
const GRACE_PERIOD_DAYS = 15;

// Plan definitions — single source of truth
const PLANS = {
    hosting:      { code: 'H0ST', label: 'Domain & Hosting',          price: { monthly: null, annual: 99 },    period: 'annual',  tier: 1 },
    basic:        { code: 'ECO1', label: 'Basic Maintenance',          price: { monthly: 70,   annual: 700 },   period: 'monthly', tier: 2 },
    preferential: { code: 'ECO2', label: 'Preferential Maintenance',  price: { monthly: 99,   annual: 990 },   period: 'monthly', tier: 3 },
    advanced:     { code: 'ECO3', label: 'Advanced Maintenance',       price: { monthly: 120,  annual: 1200 },  period: 'monthly', tier: 4 },
    crm:          { code: 'CRMP', label: 'Custom Core CRM',            price: { monthly: 50,   annual: 500 },   period: 'monthly', tier: 4 }
};

const PERIOD_CODES = { monthly: 'M3N1', annual: 'ANL1' };

// ── License Code Generator ────────────────────────────────────────────────────
function generateLicenseCode(planType, billingCycle) {
    const plan   = PLANS[planType];
    const period = PERIOD_CODES[billingCycle] || 'M3N1';
    const now    = new Date();
    const mm     = String(now.getMonth() + 1).padStart(2, '0');
    const yy     = String(now.getFullYear()).slice(-2);
    return `ELY-${plan.code}-${period}-${mm}${yy}`;
}

// ── State ────────────────────────────────────────────────────────────────────
let isSigningUp = false;
let currentUser = null;
let currentUserData = null;

// ── DOM References ────────────────────────────────────────────────────────────
const loginView          = document.getElementById('login-view');
const signupView         = document.getElementById('signup-view');
const authSection        = document.getElementById('auth-section');
const profileSection     = document.getElementById('profile-section');
const errorMsg           = document.getElementById('error-message');
const prospectView       = document.getElementById('prospect-view');
const showSignup         = document.getElementById('show-signup');
const showLogin          = document.getElementById('show-login');
const showProspect       = document.getElementById('show-prospect');
const showProspectFromSignup  = document.getElementById('show-prospect-from-signup');
const showLoginFromProspect   = document.getElementById('show-login-from-prospect');
const showSignupFromProspect  = document.getElementById('show-signup-from-prospect');
const loginForm          = document.getElementById('login-form');
const signupForm         = document.getElementById('signup-form');
const prospectForm       = document.getElementById('prospect-form');
const logoutBtn          = document.getElementById('logoutBtn');

// ── Language detection ────────────────────────────────────────────────────────
const pathParts  = window.location.pathname.split('/');
const isEs       = pathParts.some(p => p === 'es');
const isPt       = pathParts.some(p => p === 'pt');
const lang       = isEs ? 'es' : isPt ? 'pt' : 'en';

// ── i18n strings ─────────────────────────────────────────────────────────────
const i18n = {
    en: {
        noSub_title:   "Welcome to Elysium λ",
        noSub_body:    "Your active projects will appear here once you select a subscription plan below.",
        monthly:       "Monthly",
        annual:        "Annual",
        subscribe:     "Select Plan",
        checkout_title: "Secure online subscription",
        checkout_body:  "Your license will be assigned automatically as soon as Stripe confirms the payment.",
        checkout_pay:   "Continue to secure payment",
        checkout_loading: "Opening secure payment…",
        checkout_manual: "Paying by transfer or another method? Contact us and an administrator will record the payment manually.",
        checkout_error: "Secure checkout is temporarily unavailable. Please try again or contact us.",
        checkout_processing: "Payment confirmed. We are assigning your subscription license…",
        checkout_ready: "Subscription active. Your license has been assigned automatically.",
        contact_sub_title:   "Activate your subscription",
        contact_sub_body:    "To activate this plan, contact your Elysium representative or reach us at info@elysiumdr.eu. We'll set everything up for you.",
        contact_sub_close:   "Close",
        suspended_title: "Subscription Suspended",
        suspended_body:  "Your subscription is currently suspended due to a missed payment. Please regularise your account to regain access to your dashboard.",
        suspended_btn:   "Reactivate Subscription",
        pending_banner:  "⚠️ Payment pending — your subscription renews on {date}. You have until {graceEnd} to complete the payment before access is suspended.",
        onboarding_popup_title: "Complete your onboarding",
        onboarding_popup_body:  "You have an active subscription! Complete your onboarding to help us understand your project and get started.",
        onboarding_popup_btn:   "Start Onboarding",
        onboarding_popup_later: "Remind me later",
        onboarding_float_label: "Onboarding",
        plan_hosting:    "Domain & Hosting",
        plan_basic:      "Basic Maintenance",
        plan_preferential: "Preferential Maintenance",
        plan_advanced:   "Advanced Maintenance",
        plan_crm:        "Custom Core CRM",
        per_month:       "/ month",
        per_year:        "/ year",
        hosting_info_title:   "Your Hosting Plan",
        hosting_validity:     "Plan Validity",
        hosting_renewal:      "Next Renewal",
        hosting_status:       "Status",
        hosting_active:       "Active",
        hosting_license:      "License Code",
        billing_history:      "Payment History",
        no_payments:          "No payment records yet.",
        save_changes:         "Save Changes"
    },
    es: {
        noSub_title:   "Bienvenido a Elysium λ",
        noSub_body:    "Tus proyectos activos aparecerán aquí una vez que selecciones un plan de suscripción.",
        monthly:       "Mensual",
        annual:        "Anual",
        subscribe:     "Seleccionar Plan",
        checkout_title: "Suscripción online segura",
        checkout_body:  "Tu licencia se asignará automáticamente en cuanto Stripe confirme el pago.",
        checkout_pay:   "Continuar al pago seguro",
        checkout_loading: "Abriendo pago seguro…",
        checkout_manual: "¿Pagarás por transferencia u otro medio? Contáctanos y un administrador registrará el pago manualmente.",
        checkout_error: "El pago seguro no está disponible temporalmente. Inténtalo de nuevo o contáctanos.",
        checkout_processing: "Pago confirmado. Estamos asignando la licencia de tu suscripción…",
        checkout_ready: "Suscripción activa. Tu licencia fue asignada automáticamente.",
        contact_sub_title:   "Activa tu suscripción",
        contact_sub_body:    "Para activar este plan, contacta a tu representante de Elysium o escríbenos a info@elysiumdr.eu. Nos encargamos de todo.",
        contact_sub_close:   "Cerrar",
        suspended_title: "Suscripción Suspendida",
        suspended_body:  "Tu suscripción está suspendida por un pago pendiente. Regulariza tu cuenta para volver a acceder al dashboard.",
        suspended_btn:   "Reactivar Suscripción",
        pending_banner:  "⚠️ Pago pendiente — tu suscripción se renueva el {date}. Tienes hasta el {graceEnd} para completar el pago antes de que se suspenda el acceso.",
        onboarding_popup_title: "Completa tu onboarding",
        onboarding_popup_body:  "¡Tienes una suscripción activa! Completa el onboarding para que podamos entender tu proyecto y comenzar.",
        onboarding_popup_btn:   "Iniciar Onboarding",
        onboarding_popup_later: "Recordarme luego",
        onboarding_float_label: "Onboarding",
        plan_hosting:    "Dominio y Hosting",
        plan_basic:      "Mantenimiento Básico",
        plan_preferential: "Mantenimiento Preferencial",
        plan_advanced:   "Mantenimiento Avanzado",
        plan_crm:        "CRM Personalizado",
        per_month:       "/ mes",
        per_year:        "/ año",
        hosting_info_title:   "Tu Plan de Hosting",
        hosting_validity:     "Vigencia del Plan",
        hosting_renewal:      "Próxima Renovación",
        hosting_status:       "Estado",
        hosting_active:       "Activo",
        hosting_license:      "Código de Licencia",
        billing_history:      "Historial de Pagos",
        no_payments:          "Aún no hay registros de pago.",
        save_changes:         "Guardar Cambios"
    },
    pt: {
        noSub_title:   "Bem-vindo ao Elysium λ",
        noSub_body:    "Os seus projectos activos aparecerão aqui depois de seleccionar um plano de subscrição.",
        monthly:       "Mensal",
        annual:        "Anual",
        subscribe:     "Seleccionar Plano",
        checkout_title: "Subscrição online segura",
        checkout_body:  "A sua licença será atribuída automaticamente assim que a Stripe confirmar o pagamento.",
        checkout_pay:   "Continuar para pagamento seguro",
        checkout_loading: "A abrir pagamento seguro…",
        checkout_manual: "Vai pagar por transferência ou outro meio? Contacte-nos e um administrador registará o pagamento manualmente.",
        checkout_error: "O pagamento seguro está temporariamente indisponível. Tente novamente ou contacte-nos.",
        checkout_processing: "Pagamento confirmado. Estamos a atribuir a licença da sua subscrição…",
        checkout_ready: "Subscrição ativa. A sua licença foi atribuída automaticamente.",
        contact_sub_title:   "Active a sua subscrição",
        contact_sub_body:    "Para activar este plano, contacte o seu representante Elysium ou envie-nos um email para info@elysiumdr.eu. Tratamos de tudo.",
        contact_sub_close:   "Fechar",
        suspended_title: "Subscrição Suspensa",
        suspended_body:  "A sua subscrição está suspensa por um pagamento em falta. Regularize a sua conta para voltar a aceder ao painel.",
        suspended_btn:   "Reactivar Subscrição",
        pending_banner:  "⚠️ Pagamento pendente — a sua subscrição renova em {date}. Tem até {graceEnd} para efectuar o pagamento antes de o acesso ser suspenso.",
        onboarding_popup_title: "Complete o seu onboarding",
        onboarding_popup_body:  "Tem uma subscrição activa! Complete o onboarding para que possamos entender o seu projecto e começar.",
        onboarding_popup_btn:   "Iniciar Onboarding",
        onboarding_popup_later: "Lembrar mais tarde",
        onboarding_float_label: "Onboarding",
        plan_hosting:    "Domínio e Alojamento",
        plan_basic:      "Manutenção Básica",
        plan_preferential: "Manutenção Preferencial",
        plan_advanced:   "Manutenção Avançada",
        plan_crm:        "CRM Personalizado",
        per_month:       "/ mês",
        per_year:        "/ ano",
        hosting_info_title:   "O Seu Plano de Alojamento",
        hosting_validity:     "Vigência do Plano",
        hosting_renewal:      "Próxima Renovação",
        hosting_status:       "Estado",
        hosting_active:       "Activo",
        hosting_license:      "Código de Licença",
        billing_history:      "Histórico de Pagamentos",
        no_payments:          "Ainda não existem registos de pagamento.",
        save_changes:         "Guardar Alterações"
    }
};

const t = i18n[lang] || i18n.en;

// ── Helpers ───────────────────────────────────────────────────────────────────
function showError(text) {
    if (!errorMsg) return;
    errorMsg.textContent = text;
    errorMsg.classList.remove('hidden');
}

function formatDate(ts) {
    if (!ts) return '—';
    const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return d.toLocaleDateString(lang === 'en' ? 'en-GB' : lang === 'es' ? 'es-CR' : 'pt-PT', {
        day: '2-digit', month: 'long', year: 'numeric'
    });
}

function formatPrice(amount, currency) {
    if (!amount) return '—';
    const symbols = { EUR: '€', USD: '$', CRC: '₡' };
    const s = symbols[currency] || '€';
    return `${s}${amount.toLocaleString()}`;
}

function billingApiUrl(path) {
    const configuredOrigin = String(window.ELYSIUM_BILLING_API_URL || '').replace(/\/$/, '');
    return `${configuredOrigin}${path}`;
}

async function startSubscriptionCheckout(planType, billingCycle, button, messageEl) {
    if (!currentUser) {
        if (messageEl) messageEl.textContent = t.checkout_error;
        return;
    }

    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = t.checkout_loading;
    if (messageEl) messageEl.textContent = '';

    try {
        const idToken = await currentUser.getIdToken();
        const response = await fetch(billingApiUrl('/api/billing/create-checkout-session'), {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                planType,
                billingCycle,
                returnPath: window.location.pathname
            })
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload.url) throw new Error(payload.error || t.checkout_error);
        window.location.assign(payload.url);
    } catch (error) {
        console.error('Checkout error:', error);
        if (messageEl) messageEl.textContent = error.message || t.checkout_error;
        button.disabled = false;
        button.textContent = originalText;
    }
}

let checkoutWatcherStop = null;

function showCheckoutStatus(message, state = 'processing') {
    let banner = document.getElementById('checkout-status-banner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'checkout-status-banner';
        banner.style.cssText = 'position:fixed;top:1rem;left:50%;transform:translateX(-50%);z-index:100000;max-width:min(92vw,620px);padding:0.9rem 1.25rem;border-radius:12px;border:1px solid rgba(41,151,255,.35);background:rgba(5,16,37,.96);box-shadow:0 16px 50px rgba(0,0,0,.35);color:#e1e1e5;font-size:.9rem;text-align:center;';
        document.body.appendChild(banner);
    }
    banner.textContent = message;
    banner.style.borderColor = state === 'ready' ? 'rgba(0,200,117,.45)' : 'rgba(41,151,255,.35)';
    return banner;
}

function watchCheckoutProvisioning(memberRef) {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') !== 'success' || checkoutWatcherStop) return;

    const banner = showCheckoutStatus(t.checkout_processing);
    const checkoutSessionId = params.get('session_id');
    let completed = false;
    checkoutWatcherStop = onSnapshot(memberRef, snapshot => {
        const updated = snapshot.data();
        const subscription = updated?.subscription;
        const matchesCheckout = !checkoutSessionId || subscription?.stripeCheckoutSessionId === checkoutSessionId;
        if (!subscription?.licenseCode || subscription.status !== 'active' || !matchesCheckout || completed) return;
        completed = true;
        currentUserData = updated;
        renderDashboard(updated);
        showCheckoutStatus(t.checkout_ready, 'ready');
        checkoutWatcherStop?.();
        checkoutWatcherStop = null;
        window.history.replaceState({}, document.title, window.location.pathname);
        window.setTimeout(() => banner.remove(), 5000);
    }, error => {
        console.error('Subscription provisioning watcher:', error);
        banner.textContent = t.checkout_error;
    });

    // Webhook retries can take longer. Stop the live listener without claiming
    // success; a normal dashboard reload will read the provisioned license.
    window.setTimeout(() => {
        if (completed || !checkoutWatcherStop) return;
        checkoutWatcherStop();
        checkoutWatcherStop = null;
        banner.textContent = t.checkout_processing;
    }, 45000);
}

// ── View Toggle Handlers ──────────────────────────────────────────────────────
if (showSignup) showSignup.addEventListener('click', e => {
    e.preventDefault();
    loginView?.classList.add('hidden');
    prospectView?.classList.add('hidden');
    signupView?.classList.remove('hidden');
    errorMsg?.classList.add('hidden');
});

if (showLogin) showLogin.addEventListener('click', e => {
    e.preventDefault();
    signupView?.classList.add('hidden');
    prospectView?.classList.add('hidden');
    loginView?.classList.remove('hidden');
    errorMsg?.classList.add('hidden');
});

const showProspectHandler = e => {
    e.preventDefault();
    loginView?.classList.add('hidden');
    signupView?.classList.add('hidden');
    prospectView?.classList.remove('hidden');
    errorMsg?.classList.add('hidden');
};
if (showProspect) showProspect.addEventListener('click', showProspectHandler);
if (showProspectFromSignup) showProspectFromSignup.addEventListener('click', showProspectHandler);

if (showLoginFromProspect) showLoginFromProspect.addEventListener('click', e => {
    e.preventDefault();
    prospectView?.classList.add('hidden');
    loginView?.classList.remove('hidden');
    errorMsg?.classList.add('hidden');
});

if (showSignupFromProspect) showSignupFromProspect.addEventListener('click', e => {
    e.preventDefault();
    prospectView?.classList.add('hidden');
    signupView?.classList.remove('hidden');
    errorMsg?.classList.add('hidden');
});

// Prospect is-client checkbox toggle
const prospectIsClientCheckbox = document.getElementById('prospect-is-client');
const prospectLicenseGroup     = document.getElementById('prospect-license-group');
const prospectLicenseInput     = document.getElementById('prospect-license');

if (prospectIsClientCheckbox) {
    prospectIsClientCheckbox.addEventListener('change', e => {
        if (e.target.checked) {
            prospectLicenseGroup?.classList.remove('hidden');
            prospectLicenseInput?.setAttribute('required', 'true');
        } else {
            prospectLicenseGroup?.classList.add('hidden');
            prospectLicenseInput?.removeAttribute('required');
            if (prospectLicenseInput) prospectLicenseInput.value = '';
        }
    });
}

// ── Auth State Observer (main entry point) ────────────────────────────────────
onAuthStateChanged(auth, async user => {
    if (isSigningUp) return;

    if (user) {
        currentUser = user;

        // Super-admin redirect
        if (user.email === SUPER_ADMIN_EMAIL && sessionStorage.getItem('dev_mode') !== 'true') {
            if (!window.location.pathname.includes('admin.html')) {
                const localized = pathParts.some(p => p === 'es' || p === 'pt');
                window.location.href = localized ? '../admin.html' : 'admin.html';
            }
            return;
        }

        try {
            const memberRef  = doc(db, 'members', user.uid);
            const memberSnap = await getDoc(memberRef);

            let userData;

            if (!memberSnap.exists()) {
                // New user — doc may not exist yet if registration was very recent
                const isNewUser = Date.now() - new Date(user.metadata.creationTime).getTime() < 60000;
                if (isNewUser) return; // Wait for registration block to finish
                
                // Auto-create for edge cases (e.g. Google sign-in future)
                userData = {
                    name: user.displayName || 'Partner',
                    email: user.email,
                    role: 'partner',
                    subscription: null,
                    onboardingCompleted: false,
                    createdAt: serverTimestamp()
                };
                await setDoc(memberRef, userData);
            } else {
                userData = memberSnap.data();

                // ── Silent legacy migration ───────────────────────────────────
                // Old users have licenseCode at root level without subscription object
                if (userData.licenseCode && !userData.subscription) {
                    const migrated = {
                        planType:      'basic', // conservative default
                        planLabel:     'Basic Maintenance',
                        billingCycle:  'monthly',
                        status:        'active',
                        licenseCode:   userData.licenseCode,
                        startDate:     userData.createdAt || serverTimestamp(),
                        nextBillingDate: null,
                        isManual:      true,
                        stripeCustomerId:     null,
                        stripeSubscriptionId: null,
                        gracePeriodEnd: null
                    };
                    userData.subscription = migrated;
                    // Write migration silently (fire & forget)
                    updateDoc(memberRef, { subscription: migrated }).catch(console.warn);
                }
            }

            currentUserData = userData;

            // ── Check subscription status on client side ───────────────────
            checkAndUpdateSubscriptionStatus(userData, memberRef);

            // ── Render dashboard ───────────────────────────────────────────
            renderDashboard(userData);
            watchCheckoutProvisioning(memberRef);

            // Check for pending subscription
            const pendingSubscribe = sessionStorage.getItem('pending_subscribe');
            if (pendingSubscribe) {
                sessionStorage.removeItem('pending_subscribe');
                
                const planMap = {
                    'domain_hosting': 'hosting',
                    'basic_maintenance': 'basic',
                    'preferential_maintenance': 'preferential',
                    'advanced_maintenance': 'advanced',
                    'custom_core_crm': 'crm'
                };
                const planKey = planMap[pendingSubscribe] || pendingSubscribe;
                
                // Give UI a tiny moment to render before acting
                setTimeout(() => {
                    const navSus = document.getElementById('nav-suscripciones');
                    if (navSus) navSus.click(); // If legacy tabs exist
                    
                    const planBtn = document.querySelector(`.plan-select-btn[data-plan="${planKey}"]`);
                    if (planBtn) {
                        planBtn.click();
                    } else if (typeof showSubscriptionCheckoutModal === 'function') {
                        showSubscriptionCheckoutModal(planKey, planKey === 'hosting' ? 'annual' : 'monthly');
                    }
                }, 500);
            }

        } catch (err) {
            console.error("Error in auth state:", err);
        }
    } else {
        currentUser = null;
        currentUserData = null;
        authSection?.classList.remove('hidden');
        profileSection?.classList.add('hidden');

        if (window.location.pathname.includes('onboarding.html')) {
            window.location.href = isEs ? '../profiles.html' : isPt ? '../profiles.html' : 'profiles.html';
        }
    }
});

// ── Client-side subscription status check ────────────────────────────────────
function checkAndUpdateSubscriptionStatus(userData, memberRef) {
    const sub = userData.subscription;
    if (!sub || !sub.nextBillingDate || sub.status === 'suspended') return;

    const now           = Date.now();
    const nextBilling   = sub.nextBillingDate.seconds
        ? sub.nextBillingDate.seconds * 1000
        : new Date(sub.nextBillingDate).getTime();
    const graceEnd      = sub.gracePeriodEnd
        ? (sub.gracePeriodEnd.seconds ? sub.gracePeriodEnd.seconds * 1000 : new Date(sub.gracePeriodEnd).getTime())
        : nextBilling + (GRACE_PERIOD_DAYS * 86400000);

    if (now > graceEnd && sub.status === 'pending_payment') {
        // Grace period expired — suspend locally (server cron does authoritative update)
        userData.subscription.status = 'suspended';
    } else if (now > nextBilling && sub.status === 'active') {
        userData.subscription.status = 'pending_payment';
        userData.subscription.gracePeriodEnd = new Date(graceEnd);
    }
}

// ── Main Dashboard Renderer ───────────────────────────────────────────────────
function renderDashboard(userData) {
    const sub = userData.subscription;

    // Hide auth, show profile
    const authWrapper = authSection?.closest('section') || authSection?.parentElement?.parentElement;
    if (authWrapper) authWrapper.classList.add('hidden');
    profileSection?.classList.remove('hidden');

    // Hide global layout for SPA feel
    document.querySelector('.navbar')?.style.setProperty('display', 'none');
    document.querySelector('footer')?.style.setProperty('display', 'none');
    document.body.style.overflow = 'hidden';

    // Fill sidebar identity
    const welcomeName    = document.getElementById('sidebar-welcome-name');
    const partnerCompany = document.getElementById('sidebar-partner-company');
    if (welcomeName)    welcomeName.textContent  = userData.name    || 'Partner';
    if (partnerCompany) partnerCompany.textContent = userData.company || '—';

    // Fill profile tab
    fillProfileTab(userData);

    // Route to correct state
    if (!sub || !sub.planType) {
        renderPreSubscriptionState();
    } else if (['suspended', 'canceled', 'cancelled'].includes(sub.status)) {
        renderSuspendedState(userData);
    } else {
        renderActiveSubscriptionState(userData);
    }
}

// ── PRE-SUBSCRIPTION STATE ────────────────────────────────────────────────────
function renderPreSubscriptionState() {
    // Update Resumen section
    const resumenSection = document.getElementById('resumen');
    if (!resumenSection) return;

    resumenSection.innerHTML = buildPreSubscriptionHTML();

    // Hide advanced sidebar tabs (keep only Resumen + Perfil)
    setSidebarVisibility('none');

    // Wire billing toggle
    wireBillingToggle(resumenSection);

    // Wire plan buttons
    resumenSection.querySelectorAll('.plan-select-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const planType    = btn.dataset.plan;
            const selectedCycle = resumenSection.querySelector('.billing-toggle-btn.active')?.dataset.cycle || 'monthly';
            const billingCycle = planType === 'hosting' ? 'annual' : selectedCycle;
            showSubscriptionCheckoutModal(planType, billingCycle);
        });
    });
}

function buildPreSubscriptionHTML() {
    return `
        <div class="dashboard-header">
            <div>
                <h1>${t.noSub_title}</h1>
                <p class="color-text-secondary">${t.noSub_body}</p>
            </div>
        </div>

        <!-- Billing toggle -->
        <div style="display:flex; gap:0.5rem; margin-bottom:2rem; background:var(--glass-bg); border-radius:var(--radius-sm); padding:4px; width:fit-content; border:1px solid var(--glass-border);">
            <button class="billing-toggle-btn active" data-cycle="monthly" style="${billingToggleBtnStyle(true)}">${t.monthly}</button>
            <button class="billing-toggle-btn" data-cycle="annual" style="${billingToggleBtnStyle(false)}">${t.annual} <span style="font-size:0.7rem; color:#00c875; margin-left:4px;">−15%</span></button>
        </div>

        <!-- Plans grid -->
        <div class="subscription-grid">
            ${buildPlanCard('hosting',      t.plan_hosting,      '€99',  t.per_year,  ['Domain management & identity', 'High-availability web hosting', 'Base infrastructure updates'], false, '🌐')}
            ${buildPlanCard('basic',        t.plan_basic,        '€70',  t.per_month, ['Domain & Hosting included', 'Corporate website development', 'Mobile-first fluid design'], false, '⚙️')}
            ${buildPlanCard('preferential', t.plan_preferential, '€99',  t.per_month, ['Basic features included', 'Multi-language support', 'Light/Dark mode adaptation'], true,  '⭐')}
            ${buildPlanCard('advanced',     t.plan_advanced,     '€120', t.per_month, ['Preferential features included', 'Private CRM platform', 'Custom scalable software'], false, '🚀')}
            ${buildPlanCard('crm',          t.plan_crm,          '€50',  t.per_month, ['Intuitive control panel', '100% confidential workspace', 'Direct centralised access'], false, '🧩')}
        </div>
    `;
}

function billingToggleBtnStyle(active) {
    return `background:${active ? 'var(--color-accent)' : 'transparent'}; color:${active ? '#fff' : 'var(--color-text-secondary)'}; border:none; padding:0.5rem 1.2rem; border-radius:6px; cursor:pointer; font-size:0.85rem; font-weight:600; transition:all 0.2s;`;
}

function buildPlanCard(planType, label, price, period, features, featured, icon) {
    return `
        <div class="sub-card${featured ? ' featured-sub' : ''}">
            ${featured ? '<div class="featured-badge">Most Popular</div>' : ''}
            <div>
                <div style="font-size:1.5rem; margin-bottom:0.5rem;">${icon}</div>
                <h4 class="sub-title">${label}</h4>
                <p class="sub-price">${price} <span class="sub-period">${period}</span></p>
                <ul class="sub-features">
                    ${features.map(f => `<li>${f}</li>`).join('')}
                </ul>
            </div>
            <button class="btn btn-primary sub-btn plan-select-btn" data-plan="${planType}">${t.subscribe}</button>
        </div>
    `;
}

function wireBillingToggle(container) {
    container.querySelectorAll('.billing-toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            container.querySelectorAll('.billing-toggle-btn').forEach(b => {
                b.style.background = 'transparent';
                b.style.color      = 'var(--color-text-secondary)';
                b.classList.remove('active');
            });
            btn.style.background = 'var(--color-accent)';
            btn.style.color      = '#fff';
            btn.classList.add('active');

            const cycle = btn.dataset.cycle;
            // Update annual prices
            const priceMap = {
                hosting:      { monthly: null,  annual: 99  },
                basic:        { monthly: 70,    annual: 700 },
                preferential: { monthly: 99,    annual: 990 },
                advanced:     { monthly: 120,   annual: 1200 },
                crm:          { monthly: 50,    annual: 500 }
            };
            container.querySelectorAll('.sub-card').forEach(card => {
                const planType = card.querySelector('.plan-select-btn')?.dataset.plan;
                if (!planType || !priceMap[planType]) return;
                const price    = priceMap[planType][cycle];
                const period   = cycle === 'annual' ? t.per_year : t.per_month;
                const priceEl  = card.querySelector('.sub-price');
                if (priceEl && price !== null) {
                    priceEl.innerHTML = `€${price} <span class="sub-period">${period}</span>`;
                }
            });
        });
    });
}

// ── SUBSCRIPTION CHECKOUT MODAL ─────────────────────────────────────────────
function showSubscriptionCheckoutModal(planType, billingCycle) {
    const plan     = PLANS[planType];
    if (!plan) return;
    const existing = document.getElementById('contact-sub-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'contact-sub-modal';
    modal.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);`;
    modal.innerHTML = `
        <div style="background:var(--color-card-bg, #1a1a2e);border:1px solid var(--glass-border);border-radius:var(--radius-lg);padding:2.5rem;max-width:480px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.5);">
            <div style="width:60px;height:60px;border-radius:50%;background:rgba(41,151,255,0.1);border:2px solid var(--color-accent);display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;font-size:1.5rem;">λ</div>
            <h3 style="color:var(--color-platinum);margin-bottom:0.5rem;">${t.checkout_title}</h3>
            <p style="font-size:0.9rem;color:#00c875;margin-bottom:0.5rem;font-weight:600;">${plan.label} — ${billingCycle === 'annual' ? t.annual : t.monthly}</p>
            <p style="color:var(--color-text-secondary);margin-bottom:1.5rem;line-height:1.6;font-size:0.9rem;">${t.checkout_body}</p>
            <button id="confirm-web-subscription" class="btn btn-primary" style="width:100%;margin-bottom:0.75rem;">${t.checkout_pay}</button>
            <p id="checkout-modal-error" style="min-height:1.2em;margin:0 0 1rem;color:#ff6060;font-size:0.8rem;"></p>
            <p style="color:var(--color-text-secondary);margin:0 0 0.65rem;line-height:1.5;font-size:0.78rem;">${t.checkout_manual}</p>
            <a href="mailto:info@elysiumdr.eu?subject=Manual%20Subscription%20Payment%20—%20${encodeURIComponent(plan.label)}" style="display:inline-block;color:var(--color-accent);font-size:0.85rem;margin-bottom:1rem;">info@elysiumdr.eu</a>
            <button id="close-contact-modal" style="background:transparent;border:1px solid var(--glass-border);color:var(--color-text-secondary);padding:0.75rem 2rem;border-radius:8px;cursor:pointer;width:100%;font-size:0.9rem;">${t.contact_sub_close}</button>
        </div>
    `;

    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    modal.querySelector('#close-contact-modal').addEventListener('click', () => modal.remove());
    const checkoutButton = modal.querySelector('#confirm-web-subscription');
    const errorElement = modal.querySelector('#checkout-modal-error');
    checkoutButton.addEventListener('click', () => startSubscriptionCheckout(planType, billingCycle, checkoutButton, errorElement));
}

// ── ACTIVE SUBSCRIPTION STATE ─────────────────────────────────────────────────
function renderActiveSubscriptionState(userData) {
    const sub      = userData.subscription;
    const planType = sub.planType;
    const tier     = PLANS[planType]?.tier || 2;

    // Show pending payment banner if needed
    if (sub.status === 'pending_payment') {
        showPendingPaymentBanner(sub);
    }

    // Configure sidebar based on plan tier
    configureSidebarByTier(tier);

    // Render appropriate resumen content
    if (planType === 'hosting') {
        renderHostingDashboard(userData);
    } else {
        renderCRMDashboard(userData, tier);
    }

    // Load billing tab
    loadBillingHistory(userData);

    // Fill subscription info tab
    fillSubscriptionTab(sub);

    // Onboarding reminders (if not completed and has subscription)
    if (!userData.onboardingCompleted && sub.status === 'active') {
        attachOnboardingReminders();
    }
}

// ── SUSPENDED STATE ───────────────────────────────────────────────────────────
function renderSuspendedState(userData) {
    const resumenSection = document.getElementById('resumen');
    if (!resumenSection) return;

    setSidebarVisibility('none');

    resumenSection.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;text-align:center;padding:2rem;">
            <div style="width:80px;height:80px;border-radius:50%;background:rgba(255,68,68,0.1);border:2px solid rgba(255,68,68,0.4);display:flex;align-items:center;justify-content:center;margin-bottom:2rem;font-size:2rem;">🔒</div>
            <h2 style="color:var(--color-platinum);margin-bottom:1rem;">${t.suspended_title}</h2>
            <p style="color:var(--color-text-secondary);max-width:460px;line-height:1.7;margin-bottom:2rem;">${t.suspended_body}</p>
            <a href="mailto:info@elysiumdr.eu?subject=Reactivation%20Request" class="btn btn-primary" style="padding:1rem 2.5rem;">${t.suspended_btn}</a>
        </div>
    `;
}

// ── PENDING PAYMENT BANNER ────────────────────────────────────────────────────
function showPendingPaymentBanner(sub) {
    const existing = document.getElementById('pending-payment-banner');
    if (existing) return;

    const adminMain = document.querySelector('.admin-main') || document.querySelector('main');
    if (!adminMain) return;

    const banner = document.createElement('div');
    banner.id = 'pending-payment-banner';
    banner.style.cssText = `background:rgba(255,165,0,0.12);border:1px solid rgba(255,165,0,0.35);border-radius:8px;padding:1rem 1.5rem;margin:1rem 1.5rem 0;display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;`;

    const nextDate  = formatDate(sub.nextBillingDate);
    const graceDate = formatDate(sub.gracePeriodEnd);
    const msg       = t.pending_banner.replace('{date}', nextDate).replace('{graceEnd}', graceDate);

    banner.innerHTML = `
        <span style="color:#ffaa00;font-size:0.9rem;flex:1;">${msg}</span>
        <a href="mailto:info@elysiumdr.eu?subject=Payment%20Regularisation" class="btn btn-primary" style="padding:0.5rem 1.5rem;font-size:0.85rem;white-space:nowrap;">Regularise Payment</a>
    `;

    adminMain.insertBefore(banner, adminMain.firstChild);
}

// ── SIDEBAR CONFIGURATION BY TIER ────────────────────────────────────────────
function setSidebarVisibility(display) {
    // Hide all tier-gated items
    ['nav-proyectos', 'nav-documentos', 'nav-mensajes', 'nav-suscripciones', 'nav-facturacion'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = display;
    });
}

function configureSidebarByTier(tier) {
    const show = id => { const el = document.getElementById(id); if (el) el.style.display = ''; };
    const hide = id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; };

    // Tier 1 — Hosting: only resumen + billing + profile
    if (tier === 1) {
        hide('nav-suscripciones'); hide('nav-proyectos'); hide('nav-documentos'); hide('nav-mensajes');
        show('nav-facturacion');
    }
    // Tier 2 — Basic: resumen + billing + profile
    else if (tier === 2) {
        hide('nav-proyectos'); hide('nav-documentos'); hide('nav-mensajes'); hide('nav-suscripciones');
        show('nav-facturacion');
    }
    // Tier 3 — Preferential: resumen + projects + documents + billing + profile
    else if (tier === 3) {
        show('nav-proyectos'); show('nav-documentos'); hide('nav-mensajes'); hide('nav-suscripciones');
        show('nav-facturacion');
    }
    // Tier 4 — Advanced / CRM: everything
    else {
        show('nav-proyectos'); show('nav-documentos'); show('nav-mensajes'); hide('nav-suscripciones');
        show('nav-facturacion');
    }
}

// ── HOSTING DASHBOARD ─────────────────────────────────────────────────────────
function renderHostingDashboard(userData) {
    const sub = userData.subscription;
    const resumenSection = document.getElementById('resumen');
    if (!resumenSection) return;

    const statusColor = sub.status === 'active' ? '#00c875' : '#ffaa00';

    resumenSection.innerHTML = `
        <div class="dashboard-header">
            <div>
                <h1>${t.hosting_info_title}</h1>
                <p class="color-text-secondary">${PLANS.hosting.label}</p>
            </div>
        </div>

        <div class="profile-full-width">
            <div class="overview-panel">
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1.5rem;margin-bottom:2rem;">
                    <div style="background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:var(--radius-sm);padding:1.5rem;">
                        <div style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--color-text-secondary);margin-bottom:0.5rem;">${t.hosting_status}</div>
                        <div style="font-size:1.1rem;font-weight:700;color:${statusColor};">● ${t.hosting_active}</div>
                    </div>
                    <div style="background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:var(--radius-sm);padding:1.5rem;">
                        <div style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--color-text-secondary);margin-bottom:0.5rem;">${t.hosting_validity}</div>
                        <div style="font-size:1rem;font-weight:600;color:var(--color-platinum);">${formatDate(sub.startDate)}</div>
                    </div>
                    <div style="background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:var(--radius-sm);padding:1.5rem;">
                        <div style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--color-text-secondary);margin-bottom:0.5rem;">${t.hosting_renewal}</div>
                        <div style="font-size:1rem;font-weight:600;color:var(--color-platinum);">${formatDate(sub.nextBillingDate)}</div>
                    </div>
                    <div style="background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:var(--radius-sm);padding:1.5rem;">
                        <div style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--color-text-secondary);margin-bottom:0.5rem;">${t.hosting_license}</div>
                        <div style="font-size:0.9rem;font-weight:700;color:var(--color-accent);letter-spacing:0.05em;">${sub.licenseCode || '—'}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ── CRM DASHBOARD (basic / preferential / advanced / crm) ────────────────────
function renderCRMDashboard(userData, tier) {
    const resumenSection = document.getElementById('resumen');
    if (!resumenSection) return;

    const sub = userData.subscription;

    // Header
    const headerHTML = `
        <div class="dashboard-header">
            <div>
                <h1>Resumen</h1>
                <p class="color-text-secondary">${PLANS[sub.planType]?.label || ''} — ${formatDate(sub.startDate)}</p>
            </div>
        </div>
        <div class="profile-full-width">
    `;

    // Projects panel
    let projectsHTML = `
        <div class="overview-panel">
            <div class="overview-panel-header"><h3 class="overview-panel-title">Active Projects</h3></div>
            <div id="client-projects-list" style="display:flex;flex-direction:column;gap:1rem;width:100%;">
                <p style="color:var(--color-text-secondary);">No active projects currently.</p>
            </div>
        </div>
    `;

    // Subscription status quick panel
    const statusColor = sub.status === 'active' ? '#00c875' : '#ffaa00';
    const statusLabel = sub.status === 'active' ? 'Active' : sub.status === 'pending_payment' ? 'Payment Pending' : 'Suspended';
    const quickSubHTML = `
        <div class="overview-panel">
            <div class="overview-panel-header"><h3 class="overview-panel-title">Subscription</h3></div>
                <div style="display:flex;flex-direction:column;gap:0.75rem;">
                <div style="display:flex;justify-content:space-between;"><span style="color:var(--color-text-secondary);">Plan</span><span style="color:var(--color-platinum);font-weight:600;">${PLANS[sub.planType]?.label}</span></div>
                <div style="display:flex;justify-content:space-between;"><span style="color:var(--color-text-secondary);">Status</span><span style="color:${statusColor};font-weight:600;">● ${statusLabel}</span></div>
                ${sub.contractPeriodCode ? `<div style="display:flex;justify-content:space-between;"><span style="color:var(--color-text-secondary);">Contract</span><span style="color:var(--color-platinum);font-weight:600;">${sub.contractPeriodCode}</span></div>` : ''}
                <div style="display:flex;justify-content:space-between;"><span style="color:var(--color-text-secondary);">License</span><span style="color:var(--color-accent);font-size:0.85rem;font-weight:700;">${sub.licenseCode || '—'}</span></div>
                ${sub.nextBillingDate ? `<div style="display:flex;justify-content:space-between;"><span style="color:var(--color-text-secondary);">Next renewal</span><span style="color:var(--color-platinum);">${formatDate(sub.nextBillingDate)}</span></div>` : ''}
            </div>
        </div>
    `;

    resumenSection.innerHTML = headerHTML + projectsHTML + quickSubHTML + `</div>`;

    // Render project links
    if (userData.projectUrl || (userData.projects && userData.projects.length > 0)) {
        const projectListContainer = document.getElementById('client-projects-list');
        if (projectListContainer) {
            projectListContainer.innerHTML = '';
            const projects = userData.projects || [{ id: 'legacy', name: userData.company || 'Main Project', projectUrl: userData.projectUrl }];
            projects.forEach((proj, i) => {
                if (proj.projectUrl) {
                    const a = document.createElement('a');
                    a.href = proj.projectUrl;
                    a.target = '_blank';
                    a.className = 'btn btn-primary';
                    a.style.cssText = 'display:inline-flex;align-items:center;gap:0.5rem;width:100%;justify-content:center;';
                    a.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:1.2rem;height:1.2rem;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg> ${proj.name || 'Project ' + (i+1)}`;
                    projectListContainer.appendChild(a);
                }
            });
        }
    }
}

// ── SUBSCRIPTION TAB ──────────────────────────────────────────────────────────
function fillSubscriptionTab(sub) {
    const subSection = document.getElementById('suscripciones');
    if (!subSection) return;

    const plan = PLANS[sub.planType] || {};
    subSection.innerHTML = `
        <div class="dashboard-header">
            <div><h2>Subscription</h2><p class="color-text-secondary">Your current plan and billing information.</p></div>
        </div>
        <div class="profile-full-width">
            <div class="overview-panel">
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-bottom:2rem;">
                    <div style="background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:var(--radius-sm);padding:1.25rem;">
                        <div style="font-size:0.72rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--color-text-secondary);margin-bottom:0.4rem;">Current Plan</div>
                        <div style="font-size:1rem;font-weight:700;color:var(--color-accent);">${plan.label || '—'}</div>
                    </div>
                    <div style="background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:var(--radius-sm);padding:1.25rem;">
                        <div style="font-size:0.72rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--color-text-secondary);margin-bottom:0.4rem;">Contract</div>
                        <div style="font-size:1rem;font-weight:700;color:var(--color-platinum);">${sub.contractPeriodCode || (sub.billingCycle === 'annual' ? 'ANL1' : 'M3N1')}</div>
                    </div>
                    <div style="background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:var(--radius-sm);padding:1.25rem;">
                        <div style="font-size:0.72rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--color-text-secondary);margin-bottom:0.4rem;">License Code</div>
                        <div style="font-size:0.9rem;font-weight:700;color:var(--color-accent);letter-spacing:0.05em;">${sub.licenseCode || '—'}</div>
                    </div>
                    <div style="background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:var(--radius-sm);padding:1.25rem;">
                        <div style="font-size:0.72rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--color-text-secondary);margin-bottom:0.4rem;">Next Billing</div>
                        <div style="font-size:1rem;font-weight:600;color:var(--color-platinum);">${formatDate(sub.nextBillingDate)}</div>
                    </div>
                </div>
                <div id="billing-payments-list"></div>
            </div>
        </div>
    `;
}

// ── BILLING HISTORY ───────────────────────────────────────────────────────────
async function loadBillingHistory(userData) {
    const container = document.getElementById('billing-payments-list');
    if (!container) return;

    container.innerHTML = '<div class="premium-loader"></div>';

    try {
        const q = query(
            collection(db, 'subscription_payments'),
            where('userId', '==', currentUser.uid),
            orderBy('paymentDate', 'desc')
        );
        const snap = await getDocs(q);

        if (snap.empty) {
            container.innerHTML = `<p style="color:var(--color-text-secondary);text-align:center;padding:2rem;">${t.no_payments}</p>`;
            return;
        }

        const rows = snap.docs.map(d => {
            const p = d.data();
            const date   = formatDate(p.paymentDate);
            const amount = formatPrice(p.amount, p.currency || 'EUR');
            const method = p.method === 'manual' ? 'Manual' : 'Online';
            const invoiceLink = p.invoiceUrl ? `<a href="${p.invoiceUrl}" target="_blank" style="color:var(--color-accent);font-size:0.8rem;">View</a>` : '—';
            return `<tr>
                <td style="padding:0.75rem 1rem;color:var(--color-text-secondary);font-size:0.875rem;">${date}</td>
                <td style="padding:0.75rem 1rem;color:var(--color-platinum);font-weight:600;">${amount}</td>
                <td style="padding:0.75rem 1rem;color:var(--color-text-secondary);font-size:0.85rem;">${method}</td>
                <td style="padding:0.75rem 1rem;">${invoiceLink}</td>
            </tr>`;
        }).join('');

        container.innerHTML = `
            <h4 style="margin-bottom:1rem;">${t.billing_history}</h4>
            <table style="width:100%;border-collapse:collapse;">
                <thead><tr style="border-bottom:1px solid var(--glass-border);">
                    <th style="padding:0.5rem 1rem;text-align:left;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-secondary);">Date</th>
                    <th style="padding:0.5rem 1rem;text-align:left;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-secondary);">Amount</th>
                    <th style="padding:0.5rem 1rem;text-align:left;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-secondary);">Method</th>
                    <th style="padding:0.5rem 1rem;text-align:left;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-secondary);">Invoice</th>
                </tr></thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    } catch (err) {
        console.warn('Could not load billing history:', err);
        container.innerHTML = `<p style="color:var(--color-text-secondary);font-size:0.875rem;">Payment history unavailable.</p>`;
    }
}

// ── PROFILE TAB ───────────────────────────────────────────────────────────────
function fillProfileTab(userData) {
    const sub = userData.subscription;
    const pName    = document.getElementById('profile-name');
    const pEmail   = document.getElementById('profile-email');
    const pCompany = document.getElementById('profile-company');
    const pLicense = document.getElementById('profile-license');
    const pLargeName = document.getElementById('profile-name-large');
    const avatarLarge = document.querySelector('.profile-avatar-large');

    if (pName)      pName.textContent    = userData.name    || '—';
    if (pEmail)     pEmail.textContent   = userData.email   || '—';
    if (pCompany)   pCompany.textContent = userData.company || '—';
    if (pLicense)   pLicense.textContent = sub?.licenseCode || (sub ? 'Active' : 'No subscription');
    if (pLargeName) pLargeName.textContent = userData.name  || 'Partner';
    if (avatarLarge) avatarLarge.textContent = (userData.name || 'P')[0].toUpperCase();

    // Sidebar identity
    const sidebarAvatar = document.querySelector('.sidebar-admin-avatar');
    if (sidebarAvatar) sidebarAvatar.textContent = (userData.name || 'P')[0].toUpperCase();
}

// ── ONBOARDING REMINDERS ──────────────────────────────────────────────────────
function attachOnboardingReminders() {
    // 1. Floating pulsing button (bottom-right)
    if (!document.getElementById('onboarding-float-btn')) {
        const btn = document.createElement('a');
        btn.id        = 'onboarding-float-btn';
        btn.href      = isEs ? '../onboarding.html' : isPt ? '../onboarding.html' : 'onboarding.html';
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:1.2rem;height:1.2rem;"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1" ry="1"/></svg>${t.onboarding_float_label}`;
        btn.style.cssText = `position:fixed;bottom:2rem;right:2rem;z-index:9998;background:var(--color-accent);color:#fff;padding:0.9rem 1.4rem;border-radius:50px;text-decoration:none;display:flex;align-items:center;gap:0.5rem;font-weight:700;font-size:0.85rem;box-shadow:0 4px 20px rgba(41,151,255,0.45);animation:onboarding-pulse 2s infinite;`;
        document.body.appendChild(btn);

        // Add pulse keyframes if not present
        if (!document.getElementById('onboarding-pulse-style')) {
            const style = document.createElement('style');
            style.id = 'onboarding-pulse-style';
            style.textContent = `
                @keyframes onboarding-pulse {
                    0%   { transform:scale(1);   box-shadow:0 4px 20px rgba(41,151,255,0.45); }
                    50%  { transform:scale(1.06); box-shadow:0 6px 30px rgba(41,151,255,0.7); }
                    100% { transform:scale(1);   box-shadow:0 4px 20px rgba(41,151,255,0.45); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // 2. Popup modal (shown on each visit until onboarding is done)
    // Suppress if user clicked "later" within this session
    const suppressedUntil = sessionStorage.getItem('onboarding_popup_suppressed');
    if (suppressedUntil && Date.now() < parseInt(suppressedUntil)) return;

    setTimeout(() => {
        showOnboardingPopup();
    }, 1500); // Small delay so dashboard renders first
}

function showOnboardingPopup() {
    if (document.getElementById('onboarding-popup-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'onboarding-popup-modal';
    modal.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.65);z-index:99998;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px);animation:fadeIn 0.3s ease;`;
    modal.innerHTML = `
        <div style="background:var(--color-card-bg,#1a1a2e);border:1px solid var(--glass-border);border-radius:var(--radius-lg);padding:2.5rem;max-width:440px;width:90%;text-align:center;box-shadow:0 24px 80px rgba(0,0,0,0.6);">
            <div style="width:64px;height:64px;border-radius:50%;background:rgba(41,151,255,0.1);border:2px solid var(--color-accent);display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;font-size:1.8rem;">📋</div>
            <h3 style="color:var(--color-platinum);margin-bottom:0.75rem;">${t.onboarding_popup_title}</h3>
            <p style="color:var(--color-text-secondary);line-height:1.65;margin-bottom:2rem;font-size:0.9rem;">${t.onboarding_popup_body}</p>
            <a id="onboarding-popup-start" href="${isEs ? '../onboarding.html' : isPt ? '../onboarding.html' : 'onboarding.html'}" class="btn btn-primary" style="width:100%;display:block;margin-bottom:0.75rem;">${t.onboarding_popup_btn}</a>
            <button id="onboarding-popup-later" style="background:transparent;border:1px solid var(--glass-border);color:var(--color-text-secondary);padding:0.75rem 2rem;border-radius:8px;cursor:pointer;width:100%;font-size:0.875rem;">${t.onboarding_popup_later}</button>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#onboarding-popup-later').addEventListener('click', () => {
        // Suppress popup for 4 hours in this session
        sessionStorage.setItem('onboarding_popup_suppressed', Date.now() + 4 * 3600 * 1000);
        modal.remove();
    });
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────
if (loginForm) {
    loginForm.addEventListener('submit', async e => {
        e.preventDefault();
        const email    = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            showError(lang === 'es' ? 'Credenciales inválidas. Por favor verifica tu correo y contraseña.' :
                      lang === 'pt' ? 'Credenciais inválidas. Por favor verifique o seu email e palavra-passe.' :
                      'Invalid credentials. Please check your email and password.');
        }
    });
}

// ── SIGNUP (no license required) ─────────────────────────────────────────────
if (signupForm) {
    signupForm.addEventListener('submit', async e => {
        e.preventDefault();
        isSigningUp = true;

        const name          = document.getElementById('signup-name')?.value?.trim() || '';
        const company       = document.getElementById('signup-company')?.value?.trim() || '';
        const email         = document.getElementById('signup-email')?.value?.trim() || '';
        const password      = document.getElementById('signup-password')?.value || '';
        const repeatPw      = document.getElementById('signup-password-repeat')?.value || '';

        if (password.length < 6) {
            showError(lang === 'es' ? 'La contraseña debe tener al menos 6 caracteres.' :
                      lang === 'pt' ? 'A palavra-passe deve ter pelo menos 6 caracteres.' :
                      'Password must be at least 6 characters.');
            isSigningUp = false;
            return;
        }

        if (password !== repeatPw) {
            showError(lang === 'es' ? 'Las contraseñas no coinciden.' :
                      lang === 'pt' ? 'As palavras-passe não coincidem.' :
                      'Passwords do not match.');
            isSigningUp = false;
            return;
        }

        try {
            // 1. Create Firebase Auth user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user           = userCredential.user;

            // 2. Update display name
            await updateProfile(user, { displayName: name });

            // 3. Create Firestore member document (no license, no subscription yet)
            await setDoc(doc(db, 'members', user.uid), {
                name:                name,
                company:             company || null,
                email:               email,
                role:                'partner',
                subscription:        null,
                onboardingCompleted: false,
                createdAt:           serverTimestamp()
            });

            // Append to the immutable activity log (fire-and-forget)
            addDoc(collection(db, 'activities'), {
                memberId:   user.uid,
                memberName: name || null,
                type:       'member_registered',
                payload:    {},
                actorUid:   user.uid,
                actorEmail: user.email || null,
                actorRole:  'member',
                createdAt:  serverTimestamp()
            }).catch(err => console.warn('Activity log failed:', err));

            // 4. Redirect to dashboard (profiles.html — no onboarding yet)
            // Auth state observer will handle the UI render
            isSigningUp = false;

        } catch (error) {
            isSigningUp = false;
            console.error(error);
            if (error.code === 'auth/email-already-in-use') {
                showError(lang === 'es' ? 'Este correo ya está registrado.' :
                          lang === 'pt' ? 'Este email já está registado.' :
                          'This email is already registered.');
            } else {
                showError('Registration error: ' + error.message);
            }
        }
    });
}

// ── LOGOUT ────────────────────────────────────────────────────────────────────
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => signOut(auth));
}

// ── PROSPECT REGISTRATION ─────────────────────────────────────────────────────
if (prospectForm) {
    prospectForm.addEventListener('submit', async e => {
        e.preventDefault();
        isSigningUp = true;

        const name        = document.getElementById('prospect-name')?.value || '';
        const company     = document.getElementById('prospect-company')?.value || '';
        const email       = document.getElementById('prospect-email')?.value || '';
        const description = document.getElementById('prospect-description')?.value || '';
        const isClient    = document.getElementById('prospect-is-client')?.checked || false;
        const licenseCode = document.getElementById('prospect-license')?.value?.trim() || '';
        const successMsg  = document.getElementById('prospect-success-msg');
        const submitBtn   = prospectForm.querySelector('button[type="submit"]');

        try {
            if (isClient && licenseCode && !/^ELY-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4,20}$/i.test(licenseCode)) {
                    showError(lang === 'es' ? 'Código de licencia inválido.' :
                              lang === 'pt' ? 'Código de licença inválido.' :
                              'Invalid license code.');
                    isSigningUp = false;
                    return;
            }

            if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '...'; }

            await addDoc(collection(db, 'prospects'), {
                name, company, email,
                projectDescription: description,
                isExistingClient:   isClient,
                licenseCode:        isClient ? licenseCode : null,
                createdAt:          serverTimestamp(),
                status:             'pending'
            });

            prospectForm.reset();
            errorMsg?.classList.add('hidden');
            if (successMsg) successMsg.style.display = 'block';

        } catch (error) {
            console.error('Prospect error:', error);
            showError('Submission error: ' + error.message);
        } finally {
            isSigningUp = false;
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = lang === 'es' ? 'Enviar Solicitud' :
                                        lang === 'pt' ? 'Enviar Pedido' : 'Send Project Request';
            }
        }
    });
}

// ── SIDEBAR NAVIGATION ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.admin-section');

    // Compatibility for the static English subscription markup. The runtime
    // pre-subscription view uses the same secure checkout modal.
    document.querySelectorAll('#suscripciones .plan-select-btn').forEach(button => {
        button.addEventListener('click', () => {
            const planType = button.dataset.plan;
            showSubscriptionCheckoutModal(planType, planType === 'hosting' ? 'annual' : 'monthly');
        });
    });

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            sections.forEach(sec => {
                sec.classList.remove('active');
                sec.style.display = 'none';
            });

            const targetId = item.getAttribute('data-target');
            const target   = document.getElementById(targetId);
            if (target) {
                target.classList.add('active');
                target.style.display = 'block';

                // Lazy-load billing history when tab opens
                if (targetId === 'suscripciones' && currentUserData) {
                    loadBillingHistory(currentUserData);
                }
            }
        });
    });

    // ── Stripe return handling (Phase 3) ──────────────────────────────────────
    // Checkout activation is driven by the signed Stripe webhook, never by a
    // session ID stored in the browser.
});

// Export for use in other modules if needed
export { generateLicenseCode, PLANS, PERIOD_CODES };
