import { motion } from 'framer-motion';
import { ArrowRight, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="relative pt-20 pb-32 overflow-hidden">
      <div className="container mx-auto px-4 relative z-10 flex flex-col-reverse md:flex-row items-center gap-12 md:gap-0">
        <div className="md:w-1/2 text-center md:text-left">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-[var(--color-brand-orange)] mb-6 text-shadow-bubbly leading-tight cursor-default origin-left">
              Aventuras únicas para tu mascota
            </h1>
            <p className="text-xl md:text-2xl text-[var(--color-brand-dark)] dark:text-[var(--text-primary)] mb-8 font-medium cursor-default origin-left">
              Expertos en felicidad canina. <br className="hidden md:block" />
              Servicios de paseo y cuidado en Heredia, Costa Rica.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link to="/services" className="bg-[var(--color-brand-dark)] text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-[var(--color-brand-orange)] transition-colors shadow-xl flex items-center justify-center gap-2">
                Ver Paquetes <ArrowRight size={20} />
              </Link>
              <Link to="/about" className="bg-white border-4 border-[var(--color-brand-dark)] text-[var(--color-brand-dark)] px-8 py-4 rounded-full text-lg font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                Conocé más <Heart size={20} className="text-[var(--color-brand-orange)]" />
              </Link>
            </div>
          </motion.div>
        </div>

        <div className="md:w-1/2 relative flex justify-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-[var(--color-brand-orange)] opacity-20 rounded-[40%_60%_70%_30%/40%_50%_60%_50%] animate-[morph_8s_ease-in-out_infinite] scale-110 z-0 cursor-crosshair blob-bg"></div>
            <div className="relative z-10 w-72 h-72 md:w-96 md:h-96 bg-[var(--color-brand-dark)] rounded-full flex items-center justify-center border-8 border-white dark:border-[#1A1918] shadow-2xl overflow-hidden cursor-pointer">
              <img alt="Corgi feliz" className="w-full h-full object-cover opacity-90" src="/logo.jpg" />
            </div>
            
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-6 -right-6 bg-white dark:bg-[#1A1918] border-4 border-[var(--color-brand-orange)] rounded-2xl p-4 shadow-xl z-20 flex items-center gap-2"
            >
              <span className="text-2xl">🏆</span>
              <span className="font-bold text-[var(--color-brand-dark)] dark:text-[var(--text-primary)]">#1 en Heredia</span>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full bg-[var(--color-brand-dark)] text-white py-3 overflow-hidden border-t-4 border-b-4 border-[var(--color-brand-orange)] shadow-lg transform rotate-[-1deg] scale-105">
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-33.33%); }
          }
        `}</style>
        <div className="flex whitespace-nowrap animate-[marquee_20s_linear_infinite]">
          <span className="text-xl font-bold uppercase tracking-wider mx-4">🐾 Paseos Individuales 🐾 Paquetes Mensuales 🐾 Cuido a Domicilio 🐾 Billetera de Horas 🐾 Fotos Semanales 🐾 </span>
          <span className="text-xl font-bold uppercase tracking-wider mx-4">🐾 Paseos Individuales 🐾 Paquetes Mensuales 🐾 Cuido a Domicilio 🐾 Billetera de Horas 🐾 Fotos Semanales 🐾 </span>
          <span className="text-xl font-bold uppercase tracking-wider mx-4">🐾 Paseos Individuales 🐾 Paquetes Mensuales 🐾 Cuido a Domicilio 🐾 Billetera de Horas 🐾 Fotos Semanales 🐾 </span>
        </div>
      </div>
    </section>
  );
}
