import { useState, useEffect, useCallback } from 'react';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import {
    format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
    eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router';
import { parseSubject } from '../../lib/utils';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function TeacherCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [teacher, setTeacher] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const navigate = useNavigate();

    useEffect(() => {
        const stored = localStorage.getItem('teacher');
        if (stored) setTeacher(JSON.parse(stored));
        else navigate('/teacher-login');
    }, [navigate]);

    const fetchSessions = useCallback(async (isRefresh = false) => {
        if (!teacher) return;
        if (!isRefresh) setLoading(true);
        try {
            const res = await api.get(`/teacher/${teacher.id}/sessions`, {
                params: {
                    start: format(startOfMonth(currentDate), 'yyyy-MM-dd'),
                    end:   format(endOfMonth(currentDate),   'yyyy-MM-dd'),
                }
            });
            setSessions(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            if (!isRefresh) setLoading(false);
        }
    }, [teacher, currentDate]);

    useEffect(() => { if (teacher) fetchSessions(); }, [fetchSessions]);
    useAutoRefresh(() => fetchSessions(true), 30000);

    const monthStart = startOfMonth(currentDate);
    const calendarDays = eachDayOfInterval({
        start: startOfWeek(monthStart, { weekStartsOn: 1 }),
        end:   endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 }),
    });

    const sessionsByDate = sessions.reduce((acc, s) => {
        (acc[s.date] = acc[s.date] || []).push(s);
        return acc;
    }, {});

    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    const selectedSessions = (sessionsByDate[selectedDateStr] || [])
        .slice()
        .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

    const totalMonth = sessions.length;
    const markedCount = sessions.filter(s => s.attendances?.length > 0).length;

    return (
        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_340px] gap-0 min-h-[calc(100vh-64px)] lg:min-h-screen">

            {/* ── Left: Calendar ───────────────────────────────────── */}
            <div className="flex flex-col min-h-0">

                {/* Header bar */}
                <div className="flex items-center justify-between px-4 lg:px-8 py-4 lg:py-5 border-b border-slate-100 bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setCurrentDate(d => subMonths(d, 1))}
                            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 active:scale-90 transition-all text-slate-500"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <h2 className="text-lg font-black text-slate-900 tracking-tight min-w-[140px] text-center">
                            {format(currentDate, 'MMMM yyyy')}
                        </h2>
                        <button
                            onClick={() => setCurrentDate(d => addMonths(d, 1))}
                            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 active:scale-90 transition-all text-slate-500"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Stat pills */}
                        <div className="hidden sm:flex items-center gap-2">
                            <span className="px-3 py-1.5 bg-indigo-50 text-[#463a7a] text-[10px] font-black uppercase tracking-widest rounded-full">
                                {totalMonth} sessions
                            </span>
                            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-full">
                                {markedCount} marked
                            </span>
                        </div>
                        <button
                            onClick={() => { const t = new Date(); setCurrentDate(t); setSelectedDate(t); }}
                            className="px-4 py-2 bg-[#463a7a] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#5a4a9f] active:scale-95 transition-all"
                        >
                            Today
                        </button>
                    </div>
                </div>

                {/* Day-of-week headers */}
                <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
                    {DAYS.map(d => (
                        <div key={d} className="py-2.5 text-center">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                <span className="hidden sm:inline">{d}</span>
                                <span className="sm:hidden">{d[0]}</span>
                            </span>
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                {loading ? (
                    <div className="flex-1 flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-[#463a7a]/20 border-t-[#463a7a] rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-7 flex-1">
                        {calendarDays.map(day => {
                            const ds = format(day, 'yyyy-MM-dd');
                            const daySessions = sessionsByDate[ds] || [];
                            const isSelected = isSameDay(day, selectedDate);
                            const isToday = isSameDay(day, new Date());
                            const inMonth = isSameMonth(day, monthStart);
                            const hasUnmarked = daySessions.some(s => !s.attendances?.length);

                            return (
                                <button
                                    key={ds}
                                    onClick={() => setSelectedDate(day)}
                                    className={`relative group min-h-[52px] sm:min-h-[72px] lg:min-h-[90px] p-1.5 sm:p-2 border-r border-b border-slate-100 flex flex-col items-center transition-all
                                        ${!inMonth ? 'bg-slate-50/40' : isSelected ? 'bg-[#463a7a]/5' : 'bg-white hover:bg-slate-50'}
                                    `}
                                >
                                    {/* Date number */}
                                    <span className={`text-xs sm:text-sm font-black w-7 h-7 flex items-center justify-center rounded-full transition-all leading-none
                                        ${isToday ? 'bg-[#463a7a] text-white shadow-md shadow-indigo-900/30'
                                        : isSelected ? 'bg-[#463a7a]/10 text-[#463a7a]'
                                        : inMonth ? 'text-slate-800 group-hover:text-[#463a7a]'
                                        : 'text-slate-300'}
                                    `}>
                                        {format(day, 'd')}
                                    </span>

                                    {/* Dot indicators */}
                                    {daySessions.length > 0 && (
                                        <div className="flex items-center gap-0.5 mt-1">
                                            {/* orange = has unattended, green = all done */}
                                            <span className={`w-1.5 h-1.5 rounded-full shadow-sm ${hasUnmarked ? 'bg-orange-400 shadow-orange-400/50' : 'bg-emerald-400 shadow-emerald-400/50'}`} />
                                            {daySessions.length > 1 && (
                                                <span className="text-[8px] font-black text-slate-400 leading-none">
                                                    {daySessions.length}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Right: Selected Day Panel ────────────────────────── */}
            <div className="border-t lg:border-t-0 lg:border-l border-slate-100 bg-white flex flex-col">
                {/* Day header */}
                <div className="px-5 lg:px-6 py-4 lg:py-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {format(selectedDate, 'EEEE')}
                        </p>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mt-0.5">
                            {format(selectedDate, 'MMMM d, yyyy')}
                        </h3>
                    </div>
                    <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-[#463a7a]">
                        <CalendarIcon size={18} />
                    </div>
                </div>

                {/* Session list */}
                <div className="flex-1 overflow-y-auto px-4 lg:px-5 py-4 space-y-3">
                    {selectedSessions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-3">
                                <CalendarIcon size={22} className="text-slate-300" />
                            </div>
                            <p className="text-sm font-black text-slate-300 uppercase tracking-tight">No classes</p>
                            <p className="text-[10px] text-slate-300 font-bold mt-1">Free day — enjoy!</p>
                        </div>
                    ) : (
                        selectedSessions.map(session => {
                            const attended = (session.attendances?.length ?? 0) > 0;
                            const enrolled = session.enrollment_count ?? 0;
                            return (
                                <button
                                    key={session.id}
                                    onClick={() => navigate(`/teacher-portal/session/${session.id}`)}
                                    className="w-full text-left group"
                                >
                                    <div className="p-4 rounded-2xl border-2 border-slate-100 bg-white hover:border-[#463a7a] hover:shadow-lg hover:shadow-indigo-100/60 transition-all">
                                        {/* Time + subject row */}
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-[#463a7a] text-[9px] font-black uppercase tracking-widest rounded-full">
                                                {parseSubject(session.batch?.subject) || 'Class'}
                                            </span>
                                            <span className="flex items-center gap-1 text-[10px] font-black text-slate-400">
                                                <Clock size={10} />
                                                {(session.start_time || '').slice(0, 5)}
                                                <span className="text-slate-300">–</span>
                                                {(session.end_time || '').slice(0, 5)}
                                            </span>
                                        </div>

                                        {/* Name */}
                                        <p className="font-black text-slate-900 text-sm leading-tight group-hover:text-[#463a7a] transition-colors">
                                            {session.batch?.name || `${parseSubject(session.batch?.subject) || ''} Class`}
                                        </p>

                                        {/* Footer */}
                                        <div className="flex items-center justify-between mt-3">
                                            <div className="flex items-center gap-3">
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                                    <Users size={11} />
                                                    {enrolled} student{enrolled !== 1 ? 's' : ''}
                                                </span>
                                                <span className={`flex items-center gap-1 text-[10px] font-bold ${attended ? 'text-emerald-500' : 'text-orange-400'}`}>
                                                    {attended
                                                        ? <><CheckCircle2 size={11} /> Marked</>
                                                        : <><AlertCircle size={11} /> Pending</>
                                                    }
                                                </span>
                                            </div>
                                            <ChevronRight size={15} className="text-slate-300 group-hover:text-[#463a7a] transition-colors" />
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Legend */}
                <div className="px-5 py-3 border-t border-slate-100 flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        <span className="w-2 h-2 rounded-full bg-orange-400" /> Attendance pending
                    </span>
                    <span className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" /> All marked
                    </span>
                </div>
            </div>
        </div>
    );
}
