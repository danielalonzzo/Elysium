// The user says "quiero que esa linea vaya desapareciendo con el efecto desenfoque... SOLO LA LINEA AL LADO IZQUIERO DE WORK Y EDUCATION"
// The line is created by: `.cv-timeline::before` which runs from top:5px to bottom:5px of the `.cv-timeline` parent container.
// It does NOT have its own DOM element aside from a pseudo-element on `.cv-timeline`.
// We can't target `::before` easily with javascript inline styles directly without injecting a stylesheet for it or using CSS variables.
// Actually, earlier we targeted `.cv-timeline::before` in CSS `will-change`.
// If we want it to vanish exactly as it scrolls under the title, we can calculate the `rect.top` of `.cv-timeline`.
// But wait! The line goes from top to bottom. If we blur `.cv-timeline`, we blur EVERYTHING inside it (including the cards). But the cards are already being blurred individually. Blurring `.cv-timeline` would double-blur the cards and look weird.
// To fix this and dynamically blur ONLY the pseudo-element, we can use a CSS variable `--timeline-opacity` and `--timeline-blur` on `.cv-timeline`.
// In CSS:
// .cv-timeline {
//    --timeline-op: 1;
//    --timeline-blur: 0px;
// }
// .cv-timeline::before {
//    opacity: var(--timeline-op);
//    filter: blur(var(--timeline-blur));
// }

// Then in JS, we set `el.style.setProperty('--timeline-op', 1 - progress)` on `.cv-timeline`.
// Wait, the line is a single tall vertical line that spans the whole section.
// If we change its opacity/blur as the TOP of the section reaches the title, the ENTIRE line will fade out at once!
// The user says "que vaya desapareciendo con el scroll", meaning they want it to fade out *progressively* from top to bottom as it goes under the header?
// Or they just want it to fade out like the rest of the items?
// "quiero que esa linea vaya desapareciendo con el efecto desenfoque, es decir, que se vaya desapareciendo con el scroll"
// If it's a single 1000px tall line, it can't progressively blur part of itself unless we use `mask-image: linear-gradient()`.
// Since the user is scrolling down, the line is moving up. We want the top of the line to disappear exactly where the title is, but the bottom to remain visible.
// This is exactly a `mask-image`!
// Wait. A `mask-image` that trims the top of `.cv-timeline` dynamically based on its position?
// No, the easiest absolute way to make the line vanish "behind the title" is simply to make the title's background completely opaque (solid) so it physically hides the line sliding behind it? BUT the title is glass.
// If the goal is for the line to "vanish" under the header, we can use a CSS mask on the entire `.cv-timeline` that masks out the top X pixels based on scroll!
// Actually, using `mask-image: linear-gradient(to bottom, transparent X%, black (X+5)%)` is brilliant.
// Or wait, even simpler: just use JS to dynamically update a CSS mask gradient on the `.cv-timeline` element.
