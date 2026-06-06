import { useState, useEffect } from 'react';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths
} from 'date-fns';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Clock,
    Users,
    Music,
    Zap
} from 'lucide-react';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router';
import { parseSubject } from '../../lib/utils';

function LiveBadge({ lastRefresh }) {
    return (
        <div className="flex items-center gap-2 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            Live · {format(lastRefresh, 'HH:mm')}
        </div>
    );
}

export default function TeacherCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [teacher, setTeacher] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const navigate = useNavigate();

    useEffect(() => {
        const stored = localStorage.getItem('teacher');
        if (stored) {
            setTeacher(JSON.parse(stored));
        } else {
            navigate('/teacher-login');
        }
    }, [navigate]);

    useEffect(() => {
        if (teacher) fetchSessions();
    }, [currentDate, teacher]);

    useAutoRefresh(() => { if (teacher) fetchSessions(); }, 20000);

    const fetchSessions = async () => {
        if (!teacher) return;
        setLoading(true);
        try {
            const start = startOfMonth(currentDate);
            const end = endOfMonth(currentDate);
            const response = await api.get(`/teacher/${teacher.id}/sessions`, {
                params: {
                    start: format(start, 'yyyy-MM-dd'),
                    end: format(end, 'yyyy-MM-dd')
                }
            });
            setSessions(response.data);
            setLastRefresh(new Date());
        } catch (error) {
            console.error('Failed to fetch sessions', error);
        } finally {
            setLoading(false);
        }
    };

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const selectedDateSessions = sessions
        .filter(s => s.date === format(selectedDate, 'yyyy-MM-dd'))
        .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

    const goToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
    };

    return (
        <div className="p-4 lg:p-12 max-w-7xl mx-auto space-y-6 lg:space-y-10">
            {/* Header */}
            <div className="relative bg-[#463a7a] rounded-[32px] lg:rounded-[40px] p-6 lg:p-12 overflow-hidden shadow-2xl shadow-indigo-900/20">
                <div className="absolute top-0 right-0 p-8 lg:p-12 opacity-5 pointer-events-none">
                    <Zap className="w-40 lg:w-64 h-40 lg:h-64 text-white fill-current" />
                </div>

                <div className="relative z-10">
                    <div className="flex items-start justify-between gap-4 mb-5 lg:mb-6">
                        <div>
                            <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tighter leading-none mb-1.5">
                                Class Schedule
                            </h1>
                            <p className="text-indigo-100/60 font-medium text-sm lg:text-base">
                                {format(currentDate, 'MMMM yyyy')} · {sessions.length} session{sessions.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                        <LiveBadge lastRefresh={lastRefresh} />
                    </div>

                    <div className="flex items-center gap-2 lg:gap-3">
                        <button
                            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                            className="w-11 h-11 flex items-center justify-center hover:bg-white/10 rounded-2xl transition-all text-white active:scale-90"
                        >
                            <ChevronLeft size={22} />
                        </button>
                        <div className="flex-1 sm:flex-none bg-white/10 backdrop-blur-md rounded-[18px] px-5 py-3 border border-white/5 text-center min-w-[160px]">
                            <span className="font-black text-white text-sm lg:text-lg tracking-tight">
                                {format(currentDate, 'MMMM yyyy')}
                            </span>
                        </div>
                        <button
                            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                            className="w-11 h-11 flex items-center justify-center hover:bg-white/10 rounded-2xl transition-all text-white active:scale-90"
                        >
                            <ChevronRight size={22} />
                        </button>
                        <button
                            onClick={goToday}
                            className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white font-black text-[10px] uppercase tracking-widest border border-white/10 transition-all active:scale-95"
                        >
                            Today
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-10">
                {/* Calendar Grid */}
                <div className="xl:col-span-2 bg-white rounded-[32px] lg:rounded-[50px] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden">
                    {/* Day headers */}
                    <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-100">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                            <div key={day} className="py-3 lg:py-4 text-center">
                                <span className="hidden sm:inline text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                                    {day}
                                </span>
                                <span className="sm:hidden text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    {day[0]}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Day cells */}
                    <div className="grid grid-cols-7">
                        {calendarDays.map((day) => {
                            const dateStr = format(day, 'yyyy-MM-dd');
                            const daySessions = sessions.filter(s => s.date === dateStr);
                            const isSelected = isSameDay(day, selectedDate);
                            const isCurrentMonth = isSameMonth(day, monthStart);
                            const isTodayDate = isSameDay(day, new Date());

                            return (
                                <div
                                    key={dateStr}
                                    onClick={() => setSelectedDate(day)}
                                    className={`min-h-[56px] sm:min-h-[90px] lg:min-h-[130px] p-1.5 sm:p-2 lg:p-3 border-r border-b border-slate-50 transition-all cursor-pointer flex flex-col
                                        ${!isCurrentMonth ? 'bg-slate-50/30' : isSelected ? 'bg-indigo-50/60' : 'bg-white hover:bg-[#463a7a]/5'}
                                    `}
                                >
                                    <div className="flex items-start justify-between mb-1">
                                        <span className={`text-[11px] sm:text-sm lg:text-base font-black w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 flex items-center justify-center rounded-lg lg:rounded-[10px] transition-all leading-none
                                            ${isTodayDate
                                                ? 'bg-[#463a7a] text-white shadow-lg shadow-indigo-900/40'
                                                : isSelected
                                                ? 'bg-indigo-100 text-[#463a7a]'
                                                : isCurrentMonth
                                                ? 'text-slate-900'
                                                : 'text-slate-300'}
                                        `}>
                                            {format(day, 'd')}
                                        </span>
                                        {daySessions.length > 0 && (
                                            <span className="mt-1 flex h-1.5 w-1.5 rounded-full bg-orange-400 shadow-sm shadow-orange-400/60" />
                                        )}
                                    </div>

                                    {/* Session chips — tablet+ */}
                                    <div className="hidden sm:flex flex-col gap-0.5 lg:gap-1 flex-1 overflow-hidden">
                                        {daySessions.slice(0, 2).map(s => (
                                            <div
                                                key={s.id}
                                                className="text-[8px] lg:text-[10px] font-black px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-md lg:rounded-xl bg-indigo-50 text-[#463a7a] truncate flex items-center gap-1"
                                            >
                                                <span className="opacity-60 flex-shrink-0">{(s.start_time || '').slice(0, 5)}</span>
                                                <span className="truncate hidden lg:inline">{parseSubject(s.batch?.subject) || 'Class'}</span>
                                            </div>
                                        ))}
                                        {daySessions.length > 2 && (
                                            <p className="text-[8px] lg:text-[9px] text-[#463a7a] font-black pl-1 opacity-60">
                                                +{daySessions.length - 2} more
                                            </p>
                                        )}
                                    </div>

                                    {/* Mobile: session count */}
                                    {daySessions.length > 0 && (
                                        <p className="sm:hidden text-[8px] font-black text-[#463a7a] opacity-50 mt-auto">
                                            ×{daySessions.length}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Selected Day Panel */}
                <div className="bg-white rounded-[32px] lg:rounded-[50px] shadow-2xl shadow-slate-200 border border-slate-100 p-6 lg:p-10 flex flex-col min-h-[300px]">
                    <div className="flex items-center justify-between mb-6 lg:mb-8">
                        <div>
                            <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tighter leading-none">
                                {format(selectedDate, 'EEEE')}
                            </h2>
                            <p className="text-[#463a7a] text-[10px] font-bold uppercase tracking-widest mt-1.5">
                                {format(selectedDate, 'MMMM d, yyyy')}
                            </p>
                        </div>
                        <div className="w-12 h-12 lg:w-14 lg:h-14 bg-indigo-50 rounded-[18px] lg:rounded-[22px] flex items-center justify-center text-[#463a7a] shadow-xl shadow-indigo-100/50 flex-shrink-0">
                            <CalendarIcon size={22} />
                        </div>
                    </div>

                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <div className="w-6 h-6 border-2 border-[#463a7a]/20 border-t-[#463a7a] rounded-full animate-spin" />
                        </div>
                    )}

                    <div className="space-y-3 lg:space-y-4 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                        {!loading && selectedDateSessions.length > 0 ? (
                            selectedDateSessions.map(session => (
                                <button
                                    key={session.id}
                                    onClick={() => navigate(`/teacher-portal/session/${session.id}`)}
                                    className="w-full text-left p-4 lg:p-6 rounded-[22px] lg:rounded-[32px] border-2 border-slate-50 bg-slate-50/50 hover:bg-white hover:border-[#463a7a] hover:shadow-2xl hover:shadow-indigo-100 transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-2.5">
                                        <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-white border border-slate-100 text-[#463a7a] shadow-sm">
                                            {parseSubject(session.batch?.subject) || 'Class'}
                                        </span>
                                        <span className="text-[9px] font-black text-slate-400 flex items-center gap-1 uppercase">
                                            <Clock size={10} className="text-indigo-200" />
                                            {(session.start_time || '').slice(0, 5)}
                                        </span>
                                    </div>
                                    <h3 className="text-sm lg:text-base font-black text-slate-900 mb-3 group-hover:text-[#463a7a] transition-colors leading-tight">
                                        {session.batch?.name || `${parseSubject(session.batch?.subject) || ''} Session`}
                                    </h3>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                            <Users size={11} className="text-indigo-200" />
                                            {session.enrollment_count ?? 0} enrolled
                                        </div>
                                        <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-[#463a7a] group-hover:text-white transition-all shadow-sm">
                                            <ChevronRight size={15} />
                                        </div>
                                    </div>
                                </button>
                            ))
                        ) : !loading ? (
                            <div className="text-center py-12 lg:py-16 opacity-30">
                                <Music size={36} className="mx-auto mb-4 text-slate-200" />
                                <h3 className="text-base font-black uppercase tracking-tighter">Day is clear</h3>
                                <p className="text-[10px] font-bold uppercase tracking-widest mt-1">Time for self-practice!</p>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
