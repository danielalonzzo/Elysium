import { db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        const formData = new FormData(contactForm);
        
        // Disable button and show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';
        
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            service: formData.get('service'),
            message: formData.get('message'),
            submittedAt: serverTimestamp(),
            source: window.location.pathname // Track which version (en/es/pt)
        };

        try {
            await addDoc(collection(db, "contacts"), data);
            
            // Success State
            let successMsg = '¡Gracias! Su consulta ha sido recibida.';
            if (window.location.pathname.includes('/pt/')) {
                successMsg = 'Obrigado! Sua consulta foi recebida.';
            } else if (!window.location.pathname.includes('/es/')) {
                successMsg = 'Thank you! Your inquiry has been received.';
            }

            alert(successMsg);
            contactForm.reset();
        } catch (error) {
            console.error("Error adding document: ", error);
            
            let errorMsg = 'Lo sentimos, hubo un problema al enviar su mensaje. Por favor intente de nuevo.';
            if (window.location.pathname.includes('/pt/')) {
                errorMsg = 'Lamentamos, houve um problema ao enviar sua mensagem. Por favor, tente novamente.';
            } else if (!window.location.pathname.includes('/es/')) {
                errorMsg = 'Sorry, there was a problem sending your message. Please try again.';
            }
            
            alert(errorMsg);
        } finally {
            // Restore button
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    });
});
