import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PawPrint, User, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isCurrent = (path) => location.pathname === path;

  const navigate = useNavigate();

  const handleScrollTo = (e, targetId) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          const offset = 130;
          const offsetPosition = element.getBoundingClientRect().top + window.pageYOffset - offset;
          window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
      }, 150);
    } else {
      const element = document.getElementById(targetId);
      if (element) {
        const offset = 130;
        const offsetPosition = element.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full z-40 shadow-sm border-b border-orange-500/10">
      {/* Background layer for blur effect (Fixes iOS Safari absolute child clipping bug) */}
      <div className="absolute inset-0 bg-[var(--bg-base)]/90 backdrop-blur-md -z-10"></div>

      {/* Top Bar */}
      <div className="bg-[var(--color-brand-orange)] text-white text-sm font-semibold text-center py-2 relative z-10">
        ¡Preguntá por nuestros nuevos planes mensuales Pura Vida! 🐾
      </div>
      
      {/* Main Nav */}
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center relative">
        <Link to="/" className="flex items-center gap-3 relative z-50">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[var(--color-brand-orange)] bg-[#FFF8F0]">
            <img src="/logo.jpg" alt="Pura Vida Pets Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-2xl font-bold text-[var(--color-brand-dark)] dark:text-white font-[var(--font-display)] tracking-wide">
            Pura Vida Pets
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-8 font-semibold text-[var(--color-brand-dark)] dark:text-gray-200">
          <Link to="/about" className={`hover:text-[var(--color-brand-orange)] transition-colors ${isCurrent('/about') ? 'text-[var(--color-brand-orange)]' : ''}`}>Sobre Nosotros</Link>
          <a href="/#servicios" onClick={(e) => handleScrollTo(e, 'servicios')} className={`hover:text-[var(--color-brand-orange)] transition-colors`}>Servicios</a>
          <Link to="/blog" className={`hover:text-[var(--color-brand-orange)] transition-colors ${isCurrent('/blog') ? 'text-[var(--color-brand-orange)]' : ''}`}>Proyectos Sociales</Link>
          <a href="/#precios" onClick={(e) => handleScrollTo(e, 'precios')} className={`hover:text-[var(--color-brand-orange)] transition-colors`}>Contacto</a>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-700"></div>

          <Link to="/portal" className="flex items-center gap-2 hover:text-[var(--color-brand-orange)] transition-colors">
            <User size={18} />
            <span>Portal de Clientes</span>
          </Link>
          
          <a href="https://wa.link/1slsaj" target="_blank" rel="noopener noreferrer" className="group relative overflow-hidden px-8 py-3 rounded-full flex items-center gap-2 font-black text-white uppercase tracking-widest transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-[#FFB775] via-[#D66215] to-[#4C1D03] border border-[#FFD0A8]/50 shadow-[0_8px_20px_rgba(214,98,21,0.5),inset_0_2px_1px_rgba(255,255,255,0.6),inset_0_-3px_5px_rgba(76,29,3,0.8)] hover:shadow-[0_12px_25px_rgba(214,98,21,0.7),inset_0_2px_2px_rgba(255,255,255,0.9),inset_0_-3px_5px_rgba(76,29,3,0.8)]">
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></span>
            <span className="relative z-10 flex items-center gap-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] text-sm">Reservar Ahora <PawPrint size={18} className="drop-shadow-[0_0_3px_rgba(255,255,255,0.5)]" /></span>
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="lg:hidden text-[var(--color-brand-dark)] dark:text-white relative z-50 focus:outline-none"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </nav>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden absolute top-full left-0 w-full bg-[#FFF8F0] dark:bg-[#161514] border-b border-orange-500/10 shadow-xl overflow-hidden flex flex-col font-semibold text-[var(--color-brand-dark)] dark:text-gray-200 z-50 origin-top"
          >
            <div className="p-6 flex flex-col gap-5">
              <Link to="/about" onClick={() => setIsMobileMenuOpen(false)} className="p-4 bg-white dark:bg-zinc-800/50 rounded-2xl shadow-sm text-lg flex items-center justify-between group">
                <span className="group-hover:text-[var(--color-brand-orange)] transition-colors">Sobre Nosotros</span>
              </Link>
              <a href="/#servicios" onClick={(e) => { handleScrollTo(e, 'servicios'); setIsMobileMenuOpen(false); }} className="p-4 bg-white dark:bg-zinc-800/50 rounded-2xl shadow-sm text-lg flex items-center justify-between group">
                <span className="group-hover:text-[var(--color-brand-orange)] transition-colors">Servicios</span>
              </a>
              <Link to="/blog" onClick={() => setIsMobileMenuOpen(false)} className="p-4 bg-white dark:bg-zinc-800/50 rounded-2xl shadow-sm text-lg flex items-center justify-between group">
                <span className="group-hover:text-[var(--color-brand-orange)] transition-colors">Proyectos Sociales</span>
              </Link>
              <a href="/#precios" onClick={(e) => { handleScrollTo(e, 'precios'); setIsMobileMenuOpen(false); }} className="p-4 bg-white dark:bg-zinc-800/50 rounded-2xl shadow-sm text-lg flex items-center justify-between group">
                <span className="group-hover:text-[var(--color-brand-orange)] transition-colors">Contacto</span>
              </a>
              
              <Link to="/portal" onClick={() => setIsMobileMenuOpen(false)} className="p-4 bg-white dark:bg-zinc-800/50 rounded-2xl shadow-sm text-lg flex items-center gap-3 group">
                <div className="bg-[#FFF8F0] p-2 rounded-lg text-[var(--color-brand-orange)]">
                  <User size={20} />
                </div>
                <span className="group-hover:text-[var(--color-brand-orange)] transition-colors">Portal de Clientes</span>
              </Link>
              
              <a href="https://wa.link/1slsaj" target="_blank" rel="noopener noreferrer" onClick={() => setIsMobileMenuOpen(false)} className="group relative overflow-hidden p-4 rounded-2xl flex justify-center items-center gap-2 font-black text-white uppercase tracking-widest transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-[#FFB775] via-[#D66215] to-[#4C1D03] border border-[#FFD0A8]/50 shadow-[0_8px_20px_rgba(214,98,21,0.5),inset_0_2px_1px_rgba(255,255,255,0.6),inset_0_-3px_5px_rgba(76,29,3,0.8)] mt-2 hover:shadow-[0_12px_25px_rgba(214,98,21,0.7),inset_0_2px_2px_rgba(255,255,255,0.9),inset_0_-3px_5px_rgba(76,29,3,0.8)]">
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></span>
                <span className="relative z-10 flex items-center gap-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] text-lg">Reservar Ahora <PawPrint size={22} className="drop-shadow-[0_0_3px_rgba(255,255,255,0.5)]" /></span>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
