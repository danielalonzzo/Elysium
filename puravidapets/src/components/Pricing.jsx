import { motion } from 'framer-motion';
import { PawPrint } from 'lucide-react';

export default function Pricing() {
  const plans = [
    {
      name: "Básico",
      hours: 8,
      color: "var(--color-tier-basic)",
      textColor: "text-[#4DB8FF]",
      borderColor: "border-[#4DB8FF]",
      bgBadge: "bg-[#4DB8FF]",
      features: [
        "Paseos guiados",
        "Hidratación constante",
        "Servicio básico de cuidado",
        "Fotos y videos semanales",
        "Limpieza de suciedad imprevista menor"
      ]
    },
    {
      name: "Pura Vida",
      hours: 12,
      color: "var(--color-tier-puravida)",
      textColor: "text-[#D32F2F]",
      borderColor: "border-[#D32F2F]",
      bgBadge: "bg-[#D32F2F]",
      isPopular: true,
      features: [
        "Todo lo del Plan Básico",
        "Rutas más activas y personalizadas",
        "Actividades para diversión de la mascota",
        "Cepilladas de pelo en cada salida"
      ]
    },
    {
      name: "Premium",
      hours: 20,
      color: "var(--color-tier-premium)",
      textColor: "text-[#FF6D00]",
      borderColor: "border-[#FF6D00]",
      bgBadge: "bg-[#FF6D00]",
      features: [
        "Todo lo del Plan Pura Vida",
        "Grooming profesional (1 vez al mes)",
        "Atención prioritaria VIP"
      ]
    }
  ];

  return (
    <section id="precios" className="py-24 bg-[var(--color-brand-beige)] relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--color-brand-dark)] mb-4">Paquetes Mensuales</h2>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            Funcionan con una <strong>Billetera de Horas</strong>. Descontamos el tiempo de tu saldo mensual para darte máxima flexibilidad.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.2 }}
              className={`relative bg-[var(--color-brand-dark)] rounded-3xl p-8 text-white border-8 ${plan.borderColor} transform transition-transform hover:-translate-y-2 flex flex-col`}
            >
              {plan.isPopular && (
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-[var(--color-tier-puravida)] text-white px-6 py-2 rounded-full font-bold uppercase tracking-wide border-4 border-white shadow-lg">
                  Más Popular
                </div>
              )}
              
              <div className="text-center mb-8 mt-4">
                <h3 className={`text-3xl font-bold font-[var(--font-display)] mb-2 ${plan.textColor}`}>{plan.name}</h3>
                <div className="text-5xl font-black mb-2">{plan.hours} <span className="text-2xl font-medium text-gray-300">hrs/mes</span></div>
              </div>

              <div className="bg-white/10 rounded-2xl p-6 flex-grow mb-8">
                <ul className="space-y-4">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-3">
                      <span className="mt-1 text-[var(--color-brand-orange)]"><PawPrint size={18} fill="currentColor" /></span>
                      <span className="font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button className={`w-full ${plan.bgBadge} text-white font-bold text-lg py-4 rounded-full border-4 border-transparent hover:border-white transition-all shadow-lg`}>
                Elegir Plan {plan.name}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
