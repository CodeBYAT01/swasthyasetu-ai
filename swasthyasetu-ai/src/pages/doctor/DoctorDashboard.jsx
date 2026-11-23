import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ClipboardCheck, Inbox, Siren } from 'lucide-react';
import { Card, CardHeader, SectionHeading } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/Feedback';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { formatDateTime, relativeTime } from '../../utils/formatters';

export default function DoctorDashboard() {
  const { referrals, reviews } = useApp();
  const { user } = useAuth();
  const { t } = useI18n();

  const newReferrals = referrals.filter((item) => ['Created', 'Submitted', 'Acknowledged'].includes(item.status));
  const urgent = referrals.filter((item) => item.priority === 'Urgent' && !['Advice Recorded', 'Closed'].includes(item.status));
  const underReview = referrals.filter((item) => item.status === 'Under Review');
  const completed = reviews.length;

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Specialist workspace"
        title={`${t('dash.welcome')}, ${user?.name || 'Doctor'}`}
        subtitle="Review incoming referrals and record advisory feedback for frontline teams."
        action={<div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-right"><p className="text-[11px] font-semibold uppercase text-slate-500">{user?.speciality || 'Specialist'}</p><p className="text-xs font-bold text-slate-800">{user?.centre}</p></div>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Inbox} label={t('doc.newReferrals')} value={newReferrals.length} hint="Awaiting first review" tone="blue" />
        <StatCard icon={Siren} label={t('doc.urgent')} value={urgent.length} hint="Simulated urgency flag" tone="red" />
        <StatCard icon={ClipboardCheck} label={t('doc.underReview')} value={underReview.length} hint="Open for specialist input" tone="amber" />
        <StatCard icon={CheckCircle2} label={t('doc.completed')} value={completed} hint="Advice recorded" tone="green" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <Card padded={false}>
          <div className="p-5 pb-2"><CardHeader title="Incoming referrals" subtitle="Cases submitted by frontline health workers" action={<Link to="/app/review" className="text-xs font-semibold text-brand-700 hover:underline">View all →</Link>} /></div>
          <div className="divide-y divide-slate-100">
            {referrals.slice(0, 6).map((item) => (
              <Link key={item.id} to={`/app/review/${item.id}`} className="flex flex-wrap items-center gap-3 px-5 py-3.5 hover:bg-slate-50">
                <Avatar name={item.patientName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{item.patientName} <span className="font-normal text-slate-500">· {item.age} yrs · {item.patientRef}</span></p>
                  <p className="line-clamp-1 text-xs text-slate-500">{item.symptoms?.map((s) => s.label).join(', ') || 'No symptoms'} · {item.reason}</p>
                </div>
                <StatusBadge status={item.priority} />
                <span className="text-xs text-slate-400">{relativeTime(item.submittedAt || item.createdAt)}</span>
                <ArrowRight size={15} className="text-slate-300" />
              </Link>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="border-red-200">
            <CardHeader title="Urgent attention" subtitle="Safety warnings from simulated rules" />
            {urgent.length ? urgent.slice(0, 3).map((item) => (
              <Link key={item.id} to={`/app/review/${item.id}`} className="mb-2 block rounded-xl border border-red-200 bg-red-50 p-3 hover:bg-red-100/70">
                <p className="text-sm font-bold text-red-800">{item.patientName} · {item.patientRef}</p>
                <p className="mt-1 text-xs text-red-700">{item.warnings?.[0] || item.reason}</p>
              </Link>
            )) : <EmptyState title="No urgent cases" />}
          </Card>
          <Card>
            <CardHeader title="Recent reviews" />
            {reviews.slice(0, 4).map((review) => (
              <div key={review.id} className="mb-2 rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold text-slate-800">{review.reviewer}</p><StatusBadge status={review.reviewStatus} /></div>
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">{review.clinicalComments}</p>
                <p className="mt-1 text-[11px] text-slate-400">{formatDateTime(review.submittedAt)}</p>
              </div>
            ))}
            {!reviews.length && <EmptyState title="No reviews submitted yet" />}
          </Card>
        </div>
      </div>
    </div>
  );
}
