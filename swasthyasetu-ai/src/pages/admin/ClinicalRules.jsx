import { useState } from 'react';
import { CheckCircle2, ClipboardList, ShieldAlert } from 'lucide-react';
import { Card, CardHeader, SectionHeading } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { InfoBanner } from '../../components/ui/Feedback';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useToast } from '../../context/ToastContext';
import { CLINICAL_RULES } from '../../database/seed';
import { formatDateTime } from '../../utils/formatters';

export default function ClinicalRules() {
  const [rules, setRules] = useState(CLINICAL_RULES);
  const { appendAudit } = useApp();
  const { user } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();

  const activate = async (id) => {
    const target = rules.find((rule) => rule.id === id);
    setRules((prev) => prev.map((rule) => ({ ...rule, status: rule.id === id ? 'Active (demonstration only)' : 'Superseded' })));
    await appendAudit('Clinical rule version activated', target.version, user?.name, 'admin');
    toast(`${target.version} is now active for the demonstration.`, 'success');
  };

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Administration" title={t('nav.clinicalRules')} subtitle="Version control for the simulated safety-rule set." />
      <InfoBanner tone="danger" icon={ShieldAlert} title="Unreviewed rules">These fixed rules are for demonstration only. They must be reviewed and approved by qualified clinicians before any real-world use.</InfoBanner>
      <div className="space-y-4">
        {rules.map((rule) => (
          <Card key={rule.id} className={rule.status.startsWith('Active') ? 'border-brand-300' : ''}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${rule.status.startsWith('Active') ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'}`}><ClipboardList size={19} /></div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{rule.version}</h3>
                  <p className="mt-1 text-xs text-slate-500">Published {formatDateTime(rule.publishedAt)} by {rule.publishedBy}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={rule.status.startsWith('Active') ? 'teal' : 'slate'}>{rule.status}</Badge>
                {!rule.status.startsWith('Active') && <Button size="sm" variant="outline" onClick={() => activate(rule.id)}>Set active</Button>}
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-700">{rule.summary}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
              <Badge tone="amber">{rule.reviewStatus}</Badge>
              <span className="flex items-center gap-1.5 text-slate-500"><CheckCircle2 size={13} /> Triggered warnings are always shown with reasons</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
