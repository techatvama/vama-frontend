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
    return <div className="rounded-2xl flex items-center justify-center text-white text-xs font-black flex-shrink-0 shadow-[0_2px_6px_-1px_rgba(0,0,0,0.15)]"
        style={{ width: size, height: size, backgroundColor: aColor(id) }}>{initials(first, last)}</div>;
}

function Stat({ icon: Icon, label, value, tone = 'indigo' }) {
    const tones = {
        indigo: 'from-indigo-50 to-indigo-100/50 text-[#463a7a]',
        emerald: 'from-emerald-50 to-emerald-100/50 text-emerald-600',
        amber: 'from-amber-50 to-amber-100/50 text-amber-600',
        rose: 'from-rose-50 to-rose-100/50 text-rose-600',
    };
    return (
        <div className="bg-white rounded-2xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.15)] border border-slate-100 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center bg-gradient-to-br flex-shrink-0 ${tones[tone]}`}><Icon size={20} strokeWidth={2.25} /></div>
            <div className="min-w-0">
                <p className="text-2xl font-black text-slate-900 leading-none tracking-tight">{value}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 truncate">{label}</p>
            </div>
        </div>
    );
}

const Pill = ({ children, tone = 'slate' }) => {
    const map = { slate: 'bg-slate-100 text-slate-600', indigo: 'bg-indigo-50 text-[#463a7a]', emerald: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700', rose: 'bg-rose-50 text-rose-700' };
    return <span className={`text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded-lg flex items-center gap-1 ${map[tone]}`}>{children}</span>;
};

export default function EnrollmentManager() {
    const { curricula: appCurricula } = useAppData();
    const [students, setStudents] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [grades, setGrades] = useState([]);
    const [examSessions, setExamSessions] = useState([]);
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
            const [st, tc, sj, gr, es] = await Promise.all([
                api.get('/admin/students-overview'),
                api.get('/staff'),
                api.get('/admin/subjects'),
                api.get('/admin/grades'),
                api.get('/admin/exam-sessions'),
            ]);
            setStudents(st.data || []);
            setTeachers((tc.data || []).filter(t => t.takesClasses !== false && t.takes_classes !== false));
            setSubjects(sj.data || []);
            setGrades(gr.data || []);
            setExamSessions((es.data || []).filter(s => s.is_active));
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
                <div className="relative rounded-[30px] p-7 lg:p-9 overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.06),0_20px_44px_-18px_rgba(70,58,122,0.45)]">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#4c3f87] via-[#3b2f6b] to-[#241a45]" />
                    <div className="absolute -top-16 -right-10 w-64 h-64 rounded-full bg-white/[0.06] blur-2xl" />
                    <UserCog className="absolute -bottom-6 -right-4 w-48 h-48 text-white/[0.05]" strokeWidth={1} />
                    <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-[10px] font-black uppercase tracking-[0.16em] mb-3">
                                <UserCog size={12} strokeWidth={2.5} /> Students
                            </span>
                            <h1 className="text-3xl lg:text-[34px] font-black text-white tracking-tight leading-none">
                                Enrollments
                            </h1>
                            <p className="text-indigo-100/50 font-medium text-sm mt-2.5 max-w-md">Assign instrument &amp; instructor to unlock packages and class booking in the student portal.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={load} title="Refresh (pulls latest grades from instructors)"
                                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 text-white rounded-xl text-sm font-bold hover:bg-white/20 transition-all">
                                <RefreshCw size={15} strokeWidth={2.25} /> Refresh
                            </button>
                            <button onClick={exportExcel}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white text-[#3b2f6b] rounded-xl text-sm font-bold shadow-[0_8px_20px_-6px_rgba(0,0,0,0.35)] hover:shadow-[0_10px_24px_-4px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 transition-all">
                                <Download size={15} strokeWidth={2.25} /> Export
                            </button>
                        </div>
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
                <div className="bg-white rounded-2xl p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] border border-slate-100 flex flex-wrap items-center gap-2.5">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={15} strokeWidth={2.25} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students…"
                            className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#463a7a]/15" />
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
                    {anyFilter && <button onClick={clearFilters} className="text-xs font-bold text-[#463a7a] px-2 hover:underline">Clear</button>}
                    <button onClick={() => setShowLoad(v => !v)} className="ml-auto text-xs font-bold text-slate-500 flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors">
                        <Users size={14} strokeWidth={2.25} /> {showLoad ? 'Hide' : 'Show'} Instructor Load
                    </button>
                </div>

                <div className="flex gap-6">
                    {/* Student list */}
                    <div className="flex-1 min-w-0 space-y-3">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">{filtered.length} student{filtered.length === 1 ? '' : 's'}</p>
                        {filtered.map(s => (
                            <div key={s.id} className="bg-white rounded-2xl p-4 lg:p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] border border-slate-100 hover:border-[#463a7a]/25 hover:shadow-[0_4px_20px_-8px_rgba(70,58,122,0.18)] transition-all">
                                <div className="flex items-center gap-4 flex-wrap lg:flex-nowrap">
                                    <Avatar id={s.id} first={s.first_name} last={s.last_name} size={48} />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-black text-slate-900 truncate">{s.first_name} {s.last_name}</h3>
                                            <Pill>{s.current_grade}</Pill>
                                            <Pill tone="indigo">{s.syllabus_type}</Pill>
                                            {s.is_exam_student && <Pill tone="amber"><Award size={10} strokeWidth={2.5} />Exam{s.exam_date ? ` · ${s.exam_date}` : ''}</Pill>}
                                        </div>
                                        <p className="text-xs text-slate-400 font-semibold truncate mt-0.5">{s.email}</p>
                                        {/* Classes: one chip per instrument + instructor */}
                                        <div className="flex items-center gap-1.5 flex-wrap mt-2">
                                            {(s.tracks && s.tracks.length) ? s.tracks.map(t => (
                                                <span key={t.id} className="inline-flex items-center gap-1 bg-indigo-50 text-[#463a7a] rounded-lg px-2 py-1 text-[11px] font-bold">
                                                    <Music size={11} strokeWidth={2.25} /> {t.instrument || '—'}
                                                    <span className="text-indigo-300 mx-0.5">·</span>
                                                    {t.teacher_name || <span className="text-rose-400">Unassigned</span>}
                                                </span>
                                            )) : <Pill tone="rose">No classes assigned</Pill>}
                                        </div>
                                    </div>

                                    {/* Progress */}
                                    <div className="w-32 flex-shrink-0">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Progress</p>
                                            <span className="text-[10px] font-black text-[#463a7a]">{s.progress_pct}%</span>
                                        </div>
                                        <div className="w-full h-[5px] bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-[#463a7a] to-purple-500 rounded-full transition-all" style={{ width: `${s.progress_pct}%` }} />
                                        </div>
                                        <p className="text-[9px] text-slate-400 font-semibold mt-1">{s.progress_done}/{s.progress_total} done</p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-1.5 flex-shrink-0">
                                        <button onClick={() => setProgressFor(s)} title="View progress"
                                            className="w-9 h-9 flex items-center justify-center bg-slate-50 text-slate-500 rounded-xl hover:bg-[#463a7a] hover:text-white transition-all"><TrendingUp size={15} strokeWidth={2.25} /></button>
                                        <button onClick={() => navigate(`/students/${s.id}`)} title="Packages & fees"
                                            className="w-9 h-9 flex items-center justify-center bg-slate-50 text-slate-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all"><CreditCard size={15} strokeWidth={2.25} /></button>
                                        <button onClick={() => setEditing(s)}
                                            className="px-4 py-2 bg-[#463a7a] text-white rounded-xl text-xs font-bold hover:bg-[#3a2f66] shadow-[0_4px_12px_-3px_rgba(70,58,122,0.4)] transition-all flex items-center gap-1.5">
                                            <Sparkles size={14} strokeWidth={2.25} /> {(s.tracks && s.tracks.length) ? 'Manage' : 'Assign'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filtered.length === 0 && (
                            <div className="bg-white rounded-2xl p-16 text-center border border-dashed border-slate-200">
                                <Search className="mx-auto text-slate-300 mb-3" size={28} strokeWidth={1.75} />
                                <p className="text-slate-400 font-semibold">No students match these filters.</p>
                            </div>
                        )}
                    </div>

                    {/* Instructor load rail */}
                    {showLoad && (
                        <div className="w-72 flex-shrink-0 hidden xl:block">
                            <div className="bg-white rounded-2xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] border border-slate-100 sticky top-6">
                                <h3 className="font-black text-slate-900 flex items-center gap-2 mb-4 text-[15px]">
                                    <span className="w-8 h-8 rounded-xl bg-indigo-50 text-[#463a7a] flex items-center justify-center"><Users size={15} strokeWidth={2.25} /></span>
                                    Instructor Load
                                </h3>
                                <div className="space-y-1 max-h-[70vh] overflow-y-auto">
                                    {teacherLoad.map(t => (
                                        <button key={t.id} onClick={() => setFTeacher(String(t.id))}
                                            className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 text-left transition-all">
                                            <Avatar id={t.id} first={t.name} size={34} />
                                            <span className="flex-1 text-sm font-bold text-slate-700 truncate">{t.name}</span>
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
                <AssignDrawer student={editing} teachers={teachers} subjects={subjects} grades={grades} curricula={curricula} examSessions={examSessions}
                    onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
            )}
            {progressFor && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-md" onClick={() => setProgressFor(null)} />
                    <div className="relative bg-white rounded-[32px] w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-[0_32px_80px_-20px_rgba(0,0,0,0.4)] flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">Progress</h2>
                                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-0.5">{progressFor.first_name} {progressFor.last_name} · {progressFor.instrument} · {progressFor.syllabus_type} {progressFor.current_grade}</p>
                            </div>
                            <button onClick={() => setProgressFor(null)} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl hover:bg-red-50 hover:text-red-500 transition-colors"><X size={18} strokeWidth={2.25} /></button>
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
                className={`appearance-none pl-9 pr-8 py-2.5 border rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#463a7a]/15 transition-all ${value ? 'bg-indigo-50 border-[#463a7a]/40 text-[#463a7a]' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                <option value="">{placeholder}</option>
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <Icon size={14} strokeWidth={2.25} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <ChevronDown size={13} strokeWidth={2.25} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
    );
}

function AssignDrawer({ student, teachers, subjects, grades, curricula, examSessions, onClose, onSaved }) {
    const [tracks, setTracks] = useState(student.tracks || []);
    const [newInstrument, setNewInstrument] = useState('');
    const [newTeacher, setNewTeacher] = useState('');
    const [newGrade, setNewGrade] = useState(grades[0]?.name || 'Debut');
    const [newSyllabus, setNewSyllabus] = useState(curricula[0] || 'Trinity');
    const [newExam, setNewExam] = useState(false);
    const [newExamSession, setNewExamSession] = useState('');
    const sessionLabel = (s) => `${s.name}${s.exam_date ? ` · ${new Date(s.exam_date + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}`;
    const [busy, setBusy] = useState(false);
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
            const examSessionId = newExam && newExamSession ? Number(newExamSession) : null;
            const r = await api.post(`/admin/students/${student.id}/instructors`, {
                instrument: newInstrument,
                teacher_id: Number(newTeacher),
                grade: newGrade,
                syllabus_type: newSyllabus,
                is_exam_student: newExam,
                exam_session_id: examSessionId,
            });
            setTracks(prev => [...prev, {
                id: r.data.id,
                instrument: newInstrument,
                teacher_id: Number(newTeacher),
                teacher_name: teacherName(newTeacher),
                grade: newGrade,
                syllabus_type: newSyllabus,
                is_exam_student: newExam,
                exam_session_id: examSessionId,
                exam_session_name: examSessionId ? examSessions.find(s => s.id === examSessionId)?.name : null,
            }]);
            setNewInstrument(''); setNewTeacher('');
            setNewGrade(grades[0]?.name || 'Debut'); setNewSyllabus(curricula[0] || 'Trinity');
            setNewExam(false); setNewExamSession('');
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

    const close = () => (dirty ? onSaved() : onClose());
    const field = "w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#463a7a]/15 focus:border-[#463a7a]/30 transition-all";
    const smallField = "bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#463a7a]/20 text-slate-700";

    return (
        <div className="fixed inset-0 z-[120] flex justify-end">
            <div className="absolute inset-0 bg-slate-900/65 backdrop-blur-sm" onClick={close} />
            <div className="relative w-full max-w-md bg-white h-full overflow-y-auto shadow-[0_0_60px_rgba(0,0,0,0.3)] animate-in slide-in-from-right duration-200">
                <div className="relative p-6 text-white flex items-center gap-3 sticky top-0 z-10 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#4c3f87] to-[#2d2456]" />
                    <Avatar id={student.id} first={student.first_name} last={student.last_name} size={44} />
                    <div className="relative z-10 flex-1 min-w-0">
                        <h2 className="text-lg font-black truncate tracking-tight">{student.first_name} {student.last_name}</h2>
                        <p className="text-indigo-200/60 text-xs font-bold">Manage classes &amp; instructors</p>
                    </div>
                    <button onClick={close} className="relative z-10 w-9 h-9 flex items-center justify-center bg-white/10 rounded-xl hover:bg-white/20 transition-colors flex-shrink-0"><X size={16} strokeWidth={2.25} /></button>
                </div>

                <div className="p-6 space-y-5">
                    {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-sm font-bold flex items-center gap-2"><AlertCircle size={16} strokeWidth={2.25} />{error}</div>}

                    {/* Classes — each has its own instructor + syllabus + grade */}
                    <div>
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Classes &amp; Instructors</label>
                        <div className="space-y-2.5 mt-2.5">
                            {tracks.length === 0 && <p className="text-xs text-slate-400 font-semibold italic">No classes yet — add one below.</p>}
                            {tracks.map(t => (
                                <div key={t.id} className="bg-slate-50/70 border border-slate-100 rounded-2xl px-3.5 py-3 space-y-2.5">
                                    {/* Instrument + Instructor + Remove */}
                                    <div className="flex items-center gap-2">
                                        <span className="w-7 h-7 rounded-lg bg-indigo-100 text-[#463a7a] flex items-center justify-center flex-shrink-0"><Music size={13} strokeWidth={2.25} /></span>
                                        <span className="text-sm font-black text-slate-800 truncate">{t.instrument || '—'}</span>
                                        <span className="text-slate-300">·</span>
                                        <UserCog size={13} strokeWidth={2.25} className="text-slate-400 flex-shrink-0" />
                                        <span className="text-sm font-bold text-slate-600 truncate flex-1">{t.teacher_name || teacherName(t.teacher_id) || 'Unassigned'}</span>
                                        <button onClick={() => removeTrack(t.id)} title="Remove class"
                                            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all flex-shrink-0"><Trash2 size={13} strokeWidth={2.25} /></button>
                                    </div>
                                    {/* Per-class curriculum + grade */}
                                    <div className="flex items-center gap-2 pl-9">
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
                                    {/* Per-class exam status */}
                                    <div className="flex items-center gap-2 pl-9">
                                        <button type="button"
                                            onClick={() => updateTrackField(t.id, 'is_exam_student', !t.is_exam_student)}
                                            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all flex-shrink-0 ${t.is_exam_student ? 'bg-amber-100 text-amber-700' : 'bg-white border border-slate-200 text-slate-400'}`}>
                                            <Award size={13} strokeWidth={2.25} /> Exam
                                        </button>
                                        {t.is_exam_student && (
                                            <select className={`${smallField} flex-1`}
                                                value={t.exam_session_id || ''}
                                                onChange={e => updateTrackField(t.id, 'exam_session_id', e.target.value ? Number(e.target.value) : null)}>
                                                <option value="">Select exam session…</option>
                                                {examSessions.map(s => <option key={s.id} value={s.id}>{sessionLabel(s)}</option>)}
                                            </select>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add class row */}
                        <div className="mt-3.5 bg-indigo-50/40 border border-indigo-100 rounded-2xl p-4 space-y-2.5">
                            <p className="text-[10px] font-black text-[#463a7a] uppercase tracking-widest flex items-center gap-1.5 mb-1"><Plus size={12} strokeWidth={2.5} /> Add a class</p>
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
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={() => setNewExam(!newExam)}
                                    className={`flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold transition-all flex-shrink-0 ${newExam ? 'bg-amber-100 text-amber-700' : 'bg-white border border-slate-200 text-slate-400'}`}>
                                    <Award size={13} strokeWidth={2.25} /> Exam Student
                                </button>
                                {newExam && (
                                    <select className={`${field} flex-1 py-2.5`}
                                        value={newExamSession} onChange={e => setNewExamSession(e.target.value)}>
                                        <option value="">Select exam session…</option>
                                        {examSessions.map(s => <option key={s.id} value={s.id}>{sessionLabel(s)}</option>)}
                                    </select>
                                )}
                            </div>
                            <button onClick={addTrack} disabled={busy}
                                className="w-full bg-[#463a7a] hover:bg-[#3a2f66] text-white rounded-xl py-3 font-bold text-sm shadow-[0_4px_14px_-3px_rgba(70,58,122,0.45)] flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all">
                                {busy ? <Loader2 className="animate-spin" size={15} /> : <><Plus size={15} strokeWidth={2.5} /> Add Class</>}
                            </button>
                        </div>
                    </div>

                    <div className="bg-indigo-50 rounded-xl p-3.5 text-[11px] font-bold text-[#463a7a] flex items-start gap-2">
                        <Sparkles size={14} strokeWidth={2.25} className="mt-0.5 flex-shrink-0" />
                        Each class has its own syllabus, grade, and exam status. Changes save instantly.
                    </div>

                    <button onClick={close}
                        className="w-full bg-[#463a7a] hover:bg-[#3a2f66] text-white rounded-xl py-3.5 font-bold text-sm shadow-[0_6px_18px_-4px_rgba(70,58,122,0.45)] transition-all flex items-center justify-center gap-2">
                        <Check size={17} strokeWidth={2.5} /> Save &amp; Close
                    </button>
                </div>
            </div>
        </div>
    );
}
