// The user says "el efecto fuera mas fluido, no tan cortado, ... preferiria que fuera mas fluido, no que desaparezca de golpe, sino que vaya desapareciendo detras del titulo hasta terminar el scroll"

// So he thinks `fadeDistance = 60` is too short, causing it to vanish abruptly.
// If we increase it to, say, `150` or `rect.height`, the element will disappear very gradually over a long scroll distance.
// Also, my current code creates an *extra* translateY based on scroll:
// `el.style.transform = \`translateY(${-progress * 30}px)\`;`
// This extra translation makes it move FASTER up than the user is scrolling, which might simulate a sudden disappearance.
// We should remove the `translateY` entirely so it physically acts like it's just passing behind without altering its scroll speed!
// And we should change `fadeDistance` to something like 100 or 120 pixels.

// Let's test that theory.
