import { RULE_VERSION } from '../utils/constants';

/*
 * All records below are fictional demonstration data. No real patient data is
 * included. Labels in the UI mark these records as simulated.
 */
const ago = (days, hours = 0) => new Date(Date.now() - days * 86400000 - hours * 3600000).toISOString();
const ahead = (hours) => new Date(Date.now() + hours * 3600000).toISOString();

export const HEALTH_CENTRES = [
  { id: 'hc-1', name: 'Hosur Community Health Centre', district: 'Krishnagiri', state: 'Tamil Nadu', workers: 3, status: 'Active' },
  { id: 'hc-2', name: 'Bagalur Primary Health Centre', district: 'Krishnagiri', state: 'Tamil Nadu', workers: 2, status: 'Active' },
  { id: 'hc-3', name: 'Denkanikottai Health Sub-centre', district: 'Krishnagiri', state: 'Tamil Nadu', workers: 2, status: 'Active' },
  { id: 'hc-4', name: 'Attibele Mobile Health Unit', district: 'Bengaluru Rural', state: 'Karnataka', workers: 1, status: 'Active' },
];

export const USERS = [
  { id: 'u-worker-1', name: 'Lakshmi N.', role: 'worker', email: 'worker@swasthyasetu.ai', centre: 'Hosur Community Health Centre', status: 'Active', phone: '+91 98450 11223' },
  { id: 'u-worker-2', name: 'Ramesh B.', role: 'worker', email: 'ramesh@swasthyasetu.ai', centre: 'Bagalur Primary Health Centre', status: 'Active', phone: '+91 98450 44556' },
  { id: 'u-worker-3', name: 'Fatima S.', role: 'worker', email: 'fatima@swasthyasetu.ai', centre: 'Denkanikottai Health Sub-centre', status: 'Active', phone: '+91 98450 77889' },
  { id: 'u-doctor-1', name: 'Dr. Ananya Rao', role: 'doctor', email: 'doctor@swasthyasetu.ai', centre: 'District Telemedicine Hub', status: 'Active', speciality: 'Internal Medicine' },
  { id: 'u-doctor-2', name: 'Dr. Meera Iyer', role: 'doctor', email: 'meera@swasthyasetu.ai', centre: 'District Telemedicine Hub', status: 'Active', speciality: 'General Medicine' },
  { id: 'u-admin-1', name: 'Rajesh Kumar', role: 'admin', email: 'admin@swasthyasetu.ai', centre: 'State Health Mission', status: 'Active' },
];

const patient = (n, name, age, sex, village, extra = {}) => ({
  id: `p-${n}`,
  patientId: `SS-2026-${String(n).padStart(5, '0')}`,
  name,
  age,
  sex,
  village,
  phone: extra.phone || '',
  medicalHistory: extra.history || 'No significant history recorded.',
  allergies: extra.allergies || 'None known',
  consent: true,
  syncStatus: extra.syncStatus || 'Synchronized',
  createdAt: ago(extra.createdDays ?? 20 - n, 2),
  updatedAt: ago(extra.updatedDays ?? 1, 4),
  createdBy: 'Lakshmi N.',
  draft: false,
});

export const PATIENTS = [
  patient(1, 'Suresh Kumar', 42, 'Male', 'Hosur', {
    history: 'Hypertension, reportedly irregular treatment.', allergies: 'Penicillin', syncStatus: 'Synchronized',
    phone: '+91 98765 10001', updatedDays: 0,
  }),
  patient(2, 'Kamala Devi', 35, 'Female', 'Bagalur', {
    history: 'No chronic illness reported.', phone: '+91 98765 10002', updatedDays: 0,
  }),
  patient(3, 'Ravi Naik', 28, 'Male', 'Attibele', {
    history: 'No significant history recorded.', syncStatus: 'Pending Sync', updatedDays: 1,
  }),
  patient(4, 'Lakshmamma', 62, 'Female', 'Denkanikottai', {
    history: 'Type 2 diabetes and hypertension.', allergies: 'Sulfonamides', phone: '+91 98765 10004', updatedDays: 2,
  }),
  patient(5, 'Arjun Gowda', 19, 'Male', 'Hosur', { history: 'Seasonal skin reactions.', updatedDays: 3 }),
  patient(6, 'Meena Bai', 47, 'Female', 'Bagalur', {
    history: 'Frequent headaches, no prior evaluation.', syncStatus: 'Sync Failed', updatedDays: 4,
  }),
  patient(7, 'Chandru H.', 31, 'Male', 'Attibele', { history: 'No significant history recorded.', updatedDays: 5 }),
  patient(8, 'Anitha R.', 26, 'Female', 'Hosur', { history: 'Previous episode of fatigue.', updatedDays: 6 }),
  patient(9, 'Narayana Swamy', 70, 'Male', 'Denkanikottai', {
    history: 'Chronic respiratory condition.', allergies: 'Dust', phone: '+91 98765 10009', updatedDays: 1,
  }),
  patient(10, 'Priya M.', 8, 'Female', 'Bagalur', {
    history: 'No significant history recorded.', syncStatus: 'Saved Locally', updatedDays: 0,
  }),
];

const symptom = (label, duration = '', confidence = 'high', confirmed = true) => ({
  id: `sym-${label.toLowerCase().replace(/\s+/g, '-')}`,
  label,
  duration,
  confidence,
  confirmed,
  source: 'extracted',
});

const consultation = (n, patientRef, overrides = {}) => ({
  id: `c-${n}`,
  patientRef,
  patientName: PATIENTS.find((p) => p.patientId === patientRef)?.name || '',
  workerId: 'u-worker-1',
  workerName: 'Lakshmi N.',
  language: overrides.language || 'en',
  createdAt: overrides.createdAt || ago(n, 3),
  updatedAt: overrides.updatedAt || ago(n, 2),
  status: 'completed',
  transcript: overrides.transcript || '',
  symptoms: overrides.symptoms || [],
  vitals: overrides.vitals || {},
  assessment: overrides.assessment || null,
  syncStatus: overrides.syncStatus || 'Synchronized',
  reviewId: overrides.reviewId || null,
});

export const CONSULTATIONS = [
  consultation(1, 'SS-2026-00001', {
    createdAt: ago(0, 6), updatedAt: ago(0, 5),
    language: 'kn',
    transcript: 'ರೋಗಿಗೆ ಎದೆ ನೋವು ಮತ್ತು ಉಸಿರಾಟದ ತೊಂದರೆ ಎರಡು ಗಂಟೆಗಳಿಂದ ಇದೆ. ಅವರು ಹಿಂದೆ ಅಧಿಕ ರಕ್ತದೊತ್ತಡದಿಂದ ಬಳಲುತ್ತಿದ್ದಾರೆ.',
    symptoms: [symptom('Chest pain', '2 hours'), symptom('Breathlessness', '2 hours')],
    vitals: { temperature: '38.1', pulse: '124', systolic: '92', diastolic: '60', spo2: '88', respiratoryRate: '28' },
    assessment: {
      level: 'emergency',
      title: 'Emergency warning',
      reasons: ['SpO2 is below 90%.', 'Systolic blood pressure is below 90 mmHg.', 'Chest pain with breathlessness reported.'],
      action: 'Escalate immediately through local emergency protocols. Arrange urgent transport and inform the remote specialist. Do not wait for digital referral acknowledgement.',
      evaluatedAt: ago(0, 5),
    },
    syncStatus: 'Synchronized',
  }),
  consultation(2, 'SS-2026-00002', {
    createdAt: ago(0, 3), updatedAt: ago(0, 2),
    language: 'hi',
    transcript: 'रोगी को तीन दिन से बुखार है और खाँसी भी है।',
    symptoms: [symptom('Fever', '3 days'), symptom('Cough', '')],
    vitals: { temperature: '38.6', pulse: '96', systolic: '118', diastolic: '76', spo2: '97', respiratoryRate: '20' },
    assessment: {
      level: 'assessment',
      title: 'Further clinical assessment required',
      reasons: ['Fever reported for 3 days with cough.', 'Temperature is above 38.5 °C.'],
      action: 'Complete clinical examination, record hydration status and arrange remote specialist review if symptoms persist.',
      evaluatedAt: ago(0, 2),
    },
    syncStatus: 'Pending Sync',
  }),
  consultation(3, 'SS-2026-00003', {
    createdAt: ago(1, 5), updatedAt: ago(1, 4),
    language: 'en',
    transcript: 'Patient reports mild fatigue after work. No fever or breathing difficulty.',
    symptoms: [symptom('Fatigue', '')],
    vitals: { temperature: '36.8', pulse: '72', systolic: '122', diastolic: '78', spo2: '98', respiratoryRate: '16' },
    assessment: {
      level: 'none',
      title: 'No predefined warning triggered',
      reasons: ['Vitals are within the demonstration reference ranges.'],
      action: 'Continue standard clinical assessment per local protocol. Document findings and give follow-up advice.',
      evaluatedAt: ago(1, 4),
    },
    syncStatus: 'Pending Sync',
  }),
  consultation(4, 'SS-2026-00004', {
    createdAt: ago(2, 6), updatedAt: ago(2, 5),
    language: 'kn',
    transcript: 'ರೋಗಿಗೆ ತಲೆತಿರುಗುವಿಕೆ ಮತ್ತು ಆಯಾಸ ಇದೆ. ಅವರು ಮಧುಮೇಹ ಮತ್ತು ಅಧಿಕ ರಕ್ತದೊತ್ತಡದಿಂದ ಬಳಲುತ್ತಿದ್ದಾರೆ.',
    symptoms: [symptom('Dizziness', ''), symptom('Fatigue', '')],
    vitals: { temperature: '37.0', pulse: '88', systolic: '146', diastolic: '92', spo2: '96', respiratoryRate: '18' },
    assessment: {
      level: 'assessment',
      title: 'Further clinical assessment required',
      reasons: ['Elevated blood pressure reading in a patient with reported hypertension.'],
      action: 'Repeat blood pressure after rest and seek specialist review for long-term management.',
      evaluatedAt: ago(2, 5),
    },
    syncStatus: 'Synchronized',
  }),
  consultation(5, 'SS-2026-00009', {
    createdAt: ago(1, 8), updatedAt: ago(1, 7),
    language: 'hi',
    transcript: 'रोगी को सांस लेने में कठिनाई है और भीगी खाँसी है।',
    symptoms: [symptom('Breathlessness', '1 day'), symptom('Cough', '2 days')],
    vitals: { temperature: '37.4', pulse: '102', systolic: '128', diastolic: '82', spo2: '91', respiratoryRate: '24' },
    assessment: {
      level: 'emergency',
      title: 'Emergency warning',
      reasons: ['SpO2 is below 92% with reported breathlessness.'],
      action: 'Escalate immediately through local emergency protocols and arrange urgent clinical review.',
      evaluatedAt: ago(1, 7),
    },
    syncStatus: 'Synchronized',
  }),
];

const referral = (n, patientRef, overrides = {}) => ({
  id: `r-${n}`,
  reference: `REF-2026-${String(n).padStart(4, '0')}`,
  patientRef,
  patientName: PATIENTS.find((p) => p.patientId === patientRef)?.name || '',
  age: PATIENTS.find((p) => p.patientId === patientRef)?.age || null,
  reason: overrides.reason,
  priority: overrides.priority || 'Priority',
  status: overrides.status || 'Submitted',
  createdAt: overrides.createdAt || ago(n, 2),
  submittedAt: overrides.submittedAt || ago(n, 1),
  assignedDoctor: overrides.assignedDoctor || 'Dr. Ananya Rao',
  doctorId: overrides.doctorId || 'u-doctor-1',
  centre: overrides.centre || 'Hosur Community Health Centre',
  consultationId: overrides.consultationId || null,
  symptoms: overrides.symptoms || [],
  vitals: overrides.vitals || {},
  warnings: overrides.warnings || [],
  medicalHistory: overrides.medicalHistory || '',
  review: overrides.review || null,
  syncStatus: overrides.syncStatus || 'Synchronized',
});

export const REFERRALS = [
  referral(1, 'SS-2026-00001', {
    reason: 'Emergency warning: low oxygen saturation and chest pain. Requires immediate specialist guidance.',
    priority: 'Urgent', status: 'Under Review', createdAt: ago(0, 5), submittedAt: ago(0, 4), consultationId: 'c-1',
    symptoms: [symptom('Chest pain', '2 hours'), symptom('Breathlessness', '2 hours')],
    vitals: { temperature: '38.1', pulse: '124', systolic: '92', diastolic: '60', spo2: '88', respiratoryRate: '28' },
    warnings: ['SpO2 is below 90%.', 'Systolic blood pressure is below 90 mmHg.', 'Chest pain with breathlessness reported.'],
    medicalHistory: 'Hypertension, reportedly irregular treatment. Penicillin allergy.',
  }),
  referral(2, 'SS-2026-00004', {
    reason: 'Elevated blood pressure with dizziness; request management advice.',
    priority: 'Priority', status: 'Acknowledged', createdAt: ago(2, 6), submittedAt: ago(2, 5), consultationId: 'c-4',
    symptoms: [symptom('Dizziness'), symptom('Fatigue')],
    vitals: { temperature: '37.0', pulse: '88', systolic: '146', diastolic: '92', spo2: '96', respiratoryRate: '18' },
    warnings: ['Elevated blood pressure reading in a patient with reported hypertension.'],
    medicalHistory: 'Type 2 diabetes and hypertension. Sulfonamide allergy.',
    centre: 'Denkanikottai Health Sub-centre',
  }),
  referral(3, 'SS-2026-00009', {
    reason: 'Low oxygen saturation with breathlessness in an elderly patient.',
    priority: 'Urgent', status: 'Submitted', createdAt: ago(1, 8), submittedAt: ago(1, 7), consultationId: 'c-5',
    assignedDoctor: 'Dr. Meera Iyer', doctorId: 'u-doctor-2',
    symptoms: [symptom('Breathlessness', '1 day'), symptom('Cough', '2 days')],
    vitals: { temperature: '37.4', pulse: '102', systolic: '128', diastolic: '82', spo2: '91', respiratoryRate: '24' },
    warnings: ['SpO2 is below 92% with reported breathlessness.'],
    medicalHistory: 'Chronic respiratory condition. Dust allergy.',
    centre: 'Denkanikottai Health Sub-centre',
  }),
];

export const REVIEWS = [
  {
    id: 'rev-seed-1',
    referralId: 'r-2',
    reviewer: 'Dr. Ananya Rao',
    clinicalComments: 'Blood pressure elevation noted. Previous records show similar readings. No acute distress described in the transcript.',
    nextSteps: 'Repeat BP after 15 minutes of rest, review treatment adherence, and share the readings with the district hub.',
    followUp: true,
    reviewStatus: 'Advice Recorded',
    submittedAt: ago(1, 1),
  },
];

export const SYNC_QUEUE = [
  { id: 'sq-1', recordType: 'Consultation', recordRef: 'c-2', label: 'Consultation · Kamala Devi', status: 'Pending Sync', attempts: 0, createdAt: ago(0, 2), lastAttempt: null },
  { id: 'sq-2', recordType: 'Consultation', recordRef: 'c-3', label: 'Consultation · Ravi Naik', status: 'Pending Sync', attempts: 1, createdAt: ago(1, 4), lastAttempt: ago(0, 6) },
  { id: 'sq-3', recordType: 'Patient', recordRef: 'p-10', label: 'Patient · Priya M.', status: 'Saved Locally', attempts: 0, createdAt: ago(0, 1), lastAttempt: null },
  { id: 'sq-4', recordType: 'Patient', recordRef: 'p-6', label: 'Patient · Meena Bai', status: 'Sync Failed', attempts: 3, createdAt: ago(4, 4), lastAttempt: ago(0, 8) },
  { id: 'sq-5', recordType: 'Referral', recordRef: 'r-3', label: 'Referral · Narayana Swamy', status: 'Pending Sync', attempts: 0, createdAt: ago(1, 7), lastAttempt: null },
];

export const AUDIT_LOG = [
  { id: 'a-1', at: ago(0, 4), actor: 'Lakshmi N.', role: 'worker', action: 'Consultation saved', detail: 'SS-2026-00001 · emergency rule triggered' },
  { id: 'a-2', at: ago(0, 4), actor: 'System', role: 'system', action: 'Safety rule evaluated', detail: 'DEMO-RULES-v0.3 · level: emergency' },
  { id: 'a-3', at: ago(0, 3), actor: 'Lakshmi N.', role: 'worker', action: 'Referral submitted', detail: 'REF-2026-0001 · Urgent' },
  { id: 'a-4', at: ago(0, 2), actor: 'System', role: 'system', action: 'Local record saved', detail: 'Patient SS-2026-00002 stored in IndexedDB' },
  { id: 'a-5', at: ago(1, 1), actor: 'Dr. Ananya Rao', role: 'doctor', action: 'Review submitted', detail: 'REF-2026-0002 · Advice Recorded' },
  { id: 'a-6', at: ahead(-6), actor: 'Rajesh Kumar', role: 'admin', action: 'Rule version published', detail: 'DEMO-RULES-v0.3 marked as unreviewed demonstration' },
];

export const CLINICAL_RULES = [
  {
    id: 'rule-v3',
    version: RULE_VERSION,
    status: 'Active (demonstration only)',
    publishedAt: ago(6),
    publishedBy: 'Rajesh Kumar',
    summary: 'SpO2 thresholds, blood pressure thresholds, respiratory rate and symptom combinations for demonstration warnings.',
    reviewStatus: 'Pending clinician review',
  },
  {
    id: 'rule-v2',
    version: 'DEMO-RULES-v0.2',
    status: 'Superseded',
    publishedAt: ago(28),
    publishedBy: 'Rajesh Kumar',
    summary: 'Earlier threshold set, retained for audit only.',
    reviewStatus: 'Pending clinician review',
  },
];

export const PERMISSIONS = [
  { module: 'Patient records', worker: ['View', 'Create', 'Edit'], doctor: ['View'], admin: ['View', 'Audit'] },
  { module: 'Consultations', worker: ['View', 'Create', 'Edit'], doctor: ['View'], admin: ['Audit'] },
  { module: 'Referrals', worker: ['View', 'Create', 'Submit'], doctor: ['View', 'Review'], admin: ['View', 'Audit'] },
  { module: 'Safety rules', worker: ['View'], doctor: ['View', 'Comment'], admin: ['Manage versions'] },
  { module: 'User management', worker: [], doctor: [], admin: ['View', 'Create', 'Edit'] },
  { module: 'Synchronization', worker: ['View', 'Run'], doctor: ['View'], admin: ['View', 'Monitor'] },
];

export const SEED_DB = {
  patients: PATIENTS,
  consultations: CONSULTATIONS,
  referrals: REFERRALS,
  reviews: REVIEWS,
  syncQueue: SYNC_QUEUE,
  auditLog: AUDIT_LOG,
};

export function nextPatientSequence(patients) {
  const max = patients.reduce((acc, p) => {
    const match = String(p.patientId || '').match(/(\d+)$/);
    return match ? Math.max(acc, Number(match[1])) : acc;
  }, 0);
  return max + 1;
}
