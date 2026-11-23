import { useMemo, useState } from 'react';
import { ScrollText, Search } from 'lucide-react';
import { Card, SectionHeading } from '../../components/ui/Card';
import { Input, Select } from '../../components/ui/Form';
import { Table } from '../../components/ui/Table';
import { EmptyState } from '../../components/ui/Feedback';
import { useApp } from '../../context/AppContext';
import { useI18n } from '../../context/I18nContext';
import { useDebounce } from '../../hooks/useDebounce';
import { formatDateTime } from '../../utils/formatters';

export default function AuditLog() {
  const { auditLog } = useApp();
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('All');
  const debounced = useDebounce(query);

  const filtered = useMemo(() => {
    const term = debounced.toLowerCase().trim();
    return auditLog.filter((item) => (role === 'All' || item.role === role)
      && (!term || [item.actor, item.action, item.detail].some((field) => String(field || '').toLowerCase().includes(term))))
      .sort((a, b) => new Date(b.at) - new Date(a.at));
  }, [auditLog, role, debounced]);

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Administration" title={t('nav.auditLog')} subtitle="Chronological record of demonstration actions." />
      <Card padded={false}>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4">
          <div className="relative min-w-[240px] flex-1"><Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search audit events…" className="pl-10" /></div>
          <Select value={role} onChange={(event) => setRole(event.target.value)} className="w-40">
            {['All', 'worker', 'doctor', 'admin', 'system'].map((item) => <option key={item} value={item}>{item === 'All' ? 'All roles' : item}</option>)}
          </Select>
        </div>
        {filtered.length ? (
          <Table headers={['Timestamp', 'Actor', 'Role', 'Action', 'Details']}>
            {filtered.map((item) => (
              <tr key={item.id}>
                <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDateTime(item.at)}</td>
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-800">{item.actor}</td>
                <td className="px-4 py-3 text-slate-600 capitalize">{item.role}</td>
                <td className="px-4 py-3 font-medium text-slate-800">{item.action}</td>
                <td className="px-4 py-3 text-slate-600">{item.detail}</td>
              </tr>
            ))}
          </Table>
        ) : <div className="p-5"><EmptyState icon={ScrollText} title="No matching audit events" /></div>}
      </Card>
    </div>
  );
}
