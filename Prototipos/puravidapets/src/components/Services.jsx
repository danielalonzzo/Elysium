import { motion } from 'framer-motion';
import { Clock, Home, Users } from 'lucide-react';

export default function Services() {
  const services = [
    {
      title: "Paseos Individuales",
      icon: <Clock size={40} className="text-[var(--color-brand-orange)]" />,
      desc: "Servicio estructurado para cobrarse por hora. Perfecto para paseos espontáneos o como adiciones extra a tus paquetes mensuales.",
      features: ["Para 1 a 4 mascotas", "Fotos y comunicación diaria"]
    },
    {
      title: "Cuido a Domicilio u Hospedaje",
      icon: <Home size={40} className="text-[var(--color-brand-orange)]" />,
      desc: "Servicio completo para cuando no estás. Incluye 1 paseo diario, cuidado profesional y amoroso, supervisión, seguridad, alimentación, medicación y fotos diarias.",
      features: ["Para 1 a 4 mascotas", "Fotos y comunicación diaria", "Alimentación personalizada"]
    }
  ];

  return (
    <section id="servicios" className="py-24 bg-[#FFF8F0] dark:bg-[#1A1918] relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--color-brand-dark)] mb-4">Nuestros Servicios Adicionales</h2>
          <div className="w-24 h-2 bg-[var(--color-brand-orange)] mx-auto rounded-full"></div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {services.map((srv, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.2 }}
              className="bg-white border-4 border-[var(--color-brand-dark)] rounded-3xl p-8 hover:-translate-y-2 transition-transform shadow-[8px_8px_0px_0px_rgba(76,29,3,1)]"
            >
              <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center border-4 border-[var(--color-brand-dark)] mb-6 shadow-sm">
                {srv.icon}
              </div>
              <h3 className="text-2xl font-bold text-[var(--color-brand-dark)] mb-4">{srv.title}</h3>
              <p className="text-lg text-gray-700 mb-6">{srv.desc}</p>
              
              {srv.features && (
                <ul className="space-y-2">
                  {srv.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-2 font-medium">
                      <span className="text-[var(--color-brand-orange)]">🐾</span> {feature}
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
