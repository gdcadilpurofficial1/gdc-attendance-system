import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Plus, Trash2, BookOpen, Layers } from 'lucide-react';
import toast from 'react-hot-toast';

export const AcademicManager: React.FC = () => {
  const [programs, setPrograms] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  // Program Modal
  const [showProgramModal, setShowProgramModal] = useState<boolean>(false);
  const [programForm, setProgramForm] = useState({ name: '', code: '', level: 'Intermediate', durationYears: 2 });

  // Class Modal
  const [showClassModal, setShowClassModal] = useState<boolean>(false);
  const [classForm, setClassForm] = useState({
    name: '',
    programId: '',
    yearLevel: '1st Year (XI)',
    section: 'A',
    shift: 'Morning',
    inchargeTeacherId: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [progRes, clsRes, userRes] = await Promise.all([
        api.get('/academic/programs'),
        api.get('/academic/classes'),
        api.get('/auth/users'),
      ]);

      if (progRes.data.success) {
        setPrograms(progRes.data.programs);
        if (progRes.data.programs.length > 0 && !classForm.programId) {
          setClassForm((prev) => ({ ...prev, programId: progRes.data.programs[0]._id }));
        }
      }
      if (clsRes.data.success) setClasses(clsRes.data.classes);
      if (userRes.data.success) {
        const teacherUsers = userRes.data.users.filter((u: any) => u.role === 'teacher');
        setTeachers(teacherUsers);
      }
    } catch {
      toast.error('Failed to load academic data.');
    }
  };

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/academic/programs', programForm);
      if (res.data.success) {
        toast.success('Program created successfully.');
        setShowProgramModal(false);
        setProgramForm({ name: '', code: '', level: 'Intermediate', durationYears: 2 });
        loadData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create program.');
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/academic/classes', classForm);
      if (res.data.success) {
        toast.success('Class Section created successfully.');
        setShowClassModal(false);
        setClassForm({
          name: '',
          programId: programs[0]?._id || '',
          yearLevel: '1st Year (XI)',
          section: 'A',
          shift: 'Morning',
          inchargeTeacherId: '',
        });
        loadData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create class section.');
    }
  };

  const handleDeleteClass = async (id: string, name: string) => {
    if (!window.confirm(`Delete class section "${name}"?`)) return;
    try {
      const res = await api.delete(`/academic/classes/${id}`);
      if (res.data.success) {
        toast.success('Class section deleted.');
        loadData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Delete failed.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Classes & Academic Programs</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage Intermediate disciplines, 4-Year BS degrees, and classroom sections.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowProgramModal(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Program</span>
          </button>

          <button
            onClick={() => setShowClassModal(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Class Section</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Programs List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-slate-900 text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>Programs ({programs.length})</span>
              </h2>
            </div>

            <div className="space-y-3">
              {programs.map((prog) => (
                <div key={prog._id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-indigo-900 bg-indigo-100/70 px-2 py-0.5 rounded">
                      {prog.code}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">{prog.level}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 mt-2">{prog.name}</h3>
                  <span className="text-[11px] text-slate-400">{prog.durationYears} Years Duration</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Class Sections */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Active Class Sections ({classes.length})</span>
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Class Name</th>
                    <th className="py-3 px-4">Program</th>
                    <th className="py-3 px-4">Year / Level</th>
                    <th className="py-3 px-4">Section</th>
                    <th className="py-3 px-4">In-Charge Teacher</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {classes.map((cls) => (
                    <tr key={cls._id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{cls.name}</td>
                      <td className="py-3.5 px-4">{cls.programId?.code || '—'}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">{cls.yearLevel}</td>
                      <td className="py-3.5 px-4 font-black text-indigo-900">{cls.section}</td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {cls.inchargeTeacherId?.fullName || <span className="text-slate-400 italic">Not Assigned</span>}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteClass(cls._id, cls.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                          title="Delete Class Section"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Program Modal */}
      {showProgramModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Add Academic Program</h3>
            <form onSubmit={handleCreateProgram} className="space-y-4 mt-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Program Name *</label>
                <input
                  type="text"
                  value={programForm.name}
                  onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })}
                  placeholder="e.g. Intermediate Pre-Medical"
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Code *</label>
                  <input
                    type="text"
                    value={programForm.code}
                    onChange={(e) => setProgramForm({ ...programForm, code: e.target.value })}
                    placeholder="e.g. FSC-MED"
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Level</label>
                  <select
                    value={programForm.level}
                    onChange={(e) => setProgramForm({ ...programForm, level: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="Intermediate">Intermediate (11-12)</option>
                    <option value="Bachelor">Bachelor (BS 4-Year)</option>
                    <option value="Associate">Associate Degree</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowProgramModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-900 text-white">
                  Save Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Class Section Modal */}
      {showClassModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Add Class Section</h3>
            <form onSubmit={handleCreateClass} className="space-y-4 mt-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Class Name (Display) *
                </label>
                <input
                  type="text"
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  placeholder="e.g. XI Pre-Medical (Sec A)"
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Program *</label>
                <select
                  value={classForm.programId}
                  onChange={(e) => setClassForm({ ...classForm, programId: e.target.value })}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  {programs.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Year / Level *</label>
                  <input
                    type="text"
                    value={classForm.yearLevel}
                    onChange={(e) => setClassForm({ ...classForm, yearLevel: e.target.value })}
                    placeholder="1st Year (XI)"
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Section *</label>
                  <input
                    type="text"
                    value={classForm.section}
                    onChange={(e) => setClassForm({ ...classForm, section: e.target.value })}
                    placeholder="A, B, or C"
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Assign In-Charge Teacher (Optional)
                </label>
                <select
                  value={classForm.inchargeTeacherId}
                  onChange={(e) => setClassForm({ ...classForm, inchargeTeacherId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <option value="">None (Can assign later)</option>
                  {teachers.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.fullName} ({t.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowClassModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-900 text-white">
                  Save Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
