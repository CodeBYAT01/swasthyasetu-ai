export default function Logo({ compact = false, light = false, className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${light ? 'bg-white/15' : 'bg-brand-600'} shadow-sm`}>
        <svg viewBox="0 0 40 40" className="h-7 w-7" aria-hidden="true">
          <path d="M17 8h6v9h9v6h-9v9h-6v-9H8v-6h9V8Z" fill="#fff" />
          <circle cx="31.5" cy="9" r="3" fill="#38BDF8" />
        </svg>
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className={`block text-[15px] font-extrabold tracking-tight ${light ? 'text-white' : 'text-slate-900'}`}>SwasthyaSetu <span className="text-brand-500">AI</span></span>
          <span className={`block text-[10px] font-medium ${light ? 'text-white/70' : 'text-slate-500'}`}>Voice-first care platform</span>
        </span>
      )}
    </div>
  );
}
