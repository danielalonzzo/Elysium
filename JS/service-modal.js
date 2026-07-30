/**
 * Elysium λ — Premium Service Modal
 * Replaces the accordion behavior with an elegant, responsive native <dialog>.
 */

(function () {
    'use strict';

    function initServicePulsars() {
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

        document.querySelectorAll('.services').forEach(section => {
            const cards = Array.from(section.querySelectorAll('.card-grid .card'));
            if (cards.length === 0 || section.querySelector(':scope > .services-pulsar-layer')) return;

            const layer = document.createElement('div');
            layer.className = 'services-pulsar-layer is-positioning';
            layer.setAttribute('aria-hidden', 'true');

            const origins = cards.map((card, index) => {
                const origin = document.createElement('span');
                const pulsar = document.createElement('span');
                origin.className = 'service-pulsar-origin';
                pulsar.className = 'service-pulsar';
                pulsar.style.setProperty('--service-pulse-delay', `${index * 2}s`);
                origin.appendChild(pulsar);
                layer.appendChild(origin);
                return origin;
            });

            section.insertBefore(layer, section.firstChild);

            let positionFrame = 0;
            let revealFrame = 0;
            let isInView = false;

            const getCardCenter = card => {
                let x = card.offsetWidth / 2;
                let y = card.offsetHeight / 2;
                let current = card;

                // offsetLeft/offsetTop are layout coordinates, so entrance and
                // hover transforms cannot move the pulsar's stored origin.
                while (current && current !== section) {
                    x += current.offsetLeft;
                    y += current.offsetTop;
                    current = current.offsetParent;
                }

                if (current === section) return { x, y };

                const sectionRect = section.getBoundingClientRect();
                const cardRect = card.getBoundingClientRect();
                return {
                    x: cardRect.left - sectionRect.left + cardRect.width / 2,
                    y: cardRect.top - sectionRect.top + cardRect.height / 2
                };
            };

            const positionPulsars = () => {
                if (positionFrame) cancelAnimationFrame(positionFrame);
                if (revealFrame) cancelAnimationFrame(revealFrame);

                // Hide first. The next frame batches every layout read before
                // writing transforms, and a second frame reveals the layer.
                layer.classList.add('is-positioning');
                layer.classList.remove('is-positioned');

                positionFrame = requestAnimationFrame(() => {
                    positionFrame = 0;
                    const positions = cards.map(getCardCenter);

                    origins.forEach((origin, index) => {
                        const { x, y } = positions[index];
                        origin.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
                    });

                    revealFrame = requestAnimationFrame(() => {
                        revealFrame = 0;
                        layer.classList.remove('is-positioning');
                        layer.classList.add('is-positioned');
                    });
                });
            };

            const syncAnimationState = () => {
                section.classList.toggle('pulsars-active', isInView && !document.hidden && !reducedMotion.matches);
            };

            positionPulsars();

            if ('IntersectionObserver' in window) {
                const visibilityObserver = new IntersectionObserver(entries => {
                    isInView = entries[0].isIntersecting;
                    syncAnimationState();
                }, { rootMargin: '120px 0px' });
                visibilityObserver.observe(section);
            } else {
                isInView = true;
                syncAnimationState();
            }

            const grid = section.querySelector('.card-grid');
            if ('ResizeObserver' in window && grid) {
                const resizeObserver = new ResizeObserver(positionPulsars);
                resizeObserver.observe(grid);
            } else {
                window.addEventListener('resize', positionPulsars, { passive: true });
            }

            document.addEventListener('visibilitychange', syncAnimationState);
            if (typeof reducedMotion.addEventListener === 'function') {
                reducedMotion.addEventListener('change', syncAnimationState);
            }

            if (document.fonts && document.fonts.ready) {
                document.fonts.ready.then(positionPulsars).catch(() => {});
            }
        });
    }

    function initServiceExperience() {
        initServicePulsars();

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
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initServiceExperience, { once: true });
    } else {
        initServiceExperience();
    }
})();
