import { AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Form';

export default function SymptomReviewList({ symptoms = [], onChange, onAdd, t }) {
  const update = (id, patch) => onChange(symptoms.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  const remove = (id) => onChange(symptoms.filter((item) => item.id !== id));

  return (
    <div className="space-y-2.5">
      {symptoms.map((symptom) => (
        <div key={symptom.id} className={`rounded-xl border p-3 ${symptom.confirmed ? 'border-emerald-200 bg-emerald-50/40' : 'border-amber-200 bg-amber-50/40'}`}>
          <div className="flex flex-wrap items-start gap-2">
            <div className="min-w-[180px] flex-1">
              <Input
                value={symptom.label}
                onChange={(event) => update(symptom.id, { label: event.target.value })}
                placeholder="Symptom name"
                className="h-9 bg-white"
                aria-label="Symptom name"
              />
            </div>
            <div className="w-32">
              <Input
                value={symptom.duration || ''}
                onChange={(event) => update(symptom.id, { duration: event.target.value })}
                placeholder="e.g. 3 days"
                className="h-9 bg-white"
                aria-label="Duration"
              />
            </div>
            <button type="button" onClick={() => remove(symptom.id)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Remove symptom"><Trash2 size={16} /></button>
          </div>
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge tone={symptom.confidence === 'high' ? 'green' : 'amber'}>
                {symptom.confidence === 'high' ? 'Clear match' : 'Verify meaning'}
              </Badge>
              {symptom.confidence !== 'high' && <span className="hidden text-[11px] text-amber-700 sm:inline">{t?.('cons.uncertain') || 'Low confidence — verify with the patient.'}</span>}
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={Boolean(symptom.confirmed)}
                onChange={(event) => update(symptom.id, { confirmed: event.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-brand-600"
              />
              {t?.('confirm') || 'Confirm'}
            </label>
          </div>
          {!symptom.confirmed && <p className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-amber-800"><AlertTriangle size={13} /> Confirm this item before continuing.</p>}
        </div>
      ))}

      <Button variant="outline" size="sm" icon={Plus} onClick={onAdd}>Add symptom manually</Button>
      {symptoms.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">{t?.('cons.noSymptoms') || 'No symptoms extracted yet.'}</p>}
    </div>
  );
}
