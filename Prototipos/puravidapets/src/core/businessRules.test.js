import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePrequalification,
  getAvailableMinutes,
  validateAppointment,
} from './businessRules.js';

test('precalifica al profesional ocupado y recomienda un plan por consumo', () => {
  const result = calculatePrequalification({
    acceptsContact: true,
    inServiceArea: true,
    scheduleSituation: 'busy_professional',
    workHours: 'long',
    walksPerWeek: 3,
    averageWalkMinutes: 60,
    monthlyPlanInterest: true,
    startWithinDays: 14,
    vaccinationStatus: 'current',
    behaviorRisk: 'low',
    emergencyContact: true,
  });

  assert.equal(result.status, 'qualified');
  assert.equal(result.personaId, 'busy_professional');
  assert.equal(result.recommendedPlanId, 'pura_vida');
});

test('envía a revisión manual los riesgos sanitarios', () => {
  const result = calculatePrequalification({
    acceptsContact: true,
    inServiceArea: true,
    scheduleSituation: 'limited_mobility',
    hasPhysicalLimitation: true,
    walksPerWeek: 2,
    averageWalkMinutes: 60,
    monthlyPlanInterest: true,
    startWithinDays: 7,
    vaccinationStatus: 'not_current',
    behaviorRisk: 'low',
    emergencyContact: true,
  });

  assert.equal(result.status, 'manual_review');
  assert.equal(result.reviewFlags.length, 1);
});

test('calcula saldo disponible sin permitir negativos', () => {
  assert.equal(getAvailableMinutes({ totalMinutes: 720, consumedMinutes: 240, reservedMinutes: 60 }), 420);
  assert.equal(getAvailableMinutes({ totalMinutes: 60, consumedMinutes: 90, reservedMinutes: 0 }), 0);
});

test('normaliza una cita válida', () => {
  const now = new Date('2026-08-09T10:00:00.000Z');
  const appointment = validateAppointment({
    clientId: 'client-1',
    petId: 'pet-1',
    scheduledStartAt: '2026-08-10T10:00:00.000Z',
    durationMinutes: 60,
    location: { lat: 9.93, lng: -84.09 },
  }, now);

  assert.equal(appointment.durationMinutes, 60);
  assert.equal(appointment.location.lat, 9.93);
});
