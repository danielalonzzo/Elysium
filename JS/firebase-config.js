import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";

// Tu configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyABcv1SqIHF78JqU5QVkLd3I94pI2YNPoE",
    authDomain: "elysiumdr-eu.firebaseapp.com",
    projectId: "elysiumdr-eu",
    storageBucket: "elysiumdr-eu.firebasestorage.app",
    messagingSenderId: "392918383359",
    appId: "1:392918383359:web:b4c661f025f9162d4d6aca",
    measurementId: "G-HCL71PXYX9"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
