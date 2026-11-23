import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../services/api';
import { synchronizeQueue } from '../services/syncService';
import { nextPatientSequence } from '../database/seed';
import { patientId as makePatientId, uid, nowIso } from '../utils/id';

const AppContext = createContext(null);
const LAST_SYNC_KEY = 'swasthyasetu.lastSync';

const EMPTY = {
  patients: [],
  consultations: [],
  referrals: [],
  reviews: [],
  syncQueue: [],
  auditLog: [],
};

function queueItem(type, ref, label, status = 'Pending Sync') {
  return {
    id: uid('sq'),
    recordType: type,
    recordRef: ref,
    label,
    status,
    attempts: 0,
    createdAt: nowIso(),
    lastAttempt: null,
  };
}

function auditEntry(action, detail, actor = 'System', role = 'system') {
  return { id: uid('audit'), at: nowIso(), actor, role, action, detail };
}

export function AppProvider({ children }) {
  const [state, setState] = useState({ ...EMPTY, loading: true, error: '' });
  const stateRef = useRef(state);
  const [lastSync, setLastSync] = useState(() => localStorage.getItem(LAST_SYNC_KEY) || null);
  const [syncing, setSyncing] = useState(false);

  const commit = useCallback((updater) => {
    setState((previous) => {
      const next = { ...previous, ...(typeof updater === 'function' ? updater(previous) : updater) };
      stateRef.current = next;
      return next;
    });
  }, []);

  const load = useCallback(async () => {
    try {
      commit({ loading: true, error: '' });
      await api.init();
      const [patients, consultations, referrals, reviews, syncQueue, auditLog] = await Promise.all([
        api.listPatients(),
        api.listConsultations(),
        api.listReferrals(),
        api.listReviews(),
        api.listSyncQueue(),
        api.listAuditLog(),
      ]);
      commit({
        patients: patients || [],
        consultations: consultations || [],
        referrals: referrals || [],
        reviews: reviews || [],
        syncQueue: syncQueue || [],
        auditLog: auditLog || [],
        loading: false,
      });
    } catch (error) {
      commit({ loading: false, error: error.message || 'Unable to load local records.' });
    }
  }, [commit]);

  useEffect(() => { load(); }, [load]);

  const addPatient = useCallback(async (values, options = {}) => {
    const sequence = nextPatientSequence(stateRef.current.patients);
    const record = {
      ...values,
      id: uid('patient'),
      patientId: makePatientId(sequence),
      consent: Boolean(values.consent),
      syncStatus: values.syncStatus || (options.draft ? 'Saved Locally' : 'Pending Sync'),
      draft: Boolean(options.draft),
      createdAt: nowIso(),
      updatedAt: nowIso(),
      createdBy: options.actor || 'Lakshmi N.',
    };
    const item = queueItem('Patient', record.id, `Patient · ${record.name}`, record.syncStatus);
    const log = auditEntry(
      options.draft ? 'Draft saved locally' : 'Patient registered',
      `${record.patientId} · stored in IndexedDB`,
      options.actor || 'Lakshmi N.',
      options.role || 'worker',
    );
    commit((prev) => ({
      patients: [record, ...prev.patients],
      syncQueue: [item, ...prev.syncQueue],
      auditLog: [log, ...prev.auditLog],
    }));
    await Promise.all([api.savePatient(record), api.saveSyncItem(item), api.appendAudit(log)]);
    return record;
  }, [commit]);

  const updatePatient = useCallback(async (id, patch) => {
    const current = stateRef.current.patients.find((p) => p.id === id || p.patientId === id);
    if (!current) return null;
    const record = { ...current, ...patch, updatedAt: nowIso() };
    commit((prev) => ({ patients: prev.patients.map((p) => (p.id === current.id ? record : p)) }));
    await api.savePatient(record);
    return record;
  }, [commit]);

  const saveConsultation = useCallback(async (record, options = {}) => {
    const exists = stateRef.current.consultations.some((item) => item.id === record.id);
    const saved = { ...record, id: record.id || uid('consultation'), updatedAt: nowIso(), syncStatus: record.syncStatus || 'Pending Sync' };
    const item = exists ? null : queueItem('Consultation', saved.id, `Consultation · ${saved.patientName || saved.patientRef}`);
    const log = auditEntry(
      exists ? 'Consultation updated' : 'Consultation created',
      `${saved.patientRef || ''} · ${saved.status || 'draft'}`,
      options.actor || 'Lakshmi N.',
      options.role || 'worker',
    );
    commit((prev) => ({
      consultations: exists
        ? prev.consultations.map((c) => (c.id === saved.id ? saved : c))
        : [saved, ...prev.consultations],
      syncQueue: item ? [item, ...prev.syncQueue] : prev.syncQueue,
      auditLog: [log, ...prev.auditLog],
    }));
    await Promise.all([api.saveConsultation(saved), ...(item ? [api.saveSyncItem(item)] : []), api.appendAudit(log)]);
    return saved;
  }, [commit]);

  const updateConsultation = useCallback(async (id, patch) => {
    const current = stateRef.current.consultations.find((item) => item.id === id);
    if (!current) return null;
    const record = { ...current, ...patch, updatedAt: nowIso() };
    commit((prev) => ({ consultations: prev.consultations.map((c) => (c.id === id ? record : c)) }));
    await api.saveConsultation(record);
    return record;
  }, [commit]);

  const createReferral = useCallback(async (payload, options = {}) => {
    const record = {
      ...payload,
      id: uid('referral'),
      reference: payload.reference || `REF-2026-${String(stateRef.current.referrals.length + 1).padStart(4, '0')}`,
      createdAt: nowIso(),
      submittedAt: payload.status === 'Submitted' ? nowIso() : null,
      status: payload.status || 'Created',
      review: null,
      syncStatus: 'Pending Sync',
    };
    const item = queueItem('Referral', record.id, `Referral · ${record.patientName}`);
    const log = auditEntry('Referral created', `${record.reference} · ${record.priority}`, options.actor || 'Lakshmi N.', options.role || 'worker');
    commit((prev) => ({
      referrals: [record, ...prev.referrals],
      syncQueue: [item, ...prev.syncQueue],
      auditLog: [log, ...prev.auditLog],
    }));
    await Promise.all([api.saveReferral(record), api.saveSyncItem(item), api.appendAudit(log)]);
    return record;
  }, [commit]);

  const submitReferral = useCallback(async (id, options = {}) => {
    const current = stateRef.current.referrals.find((item) => item.id === id);
    if (!current) return null;
    const record = { ...current, status: 'Submitted', submittedAt: nowIso(), syncStatus: 'Pending Sync' };
    const exists = stateRef.current.syncQueue.some((item) => item.recordRef === id && item.recordType === 'Referral');
    const item = exists ? null : queueItem('Referral', id, `Referral · ${record.patientName}`);
    const log = auditEntry('Referral submitted', `${record.reference} · digital submission`, options.actor || 'Lakshmi N.', options.role || 'worker');
    commit((prev) => ({
      referrals: prev.referrals.map((r) => (r.id === id ? record : r)),
      syncQueue: item ? [item, ...prev.syncQueue] : prev.syncQueue,
      auditLog: [log, ...prev.auditLog],
    }));
    await Promise.all([api.saveReferral(record), ...(item ? [api.saveSyncItem(item)] : []), api.appendAudit(log)]);
    return record;
  }, [commit]);

  const submitReview = useCallback(async (referralId, reviewValues, options = {}) => {
    const referral = stateRef.current.referrals.find((item) => item.id === referralId);
    if (!referral) return null;
    const review = {
      ...reviewValues,
      id: uid('review'),
      referralId,
      reviewer: options.actor || 'Dr. Ananya Rao',
      submittedAt: nowIso(),
    };
    const nextStatus = ['Advice Recorded', 'Closed', 'Under Review'].includes(review.reviewStatus)
      ? review.reviewStatus
      : 'Advice Recorded';
    const updatedReferral = { ...referral, status: nextStatus, review };
    const log = auditEntry('Specialist review submitted', `${referral.reference} · ${nextStatus}`, review.reviewer, 'doctor');
    commit((prev) => ({
      reviews: [review, ...prev.reviews],
      referrals: prev.referrals.map((r) => (r.id === referralId ? updatedReferral : r)),
      auditLog: [log, ...prev.auditLog],
    }));
    await Promise.all([api.saveReview(review), api.saveReferral(updatedReferral), api.appendAudit(log)]);
    return review;
  }, [commit]);

  const runSync = useCallback(async ({ online, retryFailedOnly = false } = {}) => {
    if (syncing) return null;
    setSyncing(true);
    try {
      const result = await synchronizeQueue(stateRef.current.syncQueue, { online, retryFailedOnly });
      commit((prev) => ({ syncQueue: result.updated }));

      const syncedItems = result.updated.filter((item) => item.status === 'Synchronized');
      const savePromises = [];
      const patients = stateRef.current.patients.map((patient) => {
        const item = syncedItems.find((entry) => entry.recordType === 'Patient' && entry.recordRef === patient.id);
        if (!item) return patient;
        const updated = { ...patient, syncStatus: 'Synchronized', updatedAt: nowIso() };
        savePromises.push(api.savePatient(updated));
        return updated;
      });
      const consultations = stateRef.current.consultations.map((consultation) => {
        const item = syncedItems.find((entry) => entry.recordType === 'Consultation' && entry.recordRef === consultation.id);
        if (!item) return consultation;
        const updated = { ...consultation, syncStatus: 'Synchronized' };
        savePromises.push(api.saveConsultation(updated));
        return updated;
      });
      const referrals = stateRef.current.referrals.map((referral) => {
        const item = syncedItems.find((entry) => entry.recordType === 'Referral' && entry.recordRef === referral.id);
        if (!item) return referral;
        const updated = { ...referral, syncStatus: 'Synchronized' };
        savePromises.push(api.saveReferral(updated));
        return updated;
      });

      let audit = null;
      if (result.synced > 0) {
        audit = auditEntry('Synchronization completed', `${result.synced} record(s) synchronized`);
        savePromises.push(api.appendAudit(audit));
      }
      commit((prev) => ({
        patients,
        consultations,
        referrals,
        auditLog: audit ? [audit, ...prev.auditLog] : prev.auditLog,
      }));

      if (result.online && result.synced > 0) {
        const timestamp = nowIso();
        localStorage.setItem(LAST_SYNC_KEY, timestamp);
        setLastSync(timestamp);
      }
      await Promise.all(savePromises);
      return result;
    } finally {
      setSyncing(false);
    }
  }, [commit, syncing]);

  const appendAudit = useCallback(async (action, detail, actor, role) => {
    const log = auditEntry(action, detail, actor, role);
    commit((prev) => ({ auditLog: [log, ...prev.auditLog] }));
    await api.appendAudit(log);
  }, [commit]);

  const resetDemo = useCallback(async () => {
    await api.reset();
    localStorage.removeItem(LAST_SYNC_KEY);
    setLastSync(null);
    await load();
  }, [load]);

  const value = useMemo(() => ({
    ...state,
    lastSync,
    syncing,
    addPatient,
    updatePatient,
    saveConsultation,
    updateConsultation,
    createReferral,
    submitReferral,
    submitReview,
    runSync,
    appendAudit,
    resetDemo,
    reload: load,
    usingBackend: api.usingBackend,
    getPatient: (ref) => state.patients.find((p) => p.id === ref || p.patientId === ref),
  }), [state, lastSync, syncing, addPatient, updatePatient, saveConsultation, updateConsultation, createReferral, submitReferral, submitReview, runSync, appendAudit, resetDemo, load]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}
