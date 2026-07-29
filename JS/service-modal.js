/**
 * Elysium λ — Premium Service Modal
 * Replaces the accordion behavior with an elegant, responsive native <dialog>.
 */

(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', function () {
        // 1. Inject the dialog HTML into the DOM
        const dialogHTML = `
            <dialog id="premiumServiceModal" class="premium-service-modal" aria-labelledby="premiumServiceModalTitle">
                <div class="premium-modal-content">
                    <button id="premiumServiceModalClose" class="premium-modal-close" aria-label="Close modal">&times;</button>
                    <div class="premium-modal-body" id="premiumServiceModalBody">
                        <h2 id="premiumServiceModalTitle"></h2>
                        <div id="premiumServiceModalDetails"></div>
                    </div>
                </div>
            </dialog>
        `;
        document.body.insertAdjacentHTML('beforeend', dialogHTML);

        const modal = document.getElementById('premiumServiceModal');
        const modalTitle = document.getElementById('premiumServiceModalTitle');
        const modalDetails = document.getElementById('premiumServiceModalDetails');
        const closeBtn = document.getElementById('premiumServiceModalClose');
        const cards = document.querySelectorAll('.services .card');
        let activeCard = null;

        if (!modal || cards.length === 0) return;

        // 2. Open modal on card click
        cards.forEach(card => {
            // Remove the inline onclick attribute that toggled 'expanded' class
            card.removeAttribute('onclick');
            card.classList.remove('expanded');
            
            const openCard = function () {
                const detailsElement = this.querySelector('.card-details');
                const summaryElement = this.querySelector('.card-summary p');
                if (detailsElement) {
                    activeCard = this;
                    modalTitle.textContent = summaryElement ? summaryElement.textContent : '';
                    modalDetails.innerHTML = detailsElement.innerHTML;
                    // Reset closing state if any
                    modal.classList.remove('closing');
                    modal.showModal();
                    // Prevent background scrolling
                    document.body.style.overflow = 'hidden';
                    closeBtn.focus();
                }
            };

            card.addEventListener('click', openCard);
            card.addEventListener('keydown', function (event) {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                openCard.call(this);
            });
        });

        // 3. Close modal logic with animation
        const finishClosing = () => {
            if (!modal.open) return;
            modal.classList.remove('closing');
            modal.close();
            document.body.style.overflow = '';
            if (activeCard) activeCard.focus();
        };

        const closeModal = () => {
            if (!modal.open || modal.classList.contains('closing')) return;
            modal.classList.add('closing');

            // Wait for animation to finish before calling native .close()
            modal.addEventListener('animationend', function handler(e) {
                if (e.animationName === 'modalFadeOut') {
                    modal.removeEventListener('animationend', handler);
                    finishClosing();
                }
            });
            // Fallback for browsers or reduced-motion settings that suppress
            // animation events.
            setTimeout(finishClosing, 450);
        };

        closeBtn.addEventListener('click', closeModal);

        // Close on backdrop click
        modal.addEventListener('click', function (event) {
            // Because padding is inside the dialog bounds, we can check bounding rect
            // Alternatively, clicking directly on the <dialog> element (backdrop) triggers this
            if (event.target === modal) {
                closeModal();
            }
        });

        modal.addEventListener('cancel', function (event) {
            event.preventDefault();
            closeModal();
        });
    });
})();
