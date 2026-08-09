import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Mail } from 'lucide-react';

const InstagramIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

export default function Footer({ onOpenModal }) {
  return (
    <footer id="contacto" className="bg-[var(--color-brand-dark)] text-white pt-16 pb-8 border-t-4 border-[var(--color-brand-orange)] mt-20">
      <div className="container mx-auto px-6 max-w-6xl">
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Brand & Address */}
          <div className="flex flex-col items-start">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[var(--color-brand-orange)] bg-[#FFF8F0] shadow-lg">
                <img src="./logo.jpg" alt="Pura Vida Pets Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-3xl font-bold font-[var(--font-display)] tracking-wide">
                Pura Vida Pets
              </span>
            </Link>
            <address className="not-italic text-gray-400 space-y-1 text-sm">
              <p className="text-white font-bold mb-2 text-base flex items-center gap-2">
                Heredia, Costa Rica
                <img src="./costa-rica.png" alt="Costa Rica" className="w-5 h-auto object-contain" />
              </p>
              <p>Expertos en felicidad canina.</p>
              <p>Aventuras únicas que se adaptan</p>
              <p>a la vida de tu mascota.</p>
            </address>
          </div>

          {/* Company Links */}
          <div className="hidden md:block lg:pl-8">
            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6">Empresa</h4>
            <ul className="space-y-4 text-sm font-medium text-gray-300">
              <li><Link to="/" className="hover:text-[var(--color-brand-orange)] transition-colors">Inicio</Link></li>
              <li><a href="#servicios" className="hover:text-[var(--color-brand-orange)] transition-colors">Servicios Adicionales</a></li>
              <li><a href="#precios" className="hover:text-[var(--color-brand-orange)] transition-colors">Paquetes Mensuales</a></li>
              <li><Link to="/portal" className="hover:text-[var(--color-brand-orange)] transition-colors">Portal de Clientes</Link></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6">Legal</h4>
            <ul className="space-y-4 text-sm font-medium text-gray-300">
              <li><a href="#" className="hover:text-[var(--color-brand-orange)] transition-colors">Política de Privacidad</a></li>
              <li><a href="#" className="hover:text-[var(--color-brand-orange)] transition-colors">Términos y Condiciones</a></li>
              <li><a href="#" className="hover:text-[var(--color-brand-orange)] transition-colors">Normativa del Cuidado</a></li>
            </ul>
          </div>

          {/* Contact & Socials */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6">Conectar</h4>
            <ul className="space-y-4 text-sm font-medium text-gray-300 mb-8">
              <li>
                <a href="https://www.instagram.com/puravidapets.cr/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-[var(--color-brand-orange)] transition-colors">
                  <InstagramIcon size={18} /> Instagram
                </a>
              </li>
              <li>
                <a href="https://wa.link/1slsaj" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-[var(--color-brand-orange)] transition-colors">
                  <MessageCircle size={18} /> WhatsApp
                </a>
              </li>
              <li>
                <a href="mailto:asesores@puravidapets.cr" className="flex items-center gap-3 hover:text-[var(--color-brand-orange)] transition-colors">
                  <Mail size={18} /> asesores@puravidapets.cr
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Divider */}
        <div className="h-px w-full bg-[#D66215]/30 mb-8"></div>

        {/* Footer Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-[#D66215]">
          <div className="flex items-center gap-4">
            {/* Version Tag -> Triggers Modal via prop */}
            <button 
              onClick={onOpenModal}
              className="group border border-[#D66215] bg-transparent hover:bg-[#D66215] text-[#D66215] hover:text-white px-3 py-1.5 rounded-full transition-all font-mono focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D66215] focus:ring-offset-[var(--color-brand-dark)] text-[10px] uppercase tracking-wider flex items-center gap-2"
              aria-label="Ver información del sistema"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#D66215] group-hover:bg-white transition-colors"></span>
              V1.5.6
            </button>
            <p className="hidden md:block">
              Desarrollado por <a href="https://elysiumdr.eu" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors underline decoration-dotted underline-offset-4 font-bold">Elysium λ Development & Research</a>.
            </p>
          </div>
          
          <div className="text-center md:text-right">
            <p>© 2026 Pura Vida Pets. Todos los derechos reservados.</p>
          </div>
        </div>

      </div>
    </footer>
  );
}
