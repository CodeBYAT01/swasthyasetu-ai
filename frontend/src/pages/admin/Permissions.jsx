import { Check, Minus, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, SectionHeading } from '../../components/ui/Card';
import { InfoBanner } from '../../components/ui/Feedback';
import { useI18n } from '../../context/I18nContext';
import { PERMISSIONS } from '../../database/seed';

export default function Permissions() {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Administration" title={t('nav.permissions')} subtitle="Demonstration access matrix for the three roles." />
      <InfoBanner tone="warning" title="Read-only demonstration matrix">Changing permissions in this prototype requires backend authorization policy updates.</InfoBanner>
      <Card padded={false}>
        <div className="p-5 pb-2"><CardHeader title="Module access" subtitle="Frontline worker · Doctor / specialist · Administrator" action={<ShieldCheck size={18} className="text-brand-600" />} /></div>
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead><tr className="border-b border-slate-200 bg-slate-50/70">
              {['Module', 'Frontline worker', 'Doctor / specialist', 'Administrator'].map((header) => <th key={header} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">{header}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {PERMISSIONS.map((row) => (
                <tr key={row.module}>
                  <td className="px-4 py-3 font-semibold text-slate-800">{row.module}</td>
                  {['worker', 'doctor', 'admin'].map((role) => (
                    <td key={role} className="px-4 py-3">
                      {row[role].length ? (
                        <div className="flex flex-wrap gap-1.5">{row[role].map((permission) => <span key={permission} className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-1 text-[11px] font-semibold text-brand-700"><Check size={11} /> {permission}</span>)}</div>
                      ) : <span className="inline-flex items-center gap-1 text-xs text-slate-400"><Minus size={12} /> No access</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
