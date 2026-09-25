import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../lib/api';
import {
    CheckCircle2,
    BookOpen,
    Award,
    Music,
    Zap,
    ChevronDown,
    Loader2,
    Target
} from 'lucide-react';
import { useNavigate } from 'react-router';

const STATUS_CONFIG = {
    'not-yet': {
        label: 'Not Yet',
        bg: 'bg-red-100',
        text: 'text-red-700',
        border: 'border-red-300',
        dot: 'bg-red-500',
        iconBg: 'bg-red-100',
        iconText: 'text-red-400'
    },
    'in-progress': {
        label: 'In Progress',
        bg: 'bg-amber-100',
        text: 'text-amber-700',
        border: 'border-amber-300',
        dot: 'bg-amber-500',
        iconBg: 'bg-amber-100',
        iconText: 'text-amber-500'
    },
    'done': {
        label: 'Done',
        bg: 'bg-emerald-100',
        text: 'text-emerald-700',
        border: 'border-emerald-300',
        dot: 'bg-emerald-500',
        iconBg: 'bg-emerald-500',
        iconText: 'text-white'
    }
};

function CircularProgress({ value, size = 80, strokeWidth = 8 }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90" width={size} height={size}>
                <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.25)" strokeWidth={strokeWidth} fill="none" />
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    stroke="white"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center px-1">
                <span className="font-black text-white leading-none whitespace-nowrap" style={{ fontSize: size * 0.24 }}>{Math.round(value)}%</span>
                <span className="font-black text-white/60 uppercase tracking-widest mt-0.5 whitespace-nowrap" style={{ fontSize: Math.max(6, size * 0.11) }}>Done</span>
            </div>
        </div>
    );
}

// Only rendered when a student has more than one enrolled subject — each
// tab loads that subject's own syllabus/modules/progress independently.
function SubjectTabs({ subjects, current, onSwitch }) {
    return (
        <div className="flex gap-2 overflow-x-auto -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
            {subjects.map(s => (
                <button key={s.subject} onClick={() => onSwitch(s.subject)}
                    className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wide transition-all whitespace-nowrap ${
                        s.subject === current
                            ? 'bg-white text-[#463a7a] shadow-lg'
                            : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                    }`}>
                    {s.subject}
                </button>
            ))}
        </div>
    );
}

export default function StudentProgress() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [switching, setSwitching] = useState(false);
    const [expandedModules, setExpandedModules] = useState({});
    const [gradeHistory, setGradeHistory] = useState([]);
    const [studentId, setStudentId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const student = JSON.parse(localStorage.getItem('student'));
        if (student) {
            setStudentId(student.id);
            fetchProgress(student.id);
            fetchGradeHistory(student.id);
        } else {
            navigate('/student-login');
        }
    }, [navigate]);

    // subject omitted → backend picks the student's first enrolled subject
    // (or falls back to the legacy single-instrument field). Passed
    // explicitly when switching tabs.
    const fetchProgress = async (studentId, subject) => {
        try {
            const res = await api.get(`/students/${studentId}/progress`, { params: subject ? { subject } : {} });
            setData(res.data);
            if (res.data.syllabus?.modules?.length > 0) {
                setExpandedModules({ [res.data.syllabus.modules[0].id]: true });
            } else {
                setExpandedModules({});
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setSwitching(false);
        }
    };

    const switchSubject = (subject) => {
        if (subject === data?.student?.instrument) return;
        setSwitching(true);
        fetchProgress(studentId, subject);
    };

    const fetchGradeHistory = async (studentId) => {
        try {
            const res = await api.get(`/students/${studentId}/grade-history`);
            setGradeHistory(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const toggleModule = (id) => {
        setExpandedModules(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const overallProgress = useMemo(() => {
        if (!data?.syllabus?.modules) return 0;
        let totalWeighted = 0;
        let completedWeighted = 0;
        data.syllabus.modules.forEach(module => {
            const items = module.contents || [];
            const moduleTotal = items.reduce((sum, i) => sum + (i.weight || 1), 0);
            const moduleCompleted = items
                .filter(i => i.progress?.status === 'done')
                .reduce((sum, i) => sum + (i.weight || 1), 0);
            const moduleProgressPct = moduleTotal > 0 ? moduleCompleted / moduleTotal : 0;
            const mWeight = module.weight || 100 / data.syllabus.modules.length;
            completedWeighted += moduleProgressPct * mWeight;
            totalWeighted += mWeight;
        });
        return totalWeighted > 0 ? (completedWeighted / totalWeighted) * 100 : 0;
    }, [data]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="w-10 h-10 text-[#463a7a] animate-spin" />
        </div>
    );

    const enrolledSubjects = data?.student?.enrolled_subjects || [];

    if (!data?.syllabus) return (
        <div className="min-h-screen bg-[#f8fafc]">
            {enrolledSubjects.length > 1 && (
                <div className="bg-gradient-to-br from-[#463a7a] to-[#2d2550] px-5 pt-6 pb-4">
                    <SubjectTabs subjects={enrolledSubjects} current={data.student.instrument} onSwitch={switchSubject} />
                </div>
            )}
            <div className="p-10 sm:p-20 text-center">
                <Music size={48} className="mx-auto text-slate-200 mb-6" />
                <h2 className="text-xl sm:text-2xl font-black text-slate-300 tracking-tighter uppercase">No Curriculum Assigned</h2>
                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mt-2">Talk to your teacher to start your syllabus journey!</p>
            </div>
        </div>
    );

    const calculateModuleProgress = (module) => {
        const total = module.contents.length;
        const done = module.contents.filter(c => c.progress?.status === 'done').length;
        return Math.round((done / total) * 100) || 0;
    };

    const totalItems = data.syllabus.modules.reduce((acc, m) => acc + m.contents.length, 0);
    const completedItems = data.syllabus.modules.reduce(
        (acc, m) => acc + m.contents.filter(c => c.progress?.status === 'done').length, 0
    );
    const inProgressItems = data.syllabus.modules.reduce(
        (acc, m) => acc + m.contents.filter(c => c.progress?.status === 'in-progress').length, 0
    );

    return (
        <div className="pb-24 bg-[#f8fafc] min-h-screen">

            {/* ── Hero ── */}
            <div className="relative bg-gradient-to-br from-[#463a7a] to-[#2d2550] px-5 pt-8 pb-6 overflow-hidden">
                <div className="relative z-10">
                    {enrolledSubjects.length > 1 ? (
                        <div className="mb-3">
                            <SubjectTabs subjects={enrolledSubjects} current={data.student.instrument} onSwitch={switchSubject} />
                        </div>
                    ) : (
                        /* Instrument badge */
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 bg-white/10 border border-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Target className="text-orange-400" size={14} />
                            </div>
                            <div>
                                <p className="text-indigo-200/40 text-[9px] font-black uppercase tracking-widest leading-none">Curriculum Focus</p>
                                <p className="text-sm font-black text-white leading-tight">{data.student.instrument}</p>
                            </div>
                        </div>
                    )}

                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight mb-1">
                        Your Musical Milestones
                    </h1>
                    <p className="text-indigo-100/50 text-xs sm:text-sm font-medium mb-5">{data.syllabus.name}</p>

                    {/* Overall + grade */}
                    <div className={`flex items-center gap-4 bg-white/10 border border-white/10 rounded-2xl p-4 transition-opacity ${switching ? 'opacity-50' : ''}`}>
                        <CircularProgress value={overallProgress} size={56} strokeWidth={5} />
                        <div className="flex-1 min-w-0">
                            <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">Overall Mastery</p>
                            <p className="text-white text-lg font-black leading-tight">{data.student.grade} Grade</p>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white rounded-xl px-3 py-2 flex-shrink-0">
                            <Award className="text-yellow-400 fill-current" size={14} />
                            <span className="text-slate-900 text-sm font-black">{data.student.grade}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Stats tiles ── */}
            <div className="px-4 pt-4">
                <div className="grid grid-cols-3 gap-2 max-w-2xl mx-auto lg:max-w-4xl">
                    {[
                        { label: 'Complete',    value: completedItems,  color: 'text-emerald-600' },
                        { label: 'In Progress', value: inProgressItems, color: 'text-amber-500'   },
                        { label: 'Total',       value: totalItems,      color: 'text-[#463a7a]'   },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="bg-white border border-slate-100 rounded-xl p-3 text-center shadow-sm">
                            <p className={`text-lg font-black leading-none ${color}`}>{value}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Modules List ── */}
            <div className="px-4 pt-5 space-y-3 max-w-2xl mx-auto lg:max-w-4xl">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-4">
                    <BookOpen size={15} className="text-[#463a7a]" /> Syllabus Modules
                </h2>
                <div className="space-y-3">
                    {data.syllabus.modules.map(module => {
                        const isOpen = expandedModules[module.id];
                        const progressPct = calculateModuleProgress(module);
                        const moduleDone = module.contents.filter(c => c.progress?.status === 'done').length;
                        const moduleInProgress = module.contents.filter(c => c.progress?.status === 'in-progress').length;

                        const isComplete = progressPct === 100;
                        const hasStarted = moduleDone > 0 || moduleInProgress > 0;
                        const iconCls = isComplete
                            ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                            : isOpen
                            ? 'bg-[#463a7a] text-white shadow-sm shadow-indigo-900/30'
                            : hasStarted
                            ? 'bg-amber-50 text-amber-500'
                            : 'bg-slate-50 text-slate-300 group-hover:bg-indigo-50 group-hover:text-[#463a7a]';
                        const barCls = isComplete ? 'from-emerald-400 to-emerald-500' : 'from-indigo-500 to-purple-500';

                        return (
                            <div key={module.id} className={`bg-white rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-md ${isOpen ? 'border-[#463a7a]/25 shadow-lg shadow-indigo-900/5' : isComplete ? 'border-emerald-100 shadow-sm' : 'border-slate-100 shadow-sm'}`}>
                                <button onClick={() => toggleModule(module.id)}
                                    className="w-full text-left p-4 flex items-center gap-3.5 group">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${iconCls}`}>
                                        {isComplete ? <CheckCircle2 size={18} /> : <Zap size={16} className={isOpen ? 'fill-current' : ''} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Module {module.order}</p>
                                            {isComplete && (
                                                <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-[1px] rounded-full uppercase tracking-wide">Complete</span>
                                            )}
                                        </div>
                                        <p className="text-[15px] font-black text-slate-900 group-hover:text-[#463a7a] transition-colors truncate leading-snug">{module.name}</p>
                                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                            <span className="text-[9px] font-black text-emerald-600">{moduleDone} done</span>
                                            {moduleInProgress > 0 && <span className="text-[9px] font-black text-amber-500">{moduleInProgress} in progress</span>}
                                            <span className="text-[9px] font-black text-slate-300">/ {module.contents.length} total</span>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 flex flex-col items-end gap-1.5 mr-1">
                                        <span className={`text-sm font-black ${isComplete ? 'text-emerald-600' : 'text-[#463a7a]'}`}>{progressPct}%</span>
                                        <div className="w-16 sm:w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className={`h-full bg-gradient-to-r ${barCls} rounded-full transition-all duration-700`}
                                                style={{ width: `${progressPct}%` }} />
                                        </div>
                                    </div>
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isOpen ? 'rotate-180 bg-[#463a7a]/10 text-[#463a7a]' : 'bg-slate-50 text-slate-300'}`}>
                                        <ChevronDown size={15} />
                                    </div>
                                </button>

                                {isOpen && (
                                    <div className="border-t border-slate-50 divide-y divide-slate-50">
                                        {module.contents.map(content => {
                                            const status = content.progress?.status || 'not-yet';
                                            const cfg = STATUS_CONFIG[status];
                                            return (
                                                <div key={content.id} className="flex items-center gap-3 px-4 py-3">
                                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.iconBg}`}>
                                                        {status === 'done'
                                                            ? <CheckCircle2 size={14} className="text-white" />
                                                            : status === 'in-progress'
                                                            ? <Zap size={14} className={cfg.iconText} />
                                                            : <Music size={14} className={cfg.iconText} />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-black text-slate-800 truncate">{content.name}</p>
                                                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                            {content.content_type && (
                                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{content.content_type}</span>
                                                            )}
                                                            {content.progress?.completed_at && (
                                                                <span className="text-[9px] text-emerald-600 font-black">
                                                                    ✓ {new Date(content.progress.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                                                </span>
                                                            )}
                                                            {content.progress?.notes && (
                                                                <span className="text-[9px] text-slate-400 italic truncate max-w-[120px]">{content.progress.notes}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span className={`flex-shrink-0 flex items-center gap-1 text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-md ${cfg.bg} ${cfg.text}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                                        {cfg.label}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Grade Journey ── */}
            {gradeHistory.length > 0 && (
                <div className="px-4 pt-2 pb-6 max-w-2xl mx-auto lg:max-w-4xl">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="flex items-center gap-3 p-4 border-b border-slate-50">
                            <div className="w-9 h-9 rounded-xl bg-yellow-50 flex items-center justify-center flex-shrink-0">
                                <Award className="text-yellow-500 fill-current" size={18} />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Your Journey</p>
                                <p className="text-sm font-black text-slate-900">Grade History</p>
                            </div>
                        </div>
                        <div className="p-4 space-y-0">
                            {gradeHistory.map((h, i) => (
                                <div key={h.id} className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white font-black text-[10px] ${h.change_type === 'auto_promote' ? 'bg-emerald-500' : 'bg-[#463a7a]'}`}>
                                            {h.change_type === 'auto_promote' ? '★' : '↑'}
                                        </div>
                                        {i < gradeHistory.length - 1 && <div className="w-px flex-1 bg-slate-100 my-1" />}
                                    </div>
                                    <div className="pb-4 flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                            {h.from_grade && <span className="text-xs text-slate-400 font-bold">{h.from_grade} →</span>}
                                            <span className="text-xs font-black text-slate-900">{h.to_grade}</span>
                                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wide ${h.change_type === 'auto_promote' ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'}`}>
                                                {h.change_type === 'auto_promote' ? 'Promoted' : 'Updated'}
                                            </span>
                                        </div>
                                        {h.notes && <p className="text-[10px] text-slate-500 mt-0.5 italic">{h.notes}</p>}
                                        <p className="text-[9px] text-slate-300 font-bold mt-0.5 uppercase tracking-widest">
                                            {new Date(h.changed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            {h.changed_by && ` · ${h.changed_by}`}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
