import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/constants';
import DoctorReviewPage from './worker/DoctorReviewPage';
import IncomingReferralsPage from './doctor/IncomingReferralsPage';

export default function ReviewHubPage() {
  const { user } = useAuth();
  return user?.role === ROLES.DOCTOR ? <IncomingReferralsPage /> : <DoctorReviewPage />;
}
