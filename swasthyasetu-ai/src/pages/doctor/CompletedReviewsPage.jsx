import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Card, SectionHeading } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/Feedback';
import { useApp } from '../../context/AppContext';
import { useI18n } from '../../context/I18nContext';
import { formatDateTime } from '../../utils/formatters';

export default function CompletedReviewsPage() {
  const { reviews, referrals } = useApp();
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Specialist workspace" title={t('nav.completedReviews')} subtitle="Advisory feedback already submitted to referring teams." />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {reviews.map((review) => {
          const referral = referrals.find((item) => item.id === review.referralId);
          return (
            <Card key={review.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-slate-900">{referral?.patientName || 'Patient'} · {referral?.patientRef}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{referral?.reference} · {review.reviewer}</p>
                </div>
                <StatusBadge status={review.reviewStatus} />
              </div>
              <p className="mt-3 text-sm text-slate-700">{review.clinicalComments}</p>
              <div className="mt-3 rounded-xl bg-brand-50 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">Recommended next steps</p>
                <p className="mt-1 text-sm text-slate-700">{review.nextSteps}</p>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-slate-500">Follow-up: {review.followUp ? 'Yes' : 'No'} · {formatDateTime(review.submittedAt)}</p>
                {referral && <Button size="sm" variant="outline" onClick={() => navigate(`/app/review/${referral.id}`)}>View case</Button>}
              </div>
            </Card>
          );
        })}
        {!reviews.length && <div className="lg:col-span-2"><EmptyState icon={CheckCircle2} title="No completed reviews" description="Submitted specialist reviews will appear here." /></div>}
      </div>
    </div>
  );
}
