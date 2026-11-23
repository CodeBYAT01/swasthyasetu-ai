import { useState } from 'react';
import {
  CheckCircle2, Cloud, CloudOff, Database, HardDriveDownload, RefreshCw, RotateCcw, ShieldCheck, TriangleAlert,
} from 'lucide-react';
import { Card, CardHeader, SectionHeading } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/Badge';
import { EmptyState, InfoBanner } from '../../components/ui/Feedback';
import { ConfirmDialog } from '../../components/ui/Modal';
import { useApp } from '../../context/AppContext';
import { useI18n } from '../../context/I18nContext';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useToast } from '../../context/ToastContext';
import { formatDateTime, relativeTime } from '../../utils/formatters';

export default function SyncCenterPage() {
  const { syncQueue, lastSync, syncing, runSync, resetDemo, patients, consultations, referrals } = useApp();
  const online = useOnlineStatus();
  const { t } = useI18n();
  const { toast } = useToast();
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const pending = syncQueue.filter((item) => item.status !== 'Synchronized');
  const failed = syncQueue.filter((item) => item.status === 'Sync Failed');
  const localRecords = patients.length + consultations.length + referrals.length;

  const handleSync = async (retryFailedOnly = false) => {
    const result = await runSync({ online, retryFailedOnly });
    toast(result.message, result.online ? 'success' : 'warning', 'Synchronization');
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      await resetDemo();
      setResetOpen(false);
      toast('Demonstration data restored to its original state.', 'success');
    } catch (error) {
      toast(error.message || 'Could not reset data.', 'error');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Offline first" title={t('sync.title')} subtitle="The application stays usable with no internet connection." />

      <InfoBanner tone="info" icon={ShieldCheck}>
        {t('sync.privacy')} The service worker caches only the static application shell — never patient records.
      </InfoBanner>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-xs font-semibold text-slate-500">{t('sync.network')}</p>
          <div className={`mt-3 flex items-center gap-2 text-lg font-bold ${online ? 'text-emerald-700' : 'text-amber-700'}`}>
            {online ? <Cloud size={22} /> : <CloudOff size={22} />}{online ? t('online') : t('offline')}
          </div>
          <p className="mt-2 text-xs text-slate-500">Detected from the browser connection state.</p>
        </Card>
        <StatCard icon={CheckCircle2} label={t('sync.last')} value={lastSync ? relativeTime(lastSync) : 'Never'} hint={lastSync ? formatDateTime(lastSync) : 'No successful sync yet'} tone="teal" />
        <StatCard icon={Database} label={t('sync.local')} value={localRecords} hint="Patients, consultations and referrals" tone="blue" />
        <StatCard icon={TriangleAlert} label={t('sync.failed')} value={failed.length} hint="Retry available below" tone="red" />
      </div>

      <Card>
        <CardHeader title="Synchronization controls" subtitle="Mock transport — replace with authenticated FastAPI endpoints later" />
        <div className="flex flex-wrap gap-3">
          <Button icon={RefreshCw} loading={syncing} onClick={() => handleSync(false)}>{t('sync.now')}</Button>
          <Button variant="outline" icon={RotateCcw} loading={syncing} onClick={() => handleSync(true)} disabled={!failed.length}>{t('sync.retry')}</Button>
          <Button variant="ghost" icon={HardDriveDownload} onClick={() => setResetOpen(true)}>Reset demo data</Button>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            ['Saved Locally', syncQueue.filter((i) => i.status === 'Saved Locally').length],
            ['Pending Sync', syncQueue.filter((i) => i.status === 'Pending Sync').length],
            ['Synchronized', syncQueue.filter((i) => i.status === 'Synchronized').length],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
              <span className="text-xs font-semibold text-slate-600">{label}</span><span className="text-lg font-bold text-slate-900">{value}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card padded={false}>
        <div className="p-5 pb-2"><CardHeader title={t('sync.queue')} subtitle={`${pending.length} record${pending.length === 1 ? '' : 's'} waiting`} /></div>
        {syncQueue.length ? (
          <div className="divide-y divide-slate-100">
            {syncQueue.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><Database size={16} /></div>
                <div className="min-w-[180px] flex-1">
                  <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                  <p className="text-[11px] text-slate-500">{item.recordType} · queued {formatDateTime(item.createdAt)} · attempts: {item.attempts}</p>
                  {item.error && <p className="mt-0.5 text-[11px] font-medium text-red-600">{item.error}</p>}
                </div>
                <StatusBadge status={item.status} />
                <span className="w-28 text-right text-[11px] text-slate-400">{item.lastAttempt ? relativeTime(item.lastAttempt) : 'Not attempted'}</span>
              </div>
            ))}
          </div>
        ) : <div className="p-5"><EmptyState icon={CheckCircle2} title="Sync queue is empty" /></div>}
      </Card>

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={handleReset}
        title="Reset demonstration data?"
        message="All locally saved records created during this demo will be replaced with the original fictional dataset. This cannot be undone."
        confirmLabel="Reset data"
        tone="danger"
        loading={resetting}
      />
    </div>
  );
}
