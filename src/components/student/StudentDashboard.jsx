import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
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
    Users
} from 'lucide-react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { useNavigate } from 'react-router';

export default function StudentDashboard() {
    const [student, setStudent] = useState(null);
    const [todaySessions, setTodaySessions] = useState([]);
    const [progress, setProgress] = useState(null);
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const stored = localStorage.getItem('student');
        if (stored) {
            const s = JSON.parse(stored);
            setStudent(s);
            fetchDashboardData(s.id);
        } else {
            navigate('/student-login');
        }
    }, [navigate]);

    const fetchDashboardData = async (studentId) => {
        setLoading(true);
        try {
            const today = format(new Date(), 'yyyy-MM-dd');
            const [sessionsRes, progressRes, materialsRes] = await Promise.all([
                api.get(`/student/${studentId}/sessions`, { params: { start: today, end: today } }),
                api.get(`/students/${studentId}/progress`),
                api.get(`/students/${studentId}/materials`)
            ]);
            setTodaySessions(sessionsRes.data);
            setProgress(progressRes.data);
            setMaterials(materialsRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const calculateOverallProgress = () => {
        if (!progress?.syllabus?.modules) return 0;
        let total = 0;
        let completed = 0;
        progress.syllabus.modules.forEach(m => {
            if (m.contents) {
                m.contents.forEach(c => {
                    total++;
                    if (c.progress?.status === 'done') completed++;
                });
            }
        });
        return total === 0 ? 0 : Math.round((completed / total) * 100);
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
            <Loader2 className="w-10 h-10 text-[#463a7a] animate-spin" />
        </div>
    );

    if (!student) return null;

    const overallProgress = calculateOverallProgress();

    return (
        <div className="p-4 lg:p-12 max-w-7xl mx-auto space-y-12 pb-20">
            {/* Welcome Section */}
            <div className="relative bg-[#463a7a] rounded-[50px] p-8 lg:p-16 overflow-hidden shadow-2xl shadow-indigo-900/40 group hover:shadow-[#463a7a]/60 transition-all duration-500">
                <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                    <Music className="w-96 h-96 text-white fill-current" />
                </div>

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="px-5 py-2 bg-orange-500 rounded-full flex items-center gap-2 shadow-lg shadow-orange-900/20">
                                <Award size={14} className="text-white" />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">{progress?.student?.grade || 'Debut'} Grade</span>
                            </div>
                            <span className="text-white/40 font-bold text-xs uppercase tracking-widest">{format(new Date(), 'EEEE, MMMM do')}</span>
                        </div>
                        <h1 className="text-4xl lg:text-7xl font-black text-white tracking-tighter leading-[0.85]">
                            Ready to practice,<br />
                            <span className="text-indigo-300">{student.first_name}?</span>
                        </h1>
                        <p className="text-indigo-100/60 font-medium text-lg max-w-md">
                            You have {todaySessions.length === 0 ? 'no' : todaySessions.length} sessions scheduled for today. Keep up the momentum!
                        </p>
                    </div>

                    <div className="p-1.5 bg-white/10 backdrop-blur-md rounded-[40px] border border-white/10 shadow-inner">
                        <div className="bg-white rounded-[32px] p-8 flex items-center gap-8 shadow-2xl">
                            <div className="relative">
                                <svg className="w-24 h-24 transform -rotate-90">
                                    <circle cx="48" cy="48" r="42" stroke="#f1f5f9" strokeWidth="8" fill="none" />
                                    <circle cx="48" cy="48" r="42" stroke="#463a7a" strokeWidth="8" fill="none" strokeDasharray={264} strokeDashoffset={264 - (264 * overallProgress) / 100} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-xl font-black text-slate-900 leading-none">{overallProgress}%</span>
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Syllabus</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Overall Mastery</p>
                                <h3 className="text-2xl font-black text-slate-900 leading-tight">Vama Excellence</h3>
                                <button onClick={() => navigate('/student-portal/progress')} className="text-[#463a7a] font-black text-[10px] uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all mt-2">
                                    View Progress <ChevronRight size={12} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">

                {/* Today's Classes */}
                <div className="xl:col-span-2 space-y-8">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
                            <Calendar className="text-[#463a7a] w-8 h-8" />
                            TODAY'S SCHEDULE
                        </h2>
                        <button onClick={() => navigate('/student-portal/schedule')} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#463a7a] transition-colors">Full Calendar</button>
                    </div>

                    {todaySessions.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {todaySessions.map(session => (
                                <div key={session.id} className="bg-white rounded-[40px] p-8 shadow-xl shadow-slate-200/50 border border-slate-50 flex flex-col justify-between group hover:border-[#463a7a] transition-all duration-500 relative overflow-hidden">
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
                        <div className="bg-white rounded-[40px] p-20 text-center border-2 border-dashed border-slate-100 shadow-sm">
                            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-200">
                                <Music size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-300 tracking-tighter">No classes today</h3>
                            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2 px-8">Relax, practice on your own, or explore your materials</p>
                        </div>
                    )}
                </div>

                {/* Sidebar Content */}
                <div className="space-y-10">
                    {/* Quick Progress Sidebar */}
                    <div className="bg-white rounded-[50px] p-10 shadow-2xl shadow-slate-200/50 border border-slate-100">
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

                    {/* Achievement / Tip Card */}
                    <div className="bg-gradient-to-br from-[#463a7a] to-[#2d2550] rounded-[50px] p-10 text-white relative overflow-hidden shadow-2xl">
                        <div className="relative z-10">
                            <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-[20px] flex items-center justify-center mb-10 border border-white/10">
                                <Zap className="text-yellow-400 fill-current" />
                            </div>
                            <h3 className="text-2xl font-black tracking-tighter leading-none mb-4 uppercase">Practice Tip</h3>
                            <p className="text-indigo-100/60 font-medium text-sm leading-relaxed mb-10">
                                "Practice doesn't make perfect. Perfect practice makes perfect." Try practicing in 15-minute focused bursts!
                            </p>
                            <button className="w-full py-5 bg-white text-[#463a7a] font-black text-[10px] uppercase tracking-widest rounded-[24px] shadow-xl hover:scale-105 active:scale-95 transition-all">
                                Log Practice Session
                            </button>
                        </div>
                        <Music className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5" />
                    </div>
                </div>
            </div>
        </div>
    );
}
