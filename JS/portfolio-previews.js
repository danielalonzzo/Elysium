// Fit a desktop viewport inside each portfolio card, including on mobile.
const portfolioPreviews = document.querySelectorAll('#portfolio-grid .browser-mockup');
if (portfolioPreviews.length) {
    const previewResizeObserver = new ResizeObserver(entries => {
        for (const { target, contentRect } of entries) {
            target.style.setProperty('--portfolio-preview-scale', contentRect.width / 1440);
        }
    });
    portfolioPreviews.forEach(preview => previewResizeObserver.observe(preview));
}
