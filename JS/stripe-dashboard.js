/**
 * Elysium λ - Stripe Dashboard Logic
 * Handles capturing Stripe session_id from URLs and UI updates 
 * for the subscription manager in the Partner Portal.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Capture session_id from URL if returning from checkout success
    let searchParams = new URLSearchParams(window.location.search);
    
    // Check if session_id exists (either on payment-success.html or profiles.html)
    if (searchParams.has('session_id')) {
        const session_id = searchParams.get('session_id');
        
        // Find the hidden input for the portal session if we are on the dashboard
        const sessionIdInput = document.getElementById('session-id');
        if (sessionIdInput) {
            sessionIdInput.setAttribute('value', session_id);
            
            // Assuming they just subscribed successfully, show the active subscription view
            // In a production app with a DB, you'd fetch the user's active sub from your backend.
            showActiveSubscriptionView();
        } else {
            // If we are on payment-success.html, we might want to store the session id in localStorage
            // so when they click "Return to Dashboard", the dashboard knows they just subscribed.
            localStorage.setItem('stripe_session_id', session_id);
        }
    } else {
        // If we load the dashboard normally, check if we have a stored session ID
        const storedSessionId = localStorage.getItem('stripe_session_id');
        const sessionIdInput = document.getElementById('session-id');
        
        if (storedSessionId && sessionIdInput) {
            // Mock: Activating subscription view based on local storage
            sessionIdInput.setAttribute('value', storedSessionId);
            showActiveSubscriptionView();
        }
    }
});

/**
 * Toggles the UI from "No Subscription" to "Active Subscription"
 */
function showActiveSubscriptionView() {
    const noSubView = document.getElementById('no-subscription-view');
    const activeSubView = document.getElementById('active-subscription-view');
    
    if (noSubView && activeSubView) {
        noSubView.classList.add('hidden');
        noSubView.style.display = 'none';
        
        activeSubView.classList.remove('hidden');
        activeSubView.style.display = 'block';
    }
}
