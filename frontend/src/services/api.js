import * as db from '../database/db';

/*
 * API boundary. The rest of the application only talks to this module.
 * To connect a FastAPI backend, set VITE_API_BASE_URL in .env and implement the
 * same method signatures with fetch() (see backendRequest below). The mock
 * implementation persists records in IndexedDB so the demo works offline.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const USE_BACKEND = Boolean(BASE_URL);
const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

async function backendRequest(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
}

const storeMethods = {
  patients: {
    list: () => db.getAll('patients'),
    save: (record) => db.put('patients', record),
  },
  consultations: {
    list: () => db.getAll('consultations'),
    save: (record) => db.put('consultations', record),
  },
  referrals: {
    list: () => db.getAll('referrals'),
    save: (record) => db.put('referrals', record),
  },
  reviews: {
    list: () => db.getAll('reviews'),
    save: (record) => db.put('reviews', record),
  },
  syncQueue: {
    list: () => db.getAll('syncQueue'),
    save: (record) => db.put('syncQueue', record),
  },
  auditLog: {
    list: () => db.getAll('auditLog'),
    save: (record) => db.put('auditLog', record),
  },
};

async function listStore(name) {
  if (USE_BACKEND) return backendRequest(`/${name}/`);
  await delay();
  return storeMethods[name].list();
}

async function saveStore(name, record) {
  if (USE_BACKEND) {
    return backendRequest(`/${name}/`, { method: 'POST', body: JSON.stringify(record) });
  }
  await delay(80);
  const saved = await storeMethods[name].save(record);
  return saved;
}

export const api = {
  usingBackend: USE_BACKEND,
  init: async () => {
    if (USE_BACKEND) return true;
    return db.seedDatabase();
  },
  reset: async () => {
    if (USE_BACKEND) return false;
    await db.resetDatabase();
    return true;
  },
  listPatients: () => listStore('patients'),
  savePatient: (record) => saveStore('patients', record),
  listConsultations: () => listStore('consultations'),
  saveConsultation: (record) => saveStore('consultations', record),
  listReferrals: () => listStore('referrals'),
  saveReferral: (record) => saveStore('referrals', record),
  listReviews: () => listStore('reviews'),
  saveReview: (record) => saveStore('reviews', record),
  listSyncQueue: () => listStore('syncQueue'),
  saveSyncItem: (record) => saveStore('syncQueue', record),
  listAuditLog: () => listStore('auditLog'),
  appendAudit: (record) => saveStore('auditLog', record),
};
