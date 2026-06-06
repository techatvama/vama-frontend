import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
    Search, Filter, Download, ChevronLeft, ChevronRight,
    CheckCircle2, Clock, AlertCircle, XCircle, ArrowUpRight,
    Calendar, CreditCard, User, TrendingUp, IndianRupee,
    ArrowDownRight, SlidersHorizontal
} from 'lucide-react';
import { format, subDays, subMonths } from 'date-fns';
import { api } from '../../lib/api';

const STUDENT_NAMES = [
    'Sridat Agrawal', 'Rudransh Tripathy', 'Advaita Gokul', 'Ryan Gadiraju',
    'Akira Bajpai', 'Shourya Patil', 'Shreya Patil', 'Ivan Abin',
    'Anaika Yadav', 'Mega Kabilan', 'Priya Sharma', 'Arjun Nair',
    'Kavya Reddy', 'Vikram Iyer', 'Neha Gupta',
];
const GRADES = ['Debut', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'];
const COURSES = ['Piano', 'Guitar', 'Violin', 'Vocals', 'Drums'];
const PAYMENT_TYPES = ['Monthly Tuition', 'Exam Fee', 'Material Fee', 'Package', 'Subscription'];
const METHODS = ['UPI', 'Card', 'Net Banking', 'Cash', 'Cheque'];

function buildMockHistory() {
    const now = new Date();
    return Array.from({ length: 220 }, (_, i) => {
        const statuses = ['paid', 'paid', 'paid', 'paid', 'partial', 'overdue', 'pending', 'cancelled'];
        const status = statuses[i % statuses.length];
        const amount = Math.floor(Math.random() * 9000 + 2500);
        const paidAmt = status === 'paid' ? amount : status === 'partial' ? Math.floor(amount * 0.5) : 0;
        const daysAgo = Math.floor(Math.random() * 365);
        const paidDate = status === 'paid' || status === 'partial'
            ? subDays(now, daysAgo) : null;
        return {
            id: 5000 - i,
            invoice_number: `INV-${String(5000 - i).padStart(5, '0')}`,
            student_name: STUDENT_NAMES[i % STUDENT_NAMES.length],
            grade: GRADES[i % GRADES.length],
            course: COURSES[i % COURSES.length],
            amount,
            paid_amount: paidAmt,
            status,
            payment_type: PAYMENT_TYPES[i % PAYMENT_TYPES.length],
            method: status === 'paid' || status === 'partial' ? METHODS[i % METHODS.length] : null,
            issue_date: subDays(now, daysAgo + 7).toISOString(),
            paid_date: paidDate ? paidDate.toISOString() : null,
            razorpay_id: (status === 'paid' || status === 'partial') ? `pay_${Math.random().toString(36).slice(2, 14)}` : null,
        };
    });
}

const STATUS_CONFIG = {
    paid:      { icon: CheckCircle2,  cls: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500' },
    partial:   { icon: Clock,          cls: 'bg-amber-50 text-amber-700 border-amber-100',     dot: 'bg-amber-500'   },
    pending:   { icon: Clock,          cls: 'bg-blue-50 text-blue-700 border-blue-100',         dot: 'bg-blue-500'    },
    overdue:   { icon: AlertCircle,    cls: 'bg-red-50 text-red-600 border-red-100',            dot: 'bg-red-500'     },
    cancelled: { icon: XCircle,        cls: 'bg-slate-50 text-slate-500 border-slate-100',      dot: 'bg-slate-400'   },
};

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${cfg.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}

const DATE_RANGES = [
    { key: 'all', label: 'All Time' },
    { key: '7d', label: 'Last 7 days' },
    { key: '30d', label: 'Last 30 days' },
    { key: '90d', label: 'Last 3 months' },
    { key: '180d', label: 'Last 6 months' },
    { key: '1y', label: 'This Year' },
];

const PAGE_SIZE = 20;

export default function PaymentHistory() {
    const navigate = useNavigate();
    const [allData, setAllData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateRange, setDateRange] = useState('all');
    const [page, setPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        setLoading(true);
        api.get('/admin/invoices?limit=500')
            .then(res => setAllData(Array.isArray(res.data) ? res.data : []))
            .catch(err => { console.error('Failed to load payment history:', err); setAllData([]); })
            .finally(() => setLoading(false));
    }, []);

    const now = new Date();
    const filtered = allData.filter(inv => {
        if (search && !inv.student_name?.toLowerCase().includes(search.toLowerCase())
            && !inv.invoice_number?.toLowerCase().includes(search.toLowerCase())) return false;
        if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
        if (dateRange !== 'all') {
            const refDate = inv.paid_date || inv.issue_date;
            if (!refDate) return false;
            const d = new Date(refDate);
            if (dateRange === '7d' && d < subDays(now, 7)) return false;
            if (dateRange === '30d' && d < subDays(now, 30)) return false;
            if (dateRange === '90d' && d < subDays(now, 90)) return false;
            if (dateRange === '180d' && d < subDays(now, 180)) return false;
            if (dateRange === '1y' && d < subMonths(now, 12)) return false;
        }
        return true;
    });

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const totalCollected = filtered.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
        + filtered.filter(i => i.status === 'partial').reduce((s, i) => s + i.paid_amount, 0);
    const totalVolume = filtered.reduce((s, i) => s + i.amount, 0);
    const paidCount = filtered.filter(i => i.status === 'paid').length;
    const collectionRate = totalVolume > 0 ? Math.round((totalCollected / totalVolume) * 100) : 0;

    const fmtAmt = n => `₹${(n / 1000).toFixed(1)}k`;
    const fmtDate = d => d ? format(new Date(d), 'dd MMM yyyy') : '—';

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-[#f5f6fa]">
            <div className="w-8 h-8 border-2 border-[#463a7a]/20 border-t-[#463a7a] rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f5f6fa]">

            {/* ── Page Header ─────────────────────────────────────── */}
            <div className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-20">
                <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/admin/payments')}
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors text-slate-500"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <div>
                            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Payments</p>
                            <h1 className="text-xl font-bold text-slate-900 leading-none">Payment History</h1>
                        </div>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium transition-colors">
                        <Download size={14} />
                        Export CSV
                    </button>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-6 space-y-6">

                {/* ── Summary KPIs ────────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Volume', value: fmtAmt(totalVolume), icon: IndianRupee, color: 'bg-violet-500', sub: `${filtered.length} invoices` },
                        { label: 'Collected', value: fmtAmt(totalCollected), icon: TrendingUp, color: 'bg-emerald-500', sub: `${paidCount} paid` },
                        { label: 'Collection Rate', value: `${collectionRate}%`, icon: CheckCircle2, color: collectionRate >= 70 ? 'bg-emerald-500' : 'bg-amber-500', sub: 'of total invoiced' },
                        { label: 'Pending / Overdue', value: fmtAmt(totalVolume - totalCollected), icon: AlertCircle, color: 'bg-red-500', sub: `${filtered.filter(i => i.status === 'overdue').length} overdue` },
                    ].map((kpi, i) => {
                        const Icon = kpi.icon;
                        return (
                            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                                <div className="flex items-start justify-between mb-3">
                                    <div className={`w-9 h-9 rounded-xl ${kpi.color} flex items-center justify-center`}>
                                        <Icon size={16} className="text-white" />
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-slate-900 tracking-tight leading-none mb-1">{kpi.value}</p>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{kpi.label}</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">{kpi.sub}</p>
                            </div>
                        );
                    })}
                </div>

                {/* ── Filters bar ─────────────────────────────────── */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                    <div className="flex flex-col lg:flex-row gap-3">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search student or invoice number…"
                                value={search}
                                onChange={e => { setSearch(e.target.value); setPage(1); }}
                                className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#463a7a]/20 focus:border-[#463a7a]/40 transition-all placeholder:text-slate-400"
                            />
                        </div>

                        {/* Date range */}
                        <div className="flex items-center gap-2 overflow-x-auto">
                            {DATE_RANGES.map(r => (
                                <button
                                    key={r.key}
                                    onClick={() => { setDateRange(r.key); setPage(1); }}
                                    className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                                        dateRange === r.key
                                            ? 'bg-[#463a7a] text-white shadow-sm'
                                            : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'
                                    }`}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>

                        {/* Status filter */}
                        <select
                            value={statusFilter}
                            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                            className="px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#463a7a]/20 text-slate-600 font-medium"
                        >
                            <option value="all">All Status</option>
                            <option value="paid">Paid</option>
                            <option value="partial">Partial</option>
                            <option value="pending">Pending</option>
                            <option value="overdue">Overdue</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    {/* Results count */}
                    <p className="text-xs text-slate-400 font-medium mt-3">
                        Showing <span className="text-slate-600 font-semibold">{paginated.length}</span> of <span className="text-slate-600 font-semibold">{filtered.length}</span> records
                    </p>
                </div>

                {/* ── Table ───────────────────────────────────────── */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/60">
                                    <th className="text-left px-6 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Invoice</th>
                                    <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Student</th>
                                    <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Type</th>
                                    <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Date</th>
                                    <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Method</th>
                                    <th className="text-right px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Amount</th>
                                    <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {paginated.map((inv, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-700 group-hover:text-[#463a7a] transition-colors">{inv.invoice_number}</p>
                                                {inv.razorpay_id && (
                                                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">{inv.razorpay_id.slice(0, 16)}…</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#463a7a]/10 to-[#463a7a]/20 flex items-center justify-center text-[#463a7a] text-xs font-bold flex-shrink-0">
                                                    {inv.student_name[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800">{inv.student_name}</p>
                                                    <p className="text-[11px] text-slate-400">{inv.grade} · {inv.course}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 hidden md:table-cell">
                                            <span className="text-xs font-medium text-slate-500 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">{inv.payment_type}</span>
                                        </td>
                                        <td className="px-4 py-4 hidden lg:table-cell">
                                            <div>
                                                <p className="text-sm font-medium text-slate-700">{fmtDate(inv.paid_date || inv.issue_date)}</p>
                                                <p className="text-[11px] text-slate-400">Issued {fmtDate(inv.issue_date)}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 hidden lg:table-cell">
                                            {inv.method ? (
                                                <span className="text-xs font-medium text-slate-500">{inv.method}</span>
                                            ) : (
                                                <span className="text-xs text-slate-300">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <p className="text-sm font-bold text-slate-900">₹{inv.amount.toLocaleString('en-IN')}</p>
                                            {inv.status === 'partial' && (
                                                <p className="text-[11px] text-amber-600 font-semibold">₹{inv.paid_amount.toLocaleString('en-IN')} paid</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            <StatusBadge status={inv.status} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {paginated.length === 0 && (
                            <div className="py-16 text-center">
                                <p className="text-slate-400 font-medium">No records match your filters</p>
                            </div>
                        )}
                    </div>

                    {/* ── Pagination ── */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                            <p className="text-sm text-slate-400">
                                Page <span className="font-semibold text-slate-600">{page}</span> of <span className="font-semibold text-slate-600">{totalPages}</span>
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-600"
                                >
                                    <ChevronLeft size={14} />
                                </button>
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    const pg = page <= 3 ? i + 1 : page - 2 + i;
                                    if (pg > totalPages) return null;
                                    return (
                                        <button
                                            key={pg}
                                            onClick={() => setPage(pg)}
                                            className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                                                pg === page
                                                    ? 'bg-[#463a7a] text-white shadow-sm'
                                                    : 'border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                                            }`}
                                        >
                                            {pg}
                                        </button>
                                    );
                                })}
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-600"
                                >
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
