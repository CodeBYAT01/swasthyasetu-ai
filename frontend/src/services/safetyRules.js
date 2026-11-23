import { SAFETY_LEVELS, RULE_VERSION } from '../utils/constants';

/*
 * SIMULATED CLINICAL DECISION SUPPORT — NOT MEDICAL ADVICE.
 * Fixed demonstration rules only. A qualified clinical team must review and
 * approve any rule set before real-world use. Absence of a warning is never
 * represented as a patient being healthy.
 */
const num = (value) => (value === '' || value == null || Number.isNaN(Number(value)) ? null : Number(value));

export function evaluateSafety({ symptoms = [], vitals = {}, transcript = '' } = {}) {
  const temperature = num(vitals.temperature);
  const pulse = num(vitals.pulse);
  const systolic = num(vitals.systolic);
  const diastolic = num(vitals.diastolic);
  const spo2 = num(vitals.spo2);
  const rr = num(vitals.respiratoryRate);
  const labels = symptoms.filter((s) => s.confirmed !== false).map((s) => String(s.label || '').toLowerCase());
  const has = (term) => labels.some((label) => label.includes(term));
  const text = String(transcript || '').toLowerCase();

  const emergency = [];
  const assessment = [];
  const missing = [];

  if (spo2 != null && spo2 < 90) emergency.push(`SpO2 is ${spo2}% (below 90%).`);
  else if (spo2 != null && spo2 < 94) assessment.push(`SpO2 is ${spo2}%. Repeat measurement and assess breathing.`);

  if (systolic != null && systolic < 90) emergency.push(`Systolic blood pressure is ${systolic} mmHg (below 90).`);
  if (diastolic != null && diastolic < 60 && systolic != null && systolic < 100) {
    assessment.push('Low diastolic pressure recorded with low systolic pressure.');
  }
  if (systolic != null && systolic >= 160) assessment.push(`Elevated systolic pressure (${systolic} mmHg).`);

  if (rr != null && rr > 30) emergency.push(`Respiratory rate is ${rr}/min (above 30).`);
  else if (rr != null && rr > 24) assessment.push(`Respiratory rate is ${rr}/min. Observe breathing closely.`);

  if (has('chest pain') && has('breathless')) emergency.push('Chest pain with breathlessness reported.');
  if (has('chest pain') && (text.includes('chest pain') || text.includes('ಎದೆ ನೋವು') || text.includes('छाती'))) {
    if (!emergency.some((r) => r.includes('Chest pain'))) emergency.push('Chest pain reported in the consultation transcript.');
  }
  if (has('confusion') || text.includes('altered mental') || text.includes('ಗೊಂದಲ') || text.includes('भ्रम')) {
    emergency.push('Altered mental state reported.');
  }
  if (temperature != null && temperature >= 40) emergency.push(`Very high temperature (${temperature} °C).`);

  if (temperature != null && temperature >= 38.5 && temperature < 40) assessment.push(`Temperature is ${temperature} °C.`);
  if (pulse != null && pulse > 120) assessment.push(`Pulse is ${pulse} BPM (above 120).`);
  if (has('fever') && symptoms.some((s) => String(s.duration || '').includes('3'))) {
    assessment.push('Fever reported for 3 days.');
  }
  if (has('breathless') && spo2 == null) assessment.push('Breathlessness reported without an SpO2 reading.');

  const noSymptomConfirmation = symptoms.length === 0;
  const vitalKeys = ['temperature', 'pulse', 'systolic', 'diastolic', 'spo2', 'respiratoryRate'];
  const missingVitals = vitalKeys.filter((key) => num(vitals[key]) == null);
  if (missingVitals.length) missing.push(`${missingVitals.length} vital sign${missingVitals.length === 1 ? '' : 's'} not recorded.`);
  if (noSymptomConfirmation) missing.push('No symptoms have been confirmed in the consultation.');

  const base = {
    evaluatedAt: new Date().toISOString(),
    ruleVersion: RULE_VERSION,
    simulated: true,
    reasons: [],
  };

  if (emergency.length) {
    return {
      ...base,
      level: SAFETY_LEVELS.EMERGENCY,
      title: 'Emergency warning',
      reasons: emergency,
      action: 'Escalate immediately using local emergency protocols. Arrange urgent transport and inform the remote specialist. Do not wait for digital referral acknowledgement.',
    };
  }
  if (missing.length) {
    return {
      ...base,
      level: SAFETY_LEVELS.INCOMPLETE,
      title: 'Assessment incomplete',
      reasons: [...missing, ...assessment],
      action: 'Complete the missing symptom confirmation and vital signs, then re-evaluate before deciding on referral.',
    };
  }
  if (assessment.length) {
    return {
      ...base,
      level: SAFETY_LEVELS.ASSESSMENT,
      title: 'Further clinical assessment required',
      reasons: assessment,
      action: 'Complete the clinical examination and arrange a remote specialist review. Re-check observations if symptoms change.',
    };
  }
  return {
    ...base,
    level: SAFETY_LEVELS.NONE,
    title: 'No predefined warning triggered',
    reasons: ['No values matched the demonstration warning rules.'],
    action: 'Continue standard clinical assessment per local protocol. This result does not mean the patient is healthy.',
  };
}
