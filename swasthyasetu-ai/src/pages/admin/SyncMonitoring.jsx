import { RefreshCw, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, SectionHeading } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/Badge';
import { InfoBanner } from '../../components/ui/Feedback';
import { useApp } from '../../context/AppContext';
import { useI18n } from '../../context/I18nContext';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useToast } from '../../context/ToastContext';
import { formatDateTime, relativeTime } from '../../utils/formatters';

export default function SyncMonitoring() {
  const { syncQueue, lastSync, runSync, syncing } = useApp();
  const online = useOnlineStatus();
  const { t } = useI18n();
  const { toast } = useToast();

  const failed = syncQueue.filter((item) => item.status === 'Sync Failed').length;
  const pending = syncQueue.filter((item) => item.status === 'Pending Sync').length;
  const synced = syncQueue.filter((item) => item.status === 'Synchronized').length;

  const handleSync = async (retryFailedOnly = false) => {
    const result = await runSync({ online, retryFailedOnly });
    toast(result.message, result.online ? 'success' : 'warning', 'Synchronization');
  };

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Administration" title={t('nav.syncMonitoring')} subtitle="Monitor local queue health across the demonstration fleet." />
      <InfoBanner tone="info" icon={ShieldCheck}>Only metadata is simulated. No patient information is cached in the public HTTP cache; records live in IndexedDB.</InfoBanner>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={RefreshCw} label="Pending records" value={pending} hint="Awaiting transport" tone="amber" />
        <StatCard icon={RefreshCw} label="Failed records" value={failed} hint="Retry available" tone="red" />
        <StatCard icon={ShieldCheck} label="Synchronized" value={synced} hint="Completed locally" tone="green" />
        <StatCard icon={RefreshCw} label="Last sync" value={lastSync ? relativeTime(lastSync) : 'Never'} hint={lastSync ? formatDateTime(lastSync) : 'No sync recorded'} tone="blue" />
      </div>

      <Card>
        <CardHeader title="Synchronization controls" action={<div className="flex flex-wrap gap-2"><Button size="sm" icon={RefreshCw} loading={syncing} onClick={() => handleSync(false)}>Synchronize Now</Button><Button size="sm" variant="outline" onClick={() => handleSync(true)} disabled={!failed}>Retry Failed Sync</Button></div>} />
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead><tr className="border-b border-slate-200 bg-slate-50/70">
              {['Record', 'Type', 'Status', 'Attempts', 'Last attempt', 'Error'].map((header) => <th key={header} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">{header}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {syncQueue.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-semibold text-slate-800">{item.label}</td>
                  <td className="px-4 py-3 text-slate-600">{item.recordType}</td>
                  <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                  <td className="px-4 py-3 text-slate-600">{item.attempts}</td>
                  <td className="px-4 py-3 text-slate-500">{item.lastAttempt ? formatDateTime(item.lastAttempt) : '—'}</td>
                  <td className="px-4 py-3 text-xs text-red-600">{item.error || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
