import { STATUS_STYLES } from '../../utils/constants';

export function Badge({ children, tone = 'slate', className = '', dot = false, ...props }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700 ring-slate-200',
    teal: 'bg-brand-50 text-brand-700 ring-brand-200',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    amber: 'bg-amber-50 text-amber-800 ring-amber-200',
    red: 'bg-red-50 text-red-700 ring-red-200',
    blue: 'bg-sky-50 text-sky-700 ring-sky-200',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${tones[tone]} ${className}`} {...props}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function StatusBadge({ status, className = '' }) {
  const toneClass = STATUS_STYLES[status] || 'bg-slate-100 text-slate-700 ring-slate-200';
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${toneClass} ${className}`}>{status}</span>;
}

export function DemoBadge({ className = '' }) {
  return (
    <span className={`inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800 ${className}`}>
      Simulated demo data
    </span>
  );
}
