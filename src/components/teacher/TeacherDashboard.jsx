import { useState, useEffect, useCallback } from 'react';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { api } from '../../lib/api';
import { parseSubject } from '../../lib/utils';
import {
    Calendar,
    Users,
    Clock,
    ChevronRight,
    Plus,
    Zap,
    Music,
    CheckCircle2,
    TrendingUp,
    FileText,
    User as UserIcon,
    Search,
    ArrowUpRight
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router';

export default function TeacherDashboard() {
    const [teacher, setTeacher] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [students, setStudents] = useState([]);
    const [materialsCount, setMaterialsCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const stored = localStorage.getItem('teacher');
        if (stored) {
            setTeacher(JSON.parse(stored));
        } else {
            navigate('/teacher-login');
        }
    }, [navigate]);

    const fetchDashboardData = useCallback(async (isRefresh = false) => {
        if (!teacher) return;
        if (!isRefresh) setLoading(true);
        try {
            const today = format(new Date(), 'yyyy-MM-dd');
            const [sessionsRes, studentsRes, materialsRes] = await Promise.all([
                api.get(`/teacher/${teacher.id}/sessions`, { params: { start: today, end: today } }),
                api.get(`/teacher/${teacher.id}/students`),
                api.get(`/teacher/${teacher.id}/materials`).catch(() => ({ data: [] })),
            ]);
            setSessions(sessionsRes.data);
            setStudents(studentsRes.data);
            setMaterialsCount(materialsRes.data.length);
        } catch (e) {
            console.error(e);
        } finally {
            if (!isRefresh) setLoading(false);
        }
    }, [teacher]);

    useEffect(() => { if (teacher) fetchDashboardData(); }, [teacher, fetchDashboardData]);
    useAutoRefresh(fetchDashboardData, 30000);

    if (!teacher) return null;

    const stats = [
        { name: "Today's Lessons", value: sessions.length, icon: Clock, color: 'text-orange-400', bg: 'bg-orange-50', href: '/teacher-portal/calendar' },
        { name: "My Students", value: students.length, icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-50', href: '/teacher-portal/students' },
        { name: "Instruments", value: Array.from(new Set(students.map(s => s.desired_course).filter(Boolean))).length || 0, icon: Music, color: 'text-emerald-400', bg: 'bg-emerald-50', href: '/teacher-portal/students' },
        { name: "Resources", value: materialsCount, icon: FileText, color: 'text-purple-400', bg: 'bg-purple-50', href: '/teacher-portal/materials' },
    ];

    return (
        <div className="p-4 lg:p-12 max-w-7xl mx-auto space-y-12">
            {/* Hero Section */}
            <div className="relative bg-[#463a7a] rounded-[50px] p-8 lg:p-16 overflow-hidden shadow-2xl shadow-indigo-900/20">
                <div className="absolute top-0 right-0 p-12 opacity-5 scale-150">
                    <Zap className="w-96 h-96 text-white fill-current" />
                </div>

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="px-4 py-2 bg-yellow-400 rounded-full flex items-center gap-2 shadow-lg shadow-yellow-900/20">
                                <span className="text-[10px] font-black text-[#463a7a] uppercase tracking-widest">Active Teacher</span>
                            </div>
                            <span className="text-white/40 font-bold text-xs uppercase tracking-widest">{format(new Date(), 'EEEE, MMMM do')}</span>
                        </div>
                        <h1 className="text-4xl lg:text-7xl font-black text-white tracking-tighter leading-[0.85]">
                            Welcome back,<br />
                            <span className="text-indigo-300">{teacher.name.split(' ')[0]}</span>
                        </h1>
                        <p className="text-indigo-100/60 font-medium text-lg max-w-md">
                            You have {sessions.length} sessions lined up for today. Ready to inspire?
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={() => navigate('/teacher-portal/calendar')}
                            className="px-8 py-5 bg-white text-[#463a7a] rounded-[24px] font-black shadow-2xl shadow-black/10 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                        >
                            VIEW CALENDAR
                            <ArrowUpRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
                {stats.map((stat, i) => (
                    <button
                        key={i}
                        onClick={() => navigate(stat.href)}
                        className="bg-white rounded-[40px] p-6 lg:p-8 shadow-xl shadow-slate-200 border border-slate-50 flex flex-col gap-4 group hover:border-[#463a7a] hover:shadow-indigo-100 transition-all text-left cursor-pointer"
                    >
                        <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <stat.icon size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.name}</p>
                            <p className="text-3xl font-black text-slate-900 tracking-tighter">{loading ? '—' : stat.value}</p>
                        </div>
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                {/* Timeline */}
                <div className="xl:col-span-2 space-y-8">
                    <div className="bg-white rounded-[50px] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden">
                        <div className="p-8 lg:p-10 border-b border-slate-50 flex items-center justify-between">
                            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3 tracking-tighter">
                                <Clock className="text-[#463a7a]" />
                                TODAY'S TIMELINE
                            </h2>
                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                <Search size={18} />
                            </div>
                        </div>

                        <div className="p-6 lg:p-10">
                            {sessions.length > 0 ? (
                                <div className="space-y-4">
                                    {sessions.map((session, idx) => (
                                        <div
                                            key={session.id}
                                            onClick={() => navigate(`/teacher-portal/session/${session.id}`)}
                                            className="group relative p-6 lg:p-8 rounded-[40px] border-2 border-slate-50 bg-slate-50/30 hover:bg-white hover:border-[#463a7a] hover:shadow-2xl hover:shadow-indigo-100 transition-all cursor-pointer flex items-center gap-8"
                                        >
                                            <div className="flex flex-col items-center justify-center min-w-[100px] py-4 bg-white rounded-3xl shadow-sm border border-slate-100 group-hover:bg-[#463a7a] group-hover:text-white transition-all">
                                                <span className="text-sm font-black tracking-tighter">{session.start_time.split(':')[0]}:{session.start_time.split(':')[1]}</span>
                                                <div className="w-6 h-0.5 bg-slate-100 group-hover:bg-white/20 my-1" />
                                                <span className="text-[10px] font-bold opacity-40 uppercase">{session.end_time.split(':')[0]}:{session.end_time.split(':')[1]}</span>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#463a7a] bg-indigo-50 px-2 py-0.5 rounded-md">{parseSubject(session.batch?.subject)}</span>
                                                </div>
                                                <h3 className="text-xl font-black text-slate-900 group-hover:text-[#463a7a] transition-colors truncate">
                                                    {session.batch?.name || `${parseSubject(session.batch?.subject)} Class`}
                                                </h3>
                                                <div className="flex items-center gap-6 mt-4">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                                        <Users size={14} className="text-slate-300" />
                                                        {session.enrollment_count ?? 0} Students
                                                    </div>
                                                    <div className={`flex items-center gap-2 text-xs font-bold ${session.attendances?.length > 0 ? 'text-emerald-500' : 'text-slate-300'}`}>
                                                        <CheckCircle2 size={14} />
                                                        {session.attendances?.length > 0 ? 'Marked' : 'Not Marked'}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 shadow-sm group-hover:bg-[#463a7a] group-hover:text-white group-hover:scale-105 transition-all">
                                                <ChevronRight />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 text-center opacity-30">
                                    <Calendar className="w-20 h-20 mx-auto mb-6" />
                                    <h3 className="text-2xl font-black">No classes today</h3>
                                    <p className="font-bold uppercase tracking-widest text-xs">Fresh day, fresh vibes!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Widget */}
                <div className="space-y-10">
                    <div className="bg-white rounded-[50px] p-10 shadow-2xl shadow-slate-200 border border-slate-100">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-black text-slate-900 tracking-tighter">RECENT ARTISTS</h2>
                            <button onClick={() => navigate('/teacher-portal/students')} className="text-[#463a7a] text-[10px] font-black uppercase tracking-widest hover:underline">View All</button>
                        </div>
                        <div className="space-y-6">
                            {students.slice(0, 4).map((s, i) => (
                                <div
                                    key={i}
                                    onClick={() => navigate(`/teacher-portal/students/${s.id}`)}
                                    className="flex items-center gap-5 group cursor-pointer"
                                >
                                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-[#463a7a] group-hover:bg-[#463a7a] group-hover:text-white transition-all shadow-sm">
                                        {s.first_name[0]}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-black text-slate-900 group-hover:text-[#463a7a] transition-colors">{s.first_name} {s.last_name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{s.desired_course} • Grade {s.current_grade}</p>
                                    </div>
                                    <ArrowUpRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-all" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-[#463a7a] to-[#2d2550] rounded-[50px] p-10 text-white relative overflow-hidden shadow-2xl">
                        <div className="relative z-10">
                            <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/5">
                                <TrendingUp className="text-orange-400" />
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">Teacher Insight</h3>
                            <p className="text-indigo-100 text-sm font-medium leading-relaxed mb-8 opacity-80">
                                Consistent feedback helps students focus on their weak spots. Try sharing a recording of today's best performance!
                            </p>
                            <button
                                onClick={() => navigate('/teacher-portal/materials')}
                                className="w-full py-5 bg-white text-[#463a7a] rounded-[24px] font-black shadow-xl hover:scale-105 transition-all text-xs uppercase"
                            >
                                UPLOAD NOW
                            </button>
                        </div>
                        <Zap className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5" />
                    </div>
                </div>
            </div>
        </div>
    );
}
