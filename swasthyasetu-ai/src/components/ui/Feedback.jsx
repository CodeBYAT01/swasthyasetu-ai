import { AlertCircle, CheckCircle2, Inbox, Loader2, ShieldAlert } from 'lucide-react';

export function EmptyState({ icon: Icon = Inbox, title, description, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-10 text-center ${className}`}>
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm"><Icon size={20} /></div>
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = 'Loading records…' }) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 text-slate-500">
      <Loader2 className="animate-spin text-brand-600" size={26} />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function InfoBanner({ tone = 'info', title, children, icon: Icon, className = '' }) {
  const tones = {
    info: 'border-sky-200 bg-sky-50 text-sky-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    danger: 'border-red-200 bg-red-50 text-red-900',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  };
  const DefaultIcon = tone === 'danger' ? ShieldAlert : tone === 'warning' ? AlertCircle : tone === 'success' ? CheckCircle2 : AlertCircle;
  const RenderIcon = Icon || DefaultIcon;
  return (
    <div className={`flex items-start gap-3 rounded-xl border p-4 ${tones[tone]} ${className}`}>
      <RenderIcon size={18} className="mt-0.5 shrink-0" />
      <div className="text-sm leading-relaxed">
        {title && <p className="font-semibold">{title}</p>}
        {children}
      </div>
    </div>
  );
}

export function AlertStripe({ tone = 'info', title, children, icon: Icon }) {
  const tones = {
    info: 'border-l-sky-500 bg-sky-50/70',
    warning: 'border-l-amber-500 bg-amber-50/70',
    danger: 'border-l-red-600 bg-red-50/70',
    success: 'border-l-emerald-500 bg-emerald-50/70',
  };
  const DefaultIcon = tone === 'danger' ? ShieldAlert : AlertCircle;
  const RenderIcon = Icon || DefaultIcon;
  return (
    <div className={`flex items-start gap-3 rounded-r-xl border-l-4 p-4 ${tones[tone]}`}>
      <RenderIcon size={18} className="mt-0.5 shrink-0" />
      <div className="text-sm leading-relaxed">
        {title && <p className="font-semibold">{title}</p>}
        {children}
      </div>
    </div>
  );
}
