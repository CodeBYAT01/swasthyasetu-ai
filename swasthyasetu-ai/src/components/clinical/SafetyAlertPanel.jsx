import { AlertOctagon, CheckCircle2, ClipboardCheck, Info, ShieldAlert } from 'lucide-react';
import { DemoBadge } from '../ui/Badge';
import { SAFETY_LEVELS } from '../../utils/constants';

const CONFIG = {
  [SAFETY_LEVELS.EMERGENCY]: {
    icon: AlertOctagon,
    wrapper: 'border-red-300 bg-red-50',
    title: 'text-red-800',
    body: 'text-red-900',
    pill: 'bg-red-600 text-white',
  },
  [SAFETY_LEVELS.ASSESSMENT]: {
    icon: ShieldAlert,
    wrapper: 'border-amber-300 bg-amber-50',
    title: 'text-amber-900',
    body: 'text-amber-950',
    pill: 'bg-amber-500 text-white',
  },
  [SAFETY_LEVELS.INCOMPLETE]: {
    icon: ClipboardCheck,
    wrapper: 'border-slate-300 bg-slate-50',
    title: 'text-slate-800',
    body: 'text-slate-700',
    pill: 'bg-slate-500 text-white',
  },
  [SAFETY_LEVELS.NONE]: {
    icon: CheckCircle2,
    wrapper: 'border-emerald-200 bg-emerald-50',
    title: 'text-emerald-900',
    body: 'text-emerald-950',
    pill: 'bg-emerald-600 text-white',
  },
};

export default function SafetyAlertPanel({ assessment, t }) {
  if (!assessment) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
        <Info size={18} className="mt-0.5 shrink-0" />
        Enter vital signs and confirm symptoms to evaluate the demonstration safety rules.
      </div>
    );
  }

  const config = CONFIG[assessment.level] || CONFIG[SAFETY_LEVELS.INCOMPLETE];
  const Icon = config.icon;

  return (
    <div className={`rounded-xl border p-4 ${config.wrapper}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Icon size={22} className={`mt-0.5 shrink-0 ${config.title}`} />
          <div>
            <p className={`text-sm font-bold ${config.title}`}>{t?.(`assess.${assessment.level}`) || assessment.title}</p>
            <p className={`mt-0.5 text-xs ${config.body} opacity-80`}>Rule version: {assessment.ruleVersion || 'DEMO-RULES-v0.3 (unreviewed)'}</p>
          </div>
        </div>
        <DemoBadge />
      </div>

      <ul className="mt-3 space-y-1.5 text-sm">
        {(assessment.reasons || []).map((reason, index) => (
          <li key={index} className={`flex items-start gap-2 ${config.body}`}>
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${config.pill}`} />
            <span>{reason}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 rounded-lg border border-white/60 bg-white/70 p-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{t?.('assess.next') || 'Next appropriate action'}</p>
        <p className="mt-1 text-sm font-medium text-slate-800">{assessment.action}</p>
      </div>

      {assessment.level === SAFETY_LEVELS.NONE && (
        <p className="mt-3 text-xs font-medium text-slate-700">{t?.('assess.noneNote') || 'This does not mean the patient is healthy. Continue standard clinical assessment.'}</p>
      )}
      <p className="mt-3 text-[11px] text-slate-600">{t?.('assess.ruleNote') || 'Rules are demonstration-only and must be reviewed by qualified clinicians.'}</p>
    </div>
  );
}
