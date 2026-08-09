import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall, onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { setGlobalOptions } from 'firebase-functions/v2';

initializeApp();
setGlobalOptions({ region: 'us-central1', maxInstances: 20 });

const db = getFirestore();
const erpWebhookSecret = defineSecret('ERP_WEBHOOK_SECRET');

const PLANS = Object.freeze({
  basic: { id: 'basic', name: 'Básico', includedMinutes: 480 },
  pura_vida: { id: 'pura_vida', name: 'Pura Vida', includedMinutes: 720 },
  premium: { id: 'premium', name: 'Premium', includedMinutes: 1200 },
});

const TRANSITIONS = Object.freeze({
  requested: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['completed'],
  completed: [],
  cancelled: [],
});

function requireAuth(request) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
  return {
    uid: request.auth.uid,
    role: request.auth.token.role || 'client',
  };
}

function requireRole(request, roles) {
  const identity = requireAuth(request);
  if (!roles.includes(identity.role)) {
    throw new HttpsError('permission-denied', 'No tienes permisos para esta operación.');
  }
  return identity;
}

function asTrimmedString(value, maxLength = 250) {
  return String(value || '').trim().slice(0, maxLength);
}

function calculatePrequalification(input = {}) {
  const hardStops = [];
  const reviewFlags = [];
  const personaScores = {
    busy_professional: 0,
    rotating_couple: 0,
    limited_mobility: 0,
  };
  const personaLabels = {
    busy_professional: 'Profesional ocupado',
    rotating_couple: 'Pareja con horarios rotativos',
    limited_mobility: 'Adulto mayor con limitaciones físicas',
  };
  let score = 0;

  if (!input.acceptsContact) hardStops.push('CONTACT_CONSENT_REQUIRED');
  if (!input.inServiceArea) reviewFlags.push('OUTSIDE_CONFIRMED_SERVICE_AREA');
  if (input.vaccinationStatus === 'not_current') reviewFlags.push('VACCINATION_REVIEW');
  if (input.behaviorRisk === 'high') reviewFlags.push('BEHAVIOR_ASSESSMENT');
  if (input.emergencyContact === false) reviewFlags.push('EMERGENCY_CONTACT_REQUIRED');

  if (input.scheduleSituation in personaScores) personaScores[input.scheduleSituation] += 55;
  if (input.workHours === 'long') personaScores.busy_professional += 25;
  if (input.scheduleChangesOften) personaScores.rotating_couple += 25;
  if (input.hasPhysicalLimitation) personaScores.limited_mobility += 30;
  if (Number(input.walksPerWeek) >= 3) {
    Object.keys(personaScores).forEach((key) => { personaScores[key] += 10; });
  }

  const [personaId, personaScore] = Object.entries(personaScores).sort((a, b) => b[1] - a[1])[0];
  if (personaScore >= 55) score += 35;
  else if (personaScore >= 25) score += 18;
  if (Number(input.walksPerWeek) >= 2) score += 20;
  if (Number(input.walksPerWeek) >= 4) score += 10;
  if (input.monthlyPlanInterest) score += 15;
  if (Number(input.startWithinDays) <= 30) score += 10;
  if (input.inServiceArea) score += 10;

  const monthlyMinutes = Number(input.walksPerWeek || 0) * Number(input.averageWalkMinutes || 60) * 4;
  const recommendedPlan = monthlyMinutes <= 480
    ? PLANS.basic
    : monthlyMinutes <= 720 ? PLANS.pura_vida : PLANS.premium;
  let status = 'not_qualified';
  if (hardStops.length === 0 && reviewFlags.length === 0 && score >= 60) status = 'qualified';
  else if (hardStops.length === 0 && (score >= 35 || reviewFlags.length > 0)) status = 'manual_review';

  return {
    status,
    score: Math.min(100, score),
    personaId,
    personaLabel: personaLabels[personaId],
    personaScores,
    recommendedPlanId: recommendedPlan.id,
    recommendedPlanName: recommendedPlan.name,
    hardStops,
    reviewFlags,
  };
}

export const submitPrequalification = onCall(async (request) => {
  const answers = request.data?.answers || {};
  const fullName = asTrimmedString(answers.fullName, 100);
  const phone = asTrimmedString(answers.phone, 24);
  if (fullName.length < 2 || phone.replace(/\D/g, '').length < 8) {
    throw new HttpsError('invalid-argument', 'Nombre y teléfono son obligatorios.');
  }

  const result = calculatePrequalification(answers);
  const leadRef = await db.collection('leads').add({
    fullName,
    phone,
    email: asTrimmedString(answers.email, 160).toLowerCase(),
    district: asTrimmedString(answers.district, 100),
    answers: {
      scheduleSituation: answers.scheduleSituation || null,
      workHours: answers.workHours || null,
      scheduleChangesOften: Boolean(answers.scheduleChangesOften),
      hasPhysicalLimitation: Boolean(answers.hasPhysicalLimitation),
      walksPerWeek: Number(answers.walksPerWeek || 0),
      averageWalkMinutes: Number(answers.averageWalkMinutes || 60),
      monthlyPlanInterest: Boolean(answers.monthlyPlanInterest),
      startWithinDays: Number(answers.startWithinDays || 90),
      inServiceArea: Boolean(answers.inServiceArea),
      vaccinationStatus: answers.vaccinationStatus || 'unknown',
      behaviorRisk: answers.behaviorRisk || 'unknown',
      emergencyContact: Boolean(answers.emergencyContact),
      acceptsContact: Boolean(answers.acceptsContact),
    },
    result,
    status: result.status,
    source: 'website_prequalification',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return { leadId: leadRef.id, result };
});

export const requestSubscriptionPlan = onCall(async (request) => {
  const { uid } = requireRole(request, ['client']);
  const plan = PLANS[request.data?.planId];
  if (!plan) throw new HttpsError('invalid-argument', 'Plan inválido.');

  const requestRef = db.collection('subscriptionRequests').doc(uid);
  await requestRef.set({
    clientId: uid,
    planId: plan.id,
    planName: plan.name,
    includedMinutes: plan.includedMinutes,
    status: 'pending_payment',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return { requestId: requestRef.id, status: 'pending_payment' };
});

export const activateSubscription = onCall(async (request) => {
  requireRole(request, ['admin']);
  const clientId = asTrimmedString(request.data?.clientId, 128);
  const plan = PLANS[request.data?.planId];
  if (!clientId || !plan) throw new HttpsError('invalid-argument', 'Cliente o plan inválido.');

  const now = Timestamp.now();
  const periodEnd = Timestamp.fromMillis(now.toMillis() + 30 * 24 * 60 * 60 * 1000);
  await db.runTransaction(async (transaction) => {
    transaction.set(db.collection('subscriptions').doc(clientId), {
      clientId,
      planId: plan.id,
      planName: plan.name,
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      wallet: {
        totalMinutes: plan.includedMinutes,
        consumedMinutes: 0,
        reservedMinutes: 0,
      },
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    transaction.set(db.collection('subscriptionRequests').doc(clientId), {
      status: 'activated',
      activatedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  });
  return { clientId, status: 'active' };
});

export const createAppointment = onCall(async (request) => {
  const identity = requireRole(request, ['client', 'admin', 'editor']);
  const input = request.data || {};
  const clientId = identity.role === 'client' ? identity.uid : asTrimmedString(input.clientId, 128);
  const petId = asTrimmedString(input.petId, 128);
  const durationMinutes = Number(input.durationMinutes);
  const startDate = new Date(input.scheduledStartAt);
  const location = input.location || {};

  if (!clientId || !petId || ![30, 60, 90, 120].includes(durationMinutes)) {
    throw new HttpsError('invalid-argument', 'Cliente, mascota o duración inválidos.');
  }
  if (Number.isNaN(startDate.getTime()) || startDate.getTime() < Date.now() + 15 * 60 * 1000) {
    throw new HttpsError('invalid-argument', 'La cita debe programarse en el futuro.');
  }
  if (!Number.isFinite(location.lat) || !Number.isFinite(location.lng)) {
    throw new HttpsError('invalid-argument', 'Ubicación inválida.');
  }

  const appointmentRef = db.collection('appointments').doc();
  const subscriptionRef = db.collection('subscriptions').doc(clientId);
  const petRef = db.collection('pets').doc(petId);
  await db.runTransaction(async (transaction) => {
    const [subscriptionSnapshot, petSnapshot] = await Promise.all([
      transaction.get(subscriptionRef),
      transaction.get(petRef),
    ]);
    if (!petSnapshot.exists || petSnapshot.data().ownerId !== clientId) {
      throw new HttpsError('permission-denied', 'La mascota no pertenece al cliente.');
    }
    if (!subscriptionSnapshot.exists || subscriptionSnapshot.data().status !== 'active') {
      throw new HttpsError('failed-precondition', 'No existe una suscripción activa.');
    }
    const wallet = subscriptionSnapshot.data().wallet || {};
    const available = Number(wallet.totalMinutes || 0)
      - Number(wallet.consumedMinutes || 0)
      - Number(wallet.reservedMinutes || 0);
    if (available < durationMinutes) {
      throw new HttpsError('failed-precondition', 'Saldo de minutos insuficiente.');
    }

    transaction.set(appointmentRef, {
      clientId,
      petId,
      subscriptionId: clientId,
      walkerId: null,
      serviceType: input.serviceType || 'walk',
      scheduledStartAt: Timestamp.fromDate(startDate),
      durationMinutes,
      location: { lat: Number(location.lat), lng: Number(location.lng) },
      notes: asTrimmedString(input.notes, 500),
      status: 'requested',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.update(subscriptionRef, {
      'wallet.reservedMinutes': FieldValue.increment(durationMinutes),
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.set(db.collection('walletTransactions').doc(`${appointmentRef.id}_reservation`), {
      clientId,
      subscriptionId: clientId,
      appointmentId: appointmentRef.id,
      type: 'reservation_hold',
      minutes: durationMinutes,
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  return { appointmentId: appointmentRef.id, status: 'requested' };
});

export const assignWalker = onCall(async (request) => {
  requireRole(request, ['admin', 'editor']);
  const appointmentId = asTrimmedString(request.data?.appointmentId, 128);
  const walkerId = asTrimmedString(request.data?.walkerId, 128);
  if (!appointmentId || !walkerId) throw new HttpsError('invalid-argument', 'Asignación inválida.');

  const appointmentRef = db.collection('appointments').doc(appointmentId);
  await db.runTransaction(async (transaction) => {
    const appointmentSnapshot = await transaction.get(appointmentRef);
    if (!appointmentSnapshot.exists) throw new HttpsError('not-found', 'Cita no encontrada.');
    const appointment = appointmentSnapshot.data();
    const accessRef = db.collection('walkerPetAccess').doc(`${walkerId}_${appointment.petId}`);
    const startMillis = appointment.scheduledStartAt.toMillis();
    transaction.update(appointmentRef, {
      walkerId,
      status: appointment.status === 'requested' ? 'confirmed' : appointment.status,
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.set(accessRef, {
      walkerId,
      petId: appointment.petId,
      appointmentId,
      activeFrom: Timestamp.fromMillis(startMillis - 2 * 60 * 60 * 1000),
      activeUntil: Timestamp.fromMillis(startMillis + (appointment.durationMinutes + 120) * 60 * 1000),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  return { appointmentId, walkerId, status: 'confirmed' };
});

export const transitionAppointment = onCall(async (request) => {
  const identity = requireAuth(request);
  const appointmentId = asTrimmedString(request.data?.appointmentId, 128);
  const nextStatus = asTrimmedString(request.data?.nextStatus, 32);
  const appointmentRef = db.collection('appointments').doc(appointmentId);
  const completion = request.data?.completion || {};

  await db.runTransaction(async (transaction) => {
    const appointmentSnapshot = await transaction.get(appointmentRef);
    if (!appointmentSnapshot.exists) throw new HttpsError('not-found', 'Cita no encontrada.');
    const appointment = appointmentSnapshot.data();
    if (!TRANSITIONS[appointment.status]?.includes(nextStatus)) {
      throw new HttpsError('failed-precondition', 'Transición de estado inválida.');
    }

    const isStaff = ['admin', 'editor'].includes(identity.role);
    const isAssignedWalker = identity.role === 'walker' && appointment.walkerId === identity.uid;
    const isClientCancellation = identity.role === 'client'
      && appointment.clientId === identity.uid
      && nextStatus === 'cancelled';
    if (!isStaff && !isAssignedWalker && !isClientCancellation) {
      throw new HttpsError('permission-denied', 'No puedes modificar esta cita.');
    }
    if (isAssignedWalker && !['in_progress', 'completed'].includes(nextStatus)) {
      throw new HttpsError('permission-denied', 'Transición no permitida para el paseador.');
    }

    const subscriptionRef = db.collection('subscriptions').doc(appointment.clientId);
    if (nextStatus === 'completed' || nextStatus === 'cancelled') {
      const subscriptionSnapshot = await transaction.get(subscriptionRef);
      if (!subscriptionSnapshot.exists) {
        throw new HttpsError('failed-precondition', 'Suscripción no encontrada.');
      }
      transaction.update(subscriptionRef, {
        'wallet.reservedMinutes': FieldValue.increment(-appointment.durationMinutes),
        ...(nextStatus === 'completed'
          ? { 'wallet.consumedMinutes': FieldValue.increment(appointment.durationMinutes) }
          : {}),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    transaction.update(appointmentRef, {
      status: nextStatus,
      updatedAt: FieldValue.serverTimestamp(),
      ...(nextStatus === 'in_progress' ? { startedAt: FieldValue.serverTimestamp() } : {}),
      ...(nextStatus === 'completed' ? { completedAt: FieldValue.serverTimestamp() } : {}),
      ...(nextStatus === 'cancelled' ? { cancelledAt: FieldValue.serverTimestamp() } : {}),
    });

    if (nextStatus === 'completed') {
      transaction.set(db.collection('walkLogs').doc(appointmentId), {
        appointmentId,
        clientId: appointment.clientId,
        petId: appointment.petId,
        walkerId: appointment.walkerId,
        durationMinutes: appointment.durationMinutes,
        notes: asTrimmedString(completion.notes, 1000),
        media: Array.isArray(completion.media) ? completion.media.slice(0, 20) : [],
        completedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      });
      transaction.set(db.collection('walletTransactions').doc(`${appointmentId}_consumption`), {
        clientId: appointment.clientId,
        subscriptionId: appointment.clientId,
        appointmentId,
        type: 'service_consumption',
        minutes: appointment.durationMinutes,
        createdAt: FieldValue.serverTimestamp(),
      });
    }
  });
  return { appointmentId, status: nextStatus };
});

export const setStaffRole = onCall(async (request) => {
  requireRole(request, ['admin']);
  const targetUid = asTrimmedString(request.data?.uid, 128);
  const nextRole = asTrimmedString(request.data?.role, 32);
  if (!targetUid || !['admin', 'editor', 'walker', 'client'].includes(nextRole)) {
    throw new HttpsError('invalid-argument', 'Usuario o rol inválido.');
  }

  const userRef = db.collection('users').doc(targetUid);
  const seatsRef = db.collection('system').doc('rbacSeats');
  let previousRole = 'client';
  await db.runTransaction(async (transaction) => {
    const [userSnapshot, seatsSnapshot, staffSnapshot] = await Promise.all([
      transaction.get(userRef),
      transaction.get(seatsRef),
      transaction.get(db.collection('users').where('role', 'in', ['admin', 'editor'])),
    ]);
    previousRole = userSnapshot.exists ? userSnapshot.data().role || 'client' : 'client';
    const derivedSeats = staffSnapshot.docs.reduce((counts, document) => {
      const role = document.data().role;
      counts[role] += 1;
      return counts;
    }, { admin: 0, editor: 0 });
    const seats = seatsSnapshot.exists ? seatsSnapshot.data() : derivedSeats;
    const nextSeats = {
      admin: Number(seats.admin || 0),
      editor: Number(seats.editor || 0),
    };
    if (previousRole in nextSeats) nextSeats[previousRole] -= 1;
    if (nextRole in nextSeats) nextSeats[nextRole] += 1;
    if (nextSeats.admin > 3 || nextSeats.editor > 5 || nextSeats.admin < 0 || nextSeats.editor < 0) {
      throw new HttpsError('resource-exhausted', 'Se excedería el límite de 3 administradores o 5 editores.');
    }
    transaction.set(seatsRef, { ...nextSeats, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    transaction.set(userRef, { role: nextRole, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  });

  try {
    await getAuth().setCustomUserClaims(targetUid, { role: nextRole });
  } catch (error) {
    await userRef.set({ role: previousRole, roleSyncError: true, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    throw new HttpsError('internal', 'No se pudo sincronizar el rol con Firebase Auth.', error.message);
  }
  return { uid: targetUid, role: nextRole };
});

export const erpSubscriptionWebhook = onRequest(
  { secrets: [erpWebhookSecret] },
  async (request, response) => {
    if (request.method !== 'POST') {
      response.status(405).send('Method not allowed');
      return;
    }
    if (request.get('x-webhook-secret') !== erpWebhookSecret.value()) {
      response.status(401).send('Unauthorized');
      return;
    }
    const eventId = asTrimmedString(request.body?.eventId, 160);
    const clientId = asTrimmedString(request.body?.clientId, 128);
    if (!eventId || !clientId) {
      response.status(400).send('Invalid event');
      return;
    }

    const receiptRef = db.collection('webhookReceipts').doc(`erp_${eventId}`);
    await db.runTransaction(async (transaction) => {
      const receiptSnapshot = await transaction.get(receiptRef);
      if (receiptSnapshot.exists) return;
      const subscriptionRef = db.collection('subscriptions').doc(clientId);
      const subscriptionSnapshot = await transaction.get(subscriptionRef);
      const paymentSucceeded = request.body.type === 'payment_succeeded';
      const status = paymentSucceeded ? 'active' : 'past_due';
      const plan = PLANS[request.body.planId]
        || PLANS[subscriptionSnapshot.data()?.planId];
      if (paymentSucceeded && !plan) {
        throw new Error('PLAN_REQUIRED_FOR_PAYMENT_SUCCESS');
      }
      const reservedMinutes = Number(subscriptionSnapshot.data()?.wallet?.reservedMinutes || 0);
      const now = Timestamp.now();
      const periodEnd = Timestamp.fromMillis(now.toMillis() + 30 * 24 * 60 * 60 * 1000);
      transaction.set(receiptRef, {
        provider: 'erp',
        eventId,
        type: request.body.type || 'unknown',
        receivedAt: FieldValue.serverTimestamp(),
      });
      transaction.set(subscriptionRef, {
        clientId,
        status,
        ...(paymentSucceeded ? {
          planId: plan.id,
          planName: plan.name,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          wallet: {
            totalMinutes: plan.includedMinutes,
            consumedMinutes: 0,
            reservedMinutes,
          },
        } : {}),
        externalSubscriptionId: asTrimmedString(request.body.externalSubscriptionId, 160),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    });
    response.status(204).send();
  },
);
