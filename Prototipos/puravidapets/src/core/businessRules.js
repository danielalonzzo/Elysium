export const PLAN_CATALOG = Object.freeze({
  basic: Object.freeze({
    id: 'basic',
    name: 'Básico',
    includedMinutes: 480,
    includedHours: 8,
  }),
  pura_vida: Object.freeze({
    id: 'pura_vida',
    name: 'Pura Vida',
    includedMinutes: 720,
    includedHours: 12,
  }),
  premium: Object.freeze({
    id: 'premium',
    name: 'Premium',
    includedMinutes: 1200,
    includedHours: 20,
  }),
});

export const APPOINTMENT_STATUS = Object.freeze({
  REQUESTED: 'requested',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
});

const STATUS_TRANSITIONS = Object.freeze({
  requested: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['completed'],
  completed: [],
  cancelled: [],
});

const PERSONA_LABELS = Object.freeze({
  busy_professional: 'Profesional ocupado',
  rotating_couple: 'Pareja con horarios rotativos',
  limited_mobility: 'Adulto mayor con limitaciones físicas',
});

export function getPlan(planId) {
  const plan = PLAN_CATALOG[planId];
  if (!plan) throw new Error('PLAN_NOT_FOUND');
  return plan;
}

export function getAvailableMinutes(wallet = {}) {
  const total = Number(wallet.totalMinutes || 0);
  const consumed = Number(wallet.consumedMinutes || 0);
  const reserved = Number(wallet.reservedMinutes || 0);
  return Math.max(0, total - consumed - reserved);
}

export function assertAppointmentTransition(currentStatus, nextStatus) {
  if (!STATUS_TRANSITIONS[currentStatus]?.includes(nextStatus)) {
    throw new Error(`INVALID_APPOINTMENT_TRANSITION:${currentStatus}:${nextStatus}`);
  }
  return true;
}

export function validateAppointment(input, now = new Date()) {
  const scheduledStartAt = input?.scheduledStartAt instanceof Date
    ? input.scheduledStartAt
    : new Date(input?.scheduledStartAt || input?.date);
  const durationMinutes = Number(input?.durationMinutes || 60);

  if (!input?.clientId) throw new Error('CLIENT_ID_REQUIRED');
  if (!input?.petId) throw new Error('PET_ID_REQUIRED');
  if (Number.isNaN(scheduledStartAt.getTime())) throw new Error('INVALID_START_DATE');
  if (scheduledStartAt.getTime() < now.getTime() + 15 * 60 * 1000) {
    throw new Error('APPOINTMENT_MUST_BE_IN_FUTURE');
  }
  if (![30, 60, 90, 120].includes(durationMinutes)) {
    throw new Error('INVALID_DURATION');
  }
  if (!Number.isFinite(input?.location?.lat) || !Number.isFinite(input?.location?.lng)) {
    throw new Error('LOCATION_REQUIRED');
  }

  return {
    clientId: input.clientId,
    petId: input.petId,
    scheduledStartAt,
    durationMinutes,
    location: {
      lat: Number(input.location.lat),
      lng: Number(input.location.lng),
    },
    notes: String(input.notes || '').trim().slice(0, 500),
    serviceType: input.serviceType || 'walk',
  };
}

function personaScores(input) {
  const scores = {
    busy_professional: 0,
    rotating_couple: 0,
    limited_mobility: 0,
  };

  if (input.scheduleSituation === 'busy_professional') scores.busy_professional += 55;
  if (input.scheduleSituation === 'rotating_couple') scores.rotating_couple += 55;
  if (input.scheduleSituation === 'limited_mobility') scores.limited_mobility += 55;
  if (input.workHours === 'long') scores.busy_professional += 25;
  if (input.scheduleChangesOften) scores.rotating_couple += 25;
  if (input.hasPhysicalLimitation) scores.limited_mobility += 30;
  if (Number(input.walksPerWeek) >= 3) {
    scores.busy_professional += 10;
    scores.rotating_couple += 10;
    scores.limited_mobility += 10;
  }

  return scores;
}

function recommendedPlanFor(input) {
  const monthlyMinutes = Number(input.walksPerWeek || 0)
    * Number(input.averageWalkMinutes || 60)
    * 4;
  if (monthlyMinutes <= PLAN_CATALOG.basic.includedMinutes) return PLAN_CATALOG.basic;
  if (monthlyMinutes <= PLAN_CATALOG.pura_vida.includedMinutes) return PLAN_CATALOG.pura_vida;
  return PLAN_CATALOG.premium;
}

export function calculatePrequalification(input = {}) {
  const hardStops = [];
  const reviewFlags = [];
  let score = 0;

  if (!input.acceptsContact) hardStops.push('Se requiere autorización para dar seguimiento.');
  if (!input.inServiceArea) reviewFlags.push('La ubicación debe validarse contra la zona de cobertura.');
  if (input.vaccinationStatus === 'not_current') {
    reviewFlags.push('El esquema de vacunación requiere revisión antes de confirmar un servicio.');
  }
  if (input.behaviorRisk === 'high') {
    reviewFlags.push('Se requiere una evaluación de comportamiento y protocolo de seguridad.');
  }
  if (input.emergencyContact === false) {
    reviewFlags.push('Debe registrarse un contacto de emergencia antes del primer servicio.');
  }

  const scores = personaScores(input);
  const personaId = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
  const personaScore = scores[personaId];

  if (personaScore >= 55) score += 35;
  else if (personaScore >= 25) score += 18;
  if (Number(input.walksPerWeek) >= 2) score += 20;
  if (Number(input.walksPerWeek) >= 4) score += 10;
  if (input.monthlyPlanInterest) score += 15;
  if (Number(input.startWithinDays) <= 30) score += 10;
  if (input.inServiceArea) score += 10;

  let status = 'not_qualified';
  if (hardStops.length === 0 && reviewFlags.length === 0 && score >= 60) status = 'qualified';
  else if (hardStops.length === 0 && (score >= 35 || reviewFlags.length > 0)) status = 'manual_review';

  const plan = recommendedPlanFor(input);
  return {
    status,
    score: Math.min(100, score),
    personaId,
    personaLabel: PERSONA_LABELS[personaId],
    personaScores: scores,
    recommendedPlanId: plan.id,
    recommendedPlanName: plan.name,
    hardStops,
    reviewFlags,
  };
}

export function normalizeCostaRicaPhone(value = '') {
  const digits = String(value).replace(/\D/g, '');
  if (digits.length === 8) return `506${digits}`;
  if (digits.startsWith('506') && digits.length === 11) return digits;
  return digits;
}

export function buildWhatsAppLeadUrl(phone, result, lead = {}) {
  const normalizedPhone = normalizeCostaRicaPhone(phone);
  const text = [
    'Hola, Pura Vida Pets.',
    `Soy ${String(lead.fullName || 'un prospecto').trim()}.`,
    `Resultado: ${result.personaLabel}.`,
    `Plan recomendado: ${result.recommendedPlanName}.`,
    'Quiero validar disponibilidad y próximos pasos.',
  ].join(' ');
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(text)}`;
}
