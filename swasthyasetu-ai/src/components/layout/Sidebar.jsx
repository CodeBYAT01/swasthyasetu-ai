import { NavLink, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import {
  Activity, Building2, CheckCircle2, ClipboardList, Inbox, LayoutDashboard, LogOut, Mic,
  RefreshCw, ScrollText, Send, Settings, ShieldCheck, Stethoscope, UserCog, Users, X,
} from 'lucide-react';
import Logo from '../brand/Logo';
import { NAV_ITEMS, ROLES } from '../../utils/constants';
import { useI18n } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';

const ICONS = {
  LayoutDashboard, Mic, Users, Send, Stethoscope, RefreshCw, Settings, Inbox,
  CheckCircle2, UserCog, Building2, ShieldCheck, ClipboardList, ScrollText, Activity,
};

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const location = useLocation();
  const items = NAV_ITEMS[user?.role] || NAV_ITEMS[ROLES.WORKER];

  useEffect(() => { onClose(); }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-[76px] items-center justify-between border-b border-slate-100 px-5">
          <Logo />
          <button type="button" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden" onClick={onClose} aria-label="Close navigation"><X size={18} /></button>
        </div>

        <div className="px-4 pb-3 pt-4">
          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4" aria-label="Main navigation">
          {items.map((item) => {
            const Icon = ICONS[item.icon] || Activity;
            return (
              <NavLink
                key={item.key}
                to={item.path}
                end={item.path === '/app/overview'}
                className={({ isActive }) => `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                {({ isActive }) => (
                  <>
                    <Icon size={18} className={isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'} />
                    <span>{t(`nav.${item.key}`, item.key)}</span>
                    {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-500" />}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <div className="mb-2 flex items-center gap-3 rounded-xl bg-slate-50 p-2.5">
            <Avatar name={user?.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-800">{user?.name}</p>
              <p className="truncate text-[11px] capitalize text-slate-500">{user?.role}</p>
            </div>
          </div>
          <button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-700">
            <LogOut size={18} className="text-slate-400" />
            {t('logout')}
          </button>
        </div>
      </aside>
    </>
  );
}
