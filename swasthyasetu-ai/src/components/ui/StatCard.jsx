import { ArrowUpRight } from 'lucide-react';
import { Card } from './Card';

export function StatCard({ icon: Icon, label, value, hint, tone = 'teal', onClick }) {
  const tones = {
    teal: 'bg-brand-50 text-brand-700',
    blue: 'bg-sky-50 text-sky-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
    green: 'bg-emerald-50 text-emerald-700',
    slate: 'bg-slate-100 text-slate-600',
  };
  return (
    <Card className={`transition-shadow ${onClick ? 'cursor-pointer hover:shadow-soft' : ''}`} onClick={onClick}>
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}><Icon size={19} /></div>
        {onClick && <ArrowUpRight size={16} className="text-slate-300" />}
      </div>
      <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-700">{label}</p>
      {hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
    </Card>
  );
}
