import { motion } from 'framer-motion';
import { ArrowRight, Heart } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative pt-20 pb-32 overflow-hidden">
      <div className="container mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center">
        
        {/* Text Content */}
        <div className="md:w-1/2 text-center md:text-left mb-12 md:mb-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.h1 
              whileHover={{ scale: 1.02, rotate: -1 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="text-5xl md:text-7xl font-bold text-[var(--color-brand-orange)] mb-6 text-shadow-bubbly leading-tight cursor-default origin-left"
            >
              Aventuras únicas para tu mascota
            </motion.h1>
            <motion.p 
              whileHover={{ scale: 1.02, x: 5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="text-xl md:text-2xl text-[var(--color-brand-dark)] dark:text-[var(--text-primary)] mb-8 font-medium cursor-default origin-left"
            >
              Expertos en felicidad canina. <br className="hidden md:block"/>
              Servicios de paseo y cuidado en Heredia, Costa Rica.
            </motion.p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <motion.a 
                href="#precios" 
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="bg-[var(--color-brand-dark)] text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-[var(--color-brand-orange)] transition-colors shadow-xl flex items-center justify-center gap-2"
              >
                Ver Paquetes <ArrowRight size={20} />
              </motion.a>
              <motion.a 
                href="#servicios" 
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white border-4 border-[var(--color-brand-dark)] text-[var(--color-brand-dark)] px-8 py-4 rounded-full text-lg font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                Conocé más <Heart size={20} className="text-[var(--color-brand-orange)]" />
              </motion.a>
            </div>
          </motion.div>
        </div>

        {/* Visual Content / Illustration */}
        <div className="md:w-1/2 relative flex justify-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            {/* Organic Blob Frame */}
            <motion.div 
              whileHover={{ scale: 1.25, rotate: 180, opacity: 0.4 }}
              transition={{ duration: 2, type: "spring", bounce: 0.5 }}
              className="absolute inset-0 bg-[var(--color-brand-orange)] opacity-20 rounded-[40%_60%_70%_30%/40%_50%_60%_50%] animate-[morph_8s_ease-in-out_infinite] scale-110 z-0 cursor-crosshair"
            ></motion.div>
            
            {/* Main Image Placeholder (Use CSS to make it look like the brand) */}
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 3 }}
              whileTap={{ scale: 0.95, rotate: -2 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="relative z-10 w-72 h-72 md:w-96 md:h-96 bg-[var(--color-brand-dark)] rounded-full flex items-center justify-center border-8 border-white dark:border-[#1A1918] shadow-2xl overflow-hidden cursor-pointer"
            >
               <img src="./logo.jpg" alt="Corgi feliz" className="w-full h-full object-cover opacity-90" />
            </motion.div>
            
            {/* Floating Badges */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              whileHover={{ scale: 1.15, rotate: -5, cursor: "pointer" }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", scale: { duration: 0.2 }, rotate: { duration: 0.2 } }}
              className="absolute -top-6 -right-6 bg-white dark:bg-[#1A1918] border-4 border-[var(--color-brand-orange)] rounded-2xl p-4 shadow-xl z-20 flex items-center gap-2"
            >
              <span className="text-2xl">🏆</span>
              <span className="font-bold text-[var(--color-brand-dark)] dark:text-[var(--text-primary)]">#1 en Heredia</span>
            </motion.div>
          </motion.div>
        </div>
        
      </div>
      
      {/* Marquee Ticker */}
      <div className="absolute bottom-0 left-0 w-full bg-[var(--color-brand-dark)] text-white py-3 overflow-hidden border-t-4 border-b-4 border-[#FF8A18] shadow-lg transform rotate-[-1deg] scale-105">
        <div className="flex whitespace-nowrap animate-[marquee_20s_linear_infinite]">
           <span className="text-xl font-bold uppercase tracking-wider mx-4">🐾 Paseos Individuales 🐾 Paquetes Mensuales 🐾 Cuido a Domicilio 🐾 Billetera de Horas 🐾 Fotos Semanales 🐾 </span>
           <span className="text-xl font-bold uppercase tracking-wider mx-4">🐾 Paseos Individuales 🐾 Paquetes Mensuales 🐾 Cuido a Domicilio 🐾 Billetera de Horas 🐾 Fotos Semanales 🐾 </span>
           <span className="text-xl font-bold uppercase tracking-wider mx-4">🐾 Paseos Individuales 🐾 Paquetes Mensuales 🐾 Cuido a Domicilio 🐾 Billetera de Horas 🐾 Fotos Semanales 🐾 </span>
        </div>
      </div>
      
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
      `}</style>
    </section>
  );
}
