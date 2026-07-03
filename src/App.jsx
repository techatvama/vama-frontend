import React from 'react';
import { NotificationProvider } from './context/NotificationContext';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { AppDataProvider } from './context/AppDataContext';
import AdminLogin from './components/admin/AdminLogin';
import NotificationsPage from './components/admin/NotificationsPage';
import SettingsPage from './components/admin/SettingsPage';
import ReportsPage from './components/admin/ReportsPage';
import Dashboard from './components/Dashboard';
import { BrowserRouter, Route, Routes } from 'react-router';
import Sidebar from './components/Sidebar';
import AllStaff from './components/AllStaff';
import StudentProgressEditor from './components/StudentProgressEditor';
import Scheduler from './components/scheduling/Scheduler';

// Teacher Portal Imports
import TeacherLogin from './components/teacher/TeacherLogin';
import TeacherPortal from './components/teacher/TeacherPortal';
import TeacherDashboard from './components/teacher/TeacherDashboard';
import TeacherCalendar from './components/teacher/TeacherCalendar';
import TeacherStudents from './components/teacher/TeacherStudents';
import TeacherSessionDetails from './components/teacher/TeacherSessionDetails';
import TeacherStudentDetail from './components/teacher/TeacherStudentDetail';
import MaterialUpload from './components/teacher/MaterialUpload';

// Student Portal Imports
import StudentLogin from './components/student/StudentLogin';
import StudentPortal from './components/student/StudentPortal';
import StudentDashboard from './components/student/StudentDashboard';
import StudentSchedule from './components/student/StudentSchedule';
import StudentProgress from './components/student/StudentProgress';
import StudentMaterials from './components/student/StudentMaterials';
import StudentPayments from './components/student/StudentPayments';
import StudentReschedule from './components/student/StudentReschedule';
import StudentAttendance from './components/student/StudentAttendance';

import EnrollmentManager from './components/admin/EnrollmentManager';
import InvoiceCreator from './components/admin/InvoiceCreator';
import BillingSettings from './components/admin/BillingSettings';
import DashboardAlerts from './components/admin/DashboardAlerts';
import PublicInvoicePay from './components/PublicInvoicePay';
import PublicStudentForm from './components/PublicStudentForm';

// Admin Curriculum Management Imports
import CurriculumDashboard from './components/admin/CurriculumDashboard';
import SubjectManager from './components/admin/SubjectManager';
import GradeManager from './components/admin/GradeManager';
import ExamSessionManager from './components/admin/ExamSessionManager';
import SyllabusBuilder from './components/admin/SyllabusBuilder';
import PaymentManager from './components/admin/PaymentManager';
import PaymentAnalytics from './components/admin/PaymentAnalytics';
import PaymentDashboard from './components/admin/PaymentDashboard';
import PackageManager from './components/admin/PackageManager';
import InvoiceManager from './components/admin/InvoiceManager';
import SubscriptionManager from './components/admin/SubscriptionManagerV2';
import PaymentHistory from './components/admin/PaymentHistory';
import FormManager from './components/admin/FormManager';

// Auth flows (activation / password reset)
import ActivateAccount from './components/auth/ActivateAccount';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';

// Admin Dashboard
import AdminDashboard from './components/admin/AdminDashboard';
import SuperAdminDashboard from './components/admin/SuperAdminDashboard';
import StudentProfilePage from './components/admin/StudentProfilePage';
import StaffProfilePage from './components/admin/StaffProfilePage';

// Dashboard wrapper that conditionally renders SuperAdmin or Center Admin dashboard
function DashboardWrapper() {
  const { isSuperAdmin } = useAdmin();
  return isSuperAdmin ? <SuperAdminDashboard /> : <AdminDashboard />;
}

export default function App() {
  return (
    <AppDataProvider>
    <AdminProvider>
    <NotificationProvider>
    <BrowserRouter>
      <Routes>
        {/* Admin Login (public) */}
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* Public invoice payment (Razorpay) */}
        <Route path="/pay/:id" element={<PublicInvoicePay />} />

        {/* Public enrollment / intake form */}
        <Route path="/apply" element={<PublicStudentForm />} />

        {/* Auth flows (public) */}
        <Route path="/activate" element={<ActivateAccount />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Admin/Internal Routes */}
        <Route path="/" element={<Sidebar />}>
          <Route index element={<DashboardWrapper />} />
          <Route path="/teacher" element={<AllStaff />} />
          <Route path="/teacher/add" element={<AllStaff />} />
          <Route path="/teacher/:staffId" element={<StaffProfilePage />} />
          <Route path="/students" element={<Dashboard />} />
          <Route path="/students/add" element={<Dashboard />} />
          <Route path="/students/progress" element={<StudentProgressEditor />} />
          <Route path="/students/enrollments" element={<EnrollmentManager />} />
          <Route path="/students/forms" element={<FormManager />} />
          <Route path="/students/:studentId" element={<StudentProfilePage />} />
          <Route path="/schedule" element={<Scheduler />} />

          {/* Admin Curriculum Management */}
          <Route path="/admin/curriculum" element={<CurriculumDashboard />} />
          <Route path="/admin/subjects" element={<SubjectManager />} />
          <Route path="/admin/grades" element={<GradeManager />} />
          <Route path="/admin/exams" element={<ExamSessionManager />} />
          <Route path="/admin/syllabus" element={<SyllabusBuilder />} />
          <Route path="/admin/payments" element={<PaymentDashboard />} />
          <Route path="/admin/payments/legacy" element={<PaymentManager />} />
          <Route path="/admin/analytics" element={<PaymentAnalytics />} />
          <Route path="/admin/packages" element={<PackageManager />} />
          <Route path="/admin/invoices" element={<InvoiceManager />} />
          <Route path="/admin/invoices/new" element={<InvoiceCreator />} />
          <Route path="/admin/billing-settings" element={<BillingSettings />} />
          <Route path="/admin/alerts" element={<DashboardAlerts />} />
          <Route path="/admin/subscriptions" element={<SubscriptionManager />} />
          <Route path="/admin/payments/history" element={<PaymentHistory />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/:section" element={<SettingsPage />} />
        </Route>

        {/* Teacher Portal Routes */}
        <Route path="/teacher-login" element={<TeacherLogin />} />
        <Route path="/teacher-portal" element={<TeacherPortal />}>
          <Route index element={<TeacherDashboard />} />
          <Route path="calendar" element={<TeacherCalendar />} />
          <Route path="session/:sessionId" element={<TeacherSessionDetails />} />
          <Route path="students" element={<TeacherStudents />} />
          <Route path="students/:studentId" element={<TeacherStudentDetail />} />
          <Route path="materials" element={<MaterialUpload />} />
        </Route>

        {/* Student Portal Routes */}
        <Route path="/student-login" element={<StudentLogin />} />
        <Route path="/student-portal" element={<StudentPortal />}>
          <Route index element={<StudentDashboard />} />
          <Route path="schedule" element={<StudentSchedule />} />
          <Route path="reschedule/:sessionId" element={<StudentReschedule />} />
          <Route path="attendance" element={<StudentAttendance />} />
          <Route path="progress" element={<StudentProgress />} />
          <Route path="materials" element={<StudentMaterials />} />
          <Route path="payments" element={<StudentPayments />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </NotificationProvider>
    </AdminProvider>
    </AppDataProvider>
  )
}
