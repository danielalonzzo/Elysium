// Formulario público de valoración (/review, /es/review, /pt/review).
//
// Las preguntas siguen los bloques de la historia de Paulo Morais
// (review-pmorais): punto de partida, expectativas, impacto, experiencia y
// recomendación. Lo enviado va a Firestore `reviews/` con `status: 'new'` y
// solo lo lee el administrador, en la sección Reviews del CRM: nada se publica
// solo. La forma del documento la cierra `firestore.rules` (match /reviews);
// si se añade un campo aquí, hay que añadirlo allí.
import { db } from './firebase-config.js';
import {
    addDoc,
    collection,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const COPY = {
    en: {
        required: 'Please fill in the highlighted fields.',
        url: 'Please enter a valid website address (https://…).',
        logoType: 'The logo must be a PNG, JPG, WebP or SVG image.',
        logoRead: 'We could not read that image. Try another file.',
        consent: 'Please accept the publication authorisation to send the review.',
        rating: 'Please choose a rating from 1 to 5.',
        sending: 'Sending…',
        failed: 'The review could not be sent. Check your connection and try again, or write to info@elysiumdr.eu.',
        doneTitle: 'Thank you!',
        doneText: 'Your review has reached us. We will read it carefully and let you know before publishing it.',
        doneHome: 'Back to Elysium'
    },
    es: {
        required: 'Complete los campos marcados, por favor.',
        url: 'Escriba una dirección web válida (https://…).',
        logoType: 'El logotipo tiene que ser una imagen PNG, JPG, WebP o SVG.',
        logoRead: 'No hemos podido leer esa imagen. Pruebe con otro archivo.',
        consent: 'Para enviar la valoración, acepte la autorización de publicación.',
        rating: 'Elija una valoración del 1 al 5.',
        sending: 'Enviando…',
        failed: 'No se ha podido enviar la valoración. Compruebe su conexión y vuelva a intentarlo, o escríbanos a info@elysiumdr.eu.',
        doneTitle: '¡Gracias!',
        doneText: 'Su valoración nos ha llegado. La leeremos con atención y le avisaremos antes de publicarla.',
        doneHome: 'Volver a Elysium'
    },
    pt: {
        required: 'Preencha os campos assinalados, por favor.',
        url: 'Escreva um endereço web válido (https://…).',
        logoType: 'O logótipo tem de ser uma imagem PNG, JPG, WebP ou SVG.',
        logoRead: 'Não conseguimos ler essa imagem. Experimente outro ficheiro.',
        consent: 'Para enviar a avaliação, aceite a autorização de publicação.',
        rating: 'Escolha uma avaliação de 1 a 5.',
        sending: 'A enviar…',
        failed: 'Não foi possível enviar a avaliação. Verifique a ligação e tente novamente, ou escreva para info@elysiumdr.eu.',
        doneTitle: 'Obrigado!',
        doneText: 'A sua avaliação chegou até nós. Vamos lê-la com atenção e avisá-lo antes de a publicar.',
        doneHome: 'Voltar à Elysium'
    }
};

const TEXT_FIELDS = [
    'name', 'role', 'company', 'website',
    'startingPoint', 'objective', 'expectations', 'impact',
    'internalImpact', 'experience', 'recommendation'
];
const LOGO_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']);
const LOGO_MAX_SIDE = 320;
// Tope del data URL que admite `firestore.rules`; se baja la calidad hasta caber.
const LOGO_MAX_CHARS = 300000;

const form = document.getElementById('review-form');
if (form) init(form);

function init(form) {
    const lang = COPY[form.dataset.lang] ? form.dataset.lang : 'en';
    const t = COPY[lang];
    const steps = [...form.querySelectorAll('.rv-step')];
    const prev = form.querySelector('[data-prev]');
    const next = form.querySelector('[data-next]');
    const submit = form.querySelector('[data-submit]');
    const error = form.querySelector('.rv-error');
    const bar = document.querySelector('[data-progress]');
    const logoInput = form.querySelector('input[name="logo"]');
    const logoPreview = form.querySelector('[data-logo-preview]');
    const logoRemove = form.querySelector('[data-logo-remove]');
    let current = 0;
    let logo = '';

    function showError(message) {
        error.textContent = message || '';
        error.hidden = !message;
    }

    function show(index) {
        current = index;
        steps.forEach((step, i) => { step.hidden = i !== index; });
        prev.hidden = index === 0;
        next.hidden = index === steps.length - 1;
        submit.hidden = index !== steps.length - 1;
        bar.style.width = `${((index + 1) / steps.length) * 100}%`;
        showError('');
        const top = form.getBoundingClientRect().top + window.scrollY - 110;
        if (window.scrollY > top) window.scrollTo({ top, behavior: 'smooth' });
        steps[index].querySelector('input:not([type=file]):not([type=radio]), textarea')?.focus({ preventScroll: true });
    }

    function normalizedUrl(value) {
        const raw = value.trim();
        if (!raw) return '';
        const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
        try {
            const url = new URL(withScheme);
            if (!/^https?:$/.test(url.protocol) || !url.hostname.includes('.')) return null;
            return url.href;
        } catch {
            return null;
        }
    }

    function validate(step) {
        let message = '';
        step.querySelectorAll('input[type=text], input[type=url], textarea').forEach(field => {
            const bad = field.required && !field.value.trim();
            field.classList.toggle('is-invalid', bad);
            if (bad) message ||= t.required;
        });
        const website = step.querySelector('input[name="website"]');
        if (website && website.value.trim() && normalizedUrl(website.value) === null) {
            website.classList.add('is-invalid');
            message ||= t.url;
        }
        if (step.querySelector('input[name="rating"]') && !form.querySelector('input[name="rating"]:checked')) {
            message ||= t.rating;
        }
        const consent = step.querySelector('input[name="consent"]');
        if (consent && !consent.checked) message ||= t.consent;
        showError(message);
        if (message) step.querySelector('.is-invalid')?.focus();
        return !message;
    }

    function readAsDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });
    }

    function loadImage(src) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = src;
        });
    }

    // El logotipo se reduce en el navegador y viaja dentro del documento como
    // data URL: así el formulario público no necesita permiso de escritura en
    // Storage. Un SVG se rasteriza; nunca se guarda su marcado.
    async function processLogo(file) {
        const image = await loadImage(await readAsDataUrl(file));
        const width = image.naturalWidth || LOGO_MAX_SIDE;
        const height = image.naturalHeight || LOGO_MAX_SIDE;
        const scale = Math.min(1, LOGO_MAX_SIDE / Math.max(width, height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(width * scale));
        canvas.height = Math.max(1, Math.round(height * scale));
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        for (const quality of [0.9, 0.75, 0.6, 0.45]) {
            let data = canvas.toDataURL('image/webp', quality);
            if (!data.startsWith('data:image/webp')) data = canvas.toDataURL('image/png');
            if (data.length <= LOGO_MAX_CHARS) return data;
        }
        throw new Error('logo_too_large');
    }

    function setLogo(data) {
        logo = data;
        logoPreview.textContent = data ? '' : 'λ';
        if (data) {
            const img = document.createElement('img');
            img.src = data;
            img.alt = '';
            logoPreview.append(img);
        }
        logoRemove.hidden = !data;
    }

    logoInput.addEventListener('change', async () => {
        const file = logoInput.files?.[0];
        logoInput.value = '';
        if (!file) return;
        if (!LOGO_TYPES.has(file.type)) return showError(t.logoType);
        try {
            setLogo(await processLogo(file));
            showError('');
        } catch {
            setLogo('');
            showError(t.logoRead);
        }
    });
    logoRemove.addEventListener('click', () => setLogo(''));

    form.addEventListener('input', event => event.target.classList?.remove('is-invalid'));
    prev.addEventListener('click', () => show(Math.max(0, current - 1)));
    next.addEventListener('click', () => {
        if (validate(steps[current])) show(current + 1);
    });
    // Intro en un campo de una línea avanza de paso en vez de enviar.
    form.addEventListener('keydown', event => {
        if (event.key === 'Enter' && event.target.matches('input[type=text], input[type=url]')) {
            event.preventDefault();
            if (current < steps.length - 1) next.click();
        }
    });

    form.addEventListener('submit', async event => {
        event.preventDefault();
        if (current !== steps.length - 1) return next.click();
        for (let i = 0; i < steps.length; i += 1) {
            if (!validate(steps[i])) {
                if (i !== current) show(i), validate(steps[i]);
                return;
            }
        }
        const values = Object.fromEntries(TEXT_FIELDS.map(name => [name, (form.elements[name].value || '').trim()]));
        values.website = normalizedUrl(values.website) || '';
        const review = {
            ...values,
            logo,
            rating: Number(form.querySelector('input[name="rating"]:checked').value),
            consent: true,
            lang,
            host: location.hostname.slice(0, 120),
            status: 'new',
            submittedAt: serverTimestamp()
        };
        const label = submit.textContent;
        submit.disabled = true;
        prev.disabled = true;
        submit.textContent = t.sending;
        try {
            await addDoc(collection(db, 'reviews'), review);
            form.hidden = true;
            document.querySelector('.rv-progress').hidden = true;
            const done = document.getElementById('review-done');
            done.querySelector('[data-done-title]').textContent = t.doneTitle;
            done.querySelector('[data-done-text]').textContent = t.doneText;
            done.querySelector('[data-done-home]').textContent = t.doneHome;
            done.hidden = false;
            done.focus();
            window.dataLayer?.push({ event: 'review_submitted', review_rating: review.rating });
        } catch (failure) {
            console.error('[review]', failure?.code || failure);
            showError(t.failed);
        } finally {
            submit.disabled = false;
            prev.disabled = false;
            submit.textContent = label;
        }
    });

    show(0);
}
