import { Link } from 'react-router-dom';
import { PawPrint, User, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 w-full z-40 bg-[var(--color-brand-beige)]/90 backdrop-blur-md shadow-sm border-b border-orange-500/10">
      {/* Top Bar */}
      <div className="bg-[#FF8A18] text-white text-sm font-semibold text-center py-2">
        ¡Preguntá por nuestros nuevos planes mensuales Pura Vida! 🐾
      </div>
      
      {/* Main Nav */}
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center relative">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 relative z-50">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[var(--color-brand-orange)] bg-[#FFF8F0]">
            <img src="./logo.jpg" alt="Pura Vida Pets Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-2xl font-bold text-[var(--color-brand-dark)] font-[var(--font-display)] tracking-wide">
            Pura Vida Pets
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 font-semibold text-[var(--color-brand-dark)]">
          <a href="#servicios" className="hover:text-[var(--color-brand-orange)] transition-colors">Servicios</a>
          <a href="#precios" className="hover:text-[var(--color-brand-orange)] transition-colors">Precios</a>
          
          <Link to="/portal" className="flex items-center gap-2 hover:text-[var(--color-brand-orange)] transition-colors">
            <User size={18} />
            <span>Portal de Clientes</span>
          </Link>
          
          <a href="https://wa.link/1slsaj" target="_blank" rel="noopener noreferrer" className="bg-[var(--color-brand-dark)] text-white px-6 py-3 rounded-full hover:bg-[var(--color-brand-orange)] transition-colors flex items-center gap-2 font-bold shadow-lg transform hover:-translate-y-1">
            Reservar Ahora <PawPrint size={18} />
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-[var(--color-brand-dark)] relative z-50 focus:outline-none"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </nav>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-full left-0 w-full bg-[#FFF8F0] border-b border-orange-500/10 shadow-lg py-6 px-4 flex flex-col gap-6 font-semibold text-[var(--color-brand-dark)]"
          >
            <a 
              href="#servicios" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="hover:text-[var(--color-brand-orange)] transition-colors px-4 py-2 bg-white rounded-xl shadow-sm"
            >
              Servicios
            </a>
            <a 
              href="#precios" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="hover:text-[var(--color-brand-orange)] transition-colors px-4 py-2 bg-white rounded-xl shadow-sm"
            >
              Precios
            </a>
            
            <Link 
              to="/portal" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 hover:text-[var(--color-brand-orange)] transition-colors px-4 py-2 bg-white rounded-xl shadow-sm"
            >
              <User size={18} />
              <span>Portal de Clientes</span>
            </Link>
            
            <a 
              href="https://wa.link/1slsaj" 
              target="_blank" 
              rel="noopener noreferrer" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="bg-[var(--color-brand-orange)] text-white px-6 py-4 rounded-xl flex justify-center items-center gap-2 font-bold shadow-md mt-2"
            >
              Reservar Ahora <PawPrint size={18} />
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
