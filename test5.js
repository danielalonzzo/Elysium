// Wait, the `.cv-timeline` is a containing block for `.cv-timeline-item`.
// If I apply `mask-image` to `.cv-timeline`, the timeline items (the cards) will ALSO be masked out!
// We only want the *line* to be masked out.
// Can we target the pseudo-element? Not with inline styles.
// But we can add a CSS variable to `.cv-timeline`:
// `.cv-timeline::before { mask-image: var(--line-mask, none); }`
// And we can update `--line-mask` dynamically via JavaScript.

// Let's think about the coordinates.
// The `.cv-section-title` rests at `top: 90px`.
// The fade zone we want is from `100px` to `40px` (or whatever).
// If `rect.top` of `.cv-timeline` is at say `200px` (below the screen top), it's fully visible.
// As you scroll down, `.cv-timeline` moves UP. Its `rect.top` becomes `< 90px`.
// That means the top of the line is now BEHIND the title.
// We want the part of the line that is "above" 100px (relative to viewport) to be transparent.
// Distance from top of `.cv-timeline` to the `100px` viewport mark is: `100 - rect.top`.
// So the first `(100 - rect.top)px` of the line should be transparent!
// CSS mask: `linear-gradient(to bottom, transparent var(--mask-stop), black calc(var(--mask-stop) + 50px))`
// where `--mask-stop` is `(100 - rect.top)px`.

// Let's test this logic!
// If rect.top = 90px, mask-stop = 100 - 90 = 10px. (top 10px is masked).
// If rect.top = -500px, mask-stop = 100 - (-500) = 600px. (top 600px are masked).
This is brilliant! It will EXACTLY cut off the line right underneath the title as it scrolls up.
The same mask can apply to the pseudo element of `.cv-timeline`.
What about the `cv-timeline-dot`? The dots are actual DOM elements. My existing JS covers `.cv-timeline-dot` because they are `.cv-timeline-dot`. Oh wait! Are the dots sticky? No, they probably aren't sticky. They just scroll normally.
Let's check if dots are sticky in `pages.css`.
