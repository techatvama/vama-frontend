import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
    format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear,
    eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addDays, subDays,
} from 'date-fns';
import { api } from '../../lib/api';
import { parseSubject } from '../../lib/utils';
import AddStudentDialog from '../AddStudentDialog';
import {
    Mail, Phone, MapPin, Calendar, CreditCard, BookOpen,
    TrendingUp, Clock, AlertCircle,
    ArrowLeft, Loader2, GraduationCap, DollarSign,
    Star, ChevronRight, ChevronLeft, Activity, Users, Pencil, Pause, UserX, RotateCcw,
    CalendarDays, ExternalLink, FileText, Repeat, X, CheckCircle2, Filter,
} from 'lucide-react';
import Toast from './shared/Toast';
import RecordPaymentDialog from './RecordPaymentDialog';

const formatDate = (val) => {
    if (!val) return null;
    try {
        const d = new Date(val);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return val; }
};

// "16:00" / "16:00:00" → "4:00 PM"
const formatTime12h = (val) => {
    if (!val) return '';
    const [h, m] = val.split(':');
    const hour = parseInt(h, 10);
    if (Number.isNaN(hour)) return val;
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${hour12}:${m} ${period}`;
};
const formatRange12h = (start, end) => `${formatTime12h(start)} – ${formatTime12h(end)}`;

const StatCard = ({ label, value, sub, color = 'purple' }) => {
    const colors = {
        purple: 'from-[#463a7a] to-[#5e4fa2] text-white',
        green: 'from-emerald-500 to-teal-500 text-white',
        orange: 'from-orange-400 to-orange-500 text-white',
        blue: 'from-blue-500 to-blue-600 text-white',
    };
    return (
        <div className={`bg-gradient-to-br ${colors[color]} rounded-2xl p-5 shadow-md`}>
            <div className="text-3xl font-black mb-1">{value}</div>
            <div className="text-sm font-semibold opacity-90">{label}</div>
            {sub && <div className="text-xs opacity-70 mt-0.5">{sub}</div>}
        </div>
    );
};

const Tab = ({ id, label, icon: Icon, active, onClick }) => (
    <button
        onClick={() => onClick(id)}
        className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap
            ${active ? 'border-[#463a7a] text-[#463a7a] bg-[#463a7a]/5' : 'border-transparent text-slate-500 hover:text-[#463a7a] hover:bg-slate-50'}`}
    >
        <Icon size={15} />
        {label}
    </button>
);

const AttendanceBar = ({ rate }) => {
    const color = rate >= 80 ? 'from-emerald-400 to-teal-500' : rate >= 60 ? 'from-yellow-400 to-orange-400' : 'from-red-400 to-rose-500';
    return (
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div className={`bg-gradient-to-r ${color} h-full rounded-full transition-all`} style={{ width: `${rate}%` }} />
        </div>
    );
};

const ATTENDANCE_PERIODS = [
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'last_30', label: 'Last 30 Days' },
    { id: 'this_year', label: 'This Year' },
    { id: 'all', label: 'All Time' },
    { id: 'custom', label: 'Custom Range' },
];
const ATTENDANCE_STATUSES = [
    { id: 'all', label: 'All Statuses' },
    { id: 'present', label: 'Present' },
    { id: 'absent', label: 'Absent' },
    { id: 'late', label: 'Late' },
];
const ATTENDANCE_STATUS_STYLE = {
    present: 'bg-emerald-100 text-emerald-700',
    absent: 'bg-red-100 text-red-700',
    late: 'bg-orange-100 text-orange-700',
};

// Filterable attendance log — subject, date range (with month/year presets or
// a custom range) and status, all combinable, with a live summary for
// whatever the current filter combination matches.
const AttendanceLogModule = ({ studentId }) => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [subject, setSubject] = useState('all');
    const [period, setPeriod] = useState('this_month');
    const [status, setStatus] = useState('all');
    const [customStart, setCustomStart] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [customEnd, setCustomEnd] = useState(format(new Date(), 'yyyy-MM-dd'));

    useEffect(() => {
        setLoading(true);
        api.get(`/student/${studentId}/attendance`)
            .then(res => setRecords(res.data || []))
            .catch(() => setRecords([]))
            .finally(() => setLoading(false));
    }, [studentId]);

    const withSession = records.filter(r => r.session);
    const subjects = [...new Set(withSession.map(r => r.session.batch?.subject).filter(Boolean))].sort();

    const today = new Date();
    let rangeStart = null, rangeEnd = null;
    if (period === 'this_month') { rangeStart = startOfMonth(today); rangeEnd = endOfMonth(today); }
    else if (period === 'last_month') { const lm = subMonths(today, 1); rangeStart = startOfMonth(lm); rangeEnd = endOfMonth(lm); }
    else if (period === 'last_30') { rangeStart = subDays(today, 30); rangeEnd = today; }
    else if (period === 'this_year') { rangeStart = startOfYear(today); rangeEnd = today; }
    else if (period === 'custom') {
        rangeStart = customStart ? new Date(customStart + 'T00:00:00') : null;
        rangeEnd = customEnd ? new Date(customEnd + 'T23:59:59') : null;
    }

    const filtered = withSession
        .filter(r => subject === 'all' || r.session.batch?.subject === subject)
        .filter(r => status === 'all' || r.status === status)
        .filter(r => {
            if (!rangeStart || !rangeEnd) return true;
            const d = new Date(r.session.date + 'T00:00:00');
            return d >= rangeStart && d <= rangeEnd;
        })
        .sort((a, b) => (b.session.date || '').localeCompare(a.session.date || ''));

    const presentCount = filtered.filter(r => r.status === 'present').length;
    const absentCount = filtered.filter(r => r.status === 'absent').length;
    const lateCount = filtered.filter(r => r.status === 'late').length;
    const rate = filtered.length ? Math.round((presentCount / filtered.length) * 100) : 0;

    const selectCls = "px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#463a7a]/20 focus:border-[#463a7a]/40 cursor-pointer";

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3.5 border-b border-slate-100 flex items-center gap-2 bg-gradient-to-br from-[#463a7a]/5 to-transparent">
                <Filter size={15} className="text-[#463a7a]" />
                <h3 className="text-sm font-bold text-slate-700">Attendance Log</h3>
            </div>

            <div className="p-4 space-y-4">
                {/* Filter bar */}
                <div className="flex flex-wrap gap-2">
                    <select value={subject} onChange={e => setSubject(e.target.value)} className={selectCls}>
                        <option value="all">All Subjects</option>
                        {subjects.map(s => <option key={s} value={s}>{parseSubject(s)}</option>)}
                    </select>
                    <select value={period} onChange={e => setPeriod(e.target.value)} className={selectCls}>
                        {ATTENDANCE_PERIODS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                    </select>
                    {period === 'custom' && (
                        <>
                            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className={selectCls} />
                            <span className="self-center text-xs text-slate-400">to</span>
                            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className={selectCls} />
                        </>
                    )}
                    <select value={status} onChange={e => setStatus(e.target.value)} className={selectCls}>
                        {ATTENDANCE_STATUSES.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                    </select>
                </div>

                {/* Summary for the current filter combination */}
                <div className="grid grid-cols-4 gap-2">
                    {[
                        { label: 'Classes', value: filtered.length, color: 'text-slate-800' },
                        { label: 'Present', value: presentCount, color: 'text-emerald-600' },
                        { label: 'Absent', value: absentCount, color: 'text-red-600' },
                        { label: 'Rate', value: `${rate}%`, color: rate >= 80 ? 'text-emerald-600' : rate >= 60 ? 'text-orange-500' : 'text-red-500' },
                    ].map(s => (
                        <div key={s.label} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                            <div className={`text-lg font-black ${s.color}`}>{s.value}</div>
                            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mt-0.5">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Filtered record list */}
                {loading ? (
                    <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[#463a7a]" size={22} /></div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <Calendar size={26} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No attendance records match these filters</p>
                    </div>
                ) : (
                    <div className="space-y-1.5 max-h-80 overflow-y-auto">
                        {filtered.map(r => (
                            <div key={r.id} className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="min-w-0">
                                        <div className="text-sm font-semibold text-slate-800 truncate">
                                            {parseSubject(r.session.batch?.subject) || r.session.batch?.name || 'Class'}
                                        </div>
                                        <div className="text-xs text-slate-400 truncate">
                                            {format(new Date(r.session.date + 'T00:00:00'), 'EEE, MMM d yyyy')}
                                            {r.session.start_time && ` · ${r.session.start_time}–${r.session.end_time}`}
                                            {r.session.teacher_name && ` · ${r.session.teacher_name}`}
                                        </div>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ml-3 ${ATTENDANCE_STATUS_STYLE[r.status] || 'bg-slate-100 text-slate-500'}`}>
                                        {r.status || 'unknown'}
                                    </span>
                                </div>
                                {r.notes && (
                                    <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500 italic">
                                        “{r.notes}”
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const MiniScheduleCalendar = ({ studentId, onRescheduled }) => {
    const navigate = useNavigate();
    const [month, setMonth] = useState(startOfMonth(new Date()));
    const [selectedDay, setSelectedDay] = useState(new Date());
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reschedulingSession, setReschedulingSession] = useState(null);
    const [toast, setToast] = useState(null);

    const fetchSessions = useCallback(() => {
        setLoading(true);
        const start = format(startOfWeek(month, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        const end = format(endOfWeek(endOfMonth(month), { weekStartsOn: 1 }), 'yyyy-MM-dd');
        return api.get('/scheduling/calendar', { params: { student_id: studentId, start, end } })
            .then(res => setSessions(res.data?.occurrences || []))
            .catch(() => setSessions([]))
            .finally(() => setLoading(false));
    }, [studentId, month]);

    useEffect(() => { fetchSessions(); }, [fetchSessions]);

    const handleRescheduled = () => {
        setReschedulingSession(null);
        setToast({ message: 'Class rescheduled.', type: 'success' });
        fetchSessions();
        onRescheduled?.();
    };

    const byDate = sessions.reduce((acc, s) => {
        (acc[s.date] = acc[s.date] || []).push(s);
        return acc;
    }, {});

    const days = eachDayOfInterval({
        start: startOfWeek(month, { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
    });

    const selectedKey = format(selectedDay, 'yyyy-MM-dd');
    const dayClasses = (byDate[selectedKey] || []).slice().sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-br from-[#463a7a]/5 to-transparent">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <CalendarDays size={15} className="text-[#463a7a]" /> Class Schedule
                </h3>
                <button onClick={() => navigate('/schedule')}
                    className="flex items-center gap-1 text-xs font-semibold text-[#463a7a] hover:underline">
                    Scheduler <ExternalLink size={11} />
                </button>
            </div>

            <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <button onClick={() => setMonth(m => subMonths(m, 1))}
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                        <ChevronLeft size={14} />
                    </button>
                    <span className="text-sm font-bold text-slate-800">{format(month, 'MMMM yyyy')}</span>
                    <button onClick={() => setMonth(m => addMonths(m, 1))}
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                        <ChevronRight size={14} />
                    </button>
                </div>

                <div className="grid grid-cols-7 mb-1">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                        <div key={i} className="text-center text-[10px] font-bold text-slate-400 py-1">{d}</div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-y-1">
                    {days.map(day => {
                        const key = format(day, 'yyyy-MM-dd');
                        const inMonth = isSameMonth(day, month);
                        const isToday = isSameDay(day, new Date());
                        const isSel = isSameDay(day, selectedDay);
                        const dayEvents = byDate[key] || [];
                        const hasClass = dayEvents.length > 0;
                        const hasCancelled = dayEvents.length > 0 && dayEvents.every(e => e.status === 'cancelled');
                        return (
                            <button
                                key={key}
                                onClick={() => setSelectedDay(day)}
                                className={`mx-auto w-8 h-8 relative flex items-center justify-center rounded-full text-xs font-semibold transition-colors
                                    ${!inMonth ? 'text-slate-300 hover:bg-slate-50' : 'text-slate-700'}
                                    ${isSel ? 'bg-[#463a7a] text-white shadow-sm' : isToday ? 'bg-[#463a7a]/10 text-[#463a7a] ring-1 ring-[#463a7a]/30' : inMonth ? 'hover:bg-slate-100' : ''}`}
                            >
                                {format(day, 'd')}
                                {hasClass && (
                                    <span className={`absolute bottom-0.5 w-1 h-1 rounded-full
                                        ${isSel ? 'bg-white' : hasCancelled ? 'bg-red-400' : 'bg-emerald-500'}`} />
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            {format(selectedDay, 'EEEE, d MMM')}
                        </span>
                        {!isSameDay(selectedDay, new Date()) && (
                            <button onClick={() => setSelectedDay(new Date())}
                                className="text-[11px] font-semibold text-[#463a7a] hover:underline">Today</button>
                        )}
                    </div>

                    {loading ? (
                        <div className="text-xs text-slate-400 py-4 text-center">Loading…</div>
                    ) : dayClasses.length === 0 ? (
                        <div className="text-xs text-slate-400 py-4 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                            No classes this day
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {dayClasses.map(cls => (
                                <div key={cls.id}
                                    onClick={() => navigate(`/schedule?date=${cls.date}&occurrence=${cls.id}`)}
                                    title="View this class on the calendar — full roster"
                                    className={`flex items-center justify-between gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors
                                        ${cls.status === 'cancelled' ? 'bg-red-50 border-red-100 hover:border-red-200' : 'bg-slate-50 border-slate-100 hover:border-[#463a7a]/30 hover:bg-[#463a7a]/5'}`}>
                                    <div className="min-w-0">
                                        <div className={`font-semibold truncate ${cls.status === 'cancelled' ? 'text-red-500 line-through' : 'text-slate-800'}`}>
                                            {cls.name || cls.course || 'Class'}
                                        </div>
                                        <div className="text-slate-500 truncate">{cls.teacher_name || '—'}</div>
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-2">
                                        <div className="font-semibold text-slate-700">{formatRange12h(cls.start_time, cls.end_time)}</div>
                                        {cls.is_makeup && <div className="text-[10px] text-orange-500 font-bold uppercase">Makeup</div>}
                                    </div>
                                    {cls.status !== 'cancelled' && (
                                        cls.my_attendance === 'present' ? (
                                            <span title="Already attended — can't reschedule a class that already happened"
                                                className="flex-shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-md bg-emerald-50 text-emerald-600 font-semibold">
                                                <CheckCircle2 size={12} /> Attended
                                            </span>
                                        ) : (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setReschedulingSession(cls); }}
                                                title="Reschedule this class"
                                                className="flex-shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-md bg-white border border-slate-200 text-[#463a7a] font-semibold hover:bg-[#463a7a]/5 hover:border-[#463a7a]/30 transition-colors"
                                            >
                                                <Repeat size={12} /> Reschedule
                                            </button>
                                        )
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {reschedulingSession && (
                <AdminRescheduleModal
                    studentId={studentId}
                    session={reschedulingSession}
                    onClose={() => setReschedulingSession(null)}
                    onRescheduled={handleRescheduled}
                />
            )}
            {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
        </div>
    );
};

// Compact in-page reschedule flow for admins — pick a date on a calendar
// (same visual language as the Class Schedule widget above it on this page),
// then a time on that date, optional reason, confirm. Scoped to the same
// teacher as the class being moved (not "any teacher who teaches this
// subject") so what's on offer actually matches what's being rescheduled,
// and slots the student is already booked into never appear.
function AdminRescheduleModal({ studentId, session, onClose, onRescheduled }) {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [viewMonth, setViewMonth] = useState(startOfMonth(new Date()));

    const today = new Date();
    const todayKey = format(today, 'yyyy-MM-dd');
    const currentMonthKey = format(startOfMonth(today), 'yyyy-MM');
    const isCurrentMonth = format(viewMonth, 'yyyy-MM') === currentMonthKey;

    useEffect(() => {
        const rangeStart = isCurrentMonth ? today : startOfMonth(viewMonth);
        const start = format(rangeStart, 'yyyy-MM-dd');
        const end = format(endOfMonth(viewMonth), 'yyyy-MM-dd');
        setLoading(true);
        api.get(`/student/${studentId}/available-slots`, {
            params: {
                start, end,
                subject: session.course || session.batch?.subject,
                teacher_id: session.teacher_id,
                template_id: session.template_id || session.batch?.id,
            },
        })
            .then(res => {
                const data = res.data || [];
                setSlots(data);
                setSelectedDate(data.length > 0 ? data[0].date : null);
                setSelectedSlot(null);
            })
            .catch(() => setSlots([]))
            .finally(() => setLoading(false));
    }, [studentId, session, viewMonth]);

    const slotsByDate = slots.reduce((acc, s) => {
        (acc[s.date] = acc[s.date] || []).push(s);
        return acc;
    }, {});

    const gridStart = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 });
    const gridEnd   = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 1 });
    const gridDays = eachDayOfInterval({ start: gridStart, end: gridEnd });
    const daySlots = selectedDate ? (slotsByDate[selectedDate] || []) : [];

    const handleConfirm = async () => {
        if (!selectedSlot) return;
        setSubmitting(true);
        setError('');
        try {
            await api.post(`/admin/students/${studentId}/reschedule`, {
                old_session_id: session.id,
                new_session_id: selectedSlot.id,
                reason,
            });
            onRescheduled();
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to reschedule. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 bg-gradient-to-br from-[#463a7a] to-[#2d2550] text-white flex items-start justify-between flex-shrink-0">
                    <div>
                        <h3 className="text-lg font-bold flex items-center gap-2"><Repeat size={18} /> Reschedule Class</h3>
                        <p className="text-indigo-100/70 text-xs mt-1">
                            {session.name || session.course} with {session.teacher_name || '—'} · {format(new Date(session.date + 'T00:00:00'), 'MMM d')} · {formatRange12h(session.start_time, session.end_time)}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5 overflow-y-auto flex-1">
                        <div className="space-y-5">
                            {/* Step 1: pick a date */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">1. Choose a date</p>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setViewMonth(m => subMonths(m, 1))}
                                            disabled={isCurrentMonth}
                                            className="p-1 rounded-md hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronLeft size={14} className="text-slate-500" />
                                        </button>
                                        <span className="text-xs font-bold text-slate-700 w-20 text-center">{format(viewMonth, 'MMMM yyyy')}</span>
                                        <button
                                            onClick={() => setViewMonth(m => addMonths(m, 1))}
                                            className="p-1 rounded-md hover:bg-slate-100 transition-colors"
                                        >
                                            <ChevronRight size={14} className="text-slate-500" />
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-7 mb-1">
                                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                                        <div key={i} className="text-center text-[10px] font-bold text-slate-400 py-1">{d}</div>
                                    ))}
                                </div>
                                {loading ? (
                                    <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[#463a7a]" size={22} /></div>
                                ) : (
                                <div className="grid grid-cols-7 gap-y-1">
                                    {gridDays.map(day => {
                                        const key = format(day, 'yyyy-MM-dd');
                                        const inMonth = isSameMonth(day, viewMonth);
                                        const hasSlots = inMonth && (slotsByDate[key] || []).length > 0;
                                        const isPast = key < todayKey;
                                        const isSel = key === selectedDate;
                                        return (
                                            <button
                                                key={key}
                                                disabled={!hasSlots}
                                                onClick={() => { setSelectedDate(key); setSelectedSlot(null); }}
                                                className={`mx-auto w-8 h-8 relative flex items-center justify-center rounded-full text-xs font-semibold transition-colors
                                                    ${!inMonth ? 'text-slate-200' : isPast || !hasSlots ? 'text-slate-300' : 'text-slate-700'}
                                                    ${isSel ? 'bg-[#463a7a] text-white shadow-sm' : hasSlots ? 'hover:bg-[#463a7a]/10' : ''}`}
                                            >
                                                {format(day, 'd')}
                                                {hasSlots && (
                                                    <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${isSel ? 'bg-white' : 'bg-emerald-500'}`} />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                                )}
                            </div>

                            {/* Step 2: pick a time on that date */}
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
                                    2. {selectedDate ? `Available on ${format(new Date(selectedDate + 'T00:00:00'), 'EEEE, MMM d')}` : 'Available times'}
                                </p>
                                {loading ? null : daySlots.length === 0 ? (
                                    <div className="text-xs text-slate-400 py-4 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                        {slots.length === 0
                                            ? `No available slots with ${session.teacher_name || 'this teacher'} in ${format(viewMonth, 'MMMM')}. Try another month.`
                                            : 'No slots this day'}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        {daySlots.map(slot => {
                                            const isFull = slot.capacity > 0 && slot.enrolled >= slot.capacity;
                                            const isSel = selectedSlot?.id === slot.id;
                                            return (
                                                <button
                                                    key={slot.id}
                                                    disabled={isFull}
                                                    onClick={() => setSelectedSlot(slot)}
                                                    className={`relative text-left p-3 rounded-xl border-2 text-xs transition-all
                                                        ${isFull ? 'bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed'
                                                            : isSel ? 'bg-[#463a7a]/5 border-[#463a7a] shadow-sm'
                                                            : 'bg-white border-slate-200 hover:border-[#463a7a]/40'}`}
                                                >
                                                    {isSel && <CheckCircle2 size={14} className="absolute top-2 right-2 text-[#463a7a]" />}
                                                    <div className="font-bold text-slate-800">{formatRange12h(slot.start_time, slot.end_time)}</div>
                                                    <div className={`mt-1 font-semibold ${isFull ? 'text-red-500' : 'text-emerald-600'}`}>
                                                        {isFull ? 'Full' : `${slot.enrolled}/${slot.capacity || '∞'}`}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                </div>

                {selectedSlot && (
                    <div className="p-5 border-t border-slate-100 flex-shrink-0 space-y-3">
                        {error && (
                            <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>
                        )}
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Reason (optional) — e.g. teacher request, student conflict…"
                            rows={2}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-[#463a7a]/15"
                        />
                        <button
                            onClick={handleConfirm}
                            disabled={submitting}
                            className="w-full py-3 bg-[#463a7a] text-white rounded-xl font-bold text-sm shadow-lg hover:bg-[#342a5b] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {submitting ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                            {submitting ? 'Rescheduling…' : `Confirm — new time ${formatTime12h(selectedSlot.start_time)}`}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function StudentProfilePage() {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState(null);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [editOpen, setEditOpen] = useState(false);
    const [statusSaving, setStatusSaving] = useState(false);
    const [paymentTarget, setPaymentTarget] = useState(null);

    const load = useCallback(() => {
        setLoading(true);
        setError(null);
        return api.get(`/admin/student/${studentId}/complete-profile`)
            .then(res => setStudent(res.data))
            .catch(err => {
                // Try basic fallback
                return api.get(`/students/${studentId}`)
                    .then(r => setStudent({
                        ...r.data,
                        financial: { total_fees: 0, fees_paid: 0, outstanding: 0, payment_history: [] },
                        enrollments: [], upcoming_classes: [],
                        performance: { overall_grade: '—', attendance_percentage: 0, skills_progress: [], recent_feedback: [] }
                    }))
                    .catch(() => setError('Student not found'));
            })
            .finally(() => setLoading(false));
    }, [studentId]);

    useEffect(() => { load(); }, [load]);

    const STATUS_CONFIRM = {
        on_break: 'Mark this student as On Break?\n\nThey\'ll be removed from all class booking rosters immediately, their active package will be paused (session/expiry countdown stops), and payment reminders will be hidden until they\'re added back. All history and data stays intact — adding them into any class slot later automatically marks them Active again.',
        dropped: 'Mark this student as Dropped?\n\nThey\'ll be removed from all class booking rosters immediately and payment reminders will be hidden. Nothing is deleted — all attendance/payment history stays visible, and adding them into any class slot later automatically marks them Active again.',
        active: 'Mark this student as Active again?\n\nIf they were On Break, their package validity will be extended by however long they were paused, so they don\'t lose sessions they weren\'t using. (Note: adding them into a class slot does this automatically — you only need this button to reactivate without booking a class yet.)',
    };

    const changeEnrollmentStatus = (status) => {
        if (statusSaving || status === (student?.enrollment_status || 'active')) return;
        if (!confirm(STATUS_CONFIRM[status])) return;
        setStatusSaving(true);
        api.put(`/students/${studentId}/enrollment-status`, { status })
            .then(() => load())
            .catch(err => alert(err.response?.data?.detail || 'Failed to update status'))
            .finally(() => setStatusSaving(false));
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
                <Loader2 className="h-10 w-10 animate-spin text-[#463a7a] mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Loading profile...</p>
            </div>
        </div>
    );

    if (error || !student) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
                <Users size={32} className="text-slate-400" />
            </div>
            <p className="text-slate-500 text-lg font-medium">{error || 'Student not found'}</p>
            <button onClick={() => navigate('/students')}
                className="flex items-center gap-2 px-4 py-2 bg-[#463a7a] text-white rounded-lg font-medium hover:bg-[#342a5b] transition-colors">
                <ArrowLeft size={16} /> Back to Students
            </button>
        </div>
    );

    const initials = `${student.first_name?.[0] || ''}${student.last_name?.[0] || ''}`.toUpperCase();
    const fullName = `${student.first_name || ''} ${student.last_name || ''}`.trim();
    const attendancePct = student.performance?.attendance_percentage ?? 0;
    const totalEnrollments = student.enrollments?.length ?? 0;
    const classesThisMonth = student.classes_this_month ?? 0;
    const outstanding = student.financial?.outstanding ?? 0;
    const enrolledSubjects = student.enrolled_subjects?.length
        ? student.enrolled_subjects
        : (student.desired_course || student.instrument)
            ? [{ subject: student.desired_course || student.instrument, grade: student.current_grade || 'Debut', teacher: student.teacher?.name }]
            : [];

    // ── Package status — sessions left + days to expiry, so an admin can
    // spot "about to run out" without opening the Payments tab ──
    const pkg = student.active_package;
    const daysToExpiry = pkg?.end_date ? Math.ceil((new Date(pkg.end_date) - new Date()) / 86400000) : null;
    const pkgCritical = pkg && ((pkg.sessions_remaining ?? 99) <= 2 || (daysToExpiry !== null && daysToExpiry <= 7));
    const pkgWarning = !pkgCritical && pkg && ((pkg.sessions_remaining ?? 99) <= 4 || (daysToExpiry !== null && daysToExpiry <= 21));
    const pkgColor = !pkg ? 'text-slate-300' : pkgCritical ? 'text-red-300' : pkgWarning ? 'text-yellow-300' : 'text-emerald-300';

    // ── Admin-focused metrics ──
    const overallGrade = student.performance?.overall_grade ?? '—';
    const paymentStatus = outstanding > 0
      ? outstanding > outstanding * 0.2 ? 'Overdue' : 'Partial'
      : 'Paid';

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Activity },
        { id: 'classes', label: `Classes (${totalEnrollments})`, icon: BookOpen },
        { id: 'payments', label: 'Payments', icon: CreditCard },
        { id: 'performance', label: 'Performance', icon: TrendingUp },
    ];

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Breadcrumb bar */}
            <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between gap-2 text-sm sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate('/students')}
                        className="flex items-center gap-1.5 text-slate-500 hover:text-[#463a7a] font-medium transition-colors">
                        <ArrowLeft size={15} /> Students
                    </button>
                    <ChevronRight size={14} className="text-slate-300" />
                    <span className="text-slate-800 font-semibold">{fullName}</span>
                </div>
                <div className="flex items-center gap-2">
                    {(student.enrollment_status || 'active') !== 'dropped' && (
                        <>
                            {(student.enrollment_status || 'active') === 'active' ? (
                                <button onClick={() => changeEnrollmentStatus('on_break')} disabled={statusSaving}
                                    className="flex items-center gap-1.5 px-3.5 py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg text-xs font-bold hover:bg-yellow-100 transition-colors disabled:opacity-50">
                                    <Pause size={13} /> Mark On Break
                                </button>
                            ) : (
                                <button onClick={() => changeEnrollmentStatus('active')} disabled={statusSaving}
                                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors disabled:opacity-50">
                                    <RotateCcw size={13} /> Mark Active
                                </button>
                            )}
                            <button onClick={() => changeEnrollmentStatus('dropped')} disabled={statusSaving}
                                className="flex items-center gap-1.5 px-3.5 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors disabled:opacity-50">
                                <UserX size={13} /> Mark Dropped
                            </button>
                        </>
                    )}
                    {student.enrollment_status === 'dropped' && (
                        <button onClick={() => changeEnrollmentStatus('active')} disabled={statusSaving}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors disabled:opacity-50">
                            <RotateCcw size={13} /> Reactivate
                        </button>
                    )}
                    <button onClick={() => navigate('/admin/invoices/new', { state: { studentId: student.id, studentName: `${student.first_name} ${student.last_name}` } })}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors">
                        <FileText size={13} /> Create Invoice
                    </button>
                    <button onClick={() => setEditOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-[#463a7a] text-white rounded-lg text-xs font-bold hover:bg-[#342a5b] transition-colors">
                        <Pencil size={13} /> Edit Details
                    </button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-5 py-6 space-y-5">
                {/* ── Hero Card ── */}
                <div className="bg-gradient-to-br from-[#463a7a] via-[#3a2f6b] to-[#2d2550] rounded-2xl overflow-hidden shadow-xl">
                    {/* subtle pattern */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #fff 0px, transparent 60%)' }} />

                    <div className="p-7 relative">
                        <div className="flex flex-col sm:flex-row items-start gap-5">
                            {/* Avatar */}
                            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur border-2 border-white/30 flex items-center justify-center text-white font-black text-2xl flex-shrink-0 shadow-lg">
                                {initials || <GraduationCap size={32} />}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h1 className="text-2xl font-black text-white">{fullName || 'Unknown Student'}</h1>
                                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border
                                        ${student.enrollment_status === 'dropped'
                                            ? 'bg-red-400/20 text-red-200 border-red-400/30'
                                            : student.enrollment_status === 'on_break'
                                            ? 'bg-yellow-400/20 text-yellow-200 border-yellow-400/30'
                                            : 'bg-emerald-400/20 text-emerald-200 border-emerald-400/30'}`}>
                                        {student.enrollment_status === 'dropped' ? 'Dropped'
                                            : student.enrollment_status === 'on_break' ? 'On Break' : 'Active'}
                                    </span>
                                    {outstanding > 0 && (
                                        <span className="px-2.5 py-1 bg-orange-400/20 text-orange-200 text-xs font-semibold rounded-full border border-orange-400/30 flex items-center gap-1">
                                            <AlertCircle size={11} /> ₹{outstanding.toLocaleString()} Due
                                        </span>
                                    )}
                                </div>

                                {/* Subjects — every instrument this student takes, always visible
                                    here regardless of count, so an admin never has to dig for it */}
                                {enrolledSubjects.length > 0 && (
                                    <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                                        {enrolledSubjects.map((s, i) => (
                                            <span key={i}
                                                title={s.teacher ? `Teacher: ${s.teacher}` : undefined}
                                                className="flex items-center gap-1.5 px-2.5 py-1 bg-white/15 text-white text-xs font-bold rounded-lg border border-white/20">
                                                <GraduationCap size={11} className="opacity-70" />
                                                {parseSubject(s.subject) || s.subject}
                                                <span className="opacity-60 font-semibold">· {s.grade}</span>
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 mt-3">
                                    {student.email && (
                                        <div className="flex items-center gap-2 text-white/75 text-sm">
                                            <Mail size={13} className="flex-shrink-0" />
                                            <span className="truncate">{student.email}</span>
                                        </div>
                                    )}
                                    {student.primary_phone_number && (
                                        <div className="flex items-center gap-2 text-white/75 text-sm">
                                            <Phone size={13} />
                                            <span>{student.primary_phone_number}</span>
                                        </div>
                                    )}
                                    {student.nearest_vama_center && (
                                        <div className="flex items-center gap-2 text-white/75 text-sm">
                                            <MapPin size={13} />
                                            <span>{student.nearest_vama_center}</span>
                                        </div>
                                    )}
                                    {(student.enrollment_date || student.created_at) && (
                                        <div className="flex items-center gap-2 text-white/75 text-sm">
                                            <Calendar size={13} />
                                            <span>Joined {formatDate(student.enrollment_date || student.created_at)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Stats row — Admin metrics */}
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-6">
                            {/* Attendance */}
                            <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center border border-white/10">
                                <div className={`text-xl font-black ${attendancePct >= 80 ? 'text-emerald-300' : attendancePct >= 60 ? 'text-yellow-300' : 'text-red-300'}`}>
                                    {attendancePct}%
                                </div>
                                <div className="text-xs text-white/60 mt-0.5">Attendance</div>
                            </div>

                            {/* Payment Status */}
                            <button
                              onClick={() => setActiveTab('payments')}
                              className="bg-white/10 backdrop-blur rounded-xl p-3 text-center border border-white/10 hover:bg-white/20 hover:border-white/30 transition-all cursor-pointer group"
                              title="Click to view payments and invoices"
                            >
                                <div className={`text-lg font-black group-hover:scale-110 transition-transform ${paymentStatus === 'Paid' ? 'text-emerald-300' : paymentStatus === 'Partial' ? 'text-yellow-300' : 'text-red-300'}`}>
                                    {paymentStatus}
                                </div>
                                {outstanding > 0 && <div className="text-xs text-orange-200 mt-0.5">₹{outstanding.toLocaleString()}</div>}
                                <div className="text-xs text-white/50 mt-1">Click to view</div>
                            </button>

                            {/* Overall Grade */}
                            <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center border border-white/10">
                                <div className="text-xl font-black text-purple-300">{overallGrade}</div>
                                <div className="text-xs text-white/60 mt-0.5">Grade</div>
                            </div>

                            {/* Classes already held this calendar month */}
                            <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center border border-white/10" title="Classes completed this month">
                                <div className="text-xl font-black text-blue-300">{classesThisMonth}</div>
                                <div className="text-xs text-white/60 mt-0.5">Done This Month</div>
                            </div>

                            {/* Package — sessions left / days to expiry, flagged early so an
                                admin catches a lapsing package before the student does */}
                            <button
                                onClick={() => setActiveTab('payments')}
                                className="bg-white/10 backdrop-blur rounded-xl p-3 text-center border border-white/10 hover:bg-white/20 hover:border-white/30 transition-all cursor-pointer group"
                                title={pkg ? `${pkg.name || 'Package'} · ${pkg.sessions_remaining ?? '—'} sessions left${daysToExpiry !== null ? ` · expires in ${daysToExpiry}d` : ''}` : 'No active package'}
                            >
                                <div className={`text-lg font-black group-hover:scale-110 transition-transform ${pkgColor}`}>
                                    {pkg ? `${pkg.sessions_remaining ?? '—'} left` : '—'}
                                </div>
                                <div className="text-xs text-white/60 mt-0.5">Package</div>
                                {pkg && daysToExpiry !== null && (
                                    <div className={`text-[10px] mt-0.5 ${pkgCritical ? 'text-red-200' : pkgWarning ? 'text-yellow-200' : 'text-white/50'}`}>
                                        {daysToExpiry < 0 ? 'Expired' : `${daysToExpiry}d left`}
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Tab Panel ── */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="flex overflow-x-auto border-b border-slate-200">
                        {tabs.map(t => <Tab key={t.id} {...t} active={activeTab === t.id} onClick={setActiveTab} />)}
                    </div>

                    <div className="p-6">
                        {/* ─ Overview ─ */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                {/* Personal details grid */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Personal Details</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { label: 'Email', value: student.email, icon: Mail },
                                            { label: 'Phone', value: student.primary_phone_number, icon: Phone },
                                            { label: 'Center', value: student.nearest_vama_center, icon: MapPin },
                                            { label: 'Gender', value: student.gender, icon: Users },
                                            { label: 'Date of Birth', value: formatDate(student.date_of_birth), icon: Calendar },
                                            { label: 'Guardian Email', value: student.guardian_email, icon: Mail },
                                            { label: 'Emergency Contact', value: student.emergency_contact, icon: Phone },
                                            { label: 'Parent Name', value: student.parent_name, icon: Users },
                                            { label: 'City', value: student.city, icon: MapPin },
                                            { label: 'State', value: student.state, icon: MapPin },
                                            { label: 'Class Frequency', value: student.class_frequency, icon: Calendar },
                                            { label: 'Preferred Contact', value: student.preferred_mode_of_contact, icon: Phone },
                                            { label: 'Blood Group', value: student.blood_group, icon: AlertCircle },
                                            { label: 'Allergies', value: student.allergies, icon: AlertCircle },
                                            { label: 'Referrer', value: student.referrer, icon: Users },
                                        ].filter(f => f.value).map(field => (
                                            <div key={field.label} className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                                                <div className="p-2 bg-[#463a7a]/10 rounded-lg flex-shrink-0">
                                                    <field.icon size={14} className="text-[#463a7a]" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-xs text-slate-400 mb-0.5">{field.label}</div>
                                                    <div className="text-sm font-semibold text-slate-800 truncate">{field.value}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Freeform / longer answers — notes and any center-defined
                                        custom questions the applicant answered — get their own
                                        full-width rows since they don't fit the compact grid above */}
                                    {(student.notes || student.custom_fields?.length > 0) && (
                                        <div className="mt-3 space-y-2">
                                            {student.notes && (
                                                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                                                    <div className="text-xs text-slate-400 mb-1">Additional Notes</div>
                                                    <div className="text-sm font-semibold text-slate-800 whitespace-pre-wrap">{student.notes}</div>
                                                </div>
                                            )}
                                            {(student.custom_fields || []).map((cf, i) => (
                                                <div key={i} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                                                    <div className="text-xs text-slate-400 mb-1">{cf.label}</div>
                                                    <div className="text-sm font-semibold text-slate-800 whitespace-pre-wrap">{cf.value}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Attendance summary */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Attendance Overview</h3>
                                    <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="font-semibold text-slate-700">Overall Attendance</span>
                                            <span className={`text-2xl font-black ${attendancePct >= 80 ? 'text-emerald-600' : attendancePct >= 60 ? 'text-orange-500' : 'text-red-500'}`}>
                                                {attendancePct}%
                                            </span>
                                        </div>
                                        <AttendanceBar rate={attendancePct} />
                                        <div className="mt-2 text-xs text-slate-400">
                                            {attendancePct >= 80 ? 'Excellent attendance — keep it up!' :
                                             attendancePct >= 60 ? 'Attendance needs improvement.' :
                                             'Critical: attendance is below 60%.'}
                                        </div>
                                    </div>
                                </div>

                                <AttendanceLogModule studentId={studentId} />

                                {/* Upcoming classes */}
                                {student.upcoming_classes?.length > 0 ? (
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Upcoming Classes</h3>
                                        <div className="space-y-2">
                                            {student.upcoming_classes.map(cls => (
                                                <div key={cls.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-blue-500 rounded-lg">
                                                            <Clock className="text-white" size={15} />
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-slate-800 text-sm">{cls.subject}</div>
                                                            <div className="text-xs text-slate-500">{cls.teacher}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-semibold text-slate-700 text-sm">{formatDate(cls.date)}</div>
                                                        <div className="text-xs text-slate-500">{cls.time}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        <Clock size={28} className="mx-auto mb-2 opacity-40" />
                                        <p className="text-sm">No upcoming classes scheduled</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ─ Classes ─ */}
                        {activeTab === 'classes' && (
                            <div className="space-y-6">
                                <MiniScheduleCalendar studentId={studentId} onRescheduled={load} />

                                <AttendanceLogModule studentId={studentId} />
                            </div>
                        )}

                        {/* ─ Payments ─ */}
                        {activeTab === 'payments' && (
                            <div className="space-y-5">
                                <div className="grid grid-cols-3 gap-4">
                                    <StatCard label="Total Billed" value={`₹${(student.financial?.total_fees ?? 0).toLocaleString()}`} color="blue" />
                                    <StatCard label="Paid" value={`₹${(student.financial?.fees_paid ?? 0).toLocaleString()}`} color="green" />
                                    <StatCard label="Outstanding" value={`₹${outstanding.toLocaleString()}`} color={outstanding > 0 ? 'orange' : 'green'} />
                                </div>

                                {student.financial?.next_due_date && outstanding > 0 && (
                                    <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                                        <AlertCircle className="text-orange-500 flex-shrink-0" size={20} />
                                        <div>
                                            <span className="font-semibold text-orange-900 text-sm">Next payment due: </span>
                                            <span className="text-orange-700 text-sm">{formatDate(student.financial.next_due_date)}</span>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Payment History</h3>
                                    {!student.financial?.payment_history?.length ? (
                                        <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                            <CreditCard size={32} className="mx-auto mb-2 opacity-30" />
                                            <p className="text-sm">No payment records found</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {student.financial.payment_history.map(p => (
                                                <button
                                                  key={p.id}
                                                  onClick={() => setPaymentTarget(p)}
                                                  className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-[#463a7a]/40 hover:bg-slate-50 transition-all cursor-pointer text-left group"
                                                  title="View & record payment"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${p.status === 'paid' ? 'bg-emerald-100' : p.status === 'overdue' ? 'bg-red-100' : 'bg-orange-100'}`}>
                                                            <CreditCard size={15} className={p.status === 'paid' ? 'text-emerald-600' : p.status === 'overdue' ? 'text-red-600' : 'text-orange-600'} />
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-slate-800 text-sm">{p.type}</div>
                                                            <div className="text-xs text-slate-400">{formatDate(p.date)}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-black text-slate-900">₹{p.amount?.toLocaleString()}</span>
                                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold
                                                            ${p.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                                              p.status === 'overdue' ? 'bg-red-100 text-red-700' :
                                                              'bg-orange-100 text-orange-700'}`}>
                                                            {p.status}
                                                        </span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ─ Performance ─ */}
                        {activeTab === 'performance' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-3 gap-4">
                                    <StatCard label="Overall Grade" value={student.performance?.overall_grade ?? '—'} color="purple" />
                                    <StatCard label="Attendance" value={`${attendancePct}%`} color={attendancePct >= 80 ? 'green' : 'orange'} />
                                    <StatCard label="Enrolled In" value={`${totalEnrollments} class${totalEnrollments !== 1 ? 'es' : ''}`} color="blue" />
                                </div>

                                {student.performance?.skills_progress?.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Skills Progress</h3>
                                        <div className="space-y-4">
                                            {student.performance.skills_progress.map(skill => (
                                                <div key={skill.skill}>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-sm font-semibold text-slate-700">{skill.skill}</span>
                                                        <span className="text-sm font-black text-[#463a7a]">{skill.level}%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                                        <div className="bg-gradient-to-r from-[#463a7a] to-[#5e4fa2] h-full rounded-full"
                                                            style={{ width: `${skill.level}%` }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {student.performance?.recent_feedback?.length > 0 ? (
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Recent Feedback</h3>
                                        <div className="space-y-3">
                                            {student.performance.recent_feedback.map((fb, idx) => (
                                                <div key={idx} className="border border-slate-200 rounded-xl p-5 hover:border-[#463a7a]/30 transition-colors">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div>
                                                            <div className="font-semibold text-slate-900 text-sm">{fb.subject}</div>
                                                            <div className="text-xs text-slate-500 mt-0.5">{fb.teacher} · {formatDate(fb.date)}</div>
                                                        </div>
                                                        <div className="flex gap-0.5">
                                                            {[1,2,3,4,5].map(n => (
                                                                <Star key={n} size={14}
                                                                    className={n <= (fb.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200 fill-slate-200'} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <p className="text-slate-600 text-sm leading-relaxed">{fb.feedback}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        <Star size={32} className="mx-auto mb-2 opacity-30" />
                                        <p className="text-sm">No feedback recorded yet</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <AddStudentDialog
                isOpen={editOpen}
                onClose={() => setEditOpen(false)}
                initialData={student}
                onSubmit={async () => { await load(); }}
            />

            {paymentTarget && (
                <RecordPaymentDialog
                    invoiceId={paymentTarget.id}
                    onClose={() => setPaymentTarget(null)}
                    onRecorded={load}
                />
            )}
        </div>
    );
}
