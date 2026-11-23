import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/constants';
import WorkerDashboard from './worker/WorkerDashboard';
import DoctorDashboard from './doctor/DoctorDashboard';
import AdminDashboard from './admin/AdminDashboard';

export default function DashboardRouter() {
  const { user } = useAuth();
  if (user?.role === ROLES.DOCTOR) return <DoctorDashboard />;
  if (user?.role === ROLES.ADMIN) return <AdminDashboard />;
  return <WorkerDashboard />;
}
