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
    collection
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let isSigningUp = false;

const loginView = document.getElementById('login-view');
const signupView = document.getElementById('signup-view');
const authSection = document.getElementById('auth-section');
const profileSection = document.getElementById('profile-section');
const errorMsg = document.getElementById('error-message');

const showSignup = document.getElementById('show-signup');
const showLogin = document.getElementById('show-login');
const prospectView = document.getElementById('prospect-view');
const showProspect = document.getElementById('show-prospect');
const showProspectFromSignup = document.getElementById('show-prospect-from-signup');
const showLoginFromProspect = document.getElementById('show-login-from-prospect');
const showSignupFromProspect = document.getElementById('show-signup-from-prospect');

const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const prospectForm = document.getElementById('prospect-form');
const logoutBtn = document.getElementById('logoutBtn');

// View Toggles
showSignup.addEventListener('click', (e) => {
    e.preventDefault();
    loginView.classList.add('hidden');
    prospectView.classList.add('hidden');
    signupView.classList.remove('hidden');
    errorMsg.classList.add('hidden');
});

showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    signupView.classList.add('hidden');
    prospectView.classList.add('hidden');
    loginView.classList.remove('hidden');
    errorMsg.classList.add('hidden');
});

const showProspectHandler = (e) => {
    e.preventDefault();
    loginView.classList.add('hidden');
    signupView.classList.add('hidden');
    prospectView.classList.remove('hidden');
    errorMsg.classList.add('hidden');
};

if (showProspect) showProspect.addEventListener('click', showProspectHandler);
if (showProspectFromSignup) showProspectFromSignup.addEventListener('click', showProspectHandler);

showLoginFromProspect.addEventListener('click', (e) => {
    e.preventDefault();
    prospectView.classList.add('hidden');
    loginView.classList.remove('hidden');
    errorMsg.classList.add('hidden');
});

showSignupFromProspect.addEventListener('click', (e) => {
    e.preventDefault();
    prospectView.classList.add('hidden');
    signupView.classList.remove('hidden');
    errorMsg.classList.add('hidden');
});

// Prospect Checkbox Toggle
const prospectIsClientCheckbox = document.getElementById('prospect-is-client');
const prospectLicenseGroup = document.getElementById('prospect-license-group');
const prospectLicenseInput = document.getElementById('prospect-license');

prospectIsClientCheckbox.addEventListener('change', (e) => {
    if (e.target.checked) {
        prospectLicenseGroup.classList.remove('hidden');
        prospectLicenseInput.setAttribute('required', 'true');
    } else {
        prospectLicenseGroup.classList.add('hidden');
        prospectLicenseInput.removeAttribute('required');
        prospectLicenseInput.value = '';
    }
});

function showError(text) {
    errorMsg.textContent = text;
    errorMsg.classList.remove('hidden');
}

// Authentication State Observer
onAuthStateChanged(auth, async (user) => {
    if (isSigningUp) return; // Prevent interference during registration

    if (user) {
        const isPageOnboarding = window.location.pathname.includes('onboarding.html');
        
        try {
            const memberRef = doc(db, 'members', user.uid);
            const memberDoc = await getDoc(memberRef);
            
            let onboardingCompleted = false;
            let userData = null;

            if (memberDoc.exists()) {
                userData = memberDoc.data();
                onboardingCompleted = userData.onboardingCompleted === true;
            } else {
                // If the document doesn't exist for a logged-in user, create it (auto-fix for legacy users)
                // Skip if user was just created to prevent race conditions even on cross-tab
                const isNewUser = Date.now() - new Date(user.metadata.creationTime).getTime() < 60000;
                
                if (!isNewUser) {
                    userData = {
                        name: user.displayName || 'Partner',
                        email: user.email,
                        role: 'partner',
                        onboardingCompleted: false,
                        createdAt: serverTimestamp()
                    };
                    await setDoc(memberRef, userData);
                } else {
                    return; // Wait for registration block to finish it
                }
                onboardingCompleted = false;
            }

            // Special Case: Super Admin Redirect
            if (user.email === 'danielalonzzo@icloud.com' && sessionStorage.getItem('dev_mode') !== 'true') {
                if (!window.location.pathname.includes('admin.html')) {
                    const pathParts = window.location.pathname.split('/');
                    const isLocalized = pathParts.some(p => p === 'es' || p === 'pt');
                    
                    // Capture and persist current language context
                    if (isLocalized) {
                        const langCode = pathParts.find(p => p === 'es' || p === 'pt');
                        localStorage.setItem('elysium_lang', langCode);
                        localStorage.setItem('langOverride', 'true');
                    }
                    
                    window.location.href = isLocalized ? '../admin.html' : 'admin.html';
                }
                return;
            }

            // Global Block: Force completion of onboarding (only for partners)
            if (userData.role !== 'prospect' && !isPageOnboarding) {
                const projects = userData.projects || [];
                
                // Legacy check
                if (projects.length === 0 && !userData.onboardingCompleted) {
                    const pathParts = window.location.pathname.split('/');
                    const isLocalized = pathParts.some(p => p === 'es' || p === 'pt');
                    window.location.href = isLocalized ? 'onboarding.html' : 'onboarding.html';
                    return;
                }

                // Check if ANY project requires onboarding
                const projectNeedingOnboarding = projects.find(p => 
                    p.projectStage === 'prospect' || 
                    p.onboardingCompleted === false || 
                    (p.id !== 'project-1' && !p.onboardingCompleted)
                );

                if (projectNeedingOnboarding) {
                    const pathParts = window.location.pathname.split('/');
                    const isLocalized = pathParts.some(p => p === 'es' || p === 'pt');
                    window.location.href = `onboarding.html?projectId=${projectNeedingOnboarding.id}`;
                    return;
                }
            }

            // If we are on profiles.html and onboarding IS completed (or it's a prospect), show the portal
            if (!isPageOnboarding && authSection && profileSection) {
                authSection.parentElement.parentElement.classList.add('hidden'); // Hide the wrapper section
                profileSection.classList.remove('hidden');
                
                // Hide global layout for SPA feel
                const navbar = document.querySelector('.navbar');
                const footer = document.querySelector('footer');
                if (navbar) navbar.style.display = 'none';
                if (footer) footer.style.display = 'none';
                document.body.style.overflow = 'hidden';
                
                // Bind Data
                const welcomeName = document.getElementById('sidebar-welcome-name');
                const partnerCompany = document.getElementById('sidebar-partner-company');
                
                const pName = document.getElementById('profile-name');
                const pEmail = document.getElementById('profile-email');
                const pCompany = document.getElementById('profile-company');
                const pLicense = document.getElementById('profile-license');

                if (userData.role === 'prospect') {
                    if (welcomeName) welcomeName.textContent = `Welcome, ${userData.name || 'Prospect'}`;
                    if (partnerCompany) partnerCompany.textContent = "Your account is under review.";
                    
                    if (pName) pName.textContent = userData.name || '-';
                    if (pEmail) pEmail.textContent = userData.email || '-';
                    if (pCompany) pCompany.textContent = "Under review";
                    if (pLicense) pLicense.textContent = "Pending";
                    
                    // Hide any project access button if it exists
                    const projectBtnContainer = document.getElementById('client-projects-list');
                    if (projectBtnContainer) projectBtnContainer.innerHTML = '<p style="color: var(--color-text-secondary);">Your account is under review.</p>';
                } else {
                    if (welcomeName) welcomeName.textContent = `Welcome, ${userData.name || 'Partner'}`;
                    if (partnerCompany) partnerCompany.textContent = userData.company || '';
                    
                    if (pName) pName.textContent = userData.name || '-';
                    if (pEmail) pEmail.textContent = userData.email || '-';
                    if (pCompany) pCompany.textContent = userData.company || '-';
                    if (pLicense) pLicense.textContent = userData.licenseCode || 'Active';

                    
                    if (userData.projectUrl || (userData.projects && userData.projects.length > 0)) {
                        const projectListContainer = document.getElementById('client-projects-list');
                        if (projectListContainer) {
                            projectListContainer.innerHTML = ''; // Clear existing
                            
                            const isEs = window.location.pathname.includes('/es/');
                            const isPt = window.location.pathname.includes('/pt/');
                            let btnText = 'Access My Project';
                            if (isEs) btnText = 'Acceder a mi Proyecto';
                            if (isPt) btnText = 'Acessar meu Projeto';
                            
                            // Ensure there is at least one project from the new format or legacy format
                            const projectsToRender = userData.projects || [{
                                id: 'legacy',
                                name: userData.company || 'Main Project',
                                projectUrl: userData.projectUrl
                            }];
                            
                            projectsToRender.forEach((proj, index) => {
                                if (proj.projectUrl) {
                                    const a = document.createElement('a');
                                    a.href = proj.projectUrl;
                                    a.target = '_blank';
                                    a.className = 'btn btn-primary';
                                    a.style.display = 'inline-flex';
                                    a.style.alignItems = 'center';
                                    a.style.gap = '0.5rem';
                                    a.style.border = 'none !important';
                                    a.style.width = '100%';
                                    a.style.justifyContent = 'center';
                                    
                                    const projName = proj.name || `Project ${index + 1}`;
                                    
                                    a.innerHTML = `
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 1.2rem; height: 1.2rem;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                        ${btnText} - ${projName}
                                    `;
                                    projectListContainer.appendChild(a);
                                }
                            });
                        }
                    }
                } // closes else (partner block)
        } // closes if (!isPageOnboarding)

        } catch (error) {
            console.error("Error in auth state handling:", error);
        }
    } else {
        if (authSection && profileSection) {
            authSection.classList.remove('hidden');
            profileSection.classList.add('hidden');
        }
        
        // If logged out and on onboarding page, redirect to profiles
        if (window.location.pathname.includes('onboarding.html')) {
            window.location.href = 'profiles.html';
        }
    }
});

// Login Logic
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        showError("Invalid credentials. Please check your email and password.");
    }
});

// Signup Logic with License Validation
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    isSigningUp = true;
    const name = document.getElementById('signup-name').value;
    const company = document.getElementById('signup-company').value;
    const email = document.getElementById('signup-email').value;
    const licenseCode = document.getElementById('signup-license').value.trim();
    const password = document.getElementById('signup-password').value;
    const repeatPassword = document.getElementById('signup-password-repeat').value;

    if (password.length < 6) {
        showError("Password must be at least 6 characters.");
        isSigningUp = false;
        return;
    }

    if (password !== repeatPassword) {
        showError("Passwords do not match.");
        isSigningUp = false;
        return;
    }

    try {
        // 1. Validate License
        const licenseRef = doc(db, 'licenses', licenseCode);
        const licenseSnap = await getDoc(licenseRef);

        if (!licenseSnap.exists()) {
            showError("Invalid license code. Please contact Elysium to receive one.");
            isSigningUp = false;
            return;
        }

        const licenseData = licenseSnap.data();
        if (licenseData.status !== 'active') {
            showError("This license has already been used or is inactive.");
            isSigningUp = false;
            return;
        }

        // 2. Create User
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 3. Save Member Data First
        await setDoc(doc(db, 'members', user.uid), {
            name: name,
            company: company,
            email: email,
            licenseCode: licenseCode,
            role: 'partner',
            onboardingCompleted: false, // New field for mandatory onboarding
            createdAt: serverTimestamp()
        });

        // 4. Update Profile
        await updateProfile(user, { displayName: name });

        // 5. Mark License as Used Last
        try {
            await updateDoc(licenseRef, {
                status: 'used',
                assignedTo: email,
                usedAt: serverTimestamp()
            });
        } catch (licenseError) {
            console.warn("License update failed (check Firestore rules):", licenseError);
            // We don't throw here so the user can still proceed since the account is already created
        }

        // Redirect manually on successful signup
        const pathParts = window.location.pathname.split('/');
        const isLocalized = pathParts.some(p => p === 'es' || p === 'pt');
        
        if (isLocalized) {
            window.location.href = 'onboarding.html';
        } else {
            window.location.href = 'onboarding.html';
        }

    } catch (error) {
        isSigningUp = false;
        console.error(error);
        if (error.code === 'auth/email-already-in-use') {
            showError("This email is already registered.");
        } else {
            showError("An error occurred during registration: " + error.message);
        }
    }
});

// Logout Logic
logoutBtn.addEventListener('click', () => {
    signOut(auth);
});

// Prospect Registration Logic
prospectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    isSigningUp = true;
    const name = document.getElementById('prospect-name').value;
    const company = document.getElementById('prospect-company').value;
    const email = document.getElementById('prospect-email').value;
    const description = document.getElementById('prospect-description').value;
    const isClient = document.getElementById('prospect-is-client').checked;
    const licenseCode = document.getElementById('prospect-license').value.trim();
    const successMsg = document.getElementById('prospect-success-msg');
    const submitBtn = document.querySelector('#prospect-form button[type="submit"]');

    try {
        if (isClient && licenseCode) {
            // Validate the license actually exists if they claim to be a client
            const licenseRef = doc(db, 'licenses', licenseCode);
            const licenseSnap = await getDoc(licenseRef);
            if (!licenseSnap.exists()) {
                showError("Invalid license code. Please verify your Elysium license number.");
                isSigningUp = false;
                return;
            }
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';

        await addDoc(collection(db, 'prospects'), {
            name: name,
            company: company,
            email: email,
            projectDescription: description,
            isExistingClient: isClient,
            licenseCode: isClient ? licenseCode : null,
            createdAt: serverTimestamp(),
            status: 'pending' // 'pending', 'linked', 'rejected'
        });

        // Show success message and reset form
        document.getElementById('prospect-form').reset();
        errorMsg.classList.add('hidden');
        successMsg.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Project Request'; // Or original text

    } catch (error) {
        isSigningUp = false;
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Project Request';
        console.error("Prospect registration error:", error);
        showError("An error occurred during submission: " + error.message);
    }
});


// ==========================================
// SIDEBAR NAVIGATION LOGIC (CLIENT SPA)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.admin-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active from all nav items
            navItems.forEach(nav => nav.classList.remove('active'));
            // Add active to clicked item
            item.classList.add('active');

            // Hide all sections
            sections.forEach(sec => {
                sec.classList.remove('active');
                sec.style.display = 'none';
            });

            // Show target section
            const targetId = item.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add('active');
                targetSection.style.display = 'block';
            }
        });
    });

    // ==========================================
    // STRIPE LOGIC
    // ==========================================
    let searchParams = new URLSearchParams(window.location.search);
    
    function showActiveSubscriptionView() {
        const noSubView = document.getElementById('no-subscription-view');
        const activeSubView = document.getElementById('active-subscription-view');
        const noPaymentMethods = document.getElementById('no-payment-methods');
        
        // Also update quick status and profile status
        const quickSubStatus = document.getElementById('quick-sub-status');
        const profileSubStatus = document.getElementById('profile-subscription-status');
        
        if (noSubView && activeSubView) {
            noSubView.classList.add('hidden');
            noSubView.style.display = 'none';
            
            activeSubView.classList.remove('hidden');
            activeSubView.style.display = 'block';
            
            if (noPaymentMethods) {
                noPaymentMethods.style.display = 'none';
            }
        }
        
        if (quickSubStatus) quickSubStatus.innerHTML = '<span style="color: #00c875;">● Active Subscription</span>';
        if (profileSubStatus) profileSubStatus.innerHTML = '<span style="color: #00c875;">● Active Subscription</span>';
    }

    if (searchParams.has('session_id')) {
        const session_id = searchParams.get('session_id');
        const sessionIdInput = document.getElementById('session-id-payment');
        if (sessionIdInput) {
            sessionIdInput.setAttribute('value', session_id);
            showActiveSubscriptionView();
        }
    } else {
        const storedSessionId = localStorage.getItem('stripe_session_id');
        const sessionIdInput = document.getElementById('session-id-payment');
        if (storedSessionId && sessionIdInput) {
            sessionIdInput.setAttribute('value', storedSessionId);
            showActiveSubscriptionView();
        }
    }

});
