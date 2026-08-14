import { auth } from './firebase-config.js';
import { verifyPasswordResetCode, confirmPasswordReset, applyActionCode } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

document.addEventListener('DOMContentLoaded', () => {
    // Parse URL parameters provided by Firebase Auth
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const oobCode = urlParams.get('oobCode');

    function showPanel(panelId) {
        document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'));
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.classList.add('active');
        }
    }

    if (!mode || !oobCode) {
        showPanel('invalid-panel');
        return;
    }

    // Handle different action modes
    switch (mode) {
        case 'resetPassword':
            handleResetPassword(auth, oobCode);
            break;
        case 'verifyEmail':
            handleVerifyEmail(auth, oobCode);
            break;
        default:
            showPanel('invalid-panel');
    }

    function handleResetPassword(auth, actionCode) {
        // Verify the code first
        verifyPasswordResetCode(auth, actionCode)
            .then((email) => {
                // Valid code, show form
                showPanel('reset-password-panel');
                
                const form = document.getElementById('reset-form');
                const newPasswordInput = document.getElementById('new-password');
                const btn = document.getElementById('reset-btn');
                const errorDiv = document.getElementById('reset-error');
                const successDiv = document.getElementById('reset-success');

                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    
                    const newPassword = newPasswordInput.value;
                    
                    // Simple validation
                    if (newPassword.length < 8) {
                        errorDiv.textContent = 'Password must be at least 8 characters.';
                        errorDiv.style.display = 'block';
                        return;
                    }

                    btn.disabled = true;
                    btn.textContent = 'Updating...';
                    errorDiv.style.display = 'none';

                    confirmPasswordReset(auth, actionCode, newPassword)
                        .then(() => {
                            btn.style.display = 'none';
                            newPasswordInput.parentElement.style.display = 'none';
                            successDiv.textContent = 'Password updated successfully. You can now log in.';
                            successDiv.style.display = 'block';
                            
                            setTimeout(() => {
                                window.location.href = './admin.html';
                            }, 3500);
                        })
                        .catch((error) => {
                            btn.disabled = false;
                            btn.textContent = 'Update Password';
                            errorDiv.textContent = error.message || 'An error occurred. Please try again.';
                            errorDiv.style.display = 'block';
                        });
                });
            })
            .catch((error) => {
                console.error("Invalid or expired action code:", error);
                showPanel('invalid-panel');
            });
    }

    function handleVerifyEmail(auth, actionCode) {
        applyActionCode(auth, actionCode)
            .then(() => {
                showPanel('verify-email-panel');
            })
            .catch((error) => {
                console.error("Invalid or expired action code:", error);
                showPanel('invalid-panel');
            });
    }
});
