// He says:
// "el desenfoque debe activarse despues de que el contenido pase por detras del titutlo de su seccion, es decir, `I develop web applications...` se desenfoca el contenido que vya pasando por el titulo 'Work Experience'"

// Let's reconsider. What if he just wants to remove `position: sticky` from the timeline items completely!?
// "He wants the items NOT to overlap each other, but to pass behind the title, and as they pass behind the title (Work Experience), they blur out."
// If I remove position sticky from `.cv-timeline-item`, they will just scroll up normally. As they reach the title's `bottom` (e.g. 150px from top of screen), they can start blurring!
// Yes! Stacking sticky timeline cards on mobile and desktop can be extremely annoying when there are 6 of them, as they consume the whole screen. If they just flow normally and "vanish" under the title, it would look incredibly clean!

// Let's check `pages.css` to see the structure of the title.
// .cv-section-title -> sticky top: 90px.
// Let's just use Intersection Observer for standard scroll blurring, and remove the sticky behavior of `.cv-timeline-item`.
// Actually, earlier today I noticed there's a `.unstick` class I added to the timeline items that set `position: relative`.
// If the user liked the stacking but just wanted them to vanish... wait, the user's issue with my Javascript was:
// "el desenfoque se esta activando antes de tiempo" -> Yes, my JS was:
// fadeStartPoint = 160.
// BUT sticky positions are 100px. So at 160px they are still coming up normally, and then they pause at 100px.
// That means they fade out as they slide up into the screen! THIS was the bug! They blurred while entering their sticky zone, not while leaving it!

