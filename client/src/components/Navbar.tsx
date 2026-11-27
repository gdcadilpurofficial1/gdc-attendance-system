import React, { useState, useEffect } from 'react';
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
  Settings,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  if (!user) return null;

  const isActive = (path: string) => location.pathname === path;

  const initials = user.fullName
    ? user.fullName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0].toUpperCase())
        .join('')
    : 'U';

  const isMoreActive =
    isActive('/admin/teachers') ||
    isActive('/admin/reports') ||
    isActive('/admin/settings');

  const adminNavItems = [
    { to: '/admin', label: 'Overview', drawerLabel: 'Overview Dashboard', icon: LayoutDashboard, activeIconColor: 'text-indigo-600' },
    { to: '/admin/students', label: 'Students', drawerLabel: 'Student Management', icon: Users, activeIconColor: 'text-slate-500' },
    { to: '/admin/academic', label: 'Classes', drawerLabel: 'Classes & Sections', icon: GraduationCap, activeIconColor: 'text-slate-500' },
    { to: '/admin/teachers', label: 'Teachers', drawerLabel: 'Faculty & Incharges', icon: UserCheck, activeIconColor: 'text-slate-500' },
    { to: '/admin/messaging', label: 'Messaging', drawerLabel: 'Messaging Hub & WhatsApp', icon: Send, activeIconColor: 'text-slate-500' },
    { to: '/admin/reports', label: 'Reports', drawerLabel: 'Attendance Reports & Excel', icon: FileSpreadsheet, activeIconColor: 'text-slate-500' },
    { to: '/admin/settings', label: 'Settings', drawerLabel: 'Settings & Password', icon: Settings, activeIconColor: 'text-slate-500' },
  ];

  const teacherNavItems = [
    { to: '/teacher', label: 'My Classes', drawerLabel: 'My Assigned Classes', icon: LayoutDashboard, activeIconColor: 'text-indigo-600' },
    { to: '/teacher/roll-call', label: 'Mark Attendance', drawerLabel: 'Mark Daily Roll Call', icon: ClipboardCheck, activeIconColor: 'text-emerald-600' },
    { to: '/teacher/stats', label: 'Student Stats', drawerLabel: 'Student Attendance Stats', icon: Users, activeIconColor: 'text-indigo-600' },
  ];

  const navItems = isAdmin ? adminNavItems : teacherNavItems;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Title */}
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="flex items-center gap-2.5 group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <img
                  src="/logo.png"
                  alt="GDC Adilpur Logo"
                  className="w-9 h-9 sm:w-10 sm:h-10 object-contain drop-shadow-xs group-hover:scale-105 transition duration-200"
                />
                <div className="flex flex-col">
                  <span className="font-extrabold text-slate-900 text-xs sm:text-sm tracking-tight leading-tight">
                    Govt Degree College Adilpur
                  </span>
                  <span className="text-xs text-indigo-700 font-bold uppercase tracking-wider">
                    Attendance Portal
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav aria-label="Primary Navigation" className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    aria-current={active ? 'page' : undefined}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                      active
                        ? 'bg-indigo-50 text-indigo-900 font-bold shadow-xs border border-indigo-100'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${item.activeIconColor}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right Status Pill & User Menu */}
            <div className="flex items-center gap-2 sm:gap-3">
              <NetworkStatusPill />

              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
                <div
                  className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white font-bold text-xs flex items-center justify-center shadow-xs select-none"
                  title={user.fullName}
                >
                  {initials}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[120px]">
                    {user.fullName}
                  </span>
                  <span className="text-xs text-slate-500 font-medium capitalize">
                    {user.role} {user.department ? `• ${user.department}` : ''}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                aria-label="Log out of account"
                title="Logout from session"
                className="hidden sm:flex p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <LogOut className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-label="Toggle navigation menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Over Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                  {initials}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 truncate max-w-[160px]">{user.fullName}</h3>
                  <span className="text-xs text-indigo-700 font-semibold capitalize flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    {user.role} {user.department ? `(${user.department})` : ''}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 px-3 pb-1 block">
                Menu Navigation
              </span>

              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                      active ? 'bg-indigo-50 text-indigo-900 font-bold' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${item.activeIconColor}`} />
                      {item.drawerLabel}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </Link>
                );
              })}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
              <button
                type="button"
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                <LogOut className="w-4 h-4" />
                Sign Out of Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1"
      >
        <div className="grid grid-cols-5 h-14 max-w-md mx-auto items-center text-center">
          {isAdmin ? (
            <>
              {[
                { to: '/admin', label: 'Overview', icon: LayoutDashboard },
                { to: '/admin/students', label: 'Students', icon: Users },
                { to: '/admin/academic', label: 'Classes', icon: GraduationCap },
                { to: '/admin/messaging', label: 'Messaging', icon: Send },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = isActive(tab.to);
                return (
                  <Link
                    key={tab.to}
                    to={tab.to}
                    aria-current={active ? 'page' : undefined}
                    className={`flex flex-col items-center justify-center py-1 transition relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg ${
                      active ? 'text-indigo-700' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className={`text-xs leading-tight font-medium ${active ? 'font-bold' : ''}`}>
                      {tab.label}
                    </span>
                    {active && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 absolute bottom-0" />}
                  </Link>
                );
              })}

              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open more navigation options"
                className={`flex flex-col items-center justify-center py-1 transition relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg ${
                  isMoreActive || mobileMenuOpen ? 'text-indigo-700' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Menu className="w-5 h-5" />
                <span className={`text-xs leading-tight font-medium ${isMoreActive ? 'font-bold' : ''}`}>
                  More
                </span>
                {isMoreActive && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 absolute bottom-0" />}
              </button>
            </>
          ) : (
            <div className="col-span-5 grid grid-cols-3">
              {[
                { to: '/teacher', label: 'My Classes', icon: LayoutDashboard, activeColor: 'text-indigo-700', dotColor: 'bg-indigo-600' },
                { to: '/teacher/roll-call', label: 'Attendance', icon: ClipboardCheck, activeColor: 'text-emerald-700', dotColor: 'bg-emerald-600' },
                { to: '/teacher/stats', label: 'Stats', icon: Users, activeColor: 'text-indigo-700', dotColor: 'bg-indigo-600' },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = isActive(tab.to);
                return (
                  <Link
                    key={tab.to}
                    to={tab.to}
                    aria-current={active ? 'page' : undefined}
                    className={`flex flex-col items-center justify-center py-1 transition relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg ${
                      active ? tab.activeColor : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className={`text-xs leading-tight font-medium ${active ? 'font-bold' : ''}`}>
                      {tab.label}
                    </span>
                    {active && <span className={`w-1.5 h-1.5 rounded-full ${tab.dotColor} absolute bottom-0`} />}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>
    </>
  );
};
