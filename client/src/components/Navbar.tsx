import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NetworkStatusPill } from './NetworkStatusPill';
import {
  Users,
  GraduationCap,
  ClipboardCheck,
  Send,
  FileSpreadsheet,
  LogOut,
  UserCheck,
  LayoutDashboard,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <img
                src="/logo.png"
                alt="GDC Adilpur Logo"
                className="w-10 h-10 object-contain drop-shadow-xs group-hover:scale-105 transition"
              />
              <div className="flex flex-col">
                <span className="font-black text-slate-900 text-sm tracking-tight leading-tight">
                  Govt Degree College Adilpur
                </span>
                <span className="text-[11px] text-indigo-700 font-semibold">Attendance Portal</span>
              </div>
            </Link>
          </div>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center gap-1">
            {isAdmin ? (
              <>
                <Link
                  to="/admin"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    isActive('/admin')
                      ? 'bg-indigo-50 text-indigo-900 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-indigo-600" />
                  Overview
                </Link>
                <Link
                  to="/admin/students"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    isActive('/admin/students')
                      ? 'bg-indigo-50 text-indigo-900 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-4 h-4 text-slate-500" />
                  Students
                </Link>
                <Link
                  to="/admin/academic"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    isActive('/admin/academic')
                      ? 'bg-indigo-50 text-indigo-900 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-slate-500" />
                  Classes & Programs
                </Link>
                <Link
                  to="/admin/teachers"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    isActive('/admin/teachers')
                      ? 'bg-indigo-50 text-indigo-900 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-slate-500" />
                  Teachers
                </Link>
                <Link
                  to="/admin/messaging"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    isActive('/admin/messaging')
                      ? 'bg-indigo-50 text-indigo-900 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Send className="w-4 h-4 text-slate-500" />
                  Messaging Hub
                </Link>
                <Link
                  to="/admin/reports"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    isActive('/admin/reports')
                      ? 'bg-indigo-50 text-indigo-900 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4 text-slate-500" />
                  Reports & Export
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/teacher"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    isActive('/teacher')
                      ? 'bg-indigo-50 text-indigo-900 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-indigo-600" />
                  My Classes
                </Link>
                <Link
                  to="/teacher/roll-call"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    isActive('/teacher/roll-call')
                      ? 'bg-indigo-50 text-indigo-900 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <ClipboardCheck className="w-4 h-4 text-emerald-600" />
                  Mark Attendance
                </Link>
                <Link
                  to="/teacher/stats"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    isActive('/teacher/stats')
                      ? 'bg-indigo-50 text-indigo-900 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-4 h-4 text-indigo-600" />
                  Student Stats
                </Link>
              </>
            )}
          </nav>

          {/* Right Status Pill & User Menu */}
          <div className="flex items-center gap-3">
            <NetworkStatusPill />

            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-900 leading-tight">{user.fullName}</span>
              <span className="text-[10px] text-slate-500 font-medium capitalize">
                {user.role} • {user.department || 'Staff'}
              </span>
            </div>

            <button
              onClick={logout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sub-Nav for quick tabs */}
      <div className="md:hidden flex items-center justify-around bg-slate-50 border-t border-slate-200 px-2 py-2 overflow-x-auto text-[11px] font-semibold text-slate-600">
        {isAdmin ? (
          <>
            <Link to="/admin" className={isActive('/admin') ? 'text-indigo-900 font-bold' : ''}>
              Overview
            </Link>
            <Link to="/admin/students" className={isActive('/admin/students') ? 'text-indigo-900 font-bold' : ''}>
              Students
            </Link>
            <Link to="/admin/academic" className={isActive('/admin/academic') ? 'text-indigo-900 font-bold' : ''}>
              Classes
            </Link>
            <Link to="/admin/teachers" className={isActive('/admin/teachers') ? 'text-indigo-900 font-bold' : ''}>
              Teachers
            </Link>
            <Link to="/admin/messaging" className={isActive('/admin/messaging') ? 'text-indigo-900 font-bold' : ''}>
              Messaging
            </Link>
            <Link to="/admin/reports" className={isActive('/admin/reports') ? 'text-indigo-900 font-bold' : ''}>
              Reports
            </Link>
          </>
        ) : (
          <>
            <Link to="/teacher" className={isActive('/teacher') ? 'text-indigo-900 font-bold' : ''}>
              My Classes
            </Link>
            <Link to="/teacher/roll-call" className={isActive('/teacher/roll-call') ? 'text-indigo-900 font-bold' : ''}>
              Mark Roll Call
            </Link>
            <Link to="/teacher/stats" className={isActive('/teacher/stats') ? 'text-indigo-900 font-bold' : ''}>
              Student Stats
            </Link>
          </>
        )}
      </div>
    </header>
  );
};
