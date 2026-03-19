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
                userData = {
                    name: user.displayName || 'Partner',
                    email: user.email,
                    role: 'partner',
                    onboardingCompleted: false,
                    createdAt: serverTimestamp()
                };
                await setDoc(memberRef, userData);
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
    const name = document.getElementById('signup-name').value;
    const company = document.getElementById('signup-company').value;
    const email = document.getElementById('signup-email').value;
    const licenseCode = document.getElementById('signup-license').value.trim();
    const password = document.getElementById('signup-password').value;

    if (password.length < 6) {
        showError("Password must be at least 6 characters.");
        return;
    }

    try {
        // 1. Validate License
        const licenseRef = doc(db, 'licenses', licenseCode);
        const licenseSnap = await getDoc(licenseRef);

        if (!licenseSnap.exists()) {
            showError("Invalid license code. Please contact Elysium to receive one.");
            return;
        }

        const licenseData = licenseSnap.data();
        if (licenseData.status !== 'active') {
            showError("This license has already been used or is inactive.");
            return;
        }

        // 2. Create User
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 3. Mark License as Used
        await updateDoc(licenseRef, {
            status: 'used',
            assignedTo: email,
            usedAt: serverTimestamp()
        });

        // 4. Save Member Data
        await setDoc(doc(db, 'members', user.uid), {
            name: name,
            company: company,
            email: email,
            licenseCode: licenseCode,
            role: 'partner',
            onboardingCompleted: false, // New field for mandatory onboarding
            createdAt: serverTimestamp()
        });

        // 5. Update Profile
        await updateProfile(user, { displayName: name });

    } catch (error) {
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
