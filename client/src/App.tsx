import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { RollCall } from './pages/teacher/RollCall';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { StudentManager } from './pages/admin/StudentManager';
import { AcademicManager } from './pages/admin/AcademicManager';
import { TeacherManager } from './pages/admin/TeacherManager';
import { MessagingHub } from './pages/admin/MessagingHub';
import { ReportsExport } from './pages/admin/ReportsExport';
import { Toaster } from 'react-hot-toast';

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
      <main className="flex-1">
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<HomeRedirect />} />

            {/* Teacher Routes */}
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/teacher/roll-call" element={<RollCall />} />
          </Route>

          {/* Admin & Principal Guarded Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'principal']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/students" element={<StudentManager />} />
            <Route path="/admin/academic" element={<AcademicManager />} />
            <Route path="/admin/teachers" element={<TeacherManager />} />
            <Route path="/admin/messaging" element={<MessagingHub />} />
            <Route path="/admin/reports" element={<ReportsExport />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<HomeRedirect />} />
        </Routes>
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
