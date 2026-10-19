export const BRAND = 'Clínica Veterinaria Dr. Luis Valladares';
/**
 * La web se compila de dos maneras:
 *
 * - En ChatGPT Sites, con servidor: inicio de sesión, base D1 y la API.
 * - Dentro de Elysium, en elysiumdr.eu/Vet-Dr-Valladares/, como HTML estático
 *   (`scripts/publish-vet-dr-valladares.sh`). Ahí no hay servidor: el portal,
 *   el CRM y las citas abren en modo demostración, los formularios pasan el
 *   mensaje a WhatsApp, y todas las rutas llevan delante la carpeta.
 *
 * Por eso ningún enlace ni recurso se escribe con `/` a secas: pasa por `url()`.
 */
export const STATIC_SITE = process.env.NEXT_PUBLIC_STATIC_SITE === '1';
export const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';
export const url = (path: string) => BASE + path;
export const ORIGIN = STATIC_SITE ? 'https://elysiumdr.eu' + BASE : 'https://clinica-veterinaria-luis-valladares.danielalonzzo.chatgpt.site';
export const PHONE = '+506 8837 3246';
export const WHATSAPP = 'https://wa.me/50688373246';
export const MAP = 'https://maps.app.goo.gl/cUorkV3ua8drz4vw7';
export const services = [
 {id:'consulta',name:'Consulta veterinaria',en:'Veterinary care',tag:'SALUD Y PREVENCIÓN',text:'Valoración clínica, vacunas y desparasitación. Un plan de atención para cada etapa de su vida.',english:'Clinical assessment, vaccinations and deworming. Care for every stage of their life.',icon:'Stethoscope'},
 {id:'grooming',name:'Grooming profesional',en:'Professional grooming',tag:'BIENESTAR Y CUIDADO',text:'Baño, corte y cuidado del pelaje con atención a las necesidades de cada mascota.',english:'Bathing, haircuts and coat care tailored to each pet.',icon:'Scissors'},
 {id:'cirugia',name:'Cirugía veterinaria',en:'Veterinary surgery',tag:'ATENCIÓN CLÍNICA',text:'Valoración previa, procedimientos quirúrgicos y seguimiento coordinado con el equipo veterinario.',english:'Preoperative assessment, surgical procedures and coordinated follow-up.',icon:'HeartPulse'},
 {id:'exportacion',name:'Viajes y exportación',en:'Travel and export',tag:'NUEVOS DESTINOS',text:'Orientación y trámites de exportación. Consulte los requisitos según el país de destino.',english:'Guidance and export paperwork. Ask about destination-specific requirements.',icon:'Plane'},
 {id:'tienda',name:'Todo para su mascota',en:'Pet essentials',tag:'TIENDA VETERINARIA',text:'Alimentos, accesorios y medicamentos. Disponibilidad y uso de medicamentos sujetos a consulta.',english:'Food, accessories and medication. Ask about availability and appropriate use.',icon:'ShoppingBag'}
];
