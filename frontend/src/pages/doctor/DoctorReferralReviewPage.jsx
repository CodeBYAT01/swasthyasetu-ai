import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, ClipboardList, FileText, HeartPulse, MessageSquareText, ShieldAlert, Stethoscope, UserRound,
} from 'lucide-react';
import { Card, CardHeader, SectionHeading } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Field, Textarea, Select, Checkbox } from '../../components/ui/Form';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { InfoBanner } from '../../components/ui/Feedback';
import SafetyAlertPanel from '../../components/clinical/SafetyAlertPanel';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useToast } from '../../context/ToastContext';
import { validateReview } from '../../utils/validators';
import { formatDateTime } from '../../utils/formatters';

const REVIEW_STATUSES = ['Under Review', 'Advice Recorded', 'Closed'];

export default function DoctorReferralReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { referrals, consultations, patients, reviews, submitReview } = useApp();
  const { user } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();

  const referral = useMemo(() => referrals.find((item) => item.id === id), [referrals, id]);
  const consultation = useMemo(
    () => consultations.find((item) => item.id === referral?.consultationId),
    [consultations, referral],
  );
  const patient = useMemo(
    () => patients.find((item) => item.patientId === referral?.patientRef || item.id === referral?.patientRef),
    [patients, referral],
  );
  const previousConsultations = useMemo(
    () => consultations.filter((item) => item.patientRef === referral?.patientRef && item.id !== consultation?.id),
    [consultations, referral, consultation],
  );
  const existingReview = useMemo(() => reviews.find((item) => item.referralId === id), [reviews, id]);

  const [values, setValues] = useState({
    clinicalComments: existingReview?.clinicalComments || '',
    nextSteps: existingReview?.nextSteps || '',
    followUp: existingReview?.followUp ?? true,
    reviewStatus: existingReview?.reviewStatus || 'Advice Recorded',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setValues({
      clinicalComments: existingReview?.clinicalComments || '',
      nextSteps: existingReview?.nextSteps || '',
      followUp: existingReview?.followUp ?? true,
      reviewStatus: existingReview?.reviewStatus || 'Advice Recorded',
    });
    setErrors({});
  }, [id, existingReview?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  if (!referral) {
    return <Card><InfoBanner tone="warning" title="Referral not found">Return to incoming referrals and select another case.</InfoBanner><Button className="mt-4" onClick={() => navigate('/app/review')}>Back to referrals</Button></Card>;
  }

  const handleSubmit = async () => {
    const validation = validateReview(values);
    if (Object.keys(validation).length) {
      setErrors(validation);
      toast('Complete the highlighted review fields.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await submitReview(referral.id, values, { actor: user?.name || 'Dr. Ananya Rao', role: 'doctor' });
      toast('Specialist review submitted and saved locally.', 'success', 'Review complete');
      navigate('/app/completed');
    } catch (error) {
      toast(error.message || 'Could not submit review.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => navigate('/app/review')}>Back to incoming referrals</Button>
      <SectionHeading
        eyebrow={`Case ${referral.reference}`}
        title={`${referral.patientName} · ${referral.patientRef}`}
        subtitle={`${referral.age} years · ${referral.centre} · submitted ${formatDateTime(referral.submittedAt || referral.createdAt)}`}
        action={<div className="flex flex-wrap gap-2"><StatusBadge status={referral.priority} /><StatusBadge status={referral.status} /></div>}
      />

      <InfoBanner tone="info">
        This portal displays decision support information only. It does not generate diagnoses or prescribe medication. Your clinical judgement and local protocols govern care.
      </InfoBanner>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Patient information" action={<UserRound size={18} className="text-brand-600" />} />
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              {[
                ['Name', referral.patientName], ['Patient ID', referral.patientRef], ['Age', `${referral.age || '—'} years`], ['Village', patient?.village || '—'],
              ].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] font-semibold uppercase text-slate-500">{label}</p><p className="mt-1 font-bold text-slate-800">{value}</p></div>)}
            </div>
            <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div><p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Relevant medical history</p><p className="mt-1 text-slate-700">{referral.medicalHistory || patient?.medicalHistory || 'Not recorded'}</p></div>
              <div><p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Known allergies</p><p className="mt-1 text-slate-700">{patient?.allergies || 'Not recorded'}</p></div>
            </div>
          </Card>

          <Card>
            <CardHeader title={t('doc.transcript')} subtitle={`Language: ${consultation?.language?.toUpperCase() || '—'}`} action={<FileText size={18} className="text-brand-600" />} />
            <p className="rounded-xl bg-slate-50 p-4 text-sm italic leading-relaxed text-slate-700">“{consultation?.transcript || 'Transcript not available for this referral.'}”</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {referral.symptoms?.map((symptom) => <Badge key={symptom.id} tone="teal">{symptom.label}{symptom.duration ? ` · ${symptom.duration}` : ''}</Badge>)}
            </div>
          </Card>

          <Card>
            <CardHeader title="Available vital signs" action={<HeartPulse size={18} className="text-brand-600" />} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {Object.entries(referral.vitals || {}).map(([key, value]) => (
                <div key={key} className="rounded-xl border border-slate-200 p-3"><p className="text-[10px] font-semibold uppercase text-slate-500">{key.replace(/([A-Z])/g, ' $1')}</p><p className="mt-1 text-lg font-bold text-slate-900">{value || '—'}</p></div>
              ))}
            </div>
          </Card>

          <Card className="border-amber-200">
            <CardHeader title={t('doc.warnings')} subtitle="Simulated rules · requires clinical interpretation" action={<ShieldAlert size={18} className="text-amber-600" />} />
            <div className="space-y-2">
              {referral.warnings?.length ? referral.warnings.map((warning, index) => (
                <div key={index} className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{warning}</div>
              )) : <p className="text-sm text-slate-600">No warnings were recorded with this referral.</p>}
            </div>
            {consultation?.assessment && <div className="mt-3"><SafetyAlertPanel assessment={consultation.assessment} t={t} /></div>}
          </Card>

          <Card>
            <CardHeader title="Previous consultations" subtitle="Same patient, earlier encounters" action={<ClipboardList size={18} className="text-brand-600" />} />
            {previousConsultations.length ? previousConsultations.map((item) => (
              <div key={item.id} className="mb-2 rounded-xl border border-slate-200 p-3">
                <p className="text-sm font-semibold text-slate-800">{formatDateTime(item.createdAt)} · {item.assessment?.title || 'Incomplete'}</p>
                <p className="mt-1 text-xs text-slate-600">{item.symptoms?.map((s) => s.label).join(', ')}</p>
              </div>
            )) : <p className="text-sm text-slate-500">No previous consultations in this demonstration dataset.</p>}
          </Card>
        </div>

        <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Card className="border-brand-200">
            <CardHeader title={t('doc.review')} subtitle="Advisory feedback for the referring worker" action={<Stethoscope size={18} className="text-brand-600" />} />
            <div className="space-y-4">
              <Field label={t('doc.comments')} htmlFor="review-comments" required error={errors.clinicalComments}>
                <Textarea id="review-comments" rows={5} value={values.clinicalComments} onChange={(event) => set('clinicalComments', event.target.value)} placeholder="Document your clinical observations…" />
              </Field>
              <Field label={t('doc.nextSteps')} htmlFor="review-next" required error={errors.nextSteps}>
                <Textarea id="review-next" rows={4} value={values.nextSteps} onChange={(event) => set('nextSteps', event.target.value)} placeholder="Recommended next steps for the frontline team…" />
              </Field>
              <Field label={t('doc.reviewStatus')} htmlFor="review-status" error={errors.reviewStatus}>
                <Select id="review-status" value={values.reviewStatus} onChange={(event) => set('reviewStatus', event.target.value)}>
                  {REVIEW_STATUSES.map((status) => <option key={status}>{status}</option>)}
                </Select>
              </Field>
              <Checkbox label={t('doc.followUp')} description="Schedule a follow-up check with the patient." checked={values.followUp} onChange={(event) => set('followUp', event.target.checked)} />
              <Button fullWidth size="lg" icon={MessageSquareText} loading={submitting} onClick={handleSubmit}>{t('doc.submitReview')}</Button>
              <p className="flex items-start gap-1.5 text-[11px] text-slate-500"><CheckCircle2 size={14} className="mt-0.5 shrink-0" /> No diagnosis or prescription is generated by this interface.</p>
            </div>
          </Card>

          {existingReview && (
            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardHeader title="Previously recorded advice" action={<StatusBadge status={existingReview.reviewStatus} />} />
              <p className="text-sm text-slate-800">{existingReview.clinicalComments}</p>
              <p className="mt-2 text-xs text-slate-600">{existingReview.reviewer} · {formatDateTime(existingReview.submittedAt)}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
