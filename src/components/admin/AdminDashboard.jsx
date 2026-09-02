import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../../lib/api';
import { useAdmin } from '../../context/AdminContext';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import {
    DollarSign, UserPlus, Users, Clock, UserX, GraduationCap, CalendarClock,
    Wallet, ChevronRight, Loader2, TrendingUp, TrendingDown, Bell,
    FileWarning, BatteryLow, Layers, ShieldAlert, ClipboardList, AlertTriangle,
    Award, Calendar, BookOpen, Sparkles, Activity, RefreshCw, Music,
    CheckCircle2, AlertCircle, CalendarPlus, RotateCcw, Ban,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const money = (v) => `₹${Math.round(Number(v) || 0).toLocaleString('en-IN')}`;

const pctChange = (curr, prev) => {
    if (!prev) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 1000) / 10;
};

const relTime = (iso) => {
    if (!iso) return '';
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.round(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.round(hrs / 24);
    return `${days}d ago`;
};

const ACTION_LABELS = {
    'student.created': 'New student enrolled',
    'student.updated': 'Student profile updated',
    'student.deleted': 'Student removed',
    'student.enrollment_status_changed': 'Enrollment status changed',
    'staff.created': 'New staff member added',
    'staff.updated': 'Staff profile updated',
    'package.created': 'Package created',
    'package.updated': 'Package updated',
    'package.assigned': 'Package assigned to student',
    'invoice.created': 'Invoice created',
    'invoice.updated': 'Invoice updated',
    'invoice.deleted': 'Invoice deleted',
    'center.created': 'Center created',
    'password.changed': 'Password changed',
};
const actionLabel = (action) => ACTION_LABELS[action] || (action || '').replace(/[._]/g, ' ');

const fmtTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ap = h >= 12 ? 'pm' : 'am';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ap}`;
};

const BOOKING_EVENT = {
    'booking.booked': { label: 'Booked', Icon: CalendarPlus, tone: 'bg-emerald-50 text-emerald-600' },
    'booking.rescheduled': { label: 'Rescheduled', Icon: RotateCcw, tone: 'bg-blue-50 text-blue-600' },
    'booking.cancelled': { label: 'Cancelled', Icon: Ban, tone: 'bg-rose-50 text-rose-600' },
};

// Same hex catalog as the calendar's per-subject coloring, so a subject's
// color is consistent across the app (see backend _SUBJECT_COLORS / main.py).
const SUBJECT_COLORS = {
    Piano: '#463a7a', Guitar: '#059669', Violin: '#2563eb', Vocals: '#d97706',
    Drums: '#dc2626', Keyboard: '#7c3aed', Flute: '#0891b2', Tabla: '#78716c',
};
const subjectColor = (name) => SUBJECT_COLORS[name] || '#64748b';

// ─── Small presentational pieces ───────────────────────────────────────────────
const KpiCard = ({ icon: Icon, label, value, change, accent = 'purple' }) => {
    const palettes = {
        purple: 'from-[#463a7a] to-[#5e4fa2] shadow-[#463a7a]/20',
        green: 'from-emerald-500 to-teal-500 shadow-emerald-500/20',
        orange: 'from-orange-400 to-rose-400 shadow-orange-400/20',
        blue: 'from-blue-500 to-cyan-500 shadow-blue-500/20',
        rose: 'from-rose-500 to-red-500 shadow-rose-500/20',
    };
    const isUp = (change ?? 0) >= 0;
    return (
        <div className={`bg-gradient-to-br ${palettes[accent]} rounded-2xl p-5 text-white shadow-lg`}>
            <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-white/20 rounded-xl"><Icon size={18} /></div>
                {change !== undefined && (
                    <div className={`flex items-center gap-1 text-[11px] font-black px-2 py-1 rounded-full ${isUp ? 'bg-white/20' : 'bg-black/10'}`}>
                        {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {isUp ? '+' : ''}{change}%
                    </div>
                )}
            </div>
            <div className="text-3xl font-black mb-0.5 truncate">{value}</div>
            <div className="text-sm font-semibold opacity-90">{label}</div>
        </div>
    );
};

const StatTile = ({ icon: Icon, label, value, sub }) => (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-[#463a7a]/10 flex items-center justify-center text-[#463a7a]"><Icon size={16} /></div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
        </div>
        <div className="text-2xl font-black text-slate-900">{value}</div>
        {sub && <div className="text-xs text-slate-400 font-semibold mt-0.5">{sub}</div>}
    </div>
);

const RevenueBar = ({ month, revenue, max }) => {
    const pct = max > 0 ? Math.max(4, Math.round((revenue / max) * 100)) : 4;
    const label = (() => {
        try { return new Date(`${month}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }); }
        catch { return month; }
    })();
    return (
        <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 w-12 flex-shrink-0">{label}</span>
            <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#463a7a] to-[#5e4fa2]"
                    style={{ width: `${pct}%`, transition: 'width 0.8s ease' }} />
            </div>
            <span className="text-xs font-black text-slate-700 w-20 text-right flex-shrink-0">{money(revenue)}</span>
        </div>
    );
};

const ALERT_CARDS = [
    { key: 'overdue_invoices', label: 'Overdue Invoices', Icon: FileWarning, tone: 'rose' },
    { key: 'expiring_packages', label: 'Expiring Packages', Icon: CalendarClock, tone: 'amber' },
    { key: 'low_sessions', label: 'Low Sessions', Icon: BatteryLow, tone: 'amber' },
    { key: 'installments_due', label: 'Installments Due', Icon: Layers, tone: 'indigo' },
    { key: 'makeup_violations', label: 'Makeup Violations', Icon: ShieldAlert, tone: 'rose' },
];
const TONE = { rose: 'bg-rose-50 text-rose-600', amber: 'bg-amber-50 text-amber-600', indigo: 'bg-indigo-50 text-[#463a7a]' };

const QUICK_ACTIONS = [
    { icon: UserPlus, label: 'Enroll Student', link: '/students/add' },
    { icon: Calendar, label: 'Class Schedule', link: '/schedule' },
    { icon: DollarSign, label: 'Fee Collection', link: '/admin/payments' },
    { icon: Award, label: 'Curriculum', link: '/admin/curriculum' },
    { icon: ShieldAlert, label: 'Alerts', link: '/admin/alerts' },
    { icon: BookOpen, label: 'Reports', link: '/reports' },
];

const PERIODS = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'quarter', label: 'Quarter' },
];

export default function AdminDashboard() {
    const { admin, centerName, centerId } = useAdmin();
    const navigate = useNavigate();
    const [period, setPeriod] = useState('today');
    const [report, setReport] = useState(null);
    const [alerts, setAlerts] = useState(null);
    const [pendingApps, setPendingApps] = useState(0);
    const [activity, setActivity] = useState([]);
    const [todayAttendance, setTodayAttendance] = useState(null);
    const [bookingActivity, setBookingActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    const load = useCallback(async (isRefresh = false) => {
        if (!isRefresh) setLoading(true); else setSyncing(true);
        const [reportRes, alertsRes, appsRes, activityRes, todayRes, bookingRes] = await Promise.allSettled([
            api.get('/admin/reports', { params: { period, center_id: centerId || undefined } }),
            api.get('/admin/dashboard-alerts', { params: { center_id: centerId || undefined } }),
            api.get('/admin/student-applications', { params: { status: 'pending' } }),
            api.get('/admin/audit-logs', { params: { limit: 6 } }),
            api.get('/admin/dashboard/today-attendance', { params: { center_id: centerId || undefined } }),
            api.get('/admin/dashboard/booking-activity', { params: { limit: 8, center_id: centerId || undefined } }),
        ]);
        if (reportRes.status === 'fulfilled') setReport(reportRes.value.data);
        if (alertsRes.status === 'fulfilled') setAlerts(alertsRes.value.data);
        if (appsRes.status === 'fulfilled') setPendingApps((appsRes.value.data || []).length);
        if (activityRes.status === 'fulfilled') setActivity(activityRes.value.data?.logs || []);
        if (todayRes.status === 'fulfilled') setTodayAttendance(todayRes.value.data);
        if (bookingRes.status === 'fulfilled') setBookingActivity(bookingRes.value.data?.events || []);
        if (!isRefresh) setLoading(false); else setSyncing(false);
    }, [period, centerId]);

    useEffect(() => { load(); }, [load]);
    useAutoRefresh(() => load(true), 60000);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
                <Loader2 className="animate-spin text-[#463a7a]" size={32} />
            </div>
        );
    }

    const periodLabel = period === 'today' ? 'today' : `this ${period}`;
    const sales = report?.sales || {};
    const students = report?.students || {};
    const teachers = report?.teachers || {};
    const operations = report?.operations || {};
    const revenueTrend = sales.revenue_trend || [];
    const maxRevenue = Math.max(1, ...revenueTrend.map(r => r.revenue));

    const trend = revenueTrend.length >= 2 ? revenueTrend[revenueTrend.length - 1] : null;
    const prevTrend = revenueTrend.length >= 2 ? revenueTrend[revenueTrend.length - 2] : null;
    const revenueChange = trend && prevTrend ? pctChange(trend.revenue, prevTrend.revenue) : undefined;

    const enrollTrend = students.enrollment_trend || [];
    const currEnroll = enrollTrend.length >= 1 ? enrollTrend[enrollTrend.length - 1]?.count : undefined;
    const prevEnroll = enrollTrend.length >= 2 ? enrollTrend[enrollTrend.length - 2]?.count : undefined;
    const enrollChange = currEnroll !== undefined && prevEnroll !== undefined ? pctChange(currEnroll, prevEnroll) : undefined;

    const alertCounts = alerts?.counts || {};
    const totalAlerts = Object.values(alertCounts).reduce((a, b) => a + (b || 0), 0) + pendingApps;

    const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Hero header */}
                <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#463a7a] via-[#3a2f66] to-[#2d2550] p-7 lg:p-9 text-white shadow-2xl">
                    <div className="absolute -right-10 -top-10 w-56 h-56 bg-white/5 rounded-full blur-2xl" />
                    <div className="absolute right-24 bottom-0 opacity-10"><Sparkles size={140} /></div>
                    <div className="relative flex items-start justify-between flex-wrap gap-4">
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-200/70">
                                {centerName || 'All Centers'} · {today}
                            </p>
                            <h1 className="text-3xl lg:text-4xl font-black tracking-tighter mt-1">
                                Welcome back, {admin?.name?.split(' ')[0] || 'Admin'}
                            </h1>
                            <p className="text-indigo-100/70 font-bold mt-2 flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full bg-emerald-400 ${syncing ? 'animate-ping' : 'animate-pulse'}`} />
                                Live overview of your academy
                            </p>
                        </div>
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-2xl p-1.5 border border-white/10">
                            {PERIODS.map(p => (
                                <button key={p.key} onClick={() => setPeriod(p.key)}
                                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${period === p.key ? 'bg-white text-[#463a7a]' : 'text-white/70 hover:text-white'}`}>
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Top KPI row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <KpiCard icon={DollarSign} label={`Revenue ${periodLabel}`} value={money(sales.total_revenue)} change={revenueChange} accent="purple" />
                    <KpiCard icon={UserPlus} label={`New students ${periodLabel}`} value={students.new_this_period ?? 0} change={enrollChange} accent="blue" />
                    <KpiCard icon={Users} label="Active Students" value={students.active ?? students.total ?? 0} accent="green" />
                    <KpiCard icon={Clock} label="On Break" value={students.on_break ?? 0} accent="orange" />
                    <KpiCard icon={UserX} label="Discontinued" value={students.dropped ?? 0} accent="rose" />
                </div>

                {/* Secondary stat strip */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatTile icon={GraduationCap} label="Teachers" value={teachers.total ?? 0} sub="on staff" />
                    <StatTile icon={CalendarClock} label="Sessions" value={operations.total_sessions ?? 0} sub={`${operations.upcoming ?? 0} upcoming`} />
                    <StatTile icon={Wallet} label="Outstanding" value={money(sales.total_outstanding)} sub="to be collected" />
                    <StatTile icon={AlertTriangle} label="Overdue" value={alertCounts.overdue_invoices ?? 0} sub="invoices overdue" />
                </div>

                {/* Teacher attendance status + student booking activity monitoring */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Today's Attendance — per-teacher marking status */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                            <h2 className="font-black text-slate-900 flex items-center gap-2">
                                <CheckCircle2 size={16} className="text-[#463a7a]" /> Today's Attendance
                            </h2>
                            {todayAttendance?.pending > 0 ? (
                                <span className="text-xs font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                                    {todayAttendance.pending} pending
                                </span>
                            ) : (
                                <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">All marked</span>
                            )}
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                            {!todayAttendance || todayAttendance.classes.length === 0 ? (
                                <p className="text-center text-slate-300 font-bold py-8 text-sm">No classes scheduled today</p>
                            ) : (
                                todayAttendance.classes.map(cls => (
                                    <div key={cls.id} className="flex items-center justify-between px-6 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-slate-800 truncate">
                                                {cls.course}{cls.name && cls.name !== cls.course ? ` · ${cls.name}` : ''}
                                            </p>
                                            <p className="text-xs text-slate-400 font-semibold">
                                                {cls.teacher_name || 'Unassigned'} · {fmtTime(cls.start_time)}–{fmtTime(cls.end_time)}
                                            </p>
                                        </div>
                                        {cls.roster_size === 0 ? (
                                            <span className="text-xs font-bold text-slate-300 px-2.5 py-1 rounded-full flex-shrink-0">
                                                No students
                                            </span>
                                        ) : cls.is_marked ? (
                                            <span className="flex items-center gap-1 text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex-shrink-0">
                                                <CheckCircle2 size={12} /> Marked
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-xs font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full flex-shrink-0">
                                                <AlertCircle size={12} /> {cls.marked}/{cls.roster_size}
                                            </span>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Booking Activity — students booking/rescheduling/cancelling */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                            <h2 className="font-black text-slate-900 flex items-center gap-2">
                                <Activity size={16} className="text-[#463a7a]" /> Booking Activity
                            </h2>
                            <span className="flex items-center gap-1.5 text-xs font-black text-emerald-600">
                                <span className={`w-1.5 h-1.5 rounded-full bg-emerald-500 ${syncing ? 'animate-ping' : 'animate-pulse'}`} /> LIVE
                            </span>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                            {bookingActivity.length === 0 ? (
                                <p className="text-center text-slate-300 font-bold py-8 text-sm">No recent booking activity</p>
                            ) : (
                                bookingActivity.map(ev => {
                                    const meta = BOOKING_EVENT[ev.action] || { label: ev.action, Icon: Activity, tone: 'bg-slate-50 text-slate-500' };
                                    return (
                                        <div key={ev.id} className="flex items-start gap-3 px-6 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.tone}`}>
                                                <meta.Icon size={14} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-bold text-slate-800 truncate">
                                                    {ev.student_name || 'A student'} <span className="font-medium text-slate-400">· {meta.label}</span>
                                                </p>
                                                <p className="text-xs text-slate-400 font-semibold truncate">
                                                    {ev.course}{ev.date ? ` · ${fmtTime(ev.start_time)} on ${ev.date}` : ''}
                                                    {ev.action === 'booking.rescheduled' && ev.old_date ? ` (was ${fmtTime(ev.old_start_time)} on ${ev.old_date})` : ''}
                                                </p>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-300 flex-shrink-0">{relTime(ev.created_at)}</span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Revenue Analytics */}
                    <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="font-black text-slate-900">Revenue Analytics</h2>
                                <p className="text-xs text-slate-400 font-semibold">Last 6 months</p>
                            </div>
                            <TrendingUp size={18} className="text-[#463a7a]" />
                        </div>
                        {revenueTrend.length === 0 ? (
                            <p className="text-center text-slate-300 font-bold py-10 text-sm">No revenue data yet</p>
                        ) : (
                            <div className="space-y-4">
                                {revenueTrend.map(r => <RevenueBar key={r.month} month={r.month} revenue={r.revenue} max={maxRevenue} />)}
                            </div>
                        )}
                    </div>

                    {/* Needs Attention */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                            <h2 className="font-black text-slate-900 flex items-center gap-2"><Bell size={15} className="text-amber-400" /> Needs Attention</h2>
                            <button onClick={() => navigate('/admin/alerts')} className="text-xs font-black text-[#463a7a] flex items-center gap-0.5 hover:underline">
                                View All <ChevronRight size={13} />
                            </button>
                        </div>
                        <div className="p-4 space-y-2">
                            {totalAlerts === 0 ? (
                                <p className="text-center text-slate-300 font-bold py-6 text-sm">All clear — nothing needs attention.</p>
                            ) : (
                                <>
                                    {pendingApps > 0 && (
                                        <button onClick={() => navigate('/students/forms')} className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 rounded-xl text-left">
                                            <span className="flex items-center gap-2.5 font-bold text-slate-700 text-sm"><ClipboardList size={15} className="text-[#463a7a]" /> Pending Applications</span>
                                            <span className="text-sm font-black text-slate-900">{pendingApps}</span>
                                        </button>
                                    )}
                                    {ALERT_CARDS.filter(c => (alertCounts[c.key] || 0) > 0).map(({ key, label, Icon }) => (
                                        <button key={key} onClick={() => navigate('/admin/alerts')} className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 rounded-xl text-left">
                                            <span className="flex items-center gap-2.5 font-bold text-slate-700 text-sm"><Icon size={15} className="text-rose-500" /> {label}</span>
                                            <span className="text-sm font-black text-slate-900">{alertCounts[key]}</span>
                                        </button>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Instrument Mix */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="font-black text-slate-900">Instrument Mix</h2>
                            <Music size={18} className="text-[#463a7a]" />
                        </div>
                        {(students.by_course || []).length === 0 ? (
                            <p className="text-center text-slate-300 font-bold py-6 text-sm">No enrollment data yet</p>
                        ) : (
                            <div className="space-y-3">
                                {(students.by_course || []).slice(0, 6).map(c => {
                                    const color = subjectColor(c.course);
                                    const max = students.by_course[0]?.count || 1;
                                    return (
                                        <div key={c.course} className="flex items-center gap-3">
                                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                                            <span className="text-sm font-bold text-slate-700 w-20 truncate">{c.course}</span>
                                            <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                                                <div className="h-full rounded-full" style={{ width: `${Math.max(6, (c.count / max) * 100)}%`, backgroundColor: color, transition: 'width 0.8s ease' }} />
                                            </div>
                                            <span className="text-sm font-black text-slate-900 w-6 text-right">{c.count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Top Teachers */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="font-black text-slate-900">Top Teachers</h2>
                            <Award size={18} className="text-[#463a7a]" />
                        </div>
                        {(teachers.report || []).length === 0 ? (
                            <p className="text-center text-slate-300 font-bold py-6 text-sm">No session data yet</p>
                        ) : (
                            <div className="space-y-3">
                                {(teachers.report || []).slice(0, 5).map((t, i) => (
                                    <button key={t.id} onClick={() => navigate(`/teacher/${t.id}`)}
                                        className="w-full flex items-center gap-3 -mx-2 px-2 py-1 rounded-xl hover:bg-slate-50 transition-colors text-left">
                                        <div className="w-8 h-8 rounded-xl bg-[#463a7a]/10 flex items-center justify-center text-[#463a7a] font-black text-xs flex-shrink-0">{i + 1}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-800 truncate hover:text-[#463a7a]">{t.name}</p>
                                            <p className="text-xs text-slate-400 font-semibold">{t.students} students</p>
                                        </div>
                                        <span className="text-sm font-black text-slate-900 flex-shrink-0">{t.period_sessions} sess.</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="font-black text-slate-900 flex items-center gap-2">
                                <Activity size={16} className="text-[#463a7a]" /> Live Activity
                            </h2>
                            <RefreshCw size={13} className={`text-slate-300 ${syncing ? 'animate-spin' : ''}`} />
                        </div>
                        {activity.length === 0 ? (
                            <p className="text-center text-slate-300 font-bold py-6 text-sm">No recent activity</p>
                        ) : (
                            <div className="space-y-3">
                                {activity.map(log => (
                                    <div key={log.id} className="flex items-start gap-3">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-slate-700 truncate">{actionLabel(log.action)}</p>
                                            <p className="text-xs text-slate-400 font-semibold">{relTime(log.created_at)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                    <h2 className="font-black text-slate-900 mb-5">Quick Actions</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {QUICK_ACTIONS.map(({ icon: Icon, label, link }) => (
                            <button key={label} onClick={() => navigate(link)}
                                className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-[#463a7a]/5 rounded-2xl transition-colors border border-slate-100 hover:border-[#463a7a]/20 text-left">
                                <div className="w-9 h-9 rounded-xl bg-[#463a7a] text-white flex items-center justify-center flex-shrink-0"><Icon size={16} /></div>
                                <span className="font-bold text-sm text-slate-700">{label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
