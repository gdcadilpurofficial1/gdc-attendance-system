import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Toaster } from 'react-hot-toast';

// High-performance code-splitting: Pages loaded on demand
const TeacherDashboard = lazy(() =>
  import('./pages/teacher/TeacherDashboard').then((m) => ({ default: m.TeacherDashboard }))
);
const RollCall = lazy(() =>
  import('./pages/teacher/RollCall').then((m) => ({ default: m.RollCall }))
);
const ClassStudentStats = lazy(() =>
  import('./pages/teacher/ClassStudentStats').then((m) => ({ default: m.ClassStudentStats }))
);
const AdminDashboard = lazy(() =>
  import('./pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);
const StudentManager = lazy(() =>
  import('./pages/admin/StudentManager').then((m) => ({ default: m.StudentManager }))
);
const AcademicManager = lazy(() =>
  import('./pages/admin/AcademicManager').then((m) => ({ default: m.AcademicManager }))
);
const TeacherManager = lazy(() =>
  import('./pages/admin/TeacherManager').then((m) => ({ default: m.TeacherManager }))
);
const MessagingHub = lazy(() =>
  import('./pages/admin/MessagingHub').then((m) => ({ default: m.MessagingHub }))
);
const ReportsExport = lazy(() =>
  import('./pages/admin/ReportsExport').then((m) => ({ default: m.ReportsExport }))
);
const AdminSettings = lazy(() =>
  import('./pages/admin/AdminSettings').then((m) => ({ default: m.AdminSettings }))
);

const PageLoader: React.FC = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center">
    <div className="w-9 h-9 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    <span className="mt-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Loading GDC Portal...</span>
  </div>
);

const NotFound: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  const targetPath = user ? (user.role === 'teacher' ? '/teacher' : '/admin') : '/login';
  const buttonLabel = user ? 'Go to my dashboard' : 'Go to login';

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-700 mb-2">404</p>
        <h1 className="text-2xl font-black text-slate-900">Page not found</h1>
        <p className="text-sm text-slate-600 mt-2">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          to={targetPath}
          className="inline-flex items-center justify-center mt-6 px-5 py-3 bg-indigo-900 hover:bg-indigo-800 text-white text-sm font-bold rounded-xl shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          {buttonLabel}
        </Link>
      </div>
    </div>
  );
};

// Smart Home Redirector based on user role
const HomeRedirect: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'teacher') return <Navigate to="/teacher" replace />;
  return <Navigate to="/admin" replace />;
};

export const AppContent: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 pb-20 lg:pb-0">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<HomeRedirect />} />

              {/* Teacher Routes */}
              <Route path="/teacher" element={<TeacherDashboard />} />
              <Route path="/teacher/roll-call" element={<RollCall />} />
              <Route path="/teacher/stats" element={<ClassStudentStats />} />
            </Route>

            {/* Admin & Principal Guarded Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'principal']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/students" element={<StudentManager />} />
              <Route path="/admin/academic" element={<AcademicManager />} />
              <Route path="/admin/teachers" element={<TeacherManager />} />
              <Route path="/admin/messaging" element={<MessagingHub />} />
              <Route path="/admin/reports" element={<ReportsExport />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      <Toaster
        position="top-right"
        toastOptions={{
          className: 'text-xs font-semibold rounded-2xl shadow-lg border border-slate-100',
          duration: 3500,
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
