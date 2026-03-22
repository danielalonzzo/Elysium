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
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let isSigningUp = false;

const loginView = document.getElementById('login-view');
const signupView = document.getElementById('signup-view');
const authSection = document.getElementById('auth-section');
const profileSection = document.getElementById('profile-section');
const errorMsg = document.getElementById('error-message');

const showSignup = document.getElementById('show-signup');
const showLogin = document.getElementById('show-login');

const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const logoutBtn = document.getElementById('logoutBtn');

// View Toggles
showSignup.addEventListener('click', (e) => {
    e.preventDefault();
    loginView.classList.add('hidden');
    signupView.classList.remove('hidden');
    errorMsg.classList.add('hidden');
});

showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    signupView.classList.add('hidden');
    loginView.classList.remove('hidden');
    errorMsg.classList.add('hidden');
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
            if (user.email === 'danielalonzzo@icloud.com') {
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

            // Global Block: Force completion of onboarding
            if (!onboardingCompleted && !isPageOnboarding) {
                // Redirect to localized onboarding
                const pathParts = window.location.pathname.split('/');
                const isLocalized = pathParts.some(p => p === 'es' || p === 'pt');
                
                if (isLocalized) {
                    window.location.href = 'onboarding.html';
                } else {
                    window.location.href = 'onboarding.html';
                }
                return;
            }

            // If we are on profiles.html and onboarding IS completed, show the portal
            if (!isPageOnboarding && authSection && profileSection) {
                authSection.classList.add('hidden');
                profileSection.classList.remove('hidden');
                document.getElementById('welcome-name').textContent = `Welcome, ${userData.name || 'Partner'}`;
                const companyEl = document.getElementById('partner-company');
                if (companyEl) companyEl.textContent = userData.company || '';
                
                if (userData.projectUrl) {
                    let projectBtnContainer = document.getElementById('project-access-container');
                    if (!projectBtnContainer) {
                        projectBtnContainer = document.createElement('div');
                        projectBtnContainer.id = 'project-access-container';
                        projectBtnContainer.style.marginBottom = '2.5rem';
                        
                        const isEs = window.location.pathname.includes('/es/');
                        const isPt = window.location.pathname.includes('/pt/');
                        let btnText = 'Access My Project';
                        if (isEs) btnText = 'Acceder a mi Proyecto';
                        if (isPt) btnText = 'Acessar meu Projeto';

                        projectBtnContainer.innerHTML = `
                            <a id="project-access-btn" href="${userData.projectUrl}" target="_blank" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 0.5rem; border: none !important; margin-top: -1rem;">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 1.2rem; height: 1.2rem;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                ${btnText}
                            </a>
                        `;
                        const logoutBtn = document.getElementById('logoutBtn');
                        if (logoutBtn) {
                            logoutBtn.parentNode.insertBefore(projectBtnContainer, logoutBtn);
                        }
                    } else {
                        document.getElementById('project-access-btn').href = userData.projectUrl;
                        projectBtnContainer.style.display = 'block';
                    }
                }
            }

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
