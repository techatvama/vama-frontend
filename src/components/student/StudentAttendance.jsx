import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { api } from '../../lib/api';
import { parseSubject } from '../../lib/utils';
import {
    CheckCircle2, XCircle, MessageSquare, Calendar, Clock,
    TrendingUp, Music, Loader2, Search, Ban, ChevronDown, X,
} from 'lucide-react';
import {
    format, parse, isWithinInterval, startOfWeek, endOfWeek,
    startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay,
} from 'date-fns';
import { useNavigate } from 'react-router';

// ─── Status config ───────────────────────────────────────────────────────────
const STATUS = {
    present:          { label: 'Present',   icon: CheckCircle2, iconColor: 'text-emerald-500', pill: 'bg-emerald-50 text-emerald-700', ring: 'bg-emerald-100' },
    absent:           { label: 'Absent',    icon: XCircle,      iconColor: 'text-red-500',     pill: 'bg-red-50 text-red-700',         ring: 'bg-red-100'     },
    student_cancelled:{ label: 'Cancelled', icon: Ban,          iconColor: 'text-orange-500',  pill: 'bg-orange-50 text-orange-700',   ring: 'bg-orange-100'  },
};
const getStatus = (s) => STATUS[s] || { label: s, icon: XCircle, iconColor: 'text-slate-400', pill: 'bg-slate-50 text-slate-600', ring: 'bg-slate-100' };

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Quick date preset ranges
function presetRange(preset) {
    const now = new Date();
    if (preset === 'today')        return { from: startOfDay(now),             to: endOfDay(now) };
    if (preset === 'this_week')    return { from: startOfWeek(now, {weekStartsOn: 1}), to: endOfWeek(now, {weekStartsOn: 1}) };
    if (preset === 'this_month')   return { from: startOfMonth(now),           to: endOfMonth(now) };
    if (preset === 'last_month')   return { from: startOfMonth(subMonths(now,1)), to: endOfMonth(subMonths(now,1)) };
    if (preset === 'last_3months') return { from: startOfMonth(subMonths(now,2)), to: endOfMonth(now) };
    return null;
}

// ─── Select component ────────────────────────────────────────────────────────
function Sel({ value, onChange, children, placeholder }) {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full appearance-none bg-white border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-xs font-black text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#463a7a]/20 cursor-pointer"
            >
                <option value="">{placeholder}</option>
                {children}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
    );
}

export default function StudentAttendance() {
    const [student, setStudent]     = useState(null);
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading]     = useState(true);

    // Status filter
    const [statusFilter, setStatusFilter] = useState('all');
    // Search
    const [search, setSearch]       = useState('');
    // Date filters
    const [preset, setPreset]       = useState('');   // today | this_week | this_month | last_month | last_3months
    const [filterYear, setFilterYear]   = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const [fromDate, setFromDate]   = useState('');
    const [toDate, setToDate]       = useState('');
    const [showDatePanel, setShowDatePanel] = useState(false);

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

    // ── Derived year/month options from actual data ──
    const { availableYears, availableMonths } = useMemo(() => {
        const years  = new Set();
        const months = new Set();
        attendance.forEach(a => {
            const d = a.session?.date;
            if (!d) return;
            const dt = parse(d, 'yyyy-MM-dd', new Date());
            years.add(format(dt, 'yyyy'));
            if (!filterYear || format(dt, 'yyyy') === filterYear)
                months.add(format(dt, 'MM'));
        });
        return {
            availableYears:  [...years].sort((a, b) => b - a),
            availableMonths: [...months].sort(),
        };
    }, [attendance, filterYear]);

    // ── Apply a preset (clears manual from/to) ──
    const applyPreset = (p) => {
        setPreset(p);
        setFromDate('');
        setToDate('');
        setFilterYear('');
        setFilterMonth('');
    };

    // ── Clear all date filters ──
    const clearDates = () => {
        setPreset('');
        setFromDate('');
        setToDate('');
        setFilterYear('');
        setFilterMonth('');
    };

    const anyDateFilter = preset || fromDate || toDate || filterYear || filterMonth;

    // ── Filter logic ──
    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        const range = preset ? presetRange(preset) : null;

        return attendance.filter(a => {
            // Search
            if (q && !(
                parseSubject(a.session?.batch?.subject)?.toLowerCase().includes(q) ||
                (a.notes || '').toLowerCase().includes(q) ||
                (a.session?.batch?.name || '').toLowerCase().includes(q)
            )) return false;

            // Status
            if (statusFilter === 'present'   && a.status !== 'present')           return false;
            if (statusFilter === 'absent'    && a.status !== 'absent')            return false;
            if (statusFilter === 'cancelled' && a.status !== 'student_cancelled') return false;
            if (statusFilter === 'feedback'  && !a.notes)                         return false;

            // Date filters
            const sessionDate = a.session?.date
                ? parse(a.session.date, 'yyyy-MM-dd', new Date())
                : null;

            if (sessionDate) {
                // Quick preset
                if (range && !isWithinInterval(sessionDate, range)) return false;

                // Year
                if (filterYear && format(sessionDate, 'yyyy') !== filterYear) return false;

                // Month (only when no preset)
                if (!range && filterMonth && format(sessionDate, 'MM') !== filterMonth) return false;

                // Custom from/to
                if (!range) {
                    if (fromDate && sessionDate < new Date(fromDate)) return false;
                    if (toDate   && sessionDate > new Date(toDate + 'T23:59:59')) return false;
                }
            }

            return true;
        });
    }, [attendance, search, statusFilter, preset, filterYear, filterMonth, fromDate, toDate]);

    // ── Stats over full set (for filter pill counts) ──
    const totalStats = useMemo(() => ({
        total:       attendance.length,
        present:     attendance.filter(a => a.status === 'present').length,
        absent:      attendance.filter(a => a.status === 'absent').length,
        withFeedback:attendance.filter(a => a.notes).length,
    }), [attendance]);

    // ── Stats over filtered set (for the summary strip) ──
    const stats = useMemo(() => ({
        total:       filtered.length,
        present:     filtered.filter(a => a.status === 'present').length,
        absent:      filtered.filter(a => a.status === 'absent').length,
    }), [filtered]);

    const rate = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

    const STATUS_FILTERS = [
        { value: 'all',       label: 'All',       count: totalStats.total },
        { value: 'present',   label: 'Present',   count: totalStats.present },
        { value: 'absent',    label: 'Absent',    count: totalStats.absent },
        { value: 'feedback',  label: 'Feedback',  count: totalStats.withFeedback },
    ];

    const PRESETS = [
        { value: 'today',        label: 'Today' },
        { value: 'this_week',    label: 'This Week' },
        { value: 'this_month',   label: 'This Month' },
        { value: 'last_month',   label: 'Last Month' },
        { value: 'last_3months', label: 'Last 3 Months' },
    ];

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
            <Loader2 className="w-10 h-10 text-[#463a7a] animate-spin" />
        </div>
    );

    return (
        <div className="pb-24 bg-[#f8fafc] min-h-screen">

            {/* ── Hero ── */}
            <div className="relative bg-gradient-to-br from-[#463a7a] to-[#2d2550] px-5 pt-8 pb-6 overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5">
                    <TrendingUp className="w-64 h-64 text-white" />
                </div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-black text-white tracking-tighter leading-tight mb-1">
                        Attendance &<br /><span className="text-indigo-300">Feedback</span>
                    </h1>
                    <p className="text-indigo-100/50 text-sm font-medium mb-5">
                        Track your class attendance and view all teacher feedback in one place
                    </p>

                    {/* Search */}
                    <div className="relative mb-3">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                        <input
                            type="text"
                            placeholder="Search by subject, class name, or feedback…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-white/10 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-white text-sm font-bold placeholder:text-white/25 focus:outline-none focus:bg-white/15 transition-all"
                        />
                    </div>

                    {/* Status filter pills */}
                    <div className="flex gap-2 flex-wrap">
                        {STATUS_FILTERS.map(f => (
                            <button key={f.value} onClick={() => setStatusFilter(f.value)}
                                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                                    statusFilter === f.value
                                        ? 'bg-white text-[#463a7a] shadow-lg'
                                        : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                                }`}>
                                {f.label}
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${
                                    statusFilter === f.value ? 'bg-[#463a7a] text-white' : 'bg-white/10 text-white/50'
                                }`}>{f.count}</span>
                            </button>
                        ))}

                        {/* Date filter toggle */}
                        <button
                            onClick={() => setShowDatePanel(v => !v)}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                                anyDateFilter
                                    ? 'bg-orange-400 text-white shadow-lg'
                                    : showDatePanel
                                    ? 'bg-white text-[#463a7a] shadow-lg'
                                    : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                            }`}>
                            <Calendar size={11} />
                            Date
                            {anyDateFilter && (
                                <span className="bg-white/20 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black">
                                    ●
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Date Filter Panel ── */}
            {showDatePanel && (
                <div className="bg-white border-b border-slate-100 px-4 py-4 space-y-4 shadow-sm">
                    {/* Quick presets */}
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Quick Range</p>
                        <div className="flex flex-wrap gap-2">
                            {PRESETS.map(p => (
                                <button key={p.value}
                                    onClick={() => applyPreset(preset === p.value ? '' : p.value)}
                                    className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all ${
                                        preset === p.value
                                            ? 'bg-[#463a7a] text-white shadow-md'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}>
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Year / Month dropdowns */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Year</p>
                            <Sel value={filterYear} onChange={v => { setFilterYear(v); setPreset(''); }} placeholder="All Years">
                                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                            </Sel>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Month</p>
                            <Sel value={filterMonth} onChange={v => { setFilterMonth(v); setPreset(''); }} placeholder="All Months">
                                {availableMonths.map(m => (
                                    <option key={m} value={m}>{MONTH_NAMES[parseInt(m, 10) - 1]}</option>
                                ))}
                            </Sel>
                        </div>
                    </div>

                    {/* Custom date range */}
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Custom Range</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">From</label>
                                <input type="date" value={fromDate}
                                    onChange={e => { setFromDate(e.target.value); setPreset(''); }}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#463a7a]/20" />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">To</label>
                                <input type="date" value={toDate}
                                    onChange={e => { setToDate(e.target.value); setPreset(''); }}
                                    min={fromDate}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#463a7a]/20" />
                            </div>
                        </div>
                    </div>

                    {/* Active filter summary + clear */}
                    {anyDateFilter && (
                        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                            <p className="text-[10px] font-black text-amber-700">
                                {preset ? PRESETS.find(p => p.value === preset)?.label :
                                 filterYear && filterMonth ? `${MONTH_NAMES[parseInt(filterMonth,10)-1]} ${filterYear}` :
                                 filterYear ? filterYear :
                                 filterMonth ? MONTH_NAMES[parseInt(filterMonth,10)-1] :
                                 fromDate && toDate ? `${fromDate} → ${toDate}` :
                                 fromDate ? `From ${fromDate}` :
                                 toDate ? `To ${toDate}` : ''}
                                {' '}· {filtered.length} record{filtered.length !== 1 ? 's' : ''}
                            </p>
                            <button onClick={clearDates} className="flex items-center gap-1 text-[10px] font-black text-amber-600 hover:text-amber-800 transition-colors">
                                <X size={11} /> Clear
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ── Stats strip ── */}
            <div className="grid grid-cols-4 bg-white border-b border-slate-100 shadow-sm">
                {[
                    { label: 'Total',   value: stats.total,    color: 'text-slate-900' },
                    { label: 'Present', value: stats.present,  color: 'text-emerald-600' },
                    { label: 'Absent',  value: stats.absent,   color: 'text-red-500' },
                    { label: 'Rate',    value: `${rate}%`,     color: 'text-[#463a7a]' },
                ].map(({ label, value, color }) => (
                    <div key={label} className="text-center py-3 border-r border-slate-50 last:border-0">
                        <p className={`text-xl font-black leading-none ${color}`}>{value}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{label}</p>
                    </div>
                ))}
            </div>

            {/* ── Record count / active filters ── */}
            <div className="flex items-center justify-between px-4 pt-4 pb-1">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    {filtered.length} of {attendance.length} records
                </p>
                {(search || statusFilter !== 'all' || anyDateFilter) && (
                    <button
                        onClick={() => { setSearch(''); setStatusFilter('all'); clearDates(); }}
                        className="flex items-center gap-1 text-[10px] font-black text-rose-400 hover:text-rose-600 transition-colors"
                    >
                        <X size={11} /> Clear all filters
                    </button>
                )}
            </div>

            {/* ── List ── */}
            <div className="px-4 pt-2 pb-6 space-y-3 max-w-2xl mx-auto">
                {filtered.length === 0 ? (
                    <div className="py-20 text-center">
                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <Music size={26} className="text-slate-300" />
                        </div>
                        <p className="text-base font-black text-slate-300">No records found</p>
                        <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest mt-1">
                            {search || statusFilter !== 'all' || anyDateFilter
                                ? 'Try adjusting your filters'
                                : 'Attendance will appear here after classes'}
                        </p>
                    </div>
                ) : filtered.map(record => {
                    const s = getStatus(record.status);
                    const StatusIcon = s.icon;
                    const subject = parseSubject(record.session?.batch?.subject) || 'Class';
                    const className = record.session?.batch?.name || `${subject} Session`;
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
                                            {subject}
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

                                {/* Recorded date */}
                                {record.created_at && (
                                    <div className="flex-shrink-0 text-right">
                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Recorded</p>
                                        <p className="text-[10px] font-black text-slate-400">
                                            {format(new Date(record.created_at), 'MMM d')}
                                        </p>
                                    </div>
                                )}
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
