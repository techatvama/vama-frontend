import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { parseSubject } from '../../lib/utils';
import {
    Calendar,
    BookOpen,
    FileText,
    TrendingUp,
    CheckCircle2,
    Clock,
    ArrowUpRight,
    Music,
    Zap,
    Award,
    ChevronRight,
    Loader2,
    Users,
    Package,
    AlertTriangle
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { useNavigate } from 'react-router';

export default function StudentDashboard() {
    const [student, setStudent] = useState(null);
    const [todaySessions, setTodaySessions] = useState([]);
    const [progress, setProgress] = useState(null);
    const [materials, setMaterials] = useState([]);
    const [activePackage, setActivePackage] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const [studentId, setStudentId] = useState(null);

    useEffect(() => {
        const stored = localStorage.getItem('student');
        if (stored) {
            const s = JSON.parse(stored);
            setStudent(s);
            setStudentId(s.id);
        } else {
            navigate('/student-login');
        }
    }, [navigate]);

    const fetchDashboardData = useCallback(async (isRefresh = false) => {
        if (!studentId) return;
        if (!isRefresh) setLoading(true);
        try {
            const today = format(new Date(), 'yyyy-MM-dd');
            const [sessionsRes, progressRes, materialsRes, paymentsRes] = await Promise.all([
                api.get(`/student/${studentId}/sessions`, { params: { start: today, end: today } }),
                api.get(`/students/${studentId}/progress`),
                api.get(`/students/${studentId}/materials`),
                api.get(`/student/${studentId}/payments`),
            ]);
            setTodaySessions(sessionsRes.data);
            setProgress(progressRes.data);
            setMaterials(materialsRes.data);
            setActivePackage(paymentsRes.data?.active_package || null);
        } catch (err) {
            console.error(err);
        } finally {
            if (!isRefresh) setLoading(false);
        }
    }, [studentId]);

    useEffect(() => { if (studentId) fetchDashboardData(); }, [studentId, fetchDashboardData]);
    useAutoRefresh(fetchDashboardData, 30000);

    const calculateOverallProgress = () => {
        if (!progress?.syllabus?.modules) return 0;
        const modules = progress.syllabus.modules;
        let totalWeighted = 0;
        let completedWeighted = 0;
        modules.forEach(module => {
            const items = module.contents || [];
            const moduleTotal = items.reduce((sum, i) => sum + (i.weight || 1), 0);
            const moduleCompleted = items
                .filter(i => i.progress?.status === 'done')
                .reduce((sum, i) => sum + (i.weight || 1), 0);
            const modulePct = moduleTotal > 0 ? moduleCompleted / moduleTotal : 0;
            const mWeight = module.weight || 100 / modules.length;
            completedWeighted += modulePct * mWeight;
            totalWeighted += mWeight;
        });
        return totalWeighted > 0 ? Math.round((completedWeighted / totalWeighted) * 100) : 0;
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
            <Loader2 className="w-10 h-10 text-[#463a7a] animate-spin" />
        </div>
    );

    if (!student) return null;

    const overallProgress = calculateOverallProgress();

    return (
        <div className="p-4 sm:p-6 lg:p-12 max-w-7xl mx-auto space-y-8 lg:space-y-12 pb-20">
            {/* Welcome Section */}
            <div className="relative bg-[#463a7a] rounded-[32px] sm:rounded-[50px] p-6 sm:p-10 lg:p-16 overflow-hidden shadow-2xl shadow-indigo-900/40 group hover:shadow-[#463a7a]/60 transition-all duration-500">
                <div className="absolute top-0 right-0 p-6 opacity-5 scale-125 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                    <Music className="w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 text-white fill-current" />
                </div>

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-10">
                    <div className="space-y-3 sm:space-y-4">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <div className="px-4 sm:px-5 py-2 bg-orange-500 rounded-full flex items-center gap-2 shadow-lg shadow-orange-900/20">
                                <Award size={13} className="text-white" />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">{progress?.student?.grade || 'Debut'} Grade</span>
                            </div>
                            <span className="text-white/40 font-bold text-[10px] sm:text-xs uppercase tracking-widest">{format(new Date(), 'EEEE, MMMM do')}</span>
                        </div>
                        <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black text-white tracking-tighter leading-[0.85]">
                            Ready to practice,<br />
                            <span className="text-indigo-300">{student.first_name}?</span>
                        </h1>
                        <p className="text-indigo-100/60 font-medium text-sm sm:text-lg max-w-md">
                            You have {todaySessions.length === 0 ? 'no' : todaySessions.length} sessions scheduled for today. Keep up the momentum!
                        </p>
                    </div>

                    <div className="p-1.5 bg-white/10 backdrop-blur-md rounded-[32px] sm:rounded-[40px] border border-white/10 shadow-inner self-start lg:self-auto">
                        <div className="bg-white rounded-[24px] sm:rounded-[32px] p-5 sm:p-8 flex items-center gap-5 sm:gap-8 shadow-2xl">
                            <div className="relative flex-shrink-0">
                                <svg className="w-16 h-16 sm:w-24 sm:h-24 transform -rotate-90">
                                    <circle cx="32" cy="32" r="26" stroke="#f1f5f9" strokeWidth="6" fill="none" className="sm:hidden" />
                                    <circle cx="32" cy="32" r="26" stroke="#463a7a" strokeWidth="6" fill="none" strokeDasharray={163} strokeDashoffset={163 - (163 * overallProgress) / 100} strokeLinecap="round" className="transition-all duration-1000 ease-out sm:hidden" />
                                    <circle cx="48" cy="48" r="42" stroke="#f1f5f9" strokeWidth="8" fill="none" className="hidden sm:block" />
                                    <circle cx="48" cy="48" r="42" stroke="#463a7a" strokeWidth="8" fill="none" strokeDasharray={264} strokeDashoffset={264 - (264 * overallProgress) / 100} strokeLinecap="round" className="transition-all duration-1000 ease-out hidden sm:block" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-base sm:text-xl font-black text-slate-900 leading-none">{overallProgress}%</span>
                                    <span className="text-[7px] sm:text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Syllabus</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Overall Mastery</p>
                                <h3 className="text-lg sm:text-2xl font-black text-slate-900 leading-tight">Vama Excellence</h3>
                                <button onClick={() => navigate('/student-portal/progress')} className="text-[#463a7a] font-black text-[10px] uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all mt-2">
                                    View Progress <ChevronRight size={12} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">

                {/* Today's Classes */}
                <div className="xl:col-span-2 space-y-5 sm:space-y-8">
                    <div className="flex items-center justify-between px-1 sm:px-2">
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-3 sm:gap-4">
                            <Calendar className="text-[#463a7a] w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />
                            TODAY'S SCHEDULE
                        </h2>
                        <button onClick={() => navigate('/student-portal/schedule')} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#463a7a] transition-colors whitespace-nowrap">Full Calendar</button>
                    </div>

                    {todaySessions.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            {todaySessions.map(session => (
                                <div key={session.id} className="bg-white rounded-[28px] sm:rounded-[40px] p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-50 flex flex-col justify-between group hover:border-[#463a7a] transition-all duration-500 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#463a7a]/5 rounded-bl-[80px] -mr-8 -mt-8 group-hover:bg-[#463a7a]/10 transition-colors" />

                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="w-14 h-14 bg-slate-50 rounded-[20px] flex items-center justify-center text-[#463a7a] shadow-sm transform group-hover:rotate-12 transition-transform">
                                                <Clock size={24} />
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Timing</p>
                                                <p className="text-lg font-black text-slate-900">{session.start_time} - {session.end_time}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <span className="px-3 py-1 bg-indigo-50 text-[#463a7a] text-[10px] font-black uppercase tracking-widest rounded-lg">{parseSubject(session.batch?.subject)}</span>
                                            <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none pt-2 group-hover:text-[#463a7a] transition-colors">{session.batch?.name || `${parseSubject(session.batch?.subject)} Class`}</h3>
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-8 border-t border-slate-50 relative z-10 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                                <Users size={14} className="text-slate-400" />
                                            </div>
                                            <p className="text-xs font-bold text-slate-500 uppercase">Group Session</p>
                                        </div>
                                        <button className="p-3 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-[#463a7a] group-hover:text-white transition-all shadow-sm">
                                            <ArrowUpRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-[28px] sm:rounded-[40px] p-12 sm:p-20 text-center border-2 border-dashed border-slate-100 shadow-sm">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 text-slate-200">
                                <Music size={36} />
                            </div>
                            <h3 className="text-xl sm:text-2xl font-black text-slate-300 tracking-tighter">No classes today</h3>
                            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2 px-4 sm:px-8">Relax, practice on your own, or explore your materials</p>
                        </div>
                    )}
                </div>

                {/* Sidebar Content */}
                <div className="space-y-6 sm:space-y-10">
                    {/* Quick Progress Sidebar */}
                    <div className="bg-white rounded-[32px] sm:rounded-[50px] p-6 sm:p-10 shadow-2xl shadow-slate-200/50 border border-slate-100">
                        <h2 className="text-xl font-black text-slate-900 mb-8 tracking-tighter uppercase">RECENT MATERIALS</h2>
                        <div className="space-y-6">
                            {materials?.slice(0, 3).map((m, i) => (
                                <div key={i} className="flex items-center gap-5 group cursor-pointer hover:bg-slate-50 p-2 rounded-2xl transition-all">
                                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-[#463a7a] shadow-sm flex-shrink-0 group-hover:bg-[#463a7a] group-hover:text-white transition-all">
                                        <FileText size={24} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black text-slate-900 truncate uppercase mt-0.5">{m.title}</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{m.file_type} • {m.created_at ? format(new Date(m.created_at), 'MMM d') : ''}</p>
                                    </div>
                                    <ArrowUpRight className="text-slate-300 w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                                </div>
                            ))}
                            {(!materials || materials.length === 0) && (
                                <div className="py-8 text-center opacity-30">
                                    <FileText className="w-10 h-10 mx-auto mb-2" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No materials yet</p>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => navigate('/student-portal/materials')}
                            className="w-full py-5 bg-slate-50 text-[#463a7a] font-black text-[10px] uppercase tracking-widest rounded-[24px] mt-10 hover:bg-[#463a7a] hover:text-white transition-all"
                        >
                            View Resources
                        </button>
                    </div>

                    {/* Package Summary Card */}
                    {activePackage ? (
                        <PackageSummaryCard pkg={activePackage} onViewPayments={() => navigate('/student-portal/payments')} />
                    ) : (
                        <div className="bg-gradient-to-br from-[#463a7a] to-[#2d2550] rounded-[32px] sm:rounded-[50px] p-6 sm:p-10 text-white relative overflow-hidden shadow-2xl">
                            <div className="relative z-10">
                                <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-[20px] flex items-center justify-center mb-6 border border-white/10">
                                    <Package className="text-yellow-400" />
                                </div>
                                <h3 className="text-xl font-black tracking-tighter leading-none mb-3 uppercase">No Active Package</h3>
                                <p className="text-indigo-100/60 font-medium text-sm leading-relaxed mb-8">Browse and purchase a package to start booking classes.</p>
                                <button onClick={() => navigate('/student-portal/payments')} className="w-full py-4 bg-white text-[#463a7a] font-black text-[10px] uppercase tracking-widest rounded-[24px] shadow-xl hover:scale-105 active:scale-95 transition-all">
                                    View Packages
                                </button>
                            </div>
                            <Music className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function PackageSummaryCard({ pkg, onViewPayments }) {
    const usedPct = pkg.sessions_total > 0 ? Math.round((pkg.sessions_used / pkg.sessions_total) * 100) : 0;
    const daysLeft = pkg.validity_until ? differenceInDays(new Date(pkg.validity_until), new Date()) : null;
    const isLow = pkg.sessions_remaining <= 2 || (daysLeft !== null && daysLeft <= 7);
    const isExpired = pkg.is_expired || daysLeft < 0;
    const r = 38, circ = 2 * Math.PI * r;
    const dash = (Math.min(usedPct, 100) / 100) * circ;
    const ringColor = usedPct >= 90 ? '#ef4444' : usedPct >= 70 ? '#f59e0b' : '#22c55e';

    return (
        <div className={`rounded-[32px] sm:rounded-[50px] p-6 sm:p-8 shadow-2xl border relative overflow-hidden ${isExpired ? 'bg-red-50 border-red-200' : isLow ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100'}`}>
            <div className="flex items-center justify-between mb-5">
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Package</p>
                    <h3 className="text-lg font-black text-slate-900 leading-tight truncate max-w-[160px]">{pkg.name}</h3>
                </div>
                <div className="relative flex-shrink-0">
                    <svg width={96} height={96} className="-rotate-90">
                        <circle cx={48} cy={48} r={r} fill="none" stroke="#e2e8f0" strokeWidth={8} />
                        <circle cx={48} cy={48} r={r} fill="none" stroke={ringColor} strokeWidth={8}
                            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                            style={{ transition: 'stroke-dasharray 0.7s ease' }} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-base font-black text-slate-900">{pkg.sessions_remaining}</span>
                        <span className="text-[8px] font-black text-slate-400 uppercase">left</span>
                    </div>
                </div>
            </div>

            <div className="space-y-2.5 mb-5">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 font-bold">Sessions used</span>
                    <span className="font-black text-slate-900">{pkg.sessions_used} / {pkg.sessions_total}</span>
                </div>
                {pkg.makeup_sessions > 0 && (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500 font-bold">Makeup sessions</span>
                        <span className="font-black text-slate-900">{pkg.makeup_remaining ?? (pkg.makeup_sessions - (pkg.makeup_used || 0))} / {pkg.makeup_sessions}</span>
                    </div>
                )}
                {daysLeft !== null && (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500 font-bold">Valid until</span>
                        <span className={`font-black ${isExpired ? 'text-red-600' : daysLeft <= 7 ? 'text-amber-600' : 'text-slate-900'}`}>
                            {isExpired ? 'Expired' : `${daysLeft}d left`}
                        </span>
                    </div>
                )}
            </div>

            {(isLow || isExpired) && (
                <div className={`flex items-center gap-2 p-3 rounded-2xl text-xs font-bold mb-4 ${isExpired ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    <AlertTriangle size={13} />
                    {isExpired ? 'Package expired — renew to continue classes' : isLow ? 'Running low — consider renewing soon' : ''}
                </div>
            )}

            <button onClick={onViewPayments} className="w-full py-3 bg-[#463a7a] text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-[#342a5b] transition-all flex items-center justify-center gap-2">
                <Package size={14} /> View / Renew Package
            </button>
        </div>
    );
}
