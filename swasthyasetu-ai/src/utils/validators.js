export function validatePatient(values) {
  const errors = {};
  const name = (values.name || '').trim();
  if (!name) errors.name = 'Patient name is required.';
  else if (name.length < 2) errors.name = 'Enter at least 2 characters.';

  if (!values.age && !values.dob) errors.age = 'Enter age or date of birth.';
  else if (values.age && (Number(values.age) < 0 || Number(values.age) > 120 || Number.isNaN(Number(values.age)))) {
    errors.age = 'Age must be between 0 and 120.';
  }

  if (!values.sex) errors.sex = 'Select sex (clinically relevant).';
  if (!(values.village || '').trim()) errors.village = 'Village is required.';
  if (values.phone && !/^[0-9+\-\s]{7,15}$/.test(values.phone)) errors.phone = 'Enter a valid phone number (7–15 digits).';
  if (!values.consent) errors.consent = 'Consent must be recorded before saving.';
  return errors;
}

export function validateVitals(values) {
  const errors = {};
  const check = (key, label, min, max) => {
    if (values[key] === '' || values[key] == null) return;
    const n = Number(values[key]);
    if (Number.isNaN(n) || n < min || n > max) errors[key] = `${label} must be between ${min} and ${max}.`;
  };
  check('temperature', 'Temperature', 30, 45);
  check('pulse', 'Pulse', 20, 250);
  check('spo2', 'SpO2', 50, 100);
  check('respiratoryRate', 'Respiratory rate', 5, 80);
  if (values.systolic && values.diastolic && Number(values.systolic) <= Number(values.diastolic)) {
    errors.bloodPressure = 'Systolic pressure must be higher than diastolic.';
  }
  return errors;
}

export function validateReview(values) {
  const errors = {};
  if (!(values.clinicalComments || '').trim()) errors.clinicalComments = 'Clinical comments are required.';
  if (!(values.nextSteps || '').trim()) errors.nextSteps = 'Recommended next steps are required.';
  if (!values.reviewStatus) errors.reviewStatus = 'Select a review status.';
  return errors;
}
