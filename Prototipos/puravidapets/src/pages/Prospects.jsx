import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../core/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Users, Phone, MapPin, PawPrint, Calendar, Mail, Clock, AlertTriangle } from 'lucide-react';

export default function Prospects() {
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (userRole !== 'admin' && userRole !== 'assessor') {
      navigate('/');
      return;
    }

    const fetchProspects = async () => {
      try {
        const q = query(collection(db, 'prospects'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProspects(data);
      } catch (error) {
        console.error("Error fetching prospects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProspects();
  }, [currentUser, userRole, navigate]);

  if (loading) return <div className="text-center p-12">Cargando prospectos...</div>;

  const getScheduleLabel = (val) => {
    switch (val) {
      case 'busy_professional': return 'Agenda ocupada';
      case 'rotating_couple': return 'Horarios rotativos';
      case 'limited_mobility': return 'Limitaciones físicas';
      case 'other': return 'Otra situación';
      default: return val || 'N/A';
    }
  };

  const getVaccineLabel = (val) => {
    switch (val) {
      case 'current': return 'Al día';
      case 'pending': return 'Pendiente';
      case 'not_current': return 'No está al día';
      default: return val || 'N/A';
    }
  };

  const getBehaviorLabel = (val) => {
    switch (val) {
      case 'low': return 'Tranquilos / Sociables';
      case 'medium': return 'Requieren adaptación';
      case 'high': return 'Antecedentes (Agresividad/Miedo)';
      default: return val || 'N/A';
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8F0] pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-brand-dark)]">Prospectos y Simulaciones</h1>
            <p className="text-sm text-gray-500">Gestión de clientes potenciales que usaron el simulador</p>
          </div>
          <button onClick={() => navigate(-1)} className="text-[var(--color-brand-orange)] font-bold hover:underline">
            Volver al Dashboard
          </button>
        </div>

        {prospects.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-200">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Aún no hay prospectos registrados.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {prospects.map((prospect) => (
              <div key={prospect.id} className="bg-white rounded-2xl p-6 shadow-sm border-2 border-transparent hover:border-[var(--color-brand-orange)] transition-colors flex flex-col lg:flex-row gap-6">
                
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                      {prospect.status || 'Nuevo'}
                    </span>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar size={14} /> 
                      {prospect.createdAt?.toDate().toLocaleDateString('es-CR', { dateStyle: 'medium', timeStyle: 'short' }) || 'Fecha desconocida'}
                    </span>
                  </div>
                  
                  <div className="border-b border-gray-100 pb-4">
                    <h3 className="text-2xl font-bold text-[var(--color-brand-dark)] mb-1">
                      {prospect.fullName || prospect.contact || 'Sin Nombre'}
                    </h3>
                    <p className="text-[var(--color-brand-orange)] font-bold uppercase tracking-wider text-sm">
                      Servicio: {prospect.service}
                    </p>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-700">
                        <MapPin size={16} className="text-[var(--color-brand-orange)]" />
                        <span><strong>Zona:</strong> {prospect.district || prospect.location || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Phone size={16} className="text-[var(--color-brand-orange)]" />
                        <span><strong>Tel:</strong> {prospect.phone || prospect.contact || 'N/A'}</span>
                      </div>
                      {prospect.email && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <Mail size={16} className="text-[var(--color-brand-orange)]" />
                          <span><strong>Correo:</strong> {prospect.email}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 text-gray-700">
                        <Clock size={16} className="text-gray-500 mt-0.5 shrink-0" />
                        <div>
                          <strong>Perfil/Horario:</strong> <br/> 
                          {getScheduleLabel(prospect.scheduleSituation)}
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-gray-700">
                        <PawPrint size={16} className="text-gray-500 mt-0.5 shrink-0" />
                        <div>
                          <strong>Frecuencia esperada:</strong> <br/>
                          {prospect.walksPerWeek} días/sem, {prospect.averageWalkMinutes} min
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap gap-2 text-xs font-medium">
                    {prospect.inServiceArea && <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-200">En zona cobertura</span>}
                    {prospect.monthlyPlanInterest && <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded-md border border-purple-200">Interés mensual</span>}
                    {prospect.emergencyContact && <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md border border-emerald-200">Contacto emergencia</span>}
                  </div>
                </div>

                <div className="lg:w-80 bg-orange-50 rounded-xl p-4 border border-orange-100 flex flex-col">
                  <h4 className="font-bold text-[var(--color-brand-dark)] mb-3 flex items-center gap-2">
                    <PawPrint size={18} className="text-[var(--color-brand-orange)]" />
                    Manada ({prospect.numDogs})
                  </h4>
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-2 mb-4">
                    {prospect.dogs && prospect.dogs.map((dog, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-lg text-sm border border-orange-200 shadow-sm">
                        <div className="font-bold mb-1 text-[var(--color-brand-dark)] border-b border-orange-100 pb-1">Perrito #{idx + 1}</div>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <div className="text-gray-600"><strong>Tamaño:</strong> {dog.size || 'N/A'}</div>
                          <div className="text-gray-600"><strong>Edad:</strong> {dog.age || 'N/A'}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto space-y-2 bg-white p-3 rounded-lg border border-orange-200 text-sm">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                      <span className="text-gray-700"><strong>Vacunas:</strong> {getVaccineLabel(prospect.vaccinationStatus)}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                      <span className="text-gray-700"><strong>Conducta:</strong> {getBehaviorLabel(prospect.behaviorRisk)}</span>
                    </div>
                  </div>
                </div>
                
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
