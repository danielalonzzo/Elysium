import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LogIn, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      // Wait for auth context to update and redirect appropriately
      // For now, redirect to home which will redirect if needed based on role
      navigate('/'); 
    } catch (err) {
      setError('Fallo al iniciar sesión. Verifique sus credenciales.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="bg-white p-8 rounded-3xl shadow-[8px_8px_0px_0px_rgba(76,29,3,1)] border-2 border-[var(--color-brand-dark)] w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center text-[#d66215] flex items-center justify-center gap-2">
          <LogIn className="w-8 h-8" />
          Iniciar Sesión
        </h2>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            <div className="flex justify-end mt-2">
              <Link to="/forgot-password" className="text-sm text-[#5a92cd] hover:underline font-medium">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </div>
          
          <button 
            disabled={loading}
            type="submit" 
            className="w-full mt-4 bg-[#ab1c18] hover:bg-[#8a1512] text-white py-3 rounded-xl font-bold text-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Iniciando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 text-center text-gray-600">
          ¿No tienes una cuenta? <Link to="/register" className="text-[#5a92cd] font-bold hover:underline">Regístrate</Link>
        </div>
      </div>
    </div>
  );
}
