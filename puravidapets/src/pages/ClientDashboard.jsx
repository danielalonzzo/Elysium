import { useState } from 'react';
import { Clock, Image as ImageIcon, Video, Calendar, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ClientDashboard() {
  const [activeTab, setActiveTab] = useState('bitacora');
  
  // Mock Data
  const wallet = {
    plan: "Pura Vida",
    totalHours: 12,
    usedHours: 4.5,
    remainingHours: 7.5
  };

  const logs = [
    { id: 1, date: "12 Jul 2026", type: "Paseo", duration: "1.5 hrs", media: "📸 1 Foto nueva", notes: "Ruta por la sabana. Todo excelente." },
    { id: 2, date: "09 Jul 2026", type: "Paseo", duration: "1.0 hr", media: "🎥 1 Video", notes: "Jugamos con la pelota. Estaba muy activo." },
    { id: 3, date: "05 Jul 2026", type: "Paseo", duration: "2.0 hrs", media: "📸 3 Fotos", notes: "Se portó muy bien con otros perros." },
  ];

  return (
    <div className="min-h-screen bg-[#FFF8F0] dark:bg-[#0E0D0C] pt-24 pb-12 transition-colors duration-300">
      <div className="container mx-auto px-4 max-w-5xl">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/" className="p-2 bg-white dark:bg-[#1A1918] rounded-full shadow hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors border border-black/10 dark:border-white/10">
            <ArrowLeft size={24} className="text-[#2D2D2D] dark:text-[#F5F0E8]" />
          </Link>
          <h1 className="text-3xl font-bold font-[var(--font-display)] text-[#2D2D2D] dark:text-[#F5F0E8]">
            Portal de Cliente
          </h1>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Sidebar / Billetera */}
          <div className="md:col-span-1">
            <div className="bg-[#2D2D2D] rounded-3xl p-6 text-white border-4 border-[var(--color-brand-orange)] shadow-xl sticky top-28 dark:bg-[#1A1918] dark:border-[#FF8A00]/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Tu Billetera</h2>
                <Clock className="text-[var(--color-brand-orange)]" />
              </div>
              
              <div className="bg-white/10 rounded-2xl p-4 mb-6">
                <p className="text-sm text-gray-300 mb-1">Plan Actual</p>
                <p className="text-xl font-bold text-[var(--color-tier-puravida)]">{wallet.plan}</p>
              </div>

              <div className="text-center mb-6">
                <div className="text-6xl font-black text-[var(--color-brand-orange)] mb-2">
                  {wallet.remainingHours}
                </div>
                <p className="text-sm font-medium uppercase tracking-wide text-gray-300">Horas Disponibles</p>
              </div>
              
              <div className="flex justify-between text-sm bg-black/20 rounded-xl p-3">
                <span>Total: {wallet.totalHours}h</span>
                <span>Usadas: {wallet.usedHours}h</span>
              </div>
              
              <button className="w-full mt-6 bg-white dark:bg-[var(--color-brand-orange)] dark:text-white dark:hover:bg-[#e07a00] text-[#2D2D2D] font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors">
                Reservar Paseo
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="md:col-span-2">
            <div className="bg-white dark:bg-[#1A1918] rounded-3xl p-6 shadow-lg border border-black/10 dark:border-white/10">
              
              {/* Tabs */}
              <div className="flex gap-4 border-b-2 border-black/10 dark:border-white/10 mb-6">
                <button 
                  onClick={() => setActiveTab('bitacora')}
                  className={`pb-4 px-2 font-bold text-lg transition-colors border-b-4 ${activeTab === 'bitacora' ? 'border-[var(--color-brand-orange)] text-[#2D2D2D] dark:text-[#F5F0E8]' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                >
                  Bitácora de Paseos
                </button>
                <button 
                  onClick={() => setActiveTab('galeria')}
                  className={`pb-4 px-2 font-bold text-lg transition-colors border-b-4 ${activeTab === 'galeria' ? 'border-[var(--color-brand-orange)] text-[#2D2D2D] dark:text-[#F5F0E8]' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                >
                  Galería Semanal
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'bitacora' && (
                <div className="space-y-4">
                  {logs.map(log => (
                    <div key={log.id} className="bg-[#FFF8F0] dark:bg-[#0E0D0C] rounded-2xl p-5 border-l-8 border-[var(--color-brand-orange)] border border-black/10 dark:border-white/10 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 font-medium">
                          <Calendar size={16} />
                          <span>{log.date}</span>
                        </div>
                        <span className="bg-white dark:bg-[#1A1918] px-3 py-1 rounded-full text-sm font-bold text-[#2D2D2D] dark:text-[#F5F0E8] shadow-sm border border-black/10 dark:border-white/10">
                          {log.duration} descontados
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-[#2D2D2D] dark:text-[#F5F0E8] mb-2">{log.type}</h3>
                      <p className="text-gray-700 dark:text-gray-300 mb-3">{log.notes}</p>
                      <div className="inline-block bg-[var(--color-tier-basic)]/10 text-[var(--color-brand-orange)] px-3 py-1 rounded-lg text-sm font-semibold">
                        {log.media}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'galeria' && (
                <div className="grid grid-cols-2 gap-4">
                  {/* Mock gallery grid */}
                  <div className="aspect-square bg-gray-200 dark:bg-[#2D2D2D] rounded-2xl flex items-center justify-center text-gray-400 dark:text-gray-500 border-2 border-dashed border-gray-300 dark:border-gray-700">
                    <ImageIcon size={40} />
                  </div>
                  <div className="aspect-square bg-gray-200 dark:bg-[#2D2D2D] rounded-2xl flex items-center justify-center text-gray-400 dark:text-gray-500 border-2 border-dashed border-gray-300 dark:border-gray-700">
                    <Video size={40} />
                  </div>
                  <div className="aspect-square bg-gray-200 dark:bg-[#2D2D2D] rounded-2xl flex items-center justify-center text-gray-400 dark:text-gray-500 border-2 border-dashed border-gray-300 dark:border-gray-700">
                    <ImageIcon size={40} />
                  </div>
                  <div className="aspect-square bg-[var(--color-brand-orange)]/10 rounded-2xl flex items-center justify-center text-[var(--color-brand-orange)] font-bold text-center p-4">
                    Más fotos en la app móvil pronto...
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
