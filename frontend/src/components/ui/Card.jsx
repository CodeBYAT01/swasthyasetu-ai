export function Card({ children, className = '', padded = true, ...props }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-card ${padded ? 'p-5' : ''} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`mb-4 flex flex-wrap items-start justify-between gap-3 ${className}`}>
      <div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function SectionHeading({ eyebrow, title, subtitle, action, className = '' }) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-4 ${className}`}>
      <div>
        {eyebrow && <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-600">{eyebrow}</p>}
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
