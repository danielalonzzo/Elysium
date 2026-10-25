export const BRAND = 'Novavet – Consultório Veterinário (Dr. Luís Afonso)';
export const BRAND_SHORT = 'Novavet';
export const TAGLINE = 'O parceiro certo';
export const COMPANY_LEGAL_NAME = 'Novavet - Produtos Agro-Pecuários, Lda.';
export const TECHNICAL_DIRECTOR = 'Dr. Luís Manuel Madureira Afonso';
export const DGAV_LICENSE = 'PT 1 0124 CN';
export const ADDRESS_STREET = 'Rua do Loreto, nº 36 ABC';
export const ADDRESS_POSTAL = '5300-189';
export const ADDRESS_CITY = 'Bragança';
export const ADDRESS_REGION = 'Trás-os-Montes';
export const ADDRESS_COUNTRY = 'Portugal';
export const FULL_ADDRESS = `${ADDRESS_STREET}, ${ADDRESS_POSTAL} ${ADDRESS_CITY}, ${ADDRESS_COUNTRY}`;

export const GPS_LAT = 41.80328;
export const GPS_LNG = -6.75951;
export const MAP = `https://www.google.com/maps?q=${GPS_LAT},${GPS_LNG}`;
export const MAP_EMBED = `https://maps.google.com/maps?q=${GPS_LAT},${GPS_LNG}&hl=pt&z=17&output=embed`;

export const PHONE = '(+351) 273 331 286';
export const PHONE_RAW = '+351273331286';
export const EMAIL = 'novavet@novavet.pt';
export const WEBSITE = 'https://novavet.pt';
export const WHATSAPP = 'https://wa.me/351273331286';

export const STATIC_SITE = process.env.NEXT_PUBLIC_STATIC_SITE === '1';
export const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';
export const url = (path: string) => BASE + path;
export const ORIGIN = STATIC_SITE ? 'https://elysiumdr.eu' + BASE : (process.env.NEXT_PUBLIC_ORIGIN || 'https://novavet.pt');

export interface BusinessStatus {
  isOpen: boolean;
  state: 'open' | 'lunch' | 'closed';
  text: string;
  badge: string;
  next: string;
}

export function getBusinessStatus(date = new Date()): BusinessStatus {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Lisbon',
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const weekday = parts.find(p => p.type === 'weekday')?.value;
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
    const timeMinutes = hour * 60 + minute;

    const isWeekend = weekday === 'Sat' || weekday === 'Sun';
    if (isWeekend) {
      return {
        isOpen: false,
        state: 'closed',
        badge: 'Encerrado',
        text: 'Encerrado — Abre segunda-feira às 09:00',
        next: 'Segunda-feira, 09:00',
      };
    }

    if (timeMinutes < 9 * 60) {
      return {
        isOpen: false,
        state: 'closed',
        badge: 'Encerrado',
        text: 'Encerrado — Abre hoje às 09:00',
        next: 'Hoje, 09:00',
      };
    } else if (timeMinutes >= 9 * 60 && timeMinutes < 12 * 60 + 30) {
      return {
        isOpen: true,
        state: 'open',
        badge: 'Aberto agora',
        text: 'Aberto agora — Pausa de almoço às 12:30',
        next: 'Pausa às 12:30',
      };
    } else if (timeMinutes >= 12 * 60 + 30 && timeMinutes < 14 * 60) {
      return {
        isOpen: false,
        state: 'lunch',
        badge: 'Pausa de almoço',
        text: 'Pausa de almoço — Reabre às 14:00',
        next: 'Reabre hoje às 14:00',
      };
    } else if (timeMinutes >= 14 * 60 && timeMinutes < 19 * 60) {
      return {
        isOpen: true,
        state: 'open',
        badge: 'Aberto agora',
        text: 'Aberto agora — Encerra às 19:00',
        next: 'Encerra às 19:00',
      };
    } else {
      if (weekday === 'Fri') {
        return {
          isOpen: false,
          state: 'closed',
          badge: 'Encerrado',
          text: 'Encerrado — Abre segunda-feira às 09:00',
          next: 'Segunda-feira, 09:00',
        };
      } else {
        return {
          isOpen: false,
          state: 'closed',
          badge: 'Encerrado',
          text: 'Encerrado — Abre amanhã às 09:00',
          next: 'Amanhã, 09:00',
        };
      }
    }
  } catch {
    return {
      isOpen: false,
      state: 'closed',
      badge: 'Consultório',
      text: 'Seg-Sex: 09:00–12:30 | 14:00–19:00',
      next: '09:00–19:00',
    };
  }
}

export const services = [
  // Linha 1: Clínica Veterinária
  {
    id: 'consultas',
    category: 'clinica',
    name: 'Consultas Médico-Veterinárias',
    en: 'Veterinary Consultations',
    tag: 'CLÍNICA GERAL',
    text: 'Avaliação clínica rigorosa, diagnóstico preventivo e acompanhamento médico contínuo sob a direção do Dr. Luís Afonso.',
    english: 'Thorough clinical assessment, preventive diagnosis and continuous medical care led by Dr. Luís Afonso.',
    icon: 'Stethoscope',
  },
  {
    id: 'vacinacao',
    category: 'clinica',
    name: 'Vacinação e Desparasitação',
    en: 'Vaccination & Deworming',
    tag: 'PREVENÇÃO & IMUNIZAÇÃO',
    text: 'Planos de imunização personalizados para animais de companhia e programas profiláticos sanitários para efetivos pecuários.',
    english: 'Personalized immunization schedules for pets and prophylactic health programs for livestock.',
    icon: 'ShieldCheck',
  },
  {
    id: 'cirurgia',
    category: 'clinica',
    name: 'Pequenas Cirurgias',
    en: 'Minor Surgery',
    tag: 'CIRURGIA AMBULATÓRIA',
    text: 'Intervenções cirúrgicas de ambulatório, suturas e procedimentos esterilizados com monitorização clínica em ambiente controlado.',
    english: 'Outpatient surgical procedures, suturing and sterile care with monitored clinical supervision.',
    icon: 'HeartPulse',
  },
  {
    id: 'apoio-pecuario',
    category: 'clinica',
    name: 'Apoio a Explorações Pecuárias',
    en: 'Livestock Farm Support',
    tag: 'SANIDADE ANIMAL TRANSたと',
    text: 'Consultoria e acompanhamento sanitário para explorações de bovinos, ovinos e caprinos em toda a região transmontana.',
    english: 'Veterinary consultancy and herd health management for cattle, sheep, and goat farms across Trás-os-Montes.',
    icon: 'PawPrint',
  },

  // Linha 2: Agropecuária e Nutrição Animal
  {
    id: 'medicamentos',
    category: 'agropecuaria',
    name: 'Medicamentos Veterinários DGAV',
    en: 'DGAV Authorized Veterinary Medicines',
    tag: 'DISPENSA REGULADA PT 1 0124 CN',
    text: 'Distribuição e venda legal de fármacos veterinários, antibióticos, antiparasitários e produtos biológicos autorizados pela DGAV.',
    english: 'Distribution and dispensing of authorized veterinary pharmaceuticals and vaccines registered with DGAV.',
    icon: 'Pill',
  },
  {
    id: 'nutricao-animal',
    category: 'agropecuaria',
    name: 'Nutrição e Alimentação Especializada',
    en: 'Specialized Animal Nutrition',
    tag: 'NUTRIÇÃO & DIETÉTICA',
    text: 'Gamas completas de rações secas e húmidas, dietas veterinárias terapêuticas e rações técnicas para animais de produção.',
    english: 'Full range of premium pet foods, prescription clinical diets and specialized livestock feeds.',
    icon: 'ShoppingBag',
  },
  {
    id: 'produtos-agropecuarios',
    category: 'agropecuaria',
    name: 'Produtos e Suprimentos Agropecuários',
    en: 'Agricultural & Farm Supplies',
    tag: 'FORNECIMENTO AGRÍCOLA',
    text: 'Desinfetantes, suplementação mineral, material de identificação animal, higiene de ordenha e equipamento para explorações.',
    english: 'Disinfectants, mineral supplements, ear tags, milking hygiene supplies and essential farm equipment.',
    icon: 'Tractor',
  },
  {
    id: 'aconselhamento-tecnico',
    category: 'agropecuaria',
    name: 'Aconselhamento Técnico e Pecuário',
    en: 'Technical Agro-Livestock Advisory',
    tag: 'APOIO AO PRODUTOR',
    text: 'Orientação técnica profissional para criadores e produtores agrícolas sobre boas práticas, biossegurança e eficiência zootécnica.',
    english: 'Professional guidance for farmers and producers on biosecurity, animal welfare and herd productivity.',
    icon: 'Sparkles',
  },
];
