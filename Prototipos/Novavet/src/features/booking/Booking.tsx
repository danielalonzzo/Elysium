"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, Check, ChevronRight, PawPrint } from "lucide-react";
import { url, WHATSAPP, BRAND_SHORT, PHONE } from "@/src/core/config";

const demoPets = [
  { id: "p1", name: "Max", species: "Cão" },
  { id: "p2", name: "Tareco", species: "Gato" },
  { id: "p3", name: "Maravilha", species: "Ovino / Cabra" }
];

const demoSlots = (day: string) => {
  const d = new Date(day + "T12:00:00Z").getUTCDay();
  // Encerrado ao fim de semana (0 = domingo, 6 = sábado)
  if (d === 0 || d === 6) return [];
  return [
    ["09:30", "Consulta Médico-Veterinária"],
    ["11:00", "Vacinação e Desparasitação"],
    ["14:30", "Consulta Clínica / Nutrição Animal"],
    ["16:30", "Acompanhamento Sanitário / Consulta"]
  ].map(([time, service]) => ({ id: day + time, time, service }));
};

export default function Booking({ isDemo = false }: { isDemo?: boolean }) {
  const [data, setData] = useState<any>(isDemo ? { pets: demoPets } : null);
  const [day, setDay] = useState("");
  const [slots, setSlots] = useState<any[]>([]);
  const [pet, setPet] = useState(isDemo ? demoPets[0].id : "");
  const [slot, setSlot] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(!isDemo);

  useEffect(() => {
    if (isDemo) return;
    fetch('/api/clinic', { cache: 'no-store' })
      .then(async r => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error);
        setData(j);
        setPet(j.pets[0]?.id || '');
      })
      .catch(e => setMessage(e.message))
      .finally(() => setLoading(false));
  }, [isDemo]);

  async function find(value: string) {
    setDay(value);
    setSlot('');
    setMessage('');
    if (!value) {
      setSlots([]);
      return;
    }
    if (isDemo) {
      setSlots(demoSlots(value));
      return;
    }
    const r = await fetch('/api/clinic?kind=slots&day=' + encodeURIComponent(value));
    const j = await r.json();
    if (!r.ok) {
      setMessage(j.error);
      setSlots([]);
    } else {
      setSlots(j);
    }
  }

  async function book() {
    setMessage('');
    if (isDemo) {
      setMessage('Demonstração: para agendamento oficial, contacte a Novavet pelo WhatsApp ou telefone.');
      setSlot('');
      return;
    }
    const r = await fetch('/api/clinic', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'book', pet, slot, consent: true })
    });
    const j = await r.json();
    if (!r.ok) {
      setMessage(j.error);
    } else {
      setMessage('Marcação confirmada com sucesso. Pode consultá-la na sua área reservada.');
      setSlot('');
      await find(day);
    }
  }

  if (loading) {
    return (
      <div className="booking-loading">
        <PawPrint/> A carregar agenda do consultório…
      </div>
    );
  }

  return (
    <main className="booking-page">
      <header>
        <a href={url('/')}><ArrowLeft/> Voltar ao consultório</a>
        <span>NOVAVET · BRAGANÇA (DGAV PT 1 0124 CN)</span>
      </header>
      <div className="booking-layout">
        <section>
          <span className="eyebrow">MARCAÇÃO DE CONSULTAS</span>
          <h1>Agendamento<br/><em>para o seu animal.</em></h1>
          <p>
            Horário do consultório: segunda a sexta, 09:00–12:30 e 14:00–19:00 (fuso horário de Portugal Continental / Europe/Lisbon).
            Para emergências ou marcações imediatas, telefone para {PHONE}.
          </p>
          <ol>
            <li className={pet ? 'done' : ''}><span>{pet ? <Check/> : '1'}</span>Animal</li>
            <li className={day ? 'done' : ''}><span>{day ? <Check/> : '2'}</span>Data</li>
            <li className={slot ? 'done' : ''}><span>{slot ? <Check/> : '3'}</span>Hora</li>
          </ol>
        </section>

        <section className="booking-form">
          <label>
            Paciente / Animal
            <select value={pet} onChange={e => setPet(e.target.value)}>
              {data?.pets.map((p: any) => (
                <option value={p.id} key={p.id}>{p.name} · {p.species}</option>
              ))}
            </select>
          </label>
          {!data?.pets.length && (
            <p className="notice">Registe primeiro o animal na área de cliente ou contacte a equipa da Novavet.</p>
          )}

          <label>
            Data pretendida
            <input
              type="date"
              value={day}
              min={new Date().toISOString().slice(0, 10)}
              onChange={e => void find(e.target.value)}
            />
          </label>

          <div className="slot-list">
            {day && !slots.length && (
              <p>Não existem vagas disponíveis para esta data (encerrado aos fins de semana). Selecione outro dia útil ou ligue para o consultório.</p>
            )}
            {slots.map(s => (
              <button
                type="button"
                className={slot === s.id ? 'selected' : ''}
                onClick={() => setSlot(s.id)}
                key={s.id}
              >
                <span><strong>{s.time}</strong>{s.service}</span>
                <ChevronRight/>
              </button>
            ))}
          </div>

          {message && (
            <div className={message.startsWith('Marcação') ? 'notice success' : 'notice'} role="status">
              {message}
              {isDemo && <> <a href={WHATSAPP} target="_blank" rel="noopener noreferrer">Falar no WhatsApp ↗</a></>}
            </div>
          )}

          <button type="button" className="button full" disabled={!pet || !slot} onClick={book}>
            <CalendarDays/> Confirmar Marcação
          </button>
          <small>
            Ao submeter, confirma o agendamento de observação clínica presencial no consultório Novavet, Rua do Loreto, Bragança.
          </small>
        </section>
      </div>
    </main>
  );
}
