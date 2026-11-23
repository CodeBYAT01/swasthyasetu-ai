import { Link } from 'react-router-dom';
import { MessageSquareText, Stethoscope } from 'lucide-react';
import { Card, SectionHeading } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/Feedback';
import { useApp } from '../../context/AppContext';
import { useI18n } from '../../context/I18nContext';
import { formatDateTime } from '../../utils/formatters';

export default function DoctorReviewPage() {
  const { reviews, referrals } = useApp();
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Specialist feedback" title={t('nav.doctorReview')} subtitle="Advice recorded by remote doctors on referred cases." />
      <div className="space-y-3">
        {reviews.map((review) => {
          const referral = referrals.find((item) => item.id === review.referralId);
          return (
            <Card key={review.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><Stethoscope size={19} /></div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{referral?.patientName || 'Patient'} · {referral?.patientRef}</p>
                    <p className="text-xs text-slate-500">{review.reviewer} · {formatDateTime(review.submittedAt)}</p>
                  </div>
                </div>
                <StatusBadge status={review.reviewStatus} />
              </div>
              <p className="mt-3 text-sm text-slate-700">{review.clinicalComments}</p>
              <div className="mt-3 rounded-xl bg-emerald-50 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-800">Next steps from specialist</p>
                <p className="mt-1 text-sm text-slate-700">{review.nextSteps}</p>
              </div>
              {referral && <Link to={`/app/referrals/${referral.id}`} className="mt-3 inline-block text-xs font-bold text-brand-700 hover:underline">Open referral →</Link>}
            </Card>
          );
        })}
        {!reviews.length && <EmptyState icon={MessageSquareText} title="No specialist feedback yet" description="Feedback appears here after a doctor submits a review." />}
      </div>
    </div>
  );
}
