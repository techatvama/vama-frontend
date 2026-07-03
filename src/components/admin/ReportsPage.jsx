import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { useAdmin } from '../../context/AdminContext';
import {
    TrendingUp, TrendingDown, Users, GraduationCap, DollarSign,
    CalendarCheck, BookOpen, Loader2, Download, BarChart3,
    PieChart, Activity, Wallet, UserCheck, AlertTriangle,
    Building2, ClipboardList, Percent, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

const TABS = [
    { id: 'overview',   label: 'Overview',    icon: BarChart3 },
    { id: 'sales',      label: 'Sales',       icon: DollarSign },
    { id: 'students',   label: 'Students',    icon: GraduationCap },
    { id: 'teachers',   label: 'Teachers',    icon: Users },
    { id: 'attendance', label: 'Attendance',  icon: CalendarCheck },
    { id: 'operations', label: 'Operations',  icon: Activity },
];

const PERIODS = [
    { id: 'week',    label: 'This Week' },
    { id: 'month',   label: 'This Month' },
    { id: 'quarter', label: 'Quarter' },
    { id: 'year',    label: 'Year' },
];

const PALETTE = ['#463a7a', '#7c6bb5', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6'];

const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const num = (n) => Number(n || 0).toLocaleString('en-IN');

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KPI({ icon: Icon, label, value, sub, accent = '#463a7a', trend }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${accent}15` }}>
                    <Icon size={18} style={{ color: accent }} />
                </div>
                {trend != null && (
                    <span className={`flex items-center gap-0.5 text-xs font-bold ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {trend >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                        {Math.abs(trend)}%
                    </span>
                )}
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-3 tracking-tight">{value}</p>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">{label}</p>
            {sub && <p className="text-[11px] text-slate-400 mt-1">{sub}</p>}
        </div>
    );
}

// ── Horizontal bar list ─────────────────────────────────────────────────────────
function BarList({ title, icon: Icon, data, labelKey, valueKey, format = num, accent = '#463a7a' }) {
    const max = Math.max(...data.map(d => d[valueKey]), 1);
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
                {Icon && <Icon size={15} style={{ color: accent }} />}
                <h3 className="text-sm font-bold text-slate-800">{title}</h3>
            </div>
            {data.length === 0 ? (
                <p className="text-sm text-slate-300 py-6 text-center">No data</p>
            ) : (
                <div className="space-y-3">
                    {data.map((d, i) => (
                        <div key={i}>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-semibold text-slate-600 truncate">{d[labelKey]}</span>
                                <span className="font-bold text-slate-900 flex-shrink-0 ml-2">{format(d[valueKey])}</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all"
                                    style={{ width: `${(d[valueKey] / max) * 100}%`, background: PALETTE[i % PALETTE.length] }} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Line/area trend (SVG) ────────────────────────────────────────────────────────
function TrendChart({ title, icon: Icon, data, xKey, yKey, format = num, accent = '#463a7a' }) {
    const W = 520, H = 160, pad = 30;
    const vals = data.map(d => d[yKey]);
    const max = Math.max(...vals, 1), min = Math.min(...vals, 0);
    const range = max - min || 1;
    const stepX = data.length > 1 ? (W - pad * 2) / (data.length - 1) : 0;
    const pts = data.map((d, i) => {
        const x = pad + i * stepX;
        const y = H - pad - ((d[yKey] - min) / range) * (H - pad * 2);
        return [x, y];
    });
    const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');
    const areaPath = pts.length ? `${linePath} L${pts[pts.length - 1][0]},${H - pad} L${pad},${H - pad} Z` : '';

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
                {Icon && <Icon size={15} style={{ color: accent }} />}
                <h3 className="text-sm font-bold text-slate-800">{title}</h3>
            </div>
            {data.length === 0 ? (
                <p className="text-sm text-slate-300 py-10 text-center">No data for this period</p>
            ) : (
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 180 }}>
                    <defs>
                        <linearGradient id={`grad-${title.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={accent} stopOpacity="0.25" />
                            <stop offset="100%" stopColor={accent} stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <path d={areaPath} fill={`url(#grad-${title.replace(/\s/g, '')})`} />
                    <path d={linePath} fill="none" stroke={accent} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                    {pts.map((p, i) => (
                        <g key={i}>
                            <circle cx={p[0]} cy={p[1]} r="3.5" fill="white" stroke={accent} strokeWidth="2" />
                            <text x={p[0]} y={H - 8} textAnchor="middle" className="fill-slate-400" style={{ fontSize: 9 }}>
                                {String(data[i][xKey]).slice(-5)}
                            </text>
                        </g>
                    ))}
                </svg>
            )}
        </div>
    );
}

// ── Donut chart (SVG) ─────────────────────────────────────────────────────────────
function Donut({ title, data, labelKey, valueKey, format = num }) {
    const total = data.reduce((s, d) => s + d[valueKey], 0) || 1;
    let cum = 0;
    const R = 60, C = 2 * Math.PI * R;
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-800 mb-4">{title}</h3>
            {data.length === 0 ? (
                <p className="text-sm text-slate-300 py-8 text-center">No data</p>
            ) : (
                <div className="flex items-center gap-5">
                    <svg viewBox="0 0 160 160" className="w-32 h-32 flex-shrink-0 -rotate-90">
                        {data.map((d, i) => {
                            const frac = d[valueKey] / total;
                            const dash = frac * C;
                            const seg = (
                                <circle key={i} cx="80" cy="80" r={R} fill="none"
                                    stroke={PALETTE[i % PALETTE.length]} strokeWidth="18"
                                    strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={-cum} />
                            );
                            cum += dash;
                            return seg;
                        })}
                    </svg>
                    <div className="flex-1 space-y-1.5 min-w-0">
                        {data.map((d, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PALETTE[i % PALETTE.length] }} />
                                <span className="font-semibold text-slate-600 truncate flex-1">{d[labelKey]}</span>
                                <span className="font-bold text-slate-900">{format(d[valueKey])}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ReportsPage() {
    const { isSuperAdmin, centerName } = useAdmin();
    const [tab, setTab] = useState('overview');
    const [period, setPeriod] = useState('month');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const r = await api.get('/admin/reports', { params: { period } });
            setData(r.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [period]);

    useEffect(() => { load(); }, [load]);

    const exportCSV = () => {
        if (!data) return;
        const rows = [
            ['VAMA ACADEMY — BUSINESS REPORT'],
            ['Period', period, 'Scope', isSuperAdmin ? 'All Centers' : (centerName || '')],
            [],
            ['SALES'],
            ['Total Revenue', data.sales.total_revenue],
            ['Outstanding', data.sales.total_outstanding],
            ['Collection Rate %', data.sales.collection_rate],
            ['Paid Invoices', data.sales.paid_invoice_count],
            [],
            ['STUDENTS'],
            ['Total', data.students.total],
            ['New This Period', data.students.new_this_period],
            ['Exam Students', data.students.exam_students],
            [],
            ['TEACHERS — sessions this period'],
            ...data.teachers.report.map(t => [t.name, t.period_sessions, `${t.students} students`]),
            [],
            ['ATTENDANCE'],
            ['Rate %', data.attendance.rate],
            ['Present', data.attendance.present],
            ['Absent', data.attendance.absent],
        ];
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `vama-report-${period}-${Date.now()}.csv`; a.click();
        URL.revokeObjectURL(url);
    };

    if (loading || !data) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-[#463a7a]" />
            </div>
        );
    }

    const { sales, students, teachers, attendance, operations } = data;

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            {/* Header */}
            <div className="bg-gradient-to-br from-[#463a7a] to-[#2d2550] px-6 pt-8 pb-6 lg:px-10">
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Reports & Analytics</h1>
                        <p className="text-white/50 text-sm mt-1 flex items-center gap-2">
                            <Building2 size={13} /> {isSuperAdmin ? 'All Centers' : (centerName || 'Your Center')}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex bg-white/10 rounded-xl p-1">
                            {PERIODS.map(p => (
                                <button key={p.id} onClick={() => setPeriod(p.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${period === p.id ? 'bg-white text-[#463a7a]' : 'text-white/70 hover:text-white'}`}>
                                    {p.label}
                                </button>
                            ))}
                        </div>
                        <button onClick={exportCSV}
                            className="flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold transition-all">
                            <Download size={13} /> Export
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mt-6 overflow-x-auto pb-1">
                    {TABS.map(t => {
                        const Icon = t.icon;
                        return (
                            <button key={t.id} onClick={() => setTab(t.id)}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${tab === t.id ? 'bg-white text-[#463a7a] shadow-sm' : 'text-white/60 hover:text-white hover:bg-white/10'}`}>
                                <Icon size={14} /> {t.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-6 pb-20 space-y-5">

                {/* ── OVERVIEW ── */}
                {tab === 'overview' && (
                    <>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <KPI icon={Wallet} label="Revenue" value={inr(sales.total_revenue)} accent="#10b981" sub={`${sales.paid_invoice_count} payments`} />
                            <KPI icon={AlertTriangle} label="Outstanding" value={inr(sales.total_outstanding)} accent="#f59e0b" sub={`${sales.collection_rate}% collected`} />
                            <KPI icon={GraduationCap} label="Students" value={num(students.total)} accent="#463a7a" sub={`+${students.new_this_period} new`} />
                            <KPI icon={CalendarCheck} label="Attendance" value={`${attendance.rate}%`} accent="#3b82f6" sub={`${attendance.present} present`} />
                        </div>
                        <div className="grid lg:grid-cols-2 gap-5">
                            <TrendChart title="Revenue Trend" icon={TrendingUp} data={sales.revenue_trend} xKey="month" yKey="revenue" format={inr} accent="#10b981" />
                            <TrendChart title="Enrollment Trend" icon={Users} data={students.enrollment_trend} xKey="month" yKey="count" accent="#463a7a" />
                        </div>
                        <div className="grid lg:grid-cols-2 gap-5">
                            <Donut title="Revenue by Payment Mode" data={sales.revenue_by_mode} labelKey="mode" valueKey="amount" format={inr} />
                            <BarList title="Students by Center" icon={Building2} data={students.by_center} labelKey="center" valueKey="count" />
                        </div>
                    </>
                )}

                {/* ── SALES ── */}
                {tab === 'sales' && (
                    <>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <KPI icon={Wallet} label="Total Revenue" value={inr(sales.total_revenue)} accent="#10b981" />
                            <KPI icon={DollarSign} label="Billed" value={inr(sales.total_billed)} accent="#3b82f6" />
                            <KPI icon={AlertTriangle} label="Outstanding" value={inr(sales.total_outstanding)} accent="#f59e0b" />
                            <KPI icon={Percent} label="Collection Rate" value={`${sales.collection_rate}%`} accent="#463a7a" />
                        </div>
                        <TrendChart title="Revenue Over Time" icon={TrendingUp} data={sales.revenue_trend} xKey="month" yKey="revenue" format={inr} accent="#10b981" />
                        <div className="grid lg:grid-cols-2 gap-5">
                            <Donut title="By Payment Mode" data={sales.revenue_by_mode} labelKey="mode" valueKey="amount" format={inr} />
                            <Donut title="Invoice Status" data={sales.status_breakdown} labelKey="status" valueKey="count" />
                        </div>
                        <BarList title="Revenue by Package / Type" icon={BookOpen} data={sales.revenue_by_package} labelKey="name" valueKey="amount" format={inr} accent="#10b981" />
                    </>
                )}

                {/* ── STUDENTS ── */}
                {tab === 'students' && (
                    <>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <KPI icon={GraduationCap} label="Total Students" value={num(students.total)} accent="#463a7a" />
                            <KPI icon={UserCheck} label="New This Period" value={num(students.new_this_period)} accent="#10b981" />
                            <KPI icon={ClipboardList} label="Exam Students" value={num(students.exam_students)} accent="#f59e0b" />
                            <KPI icon={Building2} label="Centers" value={num(students.by_center.length)} accent="#3b82f6" />
                        </div>
                        <TrendChart title="Enrollment Trend" icon={TrendingUp} data={students.enrollment_trend} xKey="month" yKey="count" accent="#463a7a" />
                        <div className="grid lg:grid-cols-2 gap-5">
                            <BarList title="Students by Grade" icon={GraduationCap} data={students.by_grade} labelKey="grade" valueKey="count" />
                            <BarList title="Students by Course" icon={BookOpen} data={students.by_course} labelKey="course" valueKey="count" accent="#7c6bb5" />
                        </div>
                        <BarList title="Students by Center" icon={Building2} data={students.by_center} labelKey="center" valueKey="count" accent="#10b981" />
                    </>
                )}

                {/* ── TEACHERS ── */}
                {tab === 'teachers' && (
                    <>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            <KPI icon={Users} label="Total Teachers" value={num(teachers.total)} accent="#463a7a" />
                            <KPI icon={Activity} label="Sessions (period)" value={num(teachers.total_sessions_period)} accent="#10b981" />
                            <KPI icon={BarChart3} label="Avg / Teacher" value={teachers.total ? Math.round(teachers.total_sessions_period / teachers.total) : 0} accent="#3b82f6" />
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                                <Users size={15} className="text-[#463a7a]" />
                                <h3 className="text-sm font-bold text-slate-800">Teacher Performance</h3>
                            </div>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50">
                                        <th className="px-5 py-2.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Teacher</th>
                                        <th className="px-5 py-2.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wide">Sessions (period)</th>
                                        <th className="px-5 py-2.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wide">Total Sessions</th>
                                        <th className="px-5 py-2.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wide">Students</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {teachers.report.map(t => (
                                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-5 py-3 font-semibold text-slate-800">{t.name}</td>
                                            <td className="px-5 py-3 text-right font-bold text-[#463a7a]">{num(t.period_sessions)}</td>
                                            <td className="px-5 py-3 text-right text-slate-500">{num(t.total_sessions)}</td>
                                            <td className="px-5 py-3 text-right text-slate-600">{num(t.students)}</td>
                                        </tr>
                                    ))}
                                    {teachers.report.length === 0 && (
                                        <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-300">No teacher data</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* ── ATTENDANCE ── */}
                {tab === 'attendance' && (
                    <>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <KPI icon={Percent} label="Attendance Rate" value={`${attendance.rate}%`} accent="#10b981" />
                            <KPI icon={UserCheck} label="Present" value={num(attendance.present)} accent="#3b82f6" />
                            <KPI icon={TrendingDown} label="Absent" value={num(attendance.absent)} accent="#ef4444" />
                            <KPI icon={ClipboardList} label="Total Marked" value={num(attendance.total_marked)} accent="#463a7a" />
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <CalendarCheck size={15} className="text-[#463a7a]" />
                                <h3 className="text-sm font-bold text-slate-800">Attendance Trend (weekly)</h3>
                            </div>
                            {attendance.trend.length === 0 ? (
                                <p className="text-sm text-slate-300 py-8 text-center">No attendance data</p>
                            ) : (
                                <div className="space-y-2.5">
                                    {attendance.trend.map((w, i) => {
                                        const tot = w.present + w.absent || 1;
                                        return (
                                            <div key={i}>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="font-semibold text-slate-500">{w.week}</span>
                                                    <span className="font-bold text-slate-700">{Math.round(w.present / tot * 100)}% present</span>
                                                </div>
                                                <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex">
                                                    <div className="h-full bg-emerald-500" style={{ width: `${w.present / tot * 100}%` }} />
                                                    <div className="h-full bg-red-400" style={{ width: `${w.absent / tot * 100}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div className="flex items-center gap-4 text-xs text-slate-400 pt-2">
                                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Present</span>
                                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-400" /> Absent</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* ── OPERATIONS ── */}
                {tab === 'operations' && (
                    <>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <KPI icon={Activity} label="Total Sessions" value={num(operations.total_sessions)} accent="#463a7a" />
                            <KPI icon={CalendarCheck} label="Completed" value={num(operations.completed)} accent="#10b981" />
                            <KPI icon={AlertTriangle} label="Cancelled" value={num(operations.cancelled)} accent="#ef4444" sub={`${operations.cancellation_rate}% rate`} />
                            <KPI icon={BookOpen} label="Active Batches" value={num(operations.active_batches)} accent="#3b82f6" />
                        </div>
                        <div className="grid lg:grid-cols-2 gap-5">
                            <Donut title="Session Breakdown"
                                data={[
                                    { label: 'Completed', count: operations.completed },
                                    { label: 'Upcoming', count: operations.upcoming },
                                    { label: 'Cancelled', count: operations.cancelled },
                                ]}
                                labelKey="label" valueKey="count" />
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                                <h3 className="text-sm font-bold text-slate-800">Operational Health</h3>
                                {[
                                    { label: 'Completion rate', val: operations.total_sessions ? Math.round(operations.completed / operations.total_sessions * 100) : 0, color: '#10b981' },
                                    { label: 'Cancellation rate', val: operations.cancellation_rate, color: '#ef4444' },
                                    { label: 'Attendance rate', val: attendance.rate, color: '#3b82f6' },
                                    { label: 'Collection rate', val: sales.collection_rate, color: '#f59e0b' },
                                ].map((m, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="font-semibold text-slate-600">{m.label}</span>
                                            <span className="font-bold text-slate-900">{m.val}%</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full" style={{ width: `${Math.min(m.val, 100)}%`, background: m.color }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
