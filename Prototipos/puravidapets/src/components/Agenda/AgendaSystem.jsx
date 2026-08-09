import React, { useState } from 'react';
import MapLocationPicker from './MapLocationPicker';
import { format, addDays, startOfToday } from 'date-fns';

export default function AgendaSystem({ onSchedule, pets = [], submitting = false }) {
  const [selectedDate, setSelectedDate] = useState(addDays(startOfToday(), 1));
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [petId, setPetId] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [notes, setNotes] = useState('');

  const dates = Array.from({ length: 7 }).map((_, i) => addDays(startOfToday(), i + 1));

  const handleSchedule = () => {
    if (!petId) {
      alert("Selecciona la mascota que recibirá el servicio.");
      return;
    }
    if (!selectedLocation) {
      alert("Por favor selecciona una ubicación en el mapa.");
      return;
    }
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const scheduledStartAt = new Date(selectedDate);
    scheduledStartAt.setHours(hours, minutes, 0, 0);
    const appointmentData = {
      scheduledStartAt,
      durationMinutes,
      petId,
      location: selectedLocation,
      notes,
    };

    if (onSchedule) onSchedule(appointmentData);
  };

  return (
    <div className="bg-[var(--bg-card)] p-6 rounded-2xl shadow-[8px_8px_0px_0px_rgba(76,29,3,1)] border-2 border-[var(--color-brand-dark)] text-[var(--text-primary)]">
      <h2 className="text-3xl font-display text-[var(--color-brand-orange)] mb-4">Agendar Paseo</h2>

      <div className="mb-6">
        <h3 className="text-xl font-bold mb-2">1. Mascota</h3>
        {pets.length === 0 ? (
          <p className="rounded-xl bg-amber-50 text-amber-800 p-3 text-sm">Primero un administrador debe registrar al menos una mascota en tu cuenta.</p>
        ) : (
          <select value={petId} onChange={(event) => setPetId(event.target.value)} className="w-full p-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-transparent">
            <option value="">Seleccionar mascota</option>
            {pets.map((pet) => <option key={pet.id} value={pet.id}>{pet.name}</option>)}
          </select>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-bold mb-2">2. Día, hora y duración</h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {dates.map((date) => {
            const isSelected = selectedDate.getTime() === date.getTime();
            return (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                  isSelected
                  ? 'bg-[var(--color-brand-orange)] text-white'
                  : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300'
                }`}
              >
                {format(date, 'MMM dd')}
              </button>
            )
          })}
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <select value={selectedTime} onChange={(event) => setSelectedTime(event.target.value)} className="p-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-transparent">
            {['07:00', '08:00', '09:00', '10:00', '14:00', '15:00', '16:00', '17:00'].map((time) => <option key={time}>{time}</option>)}
          </select>
          <select value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))} className="p-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-transparent">
            {[30, 60, 90, 120].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutos</option>)}
          </select>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-bold mb-2">3. Ubicación de Recogida</h3>
        <p className="text-sm text-[var(--text-secondary)] mb-2">Marca en el mapa dónde recogeremos a tu mascota.</p>
        <MapLocationPicker onLocationSelect={setSelectedLocation} />
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-bold mb-2">4. Notas Adicionales</h3>
        <textarea
          className="w-full p-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-transparent focus:border-[var(--color-brand-orange)] focus:outline-none"
          rows="3"
          placeholder="E.g. El perro es un poco tímido..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        ></textarea>
      </div>

      <button
        onClick={handleSchedule}
        disabled={submitting || pets.length === 0}
        className="w-full py-4 bg-[var(--color-brand-blue)] hover:bg-[var(--color-brand-red)] text-white font-bold rounded-xl text-lg shadow-[4px_4px_0px_0px_rgba(76,29,3,1)] transition-transform hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0"
      >
        {submitting ? 'Reservando…' : 'Confirmar Paseo'}
      </button>
    </div>
  );
}
