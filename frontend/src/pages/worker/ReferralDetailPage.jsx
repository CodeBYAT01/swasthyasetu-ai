import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Activity, AlertOctagon, ArrowLeft, Building2, CalendarDays, HeartPulse, Send, ShieldAlert, UserRound,
} from 'lucide-react';
import { Card, CardHeader, SectionHeading } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { InfoBanner } from '../../components/ui/Feedback';
import { ConfirmDialog } from '../../components/ui/Modal';
import { useApp } from '../../context/AppContext';
import { useI18n } from '../../context/I18nContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime } from '../../utils/formatters';
import { REFERRAL_STATUSES } from '../../utils/constants';

export default function ReferralDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { referrals, submitReferral, appendAudit } = useApp();
  const { user } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const referral = useMemo(() => referrals.find((item) => item.id === id), [referrals, id]);

  if (!referral) {
    return <Card><InfoBanner tone="warning" title="Referral not found">This referral may have been removed or the link is incorrect.</InfoBanner><Button className="mt-4" onClick={() => navigate('/app/referrals')}>Back to referrals</Button></Card>;
  }

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await submitReferral(referral.id, { actor: user?.name, role: user?.role });
      await appendAudit('Emergency protocol reminder', `${referral.reference} · worker acknowledged offline escalation requirement`, user?.name, user?.role);
      setConfirmOpen(false);
      toast(`Referral ${referral.reference} submitted.`, 'success');
    } catch (error) {
      toast(error.message || 'Could not submit referral.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => navigate('/app/referrals')}>Back to referrals</Button>
      <SectionHeading
        eyebrow={referral.reference}
        title={`Referral · ${referral.patientName}`}
        subtitle={`${referral.patientRef} · ${referral.age} years · ${referral.centre}`}
        action={<div className="flex flex-wrap items-center gap-2"><StatusBadge status={referral.priority} /><StatusBadge status={referral.status} /></div>}
      />

      <InfoBanner tone="danger" title={t('ref.emergencyNote')} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card>
            <CardHeader title={t('ref.summary')} subtitle="Information captured during the consultation" action={<Activity size={18} className="text-brand-600" />} />
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              {[
                ['Patient', referral.patientName], ['Patient ID', referral.patientRef], ['Age', `${referral.age || '—'} years`], ['Priority', referral.priority],
              ].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] font-semibold uppercase text-slate-500">{label}</p><p className="mt-1 font-bold text-slate-800">{value}</p></div>)}
            </div>
            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Referral reason</p>
              <p className="mt-1.5 rounded-xl bg-brand-50/60 p-3 text-sm text-slate-800">{referral.reason}</p>
            </div>
          </Card>

          <Card>
            <CardHeader title="Reported symptoms" />
            <div className="flex flex-wrap gap-2">
              {referral.symptoms?.map((symptom) => <Badge key={symptom.id} tone="teal">{symptom.label}{symptom.duration ? ` · ${symptom.duration}` : ''}</Badge>)}
              {!referral.symptoms?.length && <p className="text-sm text-slate-500">No structured symptoms recorded.</p>}
            </div>
          </Card>

          <Card>
            <CardHeader title="Available vital signs" action={<HeartPulse size={18} className="text-brand-600" />} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {Object.entries(referral.vitals || {}).map(([key, value]) => (
                <div key={key} className="rounded-xl border border-slate-200 p-3">
                  <p className="text-[10px] font-semibold uppercase text-slate-500">{key.replace(/([A-Z])/g, ' $1')}</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{value || '—'}</p>
                </div>
              ))}
              {!Object.keys(referral.vitals || {}).length && <p className="col-span-full text-sm text-slate-500">No vital signs recorded.</p>}
            </div>
          </Card>

          <Card>
            <CardHeader title="Relevant medical history" action={<UserRound size={18} className="text-brand-600" />} />
            <p className="text-sm text-slate-700">{referral.medicalHistory || 'Not recorded'}</p>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-amber-200">
            <CardHeader title="Triggered safety warnings" subtitle="Simulated rules · not a diagnosis" action={<ShieldAlert size={18} className="text-amber-600" />} />
            <div className="space-y-2">
              {referral.warnings?.length ? referral.warnings.map((warning, index) => (
                <div key={index} className="flex gap-2 rounded-lg bg-amber-50 p-2.5 text-xs font-medium text-amber-900"><AlertOctagon size={14} className="mt-0.5 shrink-0" />{warning}</div>
              )) : <p className="text-xs text-slate-600">No predefined warning recorded with this referral.</p>}
            </div>
          </Card>

          <Card>
            <CardHeader title="Referral details" action={<CalendarDays size={18} className="text-slate-400" />} />
            <div className="space-y-2.5 text-xs">
              {[
                ['Created', formatDateTime(referral.createdAt)],
                ['Submitted', referral.submittedAt ? formatDateTime(referral.submittedAt) : 'Not submitted'],
                ['Assigned doctor', referral.assignedDoctor],
                ['Referring centre', referral.centre],
                ['Sync status', referral.syncStatus],
              ].map(([label, value]) => <div key={label} className="flex justify-between gap-3"><span className="text-slate-500">{label}</span><span className="text-right font-semibold text-slate-800">{value}</span></div>)}
            </div>
            <div className="mt-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Status progression</p>
              <div className="flex flex-wrap gap-1.5">
                {REFERRAL_STATUSES.map((item) => (
                  <span key={item} className={`rounded-md px-2 py-1 text-[10px] font-semibold ${item === referral.status ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{item}</span>
                ))}
              </div>
            </div>
          </Card>

          {referral.status === 'Created' && (
            <Button fullWidth size="lg" icon={Send} onClick={() => setConfirmOpen(true)}>{t('ref.submit')}</Button>
          )}
          {referral.review && (
            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardHeader title="Specialist feedback" action={<StatusBadge status={referral.review.reviewStatus} />} />
              <p className="text-sm text-slate-800">{referral.review.clinicalComments}</p>
              <div className="mt-3 rounded-lg bg-white p-3"><p className="text-[11px] font-bold uppercase text-brand-700">Next steps</p><p className="mt-1 text-sm text-slate-700">{referral.review.nextSteps}</p></div>
              <p className="mt-2 text-xs text-slate-600">{referral.review.reviewer} · {formatDateTime(referral.review.submittedAt)}</p>
            </Card>
          )}
          <Card className="flex items-start gap-3">
            <Building2 size={18} className="text-slate-400" />
            <p className="text-xs text-slate-600">Remote specialist review is advisory. The frontline worker remains responsible for local clinical action and escalation.</p>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleSubmit}
        title="Submit this referral?"
        message="Submitting notifies the assigned specialist in this demonstration. Emergency escalation must still happen immediately through local protocols."
        confirmLabel="Submit referral"
        loading={submitting}
      />
    </div>
  );
}
