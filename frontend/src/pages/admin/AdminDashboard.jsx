import { Link } from 'react-router-dom';
import {
  Activity, Building2, CircleCheck, ClipboardList, RefreshCw, ScrollText, ShieldCheck, UserCog, Users,
} from 'lucide-react';
import { Card, CardHeader, SectionHeading } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/Badge';
import { useApp } from '../../context/AppContext';
import { useI18n } from '../../context/I18nContext';
import { HEALTH_CENTRES, USERS } from '../../database/seed';
import { formatDateTime, relativeTime } from '../../utils/formatters';

export default function AdminDashboard() {
  const { syncQueue, auditLog, patients, referrals, lastSync } = useApp();
  const { t } = useI18n();
  const workers = USERS.filter((user) => user.role === 'worker').length;
  const doctors = USERS.filter((user) => user.role === 'doctor').length;
  const pending = syncQueue.filter((item) => item.status !== 'Synchronized').length;

  const quickLinks = [
    [UserCog, 'User management', '/app/admin/users'],
    [Building2, 'Health centres', '/app/admin/centres'],
    [ClipboardList, 'Clinical rules', '/app/admin/rules'],
    [ScrollText, 'Audit log', '/app/admin/audit'],
  ];

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Administration" title="Platform overview" subtitle="Users, centres, rules and synchronization at a glance." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Frontline workers" value={workers} hint="Across 4 health centres" tone="teal" />
        <StatCard icon={ShieldCheck} label="Doctors" value={doctors} hint="Telemedicine hub" tone="blue" />
        <StatCard icon={Activity} label="Local patient records" value={patients.length} hint="Demonstration data" tone="green" />
        <StatCard icon={RefreshCw} label="Pending sync" value={pending} hint={lastSync ? `Last sync ${relativeTime(lastSync)}` : 'Never synchronized'} tone="amber" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader title="Administrative shortcuts" subtitle="All sections use realistic fictional data" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {quickLinks.map(([Icon, label, path]) => (
              <Link key={path} to={path} className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition-colors hover:border-brand-300 hover:bg-brand-50/40">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><Icon size={19} /></span>
                <span className="flex-1 text-sm font-semibold text-slate-800">{label}</span>
                <span className="text-brand-600">→</span>
              </Link>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Recent activity" subtitle="Audit trail" action={<CircleCheck size={18} className="text-emerald-600" />} />
          <div className="space-y-3">
            {auditLog.slice(0, 6).map((item) => (
              <div key={item.id} className="border-l-2 border-brand-200 pl-3">
                <p className="text-xs font-semibold text-slate-800">{item.action}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">{item.actor} · {relativeTime(item.at)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Health centres" subtitle="Active demonstration sites" />
          <div className="space-y-2">
            {HEALTH_CENTRES.map((centre) => (
              <div key={centre.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
                <div><p className="text-sm font-semibold text-slate-800">{centre.name}</p><p className="text-[11px] text-slate-500">{centre.district}, {centre.state} · {centre.workers} workers</p></div>
                <StatusBadge status={centre.status} />
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Referral load" subtitle="Current demonstration referrals" action={<Link to="/app/admin/sync" className="text-xs font-bold text-brand-700">Monitor sync →</Link>} />
          <div className="space-y-2">
            {referralsPreview(referrals).map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
                <div><p className="text-sm font-semibold text-slate-800">{item.patientName}</p><p className="text-[11px] text-slate-500">{item.reference} · {formatDateTime(item.createdAt)}</p></div>
                <div className="flex gap-1.5"><StatusBadge status={item.priority} /><StatusBadge status={item.status} /></div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function referralsPreview(referrals) {
  return [...referrals].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4);
}
