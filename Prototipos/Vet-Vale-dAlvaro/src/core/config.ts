export const BRAND = "Clínica Veterinária Vale d'Álvaro";
export const BRAND_SHORT = "Vale d'Álvaro";
export const TAGLINE = "Clínica e cirurgia de pequenos animais e espécies pecuárias em Bragança e Vimioso";
export const COMPANY_LEGAL_NAME = "Clínica Veterinária Vale D'Álvaro, Lda.";
export const NIF = "513 375 260";
export const FOUNDED_YEAR = 2015;
export const TECHNICAL_DIRECTOR = "Dr. Luís Miguel Asseiro de Sá (OMV 3255)";
export const DGAV_LICENSE = "PT10089CL";

export const CLINICAL_TEAM = {
  vets: [
    { name: "Dr. Luís Asseiro de Sá", role: "Médico Veterinário · Direção Clínica (OMV 3255)", enRole: "Veterinarian · Clinical Director (OMV 3255)" },
    { name: "Dra. Lina Freire", role: "Médica Veterinária", enRole: "Veterinarian" },
    { name: "Dra. Susana Alves", role: "Médica Veterinária", enRole: "Veterinarian" },
    { name: "Dr. Miguel Pinheiro", role: "Médico Veterinário", enRole: "Veterinarian" },
  ],
  nurses: [
    "Enf. Susana de Sá",
    "Enf. Felipe Cazarin",
    "Enf. Inês Lestre da Silva",
    "Enf. Juliana Pereira",
    "Enf. Rita Dias",
  ],
} as const;

export const ADDRESS_STREET = "Rua de Montesinho, 1-A, R/C Dto.";
export const ADDRESS_POSTAL = "5300-443";
export const ADDRESS_CITY = "Bragança";
export const ADDRESS_REGION = "Trás-os-Montes";
export const ADDRESS_COUNTRY = "Portugal";
export const FULL_ADDRESS = `${ADDRESS_STREET}, ${ADDRESS_POSTAL} ${ADDRESS_CITY}`;

export const VIMIOSO_NAME = "Consultório Veterinário de Vimioso";
export const VIMIOSO_ADDRESS = "Bairro S. Sebastião, Vimioso";

export const GPS_LAT = 41.8136559;
export const GPS_LNG = -6.7600893;
export const MAP =
  "https://www.google.com/maps/place//data=!4m2!3m1!1s0xd3a49ef662d7d57:0xbaa98aa0284b9961?sa=X&ved=1t:8290&ictx=111";
export const MAP_SEARCH =
  "https://www.google.com/maps/search/?api=1&query=Cl%C3%ADnica%20Veterin%C3%A1ria%20Vale%20D%27%C3%81lvaro%2C%20Rua%20de%20Montesinho%20n%C2%BA%201%20%2FA%20Rch%20drt%205300-443%20Bragan%C3%A7a";
export const MAP_EMBED = `https://maps.google.com/maps?q=Cl%C3%ADnica+Veterin%C3%A1ria+Vale+D%27%C3%81lvaro,+Rua+de+Montesinho+1,+Bragan%C3%A7a&hl=pt&z=16&output=embed`;

export const PHONE = "273 325 357";
export const PHONE_INTL = "+351 273 325 357";
export const PHONE_RAW = "+351273325357";

export const MOBILE = "934 682 958";
export const MOBILE_INTL = "+351 934 682 958";
export const MOBILE_RAW = "+351934682958";

export const PHONE_LINES = [
  { label: "Clínica · Rede Fixa", display: "273 325 357", raw: "+351273325357" },
  { label: "Telemóvel & Urgências", display: "934 682 958", raw: "+351934682958" },
  { label: "Equipa / Assistência de Campo", display: "968 040 881", raw: "+351968040881" },
  { label: "Linha Móvel Alternativa", display: "925 271 759", raw: "+351925271759" },
] as const;

export const EMAIL = "vetvaledalvaro@sapo.pt";
export const WEBSITE = "https://vetvaledalvaro.pt";
export const WHATSAPP = "https://wa.me/351934682958";
export const INSTAGRAM = "https://www.instagram.com/vet_vale_d_alvaro/";
export const INSTAGRAM_HANDLE = "@vet_vale_d_alvaro";
export const FACEBOOK = "https://www.facebook.com/vetvaledalvaro/?locale=pt_PT";
export const FACEBOOK_LABEL = "Clínica Veterinária Vale d'Álvaro";

export const GOOGLE_RATING = {
  score: "4,8",
  value: 4.8,
  count: 245,
};

export const FACEBOOK_RATING = {
  percent: 100,
  count: 28,
};

export const HOURS = [
  { days: "Segunda a Sexta", enDays: "Monday to Friday", time: "09:00–19:00" },
  { days: "Sábado", enDays: "Saturday", time: "09:00–13:00" },
  {
    days: "Domingo",
    enDays: "Sunday",
    time: "Encerrado · Urgências sob contacto",
    enTime: "Closed · Emergencies by prior call",
  },
] as const;

export const STATIC_SITE = process.env.NEXT_PUBLIC_STATIC_SITE === "1";
export const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";
export const url = (path: string) => BASE + path;
export const ORIGIN = STATIC_SITE
  ? "https://elysiumdr.eu" + BASE
  : process.env.NEXT_PUBLIC_ORIGIN || "https://vetvaledalvaro.pt";

export const SEDES = [
  {
    id: "montesinho",
    name: "Clínica Veterinária Vale d'Álvaro · Bragança",
    phone: "+351 273 325 357",
    mobile: "+351 934 682 958",
    address: "Rua de Montesinho, 1-A, R/C Dto., 5300-443 Bragança",
    en: "Rua de Montesinho, 1-A, Ground Floor Right, 5300-443 Bragança",
    map: MAP,
    hours: "Seg–Sex: 09:00–19:00 · Sáb: 09:00–13:00 · Urgências sob contacto telefónico",
    enHours: "Mon–Fri: 09:00–19:00 · Sat: 09:00–13:00 · Emergencies by prior call",
  },
  {
    id: "vimioso",
    name: "Consultório Veterinário de Vimioso",
    phone: "+351 934 682 958",
    mobile: "+351 273 325 357",
    address: "Bairro S. Sebastião, Vimioso",
    en: "Bairro S. Sebastião, Vimioso",
    map: "https://www.google.com/maps/search/?api=1&query=Bairro+S.+Sebasti%C3%A3o,+Vimioso,+Portugal",
    hours: "Atendimento mediante marcação prévia (ligar 273 325 357 / 934 682 958)",
    enHours: "By prior appointment (call 273 325 357 / 934 682 958)",
  },
] as const;

export const CRM_PRESET = {
  id: "valedalvaro",
  shortName: "Vale d'Álvaro",
  brandName: "Clínica Veterinária Vale D'Álvaro, Lda.",
  city: "Bragança",
  dgav: "CAMV DGAV PT10089CL",
  director: "Dr. Luís Miguel Asseiro de Sá (OMV 3255)",
  phone: "+351 273 325 357",
  email: "vetvaledalvaro@sapo.pt",
  whatsapp: "https://wa.me/351934682958",
  sedes: [
    {
      id: "montesinho",
      name: "Bragança · Rua de Montesinho, 1-A",
      address: "Rua de Montesinho, 1-A, R/C Dto., 5300-443 Bragança",
      phone: "+351 273 325 357",
      hours: "Seg–Sex: 09:00–19:00 · Sáb: 09:00–13:00 · Urgências sob contacto",
    },
    {
      id: "vimioso",
      name: "Consultório Veterinário de Vimioso",
      address: "Bairro S. Sebastião, Vimioso",
      phone: "+351 934 682 958",
      hours: "Atendimento sob marcação · Contactar 273 325 357 / 934 682 958",
    },
  ],
  services: [
    "Clínica & Medicina Preventiva (Cães, Gatos & Exóticos)",
    "Cirurgia, Análises Sanguíneas & Internamento",
    "Clínica & Cirurgia Pecuária · Reprodução e Sanidade em Suiniculturas",
    "Tosquias, Banhos & Higiene Animal",
    "Hotel & Alojamento com Vigilância Veterinária",
    "Domicílios, Urgências (sob contacto) & Cheque Veterinário OMV",
  ],
  pets: [
    {
      id: "p1",
      owner: "c1",
      ownerName: "Carlos Alberto Gonçalves",
      name: "Montesinho",
      species: "Cão",
      breed: "Cão de Gado Transmontano",
      microchip: "620098100104829",
      age: "5 anos",
      weight: "54,0 kg",
      vaccines: "Em dia (Raiva + Polivalente)",
      nextVaccine: "2027-04-10",
      sede: "Bragança · Rua de Montesinho, 1-A",
      plan: "Plano Preventivo Anual + Tosquia",
    },
    {
      id: "p2",
      owner: "c2",
      ownerName: "Patrícia Alexandra Meirinhos",
      name: "Mafalda",
      species: "Gato",
      breed: "Europeu Comum",
      microchip: "620098100293841",
      age: "3 anos",
      weight: "3,9 kg",
      vaccines: "Reforço Pendente",
      nextVaccine: "2026-11-24",
      sede: "Bragança · Rua de Montesinho, 1-A",
      plan: "Cheque Veterinário OMV + Banho & Hotel",
    },
    {
      id: "p3",
      owner: "c3",
      ownerName: "Exploração Agropecuária Rabal · José Pires",
      name: "Efetivo BVL-42",
      species: "Suinicultura / Pecuária",
      breed: "Efetivo Suíno & Ruminantes (80 cabeças)",
      microchip: "PT-0402-OPP",
      age: "Efetivo Reprodutor",
      weight: "Lote Pecuário",
      vaccines: "Sanidade & Profilaxia em dia",
      nextVaccine: "2027-02-15",
      sede: "Consultório Veterinário de Vimioso",
      plan: "Reprodução & Sanidade em Suiniculturas",
    },
  ],
  clients: [
    {
      id: "c1",
      name: "Carlos Alberto Gonçalves",
      nif: "198 402 311",
      email: "cagoncalves.bgc@gmail.com",
      phone: "+351 964 201 883",
      concelho: "Bragança",
      status: "active",
      plan: "Plano Preventivo + Hotel Animal",
      licenseCode: "VA-2026-0912",
      balanceEur: 0,
      petsCount: 1,
    },
    {
      id: "c2",
      name: "Patrícia Alexandra Meirinhos",
      nif: "244 891 023",
      email: "patricia.meirinhos@ipb.pt",
      phone: "+351 918 773 402",
      concelho: "Bragança",
      status: "attention",
      plan: "Cheque Veterinário OMV + Tosquia",
      licenseCode: "OMV-VA-2026-441",
      balanceEur: 42,
      petsCount: 1,
    },
    {
      id: "c3",
      name: "José Pires (Exploração Agropecuária)",
      nif: "509 381 204",
      email: "josepires.rabal@sapo.pt",
      phone: "+351 939 102 488",
      concelho: "Vimioso / Bragança",
      status: "active",
      plan: "Acompanhamento Sanidade & Reprodução Pecuária",
      licenseCode: "VA-PEC-2026-108",
      balanceEur: 0,
      petsCount: 1,
    },
  ],
  bookings: [
    {
      id: "b1",
      day: "2026-11-19",
      time: "09:30",
      service: "Consulta, Análises Sanguíneas & Reforço Vacinal",
      sede: "Bragança · Rua de Montesinho, 1-A",
      petName: "Montesinho",
      clientName: "Carlos Alberto Gonçalves",
      doctor: "Dr. Luís Asseiro de Sá",
      priceEur: 38,
      status: "confirmed",
    },
    {
      id: "b2",
      day: "2026-11-19",
      time: "11:00",
      service: "Tosquia, Banho & Check-in Hotel (3 Noites)",
      sede: "Bragança · Rua de Montesinho, 1-A",
      petName: "Mafalda",
      clientName: "Patrícia Alexandra Meirinhos",
      doctor: "Dra. Lina Freire",
      priceEur: 68,
      status: "requested",
    },
    {
      id: "b3",
      day: "2026-11-19",
      time: "15:30",
      service: "Visita de Campo · Reprodução & Sanidade em Suinicultura",
      sede: "Consultório Veterinário de Vimioso",
      petName: "Efetivo BVL-42",
      clientName: "José Pires",
      doctor: "Dr. Miguel Pinheiro",
      priceEur: 140,
      status: "in_progress",
    },
  ],
  leads: [
    {
      id: "l1",
      fullName: "Nuno Miguel Cepeda",
      phone: "+351 967 881 209",
      email: "nunocepeda.bgc@gmail.com",
      petSummary: "Labrador · Reserva Hotel Fim de Semana + Banho",
      sede: "Bragança · Rua de Montesinho, 1-A",
      score: 95,
      stage: "novo",
      estimatedEur: 90,
      notes: "Procura alojamento para 4 dias com banho antes da entrega.",
    },
    {
      id: "l2",
      fullName: "Sociedade Agrícola Montesinho, Lda.",
      phone: "+351 273 910 442",
      email: "samontesinho@gmail.com",
      petSummary: "Suinicultura & Bovinos · Controlo Sanitário e Reprodutivo",
      sede: "Consultório Veterinário de Vimioso",
      score: 92,
      stage: "triagem",
      estimatedEur: 320,
      notes: "Agendar deslocação clínica de campo com equipa de sanidade.",
    },
  ],
  products: [
    {
      id: "i1",
      name: "Vacina Polivalente Canina + Antirrábica",
      sku: "VAC-VA-01",
      lot: "LT-2610M",
      stock: 4,
      minimum: 10,
      expiry: "2027-06-30",
      category: "Imunológicos Companhia",
      priceEur: 32,
    },
    {
      id: "i2",
      name: "Desparasitante Espécies Pecuárias 500 ml",
      sku: "PEC-VA-08",
      lot: "PC-9910",
      stock: 3,
      minimum: 6,
      expiry: "2027-09-15",
      category: "Farmácia Pecuária",
      priceEur: 64,
    },
    {
      id: "i3",
      name: "Dieta Clínica Veterinária Cão 12 kg",
      sku: "NUT-VA-12",
      lot: "NT-5512",
      stock: 11,
      minimum: 4,
      expiry: "2027-11-30",
      category: "Nutrição Veterinária",
      priceEur: 68,
    },
  ],
  records: [
    {
      id: "r1",
      petId: "p1",
      petName: "Montesinho",
      kind: "Consulta, Esfregaço Sanguíneo & Profilaxia",
      doctor: "Dr. Luís Asseiro de Sá",
      sede: "Bragança · Rua de Montesinho, 1-A",
      note: "Exame geral normal e pesquisa de hemoparasitas (babesiose) negativa. Administrada vacina antirrábica e desparasitação interna. Agendada tosquia higiénica.",
      created: "2026-11-12T10:15:00Z",
    },
    {
      id: "r2",
      petId: "p3",
      petName: "Efetivo BVL-42",
      kind: "Sanidade & Controlo Reprodutivo (Campo)",
      doctor: "Dra. Susana Alves",
      sede: "Consultório Veterinário de Vimioso",
      note: "Acompanhamento de sanidade e maneio reprodutivo na exploração. Atualizado registo sanitário do efetivo.",
      created: "2026-11-15T16:00:00Z",
    },
  ],
  inquiries: [
    {
      id: "q1",
      name: "Nuno Miguel Cepeda",
      phone: "+351 967 881 209",
      email: "nunocepeda.bgc@gmail.com",
      pet_name: "Simba (Labrador, 4 anos)",
      topic: "Hotel Animal & Banhos/Tosquias",
      sede: "Bragança · Rua de Montesinho, 1-A",
      message: "Bom dia, têm vaga no hotel para o Simba de sexta a segunda-feira com banho incluído?",
      created: "2026-11-18T10:05:00Z",
      unread: true,
    },
  ],
  submissions: [
    {
      id: "s1",
      clientId: "c2",
      clientName: "Patrícia Alexandra Meirinhos",
      petName: "Mafalda",
      method: "MB WAY",
      reference: "MBW-33109",
      amountEur: 42,
      concept: "Banho, Tosquia & Desparasitação Felina",
      submittedAt: "2026-11-18 11:40",
      status: "pending",
    },
  ],
};

export interface BusinessStatus {
  isOpen: boolean;
  state: "open" | "lunch" | "closed";
  text: string;
  enText: string;
  shortText: string;
  shortEnText: string;
  badge: string;
  next: string;
}

export function getBusinessStatus(now = new Date()): BusinessStatus {
  const fallback: BusinessStatus = {
    isOpen: true,
    state: "open",
    badge: "Seg–Sex 09:00–19:00",
    text: "Seg–Sex 09:00–19:00 · Sáb 09:00–13:00",
    enText: "Mon–Fri 09:00–19:00 · Sat 09:00–13:00",
    shortText: "Seg–Sex 09:00–19:00",
    shortEnText: "Mon–Fri 09:00–19:00",
    next: "19:00",
  };
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Lisbon",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(now);
    const weekday = parts.find((p) => p.type === "weekday")?.value || "";
    const hour = Number(parts.find((p) => p.type === "hour")?.value || 0);
    const minute = Number(parts.find((p) => p.type === "minute")?.value || 0);
    const mins = hour * 60 + minute;

    const open = (closes: string): BusinessStatus => ({
      isOpen: true,
      state: "open",
      badge: "Aberto agora",
      text: `Aberto agora · até às ${closes}`,
      enText: `Open now · until ${closes}`,
      shortText: `Aberto · até ${closes}`,
      shortEnText: `Open · until ${closes}`,
      next: closes,
    });

    if (weekday === "Sun") {
      return {
        isOpen: false,
        state: "closed",
        badge: "Domingo",
        text: "Domingo · Urgências sob contacto",
        enText: "Sunday · Emergencies by prior call",
        shortText: "Domingo · Urgências",
        shortEnText: "Sunday · Emergencies",
        next: "Segunda, 09:00",
      };
    }
    if (weekday === "Sat") {
      if (mins >= 540 && mins < 780) return open("13:00");
      return {
        isOpen: false,
        state: "closed",
        badge: "Fim de semana",
        text: "Fechado · Urgências sob contacto",
        enText: "Closed · Emergencies by prior call",
        shortText: "Fechado · Urgências",
        shortEnText: "Closed · Emergencies",
        next: "Segunda, 09:00",
      };
    }
    if (mins >= 540 && mins < 1140) return open("19:00");
    return {
      isOpen: false,
      state: "closed",
      badge: "Fechado",
      text: "Fechado · Urgências sob contacto",
      enText: "Closed · Emergencies by prior call",
      shortText: "Fechado · Urgências",
      shortEnText: "Closed · Emergencies",
      next: "09:00",
    };
  } catch {
    return fallback;
  }
}

export const services = [
  {
    id: "consultas-prevencao",
    category: "clinica",
    tone: "pine",
    name: "Clínica & Medicina Preventiva",
    en: "Small Animal & Preventive Medicine",
    tag: "CÃES, GATOS & EXÓTICOS · SIAC",
    enTag: "DOGS, CATS & EXOTICS · SIAC",
    text: "Consultas médico-veterinárias para cães, gatos, coelhos e aves, vacinação, desparasitação, identificação eletrónica SIAC e acompanhamento contínuo. Entidade aderente ao Cheque Veterinário OMV.",
    english:
      "Routine consultations for dogs, cats, rabbits and birds, vaccination, parasite control, SIAC microchipping and continuous follow-up. OMV Cheque Veterinário partner.",
    icon: "Stethoscope",
  },
  {
    id: "cirurgia-internamento",
    category: "clinica",
    tone: "azulejo",
    name: "Cirurgia, Análises & Internamento",
    en: "Surgery, Blood Tests & Hospitalization",
    tag: "DGAV PT10089CL",
    enTag: "DGAV PT10089CL",
    text: "Cirurgia de pequenos animais, análises sanguíneas e esfregaços laboratoriais (incluindo pesquisa de hemoparasitas) e internamento vigiado pela nossa equipa de médicos e enfermeiros veterinários.",
    english:
      "Small-animal surgery, blood tests and diagnostic smears (including hemoparasite screening), plus closely monitored hospitalization with our vets and veterinary nurses.",
    icon: "HeartPulse",
  },
  {
    id: "pecuaria-campo",
    category: "agropecuaria",
    tone: "ochre",
    name: "Espécies Pecuárias & Suiniculturas",
    en: "Livestock & Swine Herd Health",
    tag: "BRAGANÇA, VIMIOSO & TRÁS-OS-MONTES",
    enTag: "BRAGANÇA, VIMIOSO & TRÁS-OS-MONTES",
    text: "Clínica e cirurgia de espécies pecuárias (bovinos, ovinos, caprinos e equídeos) e serviço dedicado de reprodução e sanidade em suiniculturas com equipa móvel no terreno.",
    english:
      "Field medicine and surgery for cattle, sheep, goats and equids, plus dedicated reproduction and herd-health services for swine farms across Bragança and Vimioso.",
    icon: "Tractor",
  },
  {
    id: "banhos-tosquias",
    category: "bem-estar",
    tone: "clay",
    name: "Tosquias, Banhos & Higiene",
    en: "Grooming, Bathing & Hygiene",
    tag: "ESTÉTICA & BEM-ESTAR",
    enTag: "GROOMING & COMFORT",
    text: "Banhos regulares ou dermatológicos, tosquias higiénicas e corte adaptado ao pelo e ao feitio de cada cão e gato, num ambiente calmo e familiar.",
    english:
      "Regular or medicated baths, hygiene trims and coat care tailored to each dog or cat’s temperament in a calm, familiar setting.",
    icon: "Scissors",
  },
  {
    id: "hotel-alojamento",
    category: "bem-estar",
    tone: "linen",
    name: "Hotel & Alojamento Animal",
    en: "Supervised Pet Hotel",
    tag: "COM VIGILÂNCIA VETERINÁRIA",
    enTag: "VET-SUPERVISED STAY",
    text: "Quando precisa de viajar ou ausentar-se, o seu companheiro fica alojado com conforto, rotinas tranquilas e a segurança de vigilância médico-veterinária.",
    english:
      "When you travel or are away, your pet stays in comfort with steady routines and the peace of mind of veterinary supervision.",
    icon: "Home",
  },
  {
    id: "domicilios-nutricao",
    category: "clinica",
    tone: "terracotta",
    name: "Domicílios, Urgências & Nutrição",
    en: "Mobile Visits, Emergencies & Nutrition",
    tag: "BRAGANÇA & VIMIOSO",
    enTag: "BRAGANÇA & VIMIOSO",
    text: "Serviço ambulatório e visitas ao domicílio, transporte de animais doentes, disponibilidade em urgências mediante contacto telefónico prévio e aconselhamento em alimentação veterinária na clínica.",
    english:
      "Ambulatory and home visits, sick animal transport, emergency support by prior telephone contact, and veterinary nutrition advice at the clinic.",
    icon: "ShieldCheck",
  },
];
