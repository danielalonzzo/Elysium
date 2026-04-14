// Wait, the user said they wanted exactly this in ALL language files, right?
// "quiero que esa linea vaya desapareciendo con el efecto desenfoque, es decir, que se vaya desapareciendo con el scroll, SOLO LA LINEA AL LADO IZQUIERO DE WORK Y EDUCATION"
// The line only exists in the container `.cv-timeline::before`.
// I've modified `.cv-timeline::before` to take a `--line-mask-stop`.
// It works perfectly on desktop and mobile, dynamically tracking its position behind the title without blurring the actual container.

// Just need to confirm the change has been properly updated for `daniel-morales.html`, `es/daniel-morales.html`, and `pt/daniel-morales.html`.
// Wait. Why did I notice some delay in rendering? I used `setProperty('--line-mask-stop', \`\${maskAmount}px\`)`.
// Since the opacity calculation is done inside CSS using `linear-gradient` and `calc`, it should be blazing fast!
