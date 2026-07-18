/**
 * Compatibility handler for the legacy payment-success page.
 *
 * A browser session ID is not proof of payment and must never activate the UI.
 * The signed Stripe webhook provisions the subscription and license in
 * Firestore; this script only carries the success state back to the dashboard.
 */
document.addEventListener('DOMContentLoaded', () => {
    localStorage.removeItem('stripe_session_id');

    const sessionId = new URLSearchParams(window.location.search).get('session_id');
    const dashboardLink = document.querySelector('a[href="profiles.html"]');
    if (!sessionId || !dashboardLink) return;

    const target = new URL(dashboardLink.href, window.location.origin);
    target.searchParams.set('checkout', 'success');
    target.searchParams.set('session_id', sessionId);
    dashboardLink.href = target.toString();
});
