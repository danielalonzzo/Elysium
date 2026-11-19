"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  Building2,
  CalendarClock,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  ClipboardPlus,
  Copy,
  CornerDownLeft,
  Database,
  Download,
  FileCheck2,
  HeartPulse,
  Home,
  Inbox,
  LayoutDashboard,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  MessageSquare,
  MessageSquareQuote,
  Moon,
  PawPrint,
  Phone,
  PieChart,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Sun,
  Terminal,
  User,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { chatGPTSignOutPath } from "@/app/chatgpt-auth";
import * as siteConfig from "@/src/core/config";
import SectionTabs from "./components/SectionTabs";
import {
  Button,
  Chip,
  EmptyState,
  Feedback,
  Field,
  Kpi,
  KpiGrid,
  Modal,
  Panel,
  SectionHeader,
  Toolbar,
} from "./components/ui";

const cfg: any = siteConfig;
const url = cfg.url || ((p: string) => p);

export interface CrmProfilePreset {
  id: string;
  shortName: string;
  brandName: string;
  city: string;
  dgav: string;
  director: string;
  phone: string;
  email: string;
  whatsapp: string;
  sedes: { id: string; name: string; address: string; phone: string; hours: string }[];
  services: string[];
  accent?: string;
  pets?: any[];
  clients?: any[];
  bookings?: any[];
  leads?: any[];
  products?: any[];
  records?: any[];
  inquiries?: any[];
  submissions?: any[];
  plans?: any[];
}

function buildDefaultPreset(): CrmProfilePreset {
  if (cfg.CRM_PRESET) return cfg.CRM_PRESET;
  const sedes =
    cfg.SEDES?.map((s: any) => ({
      id: s.id,
      name: s.name,
      address: s.address,
      phone: s.phone,
      hours: s.hours,
    })) || [
      {
        id: "principal",
        name: cfg.ADDRESS_CITY || "Sede Principal",
        address: cfg.FULL_ADDRESS || cfg.ADDRESS_STREET || "Trás-os-Montes",
        phone: cfg.PHONE || "+351 273 000 000",
        hours: "Seg–Sex: 09:00–12:30 | 14:00–19:00",
      },
    ];
  const primarySede = sedes[0]?.name || cfg.ADDRESS_CITY || "Clínica";
  const secondSede = sedes[1]?.name || primarySede;
  const serviceNames = (cfg.services || []).map((s: any) => s.name);

  return {
    id: "default",
    shortName: cfg.BRAND_SHORT || cfg.BRAND || "Clínica Veterinária",
    brandName: cfg.BRAND || "Centro Médico-Veterinário",
    city: cfg.ADDRESS_CITY || sedes[0]?.name || "Bragança",
    dgav: cfg.DGAV_LICENSE || "CAMV DGAV PT10",
    director: cfg.TECHNICAL_DIRECTOR || "Direção Clínica",
    phone: cfg.PHONE || "+351 273 325 357",
    email: cfg.EMAIL || "vetvaledalvaro@sapo.pt",
    whatsapp: cfg.WHATSAPP || "https://wa.me/351934682958",
    sedes,
    services: serviceNames.length
      ? serviceNames
      : [
          "Consulta Médico-Veterinária",
          "Vacinação e Desparasitação",
          "Cirurgia e Esterilização",
          "Diagnóstico e Análises",
          "Identificação SIAC (Microchip)",
        ],
    pets: [
      {
        id: "p1",
        owner: "c1",
        ownerName: "Tutor de exemplo 1",
        name: "Douro",
        species: "Cão",
        breed: "Castro Laboreiro",
        microchip: "DEMO-CHIP-01",
        age: "4 anos",
        weight: "34,2 kg",
        vaccines: "Em dia (Raiva + Polivalente)",
        nextVaccine: "2027-03-14",
        sede: primarySede,
        plan: "Plano Preventivo Anual",
      },
      {
        id: "p2",
        owner: "c2",
        ownerName: "Tutor de exemplo 2",
        name: "Mimi",
        species: "Gato",
        breed: "Europeu Comum",
        microchip: "DEMO-CHIP-02",
        age: "2 anos",
        weight: "3,8 kg",
        vaccines: "Reforço Felino Pendente",
        nextVaccine: "2026-11-22",
        sede: primarySede,
        plan: "Cheque Veterinário OMV",
      },
      {
        id: "p3",
        owner: "c3",
        ownerName: "Exploração de exemplo",
        name: "Trovão",
        species: "Cão",
        breed: "Podengo Português",
        microchip: "DEMO-CHIP-03",
        age: "6 anos",
        weight: "14,5 kg",
        vaccines: "Em dia (Leishmaniose + Raiva)",
        nextVaccine: "2027-05-10",
        sede: secondSede,
        plan: "Pack Saúde & Desparasitação",
      },
      {
        id: "p4",
        owner: "c4",
        ownerName: "Tutor de exemplo 4",
        name: "Kiko",
        species: "Exótico / Coelho",
        breed: "Coelho Anão",
        microchip: "DEMO-CHIP-04",
        age: "1 ano",
        weight: "1,4 kg",
        vaccines: "Mixomatose + DHV em dia",
        nextVaccine: "2027-04-01",
        sede: primarySede,
        plan: "Acompanhamento Clínico",
      },
    ],
    clients: [
      {
        id: "c1",
        name: "Tutor de exemplo 1",
        nif: "DEMO-NIF-01",
        email: "contacto1@example.invalid",
        phone: "000 000 001",
        concelho: sedes[0]?.name || "Bragança",
        status: "active",
        plan: "Plano Preventivo Anual",
        licenseCode: "ELY-VET-2026-8841",
        balanceEur: 0,
        petsCount: 1,
      },
      {
        id: "c2",
        name: "Tutor de exemplo 2",
        nif: "DEMO-NIF-02",
        email: "contacto2@example.invalid",
        phone: "000 000 002",
        concelho: sedes[0]?.name || "Bragança",
        status: "attention",
        plan: "Cheque Veterinário OMV / Esterilização",
        licenseCode: "OMV-CHQ-2026-4120",
        balanceEur: 45,
        petsCount: 1,
      },
      {
        id: "c3",
        name: "Exploração de exemplo",
        nif: "DEMO-NIF-03",
        email: "contacto3@example.invalid",
        phone: "000 000 003",
        concelho: secondSede,
        status: "active",
        plan: "Protocolo Sanidade & Companhia",
        licenseCode: "ELY-VET-2026-9012",
        balanceEur: 0,
        petsCount: 1,
      },
      {
        id: "c4",
        name: "Tutor de exemplo 4",
        nif: "DEMO-NIF-04",
        email: "contacto4@example.invalid",
        phone: "000 000 004",
        concelho: sedes[0]?.name || "Bragança",
        status: "demo",
        plan: "Avaliação Diagnóstica Online",
        licenseCode: "DEMO-2026-1190",
        balanceEur: 28,
        petsCount: 1,
      },
    ],
    bookings: [
      {
        id: "b1",
        day: "2026-11-19",
        time: "09:30",
        service: serviceNames[0] || "Consulta Médico-Veterinária",
        sede: primarySede,
        petName: "Douro",
        clientName: "Tutor de exemplo 1",
        doctor: cfg.TECHNICAL_DIRECTOR || "Direção Clínica",
        priceEur: 35,
        status: "confirmed",
      },
      {
        id: "b2",
        day: "2026-11-19",
        time: "11:00",
        service: "Vacinação Felina + Desparasitação",
        sede: primarySede,
        petName: "Mimi",
        clientName: "Tutor de exemplo 2",
        doctor: cfg.TECHNICAL_DIRECTOR || "Direção Clínica",
        priceEur: 45,
        status: "requested",
      },
      {
        id: "b3",
        day: "2026-11-19",
        time: "15:00",
        service: "Cirurgia de Esterilização (Protocolo Municipal / OMV)",
        sede: secondSede,
        petName: "Trovão",
        clientName: "Exploração de exemplo",
        doctor: cfg.TECHNICAL_DIRECTOR || "Direção Clínica",
        priceEur: 95,
        status: "in_progress",
      },
      {
        id: "b4",
        day: "2026-11-20",
        time: "10:30",
        service: "Check-up Geral & Identificação SIAC",
        sede: primarySede,
        petName: "Kiko",
        clientName: "Tutor de exemplo 4",
        doctor: cfg.TECHNICAL_DIRECTOR || "Direção Clínica",
        priceEur: 38,
        status: "requested",
      },
    ],
    leads: [
      {
        id: "l1",
        fullName: "Contacto de exemplo 1",
        phone: "000 000 005",
        email: "contacto5@example.invalid",
        petSummary: "Gata esterilização · Cheque Veterinário OMV",
        sede: primarySede,
        score: 94,
        stage: "novo",
        estimatedEur: 85,
        notes: "Preencheu o diagnóstico no site; pretende agendar esterilização esta semana.",
      },
      {
        id: "l2",
        fullName: "Contacto de exemplo 2",
        phone: "000 000 006",
        email: "contacto6@example.invalid",
        petSummary: "Cão Pastor Alemão (Sénior, 9 anos) · Check-up + Articulações",
        sede: secondSede,
        score: 88,
        stage: "triagem",
        estimatedEur: 120,
        notes: "Realizou o Orientador de Sintomas (dificuldade locomotora matinal).",
      },
      {
        id: "l3",
        fullName: "Contacto de exemplo 3",
        phone: "000 000 007",
        email: "contacto7@example.invalid",
        petSummary: "Cachorro Labrador (3 meses) · Primeiras Vacinas + Microchip SIAC",
        sede: primarySede,
        score: 96,
        stage: "agendado",
        estimatedEur: 140,
        notes: "Confirmada 1.ª consulta pediátrica e adesão ao Plano Anual.",
      },
      {
        id: "l4",
        fullName: "Contacto de exemplo 4",
        phone: "000 000 008",
        email: "contacto8@example.invalid",
        petSummary: "2 Cães de Caça · Desparasitação + Vacina Leishmaniose",
        sede: secondSede,
        score: 82,
        stage: "fidelizado",
        estimatedEur: 165,
        notes: "Cliente fidelizado; lembrete automático SMS/WhatsApp ativado.",
      },
    ],
    products: [
      {
        id: "i1",
        name: "Vacina Polivalente Canina + Raiva (Dose)",
        sku: "VAC-PT-01",
        lot: "LT-2609A",
        stock: 4,
        minimum: 8,
        expiry: "2027-04-30",
        category: "Imunológicos DGAV",
        priceEur: 32,
      },
      {
        id: "i2",
        name: "Microchip Transponder ISO + Registo SIAC",
        sku: "SIAC-ISO-15",
        lot: "SC-9921",
        stock: 19,
        minimum: 10,
        expiry: "2029-12-31",
        category: "Identificação Oficial",
        priceEur: 25,
      },
      {
        id: "i3",
        name: "Desparasitante Duplo Espectro (Comprimidos)",
        sku: "MED-DP-04",
        lot: "DP-8812",
        stock: 3,
        minimum: 6,
        expiry: "2027-02-15",
        category: "Medicamentos DGAV",
        priceEur: 18,
      },
      {
        id: "i4",
        name: "Dieta Clínica Renal / Gastrointestinal 3 kg",
        sku: "NUT-RC-09",
        lot: "NT-4410",
        stock: 14,
        minimum: 5,
        expiry: "2027-08-20",
        category: "Nutrição Terapêutica",
        priceEur: 34,
      },
    ],
    records: [
      {
        id: "r1",
        petId: "p1",
        petName: "Douro",
        kind: "Consulta & Vacinação",
        doctor: cfg.TECHNICAL_DIRECTOR || "Direção Clínica",
        sede: primarySede,
        note: "Exame físico sem alterações. Auscultação cardiopulmonar normal, T=38,4ºC. Administrado reforço anual polivalente e desparasitação interna. Registo SIAC verificado.",
        created: "2026-11-10T10:30:00Z",
      },
      {
        id: "r2",
        petId: "p2",
        petName: "Mimi",
        kind: "Triagem Pré-Cirúrgica (Cheque Veterinário OMV)",
        doctor: cfg.TECHNICAL_DIRECTOR || "Direção Clínica",
        sede: primarySede,
        note: "Validado código Cheque Veterinário OMV. Análises bioquímicas pré-anestésicas dentro dos parâmetros de referência. Instruções de jejum de 8h enviadas ao tutor.",
        created: "2026-11-14T16:15:00Z",
      },
      {
        id: "r3",
        petId: "p3",
        petName: "Trovão",
        kind: "Controlo Leishmaniose & Profilaxia",
        doctor: cfg.TECHNICAL_DIRECTOR || "Direção Clínica",
        sede: secondSede,
        note: "Teste rápido Leishmania negativo. Aplicada pipeta ectoparasiticida de longa duração e programado reforço vacinal.",
        created: "2026-11-16T11:45:00Z",
      },
    ],
    inquiries: [
      {
        id: "q1",
        name: "Contacto de exemplo 1",
        phone: "000 000 005",
        email: "contacto5@example.invalid",
        pet_name: "Luna (Gata, 11 meses)",
        topic: "Esterilização / Protocolo Municipal",
        sede: primarySede,
        message: "Bom dia, gostaria de saber os requisitos de jejum e vagas disponíveis para esterilização ao abrigo do apoio municipal.",
        created: "2026-11-18T09:20:00Z",
        unread: true,
      },
      {
        id: "q2",
        name: "Contacto de exemplo 2",
        phone: "000 000 006",
        email: "contacto6@example.invalid",
        pet_name: "Rex (Pastor Alemão, 9 anos)",
        topic: "Orientador de Sintomas · Mobilidade",
        sede: secondSede,
        message: "Usei o orientador online porque o Rex tem dificuldade em levantar-se de manhã. Têm vaga para avaliação articular quinta ou sexta-feira?",
        created: "2026-11-18T11:05:00Z",
        unread: true,
      },
    ],
    submissions: [
      {
        id: "s1",
        clientId: "c2",
        clientName: "Tutor de exemplo 2",
        petName: "Mimi",
        method: "MB WAY (000 000 002)",
        reference: "MBWAY-994812",
        amountEur: 45,
        concept: "Vacinação Felina + Desparasitação",
        submittedAt: "2026-11-18 10:15",
        status: "pending",
      },
      {
        id: "s2",
        clientId: "c4",
        clientName: "Tutor de exemplo 4",
        petName: "Kiko",
        method: "Transferência Multibanco / IBAN",
        reference: "TRANSFERÊNCIA-DEMO",
        amountEur: 28,
        concept: "Sinal de Reserva · Check-up Exóticos",
        submittedAt: "2026-11-18 14:40",
        status: "pending",
      },
      {
        id: "s3",
        clientId: "c1",
        clientName: "Tutor de exemplo 1",
        petName: "Douro",
        method: "MB WAY",
        reference: "MBWAY-882104",
        amountEur: 120,
        concept: "Anuidade Plano Preventivo de Saúde",
        submittedAt: "2026-11-12 17:20",
        status: "approved",
      },
    ],
  };
}

const QUICK_REPLIES_INIT = [
  {
    code: "vacinas",
    category: "Prevenção & Vacinas",
    title: "Lembrete de Reforço Vacinal e Desparasitação",
    text: "Olá {tutor}, recordamos que o reforço anual de vacinação e desparasitação de {animal} se aproxima. Pode confirmar o seu horário preferencial na nossa agenda online ou responder a esta mensagem.",
  },
  {
    code: "jejum",
    category: "Cirurgia & Esterilização",
    title: "Instruções Pré-Cirúrgicas (Jejum Obrigatório)",
    text: "Olá {tutor}, confirmamos a cirurgia de {animal} para {hora}. Recordamos que deverá cumprir jejum alimentar sólido de 8 horas e retirar a água 2 horas antes da admissão na clínica.",
  },
  {
    code: "chequevet",
    category: "Cheque Veterinário OMV",
    title: "Documentação Cheque Veterinário OMV / Esterilização",
    text: "Olá {tutor}, para o atendimento de {animal} ao abrigo do Cheque Veterinário OMV, traga por favor o boletim sanitário, documento de identificação SIAC e o código atribuído.",
  },
  {
    code: "urgencia",
    category: "Triagem & Urgências",
    title: "Orientação Imediata de Sinais de Alarme",
    text: "Olá {tutor}, perante os sinais descritos em {animal}, recomendamos observação presencial prioritária. Estamos a aguardar a sua chegada na clínica; ligue durante o trajeto se necessitar de assistência à entrada.",
  },
  {
    code: "mbway",
    category: "Faturação & MB WAY",
    title: "Envio de Dados de Pagamento MB WAY / Multibanco",
    text: "Olá {tutor}, o valor referente ao atendimento de {animal} pode ser regularizado por MB WAY ou na sua Área Privada do Tutor, com emissão imediata de fatura-recibo com NIF.",
  },
  {
    code: "posoperatorio",
    category: "Acompanhamento Clínico",
    title: "Controlo Pós-Operatório às 24h",
    text: "Olá {tutor}, gostaríamos de saber como passou a noite {animal} após a intervenção. Confirme se já teve apetite, se o penso está limpo e se tomou a medicação prescrita.",
  },
];

const STAGE_META: Record<string, { label: string; tone: "info" | "warn" | "success" | "neutral" | "danger" }> = {
  novo: { label: "Novo Contacto", tone: "warn" },
  triagem: { label: "Em Triagem / Orçamento", tone: "info" },
  agendado: { label: "Consulta Agendada", tone: "info" },
  fidelizado: { label: "Tutor Fidelizado", tone: "success" },
  arquivado: { label: "Arquivado", tone: "neutral" },
};

const BOOKING_STATUS_META: Record<string, { label: string; tone: "warn" | "info" | "success" | "neutral" | "danger"; next?: string; nextLabel?: string }> = {
  requested: { label: "Aguarda confirmação", tone: "warn", next: "confirmed", nextLabel: "Confirmar vaga" },
  confirmed: { label: "Confirmada", tone: "info", next: "in_progress", nextLabel: "Iniciar consulta" },
  in_progress: { label: "Em atendimento", tone: "info", next: "completed", nextLabel: "Concluir ato" },
  completed: { label: "Concluída", tone: "success" },
  cancelled: { label: "Cancelada", tone: "neutral" },
};

function formatEUR(value: number) {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value || 0);
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export default function ClinicApp({ mode = "crm", isDemo = false }: { mode?: "crm" | "portal"; isDemo?: boolean }) {
  const profiles: CrmProfilePreset[] = useMemo(() => {
    if (Array.isArray(cfg.CRM_PROFILES) && cfg.CRM_PROFILES.length > 0) {
      return cfg.CRM_PROFILES;
    }
    return [buildDefaultPreset()];
  }, []);

  const [profileIdx, setProfileIdx] = useState(0);
  const activePreset = profiles[profileIdx] || profiles[0];

  const [role, setRole] = useState<"admin" | "editor" | "client" | "developer">(
    mode === "portal" ? "client" : "admin"
  );
  const [section, setSection] = useState<string>(mode === "portal" ? "mi_plan" : "tablero");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteTerm, setPaletteTerm] = useState("");
  const [dark, setDark] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "info" | "success" | "warn" | "danger"; message: string } | null>(null);

  // State per active clinic preset
  const [pets, setPets] = useState<any[]>(activePreset.pets || []);
  const [clients, setClients] = useState<any[]>(activePreset.clients || []);
  const [bookings, setBookings] = useState<any[]>(activePreset.bookings || []);
  const [leads, setLeads] = useState<any[]>(activePreset.leads || []);
  const [products, setProducts] = useState<any[]>(activePreset.products || []);
  const [records, setRecords] = useState<any[]>(activePreset.records || []);
  const [inquiries, setInquiries] = useState<any[]>(activePreset.inquiries || []);
  const [submissions, setSubmissions] = useState<any[]>(activePreset.submissions || []);
  const [quickReplies, setQuickReplies] = useState<any[]>(QUICK_REPLIES_INIT);

  // Sub-tabs & filters
  const [clientTab, setClientTab] = useState("clientes");
  const [clientFilter, setClientFilter] = useState("all");
  const [clientSearch, setClientSearch] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("all");
  const [agendaTab, setAgendaTab] = useState("semana");
  const [sedeFilter, setSedeFilter] = useState("all");
  const [cobrosTab, setCobrosTab] = useState("comprobantes");
  const [devTab, setDevTab] = useState("overview");
  const [devCollection, setDevCollection] = useState("pets");
  const [pingResult, setPingResult] = useState<{ latency: number; at: string } | null>(null);
  const [replySearch, setReplySearch] = useState("");
  const [selectedInquiryId, setSelectedInquiryId] = useState<string>("q1");
  const [replyDraft, setReplyDraft] = useState("");
  const [modal, setModal] = useState<null | "booking" | "pet" | "client" | "product" | "record" | "license">(null);

  // Sync preset when switching clinic profile
  useEffect(() => {
    setPets(activePreset.pets || []);
    setClients(activePreset.clients || []);
    setBookings(activePreset.bookings || []);
    setLeads(activePreset.leads || []);
    setProducts(activePreset.products || []);
    setRecords(activePreset.records || []);
    setInquiries(activePreset.inquiries || []);
    setSubmissions(activePreset.submissions || []);
    setSedeFilter("all");
    setSelectedInquiryId(activePreset.inquiries?.[0]?.id || "q1");
  }, [activePreset]);

  // Check URL query `?clinica=` on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const clinicaParam = params.get("clinica");
    if (clinicaParam && profiles.length > 1) {
      const idx = profiles.findIndex((p) => p.id.toLowerCase() === clinicaParam.toLowerCase());
      if (idx >= 0) setProfileIdx(idx);
    }
    const savedTheme = localStorage.getItem("theme_mode") === "dark";
    setDark(savedTheme);
    document.documentElement.dataset.theme = savedTheme ? "dark" : "light";
  }, [profiles]);

  // ⌘K shortcut & Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
      if (e.key === "Escape") {
        setSidebarOpen(false);
        setPaletteOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("theme_mode", next ? "dark" : "light");
  }

  function switchRole(nextRole: "admin" | "editor" | "client" | "developer") {
    setRole(nextRole);
    if (nextRole === "developer") {
      setSection("dev");
    } else if (nextRole === "client") {
      setSection("mi_plan");
    } else if (role === "client" || section === "dev" || (nextRole === "editor" && ["reportes", "configuracion"].includes(section))) {
      setSection("tablero");
    }
  }

  // Counts & alert badges (Pura Vida Pets convention: alert=true pulses red; alert=false is neutral inventory count)
  const counts = useMemo(() => {
    const pendingBookings = bookings.filter((b) => b.status === "requested").length;
    const unreadInquiries = inquiries.filter((q) => q.unread).length;
    const pendingSubmissions = submissions.filter((s) => s.status === "pending").length;
    const lowStock = products.filter((p) => p.stock <= p.minimum).length;
    const attentionClients = clients.filter((c) => c.status === "attention" || c.balanceEur > 0).length;
    const openLeads = leads.filter((l) => l.stage !== "fidelizado" && l.stage !== "arquivado").length;
    return {
      pendingBookings,
      unreadInquiries,
      pendingSubmissions,
      lowStock,
      attentionClients,
      openLeads,
      totalPets: pets.length,
      totalClients: clients.length,
      totalBookings: bookings.length,
      totalReplies: quickReplies.length,
    };
  }, [bookings, inquiries, submissions, products, clients, leads, pets, quickReplies]);

  const crmNavGroups = useMemo(() => {
    if (role === "client") {
      return [
        {
          group: "A MINHA CLÍNICA",
          items: [
            { id: "mi_plan", label: "O Meu Plano & Saúde", icon: ShieldCheck },
            { id: "mis_mascotas", label: "Os Meus Animais (SIAC)", icon: PawPrint, badge: pets.slice(0, 2).length },
            { id: "agendar", label: "Marcar Consulta / Serviço", icon: CalendarDays },
            { id: "mis_citas", label: "As Minhas Marcações", icon: CalendarClock, badge: bookings.length, live: true },
          ],
        },
        {
          group: "CONTA & PRIVACIDADE RGPD",
          items: [
            { id: "pagos", label: "Faturas & MB WAY", icon: Receipt, badge: counts.pendingSubmissions, alert: counts.pendingSubmissions > 0 },
            { id: "mensajes", label: "Mensagens com a Equipa", icon: MessageSquare, badge: 1, alert: true },
            { id: "perfil", label: "O Meu Perfil & RGPD", icon: User },
          ],
        },
      ];
    }

    const groups = [
      {
        group: "CRM & CLÍNICA",
        items: [
          {
            id: "tablero",
            label: "Quadro de Operações",
            icon: LayoutDashboard,
            badge: counts.pendingBookings + counts.lowStock + counts.pendingSubmissions,
            alert: counts.pendingBookings + counts.lowStock + counts.pendingSubmissions > 0,
          },
          {
            id: "pipeline",
            label: "Funil & Triagem",
            icon: PieChart,
            badge: counts.openLeads,
            alert: leads.some((l) => l.stage === "novo"),
          },
          {
            id: "clientes",
            label: "Tutores & Planos OMV",
            icon: Users,
            badge: counts.attentionClients || counts.totalClients,
            alert: counts.attentionClients > 0,
          },
          {
            id: "pacientes",
            label: "Pacientes & SIAC",
            icon: PawPrint,
            badge: counts.totalPets,
            alert: false,
          },
          {
            id: "agenda",
            label: "Agenda Multi-Sede",
            icon: CalendarClock,
            badge: counts.pendingBookings || counts.totalBookings,
            alert: counts.pendingBookings > 0,
          },
        ],
      },
      {
        group: "OPERAÇÕES & FATURAÇÃO",
        items: [
          {
            id: "mensajes",
            label: "Mensagens & WhatsApp",
            icon: MessageSquare,
            badge: counts.unreadInquiries,
            alert: counts.unreadInquiries > 0,
          },
          {
            id: "respuestas",
            label: "Respostas Rápidas (#)",
            icon: MessageSquareQuote,
            badge: counts.totalReplies,
            alert: false,
          },
          {
            id: "cobros",
            label: "Cobranças & MB WAY",
            icon: Wallet,
            badge: counts.pendingSubmissions,
            alert: counts.pendingSubmissions > 0,
          },
          {
            id: "inventario",
            label: "Stock & Farmácia DGAV",
            icon: Boxes,
            badge: counts.lowStock || products.length,
            alert: counts.lowStock > 0,
          },
          {
            id: "expedientes",
            label: "Histórico Clínico",
            icon: ClipboardPlus,
            badge: records.length,
            alert: false,
          },
          ...(role === "admin" || role === "developer"
            ? [
                { id: "reportes", label: "Relatórios & Métricas", icon: ClipboardList },
                { id: "configuracion", label: "Configuração & RGPD", icon: Settings },
              ]
            : []),
        ],
      },
    ];

    if (role === "developer") {
      groups.push({
        group: "ENGENHARIA ELYSIUM",
          items: [{ id: "dev", label: "Dev Studio & D1", icon: Terminal }],
      });
    }
    return groups;
  }, [role, counts, pets.length, bookings.length, leads, products.length, records.length]);

  const flatNavItems = useMemo(() => crmNavGroups.flatMap((g) => g.items), [crmNavGroups]);
  const activeNavItem = flatNavItems.find((i) => i.id === section) || flatNavItems[0];

  const todayStr = useMemo(
    () =>
      new Intl.DateTimeFormat("pt-PT", {
        timeZone: "Europe/Lisbon",
        dateStyle: "full",
      }).format(new Date()),
    []
  );

  // Command Palette (⌘K) search results
  const paletteResults = useMemo(() => {
    const q = paletteTerm.trim().toLowerCase();
    const baseSections = flatNavItems.map((item) => ({
      kind: "Secção",
      label: item.label,
      hint: activePreset.shortName,
      action: () => setSection(item.id),
    }));
    if (!q) return baseSections;
    const match = (v?: string) => String(v || "").toLowerCase().includes(q);
    return [
      ...quickReplies
        .filter((r) => match("#" + r.code) || match(r.title) || match(r.text))
        .map((r) => ({
          kind: "Resposta Rápida",
          label: `#${r.code} · ${r.title}`,
          hint: r.category,
          action: () => {
            setReplySearch(r.code);
            setSection("respuestas");
          },
        })),
      ...pets
        .filter((p) => match(p.name) || match(p.microchip) || match(p.breed) || match(p.ownerName))
        .map((p) => ({
          kind: "Paciente SIAC",
          label: `${p.name} (${p.species} · ${p.breed})`,
          hint: `SIAC ${p.microchip} · Tutor: ${p.ownerName}`,
          action: () => setSection("pacientes"),
        })),
      ...clients
        .filter((c) => match(c.name) || match(c.nif) || match(c.email) || match(c.phone))
        .map((c) => ({
          kind: "Tutor",
          label: c.name,
          hint: `NIF ${c.nif} · ${c.phone}`,
          action: () => setSection("clientes"),
        })),
      ...baseSections.filter((s) => match(s.label)),
    ].slice(0, 16);
  }, [paletteTerm, flatNavItems, activePreset.shortName, quickReplies, pets, clients]);

  // Handlers for interactive actions
  function advanceBooking(bookingId: string) {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId) return b;
        const nextStatus = BOOKING_STATUS_META[b.status]?.next || "completed";
        setFeedback({
          tone: "success",
          message: `Marcação de ${b.petName} (${b.clientName}) atualizada para «${BOOKING_STATUS_META[nextStatus]?.label || nextStatus}».`,
        });
        return { ...b, status: nextStatus };
      })
    );
  }

  function moveLeadStage(leadId: string, nextStage: string) {
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, stage: nextStage } : l)));
    setFeedback({
      tone: "info",
      message: `Oportunidade comercial movida para a etapa «${STAGE_META[nextStage]?.label || nextStage}».`,
    });
  }

  function decideSubmission(subId: string, decision: "approved" | "rejected") {
    setSubmissions((prev) => prev.map((s) => (s.id === subId ? { ...s, status: decision } : s)));
    setFeedback({
      tone: decision === "approved" ? "success" : "warn",
      message:
        decision === "approved"
          ? "Comprovativo MB WAY / Multibanco validado e imputado à ficha do tutor."
          : "Comprovativo marcado para revisão com o tutor.",
    });
  }

  function handleModalSubmit(e: React.FormEvent<HTMLFormElement>, portalBooking = false) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const entries = Object.fromEntries(fd.entries()) as Record<string, string>;

    if (modal === "booking" || portalBooking) {
      const petObj = pets.find((p) => p.id === entries.petId) || pets[0];
      const newB = {
        id: "b" + (bookings.length + 1),
        day: entries.day || "2026-11-21",
        time: entries.time || "10:00",
        service: entries.service || activePreset.services[0],
        sede: entries.sede || activePreset.sedes[0]?.name,
        petName: petObj?.name || entries.petName || "Paciente",
        clientName: petObj?.ownerName || "Tutor Registado",
        doctor: activePreset.director,
        priceEur: Number(entries.priceEur || 38),
        status: portalBooking ? "requested" : "confirmed",
      };
      setBookings((prev) => [newB, ...prev]);
      setFeedback({ tone: "success", message: portalBooking ? "Pedido registado na demonstração. Aguarda confirmação." : `Nova marcação agendada para ${newB.petName} em ${newB.sede} (${newB.day} às ${newB.time}).` });
      if (portalBooking) setSection("mis_citas");
    } else if (modal === "pet") {
      const ownerObj = clients.find((c) => c.id === entries.owner) || clients[0];
      const newP = {
        id: "p" + (pets.length + 1),
        owner: ownerObj?.id || "c1",
        ownerName: ownerObj?.name || "Tutor",
        name: entries.name,
        species: entries.species || "Cão",
        breed: entries.breed || "SRD / Indefinida",
        microchip: entries.microchip || "DEMO-CHIP-05",
        age: entries.age || "1 ano",
        weight: entries.weight || "12,0 kg",
        vaccines: "Em dia",
        nextVaccine: "2027-11-18",
        sede: entries.sede || activePreset.sedes[0]?.name,
        plan: "Plano Preventivo",
      };
      setPets((prev) => [newP, ...prev]);
      setFeedback({ tone: "success", message: `Paciente ${newP.name} (SIAC ${newP.microchip}) registado com sucesso.` });
    } else if (modal === "client") {
      const newC = {
        id: "c" + (clients.length + 1),
        name: entries.name,
        nif: entries.nif || "250 000 000",
        email: entries.email,
        phone: entries.phone,
        concelho: entries.concelho || activePreset.city,
        status: "active",
        plan: entries.plan || "Plano Preventivo Anual",
        licenseCode: `ELY-VET-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        balanceEur: 0,
        petsCount: 1,
      };
      setClients((prev) => [newC, ...prev]);
      setFeedback({ tone: "success", message: `Ficha de tutor criada para ${newC.name} com consentimento RGPD.` });
    } else if (modal === "product") {
      const newProd = {
        id: "i" + (products.length + 1),
        name: entries.name,
        sku: entries.sku || "VET-PT",
        lot: entries.lot || "LT-2026",
        stock: Number(entries.stock || 12),
        minimum: Number(entries.minimum || 5),
        expiry: entries.expiry || "2027-12-31",
        category: entries.category || "Medicamentos DGAV",
        priceEur: Number(entries.priceEur || 24),
      };
      setProducts((prev) => [newProd, ...prev]);
      setFeedback({ tone: "success", message: `Lote ${newProd.lot} (${newProd.name}) adicionado ao inventário DGAV.` });
    } else if (modal === "record") {
      const petObj = pets.find((p) => p.id === entries.petId) || pets[0];
      const newRec = {
        id: "r" + (records.length + 1),
        petId: petObj?.id || "p1",
        petName: petObj?.name || "Paciente",
        kind: entries.kind || "Consulta Clínica",
        doctor: activePreset.director,
        sede: entries.sede || activePreset.sedes[0]?.name,
        note: entries.note,
        created: new Date().toISOString(),
      };
      setRecords((prev) => [newRec, ...prev]);
      setFeedback({ tone: "success", message: `Nota clínica adicionada ao boletim de ${newRec.petName}.` });
    } else if (modal === "license") {
      const code = `OMV-CHQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      setFeedback({
        tone: "success",
        message: `Licença / Código de Plano «${code}» emitido para ${entries.holder || "Tutor"}.`,
      });
    }
    setModal(null);
  }

  function exportCsvReport() {
    const headers = ["ID,Data,Hora,Paciente,Tutor,Servico,Sede,Valor_EUR,Estado"];
    const rows = bookings.map(
      (b) => `${b.id},${b.day},${b.time},"${b.petName}","${b.clientName}","${b.service}","${b.sede}",${b.priceEur},${b.status}`
    );
    const blob = new Blob([headers.concat(rows).join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `relatorio-${activePreset.id}-2026.csv`;
    a.click();
    setFeedback({ tone: "success", message: "Relatório operacional exportado em formato CSV (UTF-8)." });
  }

  return (
    <div className="crm-shell">
      {/* Cabecera móvil idéntica a Pura Vida Pets */}
      <header className="crm-mobile-header">
        <button
          type="button"
          className="crm-icon-button"
          onClick={() => setSidebarOpen((o) => !o)}
          aria-expanded={sidebarOpen}
          aria-controls="crm-sidebar"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <span className="crm-mobile-title">
          <PawPrint size={17} /> {activeNavItem?.label || activePreset.shortName}
        </span>
        <button type="button" className="crm-icon-button" onClick={() => setPaletteOpen(true)} aria-label="Pesquisar">
          <Search size={18} />
        </button>
      </header>

      {sidebarOpen && (
        <button
          type="button"
          className="crm-scrim"
          aria-label="Fechar menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Barra lateral replicada de Pura Vida Pets */}
      <aside id="crm-sidebar" className={`crm-sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="crm-brand">
          <span className="crm-brand-mark" aria-hidden="true">
            <PawPrint size={18} />
          </span>
          <div className="crm-brand-text">
            <strong>{activePreset.shortName}</strong>
            <small>{activePreset.dgav}</small>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSection(role === "client" ? "perfil" : "configuracion")}
          className={`crm-user-card crm-user-card--clickable ${role === "developer" ? "crm-user-card--developer" : ""}`}
        >
          <span className={`crm-avatar ${role === "developer" ? "crm-avatar--developer" : ""}`} aria-hidden="true">
            {role === "client" ? "A" : activePreset.director.replace(/^Dr\.?\s*|^Dra\.?\s*/i, "").slice(0, 1) || "D"}
          </span>
          <span className="crm-user-meta">
            <strong>{role === "client" ? "Tutor de exemplo 1" : activePreset.director}</strong>
            <small>
              {role === "developer"
                ? "Engenharia · Dev Studio"
                : role === "admin"
                ? "Direção Clínica · OMV"
                : role === "editor"
                ? "Equipa / Receção em Turno"
                : "Tutora · Área Reservada"}
            </small>
          </span>
          <Settings size={15} className="crm-user-card-icon" aria-hidden="true" />
        </button>

        {/* Conmutador rápido de Perfil / Rol para demonstração */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 4,
            padding: "4px",
            marginBottom: 10,
            borderRadius: 10,
            background: "rgba(255,255,255,0.06)",
          }}
          role="group"
          aria-label="Alternar vista do sistema"
        >
          {[
            ["admin", "Direção CRM"],
            ["editor", "Receção"],
            ["client", "Portal Tutor"],
            ["developer", "Dev Studio"],
          ].map(([rId, rLabel]) => (
            <button
              key={rId}
              type="button"
              onClick={() => switchRole(rId as any)}
              style={{
                border: 0,
                borderRadius: 7,
                padding: "5px 6px",
                fontSize: "11px",
                fontWeight: role === rId ? 700 : 500,
                background: role === rId ? "var(--crm-accent-fill)" : "transparent",
                color: role === rId ? "#fff" : "var(--crm-sidebar-muted)",
                cursor: "pointer",
              }}
            >
              {rLabel}
            </button>
          ))}
        </div>

        <nav className="crm-nav" aria-label="Navegação principal do sistema">
          {crmNavGroups.filter((group) => group.group !== "ENGENHARIA ELYSIUM").map((group) => (
            <div key={group.group} className="crm-nav-group">
              <p className="crm-nav-label">{group.group}</p>
              {group.items.map((item: any) => {
                const Icon = item.icon;
                const isActive = section === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSection(item.id);
                      setSidebarOpen(false);
                    }}
                    aria-current={isActive ? "page" : undefined}
                    className={`crm-nav-item portal-nav-item ${isActive ? "is-active" : ""}`}
                  >
                    <Icon size={17} aria-hidden="true" />
                    <span className="crm-nav-text">{item.label}</span>
                    {item.live && <span className="portal-live-dot" aria-hidden="true" />}
                    {item.badge ? (
                      <span className={`crm-nav-badge ${item.alert ? "is-alert" : ""}`}>
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="crm-sidebar-footer">
          {role === "developer" && (
            <button
              type="button"
              className={`crm-ghost-button ${section === "dev" ? "is-active" : ""}`}
              aria-current={section === "dev" ? "page" : undefined}
              onClick={() => {
                setSection("dev");
                setSidebarOpen(false);
              }}
            >
              <Terminal size={16} aria-hidden="true" />
              <span>Dev Studio &amp; D1</span>
            </button>
          )}
          <button type="button" className="crm-ghost-button" onClick={toggleTheme}>
            {dark ? <Sun size={16} /> : <Moon size={16} />}
            <span>{dark ? "Modo Claro" : "Modo Escuro"}</span>
          </button>
          <a href={url("/")} className="crm-ghost-button">
            <Home size={16} />
            <span>Voltar ao site público</span>
          </a>
          {!isDemo && (
            <a href={chatGPTSignOutPath("/")} className="crm-ghost-button crm-ghost-button--danger">
              <LogOut size={16} />
              <span>Terminar sessão</span>
            </a>
          )}
        </div>
      </aside>

      {/* Marco principal con Barra de Comandos y Lienzo */}
      <div className="crm-main">
        <div className="crm-command-bar">
          <div className="crm-command-context">
            <span>{activePreset.shortName}</span>
            <span aria-hidden="true">/</span>
            <strong>{activeNavItem?.label}</strong>
            <span className="crm-chip is-info" style={{ marginLeft: 6 }}>
              {todayStr}
            </span>
          </div>

          {/* Seletor de Clínica quando o protótipo agrupa 2 clínicas (ex.: Nuno Morais + Alfavet ou Dr. 4 Patas + Mogadouro) */}
          {profiles.length > 1 && (
            <div style={{ display: "inline-flex", gap: 6, alignItems: "center", marginLeft: "auto" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--crm-muted)" }}>UNIDADE:</span>
              {profiles.map((prof, idx) => (
                <button
                  key={prof.id}
                  type="button"
                  onClick={() => setProfileIdx(idx)}
                  className={`crm-chip ${profileIdx === idx ? "is-success" : "is-neutral"}`}
                  style={{ cursor: "pointer", border: profileIdx === idx ? "1px solid var(--crm-success)" : "1px solid transparent" }}
                >
                  <Building2 size={12} /> {prof.shortName} ({prof.city})
                </button>
              ))}
            </div>
          )}

          {role === "client" ? (
            <span className="portal-command-meter" style={{ marginLeft: profiles.length > 1 ? 8 : "auto" }}>
              Plano Preventivo Ativo · <strong>2 check-ups disponíveis</strong>
            </span>
          ) : (
            <button
              type="button"
              className="crm-command-search"
              style={{ marginLeft: profiles.length > 1 ? 8 : "auto" }}
              onClick={() => setPaletteOpen(true)}
            >
              <Search size={14} />
              <span>Pesquisar tutor, microchip SIAC ou #resposta…</span>
              <kbd>⌘K</kbd>
            </button>
          )}
        </div>

        <main className="crm-canvas" tabIndex={-1}>
          {isDemo && <div><Chip tone="warn">Demonstração · Dados de exemplo</Chip></div>}
          {feedback && <Feedback feedback={feedback} onDismiss={() => setFeedback(null)} />}

          {/* =================================================================
              MODO PORTAL DO TUTOR (ÁREA PRIVADA DE CLIENTE)
             ================================================================= */}
          {role === "client" && (
            <>
              {section === "mi_plan" && (
                <>
                  <SectionHeader
                    eyebrow={`ÁREA RESERVADA DO TUTOR · ${activePreset.shortName.toUpperCase()}`}
                    title="O Meu Plano de Saúde & Pacotes"
                    description="Acompanhe as consultas preventivas incluídas, o calendário de vacinação SIAC e os benefícios ativos para os seus animais."
                    actions={
                      <Button variant="primary" onClick={() => setSection("agendar")}>
                        <CalendarDays size={15} /> Marcar Consulta Online
                      </Button>
                    }
                  />
                  <KpiGrid>
                    <Kpi label="Plano Subscrito" value="Preventivo Anual" hint="Renovação automática: Nov 2027" tone="success" />
                    <Kpi label="Consultas Incluídas" value="2 / 2" hint="Disponíveis para utilização" />
                    <Kpi label="Vacinação SIAC" value="Em dia" hint="Próximo reforço: Março 2027" tone="success" />
                    <Kpi label="Saldo em Conta" value={formatEUR(0)} hint="Sem valores pendentes" />
                  </KpiGrid>
                  <div className="crm-two-columns">
                    <Panel
                      title="Coberturas do Plano & Cheque Veterinário"
                      subtitle={`Válido em: ${activePreset.sedes.map((s) => s.name).join(" · ")}`}
                    >
                      <ul style={{ display: "grid", gap: 10, padding: 0, margin: 0, listStyle: "none" }}>
                        <li style={{ display: "flex", justifyContent: "space-between", paddingBottom: 8, borderBottom: "1px solid var(--crm-border)" }}>
                          <span><CheckCircle2 size={15} style={{ verticalAlign: "middle", marginRight: 6 }} /> Consulta Anual + Vacina Polivalente</span>
                          <Chip tone="success">Incluído</Chip>
                        </li>
                        <li style={{ display: "flex", justifyContent: "space-between", paddingBottom: 8, borderBottom: "1px solid var(--crm-border)" }}>
                          <span><CheckCircle2 size={15} style={{ verticalAlign: "middle", marginRight: 6 }} /> Desparasitação Interna e Externa Trimestral</span>
                          <Chip tone="success">Incluído</Chip>
                        </li>
                        <li style={{ display: "flex", justifyContent: "space-between", paddingBottom: 8, borderBottom: "1px solid var(--crm-border)" }}>
                          <span><CheckCircle2 size={15} style={{ verticalAlign: "middle", marginRight: 6 }} /> Desconto em Cirurgia, Análises, Banhos ou Hotel</span>
                          <Chip tone="info">-15% Direto</Chip>
                        </li>
                      </ul>
                    </Panel>
                    <Panel title="Próxima Visita Recomendada" subtitle="Lembretes automáticos por SMS/WhatsApp e e-mail">
                      <p style={{ margin: "0 0 12px" }}>
                        <strong>{pets[0]?.name || "Douro"}</strong> ({pets[0]?.species} · {pets[0]?.breed}) tem o boletim sanitário atualizado.
                      </p>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Button variant="primary" onClick={() => setSection("agendar")}>Agendar Visita</Button>
                        <Button variant="secondary" onClick={() => setSection("mis_mascotas")}>Ver Boletim SIAC</Button>
                      </div>
                    </Panel>
                  </div>
                </>
              )}

              {section === "mis_mascotas" && (
                <>
                  <SectionHeader
                    eyebrow="BOLETIM SANITÁRIO DIGITAL & SIAC"
                    title="Os Meus Animais"
                    description="Identificação eletrónica oficial, peso, histórico de vacinação e relatórios partilhados pelo médico veterinário."
                    actions={
                      <Button variant="primary" onClick={() => setModal("pet")}>
                        <Plus size={15} /> Registar Animal
                      </Button>
                    }
                  />
                  <div className="crm-two-columns">
                    {pets.map((p) => (
                      <Panel
                        key={p.id}
                        title={`${p.name} · ${p.species} (${p.breed})`}
                        subtitle={`Microchip SIAC: ${p.microchip} · Sede: ${p.sede}`}
                        actions={<Chip tone={p.vaccines.includes("Pendente") ? "warn" : "success"}>{p.vaccines}</Chip>}
                      >
                        <p style={{ margin: "0 0 10px", fontSize: 13 }}>
                          <strong>Idade:</strong> {p.age} &nbsp;|&nbsp; <strong>Peso:</strong> {p.weight} &nbsp;|&nbsp;{" "}
                          <strong>Próximo reforço:</strong> {p.nextVaccine}
                        </p>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <Button variant="secondary" onClick={() => setSection("agendar")}>
                            Marcar Consulta para {p.name}
                          </Button>
                        </div>
                      </Panel>
                    ))}
                  </div>
                </>
              )}

              {section === "agendar" && (
                <>
                  <SectionHeader
                    eyebrow="MARCAÇÃO DIRETA SEM CHAMADAS"
                    title="Agendar Consulta ou Serviço"
                    description={`Escolha o animal, a unidade (${activePreset.sedes.map((s) => s.name).join(" / ")}), a data e o horário pretendido.`}
                  />
                  <Panel title="Nova Marcação" subtitle="Fuso horário: Europe/Lisbon (Portugal Continental)">
                    <form onSubmit={(event) => handleModalSubmit(event, true)} style={{ display: "grid", gap: 14, maxWidth: 560 }}>
                      <Field label="Animal / Paciente">
                        <select name="petId" defaultValue={pets[0]?.id}>
                          {pets.map((p) => (
                            <option key={p.id} value={p.id}>{p.name} ({p.species} · SIAC {p.microchip})</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Unidade / Sede Clínica">
                        <select name="sede" defaultValue={activePreset.sedes[0]?.name}>
                          {activePreset.sedes.map((s) => (
                            <option key={s.id} value={s.name}>{s.name} — {s.address}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Serviço Pretendido">
                        <select name="service" defaultValue={activePreset.services[0]}>
                          {activePreset.services.map((srv) => (
                            <option key={srv} value={srv}>{srv}</option>
                          ))}
                        </select>
                      </Field>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <Field label="Data">
                          <input name="day" type="date" required />
                        </Field>
                        <Field label="Horário">
                          <select name="time" defaultValue="10:30">
                            <option value="09:30">09:30 (Manhã)</option>
                            <option value="10:30">10:30 (Manhã)</option>
                            <option value="11:30">11:30 (Manhã)</option>
                            <option value="15:00">15:00 (Tarde)</option>
                            <option value="16:30">16:30 (Tarde)</option>
                            <option value="18:00">18:00 (Fim de tarde)</option>
                          </select>
                        </Field>
                      </div>
                      <div>
                        <Button
                          variant="primary"
                          type="submit"
                        >
                          <CalendarDays size={15} /> Pedir Marcação
                        </Button>
                      </div>
                    </form>
                  </Panel>
                </>
              )}

              {section === "mis_citas" && (
                <>
                  <SectionHeader
                    eyebrow="HISTÓRICO E PRÓXIMAS VISITAS"
                    title="As Minhas Marcações"
                    description="Consulte o estado das suas visitas agendadas e recomendações pré-consulta."
                  />
                  <Panel title="Marcações Registadas">
                    <div tabIndex={0} role="region" aria-label="Marcações do tutor" className="crm-table-wrap">
                      <table
                        className="crm-table crm-table-responsive"
                        style={
                          {
                            "--label-2": "'Data / Hora'",
                            "--label-3": "'Serviço'",
                            "--label-4": "'Unidade'",
                            "--label-5": "'Estado'",
                          } as React.CSSProperties
                        }
                      >
                        <thead>
                          <tr>
                            <th>Paciente</th>
                            <th>Data & Hora</th>
                            <th>Serviço</th>
                            <th>Unidade</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bookings.map((b) => (
                            <tr key={b.id}>
                              <th scope="row">{b.petName}</th>
                              <td>{b.day} · {b.time}</td>
                              <td>{b.service}</td>
                              <td>{b.sede}</td>
                              <td>
                                <Chip tone={BOOKING_STATUS_META[b.status]?.tone || "info"}>
                                  {BOOKING_STATUS_META[b.status]?.label || b.status}
                                </Chip>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Panel>
                </>
              )}

              {section === "pagos" && (
                <>
                  <SectionHeader
                    eyebrow="PAGAMENTOS DIGITAIS & FATURAÇÃO AT"
                    title="Pagamentos & Comprovativos MB WAY"
                    description="Regularize consultas, planos de saúde ou pacotes de sessões de forma imediata."
                  />
                  <div className="crm-two-columns">
                    <Panel title="Dados para Pagamento Direto" subtitle={activePreset.brandName}>
                      <p style={{ margin: "0 0 8px" }}>
                        <strong>MB WAY Clínica:</strong> {activePreset.phone}
                      </p>
                      <p style={{ margin: "0 0 12px" }}>
                        <strong>Entidade / Referência Multibanco:</strong> Gerada automaticamente na confirmação da consulta.
                      </p>
                      <Button
                        variant="primary"
                        onClick={() =>
                          setFeedback({
                            tone: "success",
                            message: "Notificação de comprovativo MB WAY enviada para validação da receção.",
                          })
                        }
                      >
                        <FileCheck2 size={15} /> Submeter Comprovativo MB WAY
                      </Button>
                    </Panel>
                    <Panel title="Histórico de Recibos" subtitle="Emitidos com NIF para dedução de despesas veterinárias em IRS">
                      {submissions.map((s) => (
                        <div key={s.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--crm-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <strong>{s.concept}</strong>
                            <span className="crm-cell-sub">{s.method} · {s.submittedAt}</span>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <strong>{formatEUR(s.amountEur)}</strong>
                            <div>
                              <Chip tone={s.status === "approved" ? "success" : "warn"}>
                                {s.status === "approved" ? "Liquidado" : "Em validação"}
                              </Chip>
                            </div>
                          </div>
                        </div>
                      ))}
                    </Panel>
                  </div>
                </>
              )}

              {section === "mensajes" && (
                <>
                  <SectionHeader
                    eyebrow="CANAL DIRETO COM A EQUIPA"
                    title="Mensagens Clínicas"
                    description="Esclareça dúvidas pós-consulta ou envie fotografias de evolução clínica."
                  />
                  <Panel title={`Conversa com ${activePreset.shortName}`} subtitle={activePreset.director}>
                    <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
                      <div style={{ padding: 12, borderRadius: 12, background: "var(--crm-surface-alt)" }}>
                        <strong>{activePreset.director}</strong> <small className="crm-muted">· Hoje, 09:15</small>
                        <p style={{ margin: "4px 0 0" }}>
                          Bom dia! O boletim sanitário e o registo SIAC encontram-se atualizados. Caso note alguma reação local no ponto da vacina, informe-nos por aqui.
                        </p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        type="text"
                        value={replyDraft}
                        onChange={(e) => setReplyDraft(e.target.value)}
                        placeholder="Escreva a sua mensagem para a clínica…"
                        style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: "1px solid var(--crm-border)" }}
                      />
                      <Button
                        variant="primary"
                        onClick={() => {
                          if (!replyDraft.trim()) return;
                          setReplyDraft("");
                          setFeedback({ tone: "success", message: isDemo ? "Envio simulado." : "Mensagem entregue na caixa de entrada do CRM da clínica." });
                        }}
                      >
                        Enviar
                      </Button>
                    </div>
                  </Panel>
                </>
              )}

              {section === "perfil" && (
                <>
                  <SectionHeader
                    eyebrow="PROTEÇÃO DE DADOS · LEI N.º 58/2019 (CNPD)"
                    title="O Meu Perfil & Privacidade RGPD"
                    description="Faça a gestão dos seus dados fiscais (NIF), contactos de emergência e consentimentos de notificações clínicas."
                  />
                  <Panel title="Dados do Titular" subtitle="Faturação veterinária dedutível em sede de IRS (e-Fatura)">
                    <p><strong>Nome:</strong> Tutor de exemplo 1</p>
                    <p><strong>NIF:</strong> DEMO-NIF-01</p>
                    <p><strong>Telefone / WhatsApp:</strong> 000 000 001</p>
                    <p><strong>Consentimento RGPD:</strong> Ativo (Lembretes clínicos de vacinação e envio encriptado de análises).</p>
                  </Panel>
                </>
              )}
            </>
          )}

          {/* =================================================================
              MODO CRM ADMINISTRADOR / EQUIPA / DEV STUDIO
             ================================================================= */}
          {role !== "client" && (
            <>
              {/* 1. QUADRO DE OPERAÇÕES (TABLERO) */}
              {section === "tablero" && (
                <>
                  <SectionHeader
                    eyebrow={`${activePreset.brandName.toUpperCase()} · ${activePreset.dgav}`}
                    title="Quadro de Operações"
                    description={`Direção Clínica: ${activePreset.director} · Unidades ativas: ${activePreset.sedes.map((s) => s.name).join(" + ")}`}
                    actions={
                      <>
                        <Button variant="secondary" onClick={() => setModal("pet")}>
                          <PawPrint size={15} /> Novo Paciente SIAC
                        </Button>
                        <Button variant="primary" onClick={() => setModal("booking")}>
                          <Plus size={15} /> Nova Marcação
                        </Button>
                      </>
                    }
                  />

                  {/* Bloque prioritario «Requer a sua atenção» idéntico en filosofía a Tablero.jsx de Pura Vida Pets */}
                  {(counts.pendingBookings > 0 || counts.pendingSubmissions > 0 || counts.lowStock > 0 || counts.unreadInquiries > 0) && (
                    <Panel
                      className="crm-panel--highlight"
                      title="Requer a sua atenção hoje"
                      subtitle="Prioridades operacionais detetadas em tempo real antes das métricas gerais."
                    >
                      <div style={{ display: "grid", gap: 10 }}>
                        {counts.pendingBookings > 0 && (
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "8px 12px", borderRadius: 10, background: "var(--crm-warn-soft)" }}>
                            <span>
                              <AlertTriangle size={15} style={{ verticalAlign: "middle", marginRight: 8, color: "var(--crm-warn)" }} />
                              <strong>{pluralize(counts.pendingBookings, "marcação pedida online", "marcações pedidas online")}</strong> {counts.pendingBookings === 1 ? "aguarda" : "aguardam"} confirmação de horário.
                            </span>
                            <Button variant="secondary" onClick={() => setSection("agenda")}>
                              Rever Agenda <ChevronRight size={14} />
                            </Button>
                          </div>
                        )}
                        {counts.pendingSubmissions > 0 && (
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "8px 12px", borderRadius: 10, background: "var(--crm-info-soft)" }}>
                            <span>
                              <Wallet size={15} style={{ verticalAlign: "middle", marginRight: 8, color: "var(--crm-info)" }} />
                              <strong>{pluralize(counts.pendingSubmissions, "comprovativo MB WAY / IBAN", "comprovativos MB WAY / IBAN")}</strong> por validar.
                            </span>
                            <Button variant="secondary" onClick={() => setSection("cobros")}>
                              Validar Cobranças <ChevronRight size={14} />
                            </Button>
                          </div>
                        )}
                        {counts.lowStock > 0 && (
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "8px 12px", borderRadius: 10, background: "var(--crm-danger-soft)" }}>
                            <span>
                              <Boxes size={15} style={{ verticalAlign: "middle", marginRight: 8, color: "var(--crm-danger)" }} />
                              <strong>{pluralize(counts.lowStock, "lote de farmácia / vacina DGAV", "lotes de farmácia / vacinas DGAV")}</strong> abaixo do stock mínimo de segurança.
                            </span>
                            <Button variant="secondary" onClick={() => setSection("inventario")}>
                              Ver Inventário DGAV <ChevronRight size={14} />
                            </Button>
                          </div>
                        )}
                        {counts.unreadInquiries > 0 && (
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "8px 12px", borderRadius: 10, background: "var(--crm-surface-alt)" }}>
                            <span>
                              <Mail size={15} style={{ verticalAlign: "middle", marginRight: 8 }} />
                              <strong>{pluralize(counts.unreadInquiries, "mensagem do site / Orientador de Sintomas", "mensagens do site / Orientador de Sintomas")}</strong> sem resposta.
                            </span>
                            <Button variant="secondary" onClick={() => setSection("mensajes")}>
                              Responder <ChevronRight size={14} />
                            </Button>
                          </div>
                        )}
                      </div>
                    </Panel>
                  )}

                  <KpiGrid>
                    <Kpi label="Marcações na Agenda" value={bookings.length} hint={`${counts.pendingBookings} por confirmar`} tone={counts.pendingBookings > 0 ? "warn" : "default"} />
                    <Kpi label="Pacientes SIAC" value={pets.length} hint="Com microchip registado" />
                    <Kpi label="Tutores & Planos" value={clients.length} hint={`${counts.attentionClients} com aviso`} />
                    <Kpi label="Receita Prevista (Mês)" value={formatEUR(4680)} hint="Consultas + Cirurgia + Planos" tone="success" />
                    <Kpi label="Alertas Stock DGAV" value={counts.lowStock} hint="Controlo por lote e validade" tone={counts.lowStock > 0 ? "danger" : "success"} />
                  </KpiGrid>

                  <div className="crm-two-columns crm-operations-grid">
                    <Panel
                      title="Agenda de Hoje & Próximos Atos"
                      subtitle="Transição rápida de estado clínico num clique"
                      actions={
                        <Button variant="secondary" onClick={() => setSection("agenda")}>
                          Abrir Agenda Completa
                        </Button>
                      }
                    >
                      <div tabIndex={0} role="region" aria-label="Próximas consultas" className="crm-table-wrap">
                        <table
                          className="crm-table crm-table-responsive crm-dashboard-table"
                          style={
                            {
                              "--label-2": "'Data / Hora'",
                              "--label-3": "'Serviço / Sede'",
                              "--label-4": "'Estado'",
                              "--label-5": "'Ação'",
                            } as React.CSSProperties
                          }
                        >
                          <thead>
                            <tr>
                              <th>Paciente / Tutor</th>
                              <th>Hora</th>
                              <th>Serviço & Sede</th>
                              <th>Estado</th>
                              <th>Ação</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bookings.map((b) => {
                              const meta = BOOKING_STATUS_META[b.status] || BOOKING_STATUS_META.confirmed;
                              return (
                                <tr key={b.id}>
                                  <th scope="row">
                                    <strong>{b.petName}</strong>
                                    <span className="crm-cell-sub">{b.clientName}</span>
                                  </th>
                                  <td>
                                    <strong>{b.time}</strong>
                                    <span className="crm-cell-sub">{b.day}</span>
                                  </td>
                                  <td>
                                    {b.service}
                                    <span className="crm-cell-sub">{b.sede}</span>
                                  </td>
                                  <td>
                                    <Chip tone={meta.tone}>{meta.label}</Chip>
                                  </td>
                                  <td className="crm-cell-actions">
                                    {meta.next ? (
                                      <Button variant="secondary" onClick={() => advanceBooking(b.id)}>
                                        {meta.nextLabel}
                                      </Button>
                                    ) : (
                                      <span className="crm-muted">Finalizada</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </Panel>

                    <Panel
                      title="Vigilância Farmacêutica DGAV & Vacinas"
                      subtitle="Controlo de lotes, validades e lembretes automáticos"
                    >
                      <div style={{ display: "grid", gap: 10 }}>
                        {products
                          .filter((p) => p.stock <= p.minimum)
                          .map((p) => (
                            <div
                              key={p.id}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "10px 12px",
                                borderRadius: 10,
                                border: "1px solid var(--crm-border)",
                                background: "var(--crm-surface-alt)",
                              }}
                            >
                              <div>
                                <strong>{p.name}</strong>
                                <span className="crm-cell-sub">
                                  Lote {p.lot} · Validade: {p.expiry}
                                </span>
                              </div>
                              <Chip tone="danger">
                                Stock: {p.stock} (mín. {p.minimum})
                              </Chip>
                            </div>
                          ))}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "10px 12px",
                            borderRadius: 10,
                            border: "1px solid var(--crm-border)",
                          }}
                        >
                          <div>
                            <strong>Reforço Vacinal Pendente: Mimi (Gato)</strong>
                            <span className="crm-cell-sub">Tutor: Tutor de exemplo 2 · Cheque Veterinário OMV</span>
                          </div>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setReplySearch("vacinas");
                              setSection("respuestas");
                            }}
                          >
                            Enviar #vacinas
                          </Button>
                        </div>
                      </div>
                    </Panel>
                  </div>
                </>
              )}

              {/* 2. FUNIL COMERCIAL & TRIAGEM (PIPELINE) */}
              {section === "pipeline" && (
                <>
                  <SectionHeader
                    eyebrow="CAPTAÇÃO DIGITAL · DIAGNÓSTICO DE CUIDADO & ORIENTADOR"
                    title="Funil Comercial & Triagem Clínica"
                    description="Tutores que preencheram o Diagnóstico de Cuidado, Orientador de Sintomas ou pediram orçamento de cirurgia/planos."
                  />
                  <KpiGrid>
                    <Kpi label="Em Triagem Ativa" value={counts.openLeads} hint="Oportunidades abertas" />
                    <Kpi
                      label="Valor Estimado no Funil"
                      value={formatEUR(leads.reduce((acc, l) => acc + (l.estimatedEur || 0), 0))}
                      hint="Planos + Cirurgias + Consultas"
                      tone="success"
                    />
                    <Kpi label="Tutores Fidelizados" value={leads.filter((l) => l.stage === "fidelizado").length} hint="Com plano ou consulta concluída" />
                    <Kpi label="Taxa de Conversão" value="84%" hint="Média últimos 30 dias" tone="success" />
                  </KpiGrid>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 14 }}>
                    {Object.entries(STAGE_META).map(([stageKey, stageInfo]) => {
                      const stageLeads = leads.filter((l) => l.stage === stageKey);
                      return (
                        <Panel
                          key={stageKey}
                          title={stageInfo.label}
                          subtitle={`${stageLeads.length} registos`}
                          actions={<Chip tone={stageInfo.tone}>{stageLeads.length}</Chip>}
                        >
                          <div style={{ display: "grid", gap: 12 }}>
                            {stageLeads.map((lead) => (
                              <article
                                key={lead.id}
                                style={{
                                  padding: 12,
                                  borderRadius: 12,
                                  border: "1px solid var(--crm-border)",
                                  background: "var(--crm-surface-alt)",
                                  display: "grid",
                                  gap: 8,
                                }}
                              >
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                                  <strong>{lead.fullName}</strong>
                                  <Chip tone="success">Score {lead.score}/100</Chip>
                                </div>
                                <span style={{ fontSize: 12, color: "var(--crm-accent-text)", fontWeight: 600 }}>
                                  {lead.petSummary}
                                </span>
                                <small className="crm-muted">
                                  📍 {lead.sede} · {lead.phone} · Est. {formatEUR(lead.estimatedEur)}
                                </small>
                                <p style={{ margin: 0, fontSize: 12, color: "var(--crm-muted)" }}>{lead.notes}</p>
                                <label style={{ fontSize: 11, fontWeight: 600 }}>
                                  Mover etapa:
                                  <select
                                    value={lead.stage}
                                    onChange={(e) => moveLeadStage(lead.id, e.target.value)}
                                    style={{ width: "100%", marginTop: 4, padding: "6px 8px", borderRadius: 8, border: "1px solid var(--crm-border)" }}
                                  >
                                    {Object.entries(STAGE_META).map(([k, v]) => (
                                      <option key={k} value={k}>{v.label}</option>
                                    ))}
                                  </select>
                                </label>
                              </article>
                            ))}
                            {!stageLeads.length && <p className="crm-muted" style={{ fontSize: 12 }}>Sem registos nesta coluna.</p>}
                          </div>
                        </Panel>
                      );
                    })}
                  </div>
                </>
              )}

              {/* 3. TUTORES, PLANOS & CHEQUE VETERINÁRIO OMV (CLIENTES) */}
              {section === "clientes" && (
                <>
                  <SectionHeader
                    eyebrow="DIRETÓRIO UNIFICADO DE TUTORES & PROTOCOLOS"
                    title="Tutores, Planos de Saúde & Cheque Veterinário"
                    description="Gestão de fichas de cliente, NIF para faturação AT, códigos de Cheque Veterinário OMV e protocolos municipais de esterilização."
                    actions={
                      <>
                        <Button variant="secondary" onClick={() => setModal("license")}>
                          Emitir Código / Cheque OMV
                        </Button>
                        <Button variant="primary" onClick={() => setModal("client")}>
                          <Plus size={15} /> Novo Tutor
                        </Button>
                      </>
                    }
                  />

                  <SectionTabs
                    label="Secções de clientes"
                    tabs={[
                      { id: "clientes", label: "Tutores & Prospectos", badge: clients.length },
                      { id: "licencias", label: "Planos & Cheque Veterinário OMV", badge: clients.length },
                    ]}
                    active={clientTab}
                    onSelect={setClientTab}
                  />

                  {clientTab === "clientes" ? (
                    <Panel
                      title="Diretório de Tutores"
                      subtitle="Filtre por estado de pagamento, protocolo municipal ou pesquise por nome / NIF."
                    >
                      <Toolbar>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {[
                            ["all", "Todos"],
                            ["attention", "Requer Atenção"],
                            ["active", "Plano Ativo"],
                            ["demo", "Diagnóstico Online"],
                          ].map(([fId, fLabel]) => (
                            <button
                              key={fId}
                              type="button"
                              onClick={() => setClientFilter(fId)}
                              className={`crm-chip ${clientFilter === fId ? "is-info" : "is-neutral"}`}
                              style={{ cursor: "pointer", border: 0 }}
                            >
                              {fLabel}
                            </button>
                          ))}
                        </div>
                        <input
                          type="search"
                          value={clientSearch}
                          onChange={(e) => setClientSearch(e.target.value)}
                          placeholder="Filtrar por nome, NIF, concelho ou telefone…"
                          style={{ marginLeft: "auto", padding: "7px 12px", borderRadius: 9, border: "1px solid var(--crm-border)", minWidth: 240 }}
                        />
                      </Toolbar>

                      <div tabIndex={0} role="region" aria-label="Tabela de tutores" className="crm-table-wrap" style={{ marginTop: 12 }}>
                        <table
                          className="crm-table crm-table-responsive"
                          style={
                            {
                              "--label-2": "'NIF / Concelho'",
                              "--label-3": "'Contacto'",
                              "--label-4": "'Plano / Protocolo'",
                              "--label-5": "'Saldo'",
                              "--label-6": "'Estado'",
                            } as React.CSSProperties
                          }
                        >
                          <thead>
                            <tr>
                              <th>Tutor</th>
                              <th>NIF & Concelho</th>
                              <th>Contacto</th>
                              <th>Plano / Protocolo</th>
                              <th>Saldo</th>
                              <th>Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {clients
                              .filter((c) => (clientFilter === "all" ? true : c.status === clientFilter))
                              .filter((c) => {
                                const q = clientSearch.trim().toLowerCase();
                                if (!q) return true;
                                return (
                                  c.name.toLowerCase().includes(q) ||
                                  c.nif.toLowerCase().includes(q) ||
                                  c.concelho.toLowerCase().includes(q) ||
                                  c.phone.toLowerCase().includes(q)
                                );
                              })
                              .map((c) => (
                                <tr key={c.id}>
                                  <th scope="row">
                                    <strong>{c.name}</strong>
                                    <span className="crm-cell-sub">{c.email}</span>
                                  </th>
                                  <td>
                                    NIF {c.nif}
                                    <span className="crm-cell-sub">{c.concelho}</span>
                                  </td>
                                  <td>{c.phone}</td>
                                  <td>
                                    <strong>{c.plan}</strong>
                                    <span className="crm-cell-sub">Código: {c.licenseCode}</span>
                                  </td>
                                  <td>
                                    <strong style={{ color: c.balanceEur > 0 ? "var(--crm-warn)" : "var(--crm-success)" }}>
                                      {formatEUR(c.balanceEur)}
                                    </strong>
                                  </td>
                                  <td>
                                    <Chip tone={c.status === "active" ? "success" : c.status === "attention" ? "warn" : "info"}>
                                      {c.status === "active" ? "Ativo" : c.status === "attention" ? "Quota Pendente" : "Registado"}
                                    </Chip>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </Panel>
                  ) : (
                    <Panel
                      title="Licenças de Portal, Planos de Saúde & Cheque Veterinário OMV"
                      subtitle="Códigos ativos para acesso à Área Privada do Tutor e protocolos municipais de esterilização"
                      actions={
                        <Button variant="primary" onClick={() => setModal("license")}>
                          <Plus size={15} /> Emitir Novo Código
                        </Button>
                      }
                    >
                      <div tabIndex={0} role="region" aria-label="Licenças e códigos" className="crm-table-wrap">
                        <table className="crm-table">
                          <thead>
                            <tr>
                              <th>Código</th>
                              <th>Titular</th>
                              <th>Modalidade / Convenção</th>
                              <th>Concelho</th>
                              <th>Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {clients.map((c) => (
                              <tr key={c.id}>
                                <th scope="row"><code>{c.licenseCode}</code></th>
                                <td>{c.name}</td>
                                <td>{c.plan}</td>
                                <td>{c.concelho}</td>
                                <td><Chip tone="success">Ativa / Validada</Chip></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Panel>
                  )}
                </>
              )}

              {/* 4. PACIENTES & BOLETIM CLÍNICO SIAC */}
              {section === "pacientes" && (
                <>
                  <SectionHeader
                    eyebrow="REGISTO CLÍNICO & IDENTIFICAÇÃO ELETRÓNICA SIAC"
                    title="Pacientes & Fichas Clínicas"
                    description="Consulte o número de transponder SIAC, plano vacinal, peso e aceda ao histórico clínico completo."
                    actions={
                      <Button variant="primary" onClick={() => setModal("pet")}>
                        <Plus size={15} /> Novo Paciente
                      </Button>
                    }
                  />
                  <Toolbar>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {[
                        ["all", "Todas as Espécies"],
                        ["Cão", "Cães"],
                        ["Gato", "Gatos"],
                        ["Exótico", "Exóticos / Outros"],
                      ].map(([spId, spLabel]) => (
                        <button
                          key={spId}
                          type="button"
                          onClick={() => setSpeciesFilter(spId)}
                          className={`crm-chip ${speciesFilter === spId ? "is-info" : "is-neutral"}`}
                          style={{ cursor: "pointer", border: 0 }}
                        >
                          {spLabel}
                        </button>
                      ))}
                    </div>
                  </Toolbar>

                  <div className="crm-two-columns">
                    {pets
                      .filter((p) => (speciesFilter === "all" ? true : p.species.includes(speciesFilter)))
                      .map((p) => (
                        <Panel
                          key={p.id}
                          title={`${p.name} (${p.species} · ${p.breed})`}
                          subtitle={`Tutor: ${p.ownerName} · Unidade: ${p.sede}`}
                          actions={<Chip tone={p.vaccines.includes("Pendente") ? "warn" : "success"}>{p.vaccines}</Chip>}
                        >
                          <div style={{ display: "grid", gap: 6, fontSize: 13, marginBottom: 12 }}>
                            <div><strong>Microchip SIAC:</strong> <code>{p.microchip}</code></div>
                            <div><strong>Idade / Peso:</strong> {p.age} · {p.weight}</div>
                            <div><strong>Próximo Reforço Vacinal:</strong> {p.nextVaccine}</div>
                            <div><strong>Plano / Protocolo:</strong> {p.plan}</div>
                          </div>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <Button variant="secondary" onClick={() => setSection("expedientes")}>
                              Abrir Histórico Clínico <ChevronRight size={14} />
                            </Button>
                            <Button variant="secondary" onClick={() => setModal("record")}>
                              <ClipboardPlus size={14} /> Nova Nota SOAP
                            </Button>
                          </div>
                        </Panel>
                      ))}
                  </div>
                </>
              )}

              {/* 5. AGENDA SEMANAL & MULTI-SEDE */}
              {section === "agenda" && (
                <>
                  <SectionHeader
                    eyebrow="GESTÃO DE VAGAS, CIRURGIAS & UNIDADES"
                    title="Agenda Clínica & Multi-Sede"
                    description={`Fuso horário oficial: Europe/Lisbon · Unidades: ${activePreset.sedes.map((s) => s.name).join(" | ")}`}
                    actions={
                      <Button variant="primary" onClick={() => setModal("booking")}>
                        <Plus size={15} /> Agendar Consulta / Cirurgia
                      </Button>
                    }
                  />

                  <SectionTabs
                    label="Vistas da Agenda"
                    tabs={[
                      { id: "semana", label: "Marcações da Semana", badge: bookings.length },
                      { id: "sedes", label: "Horários & Unidades", badge: activePreset.sedes.length },
                    ]}
                    active={agendaTab}
                    onSelect={setAgendaTab}
                  />

                  {agendaTab === "semana" ? (
                    <Panel
                      title="Mapa de Marcações"
                      subtitle="Filtre por sede clínica e avance o estado de cada consulta em tempo real."
                    >
                      {activePreset.sedes.length > 1 && (
                        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                          <button
                            type="button"
                            onClick={() => setSedeFilter("all")}
                            className={`crm-chip ${sedeFilter === "all" ? "is-info" : "is-neutral"}`}
                            style={{ cursor: "pointer", border: 0 }}
                          >
                            Todas as Unidades ({bookings.length})
                          </button>
                          {activePreset.sedes.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => setSedeFilter(s.name)}
                              className={`crm-chip ${sedeFilter === s.name ? "is-info" : "is-neutral"}`}
                              style={{ cursor: "pointer", border: 0 }}
                            >
                              📍 {s.name}
                            </button>
                          ))}
                        </div>
                      )}

                      <div tabIndex={0} role="region" aria-label="Agenda semanal" className="crm-table-wrap">
                        <table
                          className="crm-table crm-table-responsive"
                          style={
                            {
                              "--label-2": "'Data / Hora'",
                              "--label-3": "'Serviço'",
                              "--label-4": "'Unidade'",
                              "--label-5": "'Valor'",
                              "--label-6": "'Estado / Ação'",
                            } as React.CSSProperties
                          }
                        >
                          <thead>
                            <tr>
                              <th>Paciente & Tutor</th>
                              <th>Data & Hora</th>
                              <th>Serviço Clínico</th>
                              <th>Unidade</th>
                              <th>Valor</th>
                              <th>Estado & Ação</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bookings
                              .filter((b) => (sedeFilter === "all" ? true : b.sede === sedeFilter))
                              .map((b) => {
                                const meta = BOOKING_STATUS_META[b.status] || BOOKING_STATUS_META.confirmed;
                                return (
                                  <tr key={b.id}>
                                    <th scope="row">
                                      <strong>{b.petName}</strong>
                                      <span className="crm-cell-sub">{b.clientName}</span>
                                    </th>
                                    <td>
                                      <strong>{b.day}</strong>
                                      <span className="crm-cell-sub">{b.time}</span>
                                    </td>
                                    <td>
                                      {b.service}
                                      <span className="crm-cell-sub">{b.doctor}</span>
                                    </td>
                                    <td>{b.sede}</td>
                                    <td><strong>{formatEUR(b.priceEur)}</strong></td>
                                    <td className="crm-cell-actions">
                                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                        <Chip tone={meta.tone}>{meta.label}</Chip>
                                        {meta.next && (
                                          <Button variant="secondary" onClick={() => advanceBooking(b.id)}>
                                            {meta.nextLabel}
                                          </Button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    </Panel>
                  ) : (
                    <div className="crm-two-columns">
                      {activePreset.sedes.map((s, i) => (
                        <Panel
                          key={s.id}
                          title={`0${i + 1} · ${s.name}`}
                          subtitle={s.address}
                          actions={<Chip tone="success">Operacional</Chip>}
                        >
                          <p style={{ margin: "0 0 8px" }}><strong>Horário:</strong> {s.hours}</p>
                          <p style={{ margin: 0 }}><strong>Contacto Direto:</strong> {s.phone}</p>
                        </Panel>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* 6. MENSAGENS & WHATSAPP */}
              {section === "mensajes" && (
                <>
                  <SectionHeader
                    eyebrow="CAIXA DE ENTRADA UNIFICADA · FORMULÁRIO WEB & WHATSAPP"
                    title="Mensagens & Pedidos de Tutores"
                    description="Responda diretamente ou envie uma Resposta Rápida (#código) pré-formatada para o WhatsApp do tutor."
                  />
                  <div className="crm-two-columns">
                    <Panel title="Pedidos Recebidos" subtitle={`${inquiries.length} conversas`}>
                      <div style={{ display: "grid", gap: 10 }}>
                        {inquiries.map((q) => (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() => {
                              setSelectedInquiryId(q.id);
                              setInquiries((prev) => prev.map((item) => (item.id === q.id ? { ...item, unread: false } : item)));
                            }}
                            style={{
                              textAlign: "left",
                              padding: 12,
                              borderRadius: 12,
                              border: selectedInquiryId === q.id ? "2px solid var(--crm-accent)" : "1px solid var(--crm-border)",
                              background: q.unread ? "var(--crm-accent-soft)" : "var(--crm-surface-alt)",
                              cursor: "pointer",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <strong>{q.name}</strong>
                              {q.unread && <Chip tone="danger">Novo</Chip>}
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--crm-accent-text)", marginTop: 2 }}>
                              {q.topic} · {q.pet_name}
                            </div>
                            <p style={{ margin: "6px 0 0", fontSize: 12.5, color: "var(--crm-muted)" }}>{q.message}</p>
                          </button>
                        ))}
                      </div>
                    </Panel>

                    {(() => {
                      const activeQ = inquiries.find((q) => q.id === selectedInquiryId) || inquiries[0];
                      if (!activeQ) return <EmptyState title="Sem mensagens selecionadas" />;
                      return (
                        <Panel
                          title={`${activeQ.name} · ${activeQ.pet_name}`}
                          subtitle={`${activeQ.phone} · ${activeQ.email} · Sede: ${activeQ.sede}`}
                        >
                          <div style={{ padding: 14, borderRadius: 12, background: "var(--crm-surface-alt)", marginBottom: 14 }}>
                            <p style={{ margin: 0 }}>{activeQ.message}</p>
                          </div>
                          <div style={{ marginBottom: 10 }}>
                            <small className="crm-muted" style={{ display: "block", marginBottom: 6 }}>
                              Inserir modelo de Resposta Rápida (#):
                            </small>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              {quickReplies.slice(0, 4).map((r) => (
                                <button
                                  key={r.code}
                                  type="button"
                                  className="crm-chip is-info"
                                  style={{ cursor: "pointer", border: 0 }}
                                  onClick={() =>
                                    setReplyDraft(
                                      r.text
                                        .replace("{tutor}", activeQ.name.split(" ")[0])
                                        .replace("{animal}", activeQ.pet_name.split(" ")[0])
                                        .replace("{hora}", "amanhã às 09:00")
                                    )
                                  }
                                >
                                  #{r.code}
                                </button>
                              ))}
                            </div>
                          </div>
                          <textarea
                            rows={4}
                            value={replyDraft}
                            onChange={(e) => setReplyDraft(e.target.value)}
                            placeholder="Escreva a resposta clínica ou selecione um atalho # acima…"
                            style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid var(--crm-border)", marginBottom: 10 }}
                          />
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <Button
                              variant="primary"
                              onClick={() => {
                                setFeedback({ tone: "success", message: `Resposta registada e preparada para ${activeQ.name}.` });
                                setReplyDraft("");
                              }}
                            >
                              Registar Resposta
                            </Button>
                            {!isDemo && <a
                              href={`https://wa.me/${activeQ.phone.replace(/\D/g, "")}?text=${encodeURIComponent(replyDraft || `Olá ${activeQ.name}, contactamos da ${activePreset.shortName} sobre ${activeQ.pet_name}.`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="crm-button crm-button--secondary"
                              style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
                            >
                              <MessageCircle size={15} /> Abrir no WhatsApp ↗
                            </a>}
                          </div>
                        </Panel>
                      );
                    })()}
                  </div>
                </>
              )}

              {/* 7. BIBLIOTECA DE RESPOSTAS RÁPIDAS (#) — Replicada de RespuestasRapidas.jsx */}
              {section === "respuestas" && (
                <>
                  <SectionHeader
                    eyebrow="COMUNICAÇÃO PADRONIZADA · ATALHOS #CÓDIGO"
                    title="Biblioteca de Respostas Rápidas"
                    description="Modelos clínicos validados para copiar num clique para o WhatsApp, SMS ou chat do Portal do Tutor."
                  />
                  <Toolbar>
                    <input
                      type="search"
                      value={replySearch}
                      onChange={(e) => setReplySearch(e.target.value)}
                      placeholder="Pesquisar por #código (ex.: #jejum, #vacinas, #mbway) ou texto…"
                      style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid var(--crm-border)", minWidth: 320 }}
                    />
                  </Toolbar>
                  <div className="crm-two-columns">
                    {quickReplies
                      .filter((r) => {
                        const q = replySearch.trim().toLowerCase().replace(/^#/, "");
                        if (!q) return true;
                        return r.code.includes(q) || r.title.toLowerCase().includes(q) || r.text.toLowerCase().includes(q);
                      })
                      .map((r) => (
                        <Panel
                          key={r.code}
                          title={`#${r.code} · ${r.title}`}
                          subtitle={r.category}
                          actions={
                            <Button
                              variant="secondary"
                              onClick={() => {
                                navigator.clipboard?.writeText(r.text).catch(() => {});
                                setFeedback({ tone: "success", message: `Resposta #${r.code} copiada para a área de transferência.` });
                              }}
                            >
                              <Copy size={14} /> Copiar
                            </Button>
                          }
                        >
                          <p className="crm-reply-text" style={{ margin: 0, lineHeight: 1.6 }}>
                            {r.text.split(/(\{[a-z]+\})/g).map((part: string, idx: number) =>
                              part.startsWith("{") ? (
                                <mark key={idx} className="crm-reply-slot" style={{ padding: "1px 6px", borderRadius: 5, background: "var(--crm-accent-soft)", color: "var(--crm-accent-text)", fontWeight: 700 }}>
                                  {part}
                                </mark>
                              ) : (
                                <React.Fragment key={idx}>{part}</React.Fragment>
                              )
                            )}
                          </p>
                        </Panel>
                      ))}
                  </div>
                </>
              )}

              {/* 8. COBRANÇAS, MB WAY & FATURAÇÃO (COBROS) — Replicada de Cobros.jsx */}
              {section === "cobros" && (
                <>
                  <SectionHeader
                    eyebrow="TESOURARIA CLÍNICA · MB WAY, MULTIBANCO & PLANOS"
                    title="Cobranças & Validação de Comprovativos"
                    description="Valide transferências e pagamentos MB WAY submetidos pelos tutores e acompanhe as subscrições de planos de saúde."
                  />
                  <SectionTabs
                    label="Secções de cobranças"
                    tabs={[
                      { id: "comprobantes", label: "Comprovativos MB WAY / IBAN", badge: counts.pendingSubmissions, alert: counts.pendingSubmissions > 0 },
                      { id: "cierres", label: "Resumo de Caixa (€)" },
                    ]}
                    active={cobrosTab}
                    onSelect={setCobrosTab}
                  />

                  {cobrosTab === "comprobantes" ? (
                    <div className="crm-two-columns">
                      {submissions.map((s) => (
                        <Panel
                          key={s.id}
                          title={`${s.clientName} · ${formatEUR(s.amountEur)}`}
                          subtitle={`Paciente: ${s.petName} · ${s.method} · Ref: ${s.reference}`}
                          actions={
                            <Chip tone={s.status === "approved" ? "success" : s.status === "rejected" ? "danger" : "warn"}>
                              {s.status === "approved" ? "Aprovado" : s.status === "rejected" ? "Rejeitado" : "Aguarda validação"}
                            </Chip>
                          }
                        >
                          <p style={{ margin: "0 0 12px", fontSize: 13 }}>
                            <strong>Conceito:</strong> {s.concept} <br />
                            <strong>Submetido em:</strong> {s.submittedAt}
                          </p>
                          {s.status === "pending" && (
                            <div style={{ display: "flex", gap: 8 }}>
                              <Button variant="primary" onClick={() => decideSubmission(s.id, "approved")}>
                                <Check size={14} /> Aprovar e Emitir Recibo
                              </Button>
                              <Button variant="secondary" onClick={() => decideSubmission(s.id, "rejected")}>
                                Solicitar Correção
                              </Button>
                            </div>
                          )}
                        </Panel>
                      ))}
                    </div>
                  ) : (
                    <KpiGrid>
                      <Kpi label="Total Validado (Mês)" value={formatEUR(3890)} hint="Pagamentos confirmados" tone="success" />
                      <Kpi label="Em Validação MB WAY" value={formatEUR(73)} hint={`${counts.pendingSubmissions} comprovativos`} tone="warn" />
                      <Kpi label="Planos de Saúde Ativos" value="28" hint="Débito / Renovação anual" />
                      <Kpi label="Cheques Veterinários OMV" value="14" hint="Protocolo OMV / Município" />
                    </KpiGrid>
                  )}
                </>
              )}

              {/* 9. STOCK & FARMÁCIA DGAV (INVENTARIO) */}
              {section === "inventario" && (
                <>
                  <SectionHeader
                    eyebrow={`RASTREABILIDADE DE MEDICAMENTOS VETERINÁRIOS · ${activePreset.dgav}`}
                    title="Inventário por Lote & Farmácia DGAV"
                    description="Controlo de existências, lotes, prazos de validade e stock mínimo de vacinas, antiparasitários e dietas terapêuticas."
                    actions={
                      <Button variant="primary" onClick={() => setModal("product")}>
                        <Plus size={15} /> Registar Lote DGAV
                      </Button>
                    }
                  />
                  <Panel title="Lotes Registados em Clínica">
                    <div tabIndex={0} role="region" aria-label="Inventário por lote" className="crm-table-wrap">
                      <table
                        className="crm-table crm-table-responsive"
                        style={
                          {
                            "--label-2": "'Categoria'",
                            "--label-3": "'SKU / Lote'",
                            "--label-4": "'Validade'",
                            "--label-5": "'PVP (€)'",
                            "--label-6": "'Stock'",
                          } as React.CSSProperties
                        }
                      >
                        <thead>
                          <tr>
                            <th>Produto / Medicamento</th>
                            <th>Categoria</th>
                            <th>SKU & Lote</th>
                            <th>Validade</th>
                            <th>PVP</th>
                            <th>Stock Atual</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.map((p) => (
                            <tr key={p.id}>
                              <th scope="row"><strong>{p.name}</strong></th>
                              <td>{p.category}</td>
                              <td><code>{p.sku}</code> · Lote {p.lot}</td>
                              <td>{p.expiry}</td>
                              <td>{formatEUR(p.priceEur)}</td>
                              <td>
                                <Chip tone={p.stock <= p.minimum ? "danger" : "success"}>
                                  {p.stock} un. (mín. {p.minimum})
                                </Chip>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Panel>
                </>
              )}

              {/* 10. HISTÓRICO CLÍNICO (EXPEDIENTES) */}
              {section === "expedientes" && (
                <>
                  <SectionHeader
                    eyebrow="REGISTOS CLÍNICOS, CIRÚRGICOS E ANÁLISES"
                    title="Histórico Clínico (Notas SOAP)"
                    description="Acesso reservado ao corpo médico-veterinário e partilha controlada com o tutor na Área Privada."
                    actions={
                      <Button variant="primary" onClick={() => setModal("record")}>
                        <Plus size={15} /> Nova Nota Clínica
                      </Button>
                    }
                  />
                  <div style={{ display: "grid", gap: 14 }}>
                    {records.map((r) => (
                      <Panel
                        key={r.id}
                        title={`${r.petName} · ${r.kind}`}
                        subtitle={`${r.doctor} · ${r.sede} · ${new Date(r.created).toLocaleString("pt-PT", { timeZone: "Europe/Lisbon" })}`}
                        actions={<Chip tone="info">Validado OMV</Chip>}
                      >
                        <p style={{ margin: 0, lineHeight: 1.65 }}>{r.note}</p>
                      </Panel>
                    ))}
                  </div>
                </>
              )}

              {/* 11. RELATÓRIOS & MÉTRICAS (REPORTES) */}
              {section === "reportes" && (
                <>
                  <SectionHeader
                    eyebrow="INTELIGÊNCIA OPERACIONAL & FINANCEIRA"
                    title="Relatórios & Indicadores"
                    description="Análise de desempenho por unidade clínica, taxa de fidelização e exportação contabilística CSV."
                    actions={
                      <Button variant="primary" onClick={exportCsvReport}>
                        <Download size={15} /> Exportar CSV Contabilístico
                      </Button>
                    }
                  />
                  <KpiGrid>
                    <Kpi label="Faturação Mensal" value={formatEUR(4680)} hint="+18% face ao mês homólogo" tone="success" />
                    <Kpi label="Atos Médico-Veterinários" value="142" hint="Consultas, vacinas e cirurgias" />
                    <Kpi label="Taxa de Retenção (Lembretes)" value="92%" hint="Redução de faltas via SMS/WhatsApp" tone="success" />
                    <Kpi label="Tempo Médio de Resposta" value="14 min" hint="Pedidos via web e WhatsApp" />
                  </KpiGrid>
                </>
              )}

              {/* 12. CONFIGURAÇÃO & RGPD (CONFIGURACION) */}
              {section === "configuracion" && (
                <>
                  <SectionHeader
                    eyebrow="GOVERNANÇA CLÍNICA, DGAV & PROTEÇÃO DE DADOS"
                    title="Configuração do Sistema & Conformidade RGPD"
                    description="Parâmetros oficiais da clínica, horários Europe/Lisbon e conformidade com a Lei n.º 58/2019 (CNPD)."
                  />
                  <div className="crm-two-columns">
                    <Panel title="Identificação Regulamentar DGAV / OMV" subtitle={activePreset.brandName}>
                      <p><strong>Direção Clínica:</strong> {activePreset.director}</p>
                      <p><strong>Registo Oficial:</strong> {activePreset.dgav}</p>
                      <p><strong>Contacto Principal:</strong> {activePreset.phone}</p>
                      <p><strong>E-mail Corporativo:</strong> {activePreset.email}</p>
                      <p><strong>Fuso Horário:</strong> Europe/Lisbon (Portugal Continental)</p>
                    </Panel>
                    <Panel title="Conformidade RGPD / CNPD (Lei n.º 58/2019)" subtitle="Auditoria e proteção de dados de tutores">
                      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
                        <li>Comunicações clínicas e envio de análises protegidos sob protocolo HTTPS/TLS.</li>
                        <li>Registo de consentimento explícito com versão e carimbo temporal ISO 8601.</li>
                        <li>Direito ao esquecimento e portabilidade disponível no Portal do Tutor.</li>
                        <li>Integração com Livro de Reclamações Eletrónico e registo SIAC.</li>
                      </ul>
                    </Panel>
                  </div>
                </>
              )}

              {/* 13. DEV STUDIO (REPLICADO DE DevStudio.jsx) */}
              {role === "developer" && section === "dev" && (
                <>
                  <SectionHeader
                    eyebrow="ELYSIUM λ DEVELOPMENT & RESEARCH · INFRAESTRUTURA"
                    title="Dev Studio & Diagnóstico D1"
                    description="Inspeção de coleções, teste de latência Edge e auditoria técnica reservada à equipa de engenharia."
                    actions={
                      <Button
                        variant="primary"
                        onClick={() => {
                          const ms = Math.floor(11 + Math.random() * 9);
                          setPingResult({ latency: ms, at: new Date().toLocaleTimeString("pt-PT") });
                          setFeedback({ tone: "success", message: `Edge Worker & Base de Dados operacionais. Latência: ${ms} ms.` });
                        }}
                      >
                        <RefreshCw size={14} /> Testar Latência (Ping)
                      </Button>
                    }
                  />

                  <SectionTabs
                    label="Separadores Dev Studio"
                    tabs={[
                      { id: "overview", label: "Estado da Infraestrutura" },
                      { id: "db-explorer", label: "Explorador de Coleções" },
                      { id: "logs", label: "Auditoria RGPD" },
                    ]}
                    active={devTab}
                    onSelect={setDevTab}
                  />

                  {devTab === "overview" && (
                    <KpiGrid>
                      <Kpi label="Motor de Aplicação" value="Elysium OS" hint="Vinext / Next 16 + Cloudflare" tone="success" />
                      <Kpi label="Latência Edge" value={pingResult ? `${pingResult.latency} ms` : "14 ms"} hint={pingResult ? `Verificado às ${pingResult.at}` : "Região: Western Europe (LIS)"} tone="success" />
                      <Kpi label="Segurança CSP / HSTS" value="Nível 3" hint="Zero rastreadores de terceiros" />
                      <Kpi label="Unidades Configuradas" value={activePreset.sedes.length} hint={activePreset.sedes.map((s) => s.name).join(", ")} />
                    </KpiGrid>
                  )}

                  {devTab === "db-explorer" && (
                    <Panel title="Explorador de Documentos em Memória" subtitle="Inspeção instantânea sem leituras faturadas adicionais">
                      <Toolbar>
                        {[
                          ["pets", `pets (${pets.length})`],
                          ["clients", `clients (${clients.length})`],
                          ["bookings", `bookings (${bookings.length})`],
                          ["leads", `leads (${leads.length})`],
                          ["products", `products (${products.length})`],
                        ].map(([colId, colLabel]) => (
                          <button
                            key={colId}
                            type="button"
                            onClick={() => setDevCollection(colId)}
                            className={`crm-chip ${devCollection === colId ? "is-info" : "is-neutral"}`}
                            style={{ cursor: "pointer", border: 0 }}
                          >
                            <Database size={12} /> {colLabel}
                          </button>
                        ))}
                      </Toolbar>
                      <pre
                        style={{
                          marginTop: 12,
                          padding: 14,
                          borderRadius: 12,
                          background: "var(--crm-surface-alt)",
                          fontSize: 12,
                          overflowX: "auto",
                          maxHeight: 360,
                        }}
                      >
                        {JSON.stringify(
                          devCollection === "pets"
                            ? pets
                            : devCollection === "clients"
                            ? clients
                            : devCollection === "bookings"
                            ? bookings
                            : devCollection === "leads"
                            ? leads
                            : products,
                          null,
                          2
                        )}
                      </pre>
                    </Panel>
                  )}

                  {devTab === "logs" && (
                    <Panel title="Registo de Eventos e Auditoria RGPD" subtitle="Rastreabilidade de acessos a fichas clínicas">
                      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8, fontSize: 13 }}>
                        <li><code>[2026-11-18 09:00:12]</code> Sessão iniciada · {activePreset.director} ({activePreset.dgav})</li>
                        <li><code>[2026-11-18 10:15:44]</code> Receção de comprovativo MB WAY · Tutor: Tutor de exemplo 2</li>
                        <li><code>[2026-11-18 11:05:09]</code> Triagem do Orientador de Sintomas recebida · Paciente: Rex</li>
                      </ul>
                    </Panel>
                  )}
                </>
              )}
            </>
          )}
        </main>
      </div>

      {/* Barra inferior móvil replicada de Pura Vida Pets */}
      <nav className="crm-bottom-nav" aria-label="Navegação rápida móvel">
        <div className="crm-bottom-nav-inner">
          {flatNavItems.slice(0, 6).map((item: any) => {
            const Icon = item.icon;
            const isActive = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={`crm-bottom-nav-item portal-nav-item ${isActive ? "is-active" : ""}`}
              >
                <span className="crm-bottom-nav-icon-wrap">
                  <Icon size={18} aria-hidden="true" />
                  {item.badge ? (
                    <span className={`crm-bottom-nav-badge ${item.alert ? "is-alert" : ""}`}>
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  ) : null}
                </span>
                <span className="crm-bottom-nav-label">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Buscador Global ⌘K (CommandPalette.jsx de Pura Vida Pets) */}
      {paletteOpen && (
        <div className="crm-palette-backdrop" role="presentation" onMouseDown={() => setPaletteOpen(false)}>
          <div
            className="crm-palette"
            role="dialog"
            aria-modal="true"
            aria-label="Pesquisa rápida do sistema"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="crm-palette-input-row">
              <Search size={17} aria-hidden="true" />
              <input
                type="search"
                autoFocus
                value={paletteTerm}
                onChange={(e) => setPaletteTerm(e.target.value)}
                placeholder="Pesquisar secção, paciente, microchip SIAC, NIF ou #resposta…"
              />
              <kbd>Esc</kbd>
            </div>
            <div className="crm-palette-results">
              {paletteResults.map((res, i) => (
                <button
                  key={i}
                  type="button"
                  className="crm-palette-item"
                  onClick={() => {
                    res.action();
                    setPaletteOpen(false);
                    setPaletteTerm("");
                  }}
                >
                  <div>
                    <strong>{res.label}</strong>
                    <span className="crm-cell-sub">{res.hint}</span>
                  </div>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--crm-muted)" }}>
                    {res.kind} <CornerDownLeft size={13} />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modais de criação de registos */}
      <Modal
        open={Boolean(modal)}
        title={
          modal === "booking"
            ? "Agendar Nova Marcação"
            : modal === "pet"
            ? "Registar Novo Paciente SIAC"
            : modal === "client"
            ? "Registar Novo Tutor (RGPD)"
            : modal === "product"
            ? "Registar Lote Farmacêutico DGAV"
            : modal === "record"
            ? "Adicionar Nota ao Histórico Clínico"
            : "Emitir Licença / Cheque Veterinário OMV"
        }
        description={`${activePreset.brandName} · ${activePreset.dgav}`}
        onClose={() => setModal(null)}
      >
        <form onSubmit={(event) => handleModalSubmit(event)} style={{ display: "grid", gap: 12 }}>
          {modal === "booking" && (
            <>
              <Field label="Paciente">
                <select name="petId" defaultValue={pets[0]?.id}>
                  {pets.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.species} · Tutor: {p.ownerName})</option>
                  ))}
                </select>
              </Field>
              <Field label="Unidade / Sede">
                <select name="sede" defaultValue={activePreset.sedes[0]?.name}>
                  {activePreset.sedes.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Serviço">
                <select name="service" defaultValue={activePreset.services[0]}>
                  {activePreset.services.map((srv) => (
                    <option key={srv} value={srv}>{srv}</option>
                  ))}
                </select>
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Field label="Data"><input name="day" type="date" defaultValue="2026-11-20" required /></Field>
                <Field label="Hora"><input name="time" type="time" defaultValue="10:00" required /></Field>
              </div>
              <Field label="Valor Previsto (€)"><input name="priceEur" type="number" defaultValue="35" required /></Field>
            </>
          )}

          {modal === "pet" && (
            <>
              <Field label="Tutor Responsável">
                <select name="owner" defaultValue={clients[0]?.id}>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} (NIF {c.nif})</option>
                  ))}
                </select>
              </Field>
              <Field label="Nome do Animal"><input name="name" placeholder="Ex.: Bolota" required /></Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Field label="Espécie">
                  <select name="species" defaultValue="Cão">
                    <option value="Cão">Cão</option>
                    <option value="Gato">Gato</option>
                    <option value="Exótico">Exótico</option>
                    <option value="Ruminante / Pecuária">Ruminante / Pecuária</option>
                  </select>
                </Field>
                <Field label="Raça"><input name="breed" placeholder="Ex.: Rafeiro / Europeu Comum" /></Field>
              </div>
              <Field label="Nº Transponder Microchip (SIAC)"><input name="microchip" defaultValue="DEMO-CHIP-06" required /></Field>
            </>
          )}

          {modal === "client" && (
            <>
              <Field label="Nome Completo do Tutor / Exploração"><input name="name" required /></Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Field label="NIF Português"><input name="nif" placeholder="Ex.: 245 819 023" required /></Field>
                <Field label="Concelho"><input name="concelho" defaultValue={activePreset.city} required /></Field>
              </div>
              <Field label="Telemóvel"><input name="phone" defaultValue="+351 9" required /></Field>
              <Field label="E-mail"><input name="email" type="email" required /></Field>
              <Field label="Plano / Protocolo">
                <select name="plan">
                  <option value="Plano Preventivo Anual">Plano Preventivo Anual</option>
                  <option value="Cheque Veterinário OMV">Cheque Veterinário OMV</option>
                  <option value="Protocolo Esterilização Municipal">Protocolo Esterilização Municipal</option>
                  <option value="Cliente Particular">Cliente Particular</option>
                </select>
              </Field>
            </>
          )}

          {modal === "product" && (
            <>
              <Field label="Designação do Medicamento / Produto"><input name="name" required /></Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Field label="Código SKU"><input name="sku" defaultValue="MED-PT-10" required /></Field>
                <Field label="Nº de Lote"><input name="lot" defaultValue="LT-2026B" required /></Field>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <Field label="Stock Atual"><input name="stock" type="number" defaultValue="10" required /></Field>
                <Field label="Stock Mínimo"><input name="minimum" type="number" defaultValue="5" required /></Field>
                <Field label="PVP (€)"><input name="priceEur" type="number" defaultValue="25" required /></Field>
              </div>
              <Field label="Data de Validade"><input name="expiry" type="date" defaultValue="2027-12-31" required /></Field>
            </>
          )}

          {modal === "record" && (
            <>
              <Field label="Paciente">
                <select name="petId" defaultValue={pets[0]?.id}>
                  {pets.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.species})</option>
                  ))}
                </select>
              </Field>
              <Field label="Tipo de Ato Clínico">
                <select name="kind">
                  <option value="Consulta & Observação SOAP">Consulta & Observação SOAP</option>
                  <option value="Vacinação & Registo SIAC">Vacinação & Registo SIAC</option>
                  <option value="Cirurgia / Esterilização">Cirurgia / Esterilização</option>
                  <option value="Análises & Imagiologia">Análises & Imagiologia</option>
                </select>
              </Field>
              <Field label="Observações Clínicas, Diagnóstico e Terapêutica" wide>
                <textarea name="note" rows={4} required placeholder="Registe anamnese, exame físico, temperatura, medicação administrada e recomendações ao tutor…" />
              </Field>
            </>
          )}

          {modal === "license" && (
            <>
              <Field label="Tutor Beneficiário">
                <select name="holder" defaultValue={clients[0]?.name}>
                  {clients.map((c) => (
                    <option key={c.id} value={c.name}>{c.name} (NIF {c.nif})</option>
                  ))}
                </select>
              </Field>
              <Field label="Tipo de Credencial">
                <select name="kind">
                  <option value="Cheque Veterinário OMV">Cheque Veterinário OMV / Esterilização</option>
                  <option value="Licença Área Privada do Tutor">Licença Área Privada do Tutor (Plano Anual)</option>
                  <option value="Pacote de Sessões (Fisioterapia / Hotel / Tosquias)">Pacote de Sessões (Fisioterapia / Hotel / Tosquias)</option>
                </select>
              </Field>
            </>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancelar</Button>
            <Button variant="primary" type="submit">Guardar Registo</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
