import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity, AlertOctagon, ArrowRight, CalendarDays, CheckCircle2, Clock3, Mic,
  RefreshCw, Send, UserPlus, Users, WifiOff,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardHeader, SectionHeading } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/Feedback';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useToast } from '../../context/ToastContext';
import { formatDate, relativeTime } from '../../utils/formatters';

export default function WorkerDashboard() {
  const { patients, consultations, referrals, syncQueue, runSync, syncing, lastSync } = useApp();
  const { user } = useAuth();
  const { t } = useI18n();
  const online = useOnlineStatus();
  const { toast } = useToast();
  const navigate = useNavigate();

  const today = new Date().toDateString();
  const todayConsultations = consultations.filter((item) => new Date(item.createdAt).toDateString() === today);
  const pendingReferrals = referrals.filter((item) => !['Closed', 'Advice Recorded'].includes(item.status));
  const pendingSync = syncQueue.filter((item) => item.status !== 'Synchronized');
  const emergencies = consultations.filter((item) => item.assessment?.level === 'emergency');
  const recent = useMemo(() => [...consultations].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5), [consultations]);

  const chartData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      return { day: date.toLocaleDateString('en-IN', { weekday: 'short' }), count: 0 };
    });
    consultations.forEach((item) => {
      const key = new Date(item.createdAt).toLocaleDateString('en-IN', { weekday: 'short' });
      const entry = days.find((day) => day.day === key);
      if (entry) entry.count += 1;
    });
    return days;
  }, [consultations]);

  const handleSync = async () => {
    const result = await runSync({ online });
    toast(result.message, result.online ? 'success' : 'warning', 'Synchronization');
  };

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Frontline workspace"
        title={`${t('dash.welcome')}, ${user?.name?.split(' ')[0] || 'Health Worker'}`}
        subtitle={t('dash.welcomeSub')}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
              <CalendarDays size={15} className="text-brand-600" />
              {formatDate(new Date(), { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <span className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${online ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
              <span className={`h-2 w-2 rounded-full ${online ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {online ? t('online') : t('offline')}
            </span>
            <Avatar name={user?.name} />
          </div>
        }
      />

      <Card className="flex flex-wrap items-center justify-between gap-4 border-brand-200 bg-gradient-to-r from-brand-50 via-white to-white p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-soft"><Mic size={24} /></div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-700">Primary action</p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">Ready to see a patient?</h2>
            <p className="mt-1 max-w-xl text-sm text-slate-600">{t('dash.startSub')} {t('dash.centre')}: <span className="font-semibold text-slate-800">{user?.centre}</span></p>
          </div>
        </div>
        <Button
          size="xl"
          onClick={() => navigate('/app/patients/new?flow=consultation')}
          className="w-full px-8 tracking-wide shadow-soft sm:w-auto"
          icon={Mic}
        >
          {t('dash.start')}
        </Button>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label={t('dash.registered')} value={patients.length} hint="Stored locally on this device" tone="teal" onClick={() => navigate('/app/patients')} />
        <StatCard icon={Activity} label={t('dash.consultations')} value={todayConsultations.length} hint="Captured today" tone="blue" onClick={() => navigate('/app/patients')} />
        <StatCard icon={Send} label={t('dash.pendingReferrals')} value={pendingReferrals.length} hint="Awaiting acknowledgement or review" tone="amber" onClick={() => navigate('/app/referrals')} />
        <StatCard icon={RefreshCw} label={t('dash.pendingSync')} value={pendingSync.length} hint={lastSync ? `Last sync ${relativeTime(lastSync)}` : 'Never synchronized'} tone="red" onClick={() => navigate('/app/sync')} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2" padded={false}>
          <div className="p-5 pb-2"><CardHeader title={t('dash.recent')} subtitle="Most recent locally saved consultations" action={<Link to="/app/patients" className="text-xs font-semibold text-brand-700 hover:underline">View all →</Link>} /></div>
          {recent.length ? (
            <div className="divide-y divide-slate-100">
              {recent.map((item) => (
                <Link key={item.id} to={`/app/patients/${encodeURIComponent(item.patientRef)}`} className="flex flex-wrap items-center gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50">
                  <Avatar name={item.patientName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{item.patientName}</p>
                    <p className="text-xs text-slate-500">{item.patientRef} · {item.symptoms?.slice(0, 3).map((s) => s.label).join(', ') || 'No confirmed symptoms'}</p>
                  </div>
                  <StatusBadge status={item.assessment?.level === 'emergency' ? 'Emergency' : item.assessment?.level === 'assessment' ? 'Under Review' : 'Created'} />
                  <span className="text-xs text-slate-400">{relativeTime(item.createdAt)}</span>
                  <ArrowRight size={15} className="text-slate-300" />
                </Link>
              ))}
            </div>
          ) : <div className="p-5"><EmptyState title="No consultations yet" description="Start a consultation to see it here." /></div>}
        </Card>

        <div className="space-y-6">
          <Card className="border-red-200">
            <CardHeader title={t('dash.emergency')} subtitle="From simulated safety-rule evaluation" action={<AlertOctagon size={18} className="text-red-600" />} />
            {emergencies.length ? (
              <div className="space-y-2">
                {emergencies.slice(0, 3).map((item) => (
                  <Link key={item.id} to={`/app/patients/${encodeURIComponent(item.patientRef)}`} className="block rounded-xl border border-red-200 bg-red-50 p-3 hover:bg-red-100/70">
                    <p className="text-sm font-bold text-red-800">{item.patientName} · {item.patientRef}</p>
                    <p className="mt-1 text-xs text-red-700">{item.assessment?.reasons?.[0]}</p>
                  </Link>
                ))}
              </div>
            ) : <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">{t('dash.noEmergency')}</p>}
          </Card>

          <Card>
            <CardHeader title={t('dash.offline')} subtitle="Records are safe on this device" action={<WifiOff size={18} className={online ? 'text-slate-300' : 'text-amber-600'} />} />
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between"><span className="text-slate-600">Pending records</span><span className="font-bold text-slate-900">{pendingSync.length}</span></div>
              <div className="flex items-center justify-between"><span className="text-slate-600">Last sync</span><span className="font-semibold text-slate-800">{lastSync ? relativeTime(lastSync) : 'Not yet'}</span></div>
              <div className="flex items-center justify-between"><span className="text-slate-600">Network</span><span className={online ? 'font-semibold text-emerald-700' : 'font-semibold text-amber-700'}>{online ? t('online') : t('offline')}</span></div>
              <Button variant="outline" fullWidth icon={RefreshCw} onClick={handleSync} loading={syncing}>{t('sync.now')}</Button>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Consultation activity" subtitle="Simulated records · last 7 days" action={<Clock3 size={16} className="text-slate-400" />} />
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 8, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#F0FDFA' }} contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} />
                <Bar dataKey="count" name="Consultations" fill="#0F766E" radius={[6, 6, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title={t('dash.pendingReferrals')} subtitle="Digital escalation does not replace emergency protocols" action={<Link to="/app/referrals" className="text-xs font-semibold text-brand-700 hover:underline">View all →</Link>} />
          <div className="space-y-2">
            {pendingReferrals.slice(0, 3).map((item) => (
              <Link key={item.id} to={`/app/referrals/${item.id}`} className="block rounded-xl border border-slate-200 p-3 hover:border-brand-300 hover:bg-brand-50/40">
                <div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold text-slate-800">{item.patientName}</p><StatusBadge status={item.priority} /></div>
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.reason}</p>
                <p className="mt-1.5 text-[11px] text-slate-400">{item.reference} · {relativeTime(item.createdAt)}</p>
              </Link>
            ))}
            {!pendingReferrals.length && <EmptyState icon={CheckCircle2} title="No pending referrals" />}
          </div>
        </Card>
      </div>
    </div>
  );
}
