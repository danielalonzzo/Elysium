import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

export { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

export const app = initializeApp({
    apiKey: "AIzaSyABcv1SqIHF78JqU5QVkLd3I94pI2YNPoE",
    authDomain: "elysiumdr-eu.firebaseapp.com",
    projectId: "elysiumdr-eu",
    storageBucket: "elysiumdr-eu.firebasestorage.app",
    messagingSenderId: "392918383359",
    appId: "1:392918383359:web:b4c661f025f9162d4d6aca",
    measurementId: "G-HCL71PXYX9"
});

export const auth = getAuth(app);
