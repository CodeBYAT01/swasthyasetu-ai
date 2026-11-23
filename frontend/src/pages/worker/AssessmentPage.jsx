import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Activity, ClipboardCheck, FileText, HeartPulse, Send, ShieldCheck, UserRound } from 'lucide-react';
import { Card, CardHeader, SectionHeading } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Field, Select, Textarea } from '../../components/ui/Form';
import { Badge, DemoBadge } from '../../components/ui/Badge';
import { InfoBanner } from '../../components/ui/Feedback';
import { Modal } from '../../components/ui/Modal';
import VitalSignsForm from '../../components/clinical/VitalSignsForm';
import SafetyAlertPanel from '../../components/clinical/SafetyAlertPanel';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useToast } from '../../context/ToastContext';
import { evaluateSafety } from '../../services/safetyRules';
import { validateVitals } from '../../utils/validators';
import { formatDate } from '../../utils/formatters';
import { REFERRAL_PRIORITIES } from '../../utils/constants';

const EMPTY_VITALS = { temperature: '', pulse: '', systolic: '', diastolic: '', spo2: '', respiratoryRate: '' };
const DOCTORS = ['Dr. Ananya Rao', 'Dr. Meera Iyer'];

export default function AssessmentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { consultations, patients, updateConsultation, createReferral } = useApp();
  const { user } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const consultationId = searchParams.get('consultation');
  const consultation = useMemo(
    () => consultations.find((item) => item.id === consultationId),
    [consultations, consultationId],
  );
  const patient = useMemo(
    () => patients.find((p) => p.id === consultation?.patientRef || p.patientId === consultation?.patientRef),
    [patients, consultation],
  );

  const [vitals, setVitals] = useState(EMPTY_VITALS);
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [referralOpen, setReferralOpen] = useState(false);
  const [referral, setReferral] = useState({ reason: '', priority: 'Priority', assignedDoctor: DOCTORS[0] });

  useEffect(() => {
    if (consultation?.vitals && Object.keys(consultation.vitals).length) {
      setVitals({ ...EMPTY_VITALS, ...consultation.vitals });
      setSaved(Boolean(consultation.assessment));
    }
  }, [consultation?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const assessment = useMemo(() => evaluateSafety({
    symptoms: consultation?.symptoms || [],
    vitals,
    transcript: consultation?.transcript || '',
  }), [consultation, vitals]);

  const setVital = (key, value) => {
    setVitals((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setSaved(false);
  };

  const handleSave = async () => {
    const validation = validateVitals(vitals);
    if (Object.keys(validation).length) {
      setErrors(validation);
      toast('Check the highlighted vital signs.', 'error', 'Validation error');
      return;
    }
    setSaving(true);
    try {
      await updateConsultation(consultation.id, { vitals, assessment, status: 'assessment-complete' });
      setSaved(true);
      toast('Assessment saved locally with the simulated safety evaluation.', 'success', 'Assessment saved');
    } catch (error) {
      toast(error.message || 'Could not save assessment.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateReferral = async () => {
    if (!referral.reason.trim()) {
      toast('Enter a referral reason.', 'error');
      return;
    }
    try {
      const record = await createReferral({
        patientRef: patient.patientId,
        patientName: patient.name,
        age: patient.age,
        reason: referral.reason.trim(),
        priority: referral.priority,
        status: 'Submitted',
        submittedAt: new Date().toISOString(),
        assignedDoctor: referral.assignedDoctor,
        doctorId: referral.assignedDoctor === DOCTORS[1] ? 'u-doctor-2' : 'u-doctor-1',
        centre: user?.centre || 'Hosur Community Health Centre',
        consultationId: consultation.id,
        symptoms: consultation.symptoms || [],
        vitals,
        warnings: assessment.reasons || [],
        medicalHistory: patient.medicalHistory || '',
      }, { actor: user?.name, role: user?.role });
      setReferralOpen(false);
      toast(`Referral ${record.reference} submitted for specialist review.`, 'success', 'Referral created');
      navigate(`/app/referrals/${record.id}`);
    } catch (error) {
      toast(error.message || 'Could not create referral.', 'error');
    }
  };

  if (!consultation) {
    return (
      <div className="space-y-6">
        <SectionHeading eyebrow="Step 3 of 3 · Assessment" title={t('assess.title')} subtitle="Select a confirmed consultation to continue." />
        <Card padded={false}>
          <div className="divide-y divide-slate-100">
            {consultations.filter((item) => item.symptoms?.length).map((item) => (
              <button key={item.id} type="button" onClick={() => navigate(`/app/assessment?consultation=${item.id}`)} className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-slate-50">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-700"><ClipboardCheck size={17} /></span>
                <span className="flex-1"><span className="block text-sm font-semibold text-slate-800">{item.patientName}</span><span className="block text-xs text-slate-500">{item.patientRef} · {formatDate(item.createdAt)}</span></span>
                <Button size="sm" variant="soft">Open</Button>
              </button>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Step 3 of 3 · Clinical assessment"
        title={t('assess.title')}
        subtitle="Review the information below, enter vital signs and act on the simulated safety evaluation."
        action={<DemoBadge />}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_400px]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="A. Patient details" subtitle="From registration" action={<UserRound size={18} className="text-brand-600" />} />
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              {[
                ['Name', patient?.name || consultation.patientName],
                ['Patient ID', patient?.patientId || consultation.patientRef],
                ['Age / Sex', patient ? `${patient.age} / ${patient.sex}` : '—'],
                ['Village', patient?.village || '—'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                  <p className="mt-1 font-semibold text-slate-800">{value}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="B. Reported symptoms" subtitle="Confirmed in the voice consultation" action={<Activity size={18} className="text-brand-600" />} />
            <div className="flex flex-wrap gap-2">
              {(consultation.symptoms || []).map((symptom) => (
                <span key={symptom.id} className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-800">
                  {symptom.label}{symptom.duration ? ` · ${symptom.duration}` : ''}
                </span>
              ))}
              {!consultation.symptoms?.length && <p className="text-sm text-slate-500">No confirmed symptoms recorded.</p>}
            </div>
            <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs italic text-slate-600">“{consultation.transcript}”</p>
          </Card>

          <Card>
            <CardHeader title="C. Medical history" subtitle="Recorded during registration" action={<FileText size={18} className="text-brand-600" />} />
            <div className="grid gap-4 sm:grid-cols-2 text-sm">
              <div><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">History</p><p className="mt-1 text-slate-800">{patient?.medicalHistory || 'Not recorded'}</p></div>
              <div><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Allergies</p><p className="mt-1 text-slate-800">{patient?.allergies || 'Not recorded'}</p></div>
            </div>
          </Card>

          <Card>
            <CardHeader title="D. Vital signs" subtitle={t('assess.vitals')} action={<HeartPulse size={18} className="text-brand-600" />} />
            <VitalSignsForm values={vitals} onChange={setVital} errors={errors} t={t} />
            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
              <Button icon={ClipboardCheck} loading={saving} onClick={handleSave}>{t('assess.save')}</Button>
              {saved && <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><ShieldCheck size={15} /> Saved locally</span>}
              <Button variant="secondary" icon={Send} onClick={() => setReferralOpen(true)}>{t('assess.referral')}</Button>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-amber-200">
            <CardHeader title={t('assess.safety')} subtitle="Evaluated automatically as you enter readings" action={<Badge tone="amber">Simulated</Badge>} />
            <SafetyAlertPanel assessment={assessment} t={t} />
          </Card>
          <InfoBanner tone="danger" title="Emergency escalation is independent">
            If an emergency is suspected, act through local emergency protocols immediately. Do not wait for this interface, a referral acknowledgement, or network connectivity.
          </InfoBanner>
          <Card>
            <h3 className="text-sm font-bold text-slate-900">Encounter details</h3>
            <div className="mt-3 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between"><span>Consultation ID</span><span className="font-mono font-semibold text-slate-800">{consultation.id.slice(0, 18)}</span></div>
              <div className="flex justify-between"><span>Language</span><span className="font-semibold text-slate-800">{consultation.language?.toUpperCase()}</span></div>
              <div className="flex justify-between"><span>Recorded by</span><span className="font-semibold text-slate-800">{consultation.workerName}</span></div>
              <div className="flex justify-between"><span>Created</span><span className="font-semibold text-slate-800">{formatDate(consultation.createdAt)}</span></div>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={referralOpen}
        onClose={() => setReferralOpen(false)}
        title="Create and submit referral"
        subtitle="A digital referral never replaces emergency escalation."
        footer={<><Button variant="outline" onClick={() => setReferralOpen(false)}>Cancel</Button><Button icon={Send} onClick={handleCreateReferral}>Submit Referral</Button></>}
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-slate-50 p-3 text-sm">
            <p className="font-semibold text-slate-800">{patient?.name} · {patient?.patientId}</p>
            <p className="mt-1 text-xs text-slate-600">{consultation.symptoms?.map((s) => s.label).join(', ')}</p>
            {assessment.level === 'emergency' && <p className="mt-2 text-xs font-bold text-red-700">Emergency warning triggered by simulated rules</p>}
          </div>
          <Field label="Referral reason" htmlFor="referral-reason" required>
            <Textarea id="referral-reason" rows={4} value={referral.reason} onChange={(event) => setReferral((prev) => ({ ...prev, reason: event.target.value }))} placeholder="Summarize why specialist review is needed…" />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Priority" htmlFor="referral-priority">
              <Select id="referral-priority" value={referral.priority} onChange={(event) => setReferral((prev) => ({ ...prev, priority: event.target.value }))}>
                {REFERRAL_PRIORITIES.map((priority) => <option key={priority}>{priority}</option>)}
              </Select>
            </Field>
            <Field label="Assigned doctor" htmlFor="referral-doctor">
              <Select id="referral-doctor" value={referral.assignedDoctor} onChange={(event) => setReferral((prev) => ({ ...prev, assignedDoctor: event.target.value }))}>
                {DOCTORS.map((doctor) => <option key={doctor}>{doctor}</option>)}
              </Select>
            </Field>
          </div>
        </div>
      </Modal>
    </div>
  );
}
