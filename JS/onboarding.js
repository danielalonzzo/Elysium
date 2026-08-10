import { auth, db, storage } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
    doc,
    getDoc,
    setDoc,
    collection,
    query,
    where,
    getDocs,
    writeBatch,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
    ref as storageRef,
    uploadBytesResumable,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
import { projectIdsMatch } from './elysium-domain.js';

const IS_DEV = ['localhost', '127.0.0.1', 'web.app'].some(h => location.hostname.includes(h));
const logger = {
    log:   (...a) => IS_DEV && console.log('[Elysium Onboarding]', ...a),
    warn:  (...a) => IS_DEV && console.warn('[Elysium Onboarding]', ...a),
    error: (...a) => console.error('[Elysium Onboarding]', ...a)
};

// ═══ Onboarding v2 — λ Immersion Protocol ════════════════════════════════════
// Post-contract, guided, tier-adaptive. Modules are gated by the client's
// subscription plan (data-tiers attribute). Progress is mirrored live to
// Firestore (one onboarding_drafts document per user/project) so the admin Co-Pilot panel can follow
// the session in real time. Assets are ingested into Firebase Storage under
// members/{uid}/onboarding/{submissionId}/{category}/.

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('onboarding-form');
    const progressFill = document.getElementById('progress-fill');
    const stepNumberLabel = document.getElementById('step-number');
    const stepCategoryLabel = document.getElementById('step-category');
    const tierNote = document.getElementById('tier-note');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');

    const allSteps = Array.from(document.querySelectorAll('.form-step'));

    const VALID_TIERS = ['hosting', 'basic', 'preferential', 'advanced'];
    const PLAN_LABELS = {
        hosting: 'Hosting',
        basic: 'Presence',
        preferential: 'Infrastructure',
        advanced: 'Ecosystem'
    };

    // Checkbox groups collected as arrays on submit
    const MULTI_KEYS = [
        'process_tools', 'current_assets', 'pending_assets', 'target_audience',
        'sensitive_data', 'past_problems', 'features', 'web_sections',
        'app_users', 'integrations', 'brand_feeling', 'site_languages'
    ];
    // Single checkboxes stored as booleans
    const BOOL_KEYS = ['privacy_consent', 'files_consent', 'marketing_consent'];

    const STORAGE_KEY_PREFIX = 'onboarding_v2_state';
    const VALID_UPLOAD_CATEGORIES = new Set(['identity', 'content', 'data']);
    const repeatMode = new URLSearchParams(window.location.search).get('repeat') === '1';

    // ── Admin-led onboarding ─────────────────────────────────────────────────
    // The onboarding is filled by the administrator together with the client,
    // from the CRM: /onboarding?client=<uid>&projectId=<id>. Every document is
    // written on the client's behalf (userId = client) while currentUser stays
    // the administrator, so the audit trail records who typed it.
    const SUPER_ADMIN_EMAIL = 'danielalonzzo@icloud.com';
    const requestedClientId = (() => {
        const value = new URLSearchParams(window.location.search).get('client');
        return value && value.length <= 128 ? value : null;
    })();

    let currentUser = null;      // signed-in administrator
    let adminMode = false;
    let targetUserId = null;     // client this onboarding belongs to
    let targetEmail = null;
    let memberData = null;
    let planType = null;            // null → tier unknown → show every module
    let visibleSteps = allSteps;    // recomputed after tier detection
    let currentIndex = 0;
    let uploadedFiles = [];         // [{category, name, size, path, url}]
    let draftTimer = null;
    let draftSyncPromise = null;
    let draftReady = false;         // avoid syncing before initial load completes
    let submissionId = crypto.randomUUID();
    let activeDraftDocumentId = null;
    let activeDraftExists = false;
    let pendingUploadCount = 0;

    const fullLang = document.documentElement.lang || 'en';
    const lang = fullLang.split('-')[0].toLowerCase();

    const i18n = {
        en: {
            fillRequired: 'Please fill in all required fields before proceeding.',
            sending: 'Sending...',
            submitLabel: 'Submit Onboarding',
            sessionExpired: 'Your session has expired. Please sign in again.',
            submitError: 'The form could not be submitted: ',
            contactSupport: '. Please contact support if the problem persists.',
            uploadTooBig: 'This file exceeds the 25 MB limit: ',
            uploadFailed: 'Upload failed: ',
            tooManyFiles: 'You can attach up to 50 files per onboarding.',
            uploadsPending: 'Wait for all file uploads to finish before submitting.',
            excludeFile: 'Exclude from this delivery (contact support for permanent deletion)',
            module: 'Module',
            of: 'of',
            planDetected: 'Plan',
            modules: 'modules',
            adminSession: 'Guided session',
            adminSessionWith: 'Filling the onboarding with',
            adminProject: 'Project',
            adminBackToCrm: 'Back to the CRM',
            adminNoPlan: 'This client has no active plan — every module is shown.',
            adminSubmitLabel: 'Publish to the client',
            adminSending: 'Publishing...'
        },
        es: {
            fillRequired: 'Por favor, complete todos los campos obligatorios antes de continuar.',
            sending: 'Enviando...',
            submitLabel: 'Enviar Onboarding',
            sessionExpired: 'Su sesión ha expirado. Por favor, inicie sesión de nuevo.',
            submitError: 'No se pudo enviar el formulario: ',
            contactSupport: '. Por favor, contacte a soporte si el problema persiste.',
            uploadTooBig: 'Este archivo supera el límite de 25 MB: ',
            uploadFailed: 'Error al subir el archivo: ',
            tooManyFiles: 'Puedes adjuntar hasta 50 archivos por onboarding.',
            uploadsPending: 'Espera a que terminen todas las cargas antes de enviar.',
            excludeFile: 'Excluir de esta entrega (contacta con soporte para borrarlo definitivamente)',
            module: 'Módulo',
            of: 'de',
            planDetected: 'Plan',
            modules: 'módulos',
            adminSession: 'Sesión conjunta',
            adminSessionWith: 'Rellenando el onboarding con',
            adminProject: 'Proyecto',
            adminBackToCrm: 'Volver al CRM',
            adminNoPlan: 'Este cliente no tiene plan activo — se muestran todos los módulos.',
            adminSubmitLabel: 'Publicar al cliente',
            adminSending: 'Publicando...'
        },
        pt: {
            fillRequired: 'Por favor, preencha todos os campos obrigatórios antes de continuar.',
            sending: 'Enviando...',
            submitLabel: 'Enviar Onboarding',
            sessionExpired: 'A sua sessão expirou. Por favor, inicie sessão novamente.',
            submitError: 'Não foi possível enviar o formulário: ',
            contactSupport: '. Por favor, contacte o suporte se o problema persistir.',
            uploadTooBig: 'Este ficheiro excede o limite de 25 MB: ',
            uploadFailed: 'Falha no carregamento: ',
            tooManyFiles: 'Pode anexar até 50 ficheiros por onboarding.',
            uploadsPending: 'Aguarde que todos os carregamentos terminem antes de enviar.',
            excludeFile: 'Excluir desta entrega (contacte o suporte para eliminação definitiva)',
            module: 'Módulo',
            of: 'de',
            planDetected: 'Plano',
            modules: 'módulos',
            adminSession: 'Sessão conjunta',
            adminSessionWith: 'A preencher o onboarding com',
            adminProject: 'Projeto',
            adminBackToCrm: 'Voltar ao CRM',
            adminNoPlan: 'Este cliente não tem plano ativo — são apresentados todos os módulos.',
            adminSubmitLabel: 'Publicar ao cliente',
            adminSending: 'A publicar...'
        }
    };
    const t = i18n[lang] || i18n.en;

    // ── Admin session ────────────────────────────────────────────────────────
    // The CRM lives only at the site root: the localized folders have no copy,
    // so these links are root-absolute.
    function crmUrl(clientId = null) {
        return clientId ? `/admin?client=${encodeURIComponent(clientId)}` : '/admin';
    }

    function renderAdminBanner() {
        const container = document.querySelector('.onboarding-container');
        if (!container || document.getElementById('admin-session-banner')) return;

        const projectId = currentProjectId();
        const clientName = memberData?.name || memberData?.company || targetEmail || targetUserId;

        const badge = document.createElement('span');
        badge.className = 'admin-session-badge';
        badge.textContent = t.adminSession;

        const who = document.createElement('span');
        who.className = 'admin-session-who';
        who.textContent = `${t.adminSessionWith} ${clientName}`
            + (targetEmail ? ` · ${targetEmail}` : '')
            + (projectId ? ` · ${t.adminProject} ${projectId}` : '');

        const back = document.createElement('a');
        back.className = 'admin-session-back';
        back.href = crmUrl(targetUserId);
        back.textContent = t.adminBackToCrm;

        const banner = document.createElement('div');
        banner.id = 'admin-session-banner';
        banner.className = 'admin-session-banner';
        banner.append(badge, who, back);
        container.prepend(banner);

        // Switching language mid-session must keep the client and the project
        document.querySelectorAll('.lang-switcher-menu a').forEach(link => {
            link.href = `${link.getAttribute('href')}${window.location.search}`;
        });
    }

    // ── Tier gating ──────────────────────────────────────────────────────────
    function containerAllowsTier(el, tier) {
        const tiers = (el.dataset.tiers || '').trim();
        if (!tiers) return true;               // untagged → all plans
        if (!tier) return true;                // unknown plan → show everything
        return tiers.split(/\s+/).includes(tier);
    }

    function subscriptionAllowsAccess(subscription) {
        if (!subscription) return false;
        const status = subscription.status;
        const toMillis = value => {
            if (!value) return 0;
            if (value.seconds) return value.seconds * 1000;
            const millis = new Date(value).getTime();
            return Number.isFinite(millis) ? millis : 0;
        };
        if (status === 'active') {
            const renewal = toMillis(subscription.nextBillingDate);
            return !renewal || Date.now() <= renewal + 15 * 86400000;
        }
        if (status === 'pending_payment') {
            if (subscription.accessGranted !== true) return false;
            const grace = toMillis(subscription.gracePeriodEnd)
                || (toMillis(subscription.nextBillingDate) ? toMillis(subscription.nextBillingDate) + 15 * 86400000 : 0);
            return Boolean(grace && Date.now() <= grace);
        }
        return false;
    }

    function applyTier(tier) {
        // Steps
        allSteps.forEach(step => {
            const allowed = containerAllowsTier(step, tier);
            step.dataset.tierHidden = allowed ? '' : '1';
            if (!allowed) step.classList.remove('active');
        });

        // Sub-groups inside visible steps
        document.querySelectorAll('.form-step [data-tiers]').forEach(group => {
            const allowed = containerAllowsTier(group, tier);
            group.dataset.tierHidden = allowed ? '' : '1';
            group.classList.toggle('hidden', !allowed);
            // Required inputs inside a tier-hidden group must never block validation
            group.querySelectorAll('[required]').forEach(input => {
                if (!allowed) {
                    input.dataset.wasRequired = '1';
                    input.required = false;
                } else if (input.dataset.wasRequired === '1') {
                    input.required = true;
                }
            });
        });

        visibleSteps = allSteps.filter(s => s.dataset.tierHidden !== '1');
        if (currentIndex >= visibleSteps.length) currentIndex = 0;

        if (tierNote) {
            tierNote.textContent = tier
                ? `${t.planDetected}: ${PLAN_LABELS[tier] || tier} — ${visibleSteps.length} ${t.modules}`
                : '';
        }
    }

    // ── UI ───────────────────────────────────────────────────────────────────
    function updateFormUI(shouldScroll = true) {
        allSteps.forEach(step => step.classList.remove('active'));
        const activeStep = visibleSteps[currentIndex];
        if (!activeStep) return;

        activeStep.classList.add('active');
        stepNumberLabel.textContent = `${t.module} ${currentIndex + 1} ${t.of} ${visibleSteps.length}`;
        stepCategoryLabel.textContent = activeStep.dataset.category;

        const pct = visibleSteps.length > 1 ? (currentIndex / (visibleSteps.length - 1)) * 100 : 100;
        progressFill.style.width = `${pct}%`;

        prevBtn.style.visibility = currentIndex === 0 ? 'hidden' : 'visible';
        const isLast = currentIndex === visibleSteps.length - 1;
        nextBtn.style.display = isLast ? 'none' : 'block';
        submitBtn.style.display = isLast ? 'block' : 'none';

        if (shouldScroll) {
            document.querySelector('.onboarding-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function validateCurrentStep() {
        const activeStep = visibleSteps[currentIndex];
        if (!activeStep) return true;

        const requiredInputs = activeStep.querySelectorAll('[required]');
        let isValid = true;

        requiredInputs.forEach(input => {
            if (input.offsetParent === null && input.type !== 'hidden') return; // hidden → skip

            if (input.type === 'checkbox' || input.type === 'radio') {
                const name = input.getAttribute('name');
                const checked = activeStep.querySelector(`input[name="${name}"]:checked`);
                if (!checked) isValid = false;
            } else {
                if (!input.value.trim()) isValid = false;
            }
        });

        if (!isValid) alert(t.fillRequired);
        return isValid;
    }

    // ── Navigation ───────────────────────────────────────────────────────────
    nextBtn.addEventListener('click', () => {
        if (validateCurrentStep() && currentIndex < visibleSteps.length - 1) {
            currentIndex++;
            updateFormUI(true);
            persistProgress();
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            updateFormUI(true);
            persistProgress();
        }
    });

    // ── Option cards ─────────────────────────────────────────────────────────
    document.querySelectorAll('.option-card').forEach(card => {
        const input = card.querySelector('input');
        if (!input) return;

        if (input.checked) card.classList.add('selected');

        input.addEventListener('change', () => {
            if (input.type === 'radio') {
                const name = input.getAttribute('name');
                document.querySelectorAll(`input[name="${name}"]`).forEach(other => {
                    other.parentElement.classList.remove('selected');
                });
            }
            card.classList.toggle('selected', input.checked);
            handleConditionals();
        });
    });

    document.querySelectorAll('#deadline-select').forEach(sel => {
        sel.addEventListener('change', handleConditionals);
    });

    // ── Conditional sections ─────────────────────────────────────────────────
    function handleConditionals() {
        // "Other" text toggles
        const toggles = [
            { checkboxId: 'tools-other-checkbox', sectionId: 'tools-other-text', inputName: 'process_tools_other' },
            { checkboxId: 'feature-other-checkbox', sectionId: 'feature-other-text', inputName: 'feature_other' },
            { checkboxId: 'brand-other-checkbox', sectionId: 'brand-other-text', inputName: 'brand_feeling_other' },
            { checkboxId: 'integration-other-checkbox', sectionId: 'integration-other-text', inputName: 'integration_other' }
        ];

        toggles.forEach(({ checkboxId, sectionId, inputName }) => {
            const checkbox = document.getElementById(checkboxId);
            const section = document.getElementById(sectionId);
            if (checkbox && section) {
                section.classList.toggle('visible', checkbox.checked);
                const input = section.querySelector(`[name="${inputName}"]`);
                if (input) input.required = checkbox.checked;
            }
        });

        // Legacy data detail
        const legacyChecked = document.querySelector('input[name="legacy_data"]:checked');
        const legacyDetail = document.getElementById('legacy-detail');
        if (legacyDetail) {
            const show = !!legacyChecked && legacyChecked.value !== 'none';
            legacyDetail.classList.toggle('visible', show);
        }

        // Deadline detail
        const deadlineSelect = document.getElementById('deadline-select');
        const deadlineDetail = document.getElementById('deadline-detail');
        if (deadlineSelect && deadlineDetail) {
            const show = deadlineSelect.value === 'yes';
            deadlineDetail.classList.toggle('visible', show);
            const dateInput = deadlineDetail.querySelector('input[name="deadline_date"]');
            if (dateInput) dateInput.required = show;
        }

        // "None" exclusivity groups
        const noneGroups = [
            { noneId: 'assets-none-checkbox', groupName: 'current_assets' },
            { noneId: 'sensitive-none-checkbox', groupName: 'sensitive_data' },
            { noneId: 'past-problems-none-checkbox', groupName: 'past_problems' },
            { noneId: 'integrations-none-checkbox', groupName: 'integrations' }
        ];

        noneGroups.forEach(({ noneId, groupName }) => {
            const noneCheckbox = document.getElementById(noneId);
            if (noneCheckbox && noneCheckbox.checked) {
                document.querySelectorAll(`input[name="${groupName}"]`).forEach(cb => {
                    if (cb !== noneCheckbox && cb.checked) {
                        cb.checked = false;
                        cb.parentElement.classList.remove('selected');
                    }
                });
            }
        });
    }

    // ── Country code auto-population ─────────────────────────────────────────
    const countrySelect = document.querySelector('select[name="contact_country"]');
    const phoneInput = document.querySelector('input[name="contact_phone"]');
    const countryCodes = {
        'Portugal': '+351 ',
        'Spain': '+34 ',
        'Espanha': '+34 ',
        'España': '+34 ',
        'Costa Rica': '+506 ',
        'Argentina': '+54 ',
        'Mexico': '+52 ',
        'México': '+52 ',
        'Colombia': '+57 ',
        'Colômbia': '+57 ',
        'Chile': '+56 '
    };

    if (countrySelect && phoneInput) {
        countrySelect.addEventListener('change', () => {
            const code = countryCodes[countrySelect.value];
            if (code && (!phoneInput.value.trim() || phoneInput.value.trim() === '+')) {
                phoneInput.value = code;
            }
        });
        phoneInput.addEventListener('focus', () => {
            if (!phoneInput.value.trim()) phoneInput.value = '+';
        });
    }

    // ── Data collection ──────────────────────────────────────────────────────
    // An element contributes data only if its module/group/conditional is
    // actually shown for this tier and this set of answers.
    function isCollected(el) {
        const step = el.closest('.form-step');
        if (step && step.dataset.tierHidden === '1') return false;

        const tierGroup = el.closest('[data-tiers]');
        if (tierGroup && tierGroup !== step && tierGroup.dataset.tierHidden === '1') return false;

        const cond = el.closest('.conditional-section');
        if (cond && !cond.classList.contains('visible')) return false;

        return true;
    }

    function collectData() {
        const data = {};
        form.querySelectorAll('input, select, textarea').forEach(el => {
            const name = el.getAttribute('name');
            if (!name || !isCollected(el)) return;

            if (BOOL_KEYS.includes(name)) {
                data[name] = el.checked;
            } else if (el.type === 'checkbox') {
                if (!data[name]) data[name] = [];
                if (el.checked) data[name].push(el.value);
            } else if (el.type === 'radio') {
                if (el.checked) data[name] = el.value;
                else if (!(name in data)) data[name] = data[name] || '';
            } else {
                data[name] = el.value.trim();
            }
        });

        // Normalize: multi keys always arrays
        MULTI_KEYS.forEach(key => {
            if (key in data && !Array.isArray(data[key])) data[key] = [data[key]];
        });

        return data;
    }

    // ── Persistence: localStorage + live Firestore draft ─────────────────────
    function localStateKey(userId = targetUserId) {
        if (!userId) return null;
        const modeSuffix = repeatMode ? ':repeat' : '';
        return `${STORAGE_KEY_PREFIX}:${userId}:${encodeURIComponent(currentProjectId() || '_account')}${modeSuffix}`;
    }

    function currentProjectId() {
        const value = new URLSearchParams(window.location.search).get('projectId');
        return value && value.length <= 128 ? value : null;
    }

    function projectIdMatches(candidate, target = currentProjectId()) {
        return projectIdsMatch(candidate, target);
    }

    function draftDocumentId(userId = targetUserId, projectId = currentProjectId()) {
        if (!userId) return null;
        const modeSuffix = repeatMode ? '__repeat' : '';
        return `${userId}__${encodeURIComponent(projectId || '_account')}${modeSuffix}`;
    }

    function timestampMillis(value) {
        if (!value) return 0;
        if (value.seconds) return value.seconds * 1000;
        const millis = new Date(value).getTime();
        return Number.isFinite(millis) ? millis : 0;
    }

    function persistProgress() {
        const data = collectData();
        const stateKey = localStateKey();
        try {
            if (stateKey) {
                localStorage.setItem(stateKey, JSON.stringify({
                    data,
                    step: currentIndex + 1,
                    uploadedFiles,
                    submissionId,
                    projectId: currentProjectId(),
                    updatedAt: Date.now()
                }));
            }
        } catch (_) { /* storage full/blocked — draft sync still covers us */ }

        scheduleDraftSync(data);
    }

    function scheduleDraftSync(data) {
        if (!currentUser || !targetUserId || !draftReady) return;
        const draftOwnerId = targetUserId;
        const draftOwnerEmail = targetEmail;
        const draftAuthor = currentUser;
        clearTimeout(draftTimer);
        draftTimer = setTimeout(async () => {
            draftTimer = null;
            if (targetUserId !== draftOwnerId) return;
            const thisSync = (async () => {
                try {
                    const activeStep = visibleSteps[currentIndex];
                    const draftId = activeDraftDocumentId || draftDocumentId(draftOwnerId);
                    await setDoc(doc(db, 'onboarding_drafts', draftId), {
                        userId: draftOwnerId,
                        userEmail: draftOwnerEmail,
                        authoredBy: adminMode ? 'admin' : 'member',
                        authorUid: draftAuthor.uid,
                        formVersion: 2,
                        planType: planType || null,
                        projectId: currentProjectId(),
                        submissionId,
                        lang: lang,
                        currentModule: activeStep ? currentIndex + 1 : 1,
                        currentModuleLabel: activeStep ? activeStep.dataset.category : '',
                        totalModules: visibleSteps.length,
                        data: data || collectData(),
                        uploadedFiles: uploadedFiles,
                        updatedAt: serverTimestamp()
                    }, { merge: true });
                    activeDraftExists = true;
                } catch (err) {
                    logger.warn('Draft sync failed:', err);
                }
            })();
            draftSyncPromise = thisSync;
            await thisSync;
            if (draftSyncPromise === thisSync) draftSyncPromise = null;
        }, 800);
    }

    function applySavedData(data) {
        if (!data || typeof data !== 'object' || Array.isArray(data)) return;
        Object.keys(data).forEach(name => {
            const value = data[name];
            Array.from(form.elements).filter(el => el.name === name).forEach(el => {
                if (el.type === 'checkbox') {
                    if (BOOL_KEYS.includes(name)) {
                        el.checked = value === true;
                    } else {
                        el.checked = Array.isArray(value) && value.includes(el.value);
                    }
                } else if (el.type === 'radio') {
                    el.checked = (el.value === value);
                } else {
                    el.value = value ?? '';
                }
                el.parentElement?.classList.toggle('selected',
                    el.parentElement?.classList.contains('option-card') ? el.checked : false);
            });
        });
        handleConditionals();
    }

    async function loadProgress() {
        const stateKey = localStateKey();
        let localState = null;
        try {
            const savedState = stateKey ? localStorage.getItem(stateKey) : null;
            if (savedState) localState = JSON.parse(savedState);
        } catch (_) { /* corrupt or blocked — ignore */ }

        let remoteDraft = null;
        activeDraftDocumentId = draftDocumentId();
        activeDraftExists = false;
        if (targetUserId) {
            try {
                const draftsSnap = await getDocs(query(
                    collection(db, 'onboarding_drafts'),
                    where('userId', '==', targetUserId)
                ));
                const expectedDraftId = draftDocumentId();
                let matchingDrafts = draftsSnap.docs.filter(item => item.id === expectedDraftId);
                // Only the standard flow migrates legacy draft IDs. A repeated
                // onboarding has an isolated draft so it can never replace an
                // in-progress first delivery for the same project.
                if (!matchingDrafts.length && !repeatMode) {
                    matchingDrafts = draftsSnap.docs.filter(item =>
                        !item.id.endsWith('__repeat')
                        && projectIdMatches(item.data().projectId));
                }
                matchingDrafts = matchingDrafts
                    .sort((a, b) => timestampMillis(b.data().updatedAt) - timestampMillis(a.data().updatedAt));
                if (matchingDrafts.length) {
                    activeDraftDocumentId = matchingDrafts[0].id;
                    activeDraftExists = true;
                    remoteDraft = matchingDrafts[0].data();
                }
            } catch (err) {
                logger.warn('Could not load remote draft:', err);
            }
        }

        if (!projectIdMatches(localState?.projectId)) localState = null;
        if (remoteDraft && !projectIdMatches(remoteDraft.projectId)) remoteDraft = null;

        const localUpdated = Number(localState?.updatedAt || 0);
        const remoteUpdated = timestampMillis(remoteDraft?.updatedAt);
        let chosen = remoteDraft && remoteUpdated >= localUpdated
            ? {
                data: remoteDraft.data,
                step: remoteDraft.currentModule,
                uploadedFiles: remoteDraft.uploadedFiles,
                submissionId: remoteDraft.submissionId
            }
            : localState;

        // Recover cleanly from an older autosave race: if this draft/local
        // state points to a submission that already committed, discard the
        // stale draft and enter the review flow with a fresh submission UUID.
        const restoredSubmissionId = typeof chosen?.submissionId === 'string'
            && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(chosen.submissionId)
            ? chosen.submissionId
            : null;
        if (restoredSubmissionId && targetUserId) {
            try {
                const finalized = await getDoc(doc(db, 'onboarding_submissions', restoredSubmissionId));
                if (finalized.exists()
                    && finalized.data().userId === targetUserId
                    && projectIdMatches(finalized.data().projectId)) {
                    chosen = null;
                    if (stateKey) localStorage.removeItem(stateKey);
                    if (activeDraftExists && remoteDraft?.submissionId === restoredSubmissionId) {
                        const cleanup = writeBatch(db);
                        cleanup.delete(doc(db, 'onboarding_drafts', activeDraftDocumentId));
                        await cleanup.commit();
                        activeDraftExists = false;
                        activeDraftDocumentId = draftDocumentId();
                    }
                }
            } catch (err) {
                logger.warn('Could not reconcile finalized onboarding draft:', err);
            }
        }

        // A completed onboarding has no draft. Prefill its latest submission
        // so "Review" is a real review/edit flow instead of an empty form.
        if (!chosen?.data && targetUserId) {
            try {
                const submissions = await getDocs(query(
                    collection(db, 'onboarding_submissions'),
                    where('userId', '==', targetUserId)
                ));
                let matchingSubmissions = submissions.docs
                    .filter(item => (item.data().projectId ?? null) === currentProjectId());
                if (!matchingSubmissions.length) {
                    matchingSubmissions = submissions.docs.filter(item =>
                        projectIdMatches(item.data().projectId));
                }
                const previous = matchingSubmissions
                    .sort((a, b) => timestampMillis(b.data().submittedAt) - timestampMillis(a.data().submittedAt))[0];
                if (previous) {
                    const previousData = previous.data().formData || {};
                    chosen = {
                        data: previousData,
                        step: 1,
                        uploadedFiles: Array.isArray(previousData.uploaded_files)
                            ? previousData.uploaded_files.map(file => ({ ...file, readOnly: true }))
                            : []
                    };
                }
            } catch (err) {
                logger.warn('Could not load previous onboarding:', err);
            }
        }

        if (chosen?.data) applySavedData(chosen.data);
        if (typeof chosen?.submissionId === 'string'
            && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(chosen.submissionId)) {
            submissionId = chosen.submissionId;
        }
        if (Array.isArray(chosen?.uploadedFiles)) {
            uploadedFiles = chosen.uploadedFiles.map(normalizeRestoredFile).filter(Boolean).slice(0, 50);
            uploadedFiles.forEach(renderRestoredFile);
            updateFilesConsentRequirement();
        }
        const savedStep = Number(chosen?.step || 1);
        if (Number.isInteger(savedStep) && savedStep >= 1 && savedStep <= visibleSteps.length) {
            currentIndex = savedStep - 1;
        }
    }

    form.addEventListener('input', () => persistProgress());
    form.addEventListener('change', () => persistProgress());

    // ── Asset ingestion (Firebase Storage) ───────────────────────────────────
    const MAX_FILE_SIZE = 25 * 1024 * 1024;
    const ALLOWED_FILE_TYPES = new Set([
        'application/pdf', 'application/postscript', 'text/csv', 'text/plain',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/zip'
    ]);

    function safeFileName(name) {
        return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
    }

    function normalizedContentType(file) {
        if (file.type) return file.type;
        const extension = file.name.split('.').pop()?.toLowerCase();
        return {
            pdf: 'application/pdf', ai: 'application/postscript', eps: 'application/postscript',
            csv: 'text/csv', txt: 'text/plain', xls: 'application/vnd.ms-excel',
            xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            zip: 'application/zip', svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp'
        }[extension] || '';
    }

    function updateFilesConsentRequirement() {
        const filesConsent = document.querySelector('input[name="files_consent"]');
        if (filesConsent) filesConsent.required = uploadedFiles.length > 0;
    }

    function createFileItem(name, done = false) {
        const li = document.createElement('li');
        li.className = `upload-file-item${done ? ' upload-done' : ''}`;
        const nameElement = document.createElement('span');
        nameElement.className = 'file-name';
        nameElement.textContent = String(name || 'file').slice(0, 240);
        const progress = document.createElement('div');
        progress.className = 'upload-file-progress';
        progress.appendChild(document.createElement('span'));
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'upload-file-remove';
        remove.title = 'Remove';
        remove.setAttribute('aria-label', 'Remove');
        remove.textContent = '×';
        li.append(nameElement, progress, remove);
        return li;
    }

    function normalizeRestoredFile(value) {
        if (!targetUserId || !value || typeof value !== 'object') return null;
        const category = String(value.category || '');
        const path = String(value.path || '');
        const expectedPrefix = `members/${targetUserId}/onboarding/`;
        const relativePath = path.startsWith(expectedPrefix) ? path.slice(expectedPrefix.length) : '';
        const pathParts = relativePath.split('/').filter(Boolean);
        const legacyPath = pathParts.length >= 2 && pathParts[0] === category;
        const versionedPath = pathParts.length >= 3
            && /^[0-9a-f-]{36}$/i.test(pathParts[0])
            && pathParts[1] === category;
        if (!VALID_UPLOAD_CATEGORIES.has(category) || (!legacyPath && !versionedPath)) return null;
        return {
            category,
            name: String(value.name || 'file').slice(0, 240),
            size: Number(value.size || 0),
            contentType: typeof value.contentType === 'string' ? value.contentType.slice(0, 160) : null,
            path,
            url: typeof value.url === 'string' && /^https:\/\//i.test(value.url) ? value.url : null,
            uploadedAt: Number(value.uploadedAt || 0),
            // Legacy paths cannot be tied to a submission in Storage Rules,
            // so they remain preserved and may only be excluded as metadata.
            readOnly: value.readOnly === true || legacyPath
        };
    }

    function renderRestoredFile(fileMeta) {
        const zone = Array.from(document.querySelectorAll('.upload-zone'))
            .find(item => item.dataset.uploadCategory === fileMeta.category);
        if (!zone) return;
        const list = zone.querySelector('.upload-file-list');
        const li = createFileItem(fileMeta.name, true);
        li.dataset.path = fileMeta.path;
        li.querySelector('.upload-file-progress span').style.width = '100%';
        if (fileMeta.readOnly) {
            li.classList.add('upload-file-readonly');
        }
        attachExcludeHandler(li, fileMeta);
        list.appendChild(li);
    }

    function attachExcludeHandler(li, fileMeta) {
        const exclude = li.querySelector('.upload-file-remove');
        exclude.title = t.excludeFile;
        exclude.setAttribute('aria-label', t.excludeFile);
        exclude.addEventListener('click', () => {
            uploadedFiles = uploadedFiles.filter(f => f.path !== fileMeta.path);
            li.remove();
            updateFilesConsentRequirement();
            persistProgress();
        });
    }

    function uploadFile(file, category, list) {
        if (!targetUserId || !VALID_UPLOAD_CATEGORIES.has(category)) return;

        if (uploadedFiles.length + pendingUploadCount >= 50) {
            alert(t.tooManyFiles);
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            alert(t.uploadTooBig + file.name);
            return;
        }

        const contentType = normalizedContentType(file);
        if (!contentType || (!contentType.startsWith('image/') && !ALLOWED_FILE_TYPES.has(contentType))) {
            alert(t.uploadFailed + file.name);
            return;
        }

        const li = createFileItem(file.name);
        list.appendChild(li);
        const progressBar = li.querySelector('.upload-file-progress span');

        pendingUploadCount++;
        // The submission UUID in the path lets Storage Rules freeze every
        // uploaded object as soon as the matching Firestore submission exists.
        const path = `members/${targetUserId}/onboarding/${submissionId}/${category}/${Date.now()}_${crypto.randomUUID()}_${safeFileName(file.name)}`;
        const task = uploadBytesResumable(storageRef(storage, path), file, {
            contentType
        });

        task.on('state_changed',
            (snap) => {
                const pct = (snap.bytesTransferred / snap.totalBytes) * 100;
                progressBar.style.width = `${pct}%`;
            },
            (err) => {
                pendingUploadCount = Math.max(0, pendingUploadCount - 1);
                logger.error('Upload error:', err);
                window.ElysiumAudio?.play('error');
                li.classList.add('upload-error');
                progressBar.style.width = '0%';
                alert(t.uploadFailed + file.name);
                setTimeout(() => li.remove(), 2500);
            },
            async () => {
                pendingUploadCount = Math.max(0, pendingUploadCount - 1);
                let url = null;
                try { url = await getDownloadURL(task.snapshot.ref); } catch (_) { /* non-fatal */ }
                const fileMeta = {
                    category: category,
                    name: file.name,
                    size: file.size,
                    contentType,
                    path: path,
                    url: url,
                    uploadedAt: Date.now()
                };
                uploadedFiles.push(fileMeta);
                li.classList.add('upload-done');
                li.dataset.path = path;
                progressBar.style.width = '100%';
                attachExcludeHandler(li, fileMeta);
                updateFilesConsentRequirement();
                persistProgress();
            }
        );
    }

    document.querySelectorAll('.upload-zone').forEach(zone => {
        const input = zone.querySelector('input[type="file"]');
        const list = zone.querySelector('.upload-file-list');
        const category = zone.dataset.uploadCategory;

        zone.addEventListener('click', (e) => {
            if (e.target.closest('.upload-file-item')) return; // clicks on chips ≠ browse
            input.click();
        });

        input.addEventListener('change', () => {
            Array.from(input.files || []).forEach(file => uploadFile(file, category, list));
            input.value = '';
        });

        ['dragenter', 'dragover'].forEach(evt => zone.addEventListener(evt, (e) => {
            e.preventDefault();
            zone.classList.add('dragover');
        }));
        ['dragleave', 'drop'].forEach(evt => zone.addEventListener(evt, (e) => {
            e.preventDefault();
            zone.classList.remove('dragover');
        }));
        zone.addEventListener('drop', (e) => {
            Array.from(e.dataTransfer?.files || []).forEach(file => uploadFile(file, category, list));
        });
    });

    // ── Auth: admin gate, prefill, tier detection, remote resume ─────────────
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = 'profiles';
            return;
        }

        // The onboarding is no longer self-service: the administrator fills it
        // together with the client from the CRM. Anyone else goes back to their
        // portal, where the published delivery is available read-only.
        const isAdmin = user.email === SUPER_ADMIN_EMAIL;
        adminMode = isAdmin && Boolean(requestedClientId);
        if (!adminMode) {
            window.location.href = isAdmin
                ? crmUrl()
                : 'profiles?section=onboardings&notice=onboarding_guided';
            return;
        }

        currentUser = user;
        targetUserId = requestedClientId;
        ['onboarding_v2_data', 'onboarding_v2_step', 'onboarding_data', 'onboarding_step']
            .forEach(key => localStorage.removeItem(key));

        try {
            const memberSnap = await getDoc(doc(db, 'members', targetUserId));
            if (!memberSnap.exists()) {
                window.location.href = crmUrl();
                return;
            }
            memberData = memberSnap.data();
            targetEmail = memberData.email || null;

            // Tier detection → module gating. Unlike the old self-service flow,
            // a missing or lapsed plan does not block the session: the admin is
            // warned and every module is shown.
            const detected = memberData.subscription?.planType;
            planType = VALID_TIERS.includes(detected) ? detected : null;
        } catch (error) {
            logger.error('Error fetching member data:', error);
            window.location.href = crmUrl();
            return;
        }

        renderAdminBanner();
        applyTier(planType);
        if (tierNote && (!planType || !subscriptionAllowsAccess(memberData.subscription))) {
            tierNote.textContent = t.adminNoPlan;
        }
        submitBtn.textContent = t.adminSubmitLabel;
        await loadProgress();

        // The client's registration data always wins over any stale draft value
        const nameInput = document.querySelector('input[name="contact_name"]');
        const companyInput = document.querySelector('input[name="company_name"]');
        const emailInput = document.querySelector('input[name="contact_email"]');
        if (memberData) {
            if (nameInput && memberData.name) nameInput.value = memberData.name;
            if (companyInput && memberData.company) companyInput.value = memberData.company;
            if (emailInput && !emailInput.value.trim() && memberData.email) {
                emailInput.value = memberData.email;
            }
        }

        draftReady = true;
        updateFormUI(false);
        scheduleDraftSync();
    });

    // ── Submission ───────────────────────────────────────────────────────────
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validateCurrentStep()) {
            window.ElysiumAudio?.play('error');
            return;
        }

        if (!currentUser || !targetUserId) {
            window.ElysiumAudio?.play('error');
            alert(t.sessionExpired);
            return;
        }

        if (pendingUploadCount > 0) {
            window.ElysiumAudio?.play('error');
            alert(t.uploadsPending);
            return;
        }

        let submitted = false;

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = adminMode ? t.adminSending : t.sending;
            clearTimeout(draftTimer);
            draftTimer = null;
            draftReady = false;
            if (draftSyncPromise) await draftSyncPromise;

            const data = collectData();
            data.uploaded_files = uploadedFiles;

            const projectId = currentProjectId();
            const memberRef = doc(db, 'members', targetUserId);
            const memberSnap = await getDoc(memberRef);
            if (!memberSnap.exists()) throw new Error('Member profile not found.');

            const submissionRef = doc(db, 'onboarding_submissions', submissionId);
            const draftRef = doc(db, 'onboarding_drafts', activeDraftDocumentId || draftDocumentId(targetUserId));
            const existingSubmission = await getDoc(submissionRef);
            if (existingSubmission.exists()) {
                const existing = existingSubmission.data();
                if (existing.userId !== targetUserId || existing.projectId !== projectId) {
                    throw new Error('Submission identifier conflict.');
                }
                if (activeDraftExists) {
                    const cleanupBatch = writeBatch(db);
                    cleanupBatch.delete(draftRef);
                    await cleanupBatch.commit();
                    activeDraftExists = false;
                }
            } else {
                const activityRef = doc(collection(db, 'activities'));
                const batch = writeBatch(db);
                batch.set(submissionRef, {
                    userId: targetUserId,
                    userEmail: targetEmail,
                    projectId,
                    formVersion: 2,
                    planType,
                    formData: data,
                    authoredBy: adminMode ? 'admin' : 'member',
                    authorUid: currentUser.uid,
                    authorEmail: currentUser.email || null,
                    submittedAt: serverTimestamp()
                });
                // La bandera del proyecto, no sólo la de la cuenta. Marcar sólo
                // `members.onboardingCompleted` obligaba al CRM y al portal a
                // deducir a cuál de los proyectos se refería, y cada uno lo
                // deducía distinto: el mismo cliente salía «Completado» en el
                // CRM y «Sin iniciar» en su propio portal.
                const memberUpdate = {
                    onboardingCompleted: true,
                    onboardingCompletedAt: serverTimestamp(),
                    lastOnboardingProjectId: projectId,
                    lastOnboardingSubmissionId: submissionRef.id,
                    lastUpdated: serverTimestamp()
                };
                const existingProjects = Array.isArray(memberSnap.data().projects)
                    ? memberSnap.data().projects
                    : [];
                if (existingProjects.some(project => projectIdsMatch(project?.id, projectId))) {
                    memberUpdate.projects = existingProjects.map(project =>
                        projectIdsMatch(project?.id, projectId)
                            ? { ...project, onboardingCompleted: true }
                            : project);
                }
                batch.update(memberRef, memberUpdate);
                batch.set(activityRef, {
                    memberId: targetUserId,
                    memberName: memberSnap.data().name || null,
                    type: 'onboarding_completed',
                    payload: {
                        projectId,
                        submissionId: submissionRef.id,
                        formVersion: 2,
                        planType,
                        authoredBy: adminMode ? 'admin' : 'member'
                    },
                    actorUid: currentUser.uid,
                    actorEmail: currentUser.email || null,
                    actorRole: adminMode ? 'admin' : 'member',
                    createdAt: serverTimestamp()
                });
                if (activeDraftExists) batch.delete(draftRef);
                await batch.commit();
                activeDraftExists = false;
            }

            const stateKey = localStateKey();
            if (stateKey) localStorage.removeItem(stateKey);

            // Damos margen a que suene la confirmación antes de descargar la
            // página (la navegación destruye el AudioContext).
            submitted = true;
            window.ElysiumAudio?.play('success');
            const destination = adminMode ? crmUrl(targetUserId) : 'thank-you';
            setTimeout(() => { window.location.href = destination; }, 500);
        } catch (error) {
            logger.error('Detailed error submitting onboarding:', error);
            window.ElysiumAudio?.play('error');
            alert(t.submitError + (error.message || 'Unknown error') + t.contactSupport);
        } finally {
            // En caso de éxito el botón sigue bloqueado hasta la redirección,
            // para que no se pueda reenviar durante esa ventana.
            if (!submitted) {
                submitBtn.disabled = false;
                submitBtn.textContent = adminMode ? t.adminSubmitLabel : t.submitLabel;
                draftReady = true;
                persistProgress();
            }
        }
    });

    // ── Initial paint (pre-auth): show module 1 of the full set ──────────────
    updateFormUI(false);
    handleConditionals();

    // Language switch: persist before navigating away
    document.querySelectorAll('.lang-switcher-menu a').forEach(link => {
        link.addEventListener('click', () => persistProgress());
    });
});
