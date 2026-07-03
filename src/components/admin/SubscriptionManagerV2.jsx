import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../../lib/api';
import {
    RefreshCw, Plus, X, Loader2, Repeat, Play, Pause, Trash2, Search, Calendar,
    CheckCircle2, AlertCircle, Zap,
} from 'lucide-react';
import { format } from 'date-fns';

const money = (v) => `₹${(Number(v) || 0).toLocaleString('en-IN')}`;
const CYCLES = [['monthly', 'Monthly'], ['quarterly', 'Quarterly'], ['half-yearly', 'Half-Yearly'], ['yearly', 'Yearly']];
const OFFSETS = [[0, 'On the same day'], [1, '1 day before'], [2, '2 days before'], [7, '1 week before']];
const DUE_OFFSETS = [[0, 'Same day as invoice'], [3, '3 days after'], [7, '7 days after'], [15, '15 days after'], [30, '30 days after']];
const TZS = ['Asia/Calcutta', 'Asia/Dubai', 'Europe/London', 'America/New_York', 'UTC'];
const STATUS = { active: 'bg-emerald-50 text-emerald-700', paused: 'bg-amber-50 text-amber-700', cancelled: 'bg-slate-100 text-slate-500', expired: 'bg-rose-50 text-rose-600' };

export default function SubscriptionManagerV2() {
    const [subs, setSubs] = useState([]);
    const [students, setStudents] = useState([]);
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [running, setRunning] = useState(false);
    const [notice, setNotice] = useState('');
    const navigate = useNavigate();

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [s, st, p] = await Promise.all([
                api.get('/admin/subscriptions'), api.get('/students'),
                api.get('/admin/packages'),
            ]);
            setSubs(s.data || []); setStudents(st.data || []); setPackages(p.data || []);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    }, []);
    useEffect(() => { load(); }, [load]);
    const flash = (m) => { setNotice(m); setTimeout(() => setNotice(''), 3500); };

    const runNow = async () => {
        setRunning(true);
        try { const r = await api.post('/admin/run-subscriptions'); flash(`${r.data.invoices_created} invoice(s) generated`); load(); }
        catch (e) { flash(e.response?.data?.detail || 'Failed'); } finally { setRunning(false); }
    };
    const setStatus = async (sub, status) => { await api.put(`/admin/subscriptions/${sub.id}`, { status }); load(); };

    if (loading) return <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]"><Loader2 className="animate-spin text-[#463a7a]" size={32} /></div>;

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 lg:p-8">
            <div className="max-w-6xl mx-auto space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3"><Repeat className="text-[#463a7a]" /> Subscriptions</h1>
                        <p className="text-slate-400 font-bold text-sm mt-1">Automatically recur invoices at a set interval.</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={runNow} disabled={running} className="bg-white border border-slate-200 text-slate-600 rounded-2xl px-4 py-2.5 font-black text-sm flex items-center gap-2 hover:border-[#463a7a] disabled:opacity-50">
                            {running ? <Loader2 className="animate-spin" size={15} /> : <Zap size={15} />} Run due now
                        </button>
                        <button onClick={() => setShowForm(true)} className="bg-[#463a7a] text-white rounded-2xl px-5 py-2.5 font-black text-sm flex items-center gap-2"><Plus size={16} /> New Subscription</button>
                    </div>
                </div>
                {notice && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-2xl text-sm font-black flex items-center gap-2"><CheckCircle2 size={16} />{notice}</div>}

                {/* List view */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                {['Student', 'Plan', 'Cycle', 'Amount', 'Next Invoice', 'Status', ''].map(h => (
                                    <th key={h} className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {subs.map((s, i) => (
                                <tr key={s.id} className={`border-b border-slate-50 hover:bg-slate-50/50 ${i % 2 ? 'bg-slate-50/20' : ''}`}>
                                    <td className="px-5 py-3"><p className="text-sm font-black text-slate-900">{s.student_name}</p><p className="text-[10px] text-slate-400 font-bold">{s.student_email}</p></td>
                                    <td className="px-5 py-3 text-sm font-bold text-slate-700">{s.plan_name}</td>
                                    <td className="px-5 py-3"><span className="text-xs font-black text-[#463a7a] capitalize">{s.billing_cycle}</span></td>
                                    <td className="px-5 py-3 text-sm font-black text-slate-900">{money(s.amount)}</td>
                                    <td className="px-5 py-3 text-xs font-bold text-slate-600">{s.next_invoice_date || '—'}</td>
                                    <td className="px-5 py-3"><span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${STATUS[s.status] || STATUS.active}`}>{s.status}</span></td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-1 justify-end">
                                            {s.status === 'active'
                                                ? <button onClick={() => setStatus(s, 'paused')} title="Pause" className="p-2 rounded-xl text-slate-400 hover:bg-amber-50 hover:text-amber-600"><Pause size={14} /></button>
                                                : <button onClick={() => setStatus(s, 'active')} title="Resume" className="p-2 rounded-xl text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"><Play size={14} /></button>}
                                            <button onClick={() => setStatus(s, 'cancelled')} title="Cancel" className="p-2 rounded-xl text-slate-300 hover:bg-red-50 hover:text-red-500"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {subs.length === 0 && <tr><td colSpan={7} className="text-center text-slate-400 font-bold py-12">No subscriptions yet.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
            {showForm && <SubForm students={students} packages={packages} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
        </div>
    );
}

function SubForm({ students, packages, onClose, onSaved }) {
    const today = format(new Date(), 'yyyy-MM-dd');
    const [form, setForm] = useState({
        student_id: '', package_id: '', plan_name: '', amount: '', sessions_total: 8,
        billing_cycle: 'monthly', create_offset_days: 0, due_offset_days: 7,
        first_invoice_date: today, end_type: 'never', end_date: '',
        timezone: 'Asia/Calcutta', auto_email: true,
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [stuSearch, setStuSearch] = useState('');

    const student = students.find(s => String(s.id) === String(form.student_id));
    const matches = students.filter(s => `${s.first_name} ${s.last_name} ${s.email}`.toLowerCase().includes(stuSearch.toLowerCase())).slice(0, 20);

    const pickPackage = (id) => {
        const p = packages.find(x => String(x.id) === String(id));
        setForm(f => ({ ...f, package_id: id, plan_name: p ? p.name : f.plan_name, amount: p ? p.price : f.amount, sessions_total: p ? p.total_sessions : f.sessions_total }));
    };
    const save = async () => {
        setError('');
        if (!form.student_id || !form.amount) { setError('Pick a student and a package/amount.'); return; }
        setSaving(true);
        try {
            await api.post('/admin/subscriptions', {
                ...form, student_id: Number(form.student_id), amount: Number(form.amount),
                package_id: form.package_id || null,
                create_offset_days: Number(form.create_offset_days),
                due_offset_days: Number(form.due_offset_days),
                end_date: form.end_type === 'on_date' ? form.end_date : null,
            });
            onSaved();
        } catch (e) { setError(e.response?.data?.detail || 'Failed'); } finally { setSaving(false); }
    };
    const input = "w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#463a7a]/15";
    const nextLabel = form.first_invoice_date;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-[32px] w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl">
                <div className="p-6 bg-[#463a7a] text-white sticky top-0 z-10 flex items-center justify-between">
                    <h2 className="text-xl font-black tracking-tighter flex items-center gap-2"><Repeat size={20} /> New Subscription</h2>
                    <button onClick={onClose}><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                    {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-2xl text-sm font-bold flex items-center gap-2"><AlertCircle size={16} />{error}</div>}

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</label>
                        <div className="relative mt-1">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input value={student ? `${student.first_name} ${student.last_name}` : stuSearch} onChange={e => { setStuSearch(e.target.value); setForm(f => ({ ...f, student_id: '' })); }} placeholder="Search student…" className={`${input} pl-9`} />
                            {!form.student_id && stuSearch && (
                                <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-2xl shadow-xl max-h-44 overflow-y-auto">
                                    {matches.map(s => <button key={s.id} onClick={() => { setForm(f => ({ ...f, student_id: s.id })); setStuSearch(''); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm font-bold text-slate-700">{s.first_name} {s.last_name}</button>)}
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Package</label>
                        <select value={form.package_id} onChange={e => pickPackage(e.target.value)} className={`${input} mt-1`}>
                            <option value="">— Select package —</option>
                            {packages.map(p => <option key={p.id} value={p.id}>{p.name} ({money(p.price)})</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan name</label><input value={form.plan_name} onChange={e => setForm(f => ({ ...f, plan_name: e.target.value }))} className={`${input} mt-1`} /></div>
                        <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount (₹)</label><input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className={`${input} mt-1`} /></div>
                    </div>

                    {/* Repeat this invoice */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Repeat this invoice</label>
                            <select value={form.billing_cycle} onChange={e => setForm(f => ({ ...f, billing_cycle: e.target.value }))} className={`${input} mt-1`}>
                                {CYCLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Create invoice</label>
                            <select value={form.create_offset_days} onChange={e => setForm(f => ({ ...f, create_offset_days: Number(e.target.value) }))} className={`${input} mt-1`}>
                                {OFFSETS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                        </div>
                    </div>
                    <p className="text-[11px] text-slate-400 font-bold -mt-1">Next invoice will be issued on <span className="text-slate-600">{nextLabel}</span>.</p>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Create first invoice</label>
                            <input type="date" value={form.first_invoice_date} onChange={e => setForm(f => ({ ...f, first_invoice_date: e.target.value }))} className={`${input} mt-1`} />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment due</label>
                            <select value={form.due_offset_days} onChange={e => setForm(f => ({ ...f, due_offset_days: Number(e.target.value) }))} className={`${input} mt-1`}>
                                {DUE_OFFSETS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                        </div>
                    </div>
                    {form.due_offset_days > 0 && form.first_invoice_date && (
                        <p className="text-[11px] text-slate-400 font-bold -mt-1">
                            First payment due on <span className="text-slate-600">
                                {new Date(new Date(form.first_invoice_date).getTime() + form.due_offset_days * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>.
                        </p>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">End subscription</label>
                            <select value={form.end_type} onChange={e => setForm(f => ({ ...f, end_type: e.target.value }))} className={`${input} mt-1`}>
                                <option value="never">Never</option>
                                <option value="on_date">On a date</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Create in time zone</label>
                            <select value={form.timezone} onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))} className={`${input} mt-1`}>
                                {TZS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>
                    {form.end_type === 'on_date' && <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className={input} />}
                    <label className="flex items-center gap-2.5 cursor-pointer">
                        <input type="checkbox" checked={form.auto_email} onChange={e => setForm(f => ({ ...f, auto_email: e.target.checked }))} className="w-5 h-5 rounded-md accent-[#463a7a]" />
                        <span className="text-sm font-bold text-slate-600">Email each generated invoice to the student</span>
                    </label>

                    <button onClick={save} disabled={saving} className="w-full bg-[#463a7a] text-white rounded-2xl py-3.5 font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50">
                        {saving ? <Loader2 className="animate-spin" size={18} /> : 'Create Subscription'}
                    </button>
                </div>
            </div>
        </div>
    );
}
