import { forwardRef } from 'react';

export function Field({ label, htmlFor, required, error, hint, children, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {children}
      {error ? <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p> : hint ? <p className="mt-1.5 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

const controlBase = 'w-full rounded-xl border bg-white px-3.5 text-sm text-slate-800 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 disabled:bg-slate-50 disabled:text-slate-400';

export const Input = forwardRef(function Input({ error, className = '', ...props }, ref) {
  return <input ref={ref} className={`${controlBase} h-11 ${error ? 'border-red-400' : 'border-slate-300'} ${className}`} {...props} />;
});

export const Select = forwardRef(function Select({ error, className = '', children, ...props }, ref) {
  return (
    <select ref={ref} className={`${controlBase} h-11 ${error ? 'border-red-400' : 'border-slate-300'} ${className}`} {...props}>
      {children}
    </select>
  );
});

export const Textarea = forwardRef(function Textarea({ error, className = '', rows = 3, ...props }, ref) {
  return <textarea ref={ref} rows={rows} className={`${controlBase} py-2.5 leading-relaxed ${error ? 'border-red-400' : 'border-slate-300'} ${className}`} {...props} />;
});

export function Checkbox({ label, description, className = '', ...props }) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 transition-colors hover:bg-slate-50 ${className}`}>
      <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500" {...props} />
      <span>
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-slate-500">{description}</span>}
      </span>
    </label>
  );
}
