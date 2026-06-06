import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
    Building2, Mail, CreditCard, Palette, Database, Shield,
    Save, Eye, EyeOff, Send, Check, AlertCircle, Loader2,
    Plus, X, MapPin, Clock, Bell, ChevronRight, RefreshCw,
    Globe, Phone, FileText, Hash, Percent
} from 'lucide-react';

const SECTIONS = [
    { id: 'academy',     label: 'Academy Profile',   icon: Building2,   desc: 'Name, contact & legal info' },
    { id: 'branches',    label: 'Branches',           icon: MapPin,      desc: 'Manage centre locations' },
    { id: 'email',       label: 'Email & SMTP',       icon: Mail,        desc: 'Invoice & notification email' },
    { id: 'payments',    label: 'Payments & Tax',     icon: CreditCard,  desc: 'GST, invoices, currency' },
    { id: 'scheduling',  label: 'Scheduling',         icon: Clock,       desc: 'Working hours & attendance' },
    { id: 'appearance',  label: 'Appearance',         icon: Palette,     desc: 'Theme colour' },
    { id: 'system',      label: 'System & API',       icon: Database,    desc: 'API URL & backend info' },
    { id: 'credentials', label: 'Login Credentials',  icon: Shield,      desc: 'Student & staff passwords' },
];

function Field({ label, hint, required, children }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                {label} {required && <span className="text-red-400 normal-case font-normal">*</span>}
            </label>
            {children}
            {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
        </div>
    );
}

const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10 focus:border-[#463a7a]/40 transition-all placeholder:text-slate-300";

function SaveBar({ saving, saved, onSave }) {
    return (
        <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-slate-100">
            {saved && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                    <Check size={13} /> Saved
                </span>
            )}
            <button onClick={onSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#463a7a] hover:bg-[#342a5b] text-white rounded-2xl text-sm font-bold transition-all disabled:opacity-50 shadow-sm">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save Changes
            </button>
        </div>
    );
}

export default function SettingsPage() {
    const [active, setActive] = useState('academy');
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');
    const [credentials, setCredentials] = useState(null);
    const [credLoading, setCredLoading] = useState(false);
    const [bulkPassword, setBulkPassword] = useState('vama@1234');
    const [bulkSetting, setBulkSetting] = useState(false);
    const [bulkResult, setBulkResult] = useState(null);
    const [showSmtpPass, setShowSmtpPass] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [testingEmail, setTestingEmail] = useState(false);
    const [testResult, setTestResult] = useState(null);

    useEffect(() => {
        api.get('/admin/settings')
            .then(r => setSettings(r.data))
            .catch(() => setError('Could not load settings'))
            .finally(() => setLoading(false));
    }, []);

    const set = (key, val) => {
        setSaved(false);
        setSettings(prev => ({ ...prev, [key]: val }));
    };

    const save = async () => {
        setSaving(true); setError(''); setSaved(false);
        try {
            const updated = await api.put('/admin/settings', settings);
            setSettings(updated.data);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch { setError('Failed to save settings.'); }
        finally { setSaving(false); }
    };

    const loadCredentials = async () => {
        setCredLoading(true);
        try { const r = await api.get('/admin/credentials'); setCredentials(r.data); }
        catch { setError('Could not load credentials'); }
        finally { setCredLoading(false); }
    };

    const applyBulkPasswords = async () => {
        setBulkSetting(true); setBulkResult(null);
        try {
            const r = await api.post('/admin/bulk-set-default-passwords', { default_password: bulkPassword, override_all: true });
            setBulkResult(r.data);
            await loadCredentials();
        } catch { setError('Bulk password reset failed.'); }
        finally { setBulkSetting(false); }
    };

    const sendTestEmail = async () => {
        if (!testEmail) return;
        setTestingEmail(true); setTestResult(null);
        try {
            const res = await api.post('/admin/settings/test-email', { to_email: testEmail });
            setTestResult({ ok: true, msg: res.data.message });
        } catch (e) {
            setTestResult({ ok: false, msg: e.response?.data?.detail || 'Failed to send test email' });
        } finally { setTestingEmail(false); }
    };

    // Branches helper
    const branches = (() => {
        try { return JSON.parse(settings.branches || '[]'); } catch { return []; }
    })();
    const setBranches = (arr) => set('branches', JSON.stringify(arr));

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
            <Loader2 size={24} className="animate-spin text-[#463a7a]" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            {/* Header */}
            <div className="bg-gradient-to-br from-[#463a7a] to-[#2d2550] px-6 pt-8 pb-8 lg:px-12">
                <h1 className="text-4xl font-bold text-white tracking-tight mb-1">Settings</h1>
                <p className="text-white/50 text-sm">Configure your academy platform</p>
            </div>

            <div className="max-w-[1100px] mx-auto px-4 lg:px-8 py-8 pb-24">
                {error && (
                    <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 text-sm text-red-600">
                        <AlertCircle size={14} /> {error}
                    </div>
                )}

                <div className="flex gap-6">
                    {/* Sidebar nav */}
                    <div className="w-56 flex-shrink-0 space-y-1">
                        {SECTIONS.map(s => {
                            const Icon = s.icon;
                            return (
                                <button key={s.id} onClick={() => setActive(s.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-all ${active === s.id ? 'bg-[#463a7a] text-white shadow-md' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`}>
                                    <Icon size={15} className={active === s.id ? 'text-white' : 'text-slate-400'} />
                                    <span className="text-sm font-semibold">{s.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Content panel */}
                    <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm p-7 space-y-6">

                        {/* ── Academy Profile ── */}
                        {active === 'academy' && (
                            <>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">Academy Profile</h2>
                                    <p className="text-sm text-slate-400 mt-0.5">Used in invoice PDFs, email signatures, and student portals.</p>
                                </div>
                                <div className="grid grid-cols-2 gap-5">
                                    <div className="col-span-2">
                                        <Field label="Academy Name" required>
                                            <input value={settings.academy_name || ''} onChange={e => set('academy_name', e.target.value)}
                                                className={inputCls} placeholder="e.g. Vama Academy" />
                                        </Field>
                                    </div>
                                    <div className="col-span-2">
                                        <Field label="Tagline" hint="Shown below the academy name in PDFs">
                                            <input value={settings.academy_tagline || ''} onChange={e => set('academy_tagline', e.target.value)}
                                                className={inputCls} placeholder="e.g. School of Music & Arts" />
                                        </Field>
                                    </div>
                                    <Field label="Contact Email" required>
                                        <div className="relative">
                                            <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input type="email" value={settings.academy_email || ''} onChange={e => set('academy_email', e.target.value)}
                                                className={`${inputCls} pl-9`} placeholder="admin@academy.com" />
                                        </div>
                                    </Field>
                                    <Field label="Contact Phone">
                                        <div className="relative">
                                            <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input value={settings.academy_phone || ''} onChange={e => set('academy_phone', e.target.value)}
                                                className={`${inputCls} pl-9`} placeholder="+91 98765 43210" />
                                        </div>
                                    </Field>
                                    <div className="col-span-2">
                                        <Field label="Address" hint="Printed on invoices">
                                            <textarea rows={2} value={settings.academy_address || ''} onChange={e => set('academy_address', e.target.value)}
                                                className={`${inputCls} resize-none`} placeholder="123, Music Lane, Bengaluru – 560001" />
                                        </Field>
                                    </div>
                                    <Field label="Website">
                                        <div className="relative">
                                            <Globe size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input value={settings.academy_website || ''} onChange={e => set('academy_website', e.target.value)}
                                                className={`${inputCls} pl-9`} placeholder="https://vama.academy" />
                                        </div>
                                    </Field>
                                    <Field label="GST Number" hint="Printed on all tax invoices">
                                        <div className="relative">
                                            <Hash size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input value={settings.academy_gst || ''} onChange={e => set('academy_gst', e.target.value.toUpperCase())}
                                                className={`${inputCls} pl-9 font-mono`} placeholder="29XXXXX1234X1ZX" />
                                        </div>
                                    </Field>
                                    <Field label="PAN Number">
                                        <div className="relative">
                                            <FileText size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input value={settings.academy_pan || ''} onChange={e => set('academy_pan', e.target.value.toUpperCase())}
                                                className={`${inputCls} pl-9 font-mono`} placeholder="ABCDE1234F" />
                                        </div>
                                    </Field>
                                </div>
                                <SaveBar saving={saving} saved={saved} onSave={save} />
                            </>
                        )}

                        {/* ── Branches ── */}
                        {active === 'branches' && (
                            <>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">Branches / Centres</h2>
                                    <p className="text-sm text-slate-400 mt-0.5">Centre names used when assigning students and generating reports.</p>
                                </div>
                                <div className="space-y-2">
                                    {branches.map((b, i) => (
                                        <div key={i} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
                                            <MapPin size={14} className="text-[#463a7a] flex-shrink-0" />
                                            <input value={b} onChange={e => {
                                                const arr = [...branches]; arr[i] = e.target.value; setBranches(arr);
                                            }} className="flex-1 bg-transparent text-sm font-semibold text-slate-800 outline-none" />
                                            <button onClick={() => setBranches(branches.filter((_, j) => j !== i))}
                                                className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    <button onClick={() => setBranches([...branches, ''])}
                                        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-sm font-semibold text-slate-400 hover:border-[#463a7a]/30 hover:text-[#463a7a] transition-all">
                                        <Plus size={14} /> Add Branch
                                    </button>
                                </div>
                                <SaveBar saving={saving} saved={saved} onSave={save} />
                            </>
                        )}

                        {/* ── Email ── */}
                        {active === 'email' && (
                            <>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">Email & SMTP</h2>
                                    <p className="text-sm text-slate-400 mt-0.5">Used for sending invoices and notifications to students.</p>
                                </div>
                                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-2">
                                    <AlertCircle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-xs text-amber-700">
                                        <p className="font-bold mb-0.5">Gmail users</p>
                                        <p>Use an <strong>App Password</strong> (not your Gmail password). Enable 2FA first, then go to Google Account → Security → App Passwords.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-5">
                                    <Field label="SMTP Host" required>
                                        <input value={settings.smtp_host || ''} onChange={e => set('smtp_host', e.target.value)}
                                            className={`${inputCls} font-mono`} placeholder="smtp.gmail.com" />
                                    </Field>
                                    <Field label="SMTP Port" required>
                                        <input type="number" value={settings.smtp_port || ''} onChange={e => set('smtp_port', e.target.value)}
                                            className={`${inputCls} font-mono`} placeholder="587" />
                                    </Field>
                                    <div className="col-span-2">
                                        <Field label="SMTP Username (email)" required>
                                            <div className="relative">
                                                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input type="email" value={settings.smtp_user || ''} onChange={e => set('smtp_user', e.target.value)}
                                                    className={`${inputCls} pl-9`} placeholder="your@gmail.com" />
                                            </div>
                                        </Field>
                                    </div>
                                    <div className="col-span-2">
                                        <Field label="SMTP Password / App Password" required hint="Leave blank to keep existing password">
                                            <div className="relative">
                                                <input type={showSmtpPass ? 'text' : 'password'} value={settings.smtp_pass || ''}
                                                    onChange={e => set('smtp_pass', e.target.value)}
                                                    className={`${inputCls} font-mono pr-11`} placeholder="App password (16 chars for Gmail)" />
                                                <button type="button" onClick={() => setShowSmtpPass(v => !v)}
                                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                                    {showSmtpPass ? <EyeOff size={15} /> : <Eye size={15} />}
                                                </button>
                                            </div>
                                        </Field>
                                    </div>
                                    <div className="col-span-2">
                                        <Field label="Sender Display Name" hint="Appears as 'From' name in emails">
                                            <input value={settings.smtp_sender_name || ''} onChange={e => set('smtp_sender_name', e.target.value)}
                                                className={inputCls} placeholder="Vama Academy" />
                                        </Field>
                                    </div>
                                </div>

                                {/* Test email */}
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                                    <p className="text-sm font-bold text-slate-700 flex items-center gap-2"><Send size={13} /> Send Test Email</p>
                                    <div className="flex gap-3">
                                        <input type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)}
                                            placeholder="recipient@email.com"
                                            className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#463a7a]/10 focus:border-[#463a7a]/40" />
                                        <button onClick={sendTestEmail} disabled={testingEmail || !testEmail}
                                            className="px-5 py-2.5 bg-[#463a7a] text-white rounded-2xl text-sm font-bold hover:bg-[#342a5b] disabled:opacity-40 transition-all flex items-center gap-2">
                                            {testingEmail ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                            Send
                                        </button>
                                    </div>
                                    {testResult && (
                                        <div className={`flex items-center gap-2 text-xs font-semibold rounded-xl px-3 py-2 ${testResult.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                            {testResult.ok ? <Check size={12} /> : <AlertCircle size={12} />}
                                            {testResult.msg}
                                        </div>
                                    )}
                                </div>
                                <SaveBar saving={saving} saved={saved} onSave={save} />
                            </>
                        )}

                        {/* ── Payments & Tax ── */}
                        {active === 'payments' && (
                            <>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">Payments & Tax</h2>
                                    <p className="text-sm text-slate-400 mt-0.5">Default values used when creating invoices and packages.</p>
                                </div>
                                <div className="grid grid-cols-2 gap-5">
                                    <Field label="Default Tax %" hint="Pre-filled when creating packages & invoices">
                                        <div className="relative">
                                            <Percent size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input type="number" min="0" max="100" step="0.1"
                                                value={settings.default_tax_pct || ''} onChange={e => set('default_tax_pct', e.target.value)}
                                                className={`${inputCls} pl-9`} placeholder="18" />
                                        </div>
                                    </Field>
                                    <Field label="Currency Symbol">
                                        <input value={settings.currency_symbol || '₹'} onChange={e => set('currency_symbol', e.target.value)}
                                            className={`${inputCls} font-mono text-center text-lg`} maxLength={3} />
                                    </Field>
                                    <Field label="Invoice Number Prefix" hint="e.g. INV → INV-202506-0001">
                                        <input value={settings.invoice_prefix || 'INV'} onChange={e => set('invoice_prefix', e.target.value.toUpperCase())}
                                            className={`${inputCls} font-mono`} placeholder="INV" maxLength={8} />
                                    </Field>
                                    <Field label="Invoice Due Days" hint="Days after issue date when payment is due">
                                        <input type="number" min="1" max="365"
                                            value={settings.invoice_due_days || ''} onChange={e => set('invoice_due_days', e.target.value)}
                                            className={inputCls} placeholder="30" />
                                    </Field>
                                </div>
                                <SaveBar saving={saving} saved={saved} onSave={save} />
                            </>
                        )}

                        {/* ── Scheduling ── */}
                        {active === 'scheduling' && (
                            <>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">Scheduling</h2>
                                    <p className="text-sm text-slate-400 mt-0.5">Calendar display range and attendance rules.</p>
                                </div>
                                <div className="grid grid-cols-2 gap-5">
                                    <Field label="Calendar Start Hour" hint="Earliest visible hour in the calendar">
                                        <select value={settings.session_start_hour || '8'} onChange={e => set('session_start_hour', e.target.value)}
                                            className={`${inputCls} appearance-none cursor-pointer`}>
                                            {Array.from({ length: 13 }, (_, i) => i + 6).map(h => (
                                                <option key={h} value={h}>{h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h - 12}:00 PM`}</option>
                                            ))}
                                        </select>
                                    </Field>
                                    <Field label="Calendar End Hour" hint="Latest visible hour in the calendar">
                                        <select value={settings.session_end_hour || '21'} onChange={e => set('session_end_hour', e.target.value)}
                                            className={`${inputCls} appearance-none cursor-pointer`}>
                                            {Array.from({ length: 10 }, (_, i) => i + 17).map(h => (
                                                <option key={h} value={h}>{h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h - 12}:00 PM`}</option>
                                            ))}
                                        </select>
                                    </Field>
                                    <div className="col-span-2">
                                        <Field label="Attendance Feedback Rule" hint="Controls when teacher feedback is required">
                                            <div className="space-y-2">
                                                {[
                                                    { val: 'required_for_present', label: 'Required when marking Present', sub: 'Absent can be marked without feedback' },
                                                    { val: 'required_always',       label: 'Required for both Present & Absent' },
                                                    { val: 'optional',              label: 'Always optional' },
                                                ].map(opt => (
                                                    <label key={opt.val} className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${settings.attendance_feedback === opt.val ? 'border-[#463a7a] bg-violet-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}>
                                                        <input type="radio" name="att_feedback" value={opt.val}
                                                            checked={settings.attendance_feedback === opt.val}
                                                            onChange={() => set('attendance_feedback', opt.val)}
                                                            className="mt-0.5 accent-[#463a7a]" />
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-800">{opt.label}</p>
                                                            <p className="text-xs text-slate-500 mt-0.5">{opt.sub}</p>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </Field>
                                    </div>
                                </div>
                                <SaveBar saving={saving} saved={saved} onSave={save} />
                            </>
                        )}

                        {/* ── Appearance ── */}
                        {active === 'appearance' && (
                            <>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">Appearance</h2>
                                    <p className="text-sm text-slate-400 mt-0.5">Visual customisation for the admin panel.</p>
                                </div>
                                <Field label="Primary Brand Colour" hint="Used in sidebar, buttons, and accents throughout the app">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <input type="color" value={settings.primary_color || '#463a7a'}
                                                onChange={e => set('primary_color', e.target.value)}
                                                className="w-14 h-14 rounded-2xl border-0 cursor-pointer p-1 bg-transparent" />
                                        </div>
                                        <div className="flex-1">
                                            <input value={settings.primary_color || '#463a7a'} onChange={e => set('primary_color', e.target.value)}
                                                className={`${inputCls} font-mono uppercase`} placeholder="#463a7a" />
                                        </div>
                                        <div className="w-12 h-12 rounded-2xl shadow-inner border border-slate-200"
                                            style={{ background: settings.primary_color || '#463a7a' }} />
                                    </div>
                                </Field>
                                {/* Preview */}
                                <div className="bg-slate-50 rounded-2xl p-5 space-y-3 border border-slate-200">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Preview</p>
                                    <div className="flex items-center gap-3">
                                        <button className="px-4 py-2 text-white text-sm font-bold rounded-xl"
                                            style={{ background: settings.primary_color || '#463a7a' }}>Primary Button</button>
                                        <div className="px-3 py-1.5 rounded-xl text-xs font-bold border-2"
                                            style={{ borderColor: settings.primary_color || '#463a7a', color: settings.primary_color || '#463a7a' }}>Badge</div>
                                        <div className="w-3 h-3 rounded-full"
                                            style={{ background: settings.primary_color || '#463a7a' }} />
                                    </div>
                                </div>
                                <SaveBar saving={saving} saved={saved} onSave={save} />
                            </>
                        )}

                        {/* ── Credentials ── */}
                        {active === 'credentials' && (
                            <>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">Login Credentials</h2>
                                    <p className="text-sm text-slate-400 mt-0.5">Manage passwords for student and staff portal logins.</p>
                                </div>

                                {/* Bulk reset */}
                                <div className="bg-violet-50 border border-violet-200 rounded-2xl p-5 space-y-4">
                                    <div className="flex items-start gap-3">
                                        <Shield size={16} className="text-[#463a7a] mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">Set Default Passwords</p>
                                            <p className="text-xs text-slate-500 mt-0.5">Apply one password to all students & staff at once. Students can change it after logging in.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <input value={bulkPassword} onChange={e => setBulkPassword(e.target.value)}
                                            className="flex-1 bg-white border border-violet-200 rounded-2xl px-4 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-[#463a7a]/10 focus:border-[#463a7a]/40"
                                            placeholder="vama@1234" />
                                        <button onClick={applyBulkPasswords} disabled={bulkSetting || !bulkPassword}
                                            className="px-5 py-2.5 bg-[#463a7a] text-white rounded-2xl text-sm font-bold hover:bg-[#342a5b] disabled:opacity-50 transition-all flex items-center gap-2">
                                            {bulkSetting ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                                            Apply to All
                                        </button>
                                    </div>
                                    {bulkResult && (
                                        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                                            <Check size={12} /> Set for {bulkResult.updated_students} students and {bulkResult.updated_staff} staff
                                        </div>
                                    )}
                                </div>

                                {/* Load & show credentials */}
                                {!credentials ? (
                                    <button onClick={loadCredentials} disabled={credLoading}
                                        className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-sm font-semibold text-slate-400 hover:border-[#463a7a]/30 hover:text-[#463a7a] transition-all flex items-center justify-center gap-2">
                                        {credLoading ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
                                        Show All Login Credentials
                                    </button>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Students */}
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Students — Login at /student-login</p>
                                            <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="border-b border-slate-200 bg-slate-100">
                                                            <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Name</th>
                                                            <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Email (username)</th>
                                                            <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Password set?</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {credentials.students.map(s => (
                                                            <tr key={s.id} className="hover:bg-white transition-colors">
                                                                <td className="px-4 py-2.5 font-semibold text-slate-800">{s.name}</td>
                                                                <td className="px-4 py-2.5 font-mono text-slate-600 text-xs">{s.email}</td>
                                                                <td className="px-4 py-2.5">
                                                                    {s.has_password
                                                                        ? <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><Check size={11} /> Yes</span>
                                                                        : <span className="text-xs font-bold text-amber-600 flex items-center gap-1"><AlertCircle size={11} /> No password — any key works</span>
                                                                    }
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Staff */}
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Staff / Teachers — Login at /teacher-login</p>
                                            <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="border-b border-slate-200 bg-slate-100">
                                                            <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Name</th>
                                                            <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Email (username)</th>
                                                            <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Role</th>
                                                            <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Password set?</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {credentials.staff.map(t => (
                                                            <tr key={t.id} className="hover:bg-white transition-colors">
                                                                <td className="px-4 py-2.5 font-semibold text-slate-800">{t.name}</td>
                                                                <td className="px-4 py-2.5 font-mono text-slate-600 text-xs">{t.email}</td>
                                                                <td className="px-4 py-2.5"><span className="text-xs font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-lg">{t.role}</span></td>
                                                                <td className="px-4 py-2.5">
                                                                    {t.has_password
                                                                        ? <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><Check size={11} /> Yes</span>
                                                                        : <span className="text-xs font-bold text-amber-600 flex items-center gap-1"><AlertCircle size={11} /> No password — any key works</span>
                                                                    }
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-2">
                                            <AlertCircle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                                            <p className="text-xs text-amber-700">
                                                <strong>Security note:</strong> Passwords are stored in plaintext for now. Use "Apply to All" above to set proper passwords before sharing login details with students.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* ── System & API ── */}
                        {active === 'system' && (
                            <>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">System & API</h2>
                                    <p className="text-sm text-slate-400 mt-0.5">Backend connection and system information.</p>
                                </div>
                                <div className="space-y-5">
                                    <Field label="Backend API URL" hint="Set via VITE_API_URL environment variable. Restart the dev server to apply changes.">
                                        <div className="relative">
                                            <Database size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input readOnly value={import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}
                                                className={`${inputCls} pl-9 font-mono bg-slate-100 cursor-default text-slate-600`} />
                                        </div>
                                    </Field>

                                    {/* Status checks */}
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Connection Status</p>
                                        <SystemStatusRow label="Backend API" checkUrl="/admin/settings" />
                                        <SystemStatusRow label="Database" checkUrl="/admin/grades" />
                                    </div>

                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-500 space-y-1.5 font-mono">
                                        <p><span className="font-bold text-slate-700">Platform:</span> Vama Optimus v1.0</p>
                                        <p><span className="font-bold text-slate-700">Frontend:</span> React 18 + Vite 4</p>
                                        <p><span className="font-bold text-slate-700">Backend:</span> FastAPI + PostgreSQL (Neon)</p>
                                        <p><span className="font-bold text-slate-700">Deployment:</span> Vercel (frontend) + Uvicorn (backend)</p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function SystemStatusRow({ label, checkUrl }) {
    const [status, setStatus] = useState('checking');
    useEffect(() => {
        api.get(checkUrl)
            .then(() => setStatus('ok'))
            .catch(() => setStatus('error'));
    }, [checkUrl]);
    return (
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
            <span className="text-sm font-semibold text-slate-700">{label}</span>
            <span className={`flex items-center gap-1.5 text-xs font-bold ${status === 'ok' ? 'text-emerald-600' : status === 'error' ? 'text-red-500' : 'text-amber-500'}`}>
                <span className={`w-2 h-2 rounded-full ${status === 'ok' ? 'bg-emerald-500' : status === 'error' ? 'bg-red-500' : 'bg-amber-400 animate-pulse'}`} />
                {status === 'ok' ? 'Connected' : status === 'error' ? 'Unreachable' : 'Checking…'}
            </span>
        </div>
    );
}
