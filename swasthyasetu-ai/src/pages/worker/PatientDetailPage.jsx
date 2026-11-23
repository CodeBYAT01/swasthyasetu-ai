import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Activity, ArrowLeft, CalendarDays, FileText, HeartPulse, MapPin, Mic, Phone,
  Send, ShieldCheck, Stethoscope, UserRound,
} from 'lucide-react';
import { Card, CardHeader, SectionHeading } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/Feedback';
import { useApp } from '../../context/AppContext';
import { useI18n } from '../../context/I18nContext';
import { formatDate, formatDateTime } from '../../utils/formatters';
import SafetyAlertPanel from '../../components/clinical/SafetyAlertPanel';

const TABS = [
  { key: 'overview', label: 'Overview', icon: UserRound },
  { key: 'consultations', label: 'Consultations', icon: Activity },
  { key: 'referrals', label: 'Referrals', icon: Send },
  { key: 'feedback', label: 'Specialist feedback', icon: Stethoscope },
];

export default function PatientDetailPage() {
  const { patientRef } = useParams();
  const navigate = useNavigate();
  const { patients, consultations, referrals, reviews } = useApp();
  const { t } = useI18n();
  const [tab, setTab] = useState('overview');

  const patient = useMemo(
    () => patients.find((item) => item.id === patientRef || item.patientId === patientRef),
    [patients, patientRef],
  );
  const patientConsultations = useMemo(
    () => consultations.filter((item) => item.patientRef === patient?.patientId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [consultations, patient],
  );
  const patientReferrals = useMemo(
    () => referrals.filter((item) => item.patientRef === patient?.patientId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [referrals, patient],
  );
  const patientReviews = useMemo(
    () => reviews.filter((review) => patientReferrals.some((item) => item.id === review.referralId)),
    [reviews, patientReferrals],
  );

  if (!patient) {
    return <Card><EmptyState title="Patient not found" description="This record may have been removed or the link is incorrect." action={<Button onClick={() => navigate('/app/patients')}>Back to patients</Button>} /></Card>;
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => navigate('/app/patients')}>Back to patient records</Button>
      <SectionHeading
        eyebrow="Patient record"
        title={patient.name}
        subtitle={`${patient.patientId} · ${patient.age} years · ${patient.sex} · ${patient.village}`}
        action={<div className="flex flex-wrap items-center gap-2"><StatusBadge status={patient.syncStatus} /><Button icon={Mic} onClick={() => navigate(`/app/consultation/new?patient=${encodeURIComponent(patient.id)}`)}>New consultation</Button></div>}
      />

      <Card className="flex flex-wrap items-center gap-4 border-brand-200 bg-brand-50/40">
        <Avatar name={patient.name} size="lg" />
        <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            [CalendarDays, 'Registered', formatDate(patient.createdAt)],
            [MapPin, 'Village', patient.village],
            [Phone, 'Phone', patient.phone || 'Not provided'],
            [ShieldCheck, 'Consent', patient.consent ? 'Recorded' : 'Not recorded'],
          ].map(([Icon, label, value]) => (
            <div key={label}>
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500"><Icon size={13} /> {label}</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        {TABS.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.key} type="button" onClick={() => setTab(item.key)} className={`flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors ${tab === item.key ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
              <Icon size={16} /> {item.label}
              <span className="rounded-full bg-slate-100 px-1.5 text-[10px] text-slate-600">
                {item.key === 'consultations' ? patientConsultations.length : item.key === 'referrals' ? patientReferrals.length : item.key === 'feedback' ? patientReviews.length : ''}
              </span>
            </button>
          );
        })}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Profile & medical history" action={<FileText size={18} className="text-brand-600" />} />
            <dl className="space-y-3 text-sm">
              {[
                ['Patient ID', patient.patientId], ['Age', `${patient.age} years`], ['Sex', patient.sex],
                ['Medical history', patient.medicalHistory], ['Known allergies', patient.allergies],
                ['Consent status', patient.consent ? 'Recorded' : 'Not recorded'],
                ['Record status', patient.draft ? 'Draft' : 'Registered'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                  <dt className="text-slate-500">{label}</dt><dd className="text-right font-semibold text-slate-800">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card>
            <CardHeader title="Latest assessment" subtitle={patientConsultations[0] ? formatDateTime(patientConsultations[0].createdAt) : 'No assessment yet'} />
            {patientConsultations[0]?.assessment ? (
              <SafetyAlertPanel assessment={patientConsultations[0].assessment} t={t} />
            ) : <EmptyState title="No assessment recorded" description="Complete a voice consultation and assessment to see the simulated evaluation." />}
          </Card>
        </div>
      )}

      {tab === 'consultations' && (
        <div className="space-y-4">
          {patientConsultations.map((item) => (
            <Card key={item.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">{formatDateTime(item.createdAt)}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{item.language?.toUpperCase()} · {item.workerName} · {item.symptoms?.length || 0} confirmed symptoms</p>
                </div>
                <Badge tone={item.assessment?.level === 'emergency' ? 'red' : 'teal'}>{item.assessment?.title || 'In progress'}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Transcript</p>
                  <p className="mt-1.5 rounded-xl bg-slate-50 p-3 text-sm italic text-slate-700">“{item.transcript}”</p>
                  <div className="mt-3 flex flex-wrap gap-2">{item.symptoms?.map((s) => <Badge key={s.id} tone="teal">{s.label}{s.duration ? ` · ${s.duration}` : ''}</Badge>)}</div>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"><HeartPulse size={14} /> Vital signs</p>
                  <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {Object.entries(item.vitals || {}).map(([key, value]) => (
                      <div key={key} className="rounded-lg bg-slate-50 p-2 text-xs">
                        <p className="text-slate-500">{key.replace(/([A-Z])/g, ' $1')}</p>
                        <p className="font-bold text-slate-800">{value || '—'}</p>
                      </div>
                    ))}
                  </div>
                  {item.assessment && <div className="mt-3"><SafetyAlertPanel assessment={item.assessment} t={t} /></div>}
                </div>
              </div>
            </Card>
          ))}
          {!patientConsultations.length && <EmptyState title="No consultations yet" />}
        </div>
      )}

      {tab === 'referrals' && (
        <div className="space-y-3">
          {patientReferrals.map((item) => (
            <Card key={item.id} className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-sm font-bold text-slate-900">{item.reference}</p><p className="mt-1 text-xs text-slate-600">{item.reason}</p><p className="mt-1 text-[11px] text-slate-400">Created {formatDateTime(item.createdAt)} · {item.assignedDoctor}</p></div>
              <div className="flex items-center gap-2"><StatusBadge status={item.priority} /><StatusBadge status={item.status} /><Button size="sm" variant="outline" onClick={() => navigate(`/app/referrals/${item.id}`)}>Open</Button></div>
            </Card>
          ))}
          {!patientReferrals.length && <EmptyState title="No referrals yet" />}
        </div>
      )}

      {tab === 'feedback' && (
        <div className="space-y-3">
          {patientReviews.map((review) => (
            <Card key={review.id}>
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-bold text-slate-900">{review.reviewer}</p><StatusBadge status={review.reviewStatus} /></div>
              <p className="mt-3 text-sm text-slate-700">{review.clinicalComments}</p>
              <div className="mt-3 rounded-xl bg-brand-50 p-3"><p className="text-xs font-bold uppercase tracking-wide text-brand-700">Recommended next steps</p><p className="mt-1 text-sm text-slate-700">{review.nextSteps}</p></div>
              <p className="mt-2 text-xs text-slate-500">Follow-up required: {review.followUp ? 'Yes' : 'No'} · {formatDateTime(review.submittedAt)}</p>
            </Card>
          ))}
          {!patientReviews.length && <EmptyState icon={Stethoscope} title="No specialist feedback yet" description="Feedback will appear here after a doctor submits a review." />}
        </div>
      )}
    </div>
  );
}
