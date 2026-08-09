import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PawPrint, Info, CheckCircle2, ChevronRight, ChevronLeft, Phone, AlertCircle } from 'lucide-react';
import { db } from '../core/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function Pricing() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    district: '',
    service: '',
    scheduleSituation: '',
    otherSituationExplanation: '',
    walksPerWeek: '',
    averageWalkMinutes: '',
    vaccinationStatus: '',
    behaviorRisk: '',
    numDogs: 1,
    dogs: [{ size: '', age: '' }],
    inServiceArea: true,
    emergencyContact: true,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null); // 'hospedaje' | 'puravida'
  const [error, setError] = useState('');

  const handleUpdate = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError('');
  };

  const handleNumDogsChange = (e) => {
    const num = parseInt(e.target.value) || 1;
    const newDogs = [...formData.dogs];
    if (num > newDogs.length) {
      for (let i = newDogs.length; i < num; i++) {
        newDogs.push({ size: '', age: '' });
      }
    } else if (num < newDogs.length) {
      newDogs.length = num;
    }
    setFormData({ ...formData, numDogs: num, dogs: newDogs });
  };

  const handleDogChange = (index, field, value) => {
    const newDogs = [...formData.dogs];
    newDogs[index][field] = value;
    setFormData({ ...formData, dogs: newDogs });
  };

  const validateStep = (step) => {
    if (step === 1) {
      if (!formData.service) {
        setError('Por favor selecciona el servicio que buscas.');
        return false;
      }
      if (!formData.scheduleSituation) {
        setError('Por favor selecciona la situación que describe tu necesidad.');
        return false;
      }
      if (formData.scheduleSituation === 'other' && !formData.otherSituationExplanation.trim()) {
        setError('Por favor explica brevemente tu situación.');
        return false;
      }
      if (!formData.walksPerWeek) {
        setError('Por favor selecciona la cantidad de paseos por semana.');
        return false;
      }
      if (!formData.averageWalkMinutes) {
        setError('Por favor selecciona la duración promedio de los paseos.');
        return false;
      }
    } else if (step === 2) {
      for (let i = 0; i < formData.dogs.length; i++) {
        if (!formData.dogs[i].size || !formData.dogs[i].age) {
          setError(`Por favor completa el tamaño y edad del perrito #${i + 1}.`);
          return false;
        }
      }
      if (!formData.vaccinationStatus) {
        setError('Por favor indica el estado de vacunación.');
        return false;
      }
      if (!formData.behaviorRisk) {
        setError('Por favor indica el comportamiento general de tu(s) mascota(s).');
        return false;
      }
    } else if (step === 3) {
      if (!formData.fullName || !formData.phone || !formData.district) {
        setError('Por favor completa todos los campos principales (Nombre, Teléfono, Distrito).');
        return false;
      }
      if (!formData.inServiceArea || !formData.emergencyContact) {
        setError('Debes confirmar las casillas requeridas para poder continuar.');
        return false;
      }
    }
    setError('');
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'prospects'), {
        ...formData,
        createdAt: serverTimestamp(),
        status: 'nuevo'
      });
      
      // La lógica anterior decía hospedaje. Aquí validamos Hospedaje o Cuido según lo mencionado.
      if (formData.service === 'Hospedaje' || formData.service === 'Cuido a domicilio') {
        setResult('hospedaje');
      } else {
        setResult('puravida');
      }
    } catch (err) {
      console.error(err);
      setError('Ocurrió un error al enviar tus datos. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = 'w-full p-4 rounded-xl border-2 border-gray-200 focus:border-[var(--color-brand-orange)] focus:ring-0 outline-none transition-colors bg-white';
  const labelClass = 'block text-sm font-bold text-gray-700 mb-2';

  const renderStepIndicators = () => (
    <div className="flex justify-center items-center mb-8 gap-4">
      {[1, 2, 3].map(step => (
        <div key={step} className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-colors ${currentStep >= step ? 'bg-[var(--color-brand-orange)] text-white' : 'bg-gray-200 text-gray-500'}`}>
            {step}
          </div>
          {step < 3 && (
            <div className={`w-12 h-1 mx-2 rounded ${currentStep > step ? 'bg-[var(--color-brand-orange)]' : 'bg-gray-200'}`}></div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <section id="precios" className="pt-24 pb-40 md:py-24 bg-[var(--color-brand-beige)] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <PawPrint className="absolute top-4 left-4 md:top-10 md:left-10 text-[var(--color-brand-orange)] w-24 h-24 md:w-32 md:h-32 transform -rotate-12" />
        <PawPrint className="absolute bottom-4 right-4 md:bottom-10 md:right-10 text-[var(--color-brand-dark)] w-24 h-24 md:w-48 md:h-48 transform rotate-12" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <p className="font-bold uppercase tracking-widest text-[var(--color-brand-orange)] mb-3">Simulador Inteligente</p>
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--color-brand-dark)] mb-4">Descubre Tu Plan Ideal</h2>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            Completa estos rápidos pasos para que nuestro sistema te recomiende la mejor opción.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div 
                key="wizard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border-4 border-[var(--color-brand-dark)]"
              >
                {renderStepIndicators()}

                {error && (
                  <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center gap-3 font-medium">
                    <AlertCircle size={20} className="shrink-0" />
                    {error}
                  </div>
                )}

                <div className="min-h-[350px]">
                  {currentStep === 1 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                      <h3 className="text-2xl font-bold text-[var(--color-brand-orange)] border-b-2 border-gray-100 pb-2 mb-6">Paso 1: Detalles del Servicio</h3>
                      
                      <div>
                        <label className={labelClass}>¿Qué servicio buscas?</label>
                        <select required name="service" value={formData.service} onChange={handleUpdate} className={inputClass}>
                          <option value="">Selecciona un servicio...</option>
                          <option value="Paseo">Paseo de Mascotas</option>
                          <option value="Cuido a domicilio">Cuido a Domicilio</option>
                          <option value="Hospedaje">Hospedaje</option>
                          <option value="Guardería">Guardería</option>
                        </select>
                      </div>

                      <div>
                        <label className={labelClass}>¿Qué situación describe mejor tu necesidad?</label>
                        <select name="scheduleSituation" value={formData.scheduleSituation} onChange={handleUpdate} className={inputClass}>
                          <option value="">Selecciona una opción...</option>
                          <option value="busy_professional">Tengo con una agenda muy ocupada</option>
                          <option value="rotating_couple">Tengo horarios rotativos</option>
                          <option value="limited_mobility">Tengo limitaciones físicas para realizar paseos</option>
                          <option value="other">Otra situación</option>
                        </select>
                      </div>

                      {formData.scheduleSituation === 'other' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                          <label className={labelClass}>Por favor, explica tu situación</label>
                          <textarea 
                            name="otherSituationExplanation" 
                            value={formData.otherSituationExplanation} 
                            onChange={handleUpdate} 
                            className={inputClass} 
                            rows="2"
                            placeholder="Ej: Trabajo desde casa pero en reuniones constantes..."
                          ></textarea>
                        </motion.div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Paseos por semana</label>
                          <select name="walksPerWeek" value={formData.walksPerWeek} onChange={handleUpdate} className={inputClass}>
                            <option value="">Selecciona cantidad...</option>
                            {[1, 2, 3, 4, 5, 6, 7].map(v => <option key={v} value={v}>{v} días</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Duración promedio</label>
                          <select name="averageWalkMinutes" value={formData.averageWalkMinutes} onChange={handleUpdate} className={inputClass}>
                            <option value="">Selecciona duración...</option>
                            <option value="30">30 minutos</option>
                            <option value="60">1 hora</option>
                            <option value="90">1.5 horas</option>
                          </select>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 2 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                      <h3 className="text-2xl font-bold text-[var(--color-brand-orange)] border-b-2 border-gray-100 pb-2 mb-6">Paso 2: Tus Perritos</h3>
                      
                      <div>
                        <label className={labelClass}>Cantidad de Perritos</label>
                        <input 
                          type="number" 
                          min="1" max="10"
                          className={`${inputClass} font-bold text-lg`}
                          value={formData.numDogs}
                          onChange={handleNumDogsChange}
                        />
                      </div>

                      <div className="space-y-4 max-h-[320px] overflow-y-auto pr-2">
                        {formData.dogs.map((dog, idx) => (
                          <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm">
                            <h4 className="font-bold text-[var(--color-brand-dark)] mb-3 flex items-center gap-2">
                              <PawPrint size={16} /> Perrito #{idx + 1}
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <select 
                                  className="w-full p-3 rounded-lg border-2 border-gray-200 text-sm focus:border-[var(--color-brand-orange)] outline-none transition-colors"
                                  value={dog.size}
                                  onChange={(e) => handleDogChange(idx, 'size', e.target.value)}
                                >
                                  <option value="">Tamaño...</option>
                                  <option value="Pequeño">Pequeño</option>
                                  <option value="Mediano">Mediano</option>
                                  <option value="Grande">Grande</option>
                                </select>
                              </div>
                              <div>
                                <input 
                                  type="text"
                                  placeholder="Edad (ej: 2 años)"
                                  className="w-full p-3 rounded-lg border-2 border-gray-200 text-sm focus:border-[var(--color-brand-orange)] outline-none transition-colors"
                                  value={dog.age}
                                  onChange={(e) => handleDogChange(idx, 'age', e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4 border-t border-gray-200">
                        <label className={labelClass}>
                          {formData.numDogs === 1 ? 'Vacunación de tu perrito' : 'Vacunación de la manada'}
                        </label>
                        <select name="vaccinationStatus" value={formData.vaccinationStatus} onChange={handleUpdate} className={inputClass}>
                          <option value="">Selecciona una opción...</option>
                          <option value="current">{formData.numDogs === 1 ? 'Al día' : 'Todos al día'}</option>
                          <option value="pending">Pendiente de comprobación</option>
                          <option value="not_current">{formData.numDogs === 1 ? 'No está al día' : 'Algún carnet no está al día'}</option>
                        </select>
                      </div>

                      <div>
                        <label className={labelClass}>
                          {formData.numDogs === 1 ? 'Comportamiento de tu perrito' : 'Comportamiento general'}
                        </label>
                        <select name="behaviorRisk" value={formData.behaviorRisk} onChange={handleUpdate} className={inputClass}>
                          <option value="">Selecciona una opción...</option>
                          <option value="low">{formData.numDogs === 1 ? 'Tranquilo y sociable' : 'Tranquilos y sociables'}</option>
                          <option value="medium">{formData.numDogs === 1 ? 'Requiere adaptación o paciencia' : 'Requieren adaptación o paciencia'}</option>
                          <option value="high">Antecedentes de agresividad/miedo</option>
                        </select>
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 3 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                      <h3 className="text-2xl font-bold text-[var(--color-brand-orange)] border-b-2 border-gray-100 pb-2 mb-6">Paso 3: Tus Datos</h3>
                      
                      <div>
                        <label className={labelClass}>Nombre completo</label>
                        <input required type="text" name="fullName" value={formData.fullName} onChange={handleUpdate} className={inputClass} placeholder="Ej: Ana Pérez" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>WhatsApp</label>
                          <input required type="tel" name="phone" value={formData.phone} onChange={handleUpdate} className={inputClass} placeholder="8888-8888" />
                        </div>
                        <div>
                          <label className={labelClass}>Correo (opcional)</label>
                          <input type="email" name="email" value={formData.email} onChange={handleUpdate} className={inputClass} placeholder="ana@email.com" />
                        </div>
                      </div>

                      <div>
                        <label className={labelClass}>Distrito o zona</label>
                        <input required type="text" name="district" value={formData.district} onChange={handleUpdate} className={inputClass} placeholder="Ej: Escazú Centro" />
                      </div>

                      {/* Confirmaciones */}
                      <div className="mt-8 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="grid gap-3 text-sm text-gray-700 font-medium">
                          <label className="flex gap-3 items-start cursor-pointer hover:text-[var(--color-brand-orange)] transition-colors">
                            <input type="checkbox" name="inServiceArea" checked={formData.inServiceArea} onChange={handleUpdate} className="mt-1 w-4 h-4 accent-[var(--color-brand-orange)]" /> 
                            Confirmo que vivo en una zona de cobertura habitual
                          </label>
                          <label className="flex gap-3 items-start cursor-pointer hover:text-[var(--color-brand-orange)] transition-colors">
                            <input type="checkbox" name="emergencyContact" checked={formData.emergencyContact} onChange={handleUpdate} className="mt-1 w-4 h-4 accent-[var(--color-brand-orange)]" /> 
                            Tengo un contacto de emergencia (veterinario o familiar) disponible
                          </label>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="flex justify-between items-center mt-10 pt-6 border-t-2 border-gray-100">
                  {currentStep > 1 ? (
                    <button 
                      type="button" 
                      onClick={prevStep}
                      className="text-gray-500 font-bold py-3 px-6 rounded-full hover:bg-gray-100 transition-colors flex items-center gap-2"
                    >
                      <ChevronLeft size={20} /> Anterior
                    </button>
                  ) : (
                    <div></div>
                  )}

                  {currentStep < 3 ? (
                    <button 
                      type="button" 
                      onClick={nextStep}
                      className="bg-[var(--color-brand-dark)] text-white font-bold py-3 px-8 rounded-full hover:bg-gray-800 transition-colors flex items-center gap-2"
                    >
                      Siguiente <ChevronRight size={20} />
                    </button>
                  ) : (
                    <button 
                      type="button" 
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="bg-[var(--color-brand-orange)] text-white font-bold text-lg py-4 px-10 rounded-full hover:bg-[#e66000] transition-colors shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Calculando...' : 'Simular'}
                      {!isSubmitting && <ChevronRight size={24} />}
                    </button>
                  )}
                </div>
              </motion.div>
            ) : result === 'hospedaje' ? (
              <motion.div 
                key="hospedaje"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl p-8 md:p-16 shadow-xl border-4 border-[#4DB8FF] text-center max-w-2xl mx-auto"
              >
                <div className="w-24 h-24 bg-blue-100 text-[#4DB8FF] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Info size={48} />
                </div>
                <h3 className="text-3xl font-bold text-[var(--color-brand-dark)] mb-4">¡Gracias por completar el simulador!</h3>
                <p className="text-lg text-gray-600 mb-8">
                  Para brindarte el mejor servicio de manera segura, necesitamos evaluar algunas condiciones específicas de tu perrito para el servicio de {formData.service}. Por favor, ponte en contacto directo con uno de nuestros asesores para coordinar.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <a 
                    href={`https://wa.me/50686913459?text=Hola,%20acabo%20de%20llenar%20el%20simulador%20y%20me%20interesa%20el%20servicio%20de%20${formData.service}%20para%20mis%20mascotas.`}
                    target="_blank" rel="noreferrer"
                    className="bg-[#25D366] text-white font-bold py-4 px-8 rounded-full flex items-center gap-3 hover:bg-[#20bd5a] transition-colors w-full sm:w-auto justify-center shadow-lg shadow-green-500/20"
                  >
                    <Phone size={20} />
                    Contactar por WhatsApp
                  </a>
                </div>
                <button onClick={() => {setResult(null); setCurrentStep(1);}} className="mt-8 text-sm text-gray-500 hover:text-gray-800 underline">Volver al simulador</button>
              </motion.div>
            ) : (
              <motion.div 
                key="puravida"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[var(--color-brand-dark)] rounded-3xl p-8 md:p-16 shadow-xl border-8 border-[var(--color-tier-puravida)] text-center text-white relative overflow-hidden max-w-2xl mx-auto"
              >
                <div className="absolute -top-10 -right-10 w-64 h-64 bg-[var(--color-tier-puravida)] rounded-full opacity-20 blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-orange-600 rounded-full opacity-20 blur-3xl pointer-events-none"></div>
                
                <div className="relative z-10">
                  <div className="w-24 h-24 bg-[var(--color-tier-puravida)] text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/30">
                    <PawPrint size={48} />
                  </div>
                  <h3 className="text-4xl font-bold font-[var(--font-display)] mb-2 text-[#D32F2F]">Plan Pura Vida</h3>
                  <h4 className="text-2xl font-medium mb-6">¡La mejor opción según tu simulación!</h4>
                  
                  <p className="text-lg text-gray-300 mb-8">
                    Según las necesidades, horarios y características de tu manada, el Plan Pura Vida es ideal. Ofrece flexibilidad y la atención prioritaria que buscan. Nuestros asesores ya recibieron tu solicitud y te contactarán pronto con una propuesta personalizada.
                  </p>

                  <div className="bg-white/10 rounded-2xl p-6 text-left border border-white/5">
                    <ul className="space-y-4 font-medium">
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="text-[var(--color-brand-orange)] shrink-0 mt-0.5" />
                        <span>Rutas más activas y personalizadas</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="text-[var(--color-brand-orange)] shrink-0 mt-0.5" />
                        <span>Actividades para diversión de la mascota</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="text-[var(--color-brand-orange)] shrink-0 mt-0.5" />
                        <span>Cepilladas de pelo en cada salida</span>
                      </li>
                    </ul>
                  </div>

                  <button onClick={() => {setResult(null); setCurrentStep(1);}} className="mt-8 text-sm text-gray-400 hover:text-white underline transition-colors">Hacer otra simulación</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
