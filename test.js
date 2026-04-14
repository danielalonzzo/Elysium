/* Okay, wait. The bug the user pointed out:
If `.cv-timeline-item:nth-child(1)` receives `top: 100px`. Its `rect.top` will NEVER go below 100px until its container pushed it past 100px.
In my script:
fadeStartPoint = 160;
fadeEndPoint = 90;

As you scroll down, rect.top goes from 800px... to 160px (fade begins).
Then it goes to 100px (fade is at 85%).
It STOPS at 100px natively because of `position: sticky`.
So the card is ALWAYS blurred! The fade happens too early, just on the way up to its resting sticky point.

We don't want it to blur *as it goes to stick*.
We want it to blur ONLY *after* it has been sticking and is now being pushed up by the bottom of its container!

Ah!
So how do we detect when it's being pushed up?
When its parent section's bottom edge approaches `100px` (or `rect.top + elementHeight`).
Actually, even simpler: if an element is sticky, its `rect.top` stays constant relative to the viewport.
If we want to blur it when it overlaps the title, that means we want to blur it when another element overlaps it? No...
"el desenfoque debe activarse despues de que el contenido pase por detras del titutlo de su seccion"

If Item 1 is sticky at 100px.
Item 2 slides up. As it slides up, Item 2 covers Item 1. THIS IS THE BLUR HE WANTS.
He wants Item 1 to blur as Item 2 comes up to it.

Or wait!
Does the user mean:
When I scroll down, the items slide UP.
They go behind the sticky title ("Work Experience").
Wait. Item 1 sticks at 100px. The title sticks at 90px.
Item 1 does NOT go behind the title. Item 1 sticks *below* the title. 
Item 2 overlaps Item 1.

Does the user mean he wants the items NOT to overlap each other, but to vanish as they pass behind the title?
If Item 1 vanishes behind the title, then it must NOT be sticky at 100px, or it must slide under the title.
Currently `position: sticky` makes it stacking!
If we removed `position: sticky` and `z-index`, they would all flow naturally up the page and pass behind the title.
If they just flowed naturally, we could blur them as their bounding box went above 100px (because they are just passing under the title).

Let's test if there is `position: sticky` on the `.cv-timeline-item`.
Yes! We literally just saw `CSS/pages.css`:
.cv-timeline-item {
    position: sticky;
    top: 100px;
}
.cv-timeline-item:nth-child(2) {
    top: 120px; ...
}
This creates a stacking "card deck" effect.

If the user says: "el desenfoque se esta activando antes de tiempo, el desenfoque debe activarse despues de que el contenido pase por detras del titulo de su seccion... se desenfoca el contenido que vaya pasando por el titulo"

This implies he does NOT want the content to just stack up forever. He sees the text of the cards through the glass of the title, or the cards pass behind the title and he wants them to blur as they hit the title area!

Wait, if they stick at 100px, they don't pass *behind* the title. They stop below it.
Unless the container pushes them!
When the container pushes them, they finally go up, passing behind the title. During that push up, he wants them blurred.

If `rect.top` pauses at `100px` (or `120px`, `140px`), it means the item is resting.
If we want to animate it only when it is pushed out (i.e. `top < 100px` for Item 1, `top < 120` for Item 2), we can just check if its `rect.top` is less than its resting `top`!

Wait, `rect.top` can NEVER be less than its sticky `top` if it's pushed by its parent. It actually CAN! When the parent's bottom pushes the sticky item up, the item's `rect.top` goes from its sticky constraint (e.g. 100px) down to 0, then negative.

So if Item 1 rests at 100px, we should only blur it if `rect.top < 100px`.
If Item 2 rests at 120px, we should only blur it if `rect.top < 120px`.
If we blur it ONLY during the push-up phase:
`let restingTop = parseInt(window.getComputedStyle(el).top);`
`if (rect.top < restingTop) { progress = (restingTop - rect.top) / 40px; }`

Let's do this mathematically perfectly:
