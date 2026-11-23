import { Field, Input } from '../ui/Form';

const FIELDS = [
  { key: 'temperature', label: 'assess.temperature', fallback: 'Temperature (°C)', placeholder: '36.8', type: 'number', step: '0.1' },
  { key: 'pulse', label: 'assess.pulse', fallback: 'Pulse (BPM)', placeholder: '72', type: 'number' },
  { key: 'systolic', label: 'assess.bp', fallback: 'Blood pressure (mmHg)', placeholder: '120', type: 'number', suffix: 'Systolic' },
  { key: 'diastolic', label: 'assess.bp', fallback: 'Blood pressure (mmHg)', placeholder: '80', type: 'number', suffix: 'Diastolic' },
  { key: 'spo2', label: 'assess.spo2', fallback: 'SpO2 (%)', placeholder: '98', type: 'number' },
  { key: 'respiratoryRate', label: 'assess.rr', fallback: 'Respiratory rate (/min)', placeholder: '16', type: 'number' },
];

export default function VitalSignsForm({ values, onChange, errors = {}, t }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {FIELDS.map((field) => (
        <Field
          key={field.key}
          label={`${t?.(field.label) || field.fallback}${field.suffix ? ` · ${field.suffix}` : ''}`}
          htmlFor={`vital-${field.key}`}
          error={errors[field.key] || (field.key === 'bloodPressure' ? errors.bloodPressure : null)}
        >
          <Input
            id={`vital-${field.key}`}
            type={field.type}
            step={field.step}
            min="0"
            inputMode="decimal"
            placeholder={field.placeholder}
            value={values[field.key] ?? ''}
            onChange={(event) => onChange(field.key, event.target.value)}
          />
        </Field>
      ))}
    </div>
  );
}
