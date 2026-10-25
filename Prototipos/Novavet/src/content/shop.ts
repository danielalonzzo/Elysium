/**
 * Catálogo e Seleção de Produtos · Novavet Bragança
 *
 * Consultório Médico-Veterinário (Dr. Luís Afonso) & Produtos Agro-Pecuários, Lda.
 * Registo DGAV: PT 1 0124 CN
 * Preços de referência em Euros (€), IVA incluído.
 * A confirmação de disponibilidade e dispensa de medicamentos autorizados é realizada
 * diretamente com a equipa técnica em Bragança.
 */

export type Art = 'pouch' | 'can' | 'jar' | 'bottle' | 'pump' | 'spray' | 'wipes' | 'rope' | 'ball' | 'wand' | 'plush' | 'mouse' | 'collar' | 'bowl' | 'bed' | 'brush' | 'dropper' | 'tube' | 'kit';
export type Category = 'food' | 'farm' | 'bath' | 'supplements' | 'hygiene' | 'bemed';
export type Species = 'dog' | 'cat' | 'sheep' | 'cattle' | 'horse' | 'all';
type Text = {name: string, short: string, label: string, text: string, points: string[]};

export type Product = {
  id: string;
  cat: Category | 'kit';
  species: Species[];
  art: Art;
  tone: string;
  color: string;
  accent: string;
  image?: string;
  badge?: 'pick' | 'new' | 'grainfree' | 'dgav';
  featured?: number;
  sizes: {label: string, price: number}[];
  includes?: [string, string][];
  es: Text; // Usado para Português Europeu
  en: Text; // Usado para Inglês
};

export const CATEGORIES: [Category | 'all', string, string][] = [
  ['all', 'Todo o Catálogo', 'All Products'],
  ['food', 'Alimentação & Rações', 'Feeds & Nutrition'],
  ['farm', 'Agropecuária & Pecuária', 'Livestock & Farming'],
  ['supplements', 'Suplementação & Minerais', 'Supplements & Minerals'],
  ['bath', 'Higiene & Dermatologia', 'Hygiene & Derma Care'],
  ['hygiene', 'Biossegurança & Desinfeção', 'Biosecurity & Disinfection'],
  ['bemed', 'Dispositivos Médicos Bemed', 'Bemed Medical Devices'],
];

export const PRODUCTS: Product[] = [
  // --- ALIMENTAÇÃO E RAÇÕES ---
  {
    id: 'cao-adulto-cordeiro',
    cat: 'food',
    species: ['dog'],
    art: 'pouch',
    tone: '#f2f6f3',
    color: '#1f4d3a',
    accent: '#006570',
    image: '/images/products/cao-adulto-cordeiro.jpg',
    badge: 'pick',
    featured: 1,
    sizes: [{label: '3 kg', price: 19.90}, {label: '12 kg', price: 58.50}],
    es: {
      name: 'Alimento Completo Cão Adulto · Cordeiro & Arroz',
      short: 'Cães adultos de todas as raças · Fórmula Clínica',
      label: 'ADULTO',
      text: 'Proteína de cordeiro de elevada digestibilidade, arroz integral e ácidos gordos essenciais para uma pelagem brilhante e suporte articular.',
      points: ['Cordeiro como principal fonte proteica', 'Com ómega 3 e 6 para a pele e pelo', 'Croquete adaptado à mastigação'],
    },
    en: {
      name: 'Adult Dog Formula · Lamb & Rice',
      short: 'Adult dogs of all breeds · Clinical Diet',
      label: 'ADULT',
      text: 'High digestibility lamb protein, brown rice and essential fatty acids for a shiny coat and joint support.',
      points: ['Lamb as primary protein source', 'Omega 3 & 6 for skin and coat', 'Adapted kibble texture'],
    },
  },
  {
    id: 'gato-esterilizado-salmao',
    cat: 'food',
    species: ['cat'],
    art: 'pouch',
    tone: '#f3f7f9',
    color: '#005b82',
    accent: '#009bb0',
    image: '/images/products/gato-esterilizado-salmao.jpg',
    badge: 'grainfree',
    featured: 2,
    sizes: [{label: '1,5 kg', price: 16.50}, {label: '4 kg', price: 34.90}],
    es: {
      name: 'Ração Gato Esterilizado · Salmão & Arando',
      short: 'Gatos esterilizados de interior · Controlo de Peso',
      label: 'ESTERILIZADO',
      text: 'Fórmula com controlo calórico rigoroso, pH urinário equilibrado e taurina para a saúde cardiovascular e controlo de bolas de pelo.',
      points: ['Controlo de peso após esterilização', 'Proteção do trato urinário', 'Sem cereais adicionados'],
    },
    en: {
      name: 'Sterilised Cat Formula · Salmon & Cranberry',
      short: 'Indoor sterilised cats · Weight Management',
      label: 'STERILISED',
      text: 'Calorie-controlled recipe, balanced urinary pH and taurine for cardiovascular health and hairball management.',
      points: ['Weight control post-sterilisation', 'Urinary tract health', 'Grain-free recipe'],
    },
  },
  {
    id: 'alimento-borregos-crescimento',
    cat: 'food',
    species: ['sheep'],
    art: 'pouch',
    tone: '#f4f6f1',
    color: '#154d38',
    accent: '#8ec63f',
    image: '/images/products/alimento-borregos-crescimento.jpg',
    badge: 'pick',
    featured: 3,
    sizes: [{label: '25 kg', price: 18.75}, {label: 'Saco 40 kg', price: 28.50}],
    es: {
      name: 'Ração de Arranque & Crescimento para Borregos',
      short: 'Ovinos e caprinos jovens · Alta Conversão Alimentar',
      label: 'PECUÁRIA',
      text: 'Alimento concentrado peletizado de alta digestibilidade, enriquecido com vitaminas A, D3, E e cálcio para um desenvolvimento ósseo e muscular robusto.',
      points: ['Proteína bruta equilibrada 18%', 'Enriquecido com minerais e vitaminas', 'Excelente palatabilidade e conversão'],
    },
    en: {
      name: 'Lamb Starter & Growth Feed',
      short: 'Young sheep and goats · High Feed Conversion',
      label: 'LIVESTOCK',
      text: 'High digestibility pelleted feed fortified with vitamins A, D3, E and calcium for sound skeletal and muscle development.',
      points: ['18% balanced crude protein', 'Fortified minerals and trace elements', 'High feed conversion ratio'],
    },
  },

  // --- AGROPECUÁRIA E PRODUÇÃO ---
  {
    id: 'bloco-mineral-ruminantes',
    cat: 'farm',
    species: ['cattle', 'sheep'],
    art: 'jar',
    tone: '#f7f2ed',
    color: '#825c34',
    accent: '#dfb775',
    image: '/images/products/bloco-mineral-ruminantes.jpg',
    badge: 'pick',
    featured: 4,
    sizes: [{label: 'Bloco 10 kg', price: 12.80}, {label: 'Bloco 20 kg', price: 22.50}],
    es: {
      name: 'Bloco Mineral com Oligoelementos para Lamber',
      short: 'Bovinos, ovinos e caprinos em pastoreio · Resistente a Chuva',
      label: 'MINERAIS',
      text: 'Suplemento mineral resistente à intempérie para pastagens de Trás-os-Montes. Previne carências de selénio, cobalto, zinco e fósforo.',
      points: ['Resistente à chuva e sol em pastagem', 'Contém selénio e fósforo assimilável', 'Melhora fertilidade e crescimento'],
    },
    en: {
      name: 'Mineral Lick Block with Trace Elements',
      short: 'Grazing cattle, sheep and goats · Weather Resistant',
      label: 'MINERALS',
      text: 'Weather-resistant mineral lick tailored for pasture grazing. Prevents selenium, cobalt, zinc and phosphorus deficiencies.',
      points: ['Rain and weather resistant', 'Bioavailable selenium & phosphorus', 'Enhances fertility and herd vigour'],
    },
  },
  {
    id: 'desinfetante-instalacoes-pecuarias',
    cat: 'hygiene',
    species: ['cattle', 'sheep', 'horse'],
    art: 'bottle',
    tone: '#f1f8f4',
    color: '#0e4a36',
    accent: '#009bb0',
    image: '/images/products/desinfetante-instalacoes-pecuarias.jpg',
    badge: 'dgav',
    sizes: [{label: '5 L', price: 34.00}, {label: '20 L', price: 115.00}],
    es: {
      name: 'Desinfetante Virucida & Bactericida Pecuário',
      short: 'Higiene de estábulos, ordenhas e transporte · Homologado DGAV',
      label: 'DGAV',
      text: 'Desinfetante de largo espetro homologado para instalações agropecuárias. Eficácia comprovada contra vírus, bactérias e fungos mesmo em água fria.',
      points: ['Homologado para uso veterinário e pecuário', 'Eficácia em presença de matéria orgânica', 'Biodegradável e não corrosivo nas doses recomendadas'],
    },
    en: {
      name: 'Livestock Disinfectant Virucide & Bactericide',
      short: 'Stables, milking parlours & transport · DGAV Approved',
      label: 'DGAV',
      text: 'Broad-spectrum disinfectant approved for agricultural and livestock premises. Proven efficacy against viruses, bacteria and fungi.',
      points: ['Approved for veterinary farm use', 'Active in presence of organic matter', 'Biodegradable formula'],
    },
  },
  {
    id: 'pomada-cascos-unguento',
    cat: 'farm',
    species: ['cattle', 'sheep', 'horse'],
    art: 'jar',
    tone: '#f4f3ef',
    color: '#4a3b2c',
    accent: '#dfb775',
    image: '/images/products/pomada-cascos-unguento.jpg',
    sizes: [{label: '1000 ml', price: 17.50}],
    es: {
      name: 'Pomada Cicatrizante & Protetora de Cascos',
      short: 'Equinos e ruminantes · Óleos Naturais & Zinco',
      label: 'CASCOS',
      text: 'Fórmula tradicional à base de óleos vegetais e sulfato de zinco. Mantém a elasticidade do casco e previne infeções podais em terrenos rochosos.',
      points: ['Ação antissética e emoliente', 'Ideal para terrenos rochosos e húmidos', 'Fácil aplicação com trincha'],
    },
    en: {
      name: 'Hoof Protection & Healing Ointment',
      short: 'Horses and ruminants · Natural Oils & Zinc',
      label: 'HOOF CARE',
      text: 'Natural oil and zinc formulation to preserve hoof elasticity and protect against pododermatitis in stony terrain.',
      points: ['Antiseptic and emollient action', 'Ideal for rocky soils', 'Easy brush application'],
    },
  },

  // --- SUPLEMENTAÇÃO E BEM-ESTAR ---
  {
    id: 'oleo-salmao-selvagem',
    cat: 'supplements',
    species: ['dog', 'cat'],
    art: 'pump',
    tone: '#f8f4ec',
    color: '#b8742f',
    accent: '#dfb775',
    image: '/images/products/oleo-salmao-selvagem.jpg',
    badge: 'pick',
    sizes: [{label: '250 ml', price: 14.50}, {label: '500 ml', price: 24.90}],
    es: {
      name: 'Óleo de Salmão Selvagem 100% Puro',
      short: 'Pele, pelagem e articulações · Prensado a Frio',
      label: 'ÓMEGA 3',
      text: 'Rico em ácidos gordos EPA e DHA essenciais. Reduz a descamação, reforça a barreira cutânea e apoia a mobilidade articular em cães e gatos.',
      points: ['100% salmão prensado a frio', 'Dosador antigota prático', 'Adiciona-se diretamente sobre o alimento'],
    },
    en: {
      name: 'Pure Wild Salmon Oil · Omega 3',
      short: 'Skin, coat and joint mobility · Cold Pressed',
      label: 'OMEGA 3',
      text: 'Rich in essential EPA and DHA fatty acids. Nourishes skin, minimizes flaking and provides natural joint support.',
      points: ['100% cold-pressed salmon', 'Convenient pump dispenser', 'Direct addition to regular food'],
    },
  },
  {
    id: 'suplemento-condroprotetor',
    cat: 'supplements',
    species: ['dog'],
    art: 'jar',
    tone: '#f1f5f8',
    color: '#1a4f78',
    accent: '#009bb0',
    image: '/images/products/suplemento-condroprotetor.jpg',
    sizes: [{label: '60 comprimidos', price: 29.80}, {label: '120 comprimidos', price: 49.50}],
    es: {
      name: 'Condroprotetor Articular Avançado · Glucosamina & Condroitina',
      short: 'Cães seniores ou raças grandes · Suporte Cartilagíneo',
      label: 'MOBILIDADE',
      text: 'Glucosamina, condroitina, ácido hialurónico e colagénio tipo II para a regeneração da cartilagem e conforto na locomoção.',
      points: ['Fórmula veterinária comprovada', 'Comprimidos palatáveis fáceis de administrar', 'Apoio em osteoartrite e displasia'],
    },
    en: {
      name: 'Joint Chondroprotector · Glucosamine & Chondroitin',
      short: 'Senior dogs or large breeds · Cartilage Regeneration',
      label: 'MOBILITY',
      text: 'Glucosamine, chondroitin, hyaluronic acid and collagen type II for cartilage support and comfortable locomotion.',
      points: ['Veterinary approved formula', 'Palatable chewable tablets', 'Ideal for senior and athletic dogs'],
    },
  },

  // --- HIGIENE E BANHO ---
  {
    id: 'champu-antisseptico-clorexidina',
    cat: 'bath',
    species: ['dog', 'cat'],
    art: 'bottle',
    tone: '#eff6f7',
    color: '#006570',
    accent: '#8ec63f',
    image: '/images/products/champu-antisseptico-clorexidina.jpg',
    badge: 'dgav',
    sizes: [{label: '250 ml', price: 16.90}, {label: '500 ml', price: 26.50}],
    es: {
      name: 'Champô Dermatológico com Clorexidina 4%',
      short: 'Higiene e controlo bacteriano cutâneo · pH 7.0 Fisiológico',
      label: 'DERMA',
      text: 'Champô antissético de prescrição e cuidado tópico para piodermites, dermatites bacterianas e fúngicas com pH neutro 7.0.',
      points: ['Ação antissética sem secar a pele', 'Respeita o pH da epiderme animal', 'Uso recomendado sob conselho veterinário'],
    },
    en: {
      name: 'Dermatological Chlorhexidine 4% Shampoo',
      short: 'Skin hygiene and bacterial control · Neutral pH 7.0',
      label: 'DERMA',
      text: 'Prescription-grade antiseptic shampoo for bacterial and fungal dermatological care with neutral pH 7.0.',
      points: ['Antiseptic action without dehydration', 'Respects natural skin pH barrier', 'Veterinary recommended'],
    },
  },
  {
    id: 'spray-cicatrizante-prata',
    cat: 'farm',
    species: ['cattle', 'sheep', 'horse', 'dog'],
    art: 'spray',
    tone: '#f1f4f2',
    color: '#34463d',
    accent: '#8ec63f',
    image: '/images/products/spray-cicatrizante-prata.jpg',
    sizes: [{label: '200 ml', price: 13.50}],
    es: {
      name: 'Spray Protetor & Cicatrizante com Alumínio Micronizado',
      short: 'Pequenas feridas, cortes e pós-operatório · Barreira Repelente',
      label: 'CICATRIZANTE',
      text: 'Cria uma película protetora elástica e impermeável sobre feridas cutâneas, protegendo contra moscas, sujidade e humidade.',
      points: ['Barreira mecânica contra insetos e sujidade', 'Permite a respiração dos tecidos', 'Indispensável no estojo da exploração'],
    },
    en: {
      name: 'Micronised Aluminium Wound Spray',
      short: 'Minor cuts, grazes and post-surgery · Fly Repellent Barrier',
      label: 'HEALING',
      text: 'Forms an elastic and waterproof protective film over wounds, keeping dirt, moisture and flies away.',
      points: ['Physical shield against insects and dirt', 'Allows tissue respiration', 'Essential farm first-aid supply'],
    },
  },

  // --- DISPOSITIVOS MÉDICOS BEMED (NOVAVET GROUP) ---
  {
    id: 'mascaras-cirurgicas-bemed',
    cat: 'bemed',
    species: ['all'],
    art: 'pouch',
    tone: '#f0f6fa',
    color: '#005b82',
    accent: '#009bb0',
    image: '/images/products/mascaras-cirurgicas-bemed.jpg',
    badge: 'dgav',
    featured: 5,
    sizes: [{label: 'Caixa 50 un.', price: 12.50}],
    es: {
      name: 'Máscaras Cirúrgicas Tipo IIR · Bemed Medical',
      short: 'Dispositivo médico certificado EN 14683 · Fabrico Novavet Group',
      label: 'BEMED CE',
      text: 'Máscaras cirúrgicas descartáveis de elevada filtração bacteriana (BFE ≥ 98%), resistentes a salpicos, produzidas em Portugal pela Bemed no Parque Industrial de Bragança.',
      points: ['Certificação Europeia EN 14683 Tipo IIR', 'Fabrico nacional no Parque Industrial de Bragança', 'Conforto e elevada respirabilidade'],
    },
    en: {
      name: 'Type IIR Surgical Masks · Bemed Medical',
      short: 'EN 14683 certified medical device · Novavet Group manufacturing',
      label: 'BEMED CE',
      text: 'High bacterial filtration efficiency (BFE ≥ 98%) splash-resistant surgical masks, manufactured in Portugal by Bemed at Bragança Industrial Park.',
      points: ['European EN 14683 Type IIR Certification', 'Manufactured at Bragança Industrial Park', 'High breathability and comfort'],
    },
  },
];

/** Kits veterinários completos */
export const KITS: Product[] = [
  {
    id: 'kit-sanidade-pecuaria',
    cat: 'kit',
    species: ['sheep', 'cattle'],
    art: 'kit',
    tone: '#f1f8f4',
    color: '#154d38',
    accent: '#8ec63f',
    badge: 'pick',
    sizes: [{label: 'Pack Completo', price: 68.00}],
    includes: [
      ['desinfetante-instalacoes-pecuarias', '5 L'],
      ['bloco-mineral-ruminantes', 'Bloco 10 kg'],
      ['spray-cicatrizante-prata', '200 ml'],
    ],
    es: {
      name: 'Pack Sanidade & Biossegurança para Explorações',
      short: 'Preparado para ovinos, caprinos e bovinos',
      label: 'PACK PRODUTOR',
      text: 'Combinação técnica essencial para produtores pecuários: desinfeção virucida de instalações, suplemento mineral de pastagem e spray cicatrizante de emergência.',
      points: ['Poupança no conjunto', 'Homologação oficial para explorações', 'Aconselhamento técnico incluído na entrega'],
    },
    en: {
      name: 'Farm Biosecurity & Health Pack',
      short: 'Tailored for sheep, goats and cattle',
      label: 'FARM PACK',
      text: 'Essential bundle for livestock owners: broad-spectrum premises disinfectant, mineral pasture block and quick wound spray.',
      points: ['Pack savings', 'Officially approved farm supplies', 'Veterinary advisory included'],
    },
  },
  {
    id: 'kit-boas-vindas-cachorro',
    cat: 'kit',
    species: ['dog'],
    art: 'kit',
    tone: '#f0f6fa',
    color: '#006570',
    accent: '#dfb775',
    badge: 'pick',
    sizes: [{label: 'Pack Cachorro', price: 42.50}],
    includes: [
      ['cao-adulto-cordeiro', '3 kg'],
      ['oleo-salmao-selvagem', '250 ml'],
      ['champu-antisseptico-clorexidina', '250 ml'],
    ],
    es: {
      name: 'Pack Boas-Vindas · Cachorro & Proteção',
      short: 'Para os primeiros meses do seu novo companheiro',
      label: 'NOVO MEMBRO',
      text: 'Alimentação equilibrada, suplementação de ómega 3 para o crescimento cerebral e pelagem, e champô suave dermatológico.',
      points: ['Seleção do Dr. Luís Afonso', 'Tudo o que precisa para começar com saúde', 'Aconselhamento de dosagem no consultório'],
    },
    en: {
      name: 'Puppy Welcome & Protection Pack',
      short: 'For the first months of your new companion',
      label: 'PUPPY PACK',
      text: 'Balanced nutrition, pure omega 3 supplement for brain and coat, and gentle dermatological shampoo.',
      points: ['Selected by Dr. Luís Afonso', 'Everything needed for a healthy start', 'Dosage guidance included'],
    },
  },
];

export const findProduct = (id: string) => PRODUCTS.find(p => p.id === id) || KITS.find(p => p.id === id);
export const priceOf = (p: Product, size: string) => (p.sizes.find(s => s.label === size) || p.sizes[0]).price;

// Formatação oficial de moeda em Portugal: 24,50 €
export const money = (n: number) => n.toFixed(2).replace('.', ',') + ' €';

export const kitValue = (kit: Product) =>
  (kit.includes || []).reduce((sum, [id, size]) => sum + priceOf(findProduct(id)!, size), 0);
