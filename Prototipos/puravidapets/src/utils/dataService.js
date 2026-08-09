import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from './firebase';
import {
  PLAN_CATALOG,
  buildWhatsAppLeadUrl,
  calculatePrequalification,
  getAvailableMinutes,
  validateAppointment,
} from '../core/businessRules';

export { PLAN_CATALOG, calculatePrequalification, getAvailableMinutes };

const COLLECTIONS = Object.freeze({
  users: 'users',
  clients: 'clients',
  pets: 'pets',
  walkers: 'walkers',
  subscriptions: 'subscriptions',
  subscriptionRequests: 'subscriptionRequests',
  appointments: 'appointments',
  walkLogs: 'walkLogs',
  transactions: 'walletTransactions',
  leads: 'leads',
});

function mapValue(value) {
  if (value?.toDate instanceof Function) return value.toDate();
  if (Array.isArray(value)) return value.map(mapValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, mapValue(nested)]));
  }
  return value;
}

function mapDocument(snapshot) {
  return snapshot.exists()
    ? { id: snapshot.id, ...mapValue(snapshot.data()) }
    : null;
}

function mapCollection(snapshot) {
  return snapshot.docs.map(mapDocument);
}

function reportListenerError(onError, error) {
  if (onError) onError(error);
}

function listenToDocument(reference, onData, onError) {
  return onSnapshot(
    reference,
    (snapshot) => onData(mapDocument(snapshot)),
    (error) => reportListenerError(onError, error),
  );
}

function listenToQuery(reference, onData, onError) {
  return onSnapshot(
    reference,
    (snapshot) => onData(mapCollection(snapshot)),
    (error) => reportListenerError(onError, error),
  );
}

function combineUnsubscribers(unsubscribers) {
  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}

async function callBackend(name, payload) {
  const callable = httpsCallable(functions, name);
  const response = await callable(payload);
  return response.data;
}

export async function createAppointment(appointmentData) {
  const appointment = validateAppointment(appointmentData);
  return callBackend('createAppointment', {
    ...appointment,
    scheduledStartAt: appointment.scheduledStartAt.toISOString(),
  });
}

export async function requestSubscriptionPlan(planId) {
  if (!PLAN_CATALOG[planId]) throw new Error('PLAN_NOT_FOUND');
  return callBackend('requestSubscriptionPlan', { planId });
}

export async function transitionAppointment(appointmentId, nextStatus, completion = {}) {
  if (!appointmentId || !nextStatus) throw new Error('APPOINTMENT_AND_STATUS_REQUIRED');
  return callBackend('transitionAppointment', { appointmentId, nextStatus, completion });
}

export async function assignWalkerToAppointment(appointmentId, walkerId) {
  return callBackend('assignWalker', { appointmentId, walkerId });
}

export async function activateClientSubscription(clientId, planId) {
  if (!PLAN_CATALOG[planId]) throw new Error('PLAN_NOT_FOUND');
  return callBackend('activateSubscription', { clientId, planId });
}

export async function setUserRole(userId, role) {
  if (!['admin', 'editor', 'walker', 'client'].includes(role)) throw new Error('INVALID_ROLE');
  return callBackend('setStaffRole', { uid: userId, role });
}

export async function submitPrequalification(input) {
  const localResult = calculatePrequalification(input);
  const persisted = await callBackend('submitPrequalification', { answers: input });
  const result = persisted?.result || localResult;
  return {
    ...persisted,
    result,
    whatsappUrl: getWhatsAppUrl(result, input),
  };
}

export function getPrequalificationPreview(input) {
  const result = calculatePrequalification(input);
  return { result, whatsappUrl: getWhatsAppUrl(result, input) };
}

function getWhatsAppUrl(result, input) {
  const businessPhone = import.meta.env.VITE_WHATSAPP_PHONE;
  return businessPhone
    ? buildWhatsAppLeadUrl(businessPhone, result, input)
    : 'https://wa.link/1slsaj';
}

export function subscribeToClientWorkspace(clientId, handlers = {}) {
  if (!clientId) return () => {};
  const subscriptions = [
    listenToDocument(
      doc(db, COLLECTIONS.subscriptions, clientId),
      handlers.onSubscription || (() => {}),
      handlers.onError,
    ),
    listenToQuery(
      query(
        collection(db, COLLECTIONS.pets),
        where('ownerId', '==', clientId),
        orderBy('name', 'asc'),
      ),
      handlers.onPets || (() => {}),
      handlers.onError,
    ),
    listenToQuery(
      query(
        collection(db, COLLECTIONS.appointments),
        where('clientId', '==', clientId),
        orderBy('scheduledStartAt', 'desc'),
        limit(30),
      ),
      handlers.onAppointments || (() => {}),
      handlers.onError,
    ),
    listenToQuery(
      query(
        collection(db, COLLECTIONS.walkLogs),
        where('clientId', '==', clientId),
        orderBy('completedAt', 'desc'),
        limit(30),
      ),
      handlers.onWalkLogs || (() => {}),
      handlers.onError,
    ),
  ];
  return combineUnsubscribers(subscriptions);
}

export function subscribeToAdminWorkspace(handlers = {}) {
  const subscriptions = [
    listenToQuery(
      query(collection(db, COLLECTIONS.clients), orderBy('fullName', 'asc'), limit(100)),
      handlers.onClients || (() => {}),
      handlers.onError,
    ),
    listenToQuery(
      query(collection(db, COLLECTIONS.walkers), orderBy('displayName', 'asc'), limit(100)),
      handlers.onWalkers || (() => {}),
      handlers.onError,
    ),
    listenToQuery(
      query(collection(db, COLLECTIONS.appointments), orderBy('scheduledStartAt', 'desc'), limit(100)),
      handlers.onAppointments || (() => {}),
      handlers.onError,
    ),
    listenToQuery(
      query(collection(db, COLLECTIONS.leads), orderBy('createdAt', 'desc'), limit(100)),
      handlers.onLeads || (() => {}),
      handlers.onError,
    ),
    listenToQuery(
      query(collection(db, COLLECTIONS.subscriptions), orderBy('updatedAt', 'desc'), limit(100)),
      handlers.onSubscriptions || (() => {}),
      handlers.onError,
    ),
    listenToQuery(
      query(collection(db, COLLECTIONS.subscriptionRequests), orderBy('createdAt', 'desc'), limit(100)),
      handlers.onSubscriptionRequests || (() => {}),
      handlers.onError,
    ),
    listenToQuery(
      query(collection(db, COLLECTIONS.users), orderBy('displayName', 'asc'), limit(100)),
      handlers.onUsers || (() => {}),
      handlers.onError,
    ),
  ];
  return combineUnsubscribers(subscriptions);
}

export function subscribeToWalkerAgenda(walkerId, handlers = {}) {
  if (!walkerId) return () => {};
  return listenToQuery(
    query(
      collection(db, COLLECTIONS.appointments),
      where('walkerId', '==', walkerId),
      orderBy('scheduledStartAt', 'asc'),
      limit(50),
    ),
    handlers.onAppointments || (() => {}),
    handlers.onError,
  );
}

export async function getPetForWalker(petId) {
  if (!petId) throw new Error('PET_ID_REQUIRED');
  return mapDocument(await getDoc(doc(db, COLLECTIONS.pets, petId)));
}

export async function getClientAppointments(clientId) {
  const snapshot = await getDocs(query(
    collection(db, COLLECTIONS.appointments),
    where('clientId', '==', clientId),
    orderBy('scheduledStartAt', 'desc'),
    limit(30),
  ));
  return mapCollection(snapshot);
}

export async function getWalkers() {
  const snapshot = await getDocs(query(
    collection(db, COLLECTIONS.walkers),
    orderBy('displayName', 'asc'),
    limit(100),
  ));
  return mapCollection(snapshot);
}

export async function getUserProfile(userId) {
  return mapDocument(await getDoc(doc(db, COLLECTIONS.users, userId)));
}

export function subscribeToUserProfile(userId, onData, onError) {
  if (!userId) return () => {};
  return listenToDocument(doc(db, COLLECTIONS.users, userId), onData, onError);
}

export async function updateUserProfile(userId, data) {
  const allowedFields = ['displayName', 'phone', 'locale', 'notifications'];
  const safeData = Object.fromEntries(
    Object.entries(data).filter(([key]) => allowedFields.includes(key)),
  );
  await updateDoc(doc(db, COLLECTIONS.users, userId), {
    ...safeData,
    updatedAt: serverTimestamp(),
  });
}
