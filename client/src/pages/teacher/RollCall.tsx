import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { db, type IOfflineStudent } from '../../offline/db';
import { saveAttendanceLocally } from '../../offline/syncEngine';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  AlertTriangle,
  Save,
  Check,
  ShieldAlert,
  Search,
  Phone,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';

type StatusType = 'PRESENT' | 'ABSENT' | 'LEAVE';

interface StudentAttendanceItem {
  studentId: string;
  rollNo: string;
  studentName: string;
  fatherName?: string;
  parentPhone: string;
  status: StatusType;
  consecutiveAbsences: number;
}

const formatReadableDate = (ymd: string): string => {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return ymd;
  const dateObj = new Date(y, m - 1, d);
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const RollCall: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Date Boundaries in Pakistan Time (UTC+5): Past max 1 day (yesterday); Future max today
  const bounds = useMemo(() => {
    const pktString = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
    const [y, m, d] = pktString.split('-').map(Number);
    const today = new Date(y, m - 1, d);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const formatYMD = (dt: Date) => {
      const year = dt.getFullYear();
      const month = String(dt.getMonth() + 1).padStart(2, '0');
      const day = String(dt.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return {
      todayStr: pktString,
      yesterdayStr: formatYMD(yesterday),
      minDateStr: formatYMD(yesterday),
      maxDateStr: pktString,
    };
  }, []);

  const classIdParam = searchParams.get('classId') || '';
  const [selectedClassId, setSelectedClassId] = useState<string>(classIdParam);
  const [classes, setClasses] = useState<any[]>([]);
  const [currentClass, setCurrentClass] = useState<any>(null);
  const [date, setDate] = useState<string>(bounds.todayStr);

  const [records, setRecords] = useState<StudentAttendanceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showAllAbsentConfirm, setShowAllAbsentConfirm] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [searchFilter, setSearchFilter] = useState<string>('');
  const [showAbsentOnly, setShowAbsentOnly] = useState<boolean>(false);
  const [visibleContacts, setVisibleContacts] = useState<Record<string, boolean>>({});

  const isDateOutOfRange = !date || date < bounds.minDateStr || date > bounds.maxDateStr;

  // Warn before browser tab close/refresh when unsaved marks exist
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Load available classes
  useEffect(() => {
    const loadClasses = async () => {
      try {
        let list: any[] = [];
        if (navigator.onLine) {
          const res = await api.get('/academic/classes');
          if (res.data.success) list = res.data.classes;
        } else {
          list = await db.classes.toArray();
        }
        setClasses(list);

        if (!selectedClassId && list.length > 0) {
          setSelectedClassId(list[0]._id);
        }
      } catch {
        const local = await db.classes.toArray();
        setClasses(local);
        if (!selectedClassId && local.length > 0) {
          setSelectedClassId(local[0]._id);
        }
      }
    };
    loadClasses();
  }, []);

  // Load student list & existing session when class or date changes
  useEffect(() => {
    if (!selectedClassId) return;

    const loadRosterAndSession = async () => {
      setLoading(true);
      try {
        const cls = classes.find((c) => c._id === selectedClassId);
        setCurrentClass(cls || null);

        let studentList: IOfflineStudent[] = [];
        let existingSession: any = null;

        if (navigator.onLine) {
          try {
            const sessRes = await api.get(`/attendance/session?date=${date}&classSectionId=${selectedClassId}`);
            if (sessRes.data.session) {
              existingSession = sessRes.data.session;
            }
          } catch {
            // ignore
          }

          const stdRes = await api.get(`/students?classSectionId=${selectedClassId}&status=active`);
          if (stdRes.data.success) {
            studentList = stdRes.data.students;
          }
        } else {
          studentList = await db.students.where('classSectionId').equals(selectedClassId).toArray();
        }

        if (existingSession && existingSession.records && existingSession.records.length > 0) {
          const recordMap = new Map(existingSession.records.map((r: any) => [r.studentId, r]));
          const merged: StudentAttendanceItem[] = studentList.map((s) => {
            const existing: any = recordMap.get(s._id);
            return {
              studentId: s._id,
              rollNo: s.rollNo,
              studentName: s.fullName,
              fatherName: s.fatherName || existing?.fatherName || '',
              parentPhone: s.parentPhone,
              status: (existing?.status as StatusType) || 'PRESENT',
              consecutiveAbsences: existing?.consecutiveAbsences ?? (s.consecutiveAbsences || 0),
            };
          });
          setRecords(merged);
          setIsConfirmed(!!existingSession.isConfirmed);
        } else {
          const initial: StudentAttendanceItem[] = studentList.map((s) => ({
            studentId: s._id,
            rollNo: s.rollNo,
            studentName: s.fullName,
            fatherName: s.fatherName || '',
            parentPhone: s.parentPhone,
            status: 'PRESENT',
            consecutiveAbsences: s.consecutiveAbsences || 0,
          }));
          setRecords(initial);
          setIsConfirmed(false);
        }
        setIsDirty(false);
        setVisibleContacts({});
      } catch {
        toast.error('Could not load student roster.');
      } finally {
        setLoading(false);
      }
    };

    loadRosterAndSession();
  }, [selectedClassId, date, classes]);

  const guardUnsavedChanges = (action: () => void) => {
    if (!isDirty) {
      action();
      return;
    }
    setPendingAction(() => action);
  };

  // Row tap toggles ONLY PRESENT <-> ABSENT
  const togglePresentAbsent = (index: number) => {
    setRecords((prev) => {
      const updated = [...prev];
      const current = updated[index].status;
      const nextStatus: StatusType = current === 'ABSENT' ? 'PRESENT' : 'ABSENT';
      updated[index] = { ...updated[index], status: nextStatus };
      return updated;
    });
    setIsDirty(true);
  };

  // Explicit Leave button sets LEAVE or restores PRESENT
  const toggleLeave = (index: number) => {
    setRecords((prev) => {
      const updated = [...prev];
      const current = updated[index].status;
      const nextStatus: StatusType = current === 'LEAVE' ? 'PRESENT' : 'LEAVE';
      updated[index] = { ...updated[index], status: nextStatus };
      return updated;
    });
    setIsDirty(true);
  };

  const applyMarkAll = (status: 'PRESENT' | 'ABSENT') => {
    const previousRecords = records.map((r) => ({ ...r }));
    const previousDirty = isDirty;

    setRecords((prev) => prev.map((r) => ({ ...r, status })));
    setIsDirty(true);

    const label = status === 'PRESENT' ? 'Present' : 'Absent';
    toast(
      (t) => (
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-800">All students marked {label}</span>
          <button
            type="button"
            onClick={() => {
              setRecords(previousRecords);
              setIsDirty(previousDirty);
              toast.dismiss(t.id);
              toast.success('Previous marks restored.');
            }}
            className="px-2.5 py-1 bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-bold rounded-lg transition cursor-pointer"
          >
            Undo
          </button>
        </div>
      ),
      { duration: 6000 }
    );
  };

  const toggleContact = (studentId: string) => {
    setVisibleContacts((prev) => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  const presentCount = records.filter((r) => r.status === 'PRESENT').length;
  const absentCount = records.filter((r) => r.status === 'ABSENT').length;
  const leaveCount = records.filter((r) => r.status === 'LEAVE').length;
  const absentStudents = records.filter((r) => r.status === 'ABSENT');

  const handleSave = async (confirmNow: boolean) => {
    if (!selectedClassId || records.length === 0) return;

    if (isDateOutOfRange) {
      toast.error('Faculty Policy: You can only record attendance for yesterday or today.');
      return;
    }

    setSubmitting(true);
    const payload = {
      date,
      classSectionId: selectedClassId,
      programId: currentClass?.programId?._id || currentClass?.programId,
      academicYear: currentClass?.academicYear || '2026-2027',
      records,
      isConfirmed: confirmNow,
    };

    try {
      if (navigator.onLine) {
        const response = await api.post('/attendance/submit', payload);
        if (response.data.success) {
          setIsConfirmed(response.data.session.isConfirmed);
          setIsDirty(false);
          toast.success(response.data.message);
          setShowConfirmModal(false);
        }
      } else {
        await saveAttendanceLocally({
          idempotencyKey: `${date}_${selectedClassId}`,
          date,
          classSectionId: selectedClassId,
          programId: currentClass?.programId?._id || currentClass?.programId || '',
          academicYear: currentClass?.academicYear || '2026-2027',
          records,
          presentCount,
          absentCount,
          leaveCount,
        });
        setIsDirty(false);
        toast('Saved locally in offline mode! Will auto-sync when online.', { icon: '💾' });
        setShowConfirmModal(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving attendance.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-44 lg:pb-28">
      {/* Top Header & Back Button */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          type="button"
          onClick={() => guardUnsavedChanges(() => navigate('/teacher'))}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-indigo-900 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-xs transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>My Classes</span>
        </button>

        <div className="flex items-center gap-2">
          {isConfirmed ? (
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
              Confirmed & Finalized
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
              <Clock className="w-4 h-4" />
              Draft Mode
            </span>
          )}
        </div>
      </div>

      {/* Class & Date Selector Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="rollcall-class"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Select Class / Section
            </label>
            <select
              id="rollcall-class"
              value={selectedClassId}
              onChange={(e) => {
                const nextId = e.target.value;
                guardUnsavedChanges(() => setSelectedClassId(nextId));
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.programId?.code || 'Class'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="rollcall-date"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
              >
                Attendance Date
              </label>
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => guardUnsavedChanges(() => setDate(bounds.todayStr))}
                  className={`px-2.5 py-0.5 rounded-md font-bold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    date === bounds.todayStr
                      ? 'bg-indigo-700 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => guardUnsavedChanges(() => setDate(bounds.yesterdayStr))}
                  className={`px-2.5 py-0.5 rounded-md font-bold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    date === bounds.yesterdayStr
                      ? 'bg-indigo-700 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Yesterday
                </button>
              </div>
            </div>
            <input
              id="rollcall-date"
              type="date"
              value={date}
              min={bounds.minDateStr}
              max={bounds.maxDateStr}
              onChange={(e) => {
                const nextDate = e.target.value;
                guardUnsavedChanges(() => setDate(nextDate));
              }}
              className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus-visible:ring-2 ${
                isDateOutOfRange
                  ? 'border-rose-400 focus-visible:ring-rose-500 bg-rose-50/50'
                  : 'border-slate-200 focus-visible:ring-indigo-500'
              }`}
            />
            {isDateOutOfRange && (
              <p role="alert" className="text-xs font-semibold text-rose-700 mt-1.5">
                Date must be yesterday or today ({formatReadableDate(bounds.todayStr)}). Future or older dates require Admin.
              </p>
            )}
          </div>
        </div>

        {/* Date Policy Context Banner */}
        <div className="mt-3">
          {date === bounds.yesterdayStr ? (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Editing Yesterday&apos;s Attendance ({formatReadableDate(date)}): You can review and update this session.</span>
            </div>
          ) : date === bounds.todayStr ? (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Today&apos;s Official Roll Call ({formatReadableDate(date)}): Ready to record student presence.</span>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                Date Restricted: Faculty policy allows only yesterday and today. Older records require Admin modification.
              </span>
            </div>
          )}
        </div>

        {/* Quick Summary Pill Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="text-slate-600">Total: {records.length}</span>
            <span className="text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
              Present {presentCount} · Absent {absentCount} · Leave {leaveCount}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => applyMarkAll('PRESENT')}
              className="text-xs font-bold text-emerald-800 hover:bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              All Present
            </button>
            <button
              type="button"
              onClick={() => setShowAllAbsentConfirm(true)}
              className="text-xs font-bold text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            >
              All Absent
            </button>
          </div>
        </div>
      </div>

      {/* Student Roll Call List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="bg-white rounded-2xl p-4 border border-slate-200 animate-pulse h-16" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300">
          <p className="text-sm font-bold text-slate-700">No students enrolled in this class section.</p>
          <p className="text-xs text-slate-500 mt-1">Add students via the Admin portal to begin taking roll call.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {/* Quick Classroom Roll Search + Absent Only Filter */}
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <div className="relative flex-1">
              <label htmlFor="rollcall-search" className="sr-only">
                Find student by roll number or name
              </label>
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="rollcall-search"
                type="text"
                placeholder="Find student by roll number or name..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 shadow-xs"
              />
              {searchFilter && (
                <button
                  type="button"
                  onClick={() => setSearchFilter('')}
                  aria-label="Clear student search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowAbsentOnly((v) => !v)}
              aria-pressed={showAbsentOnly}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                showAbsentOnly
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Show absent only ({absentCount})</span>
            </button>
          </div>

          {records.map((record, index) => {
            const isMatch =
              !searchFilter ||
              record.studentName.toLowerCase().includes(searchFilter.toLowerCase()) ||
              (record.fatherName && record.fatherName.toLowerCase().includes(searchFilter.toLowerCase())) ||
              record.rollNo.toLowerCase().includes(searchFilter.toLowerCase());

            if (!isMatch) return null;
            if (showAbsentOnly && record.status !== 'ABSENT') return null;

            const isPresent = record.status === 'PRESENT';
            const isAbsent = record.status === 'ABSENT';
            const isLeave = record.status === 'LEAVE';
            const isChronicTruant = record.consecutiveAbsences >= 2;
            const contactShown = !!visibleContacts[record.studentId];

            return (
              <div
                key={record.studentId}
                role="button"
                tabIndex={0}
                onClick={() => togglePresentAbsent(index)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    togglePresentAbsent(index);
                  }
                }}
                aria-label={`${record.studentName}, Roll ${record.rollNo}, currently ${record.status}. Press Enter or Space to toggle Present or Absent.`}
                className={`p-4 rounded-2xl border transition duration-150 flex items-center justify-between gap-3 cursor-pointer select-none tap-touch shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  isAbsent
                    ? 'bg-rose-50/70 border-rose-200 hover:bg-rose-100/60'
                    : isLeave
                    ? 'bg-amber-50/70 border-amber-200 hover:bg-amber-100/60'
                    : 'bg-white border-slate-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                      isAbsent
                        ? 'bg-rose-600 text-white'
                        : isLeave
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {record.rollNo}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm leading-tight truncate">
                        {record.studentName}
                      </span>
                      {isChronicTruant && (
                        <span className="flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          {record.consecutiveAbsences} Days Absent
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1">
                      {record.fatherName && (
                        <span className="text-xs font-semibold text-indigo-700">
                          s/o {record.fatherName}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleContact(record.studentId);
                        }}
                        className="text-xs font-semibold text-slate-600 hover:text-indigo-700 inline-flex items-center gap-1 underline-offset-2 hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                      >
                        <Phone className="w-3 h-3" />
                        {contactShown ? record.parentPhone || 'No phone on file' : 'Show contact'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Status Badge & Explicit Leave Button */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLeave(index);
                    }}
                    aria-pressed={isLeave}
                    className={`px-2.5 py-1.5 rounded-xl font-bold text-xs border transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                      isLeave
                        ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-200'
                    }`}
                  >
                    Leave
                  </button>

                  {isPresent && (
                    <span className="px-3 py-1.5 rounded-xl font-bold text-xs bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      PRESENT
                    </span>
                  )}
                  {isAbsent && (
                    <span className="px-3 py-1.5 rounded-xl font-bold text-xs bg-rose-600 text-white shadow-xs flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5" />
                      ABSENT
                    </span>
                  )}
                  {isLeave && (
                    <span className="px-3 py-1.5 rounded-xl font-bold text-xs bg-amber-500 text-white shadow-xs flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      LEAVE
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sticky Bottom Action Drawer - positioned above mobile tab bar */}
      <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3 px-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-xs font-black text-slate-900">
              Present {presentCount} · Absent {absentCount} · Leave {leaveCount}
            </span>
            <span className="text-xs text-slate-600">
              {isConfirmed ? 'Attendance confirmed' : 'Tap student to toggle Present / Absent'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={submitting || isDateOutOfRange}
              className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                isDateOutOfRange
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer'
              }`}
            >
              <Save className="w-4 h-4 text-slate-600" />
              <span>Save Draft</span>
            </button>

            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              disabled={submitting || isDateOutOfRange}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center gap-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
                isDateOutOfRange
                  ? 'bg-indigo-300 text-white cursor-not-allowed'
                  : 'bg-indigo-900 hover:bg-indigo-800 text-white cursor-pointer'
              }`}
            >
              <Send className="w-4 h-4 text-indigo-200" />
              <span>Confirm & Finalize</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation & Dispatch Modal */}
      <ConfirmDialog
        open={showConfirmModal}
        title="Confirm & Finalize Attendance?"
        message={`Confirm attendance for ${currentClass?.name || 'this class'} on ${formatReadableDate(date)}.`}
        confirmLabel="Yes, Confirm & Queue Notices"
        cancelLabel="Cancel"
        loading={submitting}
        onConfirm={() => handleSave(true)}
        onCancel={() => setShowConfirmModal(false)}
      >
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-emerald-700 font-semibold">Present:</span>
            <span className="font-bold text-emerald-700">{presentCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-rose-700 font-semibold">Absent:</span>
            <span className="font-bold text-rose-700">{absentCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-amber-700 font-semibold">Leave:</span>
            <span className="font-bold text-amber-700">{leaveCount}</span>
          </div>
        </div>

        {absentCount > 0 && (
          <div className="mt-3 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-2">
            <p className="font-bold">Parents of these students will receive an absence notice:</p>
            <ul className="max-h-36 overflow-y-auto space-y-1 pl-1">
              {absentStudents.map((s) => (
                <li key={s.studentId} className="font-medium text-slate-800">
                  • Roll {s.rollNo} — {s.studentName}
                </li>
              ))}
            </ul>
          </div>
        )}
      </ConfirmDialog>

      {/* All Absent Confirmation */}
      <ConfirmDialog
        open={showAllAbsentConfirm}
        title="Mark all students absent?"
        message={`Mark all ${records.length} students absent?`}
        confirmLabel="Mark All Absent"
        cancelLabel="Cancel"
        danger
        onConfirm={() => {
          setShowAllAbsentConfirm(false);
          applyMarkAll('ABSENT');
        }}
        onCancel={() => setShowAllAbsentConfirm(false)}
      />

      {/* Unsaved Marks Navigation Guard */}
      <ConfirmDialog
        open={!!pendingAction}
        title="Discard unsaved marks?"
        message="You have unsaved marks. Discard them?"
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        danger
        onConfirm={() => {
          const act = pendingAction;
          setPendingAction(null);
          setIsDirty(false);
          if (act) act();
        }}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
};
