import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../../lib/api';
import {
    Repeat, Plus, Search, X, Loader2, Edit2, PauseCircle,
    PlayCircle, TrendingUp, TrendingDown, Users, Calendar,
    DollarSign, CheckCircle2, AlertCircle, Clock, ToggleLeft,
    ToggleRight, ChevronRight, Bell, ArrowUpRight, Activity,
    Package, RefreshCw, XCircle, BarChart3, Zap
} from 'lucide-react';
import { format, addDays, isAfter, isBefore, differenceInDays } from 'date-fns';

const STUDENT_NAMES = ['Sridat Agrawal', 'Rudransh Tripathy', 'Advaita Gokul', 'Ryan Gadiraju', 'Akira Bajpai', 'Shourya Patil', 'Shreya Patil', 'Ivan Abin', 'Anaika Yadav', 'Mega Kabilan', 'Priya Sharma', 'Arjun Nair', 'Kavya Reddy', 'Vikram Iyer', 'Neha Gupta'];
const GRADES = ['Debut', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'];
const COURSES = ['Piano', 'Guitar', 'Violin', 'Vocals', 'Drums'];
const PLANS = [
    { name: 'Starter Monthly', cycle: 'monthly', amount: 4500, sessions: 8 },
    { name: 'Monthly Pro', cycle: 'monthly', amount: 6500, sessions: 12 },
    { name: 'Quarterly Elite', cycle: 'quarterly', amount: 17500, sessions: 36 },
    { name: 'Half-Year Premium', cycle: 'half-yearly', amount: 32000, sessions: 72 },
    { name: 'Annual Gold', cycle: 'yearly', amount: 58000, sessions: 144 },
];

function generateMockSubscriptions() {
    const now = new Date();
    return Array.from({ length: 52 }, (_, i) => {
        const plan = PLANS[i % PLANS.length];
        const startDate = new Date(now.getFullYear(), now.getMonth() - Math.floor(i / 6), 1);
        const renewalDate = addDays(now, Math.floor(Math.random() * 90 - 15));
        const status = i < 40 ? 'active' : i < 46 ? 'paused' : i < 50 ? 'expired' : 'cancelled';
        return {
            id: i + 1,
            student_id: 1000 + i,
            student_name: STUDENT_NAMES[i % STUDENT_NAMES.length],
            grade: GRADES[i % GRADES.length],
            course: COURSES[i % COURSES.length],
            plan_name: plan.name,
            billing_cycle: plan.cycle,
            amount: plan.amount,
            sessions_total: plan.sessions,
            sessions_used: Math.floor(Math.random() * (plan.sessions - 2) + 1),
            start_date: startDate.toISOString(),
            renewal_date: renewalDate.toISOString(),
            status,
            auto_renew: i % 4 !== 0,
        };
    });
}

function RingChart({ pct, size = 56, stroke = 6, color = '#463a7a' }) {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const dash = (Math.min(pct, 100) / 100) * circ;
    return (
        <svg width={size} height={size} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
                strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.5s ease' }} />
        </svg>
    );
}

function StatusBadge({ status }) {
    const map = {
        active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        paused: 'bg-amber-50 text-amber-700 border-amber-100',
        expired: 'bg-red-50 text-red-600 border-red-100',
        cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
    };
    return <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${map[status] || map.active}`}>{status}</span>;
}

const CYCLE_LABELS = { monthly: '1M', quarterly: '3M', 'half-yearly': '6M', yearly: '1Y' };
const CYCLE_COLORS = { monthly: 'bg-blue-50 text-blue-700', quarterly: 'bg-violet-50 text-violet-700', 'half-yearly': 'bg-teal-50 text-teal-700', yearly: 'bg-amber-50 text-amber-700' };

function SubscriptionCard({ sub, onPause, onResume, onEdit, onToggleAutoRenew }) {
    const now = new Date();
    const renewalDate = new Date(sub.renewal_date);
    const daysToRenewal = differenceInDays(renewalDate, now);
    const sessionPct = Math.round((sub.sessions_used / sub.sessions_total) * 100);
    const isExpiringSoon = daysToRenewal >= 0 && daysToRenewal <= 14;
    const isOverdue = daysToRenewal < 0 && sub.status === 'active';

    const ringColor = sessionPct >= 80 ? '#ef4444' : sessionPct >= 60 ? '#f59e0b' : '#463a7a';

    return (
        <div className={`bg-white rounded-[32px] border shadow-lg hover:shadow-xl transition-all overflow-hidden flex flex-col ${sub.status === 'expired' || sub.status === 'cancelled' ? 'opacity-60 border-slate-100' : isExpiringSoon ? 'border-amber-200' : 'border-slate-100 hover:border-[#463a7a]/20'}`}>
            {isExpiringSoon && sub.status === 'active' && (
                <div className="bg-amber-50 px-5 py-2.5 flex items-center gap-2 border-b border-amber-100">
                    <Bell size={12} className="text-amber-600" />
                    <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Renewal in {daysToRenewal}d</span>
                </div>
            )}
            {isOverdue && (
                <div className="bg-red-50 px-5 py-2.5 flex items-center gap-2 border-b border-red-100">
                    <AlertCircle size={12} className="text-red-600" />
                    <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Overdue by {Math.abs(daysToRenewal)}d</span>
                </div>
            )}

            <div className="p-6 flex-1">
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                            <StatusBadge status={sub.status} />
                            <span className={`px-2 py-0.5 rounded-xl text-[10px] font-black ${CYCLE_COLORS[sub.billing_cycle]}`}>
                                {CYCLE_LABELS[sub.billing_cycle]}
                            </span>
                        </div>
                        <p className="text-base font-black text-slate-900 leading-tight">{sub.plan_name}</p>
                        <p className="text-xs font-medium text-slate-400 mt-0.5 truncate">{sub.student_name} · {sub.grade}</p>
                    </div>
                    <div className="relative flex-shrink-0">
                        <RingChart pct={sessionPct} size={56} stroke={5} color={ringColor} />
                        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-slate-700">{sessionPct}%</span>
                    </div>
                </div>

                {/* Amount & renewal */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-slate-50 rounded-2xl p-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Amount</p>
                        <p className="text-base font-black text-[#463a7a]">₹{sub.amount.toLocaleString('en-IN')}</p>
                    </div>
                    <div className={`rounded-2xl p-3 ${isOverdue ? 'bg-red-50' : isExpiringSoon ? 'bg-amber-50' : 'bg-slate-50'}`}>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Renewal</p>
                        <p className={`text-sm font-black ${isOverdue ? 'text-red-600' : isExpiringSoon ? 'text-amber-600' : 'text-slate-700'}`}>
                            {daysToRenewal >= 0 ? `In ${daysToRenewal}d` : `${Math.abs(daysToRenewal)}d ago`}
                        </p>
                    </div>
                </div>

                {/* Sessions bar */}
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sessions</span>
                        <span className="text-[10px] font-black text-slate-600">{sub.sessions_used}/{sub.sessions_total}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${sessionPct >= 80 ? 'bg-red-400' : sessionPct >= 60 ? 'bg-amber-400' : 'bg-gradient-to-r from-[#463a7a] to-violet-500'}`} style={{ width: `${sessionPct}%` }} />
                    </div>
                    {sub.sessions_total - sub.sessions_used <= 3 && sub.status === 'active' && (
                        <p className="text-[10px] font-black text-red-500 mt-1">⚠ {sub.sessions_total - sub.sessions_used} sessions remaining</p>
                    )}
                </div>

                {/* Auto-renew */}
                <div className="flex items-center justify-between mt-4 py-3 border-t border-slate-50">
                    <span className="text-xs font-bold text-slate-500">Auto-Renew</span>
                    <button onClick={() => onToggleAutoRenew(sub)} className={`w-10 h-5 rounded-full transition-all relative ${sub.auto_renew ? 'bg-[#463a7a]' : 'bg-slate-300'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${sub.auto_renew ? 'left-5' : 'left-0.5'}`} />
                    </button>
                </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 pt-2 border-t border-slate-50 flex items-center gap-2">
                <button onClick={() => onEdit(sub)} className="flex-1 py-2.5 bg-slate-100 hover:bg-[#463a7a] hover:text-white text-slate-700 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5">
                    <Edit2 size={12} /> Edit
                </button>
                {sub.status === 'active' ? (
                    <button onClick={() => onPause(sub)} className="p-2.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-2xl transition-all" title="Pause">
                        <PauseCircle size={16} />
                    </button>
                ) : sub.status === 'paused' ? (
                    <button onClick={() => onResume(sub)} className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-2xl transition-all" title="Resume">
                        <PlayCircle size={16} />
                    </button>
                ) : null}
                <button className="p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-2xl transition-all" title="Send reminder">
                    <Bell size={16} />
                </button>
            </div>
        </div>
    );
}

const EMPTY_FORM = { student_id: '', plan_name: '', billing_cycle: 'monthly', amount: '', sessions_total: 8, start_date: '', renewal_date: '', auto_renew: true };

export default function SubscriptionManager() {
    const navigate = useNavigate();
    const [subs, setSubs] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [cycleFilter, setCycleFilter] = useState('all');
    const [showForm, setShowForm] = useState(false);
    const [editingSub, setEditingSub] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [students, setStudents] = useState([]);

    useEffect(() => { loadData(); }, []);
    useEffect(() => { applyFilters(); }, [subs, search, statusFilter, cycleFilter]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [subRes, stuRes] = await Promise.all([api.get('/admin/subscriptions'), api.get('/students')]);
            setSubs(Array.isArray(subRes.data) ? subRes.data : []);
            setStudents(Array.isArray(stuRes.data) ? stuRes.data : []);
        } catch (err) {
            console.error('Failed to load subscriptions:', err);
            setSubs([]);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let list = [...subs];
        if (search) list = list.filter(s => s.student_name?.toLowerCase().includes(search.toLowerCase()) || s.plan_name?.toLowerCase().includes(search.toLowerCase()));
        if (statusFilter !== 'all') list = list.filter(s => s.status === statusFilter);
        if (cycleFilter !== 'all') list = list.filter(s => s.billing_cycle === cycleFilter);
        setFiltered(list);
    };

    const handlePause = (sub) => setSubs(prev => prev.map(s => s.id === sub.id ? { ...s, status: 'paused' } : s));
    const handleResume = (sub) => setSubs(prev => prev.map(s => s.id === sub.id ? { ...s, status: 'active' } : s));
    const handleToggleAutoRenew = (sub) => setSubs(prev => prev.map(s => s.id === sub.id ? { ...s, auto_renew: !s.auto_renew } : s));

    const handleEdit = (sub) => {
        setEditingSub(sub);
        setFormData({ student_id: sub.student_id, plan_name: sub.plan_name, billing_cycle: sub.billing_cycle, amount: sub.amount, sessions_total: sub.sessions_total, start_date: sub.start_date?.split('T')[0] || '', renewal_date: sub.renewal_date?.split('T')[0] || '', auto_renew: sub.auto_renew });
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingSub) await api.put(`/admin/subscriptions/${editingSub.id}`, formData);
            else await api.post('/admin/subscriptions', formData);
            loadData();
        } catch {
            const student = students.find(s => s.id === parseInt(formData.student_id));
            const sub = { ...formData, id: Date.now(), student_name: student ? `${student.first_name} ${student.last_name}` : 'Unknown', grade: 'Grade 1', course: 'Piano', sessions_used: 0, status: 'active' };
            if (editingSub) setSubs(prev => prev.map(s => s.id === editingSub.id ? { ...s, ...formData } : s));
            else setSubs(prev => [sub, ...prev]);
        }
        setShowForm(false);
        setSubmitting(false);
    };

    const now = new Date();
    const analytics = {
        active: subs.filter(s => s.status === 'active').length,
        paused: subs.filter(s => s.status === 'paused').length,
        expired: subs.filter(s => s.status === 'expired').length,
        expiringSoon: subs.filter(s => { const d = differenceInDays(new Date(s.renewal_date), now); return s.status === 'active' && d >= 0 && d <= 14; }).length,
        mrr: subs.filter(s => s.status === 'active' && s.billing_cycle === 'monthly').reduce((sum, s) => sum + s.amount, 0) +
            subs.filter(s => s.status === 'active' && s.billing_cycle === 'quarterly').reduce((sum, s) => sum + s.amount / 3, 0) +
            subs.filter(s => s.status === 'active' && s.billing_cycle === 'half-yearly').reduce((sum, s) => sum + s.amount / 6, 0) +
            subs.filter(s => s.status === 'active' && s.billing_cycle === 'yearly').reduce((sum, s) => sum + s.amount / 12, 0),
        sessionsPct: Math.round(subs.filter(s => s.status === 'active').reduce((s, sub) => s + sub.sessions_used, 0) / Math.max(1, subs.filter(s => s.status === 'active').reduce((s, sub) => s + sub.sessions_total, 0)) * 100),
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
            <div className="w-10 h-10 border-4 border-[#463a7a]/20 border-t-[#463a7a] rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            {/* Header */}
            <div className="relative bg-gradient-to-br from-[#463a7a] to-[#2d2550] px-6 pt-8 pb-8 lg:px-12 overflow-hidden">
                <div className="absolute -top-16 -right-16 w-80 h-80 bg-white/5 rounded-full pointer-events-none" />
                <div className="relative z-10 max-w-[1600px] mx-auto">
                    <button onClick={() => navigate('/admin/payments')} className="mb-4 text-white/50 hover:text-white text-xs font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors">← Payment Hub</button>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter leading-none mb-2">Subscriptions</h1>
                            <p className="text-white/50 text-sm">Manage billing cycles, renewals and session plans</p>
                        </div>
                        <button onClick={() => { setEditingSub(null); setFormData(EMPTY_FORM); setShowForm(true); }} className="px-6 py-3.5 bg-white text-[#463a7a] rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center gap-2 self-start lg:self-auto">
                            <Plus size={18} /> New Subscription
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-4 lg:px-12 py-8 space-y-6 pb-24">

                {/* Analytics Strip */}
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                    {[
                        { label: 'Active', val: analytics.active, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Paused', val: analytics.paused, icon: PauseCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'Expired', val: analytics.expired, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
                        { label: 'Renewing Soon', val: analytics.expiringSoon, icon: Bell, color: 'text-orange-600', bg: 'bg-orange-50' },
                        { label: 'Monthly MRR', val: `₹${(analytics.mrr / 1000).toFixed(1)}k`, icon: TrendingUp, color: 'text-[#463a7a]', bg: 'bg-violet-50' },
                        { label: 'Session Utiliz.', val: `${analytics.sessionsPct}%`, icon: Activity, color: 'text-teal-600', bg: 'bg-teal-50' },
                    ].map((item, i) => (
                        <div key={i} className="bg-white rounded-[24px] p-5 shadow-lg border border-slate-100 hover:shadow-xl transition-all">
                            <div className={`w-9 h-9 ${item.bg} rounded-2xl flex items-center justify-center mb-3`}>
                                <item.icon size={16} className={item.color} />
                            </div>
                            <p className="text-xl font-black text-slate-900">{item.val}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{item.label}</p>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="bg-white rounded-[32px] p-5 shadow-xl border border-slate-100 flex flex-col sm:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input type="text" placeholder="Search students or plans..." value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-11 pr-4 text-slate-900 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10 text-sm" />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {['all', 'active', 'paused', 'expired', 'cancelled'].map(s => (
                            <button key={s} onClick={() => setStatusFilter(s)}
                                className={`px-3.5 py-2 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${statusFilter === s ? 'bg-[#463a7a] text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{s}</button>
                        ))}
                        <div className="w-px h-6 bg-slate-200" />
                        {['all', 'monthly', 'quarterly', 'half-yearly', 'yearly'].map(c => (
                            <button key={c} onClick={() => setCycleFilter(c)}
                                className={`px-3.5 py-2 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${cycleFilter === c ? 'bg-[#463a7a] text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{c === 'all' ? 'All Cycles' : CYCLE_LABELS[c]}</button>
                        ))}
                    </div>
                </div>

                {/* Results count */}
                <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-400">{filtered.length} subscriptions</p>
                </div>

                {/* Cards grid */}
                {filtered.length === 0 ? (
                    <div className="text-center py-24">
                        <Repeat size={48} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-xl font-black text-slate-300">No subscriptions found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                        {filtered.map(sub => (
                            <SubscriptionCard key={sub.id} sub={sub} onPause={handlePause} onResume={handleResume} onEdit={handleEdit} onToggleAutoRenew={handleToggleAutoRenew} />
                        ))}
                    </div>
                )}
            </div>

            {/* Create / Edit Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white rounded-[40px] w-full max-w-xl shadow-2xl overflow-hidden">
                        <div className="bg-gradient-to-br from-[#463a7a] to-[#2d2550] p-8 text-white rounded-t-[40px] flex items-center justify-between">
                            <h3 className="text-2xl font-black tracking-tight">{editingSub ? 'Edit Subscription' : 'New Subscription'}</h3>
                            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-white/10 rounded-2xl transition-all"><X size={22} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-5 max-h-[70vh] overflow-y-auto">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Student *</label>
                                <select required value={formData.student_id} onChange={e => setFormData(f => ({ ...f, student_id: e.target.value }))}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-4 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10 appearance-none">
                                    <option value="">Select student...</option>
                                    {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                                </select>
                            </div>

                            {/* Quick fill from plan */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Select a Plan (quick fill)</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {PLANS.map(p => (
                                        <button key={p.name} type="button"
                                            onClick={() => setFormData(f => ({ ...f, plan_name: p.name, billing_cycle: p.cycle, amount: p.amount, sessions_total: p.sessions }))}
                                            className={`px-3 py-2.5 rounded-2xl text-xs font-black text-left transition-all border ${formData.plan_name === p.name ? 'bg-[#463a7a] text-white border-[#463a7a]' : 'bg-slate-50 text-slate-600 border-slate-100 hover:border-[#463a7a]/30'}`}>
                                            <span className="block">{p.name}</span>
                                            <span className="text-[10px] opacity-70">₹{p.amount.toLocaleString('en-IN')} · {p.sessions}s</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Plan Name *</label>
                                    <input required type="text" value={formData.plan_name} onChange={e => setFormData(f => ({ ...f, plan_name: e.target.value }))} placeholder="Plan name..."
                                        className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-4 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Billing Cycle</label>
                                    <select value={formData.billing_cycle} onChange={e => setFormData(f => ({ ...f, billing_cycle: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-4 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10 appearance-none">
                                        <option value="monthly">Monthly</option>
                                        <option value="quarterly">Quarterly</option>
                                        <option value="half-yearly">Half-Yearly</option>
                                        <option value="yearly">Yearly</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Amount (₹) *</label>
                                    <input required type="number" min="0" value={formData.amount} onChange={e => setFormData(f => ({ ...f, amount: parseFloat(e.target.value) }))} placeholder="0"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-4 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Sessions</label>
                                    <input type="number" min="1" value={formData.sessions_total} onChange={e => setFormData(f => ({ ...f, sessions_total: parseInt(e.target.value) }))}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-4 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Start Date</label>
                                    <input type="date" value={formData.start_date} onChange={e => setFormData(f => ({ ...f, start_date: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-4 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Renewal Date</label>
                                    <input type="date" value={formData.renewal_date} onChange={e => setFormData(f => ({ ...f, renewal_date: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-4 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10" />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-3xl">
                                <div>
                                    <p className="text-sm font-black text-slate-900">Auto-Renew</p>
                                    <p className="text-xs font-medium text-slate-400">Automatically renew when cycle ends</p>
                                </div>
                                <button type="button" onClick={() => setFormData(f => ({ ...f, auto_renew: !f.auto_renew }))}
                                    className={`w-12 h-6 rounded-full transition-all relative ${formData.auto_renew ? 'bg-[#463a7a]' : 'bg-slate-300'}`}>
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${formData.auto_renew ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>

                            <div className="flex gap-4 pt-2">
                                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
                                <button type="submit" disabled={submitting} className="flex-1 py-4 bg-[#463a7a] text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                    {submitting ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                                    {editingSub ? 'Save Changes' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* FAB */}
            <div className="fixed bottom-6 right-6 z-50">
                <button onClick={() => { setEditingSub(null); setFormData(EMPTY_FORM); setShowForm(true); }} className="w-14 h-14 bg-gradient-to-br from-[#463a7a] to-[#2d2550] text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center">
                    <Plus size={24} />
                </button>
            </div>
        </div>
    );
}
