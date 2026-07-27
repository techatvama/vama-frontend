import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../../lib/api';
import { useAppData } from '../../context/AppDataContext';
import StudentProgressEditor from '../StudentProgressEditor';
import {
    Search, Filter, X, Loader2, ChevronUp, ChevronDown, ChevronsUpDown,
    GraduationCap, BookOpen, Award, TrendingUp, Users, RefreshCw,
} from 'lucide-react';

const AVATAR_COLORS = ['#6366f1', '#10b981', '#f97316', '#ec4899', '#8b5cf6', '#3b82f6', '#ef4444', '#14b8a6'];
const aColor = (id) => AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length];
const initials = (f, l) => `${(f || '?')[0]}${(l || '')[0] || ''}`.toUpperCase();

function SortIcon({ col, sortConfig }) {
    if (sortConfig.key !== col) return <ChevronsUpDown size={13} className="text-slate-300" />;
    return sortConfig.dir === 'asc'
        ? <ChevronUp size={13} className="text-[#463a7a]" />
        : <ChevronDown size={13} className="text-[#463a7a]" />;
}

function ProgressBar({ pct }) {
    const p = Math.min(100, Math.max(0, pct || 0));
    const color = p >= 75 ? 'from-emerald-500 to-emerald-400' : p >= 40 ? 'from-amber-500 to-amber-400' : 'from-rose-500 to-rose-400';
    return (
        <div className="flex items-center gap-2 min-w-[100px]">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-all`} style={{ width: `${p}%` }} />
            </div>
            <span className="text-xs font-black text-slate-700 w-9 text-right">{p}%</span>
        </div>
    );
}

export default function StudentsProgressTable() {
    const { curricula: appCurricula } = useAppData();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [fGrade, setFGrade] = useState('');
    const [fCurriculum, setFCurriculum] = useState('');
    const [fInstrument, setFInstrument] = useState('');
    const [fExam, setFExam] = useState('');
    const [fCenter, setFCenter] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'first_name', dir: 'asc' });
    const [progressFor, setProgressFor] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/students-overview');
            setStudents(res.data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const curricula = useMemo(() =>
        [...new Set([...appCurricula, ...students.map(s => s.syllabus_type).filter(Boolean)])],
        [students, appCurricula]);
    const instruments = useMemo(() =>
        [...new Set(students.map(s => s.instrument || (s.tracks || [])[0]?.instrument).filter(Boolean))].sort(),
        [students]);
    const centers = useMemo(() =>
        [...new Set(students.map(s => s.center_name).filter(Boolean))].sort(),
        [students]);
    const grades = useMemo(() =>
        [...new Set(students.map(s => s.current_grade).filter(Boolean))].sort(),
        [students]);

    const anyFilter = search || fGrade || fCurriculum || fInstrument || fExam || fCenter;
    const clearFilters = () => { setSearch(''); setFGrade(''); setFCurriculum(''); setFInstrument(''); setFExam(''); setFCenter(''); };

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return students.filter(s => {
            const name = `${s.first_name} ${s.last_name}`.toLowerCase();
            const instrument = s.instrument || (s.tracks || [])[0]?.instrument || '';
            if (q && !name.includes(q) && !(s.email || '').toLowerCase().includes(q) && !instrument.toLowerCase().includes(q)) return false;
            if (fGrade && s.current_grade !== fGrade) return false;
            if (fCurriculum && s.syllabus_type !== fCurriculum) return false;
            if (fInstrument && instrument !== fInstrument) return false;
            if (fExam === 'exam' && !s.is_exam_student) return false;
            if (fExam === 'non' && s.is_exam_student) return false;
            if (fCenter && s.center_name !== fCenter) return false;
            return true;
        });
    }, [students, search, fGrade, fCurriculum, fInstrument, fExam, fCenter]);

    const sorted = useMemo(() => {
        const key = sortConfig.key;
        return [...filtered].sort((a, b) => {
            let va = a[key] ?? '';
            let vb = b[key] ?? '';
            if (key === 'name') { va = `${a.first_name} ${a.last_name}`; vb = `${b.first_name} ${b.last_name}`; }
            if (typeof va === 'number') return sortConfig.dir === 'asc' ? va - vb : vb - va;
            return sortConfig.dir === 'asc'
                ? String(va).localeCompare(String(vb))
                : String(vb).localeCompare(String(va));
        });
    }, [filtered, sortConfig]);

    const sort = (key) => setSortConfig(c => ({ key, dir: c.key === key && c.dir === 'asc' ? 'desc' : 'asc' }));

    const stats = useMemo(() => ({
        total: students.length,
        shown: filtered.length,
        exam: students.filter(s => s.is_exam_student).length,
        avgPct: students.length ? Math.round(students.reduce((a, s) => a + (s.progress_pct || 0), 0) / students.length) : 0,
    }), [students, filtered]);

    const thClass = "px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap cursor-pointer select-none hover:text-[#463a7a] transition-colors";
    const selClass = "bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#463a7a]/15 appearance-none";

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Student Progress</h1>
                    <p className="text-slate-400 font-bold text-sm mt-0.5">Curriculum progress across all enrolled students</p>
                </div>
                <button onClick={load} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-2xl text-sm font-black hover:bg-slate-50 transition-colors">
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { icon: Users, label: 'Total Students', value: stats.total, color: 'text-[#463a7a] bg-indigo-50' },
                    { icon: Filter, label: 'Showing', value: stats.shown, color: 'text-slate-600 bg-slate-100' },
                    { icon: Award, label: 'Exam Track', value: stats.exam, color: 'text-amber-600 bg-amber-50' },
                    { icon: TrendingUp, label: 'Avg Progress', value: `${stats.avgPct}%`, color: 'text-emerald-600 bg-emerald-50' },
                ].map(({ icon: Icon, label, value, color }) => (
                    <div key={label} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                            <Icon size={18} />
                        </div>
                        <div>
                            <p className="text-xl font-black text-slate-900 leading-none">{value}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                <div className="flex flex-wrap gap-3">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by name, email, or instrument…"
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#463a7a]/15"
                        />
                    </div>

                    <select value={fGrade} onChange={e => setFGrade(e.target.value)} className={selClass}>
                        <option value="">All Grades</option>
                        {grades.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>

                    <select value={fCurriculum} onChange={e => setFCurriculum(e.target.value)} className={selClass}>
                        <option value="">All Syllabuses</option>
                        {curricula.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <select value={fInstrument} onChange={e => setFInstrument(e.target.value)} className={selClass}>
                        <option value="">All Instruments</option>
                        {instruments.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>

                    <select value={fExam} onChange={e => setFExam(e.target.value)} className={selClass}>
                        <option value="">All Tracks</option>
                        <option value="exam">Exam Track</option>
                        <option value="non">Regular Track</option>
                    </select>

                    {centers.length > 1 && (
                        <select value={fCenter} onChange={e => setFCenter(e.target.value)} className={selClass}>
                            <option value="">All Centers</option>
                            {centers.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    )}

                    {anyFilter && (
                        <button onClick={clearFilters} className="flex items-center gap-1.5 px-3 py-2 text-sm font-black text-rose-500 bg-rose-50 rounded-xl hover:bg-rose-100 transition-colors">
                            <X size={13} /> Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-[#463a7a]" size={32} /></div>
                ) : sorted.length === 0 ? (
                    <div className="py-24 text-center">
                        <p className="text-2xl font-black text-slate-200">No students found</p>
                        <p className="text-slate-400 text-sm font-bold mt-1">Try adjusting your search or filters</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className={thClass} onClick={() => sort('name')}>
                                        <span className="flex items-center gap-1">Student <SortIcon col="name" sortConfig={sortConfig} /></span>
                                    </th>
                                    <th className={thClass} onClick={() => sort('instrument')}>
                                        <span className="flex items-center gap-1">Instrument <SortIcon col="instrument" sortConfig={sortConfig} /></span>
                                    </th>
                                    <th className={thClass} onClick={() => sort('current_grade')}>
                                        <span className="flex items-center gap-1">Grade <SortIcon col="current_grade" sortConfig={sortConfig} /></span>
                                    </th>
                                    <th className={thClass} onClick={() => sort('syllabus_type')}>
                                        <span className="flex items-center gap-1">Syllabus <SortIcon col="syllabus_type" sortConfig={sortConfig} /></span>
                                    </th>
                                    <th className={thClass} onClick={() => sort('progress_pct')}>
                                        <span className="flex items-center gap-1">Progress <SortIcon col="progress_pct" sortConfig={sortConfig} /></span>
                                    </th>
                                    <th className={thClass}>Exam</th>
                                    {centers.length > 1 && <th className={thClass}>Center</th>}
                                    <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {sorted.map((s, idx) => {
                                    const instrument = s.instrument || (s.tracks || [])[0]?.instrument || '—';
                                    const teacherName = (s.tracks || [])[0]?.teacher_name || s.teacher_name || null;
                                    return (
                                        <tr key={s.id}
                                            className="hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                                            onClick={() => setProgressFor(s)}
                                        >
                                            {/* Student */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-[10px] font-black flex-shrink-0"
                                                        style={{ backgroundColor: aColor(s.id) }}>
                                                        {initials(s.first_name, s.last_name)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900 group-hover:text-[#463a7a] transition-colors">
                                                            {s.first_name} {s.last_name}
                                                        </p>
                                                        {teacherName && <p className="text-[10px] text-slate-400 font-bold">{teacherName}</p>}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Instrument */}
                                            <td className="px-4 py-3">
                                                <span className="text-sm font-bold text-slate-700">{instrument}</span>
                                            </td>

                                            {/* Grade */}
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-[#463a7a] text-[11px] font-black rounded-lg">
                                                    <GraduationCap size={10} />
                                                    {s.current_grade || 'Debut'}
                                                </span>
                                            </td>

                                            {/* Syllabus */}
                                            <td className="px-4 py-3">
                                                {s.syllabus_type ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-50 text-violet-700 text-[11px] font-black rounded-lg">
                                                        <BookOpen size={10} />
                                                        {s.syllabus_type}
                                                    </span>
                                                ) : <span className="text-slate-300 text-xs font-bold">—</span>}
                                            </td>

                                            {/* Progress */}
                                            <td className="px-4 py-3">
                                                {(s.progress_total > 0) ? (
                                                    <div>
                                                        <ProgressBar pct={s.progress_pct} />
                                                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">{s.progress_done}/{s.progress_total} topics</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-300 text-xs font-bold">No syllabus</span>
                                                )}
                                            </td>

                                            {/* Exam */}
                                            <td className="px-4 py-3">
                                                {s.is_exam_student ? (
                                                    <div>
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-black rounded-lg">
                                                            <Award size={9} /> Exam
                                                        </span>
                                                        {s.exam_date && <p className="text-[10px] text-slate-400 font-bold mt-0.5">{s.exam_date}</p>}
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-slate-400 font-bold">Regular</span>
                                                )}
                                            </td>

                                            {/* Center (multi-center only) */}
                                            {centers.length > 1 && (
                                                <td className="px-4 py-3">
                                                    <span className="text-[11px] font-bold text-slate-500">{s.center_name || '—'}</span>
                                                </td>
                                            )}

                                            {/* Action */}
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={e => { e.stopPropagation(); setProgressFor(s); }}
                                                    className="text-[11px] font-black text-[#463a7a] bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                                                >
                                                    View Progress
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <div className="px-4 py-3 border-t border-slate-50 text-[11px] font-bold text-slate-400">
                            Showing {sorted.length} of {students.length} students
                        </div>
                    </div>
                )}
            </div>

            {/* Progress Modal */}
            {progressFor && (
                <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4">
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setProgressFor(null)} />
                    <div className="relative bg-white rounded-t-[32px] lg:rounded-[32px] w-full lg:max-w-3xl max-h-[92vh] flex flex-col shadow-2xl">
                        <div className="flex items-center justify-between p-5 border-b border-slate-100">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tighter">Progress</h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                    {progressFor.first_name} {progressFor.last_name}
                                    {progressFor.instrument ? ` · ${progressFor.instrument}` : ''}
                                    {progressFor.syllabus_type ? ` · ${progressFor.syllabus_type}` : ''}
                                    {progressFor.current_grade ? ` ${progressFor.current_grade}` : ''}
                                </p>
                            </div>
                            <button onClick={() => setProgressFor(null)}
                                className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
                            <StudentProgressEditor studentIdFromProps={progressFor.id} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
