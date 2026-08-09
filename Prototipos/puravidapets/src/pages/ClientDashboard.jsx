import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Calendar as CalendarIcon, LogOut, CheckCircle, Clock, MapPin, User, Info, FileText, ChevronLeft, ChevronRight, Check } from 'lucide-react';

export default function ClientDashboard() {
  const { currentUser, userRole, logout, userData } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('agendar'); // 'agendar' or 'mis_citas'
  
  // Booking Wizard State
  const [step, setStep] = useState(1);
  const [serviceType, setServiceType] = useState(''); // 'paseo' or 'cuido'
  const [cuidoType, setCuidoType] = useState(''); // 'domicilio' or 'hospedaje'
  
  // Calendar State
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  
  const [selectedWalker, setSelectedWalker] = useState(''); // 'random' or walkerId
  const [notes, setNotes] = useState('');
  
  // Mock Walkers for Phase 1
  const [availableWalkers, setAvailableWalkers] = useState([]);

  useEffect(() => {
    if (!currentUser) navigate('/login');
    if (userRole && userRole !== 'client' && userRole !== 'admin') navigate('/');
  }, [currentUser, userRole, navigate]);

  if (!currentUser || userRole !== 'client') return <div className="text-center p-12">Cargando...</div>;

  const handleSearchWalkers = (e) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) {
      alert("Por favor selecciona una fecha y hora.");
      return;
    }
    // Simulate searching walkers based on date/time and zone
    setAvailableWalkers([
      { id: '1', name: 'Carlos (Paseador Experto)', zone: 'San José' },
      { id: '2', name: 'Maria (Cuidadora)', zone: 'Escazú' }
    ]);
    setStep(3); // Go to walker selection
  };

  const handleConfirmBooking = (e) => {
    e.preventDefault();
    // In Phase 2 this saves to Firestore and triggers emails.
    alert('Reserva confirmada. Se ha enviado la notificación por correo (Fase 2). Favor proceder con el pago por Sinpe Móvil al 8888-8888.');
    // Reset flow
    setStep(1);
    setSelectedDate(null);
    setSelectedTime(null);
    setActiveTab('mis_citas');
  };

  // Calendar Helpers
  const nextMonth = () => setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1));
  
  const daysInMonth = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), 1).getDay();
  
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  
  const blanks = Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`blank-${i}`} className="p-2"></div>);
  const days = Array.from({ length: daysInMonth }).map((_, i) => {
    const day = i + 1;
    const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === currentMonthDate.getMonth() && selectedDate?.getFullYear() === currentMonthDate.getFullYear();
    const isPast = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), day) < new Date(new Date().setHours(0,0,0,0));
    
    return (
      <button 
        key={`day-${day}`}
        disabled={isPast}
        onClick={() => {
          setSelectedDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), day));
          setSelectedTime(null); // Reset time when date changes
        }}
        className={`p-2 rounded-full w-10 h-10 mx-auto flex items-center justify-center transition-colors text-sm font-medium
          ${isSelected ? 'bg-[#d66215] text-white shadow-md' : isPast ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-[#d66215]/10 text-gray-700'}`}
      >
        {day}
      </button>
    );
  });

  const timeSlots = ['07:00', '08:30', '10:00', '11:30', '13:00', '14:30', '16:00', '17:30'];

  return (
    <div className="min-h-screen bg-[#FFF8F0] pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-5xl">
        
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--color-brand-dark)] tracking-tight uppercase">Hola, {userData?.name || 'Cliente'}</h1>
            <p className="text-md text-gray-500 mt-1 font-medium flex items-center gap-2">
              <span className="text-[#d66215]">Mascota:</span> {userData?.petName || 'Sin registrar'}
            </p>
          </div>
          <button onClick={logout} className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border-2 border-red-200 text-red-600 font-bold hover:bg-red-50 hover:border-red-300 transition-all">
            <LogOut size={18} /> Salir
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 max-w-fit">
          <button 
            onClick={() => { setActiveTab('agendar'); setStep(1); }} 
            className={`px-6 py-2.5 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === 'agendar' ? 'bg-[#d66215] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <CalendarIcon size={18} /> Agendar Servicio
          </button>
          <button 
            onClick={() => setActiveTab('mis_citas')} 
            className={`px-6 py-2.5 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === 'mis_citas' ? 'bg-[#d66215] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Clock size={18} /> Mis Citas
          </button>
        </div>

        {/* Content Area */}
        {activeTab === 'agendar' && (
          <div className="bg-white rounded-3xl p-6 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 max-w-3xl mx-auto relative overflow-hidden">
            
            {/* Step Indicator Background (Optional subtle touch) */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-100">
              <div className="h-full bg-[#d66215] transition-all duration-500 ease-out" style={{ width: `${(step / 4) * 100}%` }}></div>
            </div>

            {/* STEP 1: SERVICE TYPE */}
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pt-4">
                <h2 className="text-2xl md:text-3xl font-extrabold mb-8 text-center text-gray-800 tracking-tight">¿Qué tipo de servicio buscas hoy?</h2>
                <div className="grid md:grid-cols-2 gap-5">
                  
                  <button onClick={() => { setServiceType('paseo'); setStep(2); }} className="group relative p-6 border-2 border-gray-100 rounded-3xl hover:border-[#d66215] hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center gap-4 bg-white hover:bg-orange-50/30 overflow-hidden">
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                       <ChevronRight className="text-[#d66215]" />
                    </div>
                    <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center text-[#d66215] shadow-inner group-hover:scale-110 transition-transform duration-300">
                       <span className="text-4xl">🐕</span>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-xl text-gray-800 mb-2">Paseo Canino</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">Aventuras al aire libre para que tu mascota drene energía y se divierta de forma segura.</p>
                    </div>
                  </button>

                  <button onClick={() => { setServiceType('cuido'); setStep(2); }} className="group relative p-6 border-2 border-gray-100 rounded-3xl hover:border-[#ab1c18] hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center gap-4 bg-white hover:bg-red-50/30 overflow-hidden">
                     <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                       <ChevronRight className="text-[#ab1c18]" />
                    </div>
                    <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center text-[#ab1c18] shadow-inner group-hover:scale-110 transition-transform duration-300">
                       <span className="text-4xl">🏡</span>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-xl text-gray-800 mb-2">Cuido / Hospedaje</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">Atención personalizada en tu domicilio o en nuestras instalaciones seguras.</p>
                    </div>
                  </button>

                </div>
              </div>
            )}

            {/* STEP 2: CUIDO DETAILS OR DATE/TIME SELECTION */}
            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 pt-4">
                <button onClick={() => setStep(1)} className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-[#d66215] mb-6 transition-colors">
                  <ChevronLeft size={16} /> Volver
                </button>
                
                {serviceType === 'cuido' && !cuidoType ? (
                  <>
                    <h2 className="text-2xl md:text-3xl font-extrabold mb-8 text-gray-800 tracking-tight text-center">¿Cómo prefieres el cuido?</h2>
                    <div className="grid md:grid-cols-2 gap-5 mb-6">
                      <button onClick={() => setCuidoType('domicilio')} className="group p-6 border-2 border-gray-100 rounded-3xl hover:border-[#d66215] hover:shadow-md transition-all text-center">
                        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-[#d66215] mx-auto mb-4 group-hover:bg-orange-100 transition-colors">
                          <MapPin size={28} />
                        </div>
                        <h3 className="font-bold text-lg text-gray-800">A domicilio</h3>
                        <p className="text-xs text-gray-500 mt-2">En la comodidad de su hogar</p>
                      </button>
                      <button onClick={() => setCuidoType('hospedaje')} className="group p-6 border-2 border-gray-100 rounded-3xl hover:border-[#d66215] hover:shadow-md transition-all text-center">
                         <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-[#d66215] mx-auto mb-4 group-hover:bg-orange-100 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                        </div>
                        <h3 className="font-bold text-lg text-gray-800">Hospedaje</h3>
                        <p className="text-xs text-gray-500 mt-2">En casa de nuestros cuidadores</p>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl md:text-3xl font-extrabold mb-2 text-gray-800 tracking-tight text-center">Seleccione Fecha y Hora</h2>
                    <p className="text-center text-gray-500 mb-8 text-sm">Elige el momento ideal para la aventura de tu mascota.</p>
                    
                    <div className="bg-gray-50/50 rounded-3xl p-6 border border-gray-100 mb-8 max-w-lg mx-auto">
                      {/* Calendar Header */}
                      <div className="flex items-center justify-between mb-6">
                        <button onClick={prevMonth} className="p-2 rounded-full hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all">
                          <ChevronLeft size={20} className="text-gray-600" />
                        </button>
                        <h3 className="font-bold text-lg text-gray-800 uppercase tracking-wider">
                          {monthNames[currentMonthDate.getMonth()]} {currentMonthDate.getFullYear()}
                        </h3>
                        <button onClick={nextMonth} className="p-2 rounded-full hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all">
                          <ChevronRight size={20} className="text-gray-600" />
                        </button>
                      </div>
                      
                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7 gap-1 text-center mb-2">
                        {dayNames.map(day => (
                          <div key={day} className="text-xs font-bold text-gray-400 py-2">{day}</div>
                        ))}
                        {blanks}
                        {days}
                      </div>
                    </div>

                    {/* Time Slots (Shows only if date is selected) */}
                    {selectedDate && (
                      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-lg mx-auto">
                        <h4 className="text-center font-bold text-gray-700 mb-4 flex items-center justify-center gap-2">
                          <Clock size={16} className="text-[#d66215]"/> Horarios Disponibles
                        </h4>
                        <div className="grid grid-cols-4 gap-3 mb-8">
                          {timeSlots.map(time => (
                            <button 
                              key={time}
                              onClick={() => setSelectedTime(time)}
                              className={`py-2 rounded-xl text-sm font-bold transition-all border-2
                                ${selectedTime === time 
                                  ? 'border-[#d66215] bg-[#d66215] text-white shadow-md' 
                                  : 'border-gray-200 text-gray-600 hover:border-[#d66215]/50 hover:bg-orange-50'}`}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-center mt-6">
                      <button 
                        onClick={handleSearchWalkers} 
                        disabled={!selectedDate || !selectedTime}
                        className="w-full max-w-md bg-[#ab1c18] hover:bg-[#8a1512] text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
                      >
                        Buscar Paseadores Disponibles
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* STEP 3: WALKER SELECTION */}
            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 pt-4">
                <button onClick={() => setStep(2)} className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-[#d66215] mb-6 transition-colors">
                  <ChevronLeft size={16} /> Volver
                </button>
                <h2 className="text-2xl md:text-3xl font-extrabold mb-8 text-gray-800 tracking-tight text-center">Paseadores Disponibles</h2>
                
                <div className="max-w-lg mx-auto">
                  {availableWalkers.length > 0 ? (
                    <div className="space-y-4 mb-8">
                      <label className={`flex items-center gap-4 p-5 border-2 rounded-2xl cursor-pointer transition-all ${selectedWalker === 'random' ? 'border-[#d66215] bg-orange-50/50' : 'border-gray-100 hover:border-[#d66215]/50'}`}>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedWalker === 'random' ? 'border-[#d66215] bg-[#d66215]' : 'border-gray-300'}`}>
                          {selectedWalker === 'random' && <Check size={14} className="text-white" />}
                        </div>
                        <input type="radio" name="walker" value="random" className="hidden" onChange={(e) => setSelectedWalker(e.target.value)} />
                        <div>
                          <span className="font-bold text-gray-800 text-lg block">Cualquiera disponible</span>
                          <span className="text-sm text-gray-500">Asignación automática más rápida</span>
                        </div>
                      </label>
                      
                      {availableWalkers.map(walker => (
                        <label key={walker.id} className={`flex items-center gap-4 p-5 border-2 rounded-2xl cursor-pointer transition-all ${selectedWalker === walker.id ? 'border-[#d66215] bg-orange-50/50' : 'border-gray-100 hover:border-[#d66215]/50'}`}>
                           <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedWalker === walker.id ? 'border-[#d66215] bg-[#d66215]' : 'border-gray-300'}`}>
                            {selectedWalker === walker.id && <Check size={14} className="text-white" />}
                          </div>
                          <input type="radio" name="walker" value={walker.id} className="hidden" onChange={(e) => setSelectedWalker(e.target.value)} />
                          <div className="flex-1 flex justify-between items-center">
                            <div>
                              <span className="font-bold text-gray-800 block">{walker.name}</span>
                              <span className="text-sm text-gray-500 flex items-center gap-1 mt-1"><MapPin size={12}/> {walker.zone}</span>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                               <User size={20} />
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-orange-50 text-orange-800 p-6 rounded-2xl mb-8 border border-orange-100 flex items-start gap-4">
                      <Info className="w-6 h-6 flex-shrink-0 mt-1" />
                      <p className="text-sm font-medium">No hay paseadores disponibles en ese horario exacto. Puedes continuar la reserva y notificaremos al equipo para asignarte uno manualmente o proponerte un horario cercano.</p>
                    </div>
                  )}
                  
                  <button onClick={() => setStep(4)} disabled={availableWalkers.length > 0 && !selectedWalker} className="w-full bg-[#ab1c18] hover:bg-[#8a1512] text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed">
                    Continuar al Resumen
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: SUMMARY & CONFIRM */}
            {step === 4 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 pt-4">
                <button onClick={() => setStep(3)} className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-[#d66215] mb-6 transition-colors">
                  <ChevronLeft size={16} /> Volver
                </button>
                <h2 className="text-2xl md:text-3xl font-extrabold mb-8 text-gray-800 tracking-tight text-center">Confirme su Reserva</h2>
                
                <div className="max-w-lg mx-auto">
                  <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 mb-6 shadow-sm">
                    <h3 className="font-bold text-gray-400 uppercase text-xs tracking-wider mb-4 border-b pb-2">Detalles del Servicio</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 font-medium flex items-center gap-2"><FileText size={16}/> Servicio</span>
                        <span className="font-bold text-gray-800 capitalize text-right">{serviceType} {cuidoType ? `(${cuidoType})` : ''}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 font-medium flex items-center gap-2"><CalendarIcon size={16}/> Fecha</span>
                        <span className="font-bold text-gray-800">{selectedDate?.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 font-medium flex items-center gap-2"><Clock size={16}/> Hora</span>
                        <span className="font-bold text-[#d66215]">{selectedTime}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 font-medium flex items-center gap-2"><User size={16}/> Paseador</span>
                        <span className="font-bold text-gray-800 text-right">{selectedWalker === 'random' ? 'Asignación automática' : (availableWalkers.find(w => w.id === selectedWalker)?.name || 'Pendiente')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-8">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Notas adicionales (opcional)</label>
                    <textarea 
                      value={notes} 
                      onChange={e => setNotes(e.target.value)} 
                      className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 focus:border-[#d66215] focus:outline-none bg-gray-50/50 transition-colors" 
                      rows="3" 
                      placeholder="Ej. Mi perro es un poco tímido al principio..."
                    ></textarea>
                  </div>

                  <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl mb-8 flex gap-4 text-blue-800 items-start">
                    <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-500" />
                    <p className="text-sm font-medium leading-relaxed">El pago se realiza mediante <strong>Sinpe Móvil</strong>. Al confirmar, te enviaremos los detalles e instrucciones a tu correo electrónico.</p>
                  </div>

                  <button onClick={handleConfirmBooking} className="w-full bg-gradient-to-r from-[#d66215] to-[#f48a42] hover:from-[#c2560f] hover:to-[#e67527] text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3">
                    <CheckCircle className="w-6 h-6" />
                    Confirmar Marcação
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'mis_citas' && (
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-extrabold mb-8 text-gray-800 tracking-tight">Historial de Citas</h2>
            <div className="border-2 border-dashed border-gray-200 bg-gray-50/50 rounded-3xl p-12 text-center text-gray-500 max-w-lg mx-auto">
              <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="font-medium text-lg text-gray-600 mb-2">Aún no tienes citas registradas.</p>
              <p className="text-sm text-gray-400 mb-6">Tus próximas aventuras caninas aparecerán aquí.</p>
              <button onClick={() => { setActiveTab('agendar'); setStep(1); }} className="text-[#d66215] font-bold hover:underline">
                Agendar mi primera cita
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

