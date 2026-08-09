import { useState } from 'react';
import { LockKeyhole, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const AUTH_ERRORS = {
  'auth/invalid-credential': 'El correo o la contraseña no son correctos.',
  'auth/too-many-requests': 'Demasiados intentos. Intenta de nuevo más tarde.',
  'auth/network-request-failed': 'No fue posible conectar con Firebase Auth.',
};

export default function AccessPanel({ title = 'Acceso privado', allowedRoles = [] }) {
  const { currentUser, userRole, login, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const roleDenied = currentUser && allowedRoles.length > 0 && !allowedRoles.includes(userRole);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await login(email.trim(), password);
    } catch (authError) {
      setError(AUTH_ERRORS[authError.code] || 'No fue posible iniciar sesión.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md bg-white dark:bg-[#1A1918] rounded-3xl p-8 shadow-xl border border-black/10 dark:border-white/10">
        <LockKeyhole className="text-[var(--color-brand-orange)] mb-4" size={36} />
        <h1 className="text-2xl font-bold text-[var(--color-brand-dark)] dark:text-[#F5F0E8] mb-2">{title}</h1>
        {roleDenied ? (
          <>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Tu sesión tiene el rol <strong>{userRole}</strong> y no puede abrir esta sección.
            </p>
            <button onClick={logout} className="w-full bg-[var(--color-brand-orange)] text-white font-bold py-3 rounded-xl">
              Cerrar sesión
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">Ingresa con la cuenta provisionada por Pura Vida Pets.</p>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-200">
              Correo
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-4 py-3"
              />
            </label>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-200">
              Contraseña
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-4 py-3"
              />
            </label>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <button disabled={submitting} className="w-full flex items-center justify-center gap-2 bg-[var(--color-brand-blue)] text-white font-bold py-3 rounded-xl disabled:opacity-60">
              <LogIn size={18} /> {submitting ? 'Ingresando…' : 'Iniciar sesión'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
