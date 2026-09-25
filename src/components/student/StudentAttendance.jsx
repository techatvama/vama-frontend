import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { api } from '../../lib/api';
import { parseSubject } from '../../lib/utils';
import {
    CheckCircle2, XCircle, MessageSquare, Calendar, Clock,
    Music, Loader2, Ban, ChevronDown, Filter,
} from 'lucide-react';
import {
    format, parse, startOfMonth, endOfMonth, startOfYear, subMonths, subDays,
} from 'date-fns';
import { useNavigate } from 'react-router';

// ─── Status config ───────────────────────────────────────────────────────────
const STATUS = {
    present:          { label: 'Present',   icon: CheckCircle2, iconColor: 'text-emerald-500', pill: 'bg-emerald-50 text-emerald-700', ring: 'bg-emerald-100' },
    absent:           { label: 'Absent',    icon: XCircle,      iconColor: 'text-red-500',     pill: 'bg-red-50 text-red-700',         ring: 'bg-red-100'     },
    student_cancelled:{ label: 'Cancelled', icon: Ban,          iconColor: 'text-orange-500',  pill: 'bg-orange-50 text-orange-700',   ring: 'bg-orange-100'  },
};
const getStatus = (s) => STATUS[s] || { label: s, icon: XCircle, iconColor: 'text-slate-400', pill: 'bg-slate-50 text-slate-600', ring: 'bg-slate-100' };

// Same period vocabulary as the admin attendance log, for consistency across portals.
const PERIODS = [
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'last_30',    label: 'Last 30 Days' },
    { id: 'this_year',  label: 'This Year' },
    { id: 'all',        label: 'All Time' },
    { id: 'custom',     label: 'Custom Range' },
];
const STATUSES = [
    { id: 'all',      label: 'All Statuses' },
    { id: 'present',  label: 'Present' },
    { id: 'absent',   label: 'Absent' },
    { id: 'feedback', label: 'With Feedback' },
];

// ─── Select component ────────────────────────────────────────────────────────
function Sel({ value, onChange, options, className = '' }) {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className={`appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#463a7a]/20 focus:border-[#463a7a]/40 cursor-pointer ${className}`}
            >
                {options.map(o => <option key={o.id ?? o} value={o.id ?? o}>{o.label ?? o}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
    );
}

export default function StudentAttendance() {
    const [student, setStudent]     = useState(null);
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading]     = useState(true);

    const [subject, setSubject]     = useState('all');
    const [period, setPeriod]       = useState('this_month');
    const [status, setStatus]       = useState('all');
    const [customStart, setCustomStart] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [customEnd, setCustomEnd]     = useState(format(new Date(), 'yyyy-MM-dd'));

    const navigate = useNavigate();
    const [studentId, setStudentId] = useState(null);

    useEffect(() => {
        const stored = localStorage.getItem('student');
        if (stored) { const s = JSON.parse(stored); setStudent(s); setStudentId(s.id); }
        else navigate('/student-login');
    }, [navigate]);

    const fetchAttendance = useCallback(async (isRefresh = false) => {
        if (!studentId) return;
        if (!isRefresh) setLoading(true);
        try {
            const res = await api.get(`/student/${studentId}/attendance`);
            setAttendance(res.data);
        } catch (err) { console.error(err); }
        finally { if (!isRefresh) setLoading(false); }
    }, [studentId]);

    useEffect(() => { if (studentId) fetchAttendance(); }, [studentId, fetchAttendance]);
    useAutoRefresh(fetchAttendance, 45000);

    // Subjects the student is actually enrolled in — filter only shows up
    // when there's more than one, since it's a no-op otherwise.
    const subjects = useMemo(
        () => [...new Set(attendance.map(a => a.session?.batch?.subject).filter(Boolean))].sort(),
        [attendance]
    );

    // ── Date range for the selected period ──
    const { rangeStart, rangeEnd } = useMemo(() => {
        const today = new Date();
        if (period === 'this_month') return { rangeStart: startOfMonth(today), rangeEnd: endOfMonth(today) };
        if (period === 'last_month') { const lm = subMonths(today, 1); return { rangeStart: startOfMonth(lm), rangeEnd: endOfMonth(lm) }; }
        if (period === 'last_30')    return { rangeStart: subDays(today, 30), rangeEnd: today };
        if (period === 'this_year')  return { rangeStart: startOfYear(today), rangeEnd: today };
        if (period === 'custom')     return {
            rangeStart: customStart ? new Date(customStart + 'T00:00:00') : null,
            rangeEnd:   customEnd   ? new Date(customEnd + 'T23:59:59')   : null,
        };
        return { rangeStart: null, rangeEnd: null }; // 'all'
    }, [period, customStart, customEnd]);

    // ── Filter logic ──
    const filtered = useMemo(() => {
        return attendance.filter(a => {
            if (subject !== 'all' && a.session?.batch?.subject !== subject) return false;

            if (status === 'present'  && a.status !== 'present')  return false;
            if (status === 'absent'   && a.status !== 'absent')   return false;
            if (status === 'feedback' && !a.notes)                return false;

            if (rangeStart && rangeEnd) {
                const d = a.session?.date ? parse(a.session.date, 'yyyy-MM-dd', new Date()) : null;
                if (!d || d < rangeStart || d > rangeEnd) return false;
            }

            return true;
        });
    }, [attendance, subject, status, rangeStart, rangeEnd]);

    const presentCount = filtered.filter(r => r.status === 'present').length;
    const absentCount  = filtered.filter(r => r.status === 'absent').length;
    const rate = filtered.length ? Math.round((presentCount / filtered.length) * 100) : 0;

    const anyFilter = subject !== 'all' || status !== 'all' || period !== 'this_month';
    const clearAll = () => { setSubject('all'); setStatus('all'); setPeriod('this_month'); };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
            <Loader2 className="w-10 h-10 text-[#463a7a] animate-spin" />
        </div>
    );

    return (
        <div className="pb-24 bg-[#f8fafc] min-h-screen">

            {/* ── Hero ── */}
            <div className="relative bg-gradient-to-br from-[#463a7a] to-[#2d2550] px-5 pt-8 pb-6 overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight mb-1">
                        Attendance & Feedback
                    </h1>
                    <p className="text-indigo-100/50 text-xs sm:text-sm font-medium">
                        Track your class attendance and teacher feedback
                    </p>
                </div>
            </div>

            {/* ── Filter bar (matches the admin attendance-log module) ── */}
            <div className="bg-white border-b border-slate-100 shadow-sm">
                <div className="px-4 py-3 flex items-center gap-2 border-b border-slate-50">
                    <Filter size={13} className="text-[#463a7a]" />
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Filters</span>
                </div>
                <div className="px-4 py-3 flex flex-wrap gap-2">
                    {subjects.length > 1 && (
                        <Sel value={subject} onChange={setSubject}
                            options={[{ id: 'all', label: 'All Subjects' }, ...subjects.map(s => ({ id: s, label: parseSubject(s) }))]} />
                    )}
                    <Sel value={period} onChange={setPeriod} options={PERIODS} />
                    {period === 'custom' && (
                        <>
                            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#463a7a]/20" />
                            <span className="self-center text-xs text-slate-400">to</span>
                            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#463a7a]/20" />
                        </>
                    )}
                    <Sel value={status} onChange={setStatus} options={STATUSES} />
                    {anyFilter && (
                        <button onClick={clearAll}
                            className="ml-auto text-[11px] font-black text-rose-400 hover:text-rose-600 transition-colors">
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* ── Summary tiles ── */}
            <div className="px-4 pt-4">
                <div className="grid grid-cols-4 gap-2 max-w-2xl mx-auto">
                    {[
                        { label: 'Classes', value: filtered.length, color: 'text-slate-900' },
                        { label: 'Present', value: presentCount,    color: 'text-emerald-600' },
                        { label: 'Absent',  value: absentCount,     color: 'text-red-500' },
                        { label: 'Rate',    value: `${rate}%`,      color: 'text-[#463a7a]' },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="bg-white border border-slate-100 rounded-xl p-3 text-center shadow-sm">
                            <p className={`text-lg font-black leading-none ${color}`}>{value}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── List ── */}
            <div className="px-4 pt-4 pb-6 space-y-3 max-w-2xl mx-auto">
                {filtered.length === 0 ? (
                    <div className="py-20 text-center">
                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <Music size={26} className="text-slate-300" />
                        </div>
                        <p className="text-base font-black text-slate-300">No records found</p>
                        <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest mt-1">
                            {anyFilter ? 'Try adjusting your filters' : 'Attendance will appear here after classes'}
                        </p>
                    </div>
                ) : filtered.map(record => {
                    const s = getStatus(record.status);
                    const StatusIcon = s.icon;
                    const subj = parseSubject(record.session?.batch?.subject) || 'Class';
                    const className = record.session?.batch?.name || `${subj} Session`;
                    const sessionDate = record.session?.date
                        ? format(parse(record.session.date, 'yyyy-MM-dd', new Date()), 'MMM d, yyyy')
                        : null;
                    const timeRange = record.session?.start_time
                        ? `${record.session.start_time} – ${record.session.end_time}`
                        : null;

                    return (
                        <div key={record.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="flex items-start gap-3 p-4">
                                {/* Status icon */}
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${s.ring}`}>
                                    <StatusIcon size={18} className={s.iconColor} />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                                        <span className="px-2 py-0.5 bg-indigo-50 text-[#463a7a] text-[10px] font-black uppercase tracking-wide rounded-md whitespace-nowrap">
                                            {subj}
                                        </span>
                                        <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wide rounded-md whitespace-nowrap ${s.pill}`}>
                                            {s.label}
                                        </span>
                                    </div>
                                    <p className="text-sm font-black text-slate-900 leading-snug mb-2">{className}</p>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                                        {sessionDate && (
                                            <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                                                <Calendar size={11} className="flex-shrink-0" /> {sessionDate}
                                            </span>
                                        )}
                                        {timeRange && (
                                            <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                                                <Clock size={11} className="flex-shrink-0" /> {timeRange}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Feedback */}
                            {record.notes && (
                                <div className="mx-4 mb-4 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <MessageSquare size={11} className="text-indigo-500 flex-shrink-0" />
                                        <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Teacher Feedback</span>
                                    </div>
                                    <p className="text-xs text-indigo-900 font-medium leading-relaxed break-words">
                                        "{record.notes}"
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
