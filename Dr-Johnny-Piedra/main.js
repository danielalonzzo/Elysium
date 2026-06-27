// Loading Screen Logic
window.addEventListener('load', () => {
    const loadingScreen = document.getElementById('loading-screen');
    // Ensure the loading screen is visible for at least 1.5 seconds as requested
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.visibility = 'hidden';
        }, 500); // Wait for transition to finish
    }, 1500);
});

// Floating Action Button Logic
const fabToggle = document.getElementById('fab-toggle');
const fabContainer = document.querySelector('.fab-container');

fabToggle.addEventListener('click', () => {
    fabContainer.classList.toggle('active');
    fabToggle.classList.toggle('active');
});

// Theme Toggler
const btnTheme = document.getElementById('btn-theme');
const body = document.body;

btnTheme.addEventListener('click', () => {
    body.classList.toggle('dark-theme');
    body.classList.toggle('light-theme');
    
    // Update icon
    const icon = btnTheme.querySelector('i');
    if (body.classList.contains('dark-theme')) {
        icon.classList.replace('ph-moon', 'ph-sun');
    } else {
        icon.classList.replace('ph-sun', 'ph-moon');
    }
});

// Language Translation Dictionary
const translations = {
    es: {
        agendar_cta: "Agendar Consulta",
        hero_title: "Urología Avanzada,<br>Dr. Johnny Piedra",
        hero_subtitle: "Especialista en Urología y Cirugía mini-invasiva. Università di Milano, Italia. Más de 15 años de experiencia.",
        slogan: '"Urología de Confianza, Todo en un Solo Lugar"',
        especialidades_title: "Especialidades Médicas",
        esp_urologia: "Urología Avanzada",
        esp_medicina: "Medicina General",
        esp_pediatria: "Pediatría",
        esp_nutricion: "Nutrición",
        esp_urgencias: "Urgencias",
        procedimientos_title: "Procedimientos Clave",
        proc_prostata: "Cirugía de crecimiento de próstata (mini-invasiva)",
        proc_vasectomia: "Vasectomía (sin bisturí)",
        proc_vasectomia_desc: '<i class="ph ph-thumbs-up"></i> Control a los dos meses',
        proc_laser: "Cirugías Láser/mini-invasiva y Testiculares",
        proc_infecciones: "Infecciones Urinarias",
        why_title: "Somos su Centro Médico de Confianza",
        why_desc: "Ofrecemos atención integral liderada por el Dr. Piedra. Más de 15 años de experiencia garantizan procedimientos seguros y la mejor tecnología médica disponible.",
        servicios_title: "Servicios Adicionales",
        serv_farmacia: "Farmacia On-site",
        serv_farmacia_desc: "Con entrega a domicilio",
        serv_laboratorio: "Laboratorio Clínico",
        serv_laboratorio_desc: "Servicio integrado",
        serv_camara: "Cámara Hiperbárica",
        serv_camara_desc: "Alianza estratégica",
        corp_title: "Medicina de Empresa",
        corp_desc: "Su aliado corporativo en salud. Ofrecemos pruebas pre-empleo, control de doping, campañas de salud corporativas, atención de urgencias y charlas médicas.",
        seguros_title: "Convenios y Seguros Médicos",
        seguros_nota: "Atendemos pacientes con o sin seguro médico.",
        contacto_title: "Contacto",
        form_name: "Nombre",
        form_email: "Email",
        form_message: "Mensaje",
        form_submit: "Enviar",
        footer_rights: "Todos los derechos reservados."
    },
    en: {
        agendar_cta: "Book Appointment",
        hero_title: "Advanced Urology,<br>Dr. Johnny Piedra",
        hero_subtitle: "Specialist in Urology and Minimally Invasive Surgery. Università di Milano, Italy. Over 15 years of experience.",
        slogan: '"Trusted Urology, Everything in One Place"',
        especialidades_title: "Medical Specialties",
        esp_urologia: "Advanced Urology",
        esp_medicina: "General Medicine",
        esp_pediatria: "Pediatrics",
        esp_nutricion: "Nutrition",
        esp_urgencias: "Emergencies",
        procedimientos_title: "Key Procedures",
        proc_prostata: "Prostate Enlargement Surgery (Minimally Invasive)",
        proc_vasectomia: "No-Scalpel Vasectomy",
        proc_vasectomia_desc: '<i class="ph ph-thumbs-up"></i> Follow-up at two months',
        proc_laser: "Laser/Minimally Invasive and Testicular Surgeries",
        proc_infecciones: "Urinary Tract Infections",
        why_title: "Your Trusted Medical Center",
        why_desc: "We offer comprehensive care led by Dr. Piedra. Over 15 years of experience guarantee safe procedures and the best available medical technology.",
        servicios_title: "Additional Services",
        serv_farmacia: "On-site Pharmacy",
        serv_farmacia_desc: "With home delivery",
        serv_laboratorio: "Clinical Laboratory",
        serv_laboratorio_desc: "Integrated service",
        serv_camara: "Hyperbaric Chamber",
        serv_camara_desc: "Strategic alliance",
        corp_title: "Corporate Medicine",
        corp_desc: "Your corporate health ally. We offer pre-employment testing, doping control, corporate health campaigns, emergency care, and medical talks.",
        seguros_title: "Agreements and Health Insurances",
        seguros_nota: "We attend patients with or without health insurance.",
        contacto_title: "Contact",
        form_name: "Name",
        form_email: "Email",
        form_message: "Message",
        form_submit: "Send",
        footer_rights: "All rights reserved."
    }
};

let currentLang = 'es';
const btnTranslate = document.getElementById('btn-translate');

btnTranslate.addEventListener('click', () => {
    currentLang = currentLang === 'es' ? 'en' : 'es';
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[currentLang][key]) {
            el.innerHTML = translations[currentLang][key];
        }
    });

    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
        const key = el.getAttribute('data-i18n-ph');
        if (translations[currentLang][key]) {
            el.setAttribute('placeholder', translations[currentLang][key]);
        }
    });
});

// PWA Logic
let deferredPrompt;
const btnPwa = document.getElementById('btn-pwa');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
});

btnPwa.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        }
        deferredPrompt = null;
    } else {
        alert(currentLang === 'es' ? "La aplicación ya está instalada o no está soportada en este navegador." : "The app is already installed or not supported in this browser.");
    }
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then((registration) => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, (err) => {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}

// Metallic shine effect on scroll for brand-name
const brandName = document.querySelector('.brand-name');
if (brandName) {
    window.addEventListener('scroll', () => {
        const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        // Shift background position vertically to simulate realistic horizon reflection
        brandName.style.backgroundPosition = `center ${scrollPercent}%`;
    });
}
