/**
 * Elysium λ — Premium Service Modal
 * Replaces the accordion behavior with an elegant, responsive native <dialog>.
 */

(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', function () {
        // 1. Inject the dialog HTML into the DOM
        const dialogHTML = `
            <dialog id="premiumServiceModal" class="premium-service-modal">
                <div class="premium-modal-content">
                    <button id="premiumServiceModalClose" class="premium-modal-close" aria-label="Close modal">&times;</button>
                    <div class="premium-modal-body" id="premiumServiceModalBody">
                        <!-- Content injected dynamically -->
                    </div>
                </div>
            </dialog>
        `;
        document.body.insertAdjacentHTML('beforeend', dialogHTML);

        const modal = document.getElementById('premiumServiceModal');
        const modalBody = document.getElementById('premiumServiceModalBody');
        const closeBtn = document.getElementById('premiumServiceModalClose');
        const cards = document.querySelectorAll('.services .card');

        if (!modal || cards.length === 0) return;

        // 2. Open modal on card click
        cards.forEach(card => {
            // Remove the inline onclick attribute that toggled 'expanded' class
            card.removeAttribute('onclick');
            card.classList.remove('expanded');
            
            card.addEventListener('click', function () {
                const detailsElement = this.querySelector('.card-details');
                if (detailsElement) {
                    modalBody.innerHTML = detailsElement.innerHTML;
                    // Reset closing state if any
                    modal.classList.remove('closing');
                    modal.showModal();
                    // Prevent background scrolling
                    document.body.style.overflow = 'hidden';
                }
            });
        });

        // 3. Close modal logic with animation
        const closeModal = () => {
            modal.classList.add('closing');
            
            // Wait for animation to finish before calling native .close()
            modal.addEventListener('animationend', function handler(e) {
                if (e.animationName === 'modalFadeOut') {
                    modal.classList.remove('closing');
                    modal.close();
                    modal.removeEventListener('animationend', handler);
                    document.body.style.overflow = '';
                }
            });
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
        // 4. Inject Sea Waves Background aligned exactly with each card
        const servicesSection = document.querySelector('.services');
        const cardGrid = document.querySelector('.services .card-grid');
        
        if (servicesSection && cardGrid) {
            // Prevent waves from bleeding out of the section
            servicesSection.style.overflow = 'hidden'; 
            
            const wavesContainer = document.createElement('div');
            wavesContainer.className = 'sea-waves-background';
            servicesSection.insertBefore(wavesContainer, servicesSection.firstChild);
            
            const cards = cardGrid.querySelectorAll('.card');
            const waves = [];
            
            // Create 1 ripple per card that expands in perfect sync with the 8-second card glow cycle
            cards.forEach((card, index) => {
                const wave = document.createElement('div');
                wave.className = 'wave';
                // Sync the wave expansion perfectly with the card's 2-second spaced pulse
                const delay = index * 2;
                wave.style.animationDelay = delay + 's';
                wavesContainer.appendChild(wave);
                waves.push({ card, wave });
            });
            
            // Function to precisely position the wave origins exactly behind each card
            const updateWavePositions = () => {
                const containerRect = wavesContainer.getBoundingClientRect();
                waves.forEach(({ card, wave }) => {
                    const cardRect = card.getBoundingClientRect();
                    // Calculate precise center point
                    const centerX = (cardRect.left - containerRect.left) + (cardRect.width / 2);
                    const centerY = (cardRect.top - containerRect.top) + (cardRect.height / 2);
                    
                    wave.style.left = centerX + 'px';
                    wave.style.top = centerY + 'px';
                });
            };
            
            // Wait slightly to ensure layout has settled before calculating positions
            setTimeout(updateWavePositions, 100);
            window.addEventListener('resize', updateWavePositions);
        }
    });
})();
