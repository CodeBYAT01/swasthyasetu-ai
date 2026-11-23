import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Inbox, Search } from 'lucide-react';
import { Card, SectionHeading } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Form';
import { Table } from '../../components/ui/Table';
import { StatusBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/Feedback';
import { useApp } from '../../context/AppContext';
import { useI18n } from '../../context/I18nContext';
import { useDebounce } from '../../hooks/useDebounce';
import { formatDateTime, truncate } from '../../utils/formatters';

export default function IncomingReferralsPage() {
  const { referrals } = useApp();
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [priority, setPriority] = useState('All');
  const debounced = useDebounce(query);

  const filtered = useMemo(() => referrals.filter((item) => {
    const term = debounced.toLowerCase().trim();
    return (priority === 'All' || item.priority === priority)
      && (!term || [item.patientName, item.patientRef, item.reason, item.centre].some((field) => String(field || '').toLowerCase().includes(term)));
  }).sort((a, b) => new Date(b.submittedAt || b.createdAt) - new Date(a.submittedAt || a.createdAt)), [referrals, priority, debounced]);

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Specialist workspace" title={t('nav.incomingReferrals')} subtitle="Open a case to review the complete consultation record." />
      <Card padded={false}>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4">
          <div className="relative min-w-[240px] flex-1">
            <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search referrals…" className="pl-10" />
          </div>
          <Select value={priority} onChange={(event) => setPriority(event.target.value)} className="w-40">
            <option value="All">All priorities</option><option>Urgent</option><option>Priority</option><option>Routine</option>
          </Select>
        </div>
        {filtered.length ? (
          <Table headers={['Patient ID', 'Age', 'Symptoms', 'Referral reason', 'Urgency', 'Referring centre', 'Submitted', 'Status', '']}>
            {filtered.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/70">
                <td className="whitespace-nowrap px-4 py-3"><p className="font-semibold text-slate-800">{item.patientRef}</p><p className="text-[11px] text-slate-500">{item.patientName}</p></td>
                <td className="px-4 py-3 text-slate-600">{item.age}</td>
                <td className="px-4 py-3 text-slate-600">{item.symptoms?.map((s) => s.label).join(', ') || '—'}</td>
                <td className="max-w-[240px] px-4 py-3 text-slate-600">{truncate(item.reason, 70)}</td>
                <td className="px-4 py-3"><StatusBadge status={item.priority} /></td>
                <td className="px-4 py-3 text-slate-600">{item.centre}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDateTime(item.submittedAt || item.createdAt)}</td>
                <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                <td className="px-4 py-3"><Link to={`/app/review/${item.id}`}><Button size="sm" variant="outline">Open case</Button></Link></td>
              </tr>
            ))}
          </Table>
        ) : <div className="p-5"><EmptyState icon={Inbox} title="No referrals found" /></div>}
      </Card>
    </div>
  );
}
