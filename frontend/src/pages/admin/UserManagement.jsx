import { useState } from 'react';
import { UserCog, UserPlus } from 'lucide-react';
import { Card, CardHeader, SectionHeading } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Field, Input, Select } from '../../components/ui/Form';
import { Table } from '../../components/ui/Table';
import { StatusBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useToast } from '../../context/ToastContext';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { USERS, HEALTH_CENTRES } from '../../database/seed';

const EMPTY = { name: '', email: '', role: 'worker', centre: HEALTH_CENTRES[0].name };

export default function UserManagement() {
  const [users, setUsers] = useLocalStorage('swasthyasetu.admin.users', USERS);
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(EMPTY);
  const [error, setError] = useState('');
  const { appendAudit } = useApp();
  const { user } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();

  const addUser = async () => {
    if (!values.name.trim() || !values.email.trim()) {
      setError('Name and email are required.');
      return;
    }
    if (users.some((item) => item.email.toLowerCase() === values.email.toLowerCase())) {
      setError('A user with this email already exists.');
      return;
    }
    const record = {
      ...values,
      id: `u-${Date.now()}`,
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      status: 'Active',
      title: values.role === 'doctor' ? 'Specialist' : 'Frontline Health Worker',
    };
    setUsers((prev) => [record, ...prev]);
    await appendAudit('User registered', `${record.name} · ${record.role}`, user?.name, 'admin');
    setOpen(false);
    setValues(EMPTY);
    setError('');
    toast(`${record.name} added as ${record.role}.`, 'success');
  };

  const toggleStatus = async (id) => {
    const target = users.find((item) => item.id === id);
    setUsers((prev) => prev.map((item) => (item.id === id ? { ...item, status: item.status === 'Active' ? 'Inactive' : 'Active' } : item)));
    await appendAudit('User status changed', `${target.name} → ${target.status === 'Active' ? 'Inactive' : 'Active'}`, user?.name, 'admin');
    toast(`${target.name} status updated.`, 'info');
  };

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Administration" title={t('nav.userManagement')} subtitle="Register workers and doctors, and manage account status." action={<Button icon={UserPlus} onClick={() => setOpen(true)}>Add user</Button>} />
      <Card padded={false}>
        <div className="p-5 pb-2"><CardHeader title="Accounts" subtitle={`${users.length} fictional users`} action={<UserCog size={18} className="text-brand-600" />} /></div>
        <Table headers={['Name', 'Role', 'Email', 'Centre / speciality', 'Status', 'Actions']}>
          {users.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-3 font-semibold text-slate-800">{item.name}</td>
              <td className="px-4 py-3 capitalize text-slate-600">{item.role}</td>
              <td className="px-4 py-3 text-slate-600">{item.email}</td>
              <td className="px-4 py-3 text-slate-600">{item.speciality || item.centre}</td>
              <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
              <td className="px-4 py-3"><Button size="sm" variant="outline" onClick={() => toggleStatus(item.id)}>{item.status === 'Active' ? 'Deactivate' : 'Activate'}</Button></td>
            </tr>
          ))}
        </Table>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Register new user"
        subtitle="Creates a fictional demonstration account."
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button icon={UserPlus} onClick={addUser}>Create user</Button></>}
      >
        <div className="space-y-4">
          <Field label="Full name" htmlFor="new-name" required><Input id="new-name" value={values.name} onChange={(event) => setValues((prev) => ({ ...prev, name: event.target.value }))} /></Field>
          <Field label="Email" htmlFor="new-email" required><Input id="new-email" type="email" value={values.email} onChange={(event) => setValues((prev) => ({ ...prev, email: event.target.value }))} /></Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Role" htmlFor="new-role">
              <Select id="new-role" value={values.role} onChange={(event) => setValues((prev) => ({ ...prev, role: event.target.value }))}><option value="worker">Health worker</option><option value="doctor">Doctor</option></Select>
            </Field>
            <Field label="Health centre" htmlFor="new-centre">
              <Select id="new-centre" value={values.centre} onChange={(event) => setValues((prev) => ({ ...prev, centre: event.target.value }))}>
                {HEALTH_CENTRES.map((centre) => <option key={centre.id}>{centre.name}</option>)}
              </Select>
            </Field>
          </div>
          {error && <p className="text-xs font-medium text-red-600">{error}</p>}
        </div>
      </Modal>
    </div>
  );
}
