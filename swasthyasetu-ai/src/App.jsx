import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { I18nProvider } from './context/I18nContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardRouter from './pages/DashboardRouter';
import NewPatientPage from './pages/worker/NewPatientPage';
import ConsultationPage from './pages/worker/ConsultationPage';
import AssessmentPage from './pages/worker/AssessmentPage';
import PatientsPage from './pages/worker/PatientsPage';
import PatientDetailPage from './pages/worker/PatientDetailPage';
import ReferralsPage from './pages/worker/ReferralsPage';
import ReferralDetailPage from './pages/worker/ReferralDetailPage';
import SyncCenterPage from './pages/worker/SyncCenterPage';
import ReviewHubPage from './pages/ReviewHubPage';
import DoctorReferralReviewPage from './pages/doctor/DoctorReferralReviewPage';
import CompletedReviewsPage from './pages/doctor/CompletedReviewsPage';
import SettingsPage from './pages/SettingsPage';
import UserManagement from './pages/admin/UserManagement';
import HealthCentres from './pages/admin/HealthCentres';
import Permissions from './pages/admin/Permissions';
import ClinicalRules from './pages/admin/ClinicalRules';
import AuditLog from './pages/admin/AuditLog';
import SyncMonitoring from './pages/admin/SyncMonitoring';
import NotFound from './pages/NotFound';

function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <AppLayout /> : <Navigate to="/login" replace />;
}

function LoginRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/app/overview" replace /> : <LoginPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <I18nProvider>
        <ToastProvider>
          <AuthProvider>
            <AppProvider>
              <Routes>
                <Route path="/" element={<Navigate to="/app/overview" replace />} />
                <Route path="/login" element={<LoginRoute />} />
                <Route element={<ProtectedRoute />}>
                  <Route path="/app/overview" element={<DashboardRouter />} />
                  <Route path="/app/patients" element={<PatientsPage />} />
                  <Route path="/app/patients/new" element={<NewPatientPage />} />
                  <Route path="/app/consultation/new" element={<ConsultationPage />} />
                  <Route path="/app/assessment" element={<AssessmentPage />} />
                  <Route path="/app/patients/:patientRef" element={<PatientDetailPage />} />
                  <Route path="/app/referrals" element={<ReferralsPage />} />
                  <Route path="/app/referrals/:id" element={<ReferralDetailPage />} />
                  <Route path="/app/review" element={<ReviewHubPage />} />
                  <Route path="/app/review/:id" element={<DoctorReferralReviewPage />} />
                  <Route path="/app/completed" element={<CompletedReviewsPage />} />
                  <Route path="/app/sync" element={<SyncCenterPage />} />
                  <Route path="/app/settings" element={<SettingsPage />} />
                  <Route path="/app/admin/users" element={<UserManagement />} />
                  <Route path="/app/admin/centres" element={<HealthCentres />} />
                  <Route path="/app/admin/permissions" element={<Permissions />} />
                  <Route path="/app/admin/rules" element={<ClinicalRules />} />
                  <Route path="/app/admin/audit" element={<AuditLog />} />
                  <Route path="/app/admin/sync" element={<SyncMonitoring />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppProvider>
          </AuthProvider>
        </ToastProvider>
      </I18nProvider>
    </BrowserRouter>
  );
}
