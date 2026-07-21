import { auth, db, storage } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
    doc,
    getDoc,
    updateDoc,
    setDoc,
    deleteDoc,
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
    ref as storageRef,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// ═══ Onboarding v2 — λ Immersion Protocol ════════════════════════════════════
// Post-contract, guided, tier-adaptive. Modules are gated by the client's
// subscription plan (data-tiers attribute). Progress is mirrored live to
// Firestore (onboarding_drafts/{uid}) so the admin Co-Pilot panel can follow
// the session in real time. Assets are ingested into Firebase Storage under
// members/{uid}/onboarding/{category}/.

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

    const VALID_TIERS = ['hosting', 'basic', 'preferential', 'advanced', 'crm'];
    const PLAN_LABELS = {
        hosting: 'Domain & Hosting',
        basic: 'Basic Maintenance',
        preferential: 'Preferential Maintenance',
        advanced: 'Advanced Maintenance',
        crm: 'Custom Core CRM'
    };

    // Checkbox groups collected as arrays on submit
    const MULTI_KEYS = [
        'process_tools', 'current_assets', 'pending_assets', 'target_audience',
        'sensitive_data', 'past_problems', 'features', 'web_sections',
        'app_users', 'integrations', 'brand_feeling', 'site_languages'
    ];
    // Single checkboxes stored as booleans
    const BOOL_KEYS = ['privacy_consent', 'files_consent', 'marketing_consent'];

    const STORAGE_KEY_DATA = 'onboarding_v2_data';
    const STORAGE_KEY_STEP = 'onboarding_v2_step';

    let currentUser = null;
    let memberData = null;
    let planType = null;            // null → tier unknown → show every module
    let visibleSteps = allSteps;    // recomputed after tier detection
    let currentIndex = 0;
    let uploadedFiles = [];         // [{category, name, size, path, url}]
    let draftTimer = null;
    let draftReady = false;         // avoid syncing before initial load completes

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
            module: 'Module',
            of: 'of',
            planDetected: 'Plan',
            modules: 'modules'
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
            module: 'Módulo',
            of: 'de',
            planDetected: 'Plan',
            modules: 'módulos'
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
            module: 'Módulo',
            of: 'de',
            planDetected: 'Plano',
            modules: 'módulos'
        }
    };
    const t = i18n[lang] || i18n.en;

    // ── Tier gating ──────────────────────────────────────────────────────────
    function containerAllowsTier(el, tier) {
        const tiers = (el.dataset.tiers || '').trim();
        if (!tiers) return true;               // untagged → all plans
        if (!tier) return true;                // unknown plan → show everything
        return tiers.split(/\s+/).includes(tier);
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
    function persistProgress() {
        const data = collectData();
        try {
            localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(data));
            localStorage.setItem(STORAGE_KEY_STEP, visibleSteps[currentIndex]?.dataset.step || '1');
        } catch (_) { /* storage full/blocked — draft sync still covers us */ }

        scheduleDraftSync(data);
    }

    function scheduleDraftSync(data) {
        if (!currentUser || !draftReady) return;
        clearTimeout(draftTimer);
        draftTimer = setTimeout(async () => {
            try {
                const activeStep = visibleSteps[currentIndex];
                await setDoc(doc(db, 'onboarding_drafts', currentUser.uid), {
                    userId: currentUser.uid,
                    userEmail: currentUser.email || null,
                    formVersion: 2,
                    planType: planType || null,
                    lang: lang,
                    currentModule: activeStep ? Number(activeStep.dataset.step) : 1,
                    currentModuleLabel: activeStep ? activeStep.dataset.category : '',
                    totalModules: visibleSteps.length,
                    data: data || collectData(),
                    uploadedFiles: uploadedFiles,
                    updatedAt: serverTimestamp()
                }, { merge: true });
            } catch (err) {
                console.warn('Draft sync failed:', err);
            }
        }, 800);
    }

    function applySavedData(data) {
        Object.keys(data).forEach(name => {
            const value = data[name];
            form.querySelectorAll(`[name="${name}"]`).forEach(el => {
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
        // 1. Local first (same device)
        let restored = false;
        const savedData = localStorage.getItem(STORAGE_KEY_DATA);
        if (savedData) {
            try {
                applySavedData(JSON.parse(savedData));
                restored = true;
            } catch (_) { /* corrupt — ignore */ }
        }

        // 2. Firestore draft (another device, or localStorage cleared)
        if (currentUser) {
            try {
                const draftSnap = await getDoc(doc(db, 'onboarding_drafts', currentUser.uid));
                if (draftSnap.exists()) {
                    const draft = draftSnap.data();
                    if (!restored && draft.data) {
                        applySavedData(draft.data);
                        restored = true;
                    }
                    if (Array.isArray(draft.uploadedFiles)) {
                        uploadedFiles = draft.uploadedFiles;
                        uploadedFiles.forEach(renderRestoredFile);
                        updateFilesConsentRequirement();
                    }
                }
            } catch (err) {
                console.warn('Could not load remote draft:', err);
            }
        }

        const savedStep = localStorage.getItem(STORAGE_KEY_STEP);
        if (savedStep) {
            const idx = visibleSteps.findIndex(s => s.dataset.step === savedStep);
            if (idx >= 0) currentIndex = idx;
        }
    }

    form.addEventListener('input', () => persistProgress());
    form.addEventListener('change', () => persistProgress());

    // ── Asset ingestion (Firebase Storage) ───────────────────────────────────
    const MAX_FILE_SIZE = 25 * 1024 * 1024;

    function safeFileName(name) {
        return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
    }

    function updateFilesConsentRequirement() {
        const filesConsent = document.querySelector('input[name="files_consent"]');
        if (filesConsent) filesConsent.required = uploadedFiles.length > 0;
    }

    function fileItemHTML(name) {
        return `
            <span class="file-name">${name}</span>
            <div class="upload-file-progress"><span></span></div>
            <button type="button" class="upload-file-remove" title="Remove">×</button>`;
    }

    function renderRestoredFile(fileMeta) {
        const zone = document.querySelector(`.upload-zone[data-upload-category="${fileMeta.category}"]`);
        if (!zone) return;
        const list = zone.querySelector('.upload-file-list');
        const li = document.createElement('li');
        li.className = 'upload-file-item upload-done';
        li.dataset.path = fileMeta.path;
        li.innerHTML = fileItemHTML(fileMeta.name);
        li.querySelector('.upload-file-progress span').style.width = '100%';
        attachRemoveHandler(li, fileMeta);
        list.appendChild(li);
    }

    function attachRemoveHandler(li, fileMeta) {
        li.querySelector('.upload-file-remove').addEventListener('click', async () => {
            try {
                await deleteObject(storageRef(storage, fileMeta.path));
            } catch (err) {
                console.warn('Could not delete file from storage:', err);
            }
            uploadedFiles = uploadedFiles.filter(f => f.path !== fileMeta.path);
            li.remove();
            updateFilesConsentRequirement();
            persistProgress();
        });
    }

    function uploadFile(file, category, list) {
        if (!currentUser) return;

        if (file.size > MAX_FILE_SIZE) {
            alert(t.uploadTooBig + file.name);
            return;
        }

        const li = document.createElement('li');
        li.className = 'upload-file-item';
        li.innerHTML = fileItemHTML(file.name);
        list.appendChild(li);
        const progressBar = li.querySelector('.upload-file-progress span');

        const path = `members/${currentUser.uid}/onboarding/${category}/${Date.now()}_${safeFileName(file.name)}`;
        const task = uploadBytesResumable(storageRef(storage, path), file, {
            contentType: file.type || 'application/octet-stream'
        });

        task.on('state_changed',
            (snap) => {
                const pct = (snap.bytesTransferred / snap.totalBytes) * 100;
                progressBar.style.width = `${pct}%`;
            },
            (err) => {
                console.error('Upload error:', err);
                window.ElysiumAudio?.play('error');
                li.classList.add('upload-error');
                progressBar.style.width = '0%';
                alert(t.uploadFailed + file.name);
                setTimeout(() => li.remove(), 2500);
            },
            async () => {
                let url = null;
                try { url = await getDownloadURL(task.snapshot.ref); } catch (_) { /* non-fatal */ }
                const fileMeta = {
                    category: category,
                    name: file.name,
                    size: file.size,
                    contentType: file.type || null,
                    path: path,
                    url: url,
                    uploadedAt: Date.now()
                };
                uploadedFiles.push(fileMeta);
                li.classList.add('upload-done');
                li.dataset.path = path;
                progressBar.style.width = '100%';
                attachRemoveHandler(li, fileMeta);
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

    // ── Auth: prefill, tier detection, remote resume ─────────────────────────
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = 'profiles.html';
            return;
        }
        currentUser = user;

        try {
            const memberSnap = await getDoc(doc(db, 'members', user.uid));
            if (memberSnap.exists()) {
                memberData = memberSnap.data();

                // Tier detection → module gating
                const detected = memberData.subscription?.planType;
                planType = VALID_TIERS.includes(detected) ? detected : null;
            }
        } catch (error) {
            console.error('Error fetching member data:', error);
        }

        applyTier(planType);
        await loadProgress();

        // Registration data always wins over any stale draft values
        const nameInput = document.querySelector('input[name="contact_name"]');
        const companyInput = document.querySelector('input[name="company_name"]');
        const emailInput = document.querySelector('input[name="contact_email"]');
        if (memberData) {
            if (nameInput && memberData.name) nameInput.value = memberData.name;
            if (companyInput && memberData.company) companyInput.value = memberData.company;
            if (emailInput && !emailInput.value.trim() && (memberData.email || user.email)) {
                emailInput.value = memberData.email || user.email;
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

        if (!currentUser) {
            window.ElysiumAudio?.play('error');
            alert(t.sessionExpired);
            return;
        }

        let submitted = false;

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = t.sending;

            const data = collectData();
            data.uploaded_files = uploadedFiles;

            const urlParams = new URLSearchParams(window.location.search);
            const projectId = urlParams.get('projectId');

            // 1. Dedicated submissions collection (versioned)
            await addDoc(collection(db, 'onboarding_submissions'), {
                userId: currentUser.uid,
                userEmail: currentUser.email,
                projectId: projectId || null,
                formVersion: 2,
                planType: planType || null,
                formData: data,
                submittedAt: serverTimestamp()
            });

            // 2. Member profile update
            const memberRef = doc(db, 'members', currentUser.uid);
            const memberSnap = await getDoc(memberRef);
            if (memberSnap.exists()) {
                const member = memberSnap.data();

                if (projectId && member.projects) {
                    const updatedProjects = member.projects.map(p => {
                        if (p.id === projectId) {
                            return { ...p, onboardingCompleted: true, projectStage: p.projectStage || 'first_contact' };
                        }
                        return p;
                    });
                    await updateDoc(memberRef, {
                        projects: updatedProjects,
                        lastUpdated: serverTimestamp()
                    });
                } else {
                    await updateDoc(memberRef, {
                        onboardingCompleted: true,
                        onboardingCompletedAt: serverTimestamp(),
                        lastUpdated: serverTimestamp()
                    });
                }
            }

            // 3. Append to the immutable activity log (fire-and-forget)
            addDoc(collection(db, 'activities'), {
                memberId: currentUser.uid,
                memberName: memberSnap.exists() ? (memberSnap.data().name || null) : null,
                type: 'onboarding_completed',
                payload: { projectId: projectId || null, formVersion: 2, planType: planType || null },
                actorUid: currentUser.uid,
                actorEmail: currentUser.email || null,
                actorRole: 'member',
                createdAt: serverTimestamp()
            }).catch(err => console.warn('Activity log failed:', err));

            // 4. Clear the live draft and local cache
            deleteDoc(doc(db, 'onboarding_drafts', currentUser.uid))
                .catch(err => console.warn('Draft cleanup failed:', err));
            localStorage.removeItem(STORAGE_KEY_DATA);
            localStorage.removeItem(STORAGE_KEY_STEP);
            // Legacy v1 keys, if any survive
            localStorage.removeItem('onboarding_data');
            localStorage.removeItem('onboarding_step');

            // Damos margen a que suene la confirmación antes de descargar la
            // página (la navegación destruye el AudioContext).
            submitted = true;
            window.ElysiumAudio?.play('success');
            setTimeout(() => { window.location.href = 'thank-you.html'; }, 500);
        } catch (error) {
            console.error('Detailed error submitting onboarding:', error);
            window.ElysiumAudio?.play('error');
            alert(t.submitError + (error.message || 'Unknown error') + t.contactSupport);
        } finally {
            // En caso de éxito el botón sigue bloqueado hasta la redirección,
            // para que no se pueda reenviar durante esa ventana.
            if (!submitted) {
                submitBtn.disabled = false;
                submitBtn.textContent = t.submitLabel;
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
