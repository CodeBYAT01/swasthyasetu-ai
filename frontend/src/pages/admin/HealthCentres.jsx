import { useState } from 'react';
import { Building2, MapPin, Plus, Users } from 'lucide-react';
import { Card, CardHeader, SectionHeading } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Field, Input } from '../../components/ui/Form';
import { StatusBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useToast } from '../../context/ToastContext';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { HEALTH_CENTRES } from '../../database/seed';

const EMPTY = { name: '', district: '', state: '' };

export default function HealthCentres() {
  const [centres, setCentres] = useLocalStorage('swasthyasetu.admin.centres', HEALTH_CENTRES);
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(EMPTY);
  const [error, setError] = useState('');
  const { toast } = useToast();
  const { appendAudit } = useApp();
  const { user } = useAuth();
  const { t } = useI18n();

  const addCentre = async () => {
    if (!values.name.trim() || !values.district.trim()) { setError('Name and district are required.'); return; }
    const record = { ...values, id: `hc-${Date.now()}`, name: values.name.trim(), district: values.district.trim(), state: values.state.trim() || 'Tamil Nadu', workers: 0, status: 'Active' };
    setCentres((prev) => [record, ...prev]);
    await appendAudit('Health centre added', record.name, user?.name, 'admin');
    setOpen(false); setValues(EMPTY); setError('');
    toast(`${record.name} added.`, 'success');
  };

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Administration" title={t('nav.healthCentres')} subtitle="Manage the fictional facilities using the platform." action={<Button icon={Plus} onClick={() => setOpen(true)}>Add centre</Button>} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {centres.map((centre) => (
          <Card key={centre.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><Building2 size={21} /></div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{centre.name}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><MapPin size={13} /> {centre.district}, {centre.state}</p>
                </div>
              </div>
              <StatusBadge status={centre.status} />
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-500"><Users size={14} /> {centre.workers} assigned workers</span>
              <button type="button" onClick={async () => {
                setCentres((prev) => prev.map((item) => item.id === centre.id ? { ...item, status: item.status === 'Active' ? 'Inactive' : 'Active' } : item));
                await appendAudit('Health centre status changed', centre.name, user?.name, 'admin');
                toast(`${centre.name} status updated.`, 'info');
              }} className="font-bold text-brand-700 hover:underline">{centre.status === 'Active' ? 'Deactivate' : 'Activate'}</button>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add health centre" subtitle="Fictional facility record for the demonstration." footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={addCentre}>Add centre</Button></>}>
        <div className="space-y-4">
          <Field label="Centre name" htmlFor="centre-name" required><Input id="centre-name" value={values.name} onChange={(event) => setValues((prev) => ({ ...prev, name: event.target.value }))} /></Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="District" htmlFor="centre-district" required><Input id="centre-district" value={values.district} onChange={(event) => setValues((prev) => ({ ...prev, district: event.target.value }))} /></Field>
            <Field label="State" htmlFor="centre-state"><Input id="centre-state" value={values.state} onChange={(event) => setValues((prev) => ({ ...prev, state: event.target.value }))} /></Field>
          </div>
          {error && <p className="text-xs font-medium text-red-600">{error}</p>}
        </div>
      </Modal>
    </div>
  );
}
