import { useState } from 'react';
import {
  Cloud, CloudOff, Database, Globe2, HardDriveDownload, Languages, LockKeyhole, ShieldCheck,
} from 'lucide-react';
import { Card, CardHeader, SectionHeading } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { InfoBanner } from '../components/ui/Feedback';
import { ConfirmDialog } from '../components/ui/Modal';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useToast } from '../context/ToastContext';
import { formatDateTime, relativeTime } from '../utils/formatters';

export default function SettingsPage() {
  const { language, languages, setLanguage } = useI18n();
  const { user } = useAuth();
  const online = useOnlineStatus();
  const { lastSync, patients, consultations, syncQueue, resetDemo } = useApp();
  const { toast } = useToast();
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    setResetting(true);
    try {
      await resetDemo();
      setResetOpen(false);
      toast('Demo data restored.', 'success');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Preferences" title={user?.role === 'doctor' ? 'Doctor profile & settings' : 'Settings'} subtitle="Language, privacy and local data controls." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Account" subtitle="Signed-in demonstration profile" action={<Badge tone="teal">{user?.role}</Badge>} />
          <div className="space-y-3 text-sm">
            {[
              ['Name', user?.name], ['Role', user?.title], ['Email', user?.email], ['Centre', user?.centre],
            ].map(([label, value]) => <div key={label} className="flex justify-between gap-4 border-b border-slate-100 pb-2"><span className="text-slate-500">{label}</span><span className="text-right font-semibold text-slate-800">{value}</span></div>)}
          </div>
        </Card>

        <Card>
          <CardHeader title="Language" subtitle="Interface labels and instructions" action={<Languages size={18} className="text-brand-600" />} />
          <div className="grid grid-cols-3 gap-2">
            {languages.map((item) => (
              <button key={item.code} type="button" onClick={() => setLanguage(item.code)} className={`rounded-xl border px-2 py-3 text-center text-sm font-bold ${language === item.code ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:border-brand-300'}`}>
                <span className="block">{item.native}</span><span className="mt-0.5 block text-[10px] font-medium opacity-70">{item.label}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500"><Globe2 size={14} /> Navigation, buttons and patient instructions translate immediately.</p>
        </Card>

        <Card>
          <CardHeader title="Local data" subtitle="Stored in private IndexedDB on this device" action={<Database size={18} className="text-brand-600" />} />
          <div className="grid grid-cols-3 gap-3 text-center">
            {[['Patients', patients.length], ['Consultations', consultations.length], ['Queue items', syncQueue.length]].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-slate-50 p-3"><p className="text-xl font-bold text-slate-900">{value}</p><p className="text-[11px] text-slate-500">{label}</p></div>
            ))}
          </div>
          <Button variant="outline" className="mt-4" icon={HardDriveDownload} onClick={() => setResetOpen(true)}>Reset demonstration data</Button>
        </Card>

        <Card>
          <CardHeader title="Connectivity" subtitle="Offline-first application shell" action={online ? <Cloud size={18} className="text-emerald-600" /> : <CloudOff size={18} className="text-amber-600" />} />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Network</span><span className="font-semibold text-slate-800">{online ? 'Online' : 'Offline'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Last sync</span><span className="font-semibold text-slate-800">{lastSync ? relativeTime(lastSync) : 'Never'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Last sync time</span><span className="font-semibold text-slate-800">{lastSync ? formatDateTime(lastSync) : '—'}</span></div>
          </div>
        </Card>
      </div>

      <InfoBanner tone="info" icon={ShieldCheck} title="Safety and privacy">
        This build is a clinical decision-support demonstration. It does not diagnose, prescribe or transmit real patient information. Do not enter identifiable patient data.
      </InfoBanner>
      <p className="flex items-center gap-1.5 text-xs text-slate-500"><LockKeyhole size={14} /> Records remain on this device until synchronized through the configured service.</p>

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={handleReset}
        title="Reset demonstration data?"
        message="Locally created records will be replaced with the original fictional dataset."
        confirmLabel="Reset data"
        tone="danger"
        loading={resetting}
      />
    </div>
  );
}
