// Ah! `.cv-timeline-dot` is `position: absolute;` inside `.cv-timeline-item`.
// Since `.cv-timeline-item` is `.cv-timeline-item { position: sticky; top: 100px; }`
// The dot is inside the sticky container! Meaning the dot sticks with the item.
// So the dot is ALREADY handled perfectly by my script (it blurs and fades along with the card!).

// The ONLY thing missing is the pseudo-element line `.cv-timeline::before` because it belongs to the parent `.cv-timeline` which is NOT sticky. It just scrolls up.
// Because it just scrolls up, we can use the `mask-image` trick.

// CSS additions needed:
// .cv-timeline::before {
//    -webkit-mask-image: linear-gradient(to bottom, transparent var(--mask-stop, -100px), black calc(var(--mask-stop, -100px) + 50px));
//    mask-image: linear-gradient(to bottom, transparent var(--mask-stop, -100px), black calc(var(--mask-stop, -100px) + 50px));
// }

// JS additions needed:
/*
document.querySelectorAll('.cv-timeline').forEach(timeline => {
    const rect = timeline.getBoundingClientRect();
    // We want to slice the line starting at the sticky zone (100px)
    let slicePoint = 100 - rect.top;
    
    // Only apply if it's actually rolling under the title
    if (slicePoint > 0) {
       timeline.style.setProperty('--mask-stop', `${slicePoint}px`);
    } else {
       timeline.style.setProperty('--mask-stop', `-100px`);
    }
});
*/
// Wait, if we use a mask on `::before` it will look amazing. The line will literally "melt" away exactly as it hits the 100px mark, dynamically staying attached to that invisible boundary while you scroll!
