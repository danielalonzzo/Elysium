export const BRAND = 'Veterinaria Villalobos';
/**
 * La web se compila de dos maneras:
 *
 * - Con servidor (ChatGPT Sites): inicio de sesión, base D1 y la API.
 * - Dentro de Elysium, en elysiumdr.eu/Vet-Villalobos/, como HTML estático. Ahí
 *   no hay servidor: el portal, el CRM y las citas abren en modo demostración,
 *   los formularios pasan el mensaje a WhatsApp, y todas las rutas llevan
 *   delante la carpeta.
 *
 * Por eso ningún enlace ni recurso se escribe con `/` a secas: pasa por `url()`.
 */
export const STATIC_SITE = process.env.NEXT_PUBLIC_STATIC_SITE === '1';
export const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';
export const url = (path: string) => BASE + path;
// Todavía no tiene dominio propio: la dirección pública es la del prototipo.
export const ORIGIN = 'https://elysiumdr.eu' + (STATIC_SITE ? BASE : '/Vet-Villalobos');
export const WHATSAPP = 'https://wa.me/50686633832';
export const WHATSAPP_DISPLAY = '+506 8663 3832';
export const EMAIL = 'drs.villalobos@hotmail.com';
export const JOBS_EMAIL = 'empleo.villalobos@hotmail.com';
export const INSTAGRAM = 'https://www.instagram.com/vet_villalobos/';
export const FACEBOOK = 'https://www.facebook.com/Veterinaria.Villalobos11';

const search = (q: string) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);

/**
 * Las cuatro sedes, en el orden de su portada de Facebook. Solo se escribe lo
 * que la clínica publica: Santa Cecilia y Santa Lucía tienen dirección y mapa;
 * San Lorenzo y San Francisco, de momento, solo teléfono (el enlace busca la
 * sede en Google Maps). El horario publicado en Google es el de Santa Cecilia.
 */
export const SEDES = [
 {id:'santa-cecilia',name:'Santa Cecilia',phone:'2262-6561',address:'XVR6+GHG, Barreal, Santa Cecilia, Heredia',en:'XVR6+GHG, Barreal, Santa Cecilia, Heredia',map:'https://maps.google.com/maps?vet=10CAAQoqAOahcKEwiAprrtgMyXAxUAAAAAHQAAAAAQFg..i&client=safari&udm&fvr=1&pvq=CgsvZy8xdGoyZDFqMw&cs=1&um=1&ie=UTF-8&fb=1&gl=pt&sa=X&ftid=0x8fa0faf95e828ee5:0x76a850f46d2570ed',hours:'Lunes a sábado, 8:00 a. m. – 8:00 p. m. Domingo, cerrado.',enHours:'Monday to Saturday, 8 am – 8 pm. Closed on Sundays.'},
 {id:'san-lorenzo',name:'San Lorenzo',phone:'2265-9629',address:'',en:'',map:search('Veterinaria Villalobos San Lorenzo Heredia'),hours:'',enHours:''},
 {id:'santa-lucia',name:'Santa Lucía',phone:'2102-6523',address:'600 m al norte del Auto Mercado de Santa Lucía, Heredia',en:'600 m north of Auto Mercado Santa Lucía, Heredia',map:'https://maps.app.goo.gl/faCcrdZ7ZuyqwH2W6',hours:'',enHours:''},
 {id:'san-francisco',name:'San Francisco',phone:'2101-6538',address:'',en:'',map:search('Veterinaria Villalobos San Francisco Heredia'),hours:'',enHours:''},
] as const;
export type Sede = typeof SEDES[number];
export const tel = (phone: string) => 'tel:+506' + phone.replace(/\D/g, '');
// La línea principal es la de Santa Cecilia: la que figura en Facebook.
export const PHONE = '+506 ' + SEDES[0].phone.replace('-', ' ');
export const MAP = SEDES[0].map;

// Los siete servicios de su cartel. Consulta y vacunación se reservan desde la
// agenda; el resto tiene página propia.
export const services = [
 {id:'consulta',name:'Consulta veterinaria',en:'Veterinary consultation',tag:'SALUD Y SEGUIMIENTO',text:'Valoración clínica y seguimiento para su mascota, en la sede que le quede más cerca.',english:'Clinical assessment and follow-up for your pet, at whichever clinic is closest to you.',icon:'Stethoscope'},
 {id:'vacunacion',name:'Vacunación',en:'Vaccinations',tag:'PREVENCIÓN',text:'Vacunas al día según la edad y el estilo de vida de su mascota.',english:'Vaccinations kept up to date for your pet’s age and lifestyle.',icon:'Syringe'},
 {id:'grooming',name:'Grooming',en:'Grooming',tag:'BIENESTAR Y CUIDADO',text:'Baño, corte y cuidado del pelaje según las necesidades de cada mascota.',english:'Bathing, haircuts and coat care tailored to each pet.',icon:'Scissors'},
 {id:'hotel',name:'Hotel',en:'Pet hotel',tag:'HOSPEDAJE',text:'Un lugar conocido para su mascota mientras usted no está. Consulte disponibilidad y requisitos.',english:'A familiar place for your pet while you are away. Ask about availability and requirements.',icon:'BedDouble'},
 {id:'exportacion',name:'Exportación',en:'Pet export',tag:'VIAJES',text:'Orientación y trámites para viajar con su mascota. Los requisitos dependen del país de destino.',english:'Guidance and paperwork for travelling with your pet. Requirements depend on the destination.',icon:'Plane'},
 {id:'farmacia',name:'Farmacia y Pet Shop',en:'Pharmacy & pet shop',tag:'TODO PARA SU MASCOTA',text:'Medicamentos, alimentos y accesorios. Disponibilidad y uso de medicamentos sujetos a consulta.',english:'Medication, food and accessories. Ask about availability and appropriate use of medication.',icon:'ShoppingBag'}
];
