import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, HeartHandshake, LockKeyhole, Mail, Stethoscope, UserCog, Users } from 'lucide-react';
import AuthLayout from '../layouts/AuthLayout';
import { Button } from '../components/ui/Button';
import { Field, Input } from '../components/ui/Form';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { useToast } from '../context/ToastContext';
import { DEMO_ACCOUNTS, ROLES } from '../utils/constants';

const ROLE_ICONS = { [ROLES.WORKER]: Users, [ROLES.DOCTOR]: Stethoscope, [ROLES.ADMIN]: UserCog };
const ROLE_LABELS = { [ROLES.WORKER]: 'Frontline Health Worker', [ROLES.DOCTOR]: 'Doctor / Specialist', [ROLES.ADMIN]: 'Administrator' };

export default function LoginPage() {
  const [role, setRole] = useState(ROLES.WORKER);
  const [identifier, setIdentifier] = useState(DEMO_ACCOUNTS[0].email);
  const [password, setPassword] = useState(DEMO_ACCOUNTS[0].password);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const navigate = useNavigate();

  const chooseRole = (nextRole) => {
    const account = DEMO_ACCOUNTS.find((item) => item.role === nextRole);
    setRole(nextRole);
    setIdentifier(account.email);
    setPassword(account.password);
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(identifier, password);
      toast(`Signed in as ${user.name}`, 'success', 'Welcome to SwasthyaSetu AI');
      navigate('/app/overview', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
        <div className="mb-6 flex items-center gap-2 text-brand-700">
          <HeartHandshake size={20} />
          <span className="text-[11px] font-bold uppercase tracking-[0.16em]">SwasthyaSetu AI</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{t('login.title')}</h1>
        <p className="mt-1.5 text-sm text-slate-500">{t('login.subtitle')}</p>

        <div className="mt-6">
          <p className="mb-2 text-xs font-semibold text-slate-700">{t('login.role')}</p>
          <div className="grid grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map((account) => {
              const Icon = ROLE_ICONS[account.role];
              const active = role === account.role;
              return (
                <button
                  key={account.role}
                  type="button"
                  onClick={() => chooseRole(account.role)}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-colors ${active ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300'}`}
                >
                  <Icon size={18} />
                  <span className="text-[11px] font-bold leading-tight">{ROLE_LABELS[account.role]}</span>
                </button>
              );
            })}
          </div>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Field label={t('login.email')} htmlFor="login-email" required>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <Input id="login-email" value={identifier} onChange={(event) => setIdentifier(event.target.value)} className="pl-10" autoComplete="username" required />
            </div>
          </Field>
          <Field label={t('login.password')} htmlFor="login-password" required>
            <div className="relative">
              <LockKeyhole size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <Input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="pl-10 pr-12"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-2 top-2 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label={showPassword ? t('login.hide') : t('login.show')}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>

          {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">{error}</p>}

          <Button type="submit" size="lg" fullWidth loading={loading}>{t('login.signIn')}</Button>
        </form>

        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{t('login.demoAccounts')}</p>
          <div className="mt-2 space-y-1.5">
            {DEMO_ACCOUNTS.map((account) => (
              <button key={account.role} type="button" onClick={() => chooseRole(account.role)} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs hover:bg-white">
                <span className="font-medium text-slate-700">{account.email}</span>
                <span className="rounded bg-white px-1.5 py-0.5 font-semibold text-brand-700 ring-1 ring-slate-200">{account.role}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-slate-500">{t('login.hint')} <span className="font-mono font-semibold text-slate-700">demo1234</span></p>
        </div>
      </div>
    </AuthLayout>
  );
}
