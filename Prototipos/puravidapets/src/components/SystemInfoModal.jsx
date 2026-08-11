import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { elysiusForceUpdate } from '../utils/systemReset';

export default function SystemInfoModal({ isOpen, onClose }) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);
    await elysiusForceUpdate();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-[#FFF8F0] w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh] border-4 border-white"
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              disabled={isUpdating}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors bg-white hover:bg-gray-100 rounded-full p-2 z-10 shadow-sm"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="pt-10 pb-6 px-6 text-center flex-shrink-0 relative">
              <div className="flex justify-center mb-3 relative z-10">
                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-md bg-[#FFF8F0]">
                  <img src="./logo.jpg" alt="Pura Vida Pets Logo" className="w-full h-full object-cover" />
                </div>
              </div>
              <h2 className="text-3xl font-bold font-[var(--font-display)] tracking-wide text-gray-800">
                Pura Vida Pets
              </h2>
              <p className="text-xs uppercase tracking-widest text-[var(--color-brand-orange)] mt-1 font-bold">
                Información del Sistema
              </p>
            </div>

            {/* Scrollable Content */}
            <div className="px-6 pb-8 overflow-y-auto custom-scrollbar flex-grow space-y-6">
              
              {/* Software Specifications */}
              <section>
                <h3 className="text-[11px] uppercase tracking-widest text-gray-500 font-bold mb-3 px-2">
                  Software y Versión
                </h3>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden text-sm">
                  <div className="flex justify-between items-center p-4 border-b border-gray-50">
                    <span className="text-gray-600 font-medium">Versión actual</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[var(--color-brand-orange)] font-bold bg-orange-50 border border-orange-200 px-3 py-1 rounded-full text-xs uppercase tracking-widest flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-orange)] animate-pulse"></span>V2.0.0 BETA</span>
                      <button 
                        onClick={handleUpdate}
                        disabled={isUpdating}
                        className="bg-[var(--color-brand-orange)] hover:bg-[#E67E22] text-white px-3 py-1.5 rounded-full text-xs font-bold transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-1 shadow-sm"
                      >
                        {isUpdating ? <RefreshCw size={14} className="animate-spin" /> : null}
                        {isUpdating ? 'Cargando' : 'Actualizar App'}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-4 border-b border-gray-50">
                    <span className="text-gray-600 font-medium">Última actualización</span>
                    <span className="text-gray-500 font-mono text-xs">Julio 2026</span>
                  </div>
                  <div className="flex justify-between items-center p-4">
                    <span className="text-gray-600 font-medium">Licencia</span>
                    <span className="text-gray-400 font-mono text-xs">ELY-EC03-M3N1-119020648</span>
                  </div>
                </div>
              </section>

              {/* Security & Compliance */}
              <section>
                <h3 className="text-[11px] uppercase tracking-widest text-gray-500 font-bold mb-3 px-2">
                  Privacidad y Legales
                </h3>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden text-sm">
                  <div className="flex justify-between items-center p-4 border-b border-gray-50">
                    <span className="text-gray-600 font-medium">Privacidad de Datos</span>
                    <span className="text-gray-500 text-right text-xs">Ley No. 8968 (Costa Rica)</span>
                  </div>
                  <div className="flex justify-between items-center p-4 border-b border-gray-50">
                    <span className="text-gray-600 font-medium">Tecnología Base</span>
                    <span className="text-gray-500 text-right text-xs">React 19 · Tailwind</span>
                  </div>
                  <a href="#" className="flex justify-between items-center p-4 border-b border-gray-50 hover:bg-orange-50 transition-colors group">
                    <span className="text-gray-600 font-medium">Términos y Condiciones</span>
                    <span className="text-[var(--color-brand-orange)] text-xs flex items-center group-hover:translate-x-1 transition-transform font-bold">
                      Leer documento <ChevronRight size={14} className="ml-1" />
                    </span>
                  </a>
                  <a href="#" className="flex justify-between items-center p-4 hover:bg-orange-50 transition-colors group">
                    <span className="text-gray-600 font-medium">Política de Privacidad</span>
                    <span className="text-[var(--color-brand-orange)] text-xs flex items-center group-hover:translate-x-1 transition-transform font-bold">
                      Leer documento <ChevronRight size={14} className="ml-1" />
                    </span>
                  </a>
                </div>
              </section>

              {/* Corporate Information */}
              <section>
                <h3 className="text-[11px] uppercase tracking-widest text-gray-500 font-bold mb-3 px-2">
                  Acerca de
                </h3>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden text-sm">
                  <div className="flex justify-between items-center p-4 border-b border-gray-50">
                    <span className="text-gray-600 font-medium">Empresa</span>
                    <span className="text-gray-800 font-bold text-xs text-right">Pura Vida Pets CR</span>
                  </div>
                  <div className="flex justify-between items-center p-4">
                    <span className="text-gray-600 font-medium">Desarrollado por</span>
                    <a href="https://elysiumdr.eu" target="_blank" rel="noopener noreferrer" className="text-[var(--color-brand-orange)] font-bold text-xs text-right hover:underline decoration-dotted underline-offset-4 flex items-center gap-1">
                      Elysium λ <ChevronRight size={12} />
                    </a>
                  </div>
                </div>
              </section>
              
            </div>
            
            {/* Loading Overlay when updating */}
            <AnimatePresence>
              {isUpdating && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 z-50 bg-[#FFF8F0]/90 backdrop-blur-md flex flex-col items-center justify-center"
                >
                   <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-4">
                     <RefreshCw size={32} className="text-[var(--color-brand-orange)] animate-spin" />
                   </div>
                   <h3 className="text-xl font-bold font-[var(--font-display)] text-gray-800 mb-1">Actualizando App</h3>
                   <p className="text-gray-500 text-sm animate-pulse">Por favor, esperá un momento...</p>
                </motion.div>
              )}
            </AnimatePresence>
            
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
