"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, Building2, CalendarDays, Check, ChevronRight, PawPrint, Phone, ShieldCheck } from "lucide-react";
import * as siteConfig from "@/src/core/config";

const cfg: any = siteConfig;
const url = cfg.url || ((p: string) => p);

const defaultPets = [
  { id: "p1", name: "Montesinho", species: "Cão · Cão de Gado Transmontano" },
  { id: "p2", name: "Mafalda", species: "Gato · Europeu Comum" },
  { id: "p3", name: "Efetivo BVL-42", species: "Suinicultura / Pecuária · Efetivo Reprodutor" },
  { id: "p4", name: "Outro / 1.ª Vez", species: "Novo Paciente" },
];

export default function Booking({ isDemo = false }: { isDemo?: boolean }) {
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
        name: cfg.ADDRESS_CITY || "Unidade Principal",
        address: cfg.FULL_ADDRESS || cfg.ADDRESS_STREET || "Trás-os-Montes",
        phone: cfg.PHONE || "+351 273 325 357",
        hours: "Seg–Sex: 09:00–19:00 · Sáb: 09:00–13:00",
      },
    ];

  const serviceList = (cfg.services || []).map((s: any) => s.name);
  const weekdaySlots = [
    ["09:30", serviceList[0] || "Clínica & Medicina Preventiva"],
    ["11:00", serviceList[1] || "Cirurgia, Análises & Internamento"],
    ["14:30", serviceList[3] || "Tosquias, Banhos & Higiene"],
    ["16:00", serviceList[2] || "Espécies Pecuárias & Suiniculturas"],
    ["17:30", serviceList[4] || "Hotel & Alojamento Animal"],
  ];
  const saturdaySlots = [
    ["09:30", serviceList[0] || "Clínica & Medicina Preventiva"],
    ["10:30", serviceList[1] || "Cirurgia, Análises & Internamento"],
    ["11:30", serviceList[3] || "Tosquias, Banhos & Higiene"],
    ["12:15", serviceList[4] || "Hotel & Alojamento Animal"],
  ];

  const [sedeId, setSedeId] = useState<string>(sedes[0]?.id || "principal");
  const [pet, setPet] = useState<string>(defaultPets[0].id);
  const [day, setDay] = useState<string>("2026-11-20");
  const [slots, setSlots] = useState<{ id: string; time: string; service: string }[]>([]);
  const [slot, setSlot] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const activeSede = sedes.find((s: any) => s.id === sedeId) || sedes[0];

  useEffect(() => {
    if (!day) {
      setSlots([]);
      return;
    }
    const d = new Date(day + "T12:00:00Z").getUTCDay();
    if (d === 0) {
      setSlots([]);
      return;
    }
    const templates = d === 6 ? saturdaySlots : weekdaySlots;
    setSlots(
      templates.map(([time, service]) => ({
        id: `${sedeId}-${day}-${time}`,
        time,
        service,
      }))
    );
  }, [day, sedeId]);

  function book() {
    const chosenSlot = slots.find((s) => s.id === slot);
    const chosenPet = defaultPets.find((p) => p.id === pet);
    setMessage(
      `Simulação concluída para ${chosenPet?.name || "o seu animal"} na unidade ${activeSede?.name} (${day} às ${chosenSlot?.time} — ${chosenSlot?.service}).`
    );
    setSlot("");
  }

  return (
    <main className="booking-page">
      <header>
        <a href={url("/")}>
          <ArrowLeft /> Voltar à página principal
        </a>
        <span>
          {cfg.BRAND_SHORT || cfg.BRAND} · {cfg.DGAV_LICENSE || "CAMV DGAV"}
        </span>
      </header>

      <div className="booking-layout">
        <section>
          <span className="eyebrow">{isDemo ? "AGENDA DE DEMONSTRAÇÃO" : "AGENDA ONLINE · EUROPE/LISBON"}</span>
          <h1>
            Marcação rápida
            <br />
            <em>sem espera telefónica.</em>
          </h1>
          <p>
            Experimente a agenda com animais e horários de exemplo. Para pedir uma consulta, contacte a clínica por telefone ou <a href={cfg.WHATSAPP} target="_blank" rel="noopener noreferrer">WhatsApp</a>.
          </p>
          <ol>
            <li className={pet ? "done" : ""}>
              <span>{pet ? <Check /> : "1"}</span>Animal / Paciente
            </li>
            <li className={sedeId && day ? "done" : ""}>
              <span>{sedeId && day ? <Check /> : "2"}</span>Unidade & Data
            </li>
            <li className={slot ? "done" : ""}>
              <span>{slot ? <Check /> : "3"}</span>Horário & Ato Clínico
            </li>
          </ol>

          <div
            style={{
              marginTop: 22,
              padding: "14px 16px",
              borderRadius: 14,
              border: "1px solid var(--line, rgba(0,0,0,0.12))",
              background: "var(--surface, rgba(255,255,255,0.6))",
              fontSize: 13,
            }}
          >
            <strong style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <ShieldCheck size={16} /> {activeSede?.name}
            </strong>
            <div style={{ marginTop: 4, opacity: 0.85 }}>{activeSede?.address}</div>
            <div style={{ marginTop: 4, opacity: 0.85 }}>{activeSede?.hours}</div>
            <div style={{ marginTop: 6, fontWeight: 700 }}>
              <Phone size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />{" "}
              {activeSede?.phone || cfg.PHONE}
            </div>
          </div>
        </section>

        <section className="booking-form">
          {sedes.length > 1 && (
            <fieldset className="sede-picker" style={{ border: 0, padding: 0, margin: "0 0 14px" }}>
              <legend style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
                <Building2 size={14} style={{ verticalAlign: "middle", marginRight: 5 }} /> Selecionar Unidade / Concelho
              </legend>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {sedes.map((s: any) => (
                  <button
                    type="button"
                    key={s.id}
                    aria-pressed={sedeId === s.id}
                    onClick={() => {
                      setSedeId(s.id);
                      setSlot("");
                    }}
                    className={sedeId === s.id ? "button small" : "button outline small"}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <label>
            Paciente / Animal
            <select value={pet} onChange={(e) => setPet(e.target.value)}>
              {defaultPets.map((p) => (
                <option value={p.id} key={p.id}>
                  {p.name} — {p.species}
                </option>
              ))}
            </select>
          </label>

          <label>
            Data pretendida
            <input
              type="date"
              value={day}
              min="2026-11-18"
              onChange={(e) => {
                setDay(e.target.value);
                setSlot("");
                setMessage("");
              }}
            />
          </label>

          <div className="slot-list">
            {day && !slots.length && (
              <p>
                Clínica encerrada para consultas de rotina ao domingo. Para urgências (mediante contacto telefónico prévio), ligue para{" "}
                <strong>{cfg.PHONE}</strong> ou <strong>{cfg.MOBILE}</strong>.
              </p>
            )}
            {slots.map((s) => (
              <button
                type="button"
                className={slot === s.id ? "selected" : ""}
                onClick={() => setSlot(s.id)}
                key={s.id}
              >
                <span>
                  <strong>{s.time}</strong>
                  {s.service} · <small>{activeSede?.name}</small>
                </span>
                <ChevronRight />
              </button>
            ))}
          </div>

          {message && (
            <div className="notice success" role="status">
              {message}{" "}
              <a href={cfg.WHATSAPP} target="_blank" rel="noopener noreferrer">
                Pedir consulta por WhatsApp ↗
              </a>{" "}
              | <a href={url("/portal")}>Abrir Área do Tutor ↗</a>
            </div>
          )}

          <button type="button" className="button full" disabled={!pet || !slot} onClick={book}>
            <CalendarDays /> Simular marcação em {activeSede?.name}
          </button>
          <small>
            As marcações simuladas terminam nesta página.
          </small>
        </section>
      </div>
    </main>
  );
}
