import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserPlus, AlertCircle, User, Dog } from 'lucide-react';

export default function Register() {
  const [role, setRole] = useState('client'); // 'client' or 'walker'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const fetchCountryCode = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (data && data.country_calling_code) {
          setPhone(data.country_calling_code + ' ');
        } else {
          setPhone('+506 ');
        }
      } catch (error) {
        console.error('Error fetching country code:', error);
        setPhone('+506 ');
      }
    };
    fetchCountryCode();
  }, []);
  
  const { signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 6) {
      return setError('La contraseña debe tener al menos 6 caracteres.');
    }

    try {
      setError('');
      setLoading(true);
      await signup(email, password, role, { name, phone });
      navigate('/onboarding');
    } catch (err) {
      console.error(err);
      setError('Fallo al crear la cuenta. ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-12">
      <div className="bg-white p-8 rounded-3xl shadow-[8px_8px_0px_0px_rgba(76,29,3,1)] border-2 border-[var(--color-brand-dark)] w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center text-[#d66215] flex items-center justify-center gap-2">
          <UserPlus className="w-8 h-8" />
          Crear Cuenta
        </h2>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">¿Qué tipo de usuario eres?</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole('client')}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                  role === 'client' 
                  ? 'border-[#5a92cd] bg-[#5a92cd]/10 text-[#5a92cd]' 
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <User className="w-6 h-6" />
                <span className="font-bold">Cliente</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('walker')}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                  role === 'walker' 
                  ? 'border-[#d66215] bg-[#d66215]/10 text-[#d66215]' 
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <Dog className="w-6 h-6" />
                <span className="font-bold">Paseador</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
            <input 
              type="text" 
              required 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#d66215] focus:outline-none transition-colors"
              placeholder="Juan Pérez"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input 
              type="tel" 
              required 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#d66215] focus:outline-none transition-colors"
              placeholder="+506 8888 8888"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#d66215] focus:outline-none transition-colors"
              placeholder="tu@email.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#d66215] focus:outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>
          
          <button 
            disabled={loading}
            type="submit" 
            className="w-full mt-4 bg-[#ab1c18] hover:bg-[#8a1512] text-white py-3 rounded-xl font-bold text-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Creando cuenta...' : 'Siguiente'}
          </button>
        </form>

        <div className="mt-6 text-center text-gray-600">
          ¿Ya tienes una cuenta? <Link to="/login" className="text-[#5a92cd] font-bold hover:underline">Inicia Sesión</Link>
        </div>
      </div>
    </div>
  );
}
