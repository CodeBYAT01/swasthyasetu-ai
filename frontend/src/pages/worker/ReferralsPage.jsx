import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertOctagon, Clock3, Send, UserRound } from 'lucide-react';
import { Card, SectionHeading } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select, Input } from '../../components/ui/Form';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/Feedback';
import { useApp } from '../../context/AppContext';
import { useI18n } from '../../context/I18nContext';
import { useDebounce } from '../../hooks/useDebounce';
import { formatDateTime, relativeTime } from '../../utils/formatters';
import { REFERRAL_STATUSES } from '../../utils/constants';

export default function ReferralsPage() {
  const { referrals } = useApp();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [status, setStatus] = useState('All');
  const [priority, setPriority] = useState('All');
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query);

  const filtered = useMemo(() => referrals.filter((item) => {
    const term = debounced.toLowerCase().trim();
    return (status === 'All' || item.status === status)
      && (priority === 'All' || item.priority === priority)
      && (!term || [item.patientName, item.patientRef, item.reference, item.reason].some((field) => String(field || '').toLowerCase().includes(term)));
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [referrals, status, priority, debounced]);

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Escalation" title={t('ref.title')} subtitle="Track referrals from creation through specialist feedback." />

      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
        <p className="flex items-center gap-2 font-bold"><AlertOctagon size={17} /> {t('ref.emergencyNote')}</p>
      </div>

      <Card padded={false}>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search referrals…" className="max-w-xs" aria-label="Search referrals" />
          <Select value={status} onChange={(event) => setStatus(event.target.value)} className="w-44" aria-label="Filter by status">
            <option value="All">All statuses</option>
            {REFERRAL_STATUSES.map((item) => <option key={item}>{item}</option>)}
          </Select>
          <Select value={priority} onChange={(event) => setPriority(event.target.value)} className="w-40" aria-label="Filter by priority">
            <option value="All">All priorities</option>
            <option>Urgent</option><option>Priority</option><option>Routine</option>
          </Select>
          <span className="ml-auto text-xs font-semibold text-slate-500">{filtered.length} referral{filtered.length === 1 ? '' : 's'}</span>
        </div>

        <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <button key={item.id} type="button" onClick={() => navigate(`/app/referrals/${item.id}`)} className="rounded-xl border border-slate-200 p-4 text-left transition-all hover:border-brand-300 hover:shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-700"><UserRound size={17} /></div>
                  <div><p className="text-sm font-bold text-slate-900">{item.patientName}</p><p className="font-mono text-[11px] text-slate-500">{item.patientRef}</p></div>
                </div>
                <StatusBadge status={item.priority} />
              </div>
              <p className="mt-3 line-clamp-2 min-h-[40px] text-xs leading-relaxed text-slate-600">{item.reason}</p>
              <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                <p className="flex items-center gap-1.5"><Clock3 size={13} /> {formatDateTime(item.submittedAt || item.createdAt)} · {relativeTime(item.createdAt)}</p>
                <p className="flex items-center gap-1.5"><Send size={13} /> {item.reference} · {item.assignedDoctor}</p>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <StatusBadge status={item.status} />
                <span className="text-xs font-bold text-brand-700">Open →</span>
              </div>
            </button>
          ))}
          {!filtered.length && <div className="md:col-span-2 xl:col-span-3"><EmptyState icon={Send} title="No referrals match your filters" description="Adjust the filters or create a referral from a completed assessment." /></div>}
        </div>
      </Card>
    </div>
  );
}
