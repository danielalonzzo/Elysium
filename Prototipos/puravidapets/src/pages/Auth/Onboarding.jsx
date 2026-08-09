import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../core/firebase';
import { CheckCircle, AlertCircle, Upload } from 'lucide-react';

export default function Onboarding() {
  const { currentUser, userRole, userData } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Client Fields
  const [petName, setPetName] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [petAge, setPetAge] = useState('');
  const [petBreed, setPetBreed] = useState('');
  const [petWeight, setPetWeight] = useState('');
  const [healthConditions, setHealthConditions] = useState('');

  // Walker Fields
  const [walkerId, setWalkerId] = useState('');
  const [walkerAge, setWalkerAge] = useState('');
  const [profession, setProfession] = useState('');
  const [healthStatus, setHealthStatus] = useState('');
  const [zone, setZone] = useState('');
  const [experience, setExperience] = useState('');
  const [profilePic, setProfilePic] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
    // If onboarding is already complete, redirect to portal
    if (userData?.onboardingComplete) {
      navigate(userRole === 'walker' ? '/walker' : '/portal');
    }
  }, [currentUser, userData, navigate, userRole]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      
      if (userRole === 'client') {
        await updateDoc(userRef, {
          petName,
          ownerId,
          petAge,
          petBreed,
          petWeight,
          healthConditions,
          onboardingComplete: true
        });
        navigate('/portal');
      } else if (userRole === 'walker') {
        if (!profilePic) {
          setError('Debe subir una foto de perfil obligatoriamente.');
          setLoading(false);
          return;
        }
        // In a real scenario we upload the image to Firebase Storage here and save the URL.
        // For Phase 1 we just save the file name or mock URL.
        const mockPhotoUrl = URL.createObjectURL(profilePic); 

        await updateDoc(userRef, {
          walkerId,
          walkerAge,
          profession,
          healthStatus,
          zone,
          experience,
          photoUrl: mockPhotoUrl,
          onboardingComplete: true
        });
        navigate('/walker');
      }
    } catch (err) {
      console.error(err);
      setError('Error al guardar la información. Intente de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  if (!userRole) return <div className="text-center p-12">Cargando...</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-12">
      <div className="bg-white p-8 rounded-3xl shadow-[8px_8px_0px_0px_rgba(76,29,3,1)] border-2 border-[var(--color-brand-dark)] w-full max-w-2xl">
        <h2 className="text-3xl font-bold mb-2 text-center text-[#d66215]">
          Completa tu Perfil
        </h2>
        <p className="text-center text-gray-600 mb-8">
          Necesitamos algunos datos adicionales para {userRole === 'client' ? 'conocer a tu mascota' : 'tu perfil de paseador'}.
        </p>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {userRole === 'client' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Mascota</label>
                <input type="text" required value={petName} onChange={e => setPetName(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#d66215] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cédula del Encargado</label>
                <input type="text" required value={ownerId} onChange={e => setOwnerId(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#d66215] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Edad de la Mascota</label>
                <input type="text" required value={petAge} onChange={e => setPetAge(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#d66215] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Raza</label>
                <input type="text" required value={petBreed} onChange={e => setPetBreed(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#d66215] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
                <input type="number" required value={petWeight} onChange={e => setPetWeight(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#d66215] focus:outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Condiciones de Salud</label>
                <textarea required value={healthConditions} onChange={e => setHealthConditions(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#d66215] focus:outline-none" rows="3" placeholder="Alergias, operaciones, etc..."></textarea>
              </div>
            </div>
          )}

          {userRole === 'walker' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cédula</label>
                <input type="text" required value={walkerId} onChange={e => setWalkerId(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#d66215] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Edad</label>
                <input type="number" required value={walkerAge} onChange={e => setWalkerAge(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#d66215] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Profesión u Oficio</label>
                <input type="text" required value={profession} onChange={e => setProfession(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#d66215] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zona de Residencia (Provincia/Cantón)</label>
                <input type="text" required value={zone} onChange={e => setZone(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#d66215] focus:outline-none" placeholder="Ej. San José, Escazú" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado de Salud</label>
                <input type="text" required value={healthStatus} onChange={e => setHealthStatus(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#d66215] focus:outline-none" placeholder="Excelente, con alergias, etc..." />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Experiencia con Mascotas</label>
                <textarea required value={experience} onChange={e => setExperience(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#d66215] focus:outline-none" rows="3"></textarea>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Foto de Perfil (Obligatorio)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                  <input type="file" accept="image/*" onChange={e => setProfilePic(e.target.files[0])} className="hidden" id="photo-upload" />
                  <label htmlFor="photo-upload" className="flex flex-col items-center cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-gray-600">{profilePic ? profilePic.name : 'Sube una foto tuya'}</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          <button disabled={loading} type="submit" className="w-full mt-4 bg-[#ab1c18] hover:bg-[#8a1512] text-white py-3 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2">
            <CheckCircle className="w-5 h-5" />
            {loading ? 'Guardando...' : 'Finalizar Registro'}
          </button>
        </form>
      </div>
    </div>
  );
}
