import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Users, Calendar, LogOut, MessageSquare, ClipboardList } from 'lucide-react';

export default function AssessorDashboard() {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) navigate('/login');
    if (userRole && userRole !== 'assessor' && userRole !== 'admin') navigate('/');
  }, [currentUser, userRole, navigate]);

  if (!currentUser || (userRole !== 'assessor' && userRole !== 'admin')) return <div className="text-center p-12">Cargando...</div>;

  return (
    <div className="min-h-screen bg-[#FFF8F0] pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-brand-dark)]">Panel de Asesor</h1>
            <p className="text-sm text-gray-500">Gestión de clientes y agenda</p>
          </div>
          <button onClick={logout} className="flex items-center gap-2 text-red-600 font-bold hover:underline">
            <LogOut size={20} /> Salir
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-[var(--color-brand-dark)] hover:bg-[#5a92cd]/10 cursor-pointer transition-colors">
            <Users className="w-8 h-8 text-[#5a92cd] mb-4" />
            <h3 className="font-bold text-lg">Directorio</h3>
            <p className="text-sm text-gray-500">Ver clientes y paseadores</p>
          </div>
          <div onClick={() => navigate('/prospects')} className="bg-white rounded-2xl p-6 shadow-sm border-2 border-[var(--color-brand-dark)] hover:bg-[#5a92cd]/10 cursor-pointer transition-colors">
            <ClipboardList className="w-8 h-8 text-[#5a92cd] mb-4" />
            <h3 className="font-bold text-lg">Prospectos (Simulador)</h3>
            <p className="text-sm text-gray-500">Ver clientes potenciales del simulador</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-[var(--color-brand-dark)] hover:bg-[#5a92cd]/10 cursor-pointer transition-colors">
            <Calendar className="w-8 h-8 text-[#5a92cd] mb-4" />
            <h3 className="font-bold text-lg">Agenda General</h3>
            <p className="text-sm text-gray-500">Revisar citas de la semana y asignar paseadores</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-[var(--color-brand-dark)] hover:bg-[#5a92cd]/10 cursor-pointer transition-colors">
            <MessageSquare className="w-8 h-8 text-[#5a92cd] mb-4" />
            <h3 className="font-bold text-lg">Notificaciones</h3>
            <p className="text-sm text-gray-500">Alertas de servicios sin paseador asignado</p>
          </div>
        </div>
      </div>
    </div>
  );
}
