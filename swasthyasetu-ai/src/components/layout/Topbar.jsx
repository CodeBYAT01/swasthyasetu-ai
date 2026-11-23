import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronDown, Cloud, CloudOff, Languages, Menu, ShieldCheck } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../ui/Avatar';
import { formatDate } from '../../utils/formatters';
import { NAV_ITEMS, ROLES } from '../../utils/constants';

function pageTitle(pathname, role, t) {
  const items = NAV_ITEMS[role] || NAV_ITEMS[ROLES.WORKER];
  const match = items.find((item) => item.path === pathname)
    || items.find((item) => pathname.startsWith(`${item.path}/`));
  if (match) return t(`nav.${match.key}`, match.key);
  if (pathname.includes('/consultation/')) return t('nav.newConsultation');
  if (pathname.includes('/assessment')) return t('assess.title');
  if (pathname.includes('/admin')) return t('nav.overview');
  return t('nav.overview');
}

export default function Topbar({ onMenu }) {
  const { language, languages, setLanguage, t } = useI18n();
  const online = useOnlineStatus();
  const { user, logout } = useAuth();
  const { patients, consultations } = useApp();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const todayConsultations = consultations.filter((item) => new Date(item.createdAt).toDateString() === new Date().toDateString()).length;

  return (
    <header className="sticky top-0 z-20 flex h-[76px] items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      <button type="button" onClick={onMenu} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open navigation"><Menu size={20} /></button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-bold text-slate-900 sm:text-lg">{pageTitle(location.pathname, user?.role, t)}</h1>
        <p className="hidden truncate text-xs text-slate-500 sm:block">
          {formatDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {todayConsultations} {t('dash.consultations').toLowerCase()} · {patients.length} {t('dash.registered').toLowerCase()}
        </p>
      </div>

      <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 md:flex">
        {online ? <Cloud size={15} className="text-emerald-600" /> : <CloudOff size={15} className="text-amber-600" />}
        <span className={`text-xs font-semibold ${online ? 'text-emerald-700' : 'text-amber-700'}`}>{online ? t('online') : t('offline')}</span>
      </div>

      <div className="flex items-center gap-2">
        <Languages size={16} className="hidden text-slate-400 sm:block" />
        <select
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
          className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 focus:border-brand-500 focus:outline-none"
          aria-label={t('language')}
        >
          {languages.map((item) => <option key={item.code} value={item.code}>{item.native}</option>)}
        </select>
      </div>

      <div className="relative" ref={menuRef}>
        <button type="button" onClick={() => setMenuOpen((value) => !value)} className="flex items-center gap-2 rounded-xl border border-slate-200 p-1 pr-2 hover:bg-slate-50" aria-label="Profile menu" aria-expanded={menuOpen}>
          <Avatar name={user?.name} size="sm" />
          <ChevronDown size={15} className="text-slate-400" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-12 z-30 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-card animate-fadeUp">
            <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
            <p className="mt-0.5 text-xs text-slate-500">{user?.title}</p>
            <p className="mt-0.5 text-xs text-slate-500">{user?.centre}</p>
            <div className="my-3 border-t border-slate-100" />
            <div className="flex items-center gap-2 rounded-lg bg-brand-50 px-2.5 py-2 text-xs font-medium text-brand-700"><ShieldCheck size={14} /> Clinical decision support only</div>
            <button type="button" onClick={logout} className="mt-3 w-full rounded-lg px-2.5 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50">{t('logout')}</button>
          </div>
        )}
      </div>
    </header>
  );
}
