import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Calendar, CheckCircle } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../core/firebase';

export default function WalkerDashboard() {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [published, setPublished] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
    if (userRole && userRole !== 'walker' && userRole !== 'admin') {
      navigate('/portal');
    }
  }, [currentUser, userRole, navigate]);

  async function handlePublish() {
    setLoading(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        agendaStatus: 'published',
        lastPublishedAt: new Date().toISOString()
      });
      setPublished(true);
      alert('Agenda publicada con éxito. Se ha enviado un correo de confirmación con el resumen.'); // Mocking email
    } catch (error) {
      console.error(error);
      alert('Error publicando la agenda.');
    } finally {
      setLoading(false);
    }
  }

  if (!currentUser || userRole !== 'walker') return <div className="text-center p-12">Cargando...</div>;

  return (
    <div className="min-h-screen bg-[#FFF8F0] pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-brand-dark)]">Dashboard de Paseador</h1>
            <p className="text-sm text-gray-500">Gestiona tu agenda semanal</p>
          </div>
          <button onClick={logout} className="flex items-center gap-2 text-red-600 font-bold hover:underline">
            <LogOut size={20} /> Salir
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Scheduling Block */}
          <div className="bg-white rounded-3xl p-6 shadow-[4px_4px_0px_0px_rgba(76,29,3,1)] border-2 border-[var(--color-brand-dark)]">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-6 h-6 text-[#d66215]" />
              <h2 className="text-xl font-bold text-[var(--color-brand-dark)]">Disponibilidad Semanal</h2>
            </div>
            
            <p className="text-gray-600 mb-6">
              Bloquea los horarios en los que <strong>NO</strong> estarás disponible esta semana. Recuerda publicar tu agenda todos los domingos antes de las 20:00h.
            </p>

            {/* Mock Schedule grid */}
            <div className="space-y-4 mb-8">
              {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map(day => (
                <div key={day} className="flex items-center justify-between p-3 border-2 border-gray-100 rounded-xl">
                  <span className="font-bold">{day}</span>
                  <select className="border-2 border-gray-200 rounded-lg p-1 text-sm focus:outline-none focus:border-[#d66215]">
                    <option>Disponible todo el día</option>
                    <option>Mañana ocupada</option>
                    <option>Tarde ocupada</option>
                    <option>No disponible</option>
                  </select>
                </div>
              ))}
            </div>

            <button 
              onClick={handlePublish}
              disabled={loading || published}
              className={`w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-colors ${published ? 'bg-green-600' : 'bg-[#ab1c18] hover:bg-[#8a1512]'}`}
            >
              {published ? <CheckCircle className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
              {published ? 'Agenda Publicada' : (loading ? 'Publicando...' : 'Publicar Agenda Semanal')}
            </button>
            {published && (
              <p className="text-center text-sm text-green-700 mt-2 font-medium">
                Tu agenda ya ha sido publicada. Los clientes ahora pueden ver tu disponibilidad.
              </p>
            )}
          </div>

          {/* Stats/Info Block */}
          <div className="space-y-8">
            <div className="bg-white rounded-3xl p-6 shadow-[4px_4px_0px_0px_rgba(76,29,3,1)] border-2 border-[var(--color-brand-dark)]">
              <h2 className="text-xl font-bold text-[var(--color-brand-dark)] mb-4">Próximos Paseos</h2>
              <div className="text-gray-500 text-sm p-4 border-2 border-dashed border-gray-300 rounded-xl text-center">
                Aún no tienes paseos agendados para esta semana.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
