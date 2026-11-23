let counter = 0;

export function uid(prefix = 'id') {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function patientId(sequence) {
  return `SS-${new Date().getFullYear()}-${String(sequence).padStart(5, '0')}`;
}

export function nowIso() {
  return new Date().toISOString();
}
