import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../lib/api';
import {
    TrendingUp,
    CheckCircle2,
    BookOpen,
    Award,
    Music,
    Zap,
    ChevronDown,
    Loader2,
    Target,
    Clock
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
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-base font-black text-white leading-none">{Math.round(value)}%</span>
                <span className="text-[8px] font-black text-white/60 uppercase tracking-widest mt-0.5">Done</span>
            </div>
        </div>
    );
}

export default function StudentProgress() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedModules, setExpandedModules] = useState({});
    const [gradeHistory, setGradeHistory] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const student = JSON.parse(localStorage.getItem('student'));
        if (student) {
            fetchProgress(student.id);
            fetchGradeHistory(student.id);
        } else {
            navigate('/student-login');
        }
    }, [navigate]);

    const fetchProgress = async (studentId) => {
        try {
            const res = await api.get(`/students/${studentId}/progress`);
            setData(res.data);
            if (res.data.syllabus?.modules?.length > 0) {
                setExpandedModules({ [res.data.syllabus.modules[0].id]: true });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
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

    if (!data?.syllabus) return (
        <div className="p-10 sm:p-20 text-center">
            <Music size={48} className="mx-auto text-slate-200 mb-6" />
            <h2 className="text-xl sm:text-2xl font-black text-slate-300 tracking-tighter uppercase">No Curriculum Assigned</h2>
            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mt-2">Talk to your teacher to start your syllabus journey!</p>
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
        <div className="p-4 sm:p-6 lg:p-12 max-w-7xl mx-auto space-y-8 lg:space-y-12 pb-24">

            {/* Header */}
            <div className="relative bg-[#463a7a] rounded-[32px] sm:rounded-[50px] p-6 sm:p-10 lg:p-16 overflow-hidden shadow-2xl shadow-indigo-900/40">
                <div className="absolute top-0 right-0 p-6 opacity-5 scale-110">
                    <TrendingUp className="w-48 h-48 sm:w-64 sm:h-64 lg:w-96 lg:h-96 text-white fill-current" />
                </div>

                <div className="relative z-10 flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:items-center lg:gap-12">
                    {/* Left: Title */}
                    <div>
                        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                            <div className="w-11 h-11 sm:w-16 sm:h-16 bg-white/10 backdrop-blur-md rounded-[16px] sm:rounded-[22px] flex items-center justify-center border border-white/10 flex-shrink-0">
                                <Target className="text-orange-400" size={20} />
                            </div>
                            <div>
                                <p className="text-indigo-200/40 text-[9px] sm:text-[10px] font-black uppercase tracking-widest leading-none mb-1">Curriculum Focus</p>
                                <h2 className="text-lg sm:text-3xl font-black text-white tracking-tighter leading-none">{data.student.instrument}</h2>
                            </div>
                        </div>
                        <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black text-white tracking-tighter leading-[0.85] mb-4 sm:mb-6">
                            Your Musical<br />
                            <span className="text-indigo-300">Milestones.</span>
                        </h1>
                        <p className="text-indigo-100/50 text-sm font-medium">{data.syllabus.name}</p>
                    </div>

                    {/* Right: Stats Cards */}
                    <div className="grid grid-cols-3 gap-3 sm:gap-5">
                        {/* Overall Progress Circle */}
                        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-[20px] sm:rounded-[36px] p-4 sm:p-7 flex flex-col items-center justify-center gap-2">
                            <CircularProgress value={overallProgress} size={64} strokeWidth={7} />
                            <p className="text-white/50 text-[9px] font-black uppercase tracking-widest text-center leading-tight">Overall</p>
                        </div>

                        {/* Current Grade */}
                        <div className="bg-white rounded-[20px] sm:rounded-[36px] p-4 sm:p-7 shadow-2xl flex flex-col justify-center">
                            <Award className="text-yellow-400 mb-2 sm:mb-3 fill-current" size={22} />
                            <p className="text-lg sm:text-3xl font-black text-slate-900 leading-none">{data.student.grade}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 leading-tight">Grade</p>
                        </div>

                        {/* Items Completed */}
                        <div className="bg-white/10 backdrop-blur-md border border-white/5 rounded-[20px] sm:rounded-[36px] p-4 sm:p-7 flex flex-col justify-center">
                            <CheckCircle2 className="text-emerald-400 mb-2 sm:mb-3" size={22} />
                            <p className="text-lg sm:text-3xl font-black text-white leading-none">{completedItems}</p>
                            <p className="text-indigo-200/40 text-[9px] font-black uppercase tracking-widest mt-1 leading-tight">Done</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Stats Row */}
            <div className="grid grid-cols-3 gap-3 sm:gap-5">
                <div className="bg-white rounded-[20px] sm:rounded-[28px] p-4 sm:p-6 shadow-sm border border-slate-100 flex items-center gap-3 sm:gap-5">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="text-emerald-600" size={18} />
                    </div>
                    <div>
                        <p className="text-lg sm:text-2xl font-black text-slate-900 leading-none">{completedItems}</p>
                        <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Completed</p>
                    </div>
                </div>
                <div className="bg-white rounded-[20px] sm:rounded-[28px] p-4 sm:p-6 shadow-sm border border-slate-100 flex items-center gap-3 sm:gap-5">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <Zap className="text-amber-500 fill-current" size={18} />
                    </div>
                    <div>
                        <p className="text-lg sm:text-2xl font-black text-slate-900 leading-none">{inProgressItems}</p>
                        <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">In Progress</p>
                    </div>
                </div>
                <div className="bg-white rounded-[20px] sm:rounded-[28px] p-4 sm:p-6 shadow-sm border border-slate-100 flex items-center gap-3 sm:gap-5">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="text-slate-500" size={18} />
                    </div>
                    <div>
                        <p className="text-lg sm:text-2xl font-black text-slate-900 leading-none">{totalItems}</p>
                        <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Total Items</p>
                    </div>
                </div>
            </div>

            {/* Status Legend */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 px-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status key:</span>
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <div key={key} className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border text-[10px] sm:text-xs font-black ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                        {cfg.label}
                    </div>
                ))}
            </div>

            {/* Modules List */}
            <div className="space-y-5 sm:space-y-6 lg:space-y-8">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter px-1 flex items-center gap-3">
                    <BookOpen className="text-[#463a7a] flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6" />
                    SYLLABUS MODULES
                </h2>

                <div className="space-y-3 sm:space-y-5">
                    {data.syllabus.modules.map(module => {
                        const isOpen = expandedModules[module.id];
                        const progressPct = calculateModuleProgress(module);
                        const moduleDone = module.contents.filter(c => c.progress?.status === 'done').length;
                        const moduleInProgress = module.contents.filter(c => c.progress?.status === 'in-progress').length;

                        return (
                            <div key={module.id} className={`bg-white rounded-[28px] sm:rounded-[40px] border transition-all duration-500 overflow-hidden ${isOpen ? 'border-[#463a7a] shadow-2xl shadow-indigo-900/10' : 'border-slate-100 shadow-xl shadow-slate-200/50'}`}>
                                <button
                                    onClick={() => toggleModule(module.id)}
                                    className="w-full text-left p-5 sm:p-8 lg:p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 group"
                                >
                                    <div className="flex items-center gap-3 sm:gap-6">
                                        <div className={`w-11 h-11 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl flex items-center justify-center transition-all flex-shrink-0 ${isOpen ? 'bg-[#463a7a] text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-[#463a7a]/5 group-hover:text-[#463a7a]'}`}>
                                            <Zap size={20} className={isOpen ? 'fill-current' : ''} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Module {module.order}</p>
                                            <h3 className="text-base sm:text-2xl font-black text-slate-900 tracking-tight leading-none group-hover:text-[#463a7a] transition-colors">{module.name}</h3>
                                            <div className="flex items-center gap-2 sm:gap-3 mt-1.5">
                                                <span className="text-[9px] sm:text-[10px] font-black text-emerald-600">{moduleDone} done</span>
                                                {moduleInProgress > 0 && (
                                                    <span className="text-[9px] sm:text-[10px] font-black text-amber-600">{moduleInProgress} in progress</span>
                                                )}
                                                <span className="text-[9px] sm:text-[10px] font-black text-slate-400">{module.contents.length} total</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 sm:gap-6">
                                        <div className="flex flex-col items-start sm:items-end flex-1 sm:flex-none">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress</span>
                                                <span className="text-sm font-black text-[#463a7a]">{progressPct}%</span>
                                            </div>
                                            <div className="w-32 sm:w-48 h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                                <div
                                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-1000 ease-out"
                                                    style={{ width: `${progressPct}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}>
                                            <ChevronDown size={18} />
                                        </div>
                                    </div>
                                </button>

                                {isOpen && (
                                    <div className="px-4 sm:px-8 lg:px-10 pb-5 sm:pb-8 lg:pb-10 pt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-in slide-in-from-top-4 duration-500">
                                        {module.contents.map(content => {
                                            const status = content.progress?.status || 'not-yet';
                                            const cfg = STATUS_CONFIG[status];
                                            return (
                                                <div
                                                    key={content.id}
                                                    className={`p-4 sm:p-5 rounded-[20px] sm:rounded-[28px] border flex items-center gap-3 sm:gap-4 transition-all ${cfg.bg} ${cfg.border}`}
                                                >
                                                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.iconBg}`}>
                                                        {status === 'done' ? (
                                                            <CheckCircle2 size={18} className="text-white" />
                                                        ) : status === 'in-progress' ? (
                                                            <Zap size={18} className={cfg.iconText} />
                                                        ) : (
                                                            <Music size={18} className={cfg.iconText} />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className={`text-xs sm:text-sm font-black truncate ${cfg.text}`}>{content.name}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{content.content_type}</p>
                                                            <span className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest ${cfg.text}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                                                                {cfg.label}
                                                            </span>
                                                        </div>
                                                        {content.progress?.completed_at && (
                                                            <p className="text-[9px] text-emerald-600 font-black mt-0.5">
                                                                ✓ {new Date(content.progress.completed_at).toLocaleDateString()}
                                                            </p>
                                                        )}
                                                        {content.progress?.notes && (
                                                            <p className="text-[9px] text-slate-500 mt-0.5 italic truncate">{content.progress.notes}</p>
                                                        )}
                                                    </div>
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

            {/* Grade Journey */}
            {gradeHistory.length > 0 && (
                <div className="bg-white rounded-[28px] sm:rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                    <div className="p-5 sm:p-8 lg:p-10 border-b border-slate-50">
                        <div className="flex items-center gap-3 sm:gap-6">
                            <div className="w-11 h-11 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-yellow-50 flex items-center justify-center flex-shrink-0">
                                <Award className="text-yellow-500 fill-current" size={22} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Your Journey</p>
                                <h3 className="text-base sm:text-2xl font-black text-slate-900 tracking-tight">Grade History</h3>
                            </div>
                        </div>
                    </div>
                    <div className="p-5 sm:p-8 lg:p-10">
                        <div className="space-y-4">
                            {gradeHistory.map((h, i) => (
                                <div key={h.id} className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white font-black text-xs ${h.change_type === 'auto_promote' ? 'bg-emerald-500' : 'bg-[#463a7a]'}`}>
                                            {h.change_type === 'auto_promote' ? '★' : '↑'}
                                        </div>
                                        {i < gradeHistory.length - 1 && <div className="w-px flex-1 bg-slate-100 mt-2 mb-1" />}
                                    </div>
                                    <div className="pb-4 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {h.from_grade && (
                                                <span className="text-sm text-slate-400 font-bold">{h.from_grade} →</span>
                                            )}
                                            <span className="text-sm font-black text-slate-900">{h.to_grade}</span>
                                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wide ${h.change_type === 'auto_promote' ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'}`}>
                                                {h.change_type === 'auto_promote' ? 'Promoted' : 'Updated'}
                                            </span>
                                        </div>
                                        {h.notes && <p className="text-xs text-slate-500 mt-0.5 italic">{h.notes}</p>}
                                        <p className="text-[10px] text-slate-300 font-bold mt-1 uppercase tracking-widest">
                                            {new Date(h.changed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
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
