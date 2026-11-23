import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Search, UserPlus, Users } from 'lucide-react';
import { Card, CardHeader, SectionHeading } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Form';
import { Table, Pagination } from '../../components/ui/Table';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState, LoadingState } from '../../components/ui/Feedback';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useDebounce } from '../../hooks/useDebounce';
import { formatDate } from '../../utils/formatters';
import { ROLES } from '../../utils/constants';

const PAGE_SIZE = 8;

export default function PatientsPage() {
  const { patients, consultations, loading } = useApp();
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [village, setVillage] = useState('All');
  const [sync, setSync] = useState('All');
  const [page, setPage] = useState(1);
  const debouncedQuery = useDebounce(query);

  const villages = useMemo(() => ['All', ...new Set(patients.map((p) => p.village).filter(Boolean))], [patients]);

  const filtered = useMemo(() => {
    const term = debouncedQuery.toLowerCase().trim();
    return patients.filter((patient) => {
      const matchesTerm = !term || [patient.name, patient.patientId, patient.village, patient.phone].some((field) => String(field || '').toLowerCase().includes(term));
      const matchesVillage = village === 'All' || patient.village === village;
      const matchesSync = sync === 'All' || patient.syncStatus === sync;
      return matchesTerm && matchesVillage && matchesSync;
    }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [patients, debouncedQuery, village, sync]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const lastConsultation = (ref) => consultations
    .filter((item) => item.patientRef === ref)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Records"
        title={t('patients.title')}
        subtitle={t('patients.subtitle')}
        action={user?.role === ROLES.WORKER ? <Button icon={UserPlus} onClick={() => navigate('/app/patients/new')}>Register patient</Button> : <Badge tone="teal">Read-only specialist access</Badge>}
      />

      <Card padded={false}>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4">
          <div className="relative min-w-[240px] flex-1">
            <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
            <Input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder={t('patients.search')} className="pl-10" aria-label="Search patients" />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <Select value={village} onChange={(event) => { setVillage(event.target.value); setPage(1); }} className="w-40" aria-label="Filter by village">
              {villages.map((item) => <option key={item} value={item}>{item === 'All' ? 'All villages' : item}</option>)}
            </Select>
            <Select value={sync} onChange={(event) => { setSync(event.target.value); setPage(1); }} className="w-44" aria-label="Filter by sync status">
              {['All', 'Saved Locally', 'Pending Sync', 'Synchronized', 'Sync Failed'].map((item) => <option key={item} value={item}>{item === 'All' ? 'All sync states' : item}</option>)}
            </Select>
          </div>
        </div>

        {loading ? <LoadingState /> : visible.length ? (
          <>
            <Table headers={['Patient ID', 'Patient', 'Age / Sex', 'Village', 'Last consultation', t('patients.sync'), t('actions')]}>
              {visible.map((patient) => {
                const last = lastConsultation(patient.patientId);
                return (
                  <tr key={patient.id} className="hover:bg-slate-50/70">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-brand-700">{patient.patientId}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={patient.name} size="sm" />
                        <div><p className="font-semibold text-slate-800">{patient.name}</p><p className="text-[11px] text-slate-500">{patient.draft ? 'Draft record' : 'Registered'}</p></div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{patient.age} / {patient.sex === 'Female' ? 'F' : patient.sex === 'Male' ? 'M' : 'O'}</td>
                    <td className="px-4 py-3 text-slate-600">{patient.village}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{last ? formatDate(last.createdAt) : '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={patient.syncStatus} /></td>
                    <td className="px-4 py-3"><Button size="sm" variant="outline" onClick={() => navigate(`/app/patients/${encodeURIComponent(patient.patientId)}`)}>{t('patients.view')}</Button></td>
                  </tr>
                );
              })}
            </Table>
            <Pagination page={page} totalPages={totalPages} total={filtered.length} onChange={setPage} />
          </>
        ) : (
          <div className="p-5"><EmptyState icon={Users} title={t('patients.empty')} description="Try a different search term or clear the filters." action={<Button variant="outline" onClick={() => { setQuery(''); setVillage('All'); setSync('All'); }}>Clear filters</Button>} /></div>
        )}
      </Card>
    </div>
  );
}
