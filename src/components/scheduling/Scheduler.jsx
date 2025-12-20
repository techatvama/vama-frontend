import React, { useState, useEffect } from 'react';
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks, getDay, parse, differenceInMinutes, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, ChevronDown, MapPin, Briefcase, User } from 'lucide-react';
import { api } from '../../lib/api';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import CreateBatchDialog from './CreateBatchDialog';
import ClassSessionCard from './ClassSessionCard';
import SessionDetailDialog from './SessionDetailDialog';

const cn = (...inputs) => twMerge(clsx(inputs));

export default function Scheduler() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('week'); // day, week, month
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [teachers, setTeachers] = useState([]);
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');

    // Dialog States
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);

    // Fetch Logic
    useEffect(() => {
        fetchSessions();
        fetchTeachers();
    }, [currentDate, viewMode]);

    const fetchTeachers = async () => {
        try {
            const res = await api.get('/staff');
            setTeachers(res.data);
        } catch (e) {
            console.error(e);
        }
    }

    const fetchSessions = async () => {
        setLoading(true);
        try {
            let start, end;
            if (viewMode === 'day') {
                start = currentDate;
                end = currentDate;
            } else if (viewMode === 'week') {
                start = startOfWeek(currentDate, { weekStartsOn: 1 });
                end = endOfWeek(currentDate, { weekStartsOn: 1 });
            } else {
                start = startOfMonth(currentDate);
                end = endOfMonth(currentDate);
            }

            const response = await api.get('/calendar', {
                params: {
                    start: format(start, 'yyyy-MM-dd'),
                    end: format(end, 'yyyy-MM-dd')
                }
            });
            setSessions(response.data);
        } catch (error) {
            console.error("Failed to fetch sessions", error);
        } finally {
            setLoading(false);
        }
    };

    const navigateDate = (direction) => {
        if (viewMode === 'day') {
            setCurrentDate(direction === 'next' ? addDays(currentDate, 1) : addDays(currentDate, -1));
        } else if (viewMode === 'week') {
            setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
        } else {
            setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
        }
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const handleSessionClick = (session) => {
        setSelectedSession(session);
    };

    const START_HOUR = 8;
    const END_HOUR = 21;
    const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

    // Filter sessions
    const getFilteredSessions = () => {
        return sessions.filter(s => {
            let match = true;
            if (selectedTeacher) {
                const tId = s.teacher_id || s.batch?.teacher_id;
                if (tId !== parseInt(selectedTeacher)) match = false;
            }

            if (selectedSubject && s.batch?.subject !== selectedSubject) match = false;

            return match;
        });
    }

    const filteredSessions = getFilteredSessions();

    // Renderers
    const renderWeekView = () => {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const days = viewMode === 'day'
            ? [currentDate]
            : Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

        return (
            <div className="flex flex-col h-full overflow-hidden bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Header Row */}
                <div className="flex border-b border-gray-100">
                    <div className="w-16 border-r border-gray-100 bg-gray-50/50" /> {/* Time column header */}
                    {days.map(day => (
                        <div key={day.toString()} className={cn("flex-1 py-3 text-center border-r border-gray-100 last:border-0", isSameDay(day, new Date()) ? "bg-[#463A7A]/5" : "")}>
                            <div className={cn("text-xs font-medium uppercase mb-1", isSameDay(day, new Date()) ? "text-[#463A7A]" : "text-gray-500")}>{format(day, 'EEE')}</div>
                            <div className={cn("text-lg font-bold", isSameDay(day, new Date()) ? "text-[#463A7A]" : "text-gray-800")}>{format(day, 'd')}</div>
                        </div>
                    ))}
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto relative custom-scrollbar">
                    <div className="flex min-h-[800px]">
                        {/* Time Column */}
                        <div className="w-16 flex-shrink-0 border-r border-gray-100 bg-gray-50/30">
                            {HOURS.map(hour => (
                                <div key={hour} className="h-20 text-xs text-gray-400 text-right pr-2 pt-2 border-b border-gray-100/50">
                                    {format(new Date().setHours(hour, 0), 'h aa')}
                                </div>
                            ))}
                        </div>

                        {/* Days Columns */}
                        {days.map(day => (
                            <div key={day.toString()} className="flex-1 border-r border-gray-100 last:border-0 relative bg-white">
                                {/* Hour Guidelines */}
                                {HOURS.map(hour => (
                                    <div key={hour} className="h-20 border-b border-gray-100/50" />
                                ))}

                                {/* Sessions */}
                                {filteredSessions
                                    .filter(s => isSameDay(parse(s.date, 'yyyy-MM-dd', new Date()), day))
                                    .map(session => {
                                        const [startH, startM] = session.start_time.split(':').map(Number);
                                        const [endH, endM] = session.end_time.split(':').map(Number);

                                        const startMinutes = (startH * 60) + startM;
                                        const endMinutes = (endH * 60) + endM;
                                        const dayStartMinutes = START_HOUR * 60;

                                        const top = ((startMinutes - dayStartMinutes) / 60) * 80; // 80px per hour
                                        const height = ((endMinutes - startMinutes) / 60) * 80;

                                        return (
                                            <div
                                                key={session.id}
                                                className="absolute left-1 right-1 z-10"
                                                style={{ top: `${top}px`, height: `${height}px` }}
                                            >
                                                <ClassSessionCard session={session} onClick={handleSessionClick} />
                                            </div>
                                        );
                                    })
                                }
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderMonthView = () => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

        const days = eachDayOfInterval({ start: startDate, end: endDate });

        return (
            <div className="h-full bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col">
                <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                        <div key={d} className="py-3 text-center text-sm font-semibold text-gray-500">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 flex-1 auto-rows-fr">
                    {days.map(day => {
                        const daySessions = filteredSessions.filter(s => isSameDay(parse(s.date, 'yyyy-MM-dd', new Date()), day));
                        const isCurrentMonth = isSameMonth(day, monthStart);

                        return (
                            <div
                                key={day.toString()}
                                className={cn(
                                    "border-b border-r border-gray-100 p-2 min-h-[100px] transition-colors hover:bg-gray-50",
                                    !isCurrentMonth ? "bg-gray-50/50 text-gray-400" : "bg-white"
                                )}
                            >
                                <div className={cn("text-sm font-medium mb-1", isSameDay(day, new Date()) ? "text-[#463A7A] bg-[#463A7A]/10 w-6 h-6 rounded-full flex items-center justify-center" : "")}>
                                    {format(day, 'd')}
                                </div>
                                <div className="space-y-1 overflow-y-auto max-h-[80px]">
                                    {daySessions.map(s => (
                                        <div key={s.id} onClick={() => handleSessionClick(s)} className="text-[10px] p-1 rounded bg-[#463A7A]/10 text-[#463A7A] truncate cursor-pointer hover:opacity-80">
                                            {s.start_time} {s.batch?.subject}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Header */}
                <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm z-20">
                    <div className="flex items-center gap-4">
                        {/* Filters */}
                        <div className="flex items-center gap-3">
                            {/* Teacher Filter */}
                            <div className="relative">
                                <select
                                    value={selectedTeacher}
                                    onChange={(e) => setSelectedTeacher(e.target.value)}
                                    className="appearance-none pl-10 pr-8 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#463A7A]/20 min-w-[160px]"
                                >
                                    <option value="">All Teachers</option>
                                    {teachers.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                                    <User size={12} className="text-gray-500" />
                                </div>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            </div>

                            {/* Subject Filter */}
                            <div className="relative">
                                <select
                                    value={selectedSubject}
                                    onChange={(e) => setSelectedSubject(e.target.value)}
                                    className="appearance-none pl-9 pr-8 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#463A7A]/20 min-w-[150px]"
                                >
                                    <option value="">All subjects</option>
                                    <option value="Guitar">Guitar</option>
                                    <option value="Piano">Piano</option>
                                    <option value="Drums">Drums</option>
                                    <option value="Vocals">Vocals</option>
                                    <option value="Violin">Violin</option>
                                </select>
                                <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* New Navigation Group */}
                        <div className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm">
                            <button
                                onClick={() => navigateDate('prev')}
                                className="px-3 py-2 border-r border-gray-300 hover:bg-gray-50 text-gray-600 transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={goToToday}
                                className="px-4 py-2 text-sm font-medium text-gray-700 border-r border-gray-300 hover:bg-gray-50 transition-colors"
                            >
                                Today
                            </button>
                            <div className="px-4 py-2 text-sm font-medium text-gray-700 min-w-[200px] text-center bg-gray-50/50">
                                {format(currentDate, 'EEEE, MMMM d, yyyy')}
                            </div>
                            <button
                                onClick={() => navigateDate('next')}
                                className="px-3 py-2 border-l border-gray-300 hover:bg-gray-50 text-gray-600 transition-colors"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>

                        {/* View Toggle */}
                        <div className="flex items-center bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('day')}
                                className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-all", viewMode === 'day' ? "bg-white text-[#463A7A] shadow-sm" : "text-gray-500 hover:text-gray-700")}
                            >
                                Day
                            </button>
                            <button
                                onClick={() => setViewMode('week')}
                                className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-all", viewMode === 'week' ? "bg-white text-[#463A7A] shadow-sm" : "text-gray-500 hover:text-gray-700")}
                            >
                                Week
                            </button>
                            <button
                                onClick={() => setViewMode('month')}
                                className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-all", viewMode === 'month' ? "bg-white text-[#463A7A] shadow-sm" : "text-gray-500 hover:text-gray-700")}
                            >
                                Month
                            </button>
                        </div>

                        <button
                            onClick={() => setIsCreateDialogOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-[#463A7A] text-white rounded-lg hover:bg-[#342a5b] transition-all shadow-md active:scale-95 font-medium text-sm"
                        >
                            <Plus size={16} />
                            Create Class
                        </button>
                    </div>
                </header>

                {/* Calendar Grid */}
                <div className="flex-1 overflow-auto p-6 bg-gray-50">
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-gray-400">Loading schedule...</div>
                    ) : (
                        <>
                            {filteredSessions.length === 0 && !loading && (
                                <div className="hidden">No sessions found</div>
                            )}
                            {viewMode === 'week' && renderWeekView()}
                            {viewMode === 'day' && renderWeekView()}
                            {viewMode === 'month' && renderMonthView()}
                        </>
                    )}
                </div>
            </div>

            <CreateBatchDialog
                isOpen={isCreateDialogOpen}
                onClose={() => setIsCreateDialogOpen(false)}
                onCreated={() => {
                    fetchSessions();
                    setIsCreateDialogOpen(false);
                }}
            />
            {selectedSession && (
                <SessionDetailDialog
                    isOpen={!!selectedSession}
                    session={selectedSession}
                    onClose={() => setSelectedSession(null)}
                    onUpdate={() => {
                        fetchSessions();
                    }}
                />
            )}
        </div>
    );
}
