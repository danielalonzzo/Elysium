import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Users, FileText, Settings, LogOut, DollarSign, ClipboardList } from 'lucide-react';

export default function AdminDashboard() {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) navigate('/login');
    if (userRole && userRole !== 'admin') navigate('/');
  }, [currentUser, userRole, navigate]);

  if (!currentUser || userRole !== 'admin') return <div className="text-center p-12">Cargando...</div>;

  return (
    <div className="min-h-screen bg-[#FFF8F0] pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-brand-dark)]">Panel de Administración</h1>
            <p className="text-sm text-gray-500">Gestión total de la plataforma (adrian.pochet@puravidapets.cr)</p>
          </div>
          <button onClick={logout} className="flex items-center gap-2 text-red-600 font-bold hover:underline">
            <LogOut size={20} /> Salir
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-[var(--color-brand-dark)] hover:bg-orange-50 cursor-pointer transition-colors">
            <Users className="w-8 h-8 text-[#d66215] mb-4" />
            <h3 className="font-bold text-lg">Usuarios y Roles</h3>
            <p className="text-sm text-gray-500">Gestionar clientes, paseadores y asesores</p>
          </div>
          <div onClick={() => navigate('/prospects')} className="bg-white rounded-2xl p-6 shadow-sm border-2 border-[var(--color-brand-dark)] hover:bg-orange-50 cursor-pointer transition-colors">
            <ClipboardList className="w-8 h-8 text-[#d66215] mb-4" />
            <h3 className="font-bold text-lg">Prospectos (Simulador)</h3>
            <p className="text-sm text-gray-500">Ver clientes potenciales del simulador</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-[var(--color-brand-dark)] hover:bg-orange-50 cursor-pointer transition-colors">
            <FileText className="w-8 h-8 text-[#d66215] mb-4" />
            <h3 className="font-bold text-lg">Agenda General</h3>
            <p className="text-sm text-gray-500">Supervisar citas y forzar publicación de paseadores</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-[var(--color-brand-dark)] hover:bg-orange-50 cursor-pointer transition-colors">
            <DollarSign className="w-8 h-8 text-[#d66215] mb-4" />
            <h3 className="font-bold text-lg">Finanzas</h3>
            <p className="text-sm text-gray-500">Control de pagos, transferencias y Sinpe</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-[var(--color-brand-dark)] hover:bg-orange-50 cursor-pointer transition-colors">
            <Settings className="w-8 h-8 text-[#d66215] mb-4" />
            <h3 className="font-bold text-lg">Configuración</h3>
            <p className="text-sm text-gray-500">Ajustes globales del portal</p>
          </div>
        </div>
      </div>
    </div>
  );
}
