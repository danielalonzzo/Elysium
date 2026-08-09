import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { resetPassword } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setMessage('');
      setError('');
      setLoading(true);
      await resetPassword(email);
      setMessage('Verifica tu bandeja de entrada. Te hemos enviado un enlace para restablecer tu contraseña.');
    } catch (err) {
      console.error("Error completo de Firebase Auth:", err);
      if (err.code === 'auth/user-not-found') {
         setError('Este correo no está registrado. Por favor regístrate.');
      } else {
         setError(`Error enviando correo: ${err.message || 'Desconocido'}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="bg-white p-8 rounded-3xl shadow-[8px_8px_0px_0px_rgba(76,29,3,1)] border-2 border-[var(--color-brand-dark)] w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center text-[#d66215] flex items-center justify-center gap-2">
          <KeyRound className="w-8 h-8" />
          Restablecer
        </h2>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {message && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{message}</p>
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
            <p className="text-xs text-gray-500 mt-2">
              Ingresa el correo asociado a tu cuenta y te enviaremos instrucciones para restablecer tu contraseña.
            </p>
          </div>
          
          <button 
            disabled={loading}
            type="submit" 
            className="w-full mt-4 bg-[#ab1c18] hover:bg-[#8a1512] text-white py-3 rounded-xl font-bold text-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Restablecer Contraseña'}
          </button>
        </form>

        <div className="mt-6 text-center text-gray-600">
          <Link to="/login" className="text-[#5a92cd] font-bold hover:underline">Volver a Iniciar Sesión</Link>
        </div>
      </div>
    </div>
  );
}
