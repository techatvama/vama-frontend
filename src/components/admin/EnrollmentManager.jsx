import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../../lib/api';
import { useAppData } from '../../context/AppDataContext';
import StudentProgressEditor from '../StudentProgressEditor';
import {
    Search, Users, GraduationCap, Music, Award, X, Check, Loader2, ChevronDown,
    UserCog, TrendingUp, CreditCard, AlertCircle, Sparkles, BookOpen, Download, RefreshCw, Plus, Trash2,
} from 'lucide-react';
const AVATAR_COLORS = ['#6366f1', '#10b981', '#f97316', '#ec4899', '#8b5cf6', '#3b82f6', '#ef4444', '#14b8a6'];
const initials = (f, l) => `${(f || '?')[0]}${(l || '')[0] || ''}`.toUpperCase();
const aColor = (id) => AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length];

function Avatar({ id, first, last, size = 40 }) {
    return <div className="rounded-2xl flex items-center justify-center text-white text-xs font-black flex-shrink-0"
        style={{ width: size, height: size, backgroundColor: aColor(id) }}>{initials(first, last)}</div>;
}

function Stat({ icon: Icon, label, value, tone = 'indigo' }) {
    const tones = { indigo: 'bg-indigo-50 text-[#463a7a]', emerald: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600', rose: 'bg-rose-50 text-rose-600' };
    return (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tones[tone]}`}><Icon size={22} /></div>
            <div>
                <p className="text-2xl font-black text-slate-900 leading-none">{value}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{label}</p>
            </div>
        </div>
    );
}

const Pill = ({ children, tone = 'slate' }) => {
    const map = { slate: 'bg-slate-100 text-slate-600', indigo: 'bg-indigo-50 text-[#463a7a]', emerald: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700', rose: 'bg-rose-50 text-rose-700' };
    return <span className={`text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-md ${map[tone]}`}>{children}</span>;
};

export default function EnrollmentManager() {
    const { curricula: appCurricula } = useAppData();
    const [students, setStudents] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [fTeacher, setFTeacher] = useState('');
    const [fCurriculum, setFCurriculum] = useState('');
    const [fExam, setFExam] = useState('');         // '', 'exam', 'non'
    const [fGrade, setFGrade] = useState('');
    const [fInstrument, setFInstrument] = useState('');
    const [editing, setEditing] = useState(null);   // student being assigned
    const [progressFor, setProgressFor] = useState(null);
    const [showLoad, setShowLoad] = useState(true);
    const navigate = useNavigate();

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [st, tc, sj, gr] = await Promise.all([
                api.get('/admin/students-overview'),
                api.get('/staff'),
                api.get('/admin/subjects'),
                api.get('/admin/grades'),
            ]);
            setStudents(st.data || []);
            setTeachers((tc.data || []).filter(t => t.takesClasses !== false && t.takes_classes !== false));
            setSubjects(sj.data || []);
            setGrades(gr.data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);
    useEffect(() => { load(); }, [load]);

    const curricula = useMemo(() => [...new Set([...appCurricula, ...students.map(s => s.syllabus_type).filter(Boolean)])], [students, appCurricula]);
    const instruments = useMemo(() => [...new Set(students.map(s => s.instrument).filter(Boolean))].sort(), [students]);

    const filtered = useMemo(() => students.filter(s => {
        const q = search.toLowerCase();
        const tracks = s.tracks || [];
        if (q && !`${s.first_name} ${s.last_name} ${s.email}`.toLowerCase().includes(q)) return false;
        if (fTeacher && !tracks.some(t => String(t.teacher_id) === fTeacher) && String(s.teacher_id) !== fTeacher) return false;
        if (fCurriculum && s.syllabus_type !== fCurriculum) return false;
        if (fExam === 'exam' && !s.is_exam_student) return false;
        if (fExam === 'non' && s.is_exam_student) return false;
        if (fGrade && s.current_grade !== fGrade) return false;
        if (fInstrument && !tracks.some(t => t.instrument === fInstrument) && s.instrument !== fInstrument) return false;
        return true;
    }), [students, search, fTeacher, fCurriculum, fExam, fGrade, fInstrument]);

    const stats = useMemo(() => ({
        total: students.length,
        exam: students.filter(s => s.is_exam_student).length,
        instructors: new Set(students.flatMap(s => (s.tracks || []).map(t => t.teacher_id)).filter(Boolean)).size,
        avgProgress: students.length ? Math.round(students.reduce((a, s) => a + (s.progress_pct || 0), 0) / students.length) : 0,
    }), [students]);

    const exportExcel = () => {
        const cols = ['Name', 'Email', 'Phone', 'Classes (Instrument · Instructor)', 'Grade', 'Curriculum', 'Exam', 'Exam Date', 'Progress %', 'Center'];
        const data = filtered.map(s => [
            `${s.first_name} ${s.last_name}`, s.email, s.primary_phone_number,
            (s.tracks || []).map(t => `${t.instrument || '—'} · ${t.teacher_name || 'Unassigned'}`).join('; '),
            s.current_grade, s.syllabus_type, s.is_exam_student ? 'Yes' : 'No', s.exam_date || '',
            s.progress_pct, s.center_name || '',
        ]);
        const esc = (c) => `"${String(c ?? '').replace(/"/g, '""')}"`;
        const csv = [cols, ...data].map(r => r.map(esc).join(',')).join('\n');
        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `enrollments-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const teacherLoad = useMemo(() => {
        const m = new Map(teachers.map(t => [t.id, { ...t, students: [] }]));
        students.forEach(s => {
            const tids = new Set((s.tracks || []).map(t => t.teacher_id).filter(Boolean));
            if (s.teacher_id) tids.add(s.teacher_id);
            tids.forEach(tid => { if (m.has(tid)) m.get(tid).students.push(s); });
        });
        return [...m.values()].sort((a, b) => b.students.length - a.students.length);
    }, [teachers, students]);

    const anyFilter = search || fTeacher || fCurriculum || fExam || fGrade || fInstrument;
    const clearFilters = () => { setSearch(''); setFTeacher(''); setFCurriculum(''); setFExam(''); setFGrade(''); setFInstrument(''); };

    if (loading) return <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]"><Loader2 className="animate-spin text-[#463a7a]" size={36} /></div>;

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 lg:p-8">
            <div className="max-w-[1500px] mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                            <UserCog className="text-[#463a7a]" /> Enrollments
                        </h1>
                        <p className="text-slate-400 font-bold text-sm mt-1">Assign instrument & instructor to unlock packages and class booking in the student portal.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={load} title="Refresh (pulls latest grades from instructors)"
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-2xl text-sm font-black hover:border-[#463a7a] hover:text-[#463a7a] transition-all">
                            <RefreshCw size={15} /> Refresh
                        </button>
                        <button onClick={exportExcel}
                            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-2xl text-sm font-black hover:bg-emerald-700 transition-all shadow-sm">
                            <Download size={15} /> Export Excel
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Stat icon={Users} label="Total Students" value={stats.total} />
                    <Stat icon={Award} label="Exam Students" value={stats.exam} tone="amber" />
                    <Stat icon={UserCog} label="Active Instructors" value={stats.instructors} tone="indigo" />
                    <Stat icon={TrendingUp} label="Avg Progress" value={`${stats.avgProgress}%`} tone="emerald" />
                </div>

                {/* Filters */}
                <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex flex-wrap items-center gap-2.5">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students…"
                            className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#463a7a]/15" />
                    </div>
                    <Select value={fTeacher} onChange={setFTeacher} icon={UserCog} placeholder="All Instructors"
                        options={teachers.map(t => ({ value: String(t.id), label: t.name }))} />
                    <Select value={fCurriculum} onChange={setFCurriculum} icon={BookOpen} placeholder="All Curricula"
                        options={curricula.map(c => ({ value: c, label: c }))} />
                    <Select value={fGrade} onChange={setFGrade} icon={GraduationCap} placeholder="All Grades"
                        options={grades.map(g => ({ value: g.name, label: g.name }))} />
                    <Select value={fInstrument} onChange={setFInstrument} icon={Music} placeholder="All Instruments"
                        options={instruments.map(i => ({ value: i, label: i }))} />
                    <Select value={fExam} onChange={setFExam} icon={Award} placeholder="Exam Status"
                        options={[{ value: 'exam', label: 'Exam Students' }, { value: 'non', label: 'Non-Exam' }]} />
                    {anyFilter && <button onClick={clearFilters} className="text-xs font-black text-[#463a7a] px-2 hover:underline">Clear</button>}
                    <button onClick={() => setShowLoad(v => !v)} className="ml-auto text-xs font-black text-slate-500 flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-slate-50">
                        <Users size={14} /> {showLoad ? 'Hide' : 'Show'} Instructor Load
                    </button>
                </div>

                <div className="flex gap-6">
                    {/* Student list */}
                    <div className="flex-1 min-w-0 space-y-3">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">{filtered.length} student{filtered.length === 1 ? '' : 's'}</p>
                        {filtered.map(s => (
                            <div key={s.id} className="bg-white rounded-3xl p-4 lg:p-5 shadow-sm border border-slate-100 hover:border-[#463a7a]/30 transition-all">
                                <div className="flex items-center gap-4 flex-wrap lg:flex-nowrap">
                                    <Avatar id={s.id} first={s.first_name} last={s.last_name} size={48} />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-black text-slate-900 truncate">{s.first_name} {s.last_name}</h3>
                                            <Pill>{s.current_grade}</Pill>
                                            <Pill tone="indigo">{s.syllabus_type}</Pill>
                                            {s.is_exam_student && <Pill tone="amber"><Award size={9} className="inline mr-0.5" />Exam{s.exam_date ? ` · ${s.exam_date}` : ''}</Pill>}
                                        </div>
                                        <p className="text-xs text-slate-400 font-bold truncate">{s.email}</p>
                                        {/* Classes: one chip per instrument + instructor */}
                                        <div className="flex items-center gap-1.5 flex-wrap mt-2">
                                            {(s.tracks && s.tracks.length) ? s.tracks.map(t => (
                                                <span key={t.id} className="inline-flex items-center gap-1 bg-indigo-50 text-[#463a7a] rounded-lg px-2 py-1 text-[11px] font-black">
                                                    <Music size={10} /> {t.instrument || '—'}
                                                    <span className="text-indigo-300 mx-0.5">·</span>
                                                    {t.teacher_name || <span className="text-rose-400">Unassigned</span>}
                                                </span>
                                            )) : <Pill tone="rose">No classes assigned</Pill>}
                                        </div>
                                    </div>

                                    {/* Progress */}
                                    <div className="w-32 flex-shrink-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Progress</p>
                                            <span className="text-[10px] font-black text-[#463a7a]">{s.progress_pct}%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-[#463a7a] to-purple-500 rounded-full" style={{ width: `${s.progress_pct}%` }} />
                                        </div>
                                        <p className="text-[9px] text-slate-400 font-bold mt-1">{s.progress_done}/{s.progress_total} done</p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button onClick={() => setProgressFor(s)} title="View progress"
                                            className="p-2.5 bg-slate-50 text-slate-500 rounded-2xl hover:bg-[#463a7a] hover:text-white transition-all"><TrendingUp size={16} /></button>
                                        <button onClick={() => navigate(`/students/${s.id}`)} title="Packages & fees"
                                            className="p-2.5 bg-slate-50 text-slate-500 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all"><CreditCard size={16} /></button>
                                        <button onClick={() => setEditing(s)}
                                            className="px-4 py-2.5 bg-[#463a7a] text-white rounded-2xl text-xs font-black hover:bg-[#3a2f66] transition-all flex items-center gap-1.5">
                                            <Sparkles size={14} /> {(s.tracks && s.tracks.length) ? 'Manage' : 'Assign'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filtered.length === 0 && <div className="bg-white rounded-3xl p-16 text-center text-slate-400 font-bold border border-slate-100">No students match these filters.</div>}
                    </div>

                    {/* Instructor load rail */}
                    {showLoad && (
                        <div className="w-72 flex-shrink-0 hidden xl:block">
                            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 sticky top-6">
                                <h3 className="font-black text-slate-900 flex items-center gap-2 mb-4"><Users size={18} className="text-[#463a7a]" /> Instructor Load</h3>
                                <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                                    {teacherLoad.map(t => (
                                        <button key={t.id} onClick={() => setFTeacher(String(t.id))}
                                            className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-50 text-left transition-all">
                                            <Avatar id={t.id} first={t.name} size={34} />
                                            <span className="flex-1 text-sm font-black text-slate-700 truncate">{t.name}</span>
                                            <span className="text-xs font-black text-white bg-[#463a7a] rounded-lg px-2 py-0.5">{t.students.length}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {editing && (
                <AssignDrawer student={editing} teachers={teachers} subjects={subjects} grades={grades} curricula={curricula}
                    onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
            )}
            {progressFor && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setProgressFor(null)} />
                    <div className="relative bg-white rounded-[40px] w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Progress</h2>
                                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-0.5">{progressFor.first_name} {progressFor.last_name} · {progressFor.instrument} · {progressFor.syllabus_type} {progressFor.current_grade}</p>
                            </div>
                            <button onClick={() => setProgressFor(null)} className="w-11 h-11 flex items-center justify-center bg-slate-50 rounded-2xl hover:bg-red-50 hover:text-red-500"><X size={20} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 lg:p-6"><StudentProgressEditor studentIdFromProps={progressFor.id} /></div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Select({ value, onChange, icon: Icon, placeholder, options }) {
    return (
        <div className="relative">
            <select value={value} onChange={e => onChange(e.target.value)}
                className={`appearance-none pl-9 pr-8 py-2.5 border rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#463a7a]/15 transition-all ${value ? 'bg-indigo-50 border-[#463a7a]/40 text-[#463a7a]' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                <option value="">{placeholder}</option>
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
    );
}

function AssignDrawer({ student, teachers, subjects, grades, curricula, onClose, onSaved }) {
    const [tracks, setTracks] = useState(student.tracks || []);
    const [newInstrument, setNewInstrument] = useState('');
    const [newTeacher, setNewTeacher] = useState('');
    const [newGrade, setNewGrade] = useState(grades[0]?.name || 'Debut');
    const [newSyllabus, setNewSyllabus] = useState(curricula[0] || 'Trinity');
    const [form, setForm] = useState({
        is_exam_student: !!student.is_exam_student, exam_date: student.exam_date || '',
    });
    const [busy, setBusy] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [dirty, setDirty] = useState(false);

    const teacherName = (id) => teachers.find(t => String(t.id) === String(id))?.name;

    const addTrack = async () => {
        setError('');
        if (!newInstrument || !newTeacher) { setError('Pick an instrument and an instructor to add a class.'); return; }
        if (tracks.some(t => t.instrument === newInstrument && String(t.teacher_id) === String(newTeacher))) {
            setError('That instrument + instructor is already assigned.'); return;
        }
        setBusy(true);
        try {
            const r = await api.post(`/admin/students/${student.id}/instructors`, {
                instrument: newInstrument,
                teacher_id: Number(newTeacher),
                grade: newGrade,
                syllabus_type: newSyllabus,
            });
            setTracks(prev => [...prev, {
                id: r.data.id,
                instrument: newInstrument,
                teacher_id: Number(newTeacher),
                teacher_name: teacherName(newTeacher),
                grade: newGrade,
                syllabus_type: newSyllabus,
            }]);
            setNewInstrument(''); setNewTeacher('');
            setNewGrade(grades[0]?.name || 'Debut'); setNewSyllabus(curricula[0] || 'Trinity');
            setDirty(true);
        } catch (e) { setError(e.response?.data?.detail || 'Failed to add class'); }
        finally { setBusy(false); }
    };

    const removeTrack = async (id) => {
        setError('');
        try {
            await api.delete(`/admin/students/${student.id}/instructors/${id}`);
            setTracks(prev => prev.filter(t => t.id !== id)); setDirty(true);
        } catch (e) { setError(e.response?.data?.detail || 'Failed to remove'); }
    };

    const updateTrackField = async (trackId, field, value) => {
        setTracks(prev => prev.map(t => t.id === trackId ? { ...t, [field]: value } : t));
        try {
            await api.put(`/admin/students/${student.id}/instructors/${trackId}`, { [field]: value });
            setDirty(true);
        } catch (e) {
            setError(e.response?.data?.detail || 'Failed to update class');
        }
    };

    const saveStudentFields = async () => {
        setSaving(true); setError('');
        try {
            await api.put(`/students/${student.id}`, {
                is_exam_student: form.is_exam_student,
                exam_date: form.is_exam_student ? (form.exam_date || null) : null,
            });
            onSaved();
        } catch (e) { setError(e.response?.data?.detail || 'Failed to save'); setSaving(false); }
    };

    const close = () => (dirty ? onSaved() : onClose());
    const field = "w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#463a7a]/15";
    const smallField = "bg-white border border-slate-200 rounded-xl py-1.5 px-2.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#463a7a]/20 text-slate-700";

    return (
        <div className="fixed inset-0 z-[120] flex justify-end">
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={close} />
            <div className="relative w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-200">
                <div className="p-6 bg-[#463a7a] text-white flex items-center gap-3 sticky top-0 z-10">
                    <Avatar id={student.id} first={student.first_name} last={student.last_name} size={44} />
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-black truncate">{student.first_name} {student.last_name}</h2>
                        <p className="text-indigo-200/70 text-xs font-bold">Manage classes & instructors</p>
                    </div>
                    <button onClick={close} className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-2xl hover:bg-white/20"><X size={18} /></button>
                </div>

                <div className="p-6 space-y-5">
                    {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-2xl text-sm font-bold flex items-center gap-2"><AlertCircle size={16} />{error}</div>}

                    {/* Classes — each has its own instructor + syllabus + grade */}
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Classes & Instructors</label>
                        <div className="space-y-2 mt-2">
                            {tracks.length === 0 && <p className="text-xs text-slate-400 font-bold italic">No classes yet — add one below.</p>}
                            {tracks.map(t => (
                                <div key={t.id} className="bg-slate-50 border border-slate-100 rounded-2xl px-3 py-2.5 space-y-2">
                                    {/* Instrument + Instructor + Remove */}
                                    <div className="flex items-center gap-2">
                                        <Music size={14} className="text-[#463a7a] flex-shrink-0" />
                                        <span className="text-sm font-black text-slate-800 truncate">{t.instrument || '—'}</span>
                                        <span className="text-slate-300">·</span>
                                        <UserCog size={13} className="text-slate-400 flex-shrink-0" />
                                        <span className="text-sm font-bold text-slate-600 truncate flex-1">{t.teacher_name || teacherName(t.teacher_id) || 'Unassigned'}</span>
                                        <button onClick={() => removeTrack(t.id)} title="Remove class"
                                            className="w-7 h-7 flex items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all flex-shrink-0"><Trash2 size={14} /></button>
                                    </div>
                                    {/* Per-class curriculum + grade */}
                                    <div className="flex items-center gap-2 pl-0.5">
                                        <select
                                            className={smallField}
                                            value={t.syllabus_type || curricula[0] || 'Trinity'}
                                            onChange={e => updateTrackField(t.id, 'syllabus_type', e.target.value)}
                                        >
                                            {curricula.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                        <select
                                            className={smallField}
                                            value={t.grade || grades[0]?.name || 'Debut'}
                                            onChange={e => updateTrackField(t.id, 'grade', e.target.value)}
                                        >
                                            {grades.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add class row */}
                        <div className="mt-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl p-3 space-y-2">
                            <select className={field} value={newInstrument} onChange={e => setNewInstrument(e.target.value)}>
                                <option value="">Instrument…</option>
                                {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                            <select className={field} value={newTeacher} onChange={e => setNewTeacher(e.target.value)}>
                                <option value="">Instructor…</option>
                                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                            <div className="grid grid-cols-2 gap-2">
                                <select className={field} value={newSyllabus} onChange={e => setNewSyllabus(e.target.value)}>
                                    {curricula.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <select className={field} value={newGrade} onChange={e => setNewGrade(e.target.value)}>
                                    {grades.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
                                </select>
                            </div>
                            <button onClick={addTrack} disabled={busy}
                                className="w-full bg-[#463a7a] hover:bg-[#3a2f66] text-white rounded-2xl py-2.5 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 disabled:opacity-50">
                                {busy ? <Loader2 className="animate-spin" size={15} /> : <><Plus size={15} /> Add Class</>}
                            </button>
                        </div>
                    </div>

                    {/* Exam Student */}
                    <div className="bg-slate-50 rounded-2xl p-4">
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-sm font-black text-slate-700 flex items-center gap-2"><Award size={16} className="text-amber-500" /> Exam Student</span>
                            <button type="button" onClick={() => setForm({ ...form, is_exam_student: !form.is_exam_student })}
                                className={`w-11 h-6 rounded-full transition-all relative ${form.is_exam_student ? 'bg-[#463a7a]' : 'bg-slate-300'}`}>
                                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${form.is_exam_student ? 'left-5.5 translate-x-0.5' : 'left-0.5'}`} />
                            </button>
                        </label>
                        {form.is_exam_student && (
                            <input type="date" className={`${field} mt-3`} value={form.exam_date || ''} onChange={e => setForm({ ...form, exam_date: e.target.value })} />
                        )}
                    </div>

                    <div className="bg-indigo-50 rounded-2xl p-3 text-[11px] font-bold text-[#463a7a] flex items-start gap-2">
                        <Sparkles size={14} className="mt-0.5 flex-shrink-0" />
                        Each class has its own syllabus and grade. Curriculum and grade changes save instantly.
                    </div>

                    <button onClick={saveStudentFields} disabled={saving}
                        className="w-full bg-[#463a7a] hover:bg-[#3a2f66] text-white rounded-2xl py-4 font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <><Check size={18} /> Save & Close</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
