import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { FileSpreadsheet, Download, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const getPktDateString = (daysOffset = 0): string => {
  const pktToday = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
  const [y, m, d] = pktToday.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + daysOffset);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};

export const ReportsExport: React.FC = () => {
  const [programs, setPrograms] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  const [programId, setProgramId] = useState<string>('');
  const [classSectionId, setClassSectionId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(() => getPktDateString(-30));
  const [endDate, setEndDate] = useState<string>(() => getPktDateString(0));
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [downloading, setDownloading] = useState<boolean>(false);

  const isRangeInvalid = Boolean(startDate && endDate && startDate > endDate);

  useEffect(() => {
    loadFilters();
  }, []);

  const loadFilters = async () => {
    try {
      const [pRes, cRes] = await Promise.all([api.get('/academic/programs'), api.get('/academic/classes')]);
      if (pRes.data.success) setPrograms(pRes.data.programs);
      if (cRes.data.success) setClasses(cRes.data.classes);
    } catch {
      // ignore
    }
  };

  const handleDownload = async () => {
    if (isRangeInvalid) {
      toast.error('From Date must be on or before To Date.');
      return;
    }

    setDownloading(true);
    try {
      const params: Record<string, string> = { startDate, endDate };
      if (programId) params.programId = programId;
      if (classSectionId) params.classSectionId = classSectionId;
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const response = await api.get('/reports/export-excel', {
        params,
        responseType: 'blob',
      });

      const contentType = response.headers['content-type'] || '';
      if (contentType.includes('application/json') || contentType.includes('text/html')) {
        const text = await (response.data as Blob).text();
        try {
          const parsed = JSON.parse(text);
          toast.error(parsed.message || 'No records in this range.');
        } catch {
          toast.error('No records in this range.');
        }
        return;
      }

      if ((response.data as Blob).size === 0) {
        toast.error('No records in this range.');
        return;
      }

      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `gdc-attendance-${startDate}-to-${endDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
      toast.success('Excel attendance sheet downloaded.');
    } catch (err: any) {
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          toast.error(parsed.message || 'No records in this range.');
          return;
        } catch {
          // fall through
        }
      }
      toast.error(err.response?.data?.message || 'Failed to download Excel report.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Reports & Data Archiving</h1>
        <p className="text-xs text-slate-500 mt-1">
          Export official Sindh Education Department attendance sheets and manage 2-year retention.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Excel Export Generator */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2 mb-4">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <span>Custom Attendance Sheet Generator</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="report-start-date" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  From Date
                </label>
                <input
                  id="report-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="report-end-date" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  To Date
                </label>
                <input
                  id="report-end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                />
              </div>
            </div>

            {isRangeInvalid && (
              <div
                role="alert"
                className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>&ldquo;From Date&rdquo; must be on or before &ldquo;To Date&rdquo;.</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div>
                <label htmlFor="report-program" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Program
                </label>
                <select
                  id="report-program"
                  value={programId}
                  onChange={(e) => setProgramId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <option value="">All Programs</option>
                  {programs.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="report-class" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Class
                </label>
                <select
                  id="report-class"
                  value={classSectionId}
                  onChange={(e) => setClassSectionId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <option value="">All Classes</option>
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="report-status" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Attendance Status
                </label>
                <select
                  id="report-status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <option value="ALL">All Records</option>
                  <option value="PRESENT">Present Only</option>
                  <option value="ABSENT">Absentees Only</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-500">Formatted in standard .xlsx spreadsheet format</span>

              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading || isRangeInvalid}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                <Download className="w-4 h-4" />
                <span>{downloading ? 'Downloading…' : 'Download Excel Sheet'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: 2-Year Auto Retention & Pruning */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2 text-indigo-900 font-black text-sm mb-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <span>2-Year Rolling Retention</span>
              </div>
              <h3 className="text-base font-black text-slate-900 mb-2">Database Cleanliness Policy</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                To guarantee Database remains well forever, attendance logs
                older than <strong>730 days (2 years)</strong> are automatically pruned every month.
              </p>

              <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1">
                <p>• Student term total percentages are permanently kept.</p>
                <p>• Scheduled monthly on 1st at 3:00 AM PKT.</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-800 bg-emerald-50/80 px-4 py-3 rounded-2xl border border-emerald-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Autonomous Engine Active</span>
              </div>
              <span className="text-xs text-emerald-600 font-semibold">Zero Action Needed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
