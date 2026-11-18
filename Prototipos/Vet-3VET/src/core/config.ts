// Datos de 3VET Saúde Animal. Todo lo que aparece aquí sale de lo que la propia
// clínica publica: el cartel de Mirandela (urgencias 24 h y las tres líneas), su
// tarjeta (los tres veterinarios con su línea), su biografía de Instagram (las dos
// moradas y las especies) y su ficha de Google Maps (horario de Mirandela,
// coordenadas, valoración). Lo que no se ha podido comprobar va como `null` y la
// web no lo enseña: número DGAV, razón social, correo y web propia.
export const BRAND = '3VET Saúde Animal';
export const BRAND_SHORT = '3VET';
export const TAGLINE = 'Três veterinários · Macedo de Cavaleiros e Mirandela';
export const COMPANY_LEGAL_NAME: string | null = null;
export const TECHNICAL_DIRECTOR = 'Dr. Nuno Morais';
export const DGAV_LICENSE: string | null = null;
export const ADDRESS_STREET = 'Rua Joaquim Teófilo Braga, n.º 754, R/C Dto.';
export const ADDRESS_POSTAL = '5370-309';
export const ADDRESS_CITY = 'Mirandela';
export const ADDRESS_REGION = 'Terra Quente Transmontana · Bragança';
export const ADDRESS_COUNTRY = 'Portugal';
export const FULL_ADDRESS = `${ADDRESS_STREET}, ${ADDRESS_POSTAL} ${ADDRESS_CITY}, ${ADDRESS_COUNTRY}`;

export const GPS_LAT = 41.4889897;
export const GPS_LNG = -7.1825839;
export const MAP = 'https://www.google.com/maps/place/3Vet+-+Cl%C3%ADnica+Veterin%C3%A1ria+de+Mirandela/@41.4889897,-7.1825839,17z';
export const MAP_EMBED = `https://maps.google.com/maps?q=${GPS_LAT},${GPS_LNG}&hl=pt&z=16&output=embed`;
export const MAP_MACEDO = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Avenida D. Nuno Álvares Pereira, 5340-202 Macedo de Cavaleiros')}`;
export const GOOGLE_RATING = {score: '4,8', count: 28};

// Los tres veterinarios, en el orden de su tarjeta. Cada uno lleva uno de los
// tres tramos del «3»: naranja, amarillo de unión y verde petróleo.
export const TEAM = [
  {id: 'nuno', name: 'Dr. Nuno Morais', en: 'Dr Nuno Morais', role: 'Médico veterinário', display: '963 057 504', raw: '+351963057504', color: '#ef7d1f', part: 'top'},
  {id: 'alia', name: 'Dra. Ália Santos', en: 'Dr Ália Santos', role: 'Médica veterinária', display: '917 788 992', raw: '+351917788992', color: '#e9b80f', part: 'dot'},
  {id: 'francisco', name: 'Dr. Francisco Morais', en: 'Dr Francisco Morais', role: 'Médico veterinário', display: '961 544 749', raw: '+351961544749', color: '#11a9a0', part: 'bottom'},
] as const;

export const PHONE = '(+351) 961 544 749';
export const PHONE_RAW = '+351961544749';
export const PHONE_LINES = TEAM.map(v => ({label: v.name, display: '+351 ' + v.display, raw: v.raw}));
export const EMAIL: string | null = null;
export const WEBSITE: string | null = null;
export const INSTAGRAM = 'https://www.instagram.com/3vet_macedo.mirandela/';
export const FACEBOOK = 'https://www.facebook.com/p/3Vet-Cl%C3%ADnica-Veterin%C3%A1ria-de-Mirandela-61556171763506/';
export const WHATSAPP = 'https://wa.me/351961544749';

export const STATIC_SITE = process.env.NEXT_PUBLIC_STATIC_SITE === '1';
export const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';
export const url = (path: string) => BASE + path;
// La copia estática se publica en elysiumdr.pt/3vet (scripts/publish-3vet.sh, en la raíz de Elysium).
export const ORIGIN = STATIC_SITE ? 'https://elysiumdr.pt' + BASE : (process.env.NEXT_PUBLIC_ORIGIN || 'https://elysiumdr.pt/3vet');

export const SEDES = [
  {
    id: 'mirandela',
    name: 'Clínica Veterinária de Mirandela',
    phone: '+351 961 544 749',
    address: 'Rua Joaquim Teófilo Braga, n.º 754, R/C Dto., 5370-309 Mirandela',
    en: 'Rua Joaquim Teófilo Braga 754, R/C Dto., 5370-309 Mirandela',
    map: MAP,
    hours: 'Seg–Sex 09:00–12:00 · 14:00–19:00 · Sáb 09:00–12:00',
    enHours: 'Mon–Fri 09:00–12:00 · 14:00–19:00 · Sat 09:00–12:00',
  },
  {
    id: 'macedo',
    name: 'Centro Veterinário Dr. Nuno Morais',
    phone: '+351 963 057 504',
    address: 'Avenida D. Nuno Álvares Pereira, 5340-202 Macedo de Cavaleiros',
    en: 'Avenida D. Nuno Álvares Pereira, 5340-202 Macedo de Cavaleiros',
    map: MAP_MACEDO,
    hours: 'Horário a confirmar · ligue 963 057 504',
    enHours: 'Hours to be confirmed · call 963 057 504',
  },
] as const;

export interface BusinessStatus {
  isOpen: boolean;
  state: 'open' | 'lunch' | 'closed';
  text: string;
  badge: string;
  next: string;
}

// Horario de Mirandela según su ficha de Google Maps. Fuera de horario siguen
// las urgencias 24 h por las tres líneas: la web lo dice en vez de «cerrado».
export function getBusinessStatus(date = new Date()): BusinessStatus {
  const fallback: BusinessStatus = {isOpen: true, state: 'open', badge: 'Mirandela', text: 'Seg–Sex 09:00–12:00 · 14:00–19:00', next: '09:00'};
  try {
    const parts = new Intl.DateTimeFormat('en-US', {timeZone: 'Europe/Lisbon', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false}).formatToParts(date);
    const weekday = parts.find(p => p.type === 'weekday')?.value;
    const m = (parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10) % 24) * 60 + parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
    const urg = 'urgências 24 h nas três linhas';
    const open = (closes: string): BusinessStatus => ({isOpen: true, state: 'open', badge: 'Aberto agora', text: `Aberto agora · fecha às ${closes}`, next: `Fecha às ${closes}`});
    if (weekday === 'Sun') return {isOpen: false, state: 'closed', badge: 'Domingo', text: `Domingo · ${urg}`, next: 'Segunda, 09:00'};
    if (weekday === 'Sat') {
      if (m >= 540 && m < 720) return open('12:00');
      return {isOpen: false, state: 'closed', badge: 'Fim de semana', text: `Fechado · ${urg}`, next: 'Segunda, 09:00'};
    }
    if (m >= 540 && m < 720) return open('12:00');
    if (m >= 720 && m < 840) return {isOpen: false, state: 'lunch', badge: 'Almoço', text: `Reabre às 14:00 · ${urg}`, next: 'Reabre às 14:00'};
    if (m >= 840 && m < 1140) return open('19:00');
    return {isOpen: false, state: 'closed', badge: 'Fechado', text: `Fechado · ${urg}`, next: '09:00'};
  } catch {
    return fallback;
  }
}

// Servicios: lo general de una clínica de animales de compañía y de producción,
// sin prometer técnicas concretas que la clínica no publica.
export const services = [
  {id: 'consultas', category: 'clinica', name: 'Consultas e medicina preventiva', en: 'Consultations & preventive care', tag: 'CÃES E GATOS', text: 'Check-ups, vacinação, desparasitação e acompanhamento em todas as idades.', english: 'Check-ups, vaccination, parasite control and follow-up at every age.', icon: 'Stethoscope'},
  {id: 'urgencias', category: 'clinica', name: 'Urgências 24 horas', en: '24-hour emergencies', tag: 'TRÊS LINHAS DIRETAS', text: 'Fora de horas, ligue para uma das três linhas diretas dos veterinários.', english: 'Out of hours, call one of the vets’ three direct lines.', icon: 'HeartPulse'},
  {id: 'cirurgia', category: 'clinica', name: 'Cirurgia e esterilização', en: 'Surgery & neutering', tag: 'BLOCO CIRÚRGICO', text: 'Esterilizações e cirurgia geral com anestesia vigiada e recobro acompanhado.', english: 'Neutering and general surgery with monitored anaesthesia and recovery.', icon: 'ShieldCheck'},
  {id: 'identificacao', category: 'clinica', name: 'Microchip e registo SIAC', en: 'Microchip & SIAC registration', tag: 'OBRIGATÓRIO EM PORTUGAL', text: 'Identificação eletrónica e registo no SIAC, obrigatórios para cães, gatos e furões.', english: 'Electronic ID and SIAC registration, mandatory for dogs, cats and ferrets in Portugal.', icon: 'PawPrint'},
  {id: 'producao', category: 'agropecuaria', name: 'Animais de produção', en: 'Farm animals', tag: 'BOVINOS · SUÍNOS · OVINOS · CAPRINOS', text: 'Assistência a vacas, porcos, ovelhas e cabras nas explorações de Macedo de Cavaleiros e Mirandela.', english: 'Care for cattle, pigs, sheep and goats on farms around Macedo de Cavaleiros and Mirandela.', icon: 'Pill'},
  {id: 'loja', category: 'agropecuaria', name: 'Alimentação e acessórios', en: 'Food & accessories', tag: 'NA CLÍNICA', text: 'Rações, antiparasitários e transportadoras à venda na própria clínica.', english: 'Pet food, parasite protection and carriers sold at the clinic.', icon: 'ShoppingBag'},
];
