import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../../lib/api';
import { useAppData } from '../../context/AppDataContext';
import StudentProgressEditor from '../StudentProgressEditor';
import {
    Search, X, Loader2, GraduationCap, BookOpen, Award,
    TrendingUp, Users, RefreshCw, Music, ChevronRight,
    BarChart2, UserCheck,
} from 'lucide-react';

const PALETTE = ['#6366f1','#10b981','#f97316','#ec4899','#8b5cf6','#3b82f6','#ef4444','#14b8a6','#f59e0b','#06b6d4'];
const aColor  = (id) => PALETTE[(id || 0) % PALETTE.length];
const initials = (f, l) => `${(f || '?')[0]}${(l || '')[0] || ''}`.toUpperCase();

function Avatar({ id, first, last, size = 40 }) {
    return (
        <div
            className="rounded-2xl flex items-center justify-center text-white font-black flex-shrink-0 shadow-sm"
            style={{ width: size, height: size, backgroundColor: aColor(id), fontSize: size * 0.3 }}
        >
            {initials(first, last)}
        </div>
    );
}

function Ring({ pct, size = 48 }) {
    const p = Math.min(100, Math.max(0, pct || 0));
    const r = (size - 6) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (p / 100) * circ;
    const color = p >= 75 ? '#10b981' : p >= 40 ? '#f59e0b' : '#f97316';
    return (
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={5} />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5}
                    strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] font-black text-slate-700 leading-none">{p}%</span>
            </div>
        </div>
    );
}

function Bar({ pct }) {
    const p = Math.min(100, Math.max(0, pct || 0));
    const color = p >= 75 ? '#10b981' : p >= 40 ? '#f59e0b' : '#f97316';
    return (
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${p}%`, backgroundColor: color }} />
        </div>
    );
}

function InstructorLoad({ students }) {
    const instructors = useMemo(() => {
        const map = {};
        students.forEach(s => {
            (s.tracks || []).forEach(t => {
                if (!t.teacher_name) return;
                if (!map[t.teacher_name]) map[t.teacher_name] = { name: t.teacher_name, count: 0 };
                map[t.teacher_name].count++;
            });
            if (!s.tracks?.length && s.teacher_name) {
                if (!map[s.teacher_name]) map[s.teacher_name] = { name: s.teacher_name, count: 0 };
                map[s.teacher_name].count++;
            }
        });
        return Object.values(map).sort((a, b) => b.count - a.count);
    }, [students]);

    const max = instructors[0]?.count || 1;

    if (!instructors.length) return null;
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4 sticky top-6">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <UserCheck size={15} className="text-[#463a7a]" />
                </div>
                <h3 className="text-sm font-black text-slate-900">Instructor Load</h3>
            </div>
            <div className="space-y-3">
                {instructors.map((t) => (
                    <div key={t.name}>
                        <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[9px] font-black"
                                    style={{ backgroundColor: aColor(t.name.charCodeAt(0)) }}>
                                    {t.name[0]?.toUpperCase()}
                                </div>
                                <span className="text-xs font-bold text-slate-700 truncate max-w-[120px]">{t.name}</span>
                            </div>
                            <span className="text-xs font-black text-[#463a7a] bg-indigo-50 rounded-lg px-2 py-0.5">{t.count}</span>
                        </div>
                        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-[#463a7a] transition-all"
                                style={{ width: `${(t.count / max) * 100}%` }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function StudentCard({ s, centers, onClick }) {
    const tracks = s.tracks || [];
    const noClasses = tracks.length === 0 && !s.teacher_name;
    const hasProgress = s.progress_total > 0;
    const pct = s.progress_pct || 0;

    return (
        <div
            onClick={onClick}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-[#463a7a]/20 transition-all duration-200 cursor-pointer group p-4"
        >
            <div className="flex items-start gap-3">
                {/* Avatar */}
                <Avatar id={s.id} first={s.first_name} last={s.last_name} size={44} />

                {/* Main content */}
                <div className="flex-1 min-w-0">
                    {/* Name row */}
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <h3 className="text-sm font-black text-slate-900 group-hover:text-[#463a7a] transition-colors truncate">
                                {s.first_name} {s.last_name}
                            </h3>
                            <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">{s.email}</p>
                        </div>
                        {/* Progress ring */}
                        <Ring pct={pct} size={44} />
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {s.current_grade && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-[#463a7a] text-[10px] font-black rounded-lg">
                                <GraduationCap size={9} /> {s.current_grade}
                            </span>
                        )}
                        {s.syllabus_type && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-50 text-violet-700 text-[10px] font-black rounded-lg">
                                <BookOpen size={9} /> {s.syllabus_type}
                            </span>
                        )}
                        {s.is_exam_student && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-black rounded-lg">
                                <Award size={9} /> Exam
                            </span>
                        )}
                        {centers.length > 1 && s.center_name && (
                            <span className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[10px] font-bold rounded-lg">{s.center_name}</span>
                        )}
                    </div>

                    {/* Tracks / teachers */}
                    {noClasses ? (
                        <p className="mt-2.5 text-[10px] font-black text-rose-500 uppercase tracking-wider">No classes assigned</p>
                    ) : (
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {tracks.slice(0, 3).map((t, i) => (
                                <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 text-slate-600 text-[10px] font-bold rounded-lg border border-slate-100">
                                    <Music size={8} className="text-[#463a7a]" />
                                    {t.instrument || t.subject}
                                    {t.teacher_name && <span className="text-slate-400 ml-0.5">· {t.teacher_name}</span>}
                                </span>
                            ))}
                            {tracks.length > 3 && (
                                <span className="px-2 py-1 text-[10px] font-bold text-slate-400 bg-slate-50 rounded-lg">+{tracks.length - 3}</span>
                            )}
                        </div>
                    )}

                    {/* Progress bar */}
                    <div className="mt-3 space-y-1">
                        <Bar pct={pct} />
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-medium">
                                {hasProgress ? `${s.progress_done}/${s.progress_total} topics` : 'No syllabus'}
                            </span>
                            <span className="text-[10px] font-black text-[#463a7a] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                View progress <ChevronRight size={10} />
                            </span>
                        </div>
                    </div>
                </div>
            </div>
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

    const curricula  = useMemo(() => [...new Set([...appCurricula, ...students.map(s => s.syllabus_type).filter(Boolean)])], [students, appCurricula]);
    const instruments = useMemo(() => [...new Set(students.map(s => s.instrument || (s.tracks || [])[0]?.instrument).filter(Boolean))].sort(), [students]);
    const centers    = useMemo(() => [...new Set(students.map(s => s.center_name).filter(Boolean))].sort(), [students]);
    const grades     = useMemo(() => [...new Set(students.map(s => s.current_grade).filter(Boolean))].sort(), [students]);

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

    const stats = useMemo(() => ({
        total: students.length,
        shown: filtered.length,
        exam: students.filter(s => s.is_exam_student).length,
        avgPct: students.length ? Math.round(students.reduce((a, s) => a + (s.progress_pct || 0), 0) / students.length) : 0,
    }), [students, filtered]);

    const selClass = "bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#463a7a]/15 appearance-none cursor-pointer hover:border-[#463a7a]/30 transition-colors";

    return (
        <div className="min-h-screen bg-[#f4f6fb] p-4 lg:p-8">

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Student Progress</h1>
                    <p className="text-slate-400 text-sm mt-0.5">Curriculum progress across all enrolled students</p>
                </div>
                <button onClick={load}
                    className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold hover:border-[#463a7a]/30 hover:text-[#463a7a] transition-colors shadow-sm">
                    <RefreshCw size={13} /> Refresh
                </button>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {[
                    { icon: Users,     label: 'Total',     value: stats.total,       bg: 'bg-[#463a7a]', fg: 'text-white', ibg: 'bg-white/20', ic: 'text-white' },
                    { icon: BarChart2, label: 'Showing',   value: stats.shown,       bg: 'bg-white', fg: 'text-slate-900', ibg: 'bg-slate-100', ic: 'text-slate-500' },
                    { icon: Award,     label: 'Exam Track',value: stats.exam,        bg: 'bg-white', fg: 'text-slate-900', ibg: 'bg-amber-50', ic: 'text-amber-600' },
                    { icon: TrendingUp,label: 'Avg Progress',value:`${stats.avgPct}%`,bg:'bg-white', fg:'text-slate-900',  ibg:'bg-emerald-50', ic:'text-emerald-600' },
                ].map(({ icon: Icon, label, value, bg, fg, ibg, ic }) => (
                    <div key={label} className={`${bg} rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3`}>
                        <div className={`w-9 h-9 ${ibg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                            <Icon size={16} className={ic} />
                        </div>
                        <div>
                            <p className={`text-xl font-black leading-none ${fg}`}>{value}</p>
                            <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${fg === 'text-white' ? 'text-white/60' : 'text-slate-400'}`}>{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex gap-6 items-start">
                {/* Main column */}
                <div className="flex-1 min-w-0 space-y-4">
                    {/* Search + filters */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3">
                        <div className="flex flex-wrap gap-2">
                            <div className="relative flex-1 min-w-[180px]">
                                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search name, email, instrument…"
                                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#463a7a]/15"
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
                                <option value="non">Regular</option>
                            </select>
                            {centers.length > 1 && (
                                <select value={fCenter} onChange={e => setFCenter(e.target.value)} className={selClass}>
                                    <option value="">All Centers</option>
                                    {centers.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            )}
                            {anyFilter && (
                                <button onClick={clearFilters}
                                    className="flex items-center gap-1 px-3 py-2 text-xs font-black text-rose-500 bg-rose-50 rounded-xl hover:bg-rose-100 transition-colors border border-rose-100">
                                    <X size={12} /> Clear
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Count label */}
                    {!loading && (
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">
                            {filtered.length} {filtered.length === 1 ? 'student' : 'students'}
                            {anyFilter && ` · filtered from ${students.length}`}
                        </p>
                    )}

                    {/* Cards */}
                    {loading ? (
                        <div className="flex items-center justify-center py-32">
                            <Loader2 className="animate-spin text-[#463a7a]" size={28} />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
                            <p className="text-slate-200 text-3xl font-black">No students</p>
                            <p className="text-slate-400 text-sm font-bold mt-1">Adjust your search or filters</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filtered.map(s => (
                                <StudentCard
                                    key={s.id}
                                    s={s}
                                    centers={centers}
                                    onClick={() => setProgressFor(s)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Instructor Load sidebar */}
                <div className="w-56 flex-shrink-0 hidden lg:block">
                    <InstructorLoad students={students} />
                </div>
            </div>

            {/* Progress modal */}
            {progressFor && (
                <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4">
                    <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-md" onClick={() => setProgressFor(null)} />
                    <div className="relative bg-white rounded-t-[32px] lg:rounded-[32px] w-full lg:max-w-3xl max-h-[92vh] flex flex-col shadow-2xl">
                        <div className="flex items-center gap-3 p-5 border-b border-slate-100">
                            <Avatar id={progressFor.id} first={progressFor.first_name} last={progressFor.last_name} size={40} />
                            <div className="flex-1 min-w-0">
                                <h2 className="text-base font-black text-slate-900">
                                    {progressFor.first_name} {progressFor.last_name}
                                </h2>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                    {[progressFor.instrument, progressFor.syllabus_type, progressFor.current_grade].filter(Boolean).join(' · ')}
                                </p>
                            </div>
                            <button onClick={() => setProgressFor(null)}
                                className="w-9 h-9 flex items-center justify-center bg-slate-50 rounded-xl hover:bg-red-50 hover:text-red-500 transition-colors flex-shrink-0">
                                <X size={16} />
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
