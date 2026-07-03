import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../../lib/api';
import {
    CheckCircle2, Clock, AlertCircle, Repeat,
    Bell, Zap, Activity, ArrowUpRight, ArrowDownRight,
    ChevronRight, Plus, AlertTriangle, IndianRupee
} from 'lucide-react';



// ── Ring Chart ───────────────────────────────────────────────────────────────
function RingChart({ pct, size = 64, stroke = 6, color = '#463a7a', bg = '#f1f5f9' }) {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const dash = (pct / 100) * circ;
    return (
        <svg width={size} height={size} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bg} strokeWidth={stroke} />
            <circle
                cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
                strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.7s ease' }}
            />
        </svg>
    );
}

// ── KPI Card — clean, no corner blobs ────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, trend, trendUp, iconBg, iconColor, ring }) {
    return (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={18} className={iconColor} />
                </div>
                {ring !== undefined ? (
                    <div className="flex items-center gap-1.5">
                        <RingChart pct={ring} size={34} stroke={3.5} color="#463a7a" />
                        <span className="text-xs font-semibold text-slate-400">{ring}%</span>
                    </div>
                ) : trend !== undefined ? (
                    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-lg ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                        {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {trend}%
                    </span>
                ) : null}
            </div>
            <p className="text-2xl font-bold text-slate-900 tracking-tight leading-none mb-1">{value}</p>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
            {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
        </div>
    );
}

// ── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const map = {
        paid:      'bg-emerald-50 text-emerald-700 border-emerald-100',
        pending:   'bg-blue-50 text-blue-700 border-blue-100',
        overdue:   'bg-red-50 text-red-600 border-red-100',
        partial:   'bg-amber-50 text-amber-700 border-amber-100',
        cancelled: 'bg-slate-50 text-slate-500 border-slate-100',
    };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${map[status] || map.pending}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status === 'paid' ? 'bg-emerald-500' : status === 'overdue' ? 'bg-red-500' : status === 'partial' ? 'bg-amber-500' : 'bg-blue-500'}`} />
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}

const TIME_FILTERS = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'quarter', label: 'Quarterly' },
    { key: 'half', label: 'Half-Year' },
    { key: 'year', label: 'Yearly' },
    { key: 'custom', label: 'Custom' },
];

const GRADE_COLORS = [
    { bar: '#463a7a', light: 'bg-violet-500' },
    { bar: '#7c3aed', light: 'bg-violet-400' },
    { bar: '#2563eb', light: 'bg-blue-500' },
    { bar: '#0891b2', light: 'bg-cyan-600' },
    { bar: '#059669', light: 'bg-emerald-600' },
    { bar: '#d97706', light: 'bg-amber-600' },
];

export default function PaymentDashboard() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState('month');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');

    useEffect(() => { loadDashboard(); }, [timeFilter, customFrom, customTo]);

    const loadDashboard = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/payment-dashboard?period=${timeFilter}`);
            setData(res.data);
        } catch (err) {
            console.error('Dashboard load failed:', err);
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    const fmt = n => `₹${(n / 1000).toFixed(1)}k`;
    const fmtFull = n => `₹${n.toLocaleString('en-IN')}`;

    if (loading || !data) return (
        <div className="flex items-center justify-center min-h-screen bg-[#f5f6fa]">
            <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-[#463a7a]/20 border-t-[#463a7a] rounded-full animate-spin" />
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Loading</p>
            </div>
        </div>
    );

    const {
        kpi,
        invoices       = [],
        upcomingRenewals = [],
        packages       = [],
        monthlyRevenue = [],
        gradesDue      = [],
        defaulters     = [],
        allInvoicesCount,
    } = data;
    const maxGradeDue = gradesDue.length      ? Math.max(1, ...gradesDue.map(g => g.due))           : 1;
    const safeMaxRev  = monthlyRevenue.length ? Math.max(1, ...monthlyRevenue.map(m => m.revenue))  : 1;
    const sessionsPct = kpi.sessionsTotal > 0 ? Math.round((kpi.sessionsUsed / kpi.sessionsTotal) * 100) : 0;

    return (
        <div className="min-h-screen bg-[#f5f6fa]">

            {/* ══════════════════ PAGE HEADER ══════════════════ */}
            <div className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-20">
                <div className="max-w-[1400px] mx-auto px-6 lg:px-10">

                    {/* Title row */}
                    <div className="flex items-center justify-between py-5">
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Fee Management</p>
                            <h1 className="text-2xl font-bold text-slate-900 leading-none">Payment Hub</h1>
                        </div>
                        <button
                            onClick={() => navigate('/admin/invoices')}
                            className="flex items-center gap-2 px-4 py-2.5 bg-[#463a7a] hover:bg-[#3a3068] text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                        >
                            <Plus size={15} />
                            New Invoice
                        </button>
                    </div>

                    {/* Time filter row */}
                    <div className="flex items-center gap-1.5 pb-3 overflow-x-auto scrollbar-hide">
                        {TIME_FILTERS.map(tf => (
                            <button
                                key={tf.key}
                                onClick={() => setTimeFilter(tf.key)}
                                className={`flex-shrink-0 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                    timeFilter === tf.key
                                        ? 'bg-[#463a7a] text-white shadow-sm'
                                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                                }`}
                            >
                                {tf.label}
                            </button>
                        ))}
                        {timeFilter === 'custom' && (
                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                                    className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#463a7a]/20" />
                                <span className="text-slate-400 text-xs">→</span>
                                <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                                    className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#463a7a]/20" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-7 space-y-6 pb-20">

                {/* ══════════════════ KPI GRID ══════════════════ */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                    <KpiCard icon={IndianRupee}  label="Total Invoiced"  value={fmt(kpi.totalInvoiced)}  sub={`${allInvoicesCount ?? 0} invoices`}  trend={14}  trendUp={true}   iconBg="bg-violet-50"  iconColor="text-violet-600" />
                    <KpiCard icon={CheckCircle2} label="Collected"       value={fmt(kpi.totalReceived)} sub={`${kpi.collectionRate}% rate`}                   trend={8}   trendUp={true}   iconBg="bg-emerald-50" iconColor="text-emerald-600" />
                    <KpiCard icon={Clock}        label="Total Due"       value={fmt(kpi.totalDue)}       sub="pending + partial"                               trend={5}   trendUp={false}  iconBg="bg-amber-50"   iconColor="text-amber-600" />
                    <KpiCard icon={AlertCircle}  label="Overdue"         value={fmt(kpi.overdue)}        sub={`${kpi.overdueCount} students`}                  trend={12}  trendUp={false}  iconBg="bg-red-50"     iconColor="text-red-500" />
                    <KpiCard icon={Repeat}       label="Active Subs"     value={String(kpi.activeSubscriptions)} sub="subscriptions"                          trend={6}   trendUp={true}   iconBg="bg-blue-50"    iconColor="text-blue-600" />
                    <KpiCard icon={Bell}         label="Renewals"        value={String(kpi.upcomingRenewals)} sub="next 30 days"                                                            iconBg="bg-orange-50"  iconColor="text-orange-500" />
                    <KpiCard icon={Zap}          label="Linked Dues"     value={fmt(kpi.totalDue * 0.62)} sub="attendance-based"                                                            iconBg="bg-pink-50"    iconColor="text-pink-500" />
                    <KpiCard icon={Activity}     label="Sessions"        value={`${kpi.sessionsUsed}/${kpi.sessionsTotal}`} sub="used vs allocated"           ring={sessionsPct} iconBg="bg-teal-50" iconColor="text-teal-600" />
                </div>

                {/* ══════════════════ ROW 1: Revenue + Grade Dues ══════════════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                    {/* Revenue Analytics */}
                    <div className="lg:col-span-2 bg-white rounded-2xl p-7 border border-slate-100 shadow-sm">
                        <div className="flex items-start justify-between mb-7">
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Revenue Analytics</p>
                                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Monthly Overview</h3>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#463a7a] inline-block" />
                                    <span className="text-xs font-medium text-slate-500">Invoiced</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                                    <span className="text-xs font-medium text-slate-500">Collected</span>
                                </div>
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="relative">
                            {/* Grid lines */}
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
                                {[100, 75, 50, 25, 0].map(pct => (
                                    <div key={pct} className="flex items-center gap-2">
                                        <span className="text-[10px] text-slate-300 font-medium w-8 text-right flex-shrink-0">
                                            {pct > 0 ? `₹${Math.round(safeMaxRev * pct / 100 / 1000)}k` : ''}
                                        </span>
                                        <div className="flex-1 border-t border-slate-100" />
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-end gap-3 h-48 pl-10 pb-6">
                                {monthlyRevenue.map((d, i) => {
                                    const rPct = (d.revenue / safeMaxRev) * 100;
                                    const cPct = (d.collected / safeMaxRev) * 100;
                                    return (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-semibold px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-lg">
                                                ₹{(d.revenue / 1000).toFixed(0)}k · ₹{(d.collected / 1000).toFixed(0)}k
                                            </div>
                                            <div className="relative w-full flex items-end justify-center gap-0.5" style={{ height: '100%' }}>
                                                <div className="w-[46%] rounded-t-lg bg-[#463a7a] transition-all duration-500 group-hover:bg-[#5a4e96]" style={{ height: `${rPct}%`, minHeight: 4 }} />
                                                <div className="w-[46%] rounded-t-lg bg-emerald-400 transition-all duration-500 group-hover:bg-emerald-500" style={{ height: `${cPct}%`, minHeight: 4 }} />
                                            </div>
                                            <span className="text-[11px] font-medium text-slate-400">{d.month}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Summary row */}
                        <div className="grid grid-cols-3 gap-4 mt-4 pt-5 border-t border-slate-100">
                            <div>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Total Revenue</p>
                                <p className="text-lg font-bold text-slate-900">{fmtFull(monthlyRevenue.reduce((s, m) => s + m.revenue, 0))}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Avg / Month</p>
                                <p className="text-lg font-bold text-slate-900">{fmtFull(Math.floor(monthlyRevenue.reduce((s, m) => s + m.revenue, 0) / monthlyRevenue.length))}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Collection Rate</p>
                                <p className="text-lg font-bold text-emerald-600">{kpi.collectionRate}%</p>
                            </div>
                        </div>
                    </div>

                    {/* Grade-wise Dues */}
                    <div className="bg-white rounded-2xl p-7 border border-slate-100 shadow-sm">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Pending by Grade</p>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-6">Grade-wise Dues</h3>
                        <div className="space-y-4">
                            {gradesDue.length === 0 && (
                                <p className="text-sm text-slate-400 text-center py-6">No pending dues by grade</p>
                            )}
                            {gradesDue.map((g, i) => {
                                const pct = Math.round((g.due / maxGradeDue) * 100);
                                const color = GRADE_COLORS[i % GRADE_COLORS.length];
                                return (
                                    <div key={i}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-sm font-semibold text-slate-700">{g.grade}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-slate-400">{g.students} students</span>
                                                <span className="text-sm font-bold text-slate-900">{fmt(g.due)}</span>
                                            </div>
                                        </div>
                                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color.bar }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <button onClick={() => navigate('/admin/invoices')} className="mt-6 w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-slate-100">
                            View All Invoices <ChevronRight size={13} />
                        </button>
                    </div>
                </div>

                {/* ══════════════════ ROW 2: Renewals + Packages + Utilisation ══════════════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                    {/* Upcoming Renewals */}
                    <div className="bg-white rounded-2xl p-7 border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Renewals</p>
                                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Upcoming</h3>
                            </div>
                            <span className="px-2.5 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg text-xs font-semibold">
                                {upcomingRenewals.length} due
                            </span>
                        </div>
                        <div className="space-y-2.5">
                            {upcomingRenewals.length === 0 && (
                                <p className="text-sm text-slate-400 text-center py-6">No renewals due in the next 30 days</p>
                            )}
                            {upcomingRenewals.slice(0, 5).map((s, i) => {
                                const daysLeft = Math.ceil((new Date(s.renewal_date) - new Date()) / 86400000);
                                return (
                                    <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#463a7a] to-[#6b5ca5] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                            {(s.student_name || '?')[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 truncate">{s.student_name}</p>
                                            <p className="text-[11px] text-slate-400">{s.plan_name}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-sm font-bold text-slate-900">₹{s.amount.toLocaleString('en-IN')}</p>
                                            <p className={`text-[11px] font-semibold ${daysLeft <= 7 ? 'text-red-500' : 'text-amber-500'}`}>{daysLeft}d</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <button onClick={() => navigate('/admin/subscriptions')} className="mt-4 w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-slate-100">
                            All Subscriptions <ChevronRight size={13} />
                        </button>
                    </div>

                    {/* Top Packages */}
                    <div className="bg-white rounded-2xl p-7 border border-slate-100 shadow-sm">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Performance</p>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-6">Top Packages</h3>
                        <div className="space-y-4">
                            {packages.length === 0 && (
                                <p className="text-sm text-slate-400 text-center py-6">No packages created yet</p>
                            )}
                            {packages.map((p, i) => {
                                const gradients = [
                                    ['#463a7a', '#6b5ca5'], ['#059669', '#0891b2'],
                                    ['#2563eb', '#4f46e5'], ['#d97706', '#ea580c'],
                                ];
                                const [c1, c2] = gradients[i % 4];
                                const topRevenue = packages[0]?.revenue || 1;
                                const pct = Math.round((p.revenue / topRevenue) * 100);
                                return (
                                    <div key={i}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                                                    style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
                                                    {i + 1}
                                                </div>
                                                <span className="text-sm font-semibold text-slate-700">{p.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-400">{p.students} students</span>
                                                <span className="text-sm font-bold text-slate-900">{fmt(p.revenue)}</span>
                                            </div>
                                        </div>
                                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-700"
                                                style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${c1}, ${c2})` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <button onClick={() => navigate('/admin/packages')} className="mt-6 w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-slate-100">
                            Manage Packages <ChevronRight size={13} />
                        </button>
                    </div>

                    {/* Utilisation */}
                    <div className="bg-white rounded-2xl p-7 border border-slate-100 shadow-sm">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Utilisation</p>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-6">Session & Collection</h3>

                        <div className="grid grid-cols-2 gap-4 mb-5">
                            <div className="flex flex-col items-center p-4 bg-slate-50 rounded-xl">
                                <div className="relative">
                                    <RingChart pct={sessionsPct} size={72} stroke={7} color="#463a7a" />
                                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700">
                                        {sessionsPct}%
                                    </span>
                                </div>
                                <p className="text-xs font-semibold text-slate-700 mt-2">Sessions</p>
                                <p className="text-[10px] text-slate-400">{kpi.sessionsUsed}/{kpi.sessionsTotal}</p>
                            </div>
                            <div className="flex flex-col items-center p-4 bg-slate-50 rounded-xl">
                                <div className="relative">
                                    <RingChart pct={kpi.collectionRate} size={72} stroke={7} color="#10b981" />
                                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700">
                                        {kpi.collectionRate}%
                                    </span>
                                </div>
                                <p className="text-xs font-semibold text-slate-700 mt-2">Collection</p>
                                <p className="text-[10px] text-slate-400">{kpi.collectionRate}% rate</p>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            {[
                                { label: 'Active Packages', val: `${kpi.activeSubscriptions} students`, color: 'bg-violet-500' },
                                { label: 'Expiring Soon', val: `${upcomingRenewals.length} packages`, color: 'bg-amber-500' },
                                { label: 'Overdue', val: `${kpi.overdueCount} students`, color: 'bg-red-500' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${item.color}`} />
                                        <span className="text-sm text-slate-600">{item.label}</span>
                                    </div>
                                    <span className="text-sm font-bold text-slate-900">{item.val}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ══════════════════ ROW 3: Recent Invoices + Defaulters ══════════════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                    {/* Recent Invoices */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-7 py-5 flex items-center justify-between border-b border-slate-100">
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Latest</p>
                                <h3 className="text-lg font-bold text-slate-900">Recent Invoices</h3>
                            </div>
                            <button onClick={() => navigate('/admin/invoices')} className="px-4 py-2 bg-[#463a7a] hover:bg-[#3a3068] text-white rounded-xl text-xs font-semibold transition-colors">
                                View All
                            </button>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {invoices.length === 0 && (
                                <p className="text-sm text-slate-400 text-center py-10">No invoices yet — create one to get started</p>
                            )}
                            {invoices.map((inv, i) => (
                                <div key={i} className="px-7 py-3.5 flex items-center gap-4 hover:bg-slate-50/60 transition-colors">
                                    <div className="w-9 h-9 rounded-xl bg-[#463a7a]/10 flex items-center justify-center text-[#463a7a] text-xs font-bold flex-shrink-0">
                                        {(inv.student_name || '?')[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 truncate">{inv.student_name}</p>
                                        <p className="text-[11px] text-slate-400">{[inv.payment_mode, inv.payment_type, inv.invoice_number].filter(Boolean).join(' · ')}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-sm font-bold text-slate-900">₹{(inv.amount || 0).toLocaleString('en-IN')}</p>
                                        <StatusBadge status={inv.status} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Defaulters */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-7 py-5 flex items-center justify-between border-b border-slate-100">
                            <div>
                                <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-0.5 flex items-center gap-1.5">
                                    <AlertTriangle size={10} /> Action Required
                                </p>
                                <h3 className="text-lg font-bold text-slate-900">Defaulters List</h3>
                            </div>
                            <span className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-semibold">
                                {defaulters.length} overdue
                            </span>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {defaulters.length === 0 && (
                                <p className="text-sm text-slate-400 text-center py-10">No overdue invoices — all clear!</p>
                            )}
                            {defaulters.map((inv, i) => {
                                const daysOverdue = inv.due_date ? Math.ceil((new Date() - new Date(inv.due_date)) / 86400000) : 0;
                                return (
                                    <div key={i} className="px-7 py-3.5 flex items-center gap-4 hover:bg-red-50/30 transition-colors">
                                        <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-500 text-xs font-bold flex-shrink-0">
                                            {(inv.student_name || '?')[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 truncate">{inv.student_name}</p>
                                            <p className="text-[11px] text-slate-400">{inv.grade} · {daysOverdue > 0 ? `${daysOverdue}d overdue` : 'Due today'}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-sm font-bold text-red-600">₹{inv.amount.toLocaleString('en-IN')}</p>
                                            <button className="text-[11px] font-semibold text-[#463a7a] hover:underline mt-0.5">Send Reminder</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="px-7 py-4 border-t border-slate-100">
                            <button onClick={() => navigate('/admin/invoices?status=overdue')} className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-red-100">
                                <AlertCircle size={13} />
                                View All Overdue
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* FAB */}
            <div className="fixed bottom-6 right-6 z-50">
                <button
                    onClick={() => navigate('/admin/invoices')}
                    className="w-12 h-12 bg-[#463a7a] hover:bg-[#3a3068] text-white rounded-2xl shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center group"
                >
                    <Plus size={20} />
                    <span className="absolute right-full mr-3 bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
                        Create Invoice
                    </span>
                </button>
            </div>
        </div>
    );
}
