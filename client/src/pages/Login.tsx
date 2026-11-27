import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('gdc_remember_user');
    if (saved) {
      setUsername(saved);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim()) {
      setErrorMsg('Please enter your username.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    if (rememberMe) {
      localStorage.setItem('gdc_remember_user', username.trim());
    } else {
      localStorage.removeItem('gdc_remember_user');
    }

    setLoading(true);
    try {
      const success = await login(username.trim(), password);
      if (success) {
        toast.success('Signed in to GDC Adilpur Attendance Portal.');
        const savedUser = JSON.parse(localStorage.getItem('gdc_auth_user') || '{}');
        if (savedUser.role === 'teacher') {
          navigate('/teacher');
        } else {
          navigate('/admin');
        }
      } else {
        setErrorMsg('Username or password is incorrect.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Username or password is incorrect.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 sm:p-10">
        {/* Header with College Logo */}
        <div className="flex flex-col items-center text-center mb-8">
          <img
            src="/logo.png"
            alt="Govt Degree College Adilpur Logo"
            className="w-20 h-20 object-contain drop-shadow-md mb-3"
          />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">GDC Adilpur</h1>
          <p className="text-xs font-bold text-indigo-700 uppercase tracking-widest mt-0.5">
            Attendance Portal
          </p>
          <p className="text-xs font-semibold text-slate-600 mt-1">
            For teachers, admin and principal
          </p>
          <span className="text-sm text-slate-600 mt-2 leading-relaxed">
            Official portal for daily student roll calls, parent notices, and academic attendance records.
          </span>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label
              htmlFor="login-username"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Username <span className="text-rose-600" aria-hidden="true">*</span>
            </label>
            <div className="relative">
              <User className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="e.g. tariq_science"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                required
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-500 focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Password <span className="text-rose-600" aria-hidden="true">*</span>
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-500 focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-800 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Remember Username Checkbox */}
          <div className="pt-1 space-y-1">
            <label htmlFor="login-remember" className="flex items-center gap-2 cursor-pointer select-none">
              <input
                id="login-remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 border-slate-300"
              />
              <span className="text-xs font-semibold text-slate-700">Remember my username</span>
            </label>
            <p className="text-xs text-slate-500 pl-6">
              You stay signed in for 1 day on this device.
            </p>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm font-medium"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-indigo-900/30 transition duration-200 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Signing in…</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Log In to Portal</span>
              </>
            )}
          </button>

          <p className="text-xs text-slate-500 text-center pt-1">
            Forgot password? Contact the college admin office.
          </p>
        </form>

        {/* Security Notice */}
        <div className="mt-7 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-500 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Role-Based Access Protected</span>
        </div>
      </div>

      <footer className="mt-8 text-center text-xs text-slate-300">
        © 2026 Government Degree College Adilpur, District Ghotki, Sindh.
      </footer>
    </div>
  );
};
