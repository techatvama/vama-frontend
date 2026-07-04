import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { useAdmin } from '../../context/AdminContext';
import {
    CreditCard, FileText, Building2, Plus, Trash2, Loader2, Check, X, Star,
    ChevronUp, ChevronDown, Eye, EyeOff, Save, AlertCircle, CheckCircle2, Info,
} from 'lucide-react';

const input = "w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#463a7a]/15";
const TABS = [['modes', 'Payment Modes', CreditCard], ['org', 'Academy & GST', Building2]];

export default function BillingSettings() {
    const [tab, setTab] = useState('modes');
    const [notice, setNotice] = useState('');
    const { isSuperAdmin, admin } = useAdmin();
    const flash = (m) => { setNotice(m); setTimeout(() => setNotice(''), 3000); };

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Billing Settings</h1>
                    <p className="text-slate-400 font-bold text-sm mt-1">Payment modes, invoice templates, and academy/GST details.</p>
                </div>
                {notice && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-2xl text-sm font-black flex items-center gap-2"><CheckCircle2 size={16} />{notice}</div>}
                <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 w-fit">
                    {TABS.map(([id, label, Icon]) => (
                        <button key={id} onClick={() => setTab(id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black transition-all ${tab === id ? 'bg-[#463a7a] text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                            <Icon size={16} /> {label}
                        </button>
                    ))}
                </div>
                {tab === 'modes' && <PaymentModes flash={flash} />}
                {tab === 'org' && <OrgSettings flash={flash} isSuperAdmin={isSuperAdmin} centerName={admin?.center_name} />}
            </div>
        </div>
    );
}

// ── Payment Modes ──
function PaymentModes({ flash }) {
    const [modes, setModes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState('');
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        try { setModes((await api.get('/admin/payment-modes')).data || []); } catch {} finally { setLoading(false); }
    }, []);
    useEffect(() => { load(); }, [load]);

    const add = async () => {
        setError('');
        if (!newName.trim()) return;
        try { await api.post('/admin/payment-modes', { name: newName.trim() }); setNewName(''); flash('Payment mode added'); load(); }
        catch (e) { setError(e.response?.data?.detail || 'Failed'); }
    };
    const toggle = async (m) => { await api.patch(`/admin/payment-modes/${m.id}`, { is_active: !m.is_active }); load(); };
    const rename = async (m, name) => { await api.patch(`/admin/payment-modes/${m.id}`, { name }); };
    const del = async (m) => { if (confirm(`Delete "${m.name}"?`)) { await api.delete(`/admin/payment-modes/${m.id}`); flash('Deleted'); load(); } };
    const move = async (idx, dir) => {
        const arr = [...modes]; const j = idx + dir;
        if (j < 0 || j >= arr.length) return;
        [arr[idx], arr[j]] = [arr[j], arr[idx]];
        setModes(arr);
        await api.post('/admin/payment-modes/reorder', { order: arr.map(m => m.id) });
    };

    if (loading) return <Spinner />;
    return (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-3">
            {error && <Err msg={error} />}
            <div className="flex gap-2">
                <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="New payment mode (e.g. Razorpay)" className={input} />
                <button onClick={add} className="bg-[#463a7a] text-white rounded-xl px-5 font-black text-sm flex items-center gap-1.5 whitespace-nowrap"><Plus size={16} /> Add</button>
            </div>
            <div className="space-y-2">
                {modes.map((m, idx) => (
                    <div key={m.id} className={`flex items-center gap-2 p-2.5 rounded-2xl border ${m.is_active ? 'bg-slate-50 border-slate-100' : 'bg-slate-50/50 border-slate-100 opacity-60'}`}>
                        <div className="flex flex-col">
                            <button onClick={() => move(idx, -1)} className="text-slate-300 hover:text-slate-600"><ChevronUp size={14} /></button>
                            <button onClick={() => move(idx, 1)} className="text-slate-300 hover:text-slate-600"><ChevronDown size={14} /></button>
                        </div>
                        <input defaultValue={m.name} onBlur={e => rename(m, e.target.value)} className="flex-1 bg-transparent text-sm font-black text-slate-800 focus:outline-none" />
                        <button onClick={() => toggle(m)} title={m.is_active ? 'Disable' : 'Enable'} className={`p-2 rounded-xl ${m.is_active ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`}>{m.is_active ? <Eye size={15} /> : <EyeOff size={15} />}</button>
                        <button onClick={() => del(m)} className="p-2 rounded-xl text-slate-300 hover:bg-red-50 hover:text-red-500"><Trash2 size={15} /></button>
                    </div>
                ))}
            </div>
            <p className="text-xs text-slate-400 font-bold">Drag order with the arrows · disable instead of delete to keep payment history intact.</p>
        </div>
    );
}

// ── Invoice Templates ──
function Templates({ flash }) {
    const [tpls, setTpls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);

    const load = useCallback(async () => {
        try { setTpls((await api.get('/admin/invoice-templates')).data || []); } catch {} finally { setLoading(false); }
    }, []);
    useEffect(() => { load(); }, [load]);

    const blank = { name: '', category: 'terms', content: '', is_default: false };
    const save = async (t) => {
        if (!t.name.trim()) return;
        if (t.id) await api.patch(`/admin/invoice-templates/${t.id}`, t);
        else await api.post('/admin/invoice-templates', t);
        setEditing(null); flash('Template saved'); load();
    };
    const del = async (t) => { if (confirm(`Delete "${t.name}"?`)) { await api.delete(`/admin/invoice-templates/${t.id}`); flash('Deleted'); load(); } };
    const makeDefault = async (t) => { await api.patch(`/admin/invoice-templates/${t.id}`, { is_default: true }); flash('Default set'); load(); };

    if (loading) return <Spinner />;
    return (
        <div className="space-y-3">
            <button onClick={() => setEditing(blank)} className="bg-[#463a7a] text-white rounded-xl px-5 py-2.5 font-black text-sm flex items-center gap-1.5"><Plus size={16} /> New Template</button>
            {tpls.map(t => (
                <div key={t.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900">{t.name}</span>
                            {t.category && <span className="text-[10px] font-black uppercase bg-indigo-50 text-[#463a7a] px-2 py-0.5 rounded-md">{t.category}</span>}
                            {t.is_default && <span className="text-[10px] font-black uppercase bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md flex items-center gap-1"><Star size={10} /> Default</span>}
                        </div>
                        <div className="flex gap-1">
                            {!t.is_default && <button onClick={() => makeDefault(t)} title="Set default" className="p-2 rounded-xl text-slate-400 hover:bg-amber-50 hover:text-amber-500"><Star size={15} /></button>}
                            <button onClick={() => setEditing(t)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100">Edit</button>
                            <button onClick={() => del(t)} className="p-2 rounded-xl text-slate-300 hover:bg-red-50 hover:text-red-500"><Trash2 size={15} /></button>
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 font-medium mt-1.5 line-clamp-2 whitespace-pre-wrap">{t.content}</p>
                </div>
            ))}
            {tpls.length === 0 && <p className="text-slate-400 font-bold text-center py-8">No templates yet.</p>}
            {editing && <TemplateEditor tpl={editing} onClose={() => setEditing(null)} onSave={save} />}
        </div>
    );
}

function TemplateEditor({ tpl, onClose, onSave }) {
    const [t, setT] = useState(tpl);
    const cats = ['welcome', 'terms', 'refund', 'payment', 'bank', 'upi', 'custom'];
    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-slate-900">{t.id ? 'Edit' : 'New'} Template</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
                </div>
                <input value={t.name} onChange={e => setT({ ...t, name: e.target.value })} placeholder="Template name (e.g. Standard Terms)" className={input} />
                <select value={t.category || 'custom'} onChange={e => setT({ ...t, category: e.target.value })} className={input}>
                    {cats.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <textarea value={t.content || ''} onChange={e => setT({ ...t, content: e.target.value })} rows={7} placeholder="Welcome / Terms / Bank details / UPI… (this auto-fills the invoice notes)" className={`${input} resize-none`} />
                <label className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={!!t.is_default} onChange={e => setT({ ...t, is_default: e.target.checked })} className="w-5 h-5 rounded-md accent-[#463a7a]" />
                    <span className="text-sm font-bold text-slate-600">Set as default template</span>
                </label>
                <button onClick={() => onSave(t)} className="w-full bg-[#463a7a] text-white rounded-2xl py-3 font-black text-sm flex items-center justify-center gap-2"><Check size={16} /> Save</button>
            </div>
        </div>
    );
}

// ── Academy / GST ──
function OrgSettings({ flash, isSuperAdmin, centerName }) {
    const [form, setForm] = useState(null);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const endpoint = '/admin/center-billing-settings';
    useEffect(() => {
        api.get(endpoint).then(r => setForm(r.data || {})).catch(() => setForm({}));
    }, []);
    if (!form) return <Spinner />;

    const uploadLogo = async (file) => {
        if (!file) return;
        setUploading(true);
        try {
            const fd = new FormData(); fd.append('file', file);
            const r = await api.post('/admin/upload-logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setForm(f => ({ ...f, logo_url: r.data.logo_url })); flash('Logo uploaded');
        } catch { flash('Logo upload failed'); } finally { setUploading(false); }
    };

    const fi = (k, label) => (
        <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
            <input value={form[k] || ''} onChange={e => setForm({ ...form, [k]: e.target.value })} className={`${input} mt-1`} />
        </div>
    );
    const fa = (k, label, rows = 2) => (
        <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
            <textarea value={form[k] || ''} onChange={e => setForm({ ...form, [k]: e.target.value })} rows={rows} className={`${input} mt-1 resize-none`} />
        </div>
    );

    const save = async () => {
        setSaving(true);
        try { await api.put(endpoint, form); flash('Saved'); }
        catch { flash('Failed to save'); }
        finally { setSaving(false); }
    };

    return (
        <div className="space-y-5">
            {/* Context banner */}
            <div className={`flex items-start gap-3 p-4 rounded-2xl border text-sm font-bold ${isSuperAdmin ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-indigo-50 border-indigo-200 text-indigo-700'}`}>
                <Info size={16} className="mt-0.5 flex-shrink-0" />
                <div>
                    {isSuperAdmin
                        ? 'These are the global defaults. Each center can override individual fields in their own billing settings.'
                        : `These settings apply to invoices generated for students at ${centerName || 'your center'}. Blank fields inherit the global defaults.`}
                </div>
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-5">
                {/* Logo (super admin only — global logo shared across all centers) */}
                {isSuperAdmin && (
                    <div className="flex items-center gap-4 bg-slate-50 rounded-2xl p-4">
                        <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {form.logo_url ? <img src={form.logo_url} alt="logo" className="max-h-16 max-w-16" /> : <span className="text-xl font-black text-[#463a7a]">VAMA</span>}
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Academy Logo</p>
                            <p className="text-xs text-slate-400 font-bold mb-2">Shown on invoices, receipts & the payment page.</p>
                            <label className="inline-flex items-center gap-2 bg-[#463a7a] text-white rounded-xl px-4 py-2 text-xs font-black cursor-pointer">
                                {uploading ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} Upload Logo
                                <input type="file" accept="image/*" className="hidden" onChange={e => uploadLogo(e.target.files?.[0])} />
                            </label>
                        </div>
                    </div>
                )}

                {/* Academy & Contact */}
                <div>
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Academy & Contact</p>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {fi('academy_name', 'Academy Name')}
                        {fi('gst_number', 'GSTIN')}
                        {fi('phone', 'Phone')}
                        {fi('email', 'Email')}
                        {fi('website', 'Website')}
                    </div>
                    <div className="mt-4">{fa('address', 'Address', 3)}</div>
                </div>

                {/* Invoice Content */}
                <div>
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Invoice Content</p>
                    <div className="space-y-4">
                        {fa('invoice_notes', 'Invoice Notes — Welcome message & Terms (printed on every invoice)', 5)}
                        {fa('invoice_footer', 'Invoice Footer', 2)}
                    </div>
                </div>

                {/* Razorpay Integration (super admin only) */}
                {isSuperAdmin && (
                    <div>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Razorpay Integration</p>
                        <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                            <p className="text-xs text-slate-400 font-bold">Students can pay online via Razorpay. Enter your live keys from the <a href="https://dashboard.razorpay.com" target="_blank" rel="noreferrer" className="text-[#463a7a] underline">Razorpay Dashboard</a>.</p>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-1">Key ID (rzp_live_...)</label>
                                    <input value={form.razorpay_key_id || ''} onChange={e => setForm({ ...form, razorpay_key_id: e.target.value })} placeholder="rzp_live_xxxxxxxxxxxx" className={`${input} font-mono text-xs`} />
                                </div>
                                <div>
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-1">Key Secret</label>
                                    <input type="password" value={form.razorpay_key_secret || ''} onChange={e => setForm({ ...form, razorpay_key_secret: e.target.value })} placeholder="••••••••••••••••••••" className={`${input} font-mono text-xs`} />
                                </div>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.razorpay_enabled === 'true' || form.razorpay_enabled === true} onChange={e => setForm({ ...form, razorpay_enabled: String(e.target.checked) })} className="w-4 h-4 accent-[#463a7a]" />
                                <span className="text-xs font-black text-slate-700">Enable Razorpay online payments in student portal</span>
                            </label>
                        </div>
                    </div>
                )}

                <button onClick={save} disabled={saving} className="bg-[#463a7a] text-white rounded-2xl px-6 py-3 font-black text-sm flex items-center gap-2 disabled:opacity-50">
                    {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Save Settings
                </button>
            </div>
        </div>
    );
}

const Spinner = () => <div className="py-16 flex justify-center"><Loader2 className="animate-spin text-[#463a7a]" size={28} /></div>;
const Err = ({ msg }) => <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-2xl text-sm font-bold flex items-center gap-2"><AlertCircle size={16} />{msg}</div>;
