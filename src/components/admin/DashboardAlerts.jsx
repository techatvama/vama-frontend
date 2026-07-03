import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../../lib/api';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import {
    AlertTriangle, FileWarning, CalendarClock, BatteryLow, Layers, ShieldAlert,
    Loader2, Bell, ChevronRight,
} from 'lucide-react';

const money = (v) => `₹${(Number(v) || 0).toLocaleString('en-IN')}`;

const CARDS = [
    { key: 'overdue_invoices', label: 'Overdue Invoices', Icon: FileWarning, tone: 'rose' },
    { key: 'expiring_packages', label: 'Expiring Packages', Icon: CalendarClock, tone: 'amber' },
    { key: 'low_sessions', label: 'Sessions Running Low', Icon: BatteryLow, tone: 'amber' },
    { key: 'installments_due', label: 'Installments Due', Icon: Layers, tone: 'indigo' },
    { key: 'makeup_violations', label: 'Makeup Violations', Icon: ShieldAlert, tone: 'rose' },
];
const TONE = {
    rose: 'bg-rose-50 text-rose-600', amber: 'bg-amber-50 text-amber-600', indigo: 'bg-indigo-50 text-[#463a7a]',
};

export default function DashboardAlerts() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const navigate = useNavigate();

    const load = useCallback(async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        try { setData((await api.get('/admin/dashboard-alerts')).data); } catch (e) { console.error(e); }
        finally { if (!isRefresh) setLoading(false); }
    }, []);
    useEffect(() => { load(); }, [load]);
    useAutoRefresh(load, 60000);

    const runReminders = async () => {
        setSending(true);
        try { const r = await api.post('/admin/run-installment-reminders'); alert(`${r.data.reminders_sent} reminder(s) sent.`); }
        catch (e) { alert(e.response?.data?.detail || 'Failed'); }
        finally { setSending(false); }
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]"><Loader2 className="animate-spin text-[#463a7a]" size={32} /></div>;
    const c = data?.counts || {};
    const totalOpen = Object.values(c).reduce((a, b) => a + (b || 0), 0);

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 lg:p-8">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Premium hero */}
                <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#463a7a] via-[#3a2f66] to-[#2d2550] p-7 lg:p-9 text-white shadow-2xl">
                    <div className="absolute -right-10 -top-10 w-56 h-56 bg-white/5 rounded-full blur-2xl" />
                    <div className="absolute right-24 bottom-0 opacity-10"><Bell size={140} /></div>
                    <div className="relative flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-200/70">Operations Center</p>
                            <h1 className="text-4xl lg:text-5xl font-black tracking-tighter mt-1">Alerts</h1>
                            <p className="text-indigo-100/70 font-bold mt-2">{totalOpen === 0 ? 'All clear — nothing needs attention.' : `${totalOpen} item${totalOpen === 1 ? '' : 's'} need attention.`}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-center bg-white/10 backdrop-blur-md rounded-3xl px-6 py-4 border border-white/10">
                                <p className="text-4xl font-black leading-none">{totalOpen}</p>
                                <p className="text-[9px] font-black uppercase tracking-widest text-indigo-200/60 mt-1">Open</p>
                            </div>
                            <button onClick={runReminders} disabled={sending} className="bg-white text-[#463a7a] rounded-2xl px-5 py-3 font-black text-sm flex items-center gap-2 disabled:opacity-50 shadow-lg active:scale-95 transition-all">
                                {sending ? <Loader2 className="animate-spin" size={16} /> : <Bell size={16} />} Send reminders
                            </button>
                        </div>
                    </div>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                    {CARDS.map(({ key, label, Icon, tone }) => (
                        <div key={key} className={`bg-white rounded-3xl p-4 shadow-sm border transition-all hover:shadow-md hover:-translate-y-0.5 ${(c[key] || 0) > 0 ? 'border-slate-100' : 'border-slate-100 opacity-70'}`}>
                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${TONE[tone]} mb-3`}><Icon size={19} /></div>
                            <p className="text-3xl font-black text-slate-900 leading-none">{c[key] || 0}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">{label}</p>
                        </div>
                    ))}
                </div>

                <Section title="Overdue Invoices" items={data.overdue_invoices} empty="No overdue invoices"
                    render={(x) => (
                        <button onClick={() => navigate('/admin/invoices')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 rounded-2xl text-left">
                            <span className="font-bold text-slate-700">{x.student} · <span className="text-slate-400">{x.invoice_number}</span></span>
                            <span className="flex items-center gap-3"><span className="text-rose-600 font-black">{money(x.balance)}</span><span className="text-xs text-slate-400 font-bold">due {x.due_date}</span><ChevronRight size={15} className="text-slate-300" /></span>
                        </button>
                    )} />
                <Section title="Installments Due (7 days)" items={data.installments_due} empty="Nothing due soon"
                    render={(x) => <Row left={`${x.student}`} right={`${money(x.amount)} · due ${x.due_date}`} />} />
                <Section title="Expiring Packages (7 days)" items={data.expiring_packages} empty="No packages expiring"
                    render={(x) => <Row left={`${x.student} · ${x.package || ''}`} right={`expires ${x.end_date}`} />} />
                <Section title="Sessions Running Low" items={data.low_sessions} empty="All good"
                    render={(x) => <Row left={`${x.student} · ${x.package || ''}`} right={`${x.remaining} left`} />} />
                <Section title="Makeup Violations" items={data.makeup_violations} empty="None"
                    render={(x) => <Row left={x.student} right={`${x.used}/${x.allowed} makeup used`} />} />
            </div>
        </div>
    );
}

function Section({ title, items, render, empty }) {
    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-50 flex items-center justify-between">
                <h2 className="font-black text-slate-900 text-sm flex items-center gap-2"><AlertTriangle size={15} className="text-amber-400" /> {title}</h2>
                <span className="text-xs font-black text-slate-400">{items?.length || 0}</span>
            </div>
            <div className="p-2">
                {items && items.length ? items.map((x, i) => <div key={i}>{render(x)}</div>)
                    : <p className="text-center text-slate-300 font-bold py-5 text-sm">{empty}</p>}
            </div>
        </div>
    );
}
const Row = ({ left, right }) => (
    <div className="flex items-center justify-between px-4 py-2.5">
        <span className="font-bold text-slate-700 text-sm">{left}</span>
        <span className="text-xs font-black text-slate-500">{right}</span>
    </div>
);
