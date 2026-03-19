import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    doc, 
    updateDoc, 
    collection, 
    addDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('onboarding-form');
    const steps = document.querySelectorAll('.form-step');
    const progressFill = document.getElementById('progress-fill');
    const stepNumberLabel = document.getElementById('step-number');
    const stepCategoryLabel = document.getElementById('step-category');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');

    let currentStep = 1;
    const totalSteps = steps.length;
    let currentUser = null;

    // Check Auth State
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            // If user logs out or session expires, redirect to login
            window.location.href = 'profiles.html';
        } else {
            currentUser = user;
        }
    });

    function updateFormUI(shouldScroll = true) {
        // Update Steps Visibility
        steps.forEach(step => {
            step.classList.remove('active');
            if (parseInt(step.dataset.step) === currentStep) {
                step.classList.add('active');

                // Update Labels
                stepNumberLabel.textContent = `Step ${currentStep} of ${totalSteps}`;
                stepCategoryLabel.textContent = step.dataset.category;
            }
        });

        // Update Progress Bar
        const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;
        progressFill.style.width = `${progressPercentage}%`;

        // Update Buttons
        prevBtn.style.visibility = currentStep === 1 ? 'hidden' : 'visible';

        if (currentStep === totalSteps) {
            nextBtn.classList.add('hidden');
            submitBtn.classList.remove('hidden');
            submitBtn.style.display = 'block'; // Explicitly set display if hidden class is CSS-based
        } else {
            nextBtn.classList.remove('hidden');
            submitBtn.classList.add('hidden');
            submitBtn.style.display = 'none';
        }

        // Scroll to top of container
        if (shouldScroll) {
            document.querySelector('.onboarding-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    const messages = {
        en: "Please fill in all required fields before proceeding.",
        es: "Por favor, complete todos los campos obligatorios antes de continuar.",
        pt: "Por favor, preencha todos os campos obrigatórios antes de continuar."
    };
    const lang = document.documentElement.lang.split('-')[0] || 'en';

    function validateCurrentStep() {
        const activeStep = document.querySelector('.form-step.active');
        if (!activeStep) return true;
        
        const requiredInputs = activeStep.querySelectorAll('[required]');
        let isValid = true;

        requiredInputs.forEach(input => {
            // Skip validation for hidden or ancestor-hidden elements
            if (input.offsetParent === null && input.type !== 'hidden') return;

            if (input.type === 'checkbox' || input.type === 'radio') {
                const name = input.getAttribute('name');
                const checked = activeStep.querySelector(`input[name="${name}"]:checked`);
                if (!checked) isValid = false;
            } else {
                if (!input.value.trim()) isValid = false;
            }
        });

        if (!isValid) {
            alert(messages[lang] || messages.en);
        }
        return isValid;
    }

    // Navigation Events
    nextBtn.addEventListener('click', () => {
        if (validateCurrentStep()) {
            if (currentStep < totalSteps) {
                currentStep++;
                updateFormUI(true);
            }
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            updateFormUI(true);
        }
    });

    // Option Card Selection Logic
    document.querySelectorAll('.option-card').forEach(card => {
        const input = card.querySelector('input');
        
        // Initial state sync
        if (input && input.checked) card.classList.add('selected');

        if (input) {
            input.addEventListener('change', () => {
                if (input.type === 'radio') {
                    // Unselect others in same name group
                    const name = input.getAttribute('name');
                    document.querySelectorAll(`input[name="${name}"]`).forEach(otherInput => {
                        otherInput.parentElement.classList.remove('selected');
                    });
                }
                
                if (input.checked) {
                    card.classList.add('selected');
                } else {
                    card.classList.remove('selected');
                }

                // Handle conditional sections
                handleConditionals();
            });
        }
    });

    // Conditional Select Listeners
    ['prev-provider-select', 'deadline-select'].forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.addEventListener('change', handleConditionals);
        }
    });

    function handleConditionals() {
        // Previous Provider
        const prevProviderSelect = document.getElementById('prev-provider-select');
        const prevProviderDetail = document.getElementById('prev-provider-detail');
        if (prevProviderSelect && prevProviderDetail) {
            prevProviderDetail.classList.toggle('visible', prevProviderSelect.value === 'yes');
        }

        // Service Specific Details
        const interests = Array.from(document.querySelectorAll('input[name="interests"]:checked')).map(i => i.value);
        const websiteExtra = document.getElementById('website-extra');
        const appExtra = document.getElementById('app-extra');

        if (websiteExtra) {
            const showWebsite = interests.includes('website') || 
                               interests.includes('redesign_code') || 
                               interests.includes('redesign_wp') ||
                               interests.includes('wordpress');
            websiteExtra.classList.toggle('visible', showWebsite);
        }
        
        if (appExtra) {
            appExtra.classList.toggle('visible', interests.includes('app_bundle'));
        }

        // Deadline
        const deadlineSelect = document.getElementById('deadline-select');
        const deadlineDetail = document.getElementById('deadline-detail');
        if (deadlineSelect && deadlineDetail) {
            deadlineDetail.classList.toggle('visible', deadlineSelect.value === 'yes');
            // Update required attribute based on visibility
            const deadlineInput = deadlineDetail.querySelector('input');
            if (deadlineInput) {
                deadlineInput.required = deadlineSelect.value === 'yes';
            }
        }
    }

    // Country Code Auto-population
    const countrySelect = document.querySelector('select[name="contact_country"]');
    const phoneInput = document.querySelector('input[name="contact_phone"]');
    const countryCodes = {
        'Portugal': '+351 ',
        'Spain': '+34 ',
        'Espanha': '+34 ',
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
            const selectedCountry = countrySelect.value;
            const code = countryCodes[selectedCountry];
            
            // Only update if the phone input is empty or only contains a +
            if (code && (!phoneInput.value.trim() || phoneInput.value.trim() === '+')) {
                phoneInput.value = code;
            }
        });

        // Ensure + on focus if empty
        phoneInput.addEventListener('focus', () => {
            if (!phoneInput.value.trim()) {
                phoneInput.value = '+';
            }
        });
    }

    // Persistence Logic
    function saveProgress() {
        const data = {};
        form.querySelectorAll('input, select, textarea').forEach(el => {
            const name = el.getAttribute('name');
            if (!name) return;

            if (el.type === 'checkbox') {
                if (!data[name]) data[name] = [];
                if (el.checked) data[name].push(el.value);
            } else if (el.type === 'radio') {
                if (el.checked) data[name] = el.value;
            } else {
                data[name] = el.value;
            }
        });

        localStorage.setItem('onboarding_data', JSON.stringify(data));
        localStorage.setItem('onboarding_step', currentStep);
    }

    function loadProgress() {
        const savedData = localStorage.getItem('onboarding_data');
        const savedStep = localStorage.getItem('onboarding_step');

        if (savedData) {
            const data = JSON.parse(savedData);
            Object.keys(data).forEach(name => {
                const value = data[name];
                const elements = form.querySelectorAll(`[name="${name}"]`);

                elements.forEach(el => {
                    if (el.type === 'checkbox') {
                        el.checked = (Array.isArray(value) && value.includes(el.value));
                    } else if (el.type === 'radio') {
                        el.checked = (el.value === value);
                    } else {
                        el.value = value;
                    }
                    // Trigger events to update UI classes and conditionals
                    el.dispatchEvent(new Event('change'));
                });
            });
        }

        if (savedStep) {
            currentStep = parseInt(savedStep);
            updateFormUI(false);
        }
    }

    // Save on every change
    form.addEventListener('input', saveProgress);
    form.addEventListener('change', saveProgress);

    // Form Submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Final validation for current (submission) step
        if (!validateCurrentStep()) return;
        
        if (!currentUser) {
            alert("Su sesión ha expirado. Por favor, inicie sesión de nuevo.");
            return;
        }

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = lang === 'es' ? 'Enviando...' : (lang === 'pt' ? 'Enviando...' : 'Sending...');

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Collect multi-selects manually since Object.fromEntries only gets one
            const multiSelects = ['interests', 'target_audience', 'features', 'web_sections', 'app_users', 'frustrations', 'current_assets', 'brand_feeling', 'integrations', 'tech_priorities', 'past_problems', 'decision_makers'];
            multiSelects.forEach(key => {
                data[key] = Array.from(formData.getAll(key));
            });

            // 1. Save Submissions to a dedicated collection
            await addDoc(collection(db, 'onboarding_submissions'), {
                userId: currentUser.uid,
                userEmail: currentUser.email,
                formData: data,
                submittedAt: serverTimestamp()
            });

            // 2. Update member profile to mark as completed
            const memberRef = doc(db, 'members', currentUser.uid);
            await updateDoc(memberRef, {
                onboardingCompleted: true,
                onboardingCompletedAt: serverTimestamp()
            });

            // Clear local storage on success
            localStorage.removeItem('onboarding_data');
            localStorage.removeItem('onboarding_step');

            window.location.href = 'thank-you.html';
        } catch (error) {
            console.error("Error submitting onboarding:", error);
            alert("Hubo un error al enviar el formulario. Por favor, inténtelo de nuevo.");
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Enviar Onboarding';
        }
    });

    // Initial Load
    loadProgress();

    // Final check for option-card focus (standardizing UI)
    document.querySelectorAll('.option-card').forEach(card => {
        const input = card.querySelector('input');
        if (input && input.checked) card.classList.add('selected');
    });

    // Language switch fix: ensure data is saved before redirecting
    document.querySelectorAll('.lang-switcher-menu a').forEach(link => {
        link.addEventListener('click', () => {
            saveProgress();
        });
    });

    // Currency Switcher Logic
    const budgetData = {
        EUR: {
            symbol: '€',
            ranges: ['<300', '300-700', '700-1500', '1500-3000', '3000-7000', '>7000'],
            texts: {
                en: ['Under 300€', '300€ – 700€', '700€ – 1,500€', '1,500€ – 3,000€', '3,000€ – 7,000€', 'More than 7,000€'],
                es: ['Menos de 300€', '300€ – 700€', '700€ – 1.500€', '1.500€ – 3.000€', '3.000€ – 7.000€', 'Más de 7.000€'],
                pt: ['Menos de 300€', '300€ – 700€', '700€ – 1.500€', '1.500€ – 3.000€', '3.000€ – 7.000€', 'Mais de 7.000€']
            }
        },
        USD: {
            symbol: '$',
            ranges: ['<300', '300-700', '700-1500', '1500-3000', '3000-7000', '>7000'],
            texts: {
                en: ['Under $300', '$300 – $700', '$700 – $1,500', '$1,500 – $3,000', '$3,000 – $7,000', 'More than $7,000'],
                es: ['Menos de $300', '$300 – $700', '$700 – $1.500', '$1.500 – $3.000', '$3.000 – $7.000', 'Más de $7,000'],
                pt: ['Menos de $300', '$300 – $700', '$700 – $1.500', '$1.500 – $3.000', '$3.000 – $7.000', 'Mais de $7,000']
            }
        },
        CRC: {
            symbol: '₡',
            ranges: ['<250k', '250k-500k', '500k-1M', '1M-2.5M', '2.5M-5M', '>5M'],
            texts: {
                en: ['Under 250,000₡', '250,000₡ – 500,000₡', '500,000₡ – 1,000,000₡', '1,000,000₡ – 2,500,000₡', '2,500,000₡ – 5,000,000₡', 'More than 5,000,000₡'],
                es: ['Menos de 250.000₡', '250.000₡ – 500.000₡', '500.000₡ – 1.000.000₡', '1.000.000₡ – 2.500.000₡', '2.500.000₡ – 5.000.000₡', 'Más de 5.000.000₡'],
                pt: ['Menos de 250.000₡', '250.000₡ – 500.000₡', '500.000₡ – 1.000.000₡', '1.000.000₡ – 2.500.000₡', '2.500.000₡ – 5.000.000₡', 'Mais de 5.000.000₡']
            }
        }
    };

    const currencyBtns = document.querySelectorAll('.currency-switcher button');
    const budgetSelect = document.getElementById('budget-select');
    const fullLang = document.documentElement.lang || 'en';
    const langCode = fullLang.split('-')[0].toLowerCase(); // Handle es-CR, pt-PT, etc.

    currencyBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const currency = btn.dataset.currency;
            
            // Update buttons active state
            currencyBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update budget select options
            if (budgetSelect && budgetData[currency]) {
                const data = budgetData[currency];
                const texts = data.texts[langCode] || data.texts['en'];
                const currentValue = budgetSelect.value;
                
                const selectLabels = {
                    en: { placeholder: 'Select range', guidance: 'Prefer guidance based on scope' },
                    es: { placeholder: 'Seleccione rango', guidance: 'Prefiero orientación según alcance' },
                    pt: { placeholder: 'Selecione intervalo', guidance: 'Prefiro orientação conforme o âmbito' }
                };
                const labels = selectLabels[langCode] || selectLabels['en'];

                budgetSelect.innerHTML = '';
                
                const placeholder = document.createElement('option');
                placeholder.value = '';
                placeholder.textContent = labels.placeholder;
                budgetSelect.appendChild(placeholder);
                
                data.ranges.forEach((range, index) => {
                    const option = document.createElement('option');
                    option.value = range;
                    option.textContent = texts[index];
                    budgetSelect.appendChild(option);
                });
                
                const guidance = document.createElement('option');
                guidance.value = 'guidance';
                guidance.textContent = labels.guidance;
                budgetSelect.appendChild(guidance);

                if (currentValue === 'guidance') budgetSelect.value = 'guidance';
            }
        });
    });
});
