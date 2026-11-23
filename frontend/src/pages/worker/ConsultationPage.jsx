import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AudioLines, CheckCircle2, CircleAlert, Languages, Mic, PencilLine, Play, RotateCcw,
  Sparkles, Square, UserRound,
} from 'lucide-react';
import { Card, CardHeader, SectionHeading } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, DemoBadge } from '../../components/ui/Badge';
import { Textarea } from '../../components/ui/Form';
import { InfoBanner, AlertStripe } from '../../components/ui/Feedback';
import Waveform from '../../components/voice/Waveform';
import SymptomReviewList from '../../components/voice/SymptomReviewList';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useToast } from '../../context/ToastContext';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { extractSymptoms, SAMPLE_UTTERANCES } from '../../utils/symptomParser';
import { formatTime } from '../../utils/formatters';
import { LANGUAGES } from '../../utils/constants';

export default function ConsultationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { patients, saveConsultation } = useApp();
  const { user } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const patientRef = searchParams.get('patient');
  const patient = useMemo(() => patients.find((item) => item.id === patientRef || item.patientId === patientRef), [patients, patientRef]);

  const [language, setLanguage] = useState('kn');
  const [symptoms, setSymptoms] = useState([]);
  const [consultationId, setConsultationId] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const applyTranscript = useCallback((text) => {
    voice.setTranscript(text);
    if (text.trim()) setSymptoms(extractSymptoms(text));
    setConfirmed(false);
    setConsultationId(null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const voice = useSpeechRecognition({ language, onFinal: (text) => applyTranscript(text) });

  const handleSample = (key = language) => {
    const sample = SAMPLE_UTTERANCES[key] || SAMPLE_UTTERANCES.en;
    applyTranscript(sample.text);
    toast(`${sample.label} loaded. Review every extracted item.`, 'info', 'Sample speech');
  };

  const allConfirmed = symptoms.length > 0 && symptoms.every((item) => item.confirmed && item.label.trim());
  const status = voice.state === 'recording'
    ? t('cons.recording')
    : voice.state === 'processing'
      ? t('cons.processing')
      : voice.transcript.trim()
        ? allConfirmed ? t('cons.needsConfirmation') : t('cons.transcriptReady')
        : t('cons.ready');

  const handleConfirm = async () => {
    if (!patient) return;
    if (!voice.transcript.trim()) { toast('A transcript is required before confirming.', 'error'); return; }
    if (!allConfirmed) { toast('Confirm every extracted symptom before continuing.', 'error'); return; }
    setConfirming(true);
    try {
      const record = await saveConsultation({
        id: consultationId || undefined,
        patientRef: patient.patientId,
        patientName: patient.name,
        workerId: user?.id || 'u-worker-1',
        workerName: user?.name || 'Lakshmi N.',
        language,
        transcript: voice.transcript.trim(),
        symptoms,
        vitals: {},
        assessment: null,
        status: 'symptoms-confirmed',
        syncStatus: 'Pending Sync',
        createdAt: new Date().toISOString(),
      }, { actor: user?.name, role: user?.role });
      setConsultationId(record.id);
      setConfirmed(true);
      toast('Symptoms confirmed and saved locally.', 'success', 'Consultation updated');
    } catch (error) {
      toast(error.message || 'Could not save the consultation.', 'error');
    } finally {
      setConfirming(false);
    }
  };

  const handleClear = () => {
    voice.reset();
    setSymptoms([]);
    setConsultationId(null);
    setConfirmed(false);
    toast('Recording and transcript cleared.', 'info');
  };

  const handleExtract = () => {
    if (!voice.transcript.trim()) { toast('Enter or record speech first.', 'error'); return; }
    setSymptoms(extractSymptoms(voice.transcript));
    setConfirmed(false);
    toast('Extracted items are shown for review — none are accepted automatically.', 'info');
  };

  if (!patient) {
    return (
      <div className="space-y-6">
        <SectionHeading eyebrow="Step 2 of 3 · Consultation" title={t('cons.title')} subtitle="Select a patient to begin a voice-led consultation." />
        <InfoBanner tone="warning" title="No patient selected">Choose a patient from the list below, or register a new patient first.</InfoBanner>
        <Card padded={false}>
          <div className="divide-y divide-slate-100">
            {patients.slice(0, 10).map((item) => (
              <button key={item.id} type="button" onClick={() => navigate(`/app/consultation/new?patient=${encodeURIComponent(item.id)}`)} className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-slate-50">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-700"><UserRound size={17} /></span>
                <span className="flex-1"><span className="block text-sm font-semibold text-slate-800">{item.name}</span><span className="block text-xs text-slate-500">{item.patientId} · {item.village}</span></span>
                <Button size="sm" variant="soft">Select</Button>
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
        eyebrow="Step 2 of 3 · Voice consultation"
        title={t('cons.title')}
        subtitle={t('cons.subtitle')}
        action={<DemoBadge />}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
        <div className="space-y-4">
          <Card className="overflow-hidden border-brand-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">Consultation language</p>
                <p className="mt-1 text-xs text-slate-500">Spoken language for speech recognition</p>
              </div>
              <Languages size={18} className="text-brand-600" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {LANGUAGES.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => { setLanguage(item.code); voice.reset(); setSymptoms([]); setConfirmed(false); }}
                  className={`rounded-xl border px-2 py-2.5 text-center text-xs font-bold transition-colors ${language === item.code ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:border-brand-300'}`}
                >
                  <span className="block">{item.native}</span>
                  <span className="mt-0.5 block text-[10px] font-medium opacity-70">{item.label}</span>
                </button>
              ))}
            </div>

            <div className="mt-6 flex flex-col items-center rounded-2xl bg-slate-50 py-6">
              <div className="relative">
                {voice.state === 'recording' && <span className="absolute inset-0 animate-pulseRing rounded-full bg-brand-400/30" />}
                <button
                  type="button"
                  onClick={() => (voice.state === 'recording' ? voice.stop() : voice.start())}
                  className={`relative flex h-28 w-28 items-center justify-center rounded-full text-white shadow-soft transition-transform hover:scale-[1.03] focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-300 ${voice.state === 'recording' ? 'bg-red-600' : 'bg-brand-600'}`}
                  aria-label={voice.state === 'recording' ? t('cons.stop') : t('cons.start')}
                >
                  <Mic size={42} />
                </button>
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-500">{t('cons.mic')}</p>
              <p className="mt-1 font-mono text-2xl font-bold text-slate-900">{formatTime(voice.seconds)}</p>
              <span className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ${voice.state === 'recording' ? 'bg-red-100 text-red-700' : voice.state === 'processing' ? 'bg-sky-100 text-sky-700' : 'bg-brand-100 text-brand-700'}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />{status}
              </span>
              <Waveform active={voice.state === 'recording'} className="mt-2 w-full" />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {voice.state === 'recording'
                ? <Button variant="danger" fullWidth icon={Square} onClick={voice.stop}>{t('cons.stop')}</Button>
                : <Button variant="primary" fullWidth icon={Play} onClick={voice.start}>{t('cons.start')}</Button>}
              <Button variant="outline" fullWidth icon={RotateCcw} onClick={handleClear}>{t('cons.clear')}</Button>
            </div>

            {!voice.supported && (
              <AlertStripe tone="warning" title="Browser speech recognition unavailable">
                Manual text entry and sample utterances are fully functional for this demonstration.
              </AlertStripe>
            )}
            {voice.error && <AlertStripe tone="warning" title="Speech recognition notice">{voice.error}</AlertStripe>}

            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold text-slate-700">{t('cons.sample')}</p>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="soft" onClick={() => handleSample('kn')}>Kannada sample</Button>
                <Button size="sm" variant="soft" onClick={() => handleSample('hi')}>Hindi sample</Button>
                <Button size="sm" variant="outline" onClick={() => handleSample('en')}>English sample</Button>
                <Button size="sm" variant="outline" onClick={() => handleSample('emergency')}>Emergency drill</Button>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-900 text-white">
            <p className="text-[11px] font-bold uppercase tracking-wider text-brand-300">Patient instruction</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-100">{t('cons.instructions')}</p>
            <div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-3 text-xs text-slate-300">
              <UserRound size={15} /> {patient.name} · {patient.patientId} · {patient.village}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader
              title={t('cons.transcript')}
              subtitle={t('cons.transcriptHelp')}
              action={<Badge tone={voice.transcript.trim() ? 'green' : 'slate'}>{voice.transcript.trim() ? t('cons.transcriptReady') : t('cons.ready')}</Badge>}
            />
            <Textarea
              value={voice.transcript}
              onChange={(event) => { voice.setTranscript(event.target.value); setConfirmed(false); }}
              rows={5}
              placeholder="Recognized speech will appear here. You can also type what the patient said…"
              aria-label="Editable consultation transcript"
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-xs text-slate-500"><PencilLine size={14} /> {t('cons.manual')}</p>
              <Button size="sm" variant="outline" icon={Sparkles} onClick={handleExtract}>Extract symptoms from transcript</Button>
            </div>
            {voice.interim && <p className="mt-2 rounded-lg bg-slate-50 p-2 text-xs italic text-slate-500">Listening… {voice.interim}</p>}
          </Card>

          <Card>
            <CardHeader
              title={t('cons.extracted')}
              subtitle={t('cons.confirmEach')}
              action={<Badge tone={allConfirmed ? 'green' : 'amber'}>{symptoms.filter((s) => s.confirmed).length}/{symptoms.length} confirmed</Badge>}
            />
            <InfoBanner tone="warning" title="Never silently accept uncertain transcription">
              Extracted items are suggestions from a demonstration keyword matcher. Edit, remove or confirm each item yourself.
            </InfoBanner>
            <div className="mt-4">
              <SymptomReviewList
                symptoms={symptoms}
                onChange={(next) => { setSymptoms(next); setConfirmed(false); }}
                onAdd={() => setSymptoms((prev) => [...prev, { id: `sym-${Date.now()}`, label: '', duration: '', confidence: 'medium', confirmed: false, source: 'manual' }])}
                t={t}
              />
            </div>
          </Card>

          <Card className="border-brand-200 bg-brand-50/40">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-700 shadow-sm"><CheckCircle2 size={20} /></div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{confirmed ? 'Symptoms confirmed and saved locally' : 'Ready to confirm?'}</p>
                  <p className="mt-0.5 max-w-lg text-xs text-slate-600">{confirmed ? 'Continue to enter vital signs and review the simulated safety alert.' : 'Confirm the transcript and all reviewed symptoms before assessment.'}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" icon={AudioLines} loading={confirming} onClick={handleConfirm} disabled={confirmed}>{t('cons.confirmSymptoms')}</Button>
                <Button variant="secondary" onClick={() => navigate(`/app/assessment?consultation=${consultationId}`)} disabled={!confirmed}>{t('cons.nextAssessment')}</Button>
              </div>
            </div>
            {!allConfirmed && symptoms.length > 0 && <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-amber-800"><CircleAlert size={14} /> Confirm every symptom to enable the next step.</p>}
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500"><Sparkles size={13} /> {t('cons.privacy')}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
