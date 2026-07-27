import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAdmin } from '../../context/AdminContext';
import SuperAdminAnalytics from './SuperAdminAnalytics';
import AuditLogViewer from './AuditLogViewer';
import {
    Building2, Mail, CreditCard, Palette, Database, Shield,
    Save, Eye, EyeOff, Send, Check, AlertCircle, Loader2,
    Plus, X, MapPin, Clock, ChevronRight, RefreshCw,
    Globe, Phone, FileText, Hash, Percent, Users, TrendingUp, Activity,
    Lock, AtSign, ShieldCheck, Zap, ExternalLink, Copy, CheckCircle2, Server,
} from 'lucide-react';

const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10 focus:border-[#463a7a]/40 transition-all placeholder:text-slate-300";

// ─── Shared helpers ───────────────────────────────────────────────────────────

function Field({ label, hint, required, children }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                {label}{required && <span className="text-red-400 ml-1 normal-case font-normal">*</span>}
            </label>
            {children}
            {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
        </div>
    );
}

function SaveBar({ saving, saved, onSave, label = 'Save Changes' }) {
    return (
        <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-slate-100">
            {saved && <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold"><Check size={13} /> Saved</span>}
            <button onClick={onSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#463a7a] hover:bg-[#342a5b] text-white rounded-2xl text-sm font-bold transition-all disabled:opacity-50 shadow-sm">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {label}
            </button>
        </div>
    );
}

// ─── Per-center SMTP ──────────────────────────────────────────────────────────

function CenterSmtp({ centerId }) {
    const [form, setForm] = useState({ host: '', port: '587', user: '', pass: '', sender_name: '', encryption: 'tls' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);

    useEffect(() => {
        setLoading(true);
        const params = centerId ? { center_id: centerId } : {};
        api.get('/admin/smtp-settings', { params })
            .then(r => setForm(f => ({ ...f, ...r.data })))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [centerId]);

    const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

    const save = async () => {
        setSaving(true); setSaved(false); setError('');
        try {
            const params = centerId ? { center_id: centerId } : {};
            await api.put('/admin/smtp-settings', form, { params });
            setSaved(true); setTimeout(() => setSaved(false), 2500);
        } catch (e) { setError(e.response?.data?.detail || 'Failed to save.'); }
        finally { setSaving(false); }
    };

    const sendTest = async () => {
        if (!testEmail.trim()) return;
        setTesting(true); setTestResult(null);
        try {
            await api.post('/admin/smtp-settings/test', { to_email: testEmail.trim(), center_id: centerId || null });
            setTestResult({ ok: true, msg: `Test email sent to ${testEmail}` });
        } catch (e) {
            setTestResult({ ok: false, msg: e.response?.data?.detail || 'Failed to send test email.' });
        } finally { setTesting(false); }
    };

    if (loading) return <div className="flex items-center justify-center py-10"><Loader2 className="animate-spin text-[#463a7a]" size={24} /></div>;

    return (
        <div className="space-y-5">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-2">
                <AlertCircle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-700">
                    <p className="font-bold mb-0.5">Gmail users — use an App Password</p>
                    <p>Google Account → Security → 2-Step Verification → App Passwords → create one for "Mail"</p>
                </div>
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-2xl text-sm font-bold flex items-center gap-2"><AlertCircle size={14} />{error}</div>}
            <div className="grid grid-cols-2 gap-5">
                <Field label="SMTP Host" required>
                    <input className={`${inputCls} font-mono`} value={form.host} onChange={set('host')} placeholder="smtp.gmail.com" />
                </Field>
                <Field label="Port">
                    <input className={`${inputCls} font-mono`} value={form.port} onChange={set('port')} placeholder="587" />
                </Field>
                <div className="col-span-2">
                    <Field label="Encryption">
                        <div className="flex gap-2">
                            {[['tls','STARTTLS (587)'],['ssl','SSL/TLS (465)'],['none','None']].map(([v,l]) => (
                                <button key={v} onClick={() => setForm(f => ({ ...f, encryption: v }))}
                                    className={`flex-1 py-2.5 rounded-xl border text-xs font-black transition-all ${form.encryption === v ? 'bg-[#463a7a] border-[#463a7a] text-white' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                                    {l}
                                </button>
                            ))}
                        </div>
                    </Field>
                </div>
                <div className="col-span-2">
                    <Field label="Username / Email" required>
                        <div className="relative"><AtSign size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="email" className={`${inputCls} pl-9`} value={form.user} onChange={set('user')} placeholder="yourname@gmail.com" autoComplete="off" /></div>
                    </Field>
                </div>
                <div className="col-span-2">
                    <Field label="Password / App Password" hint="Leave blank to keep existing password">
                        <div className="relative">
                            <input type={showPass ? 'text' : 'password'} className={`${inputCls} font-mono pr-12`} value={form.pass} onChange={set('pass')} placeholder="••••••••" autoComplete="new-password" />
                            <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                    </Field>
                </div>
                <div className="col-span-2">
                    <Field label="Sender Display Name" hint="Appears as 'From' name in student inboxes">
                        <input className={inputCls} value={form.sender_name} onChange={set('sender_name')} placeholder="Vama Academy" />
                    </Field>
                </div>
            </div>
            <SaveBar saving={saving} saved={saved} onSave={save} />
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <p className="text-sm font-bold text-slate-700 flex items-center gap-2"><Send size={13} /> Send Test Email</p>
                <div className="flex gap-3">
                    <input type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendTest()} placeholder="recipient@email.com"
                        className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#463a7a]/10 focus:border-[#463a7a]/40" />
                    <button onClick={sendTest} disabled={testing || !testEmail.trim()}
                        className="px-5 py-2.5 bg-[#463a7a] text-white rounded-2xl text-sm font-bold hover:bg-[#342a5b] disabled:opacity-40 transition-all flex items-center gap-2 flex-shrink-0">
                        {testing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Send
                    </button>
                </div>
                {testResult && (
                    <div className={`flex items-center gap-2 text-xs font-semibold rounded-xl px-3 py-2 border ${testResult.ok ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                        {testResult.ok ? <Check size={12} /> : <AlertCircle size={12} />} {testResult.msg}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Per-center Razorpay ──────────────────────────────────────────────────────

function CenterPayments({ centerId }) {
    const [rzp, setRzp] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showSecret, setShowSecret] = useState(false);

    useEffect(() => {
        const params = centerId ? { center_id: centerId } : {};
        api.get('/admin/razorpay-settings', { params }).then(r => setRzp(r.data || {})).catch(() => setRzp({}));
    }, [centerId]);

    const save = async () => {
        if (!rzp) return;
        setSaving(true);
        try {
            const res = await api.put('/admin/razorpay-settings', { ...rzp, center_id: centerId || null });
            setRzp(res.data);
            setSaved(true); setTimeout(() => setSaved(false), 2500);
        } catch { console.error('Razorpay save failed'); }
        finally { setSaving(false); }
    };

    if (!rzp) return <div className="flex items-center justify-center py-10"><Loader2 className="animate-spin text-[#463a7a]" size={24} /></div>;

    return (
        <div className="space-y-5">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 flex items-start gap-2">
                <AlertCircle size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700">Get your keys from the <a href="https://dashboard.razorpay.com" target="_blank" rel="noreferrer" className="font-bold underline">Razorpay Dashboard</a>. Use live keys for production.</p>
            </div>
            <Field label="Key ID (rzp_live_...)">
                <input value={rzp.key_id || ''} onChange={e => setRzp({ ...rzp, key_id: e.target.value })} placeholder="rzp_live_xxxxxxxxxxxx" className={`${inputCls} font-mono text-xs`} />
            </Field>
            <Field label="Key Secret">
                <div className="relative">
                    <input type={showSecret ? 'text' : 'password'} value={rzp.key_secret || ''} onChange={e => setRzp({ ...rzp, key_secret: e.target.value })} placeholder="••••••••••••••••••••" className={`${inputCls} font-mono text-xs pr-12`} />
                    <button type="button" onClick={() => setShowSecret(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showSecret ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                </div>
            </Field>
            <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <input type="checkbox" checked={rzp.enabled === 'true' || rzp.enabled === true}
                    onChange={e => setRzp({ ...rzp, enabled: String(e.target.checked) })}
                    className="w-4 h-4 accent-[#463a7a] flex-shrink-0" />
                <div>
                    <p className="text-sm font-bold text-slate-800">Enable online payments</p>
                    <p className="text-xs text-slate-400">Students can pay fees online via Razorpay</p>
                </div>
            </label>
            <SaveBar saving={saving} saved={saved} onSave={save} />
        </div>
    );
}

// ─── Per-center Profile ───────────────────────────────────────────────────────

function CenterProfile({ center, centerId, settings, onSettingsChange, onSave, saving, saved }) {
    return (
        <div className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                    <Field label="Center Name">
                        <input className={`${inputCls} bg-slate-100 cursor-default`} value={center?.name || ''} readOnly />
                    </Field>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">To rename, use Centers &amp; Access (super admin)</p>
                </div>
                <div className="col-span-2">
                    <Field label="Address">
                        <input className={`${inputCls} bg-slate-100 cursor-default`} value={center?.address || ''} readOnly />
                    </Field>
                </div>
                <Field label="Center Phone">
                    <input className={inputCls} value={settings[`center_${centerId}_profile.phone`] || ''}
                        onChange={e => onSettingsChange(`center_${centerId}_profile.phone`, e.target.value)}
                        placeholder="+91 98765 43210" />
                </Field>
                <Field label="Center Email">
                    <input type="email" className={inputCls} value={settings[`center_${centerId}_profile.email`] || ''}
                        onChange={e => onSettingsChange(`center_${centerId}_profile.email`, e.target.value)}
                        placeholder="center@vama.academy" />
                </Field>
                <div className="col-span-2">
                    <Field label="Brand Color" hint="Used in your enrollment form and student portal">
                        <div className="flex items-center gap-4">
                            <input type="color" value={settings[`center_${centerId}_profile.color`] || '#463a7a'}
                                onChange={e => onSettingsChange(`center_${centerId}_profile.color`, e.target.value)}
                                className="w-14 h-14 rounded-2xl border-0 cursor-pointer p-1 bg-transparent" />
                            <input value={settings[`center_${centerId}_profile.color`] || '#463a7a'}
                                onChange={e => onSettingsChange(`center_${centerId}_profile.color`, e.target.value)}
                                className={`${inputCls} font-mono uppercase flex-1`} placeholder="#463a7a" />
                            <div className="w-12 h-12 rounded-2xl shadow-inner border border-slate-200 flex-shrink-0"
                                style={{ background: settings[`center_${centerId}_profile.color`] || '#463a7a' }} />
                        </div>
                    </Field>
                </div>
            </div>
            <SaveBar saving={saving} saved={saved} onSave={onSave} />
        </div>
    );
}

// ─── Per-center Enrollment ────────────────────────────────────────────────────

function CenterEnrollment({ center }) {
    const [copied, setCopied] = useState(false);
    const link = center ? `${window.location.origin}/apply?center=${encodeURIComponent(center.name)}` : '';

    const copy = () => {
        navigator.clipboard.writeText(link).catch(() => {});
        setCopied(true); setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-5">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Your Enrollment Link</p>
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-3">
                    <span className="flex-1 text-sm font-mono text-slate-600 truncate">{link}</span>
                    <button onClick={copy} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-black text-slate-600 hover:bg-[#463a7a] hover:text-white transition-all flex-shrink-0">
                        {copied ? <><CheckCircle2 size={12} className="text-emerald-400" /> Copied!</> : <><Copy size={12} /> Copy</>}
                    </button>
                    <a href={link} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-[#463a7a] text-white rounded-lg text-xs font-black hover:bg-[#342a5b] transition-all flex-shrink-0">
                        <ExternalLink size={12} /> Open
                    </a>
                </div>
                <p className="text-[11px] text-slate-400">Share this link with students. The center is pre-selected and the form uses your center's field configuration.</p>
            </div>
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3">
                <Zap size={15} className="text-[#463a7a] mt-0.5 flex-shrink-0" />
                <div>
                    <p className="text-sm font-bold text-[#463a7a]">Customize Form Fields</p>
                    <p className="text-xs text-indigo-600 mt-0.5">Add, remove, and reorder form fields in the Form Builder.</p>
                    <a href="/admin/enrollments" className="inline-flex items-center gap-1 mt-2 text-xs font-black text-[#463a7a] hover:underline">
                        Open Form Builder <ExternalLink size={11} />
                    </a>
                </div>
            </div>
        </div>
    );
}

// ─── Per-center Scheduling ────────────────────────────────────────────────────

function CenterScheduling({ centerId, settings, onSettingsChange, onSave, saving, saved }) {
    const prefix = `center_${centerId}_scheduling.`;
    const get = k => settings[`${prefix}${k}`];
    const upd = k => v => onSettingsChange(`${prefix}${k}`, v);

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
                <Field label="Calendar Start Hour">
                    <select value={get('start_hour') || '8'} onChange={e => upd('start_hour')(e.target.value)} className={`${inputCls} appearance-none cursor-pointer`}>
                        {Array.from({length:13},(_,i)=>i+6).map(h=>(
                            <option key={h} value={h}>{h<12?`${h}:00 AM`:h===12?'12:00 PM':`${h-12}:00 PM`}</option>
                        ))}
                    </select>
                </Field>
                <Field label="Calendar End Hour">
                    <select value={get('end_hour') || '21'} onChange={e => upd('end_hour')(e.target.value)} className={`${inputCls} appearance-none cursor-pointer`}>
                        {Array.from({length:10},(_,i)=>i+17).map(h=>(
                            <option key={h} value={h}>{h<12?`${h}:00 AM`:h===12?'12:00 PM':`${h-12}:00 PM`}</option>
                        ))}
                    </select>
                </Field>
                <div className="col-span-2">
                    <Field label="Attendance Feedback Rule">
                        <div className="space-y-2">
                            {[
                                { val:'required_for_present', label:'Required when marking Present', sub:'Absent can be marked without feedback' },
                                { val:'required_always', label:'Required for both Present & Absent' },
                                { val:'optional', label:'Always optional' },
                            ].map(opt => (
                                <label key={opt.val} className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${get('attendance_feedback')===opt.val?'border-[#463a7a] bg-violet-50':'border-slate-200 bg-slate-50 hover:border-slate-300'}`}>
                                    <input type="radio" name={`att_feedback_${centerId}`} value={opt.val}
                                        checked={get('attendance_feedback')===opt.val}
                                        onChange={() => upd('attendance_feedback')(opt.val)}
                                        className="mt-0.5 accent-[#463a7a]" />
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">{opt.label}</p>
                                        {opt.sub && <p className="text-xs text-slate-500 mt-0.5">{opt.sub}</p>}
                                    </div>
                                </label>
                            ))}
                        </div>
                    </Field>
                </div>
            </div>
            <SaveBar saving={saving} saved={saved} onSave={onSave} />
        </div>
    );
}

// ─── Super-admin center accordion ─────────────────────────────────────────────

const SA_CENTER_TABS = [
    { id: 'profile',    label: 'Profile' },
    { id: 'smtp',       label: 'Email / SMTP' },
    { id: 'payments',   label: 'Razorpay' },
    { id: 'enrollment', label: 'Enrollment' },
];

function CenterCard({ center }) {
    const [open, setOpen] = useState(false);
    const [ctab, setCtab] = useState('profile');
    const [settings, setSettings] = useState({});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (open) {
            api.get('/admin/settings').then(r => setSettings(r.data || {})).catch(() => {});
        }
    }, [open]);

    const updateSetting = (key, val) => setSettings(s => ({ ...s, [key]: val }));

    const saveSettings = async () => {
        setSaving(true); setSaved(false);
        try {
            await api.put('/admin/settings', settings);
            setSaved(true); setTimeout(() => setSaved(false), 2500);
        } catch { console.error('save failed'); }
        finally { setSaving(false); }
    };

    return (
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <button onClick={() => setOpen(v => !v)}
                className="w-full flex items-center gap-4 px-5 py-4 bg-white hover:bg-slate-50 transition-all text-left">
                <div className="w-9 h-9 rounded-xl bg-[#463a7a]/10 flex items-center justify-center flex-shrink-0">
                    <MapPin size={15} className="text-[#463a7a]" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-800 truncate">{center.name}</p>
                    {center.address && <p className="text-[11px] text-slate-400 font-semibold truncate">{center.address}</p>}
                </div>
                <ChevronRight size={16} className={`text-slate-400 transition-transform flex-shrink-0 ${open ? 'rotate-90' : ''}`} />
            </button>
            {open && (
                <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-5 space-y-4">
                    <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit">
                        {SA_CENTER_TABS.map(t => (
                            <button key={t.id} onClick={() => setCtab(t.id)}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all ${ctab===t.id?'bg-[#463a7a] text-white shadow-sm':'text-slate-500 hover:text-slate-700'}`}>
                                {t.label}
                            </button>
                        ))}
                    </div>
                    {ctab === 'profile' && (
                        <CenterProfile center={center} centerId={center.id} settings={settings}
                            onSettingsChange={updateSetting} onSave={saveSettings} saving={saving} saved={saved} />
                    )}
                    {ctab === 'smtp' && <CenterSmtp centerId={center.id} />}
                    {ctab === 'payments' && <CenterPayments centerId={center.id} />}
                    {ctab === 'enrollment' && <CenterEnrollment center={center} />}
                </div>
            )}
        </div>
    );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────

export default function SettingsPage() {
    const { isSuperAdmin, isCenterAdmin, centerId: myCenterId } = useAdmin();

    const SA_SECTIONS = [
        { id: 'academy',     label: 'Academy Profile',   icon: Building2 },
        { id: 'center',      label: 'Center Settings',   icon: MapPin },
        { id: 'centers',     label: 'Centers & Access',  icon: Users },
        { id: 'email',       label: 'Global SMTP',       icon: Mail },
        { id: 'payments',    label: 'Payments & Tax',    icon: CreditCard },
        { id: 'scheduling',  label: 'Scheduling',        icon: Clock },
        { id: 'appearance',  label: 'Appearance',        icon: Palette },
        { id: 'system',      label: 'System & API',      icon: Database },
        { id: 'credentials', label: 'Credentials',       icon: Shield },
        { id: 'audit-logs',  label: 'Activity Log',      icon: Activity },
        { id: 'analytics',   label: 'Global Analytics',  icon: TrendingUp },
    ];

    const CA_SECTIONS = [
        { id: 'ca-profile',    label: 'Center Profile',  icon: Building2 },
        { id: 'ca-smtp',       label: 'Email / SMTP',    icon: Mail },
        { id: 'ca-payments',   label: 'Payments',        icon: CreditCard },
        { id: 'ca-enrollment', label: 'Enrollment Form', icon: Globe },
        { id: 'ca-scheduling', label: 'Scheduling',      icon: Clock },
        { id: 'credentials',   label: 'Credentials',     icon: Shield },
        { id: 'audit-logs',    label: 'Activity Log',    icon: Activity },
    ];

    const SECTIONS = isSuperAdmin ? SA_SECTIONS : CA_SECTIONS;

    const [active, setActive] = useState(SECTIONS[0].id);
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    // for super admin sections
    const [centers, setCenters] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [showSmtpPass, setShowSmtpPass] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [testingEmail, setTestingEmail] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [credentials, setCredentials] = useState(null);
    const [credLoading, setCredLoading] = useState(false);
    const [bulkPassword, setBulkPassword] = useState('vama@1234');
    const [bulkSetting, setBulkSetting] = useState(false);
    const [bulkResult, setBulkResult] = useState(null);
    const [showOnboardWizard, setShowOnboardWizard] = useState(false);
    const [onboardStep, setOnboardStep] = useState(1);
    const [onboardData, setOnboardData] = useState({ center_name:'', center_address:'', center_phone:'', center_email:'', admin_name:'', admin_email:'', admin_phone:'' });
    const [onboarding, setOnboarding] = useState(false);
    const [onboardResult, setOnboardResult] = useState(null);

    // center admin's own center object (loaded lazily when needed)
    const [myCenter, setMyCenter] = useState(null);

    useEffect(() => {
        api.get('/admin/settings')
            .then(r => setSettings(r.data || {}))
            .catch(() => setError('Could not load settings'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (isSuperAdmin && (active === 'centers' || active === 'center')) {
            api.get('/centers').then(r => setCenters(r.data || [])).catch(() => {});
            api.get('/staff').then(r => setStaffList(r.data || [])).catch(() => {});
        }
        if (isCenterAdmin && !myCenter && myCenterId) {
            api.get('/centers').then(r => {
                const c = (r.data || []).find(x => x.id === myCenterId) || (r.data || [])[0];
                setMyCenter(c || null);
            }).catch(() => {});
        }
    }, [active, isSuperAdmin, isCenterAdmin, myCenterId]);

    const set = (key, val) => { setSaved(false); setSettings(prev => ({ ...prev, [key]: val })); };

    const save = async () => {
        setSaving(true); setError(''); setSaved(false);
        try {
            const updated = await api.put('/admin/settings', settings);
            setSettings(updated.data); setSaved(true);
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
            setBulkResult(r.data); await loadCredentials();
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

    const updateStaffAccess = async (staffId, access_role, center_id) => {
        try { await api.put(`/admin/staff/${staffId}/access`, { access_role, center_id }); api.get('/staff').then(r => setStaffList(r.data || [])); }
        catch { setError('Failed to update access'); }
    };

    const handleOnboardStep = (step) => {
        if (step === 1 && !onboardData.center_name.trim()) { setError('Center name is required'); return; }
        if (step === 2 && (!onboardData.admin_name.trim() || !onboardData.admin_email.trim() || !onboardData.admin_phone.trim())) {
            setError('Admin name, email, and phone are required'); return;
        }
        setError(''); setOnboardStep(step + 1);
    };

    const submitOnboard = async () => {
        setOnboarding(true); setError('');
        try {
            const res = await api.post('/centers/onboard', onboardData);
            setOnboardResult(res.data);
            setOnboardData({ center_name:'', center_address:'', center_phone:'', center_email:'', admin_name:'', admin_email:'', admin_phone:'' });
            setOnboardStep(1);
            api.get('/centers').then(r => setCenters(r.data || []));
            setTimeout(() => setShowOnboardWizard(false), 3000);
        } catch (err) { setError(err.response?.data?.detail || 'Failed to onboard center'); }
        finally { setOnboarding(false); }
    };

    const branches = (() => { try { return JSON.parse(settings.branches || '[]'); } catch { return []; } })();
    const setBranches = arr => set('branches', JSON.stringify(arr));

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
            <Loader2 size={24} className="animate-spin text-[#463a7a]" />
        </div>
    );

    const sectionTitle = SECTIONS.find(s => s.id === active)?.label || '';

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            <div className="bg-gradient-to-br from-[#463a7a] to-[#2d2550] px-6 pt-8 pb-8 lg:px-12">
                <h1 className="text-4xl font-bold text-white tracking-tight mb-1">Settings</h1>
                <p className="text-white/50 text-sm">
                    {isSuperAdmin ? 'Academy-wide configuration' : 'Configure your center'}
                </p>
            </div>

            <div className="max-w-[1100px] mx-auto px-4 lg:px-8 py-8 pb-24">
                {error && (
                    <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 text-sm text-red-600">
                        <AlertCircle size={14} /> {error}
                    </div>
                )}

                <div className="flex gap-6">
                    {/* Sidebar */}
                    <div className="w-52 flex-shrink-0 space-y-1">
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

                        {/* ── CENTER ADMIN SECTIONS ── */}

                        {active === 'ca-profile' && (
                            <>
                                <div><h2 className="text-lg font-bold text-slate-900">Center Profile</h2>
                                <p className="text-sm text-slate-400 mt-0.5">Contact details and branding for your center.</p></div>
                                {myCenter
                                    ? <CenterProfile center={myCenter} centerId={myCenterId} settings={settings}
                                        onSettingsChange={(k,v) => set(k,v)} onSave={save} saving={saving} saved={saved} />
                                    : <div className="flex items-center justify-center py-10"><Loader2 className="animate-spin text-[#463a7a]" size={20} /></div>
                                }
                            </>
                        )}

                        {active === 'ca-smtp' && (
                            <>
                                <div><h2 className="text-lg font-bold text-slate-900">Email / SMTP</h2>
                                <p className="text-sm text-slate-400 mt-0.5">Outgoing email for your center — login credentials, receipts, and notifications sent to your students.</p></div>
                                <CenterSmtp centerId={myCenterId} />
                            </>
                        )}

                        {active === 'ca-payments' && (
                            <>
                                <div><h2 className="text-lg font-bold text-slate-900">Payments</h2>
                                <p className="text-sm text-slate-400 mt-0.5">Razorpay keys for your center. Students can pay fees online when enabled.</p></div>
                                <CenterPayments centerId={myCenterId} />
                            </>
                        )}

                        {active === 'ca-enrollment' && (
                            <>
                                <div><h2 className="text-lg font-bold text-slate-900">Enrollment Form</h2>
                                <p className="text-sm text-slate-400 mt-0.5">Your center's enrollment link and form field configuration.</p></div>
                                <CenterEnrollment center={myCenter} />
                            </>
                        )}

                        {active === 'ca-scheduling' && (
                            <>
                                <div><h2 className="text-lg font-bold text-slate-900">Scheduling</h2>
                                <p className="text-sm text-slate-400 mt-0.5">Calendar display range and attendance rules for your center.</p></div>
                                <CenterScheduling centerId={myCenterId} settings={settings}
                                    onSettingsChange={(k,v) => set(k,v)} onSave={save} saving={saving} saved={saved} />
                            </>
                        )}

                        {/* ── SUPER ADMIN SECTIONS ── */}

                        {active === 'academy' && (
                            <>
                                <div><h2 className="text-lg font-bold text-slate-900">Academy Profile</h2>
                                <p className="text-sm text-slate-400 mt-0.5">Used in invoice PDFs, email signatures, and student portals.</p></div>
                                <div className="grid grid-cols-2 gap-5">
                                    <div className="col-span-2"><Field label="Academy Name" required>
                                        <input value={settings.academy_name||''} onChange={e=>set('academy_name',e.target.value)} className={inputCls} placeholder="Vama Academy" />
                                    </Field></div>
                                    <div className="col-span-2"><Field label="Tagline">
                                        <input value={settings.academy_tagline||''} onChange={e=>set('academy_tagline',e.target.value)} className={inputCls} placeholder="School of Music & Arts" />
                                    </Field></div>
                                    <Field label="Contact Email">
                                        <div className="relative"><Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="email" value={settings.academy_email||''} onChange={e=>set('academy_email',e.target.value)} className={`${inputCls} pl-9`} placeholder="admin@vama.academy" /></div>
                                    </Field>
                                    <Field label="Contact Phone">
                                        <div className="relative"><Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input value={settings.academy_phone||''} onChange={e=>set('academy_phone',e.target.value)} className={`${inputCls} pl-9`} placeholder="+91 98765 43210" /></div>
                                    </Field>
                                    <div className="col-span-2"><Field label="Address">
                                        <textarea rows={2} value={settings.academy_address||''} onChange={e=>set('academy_address',e.target.value)} className={`${inputCls} resize-none`} placeholder="123, Music Lane, Bengaluru" />
                                    </Field></div>
                                    <Field label="Website">
                                        <div className="relative"><Globe size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input value={settings.academy_website||''} onChange={e=>set('academy_website',e.target.value)} className={`${inputCls} pl-9`} placeholder="https://vama.academy" /></div>
                                    </Field>
                                    <Field label="GST Number">
                                        <div className="relative"><Hash size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input value={settings.academy_gst||''} onChange={e=>set('academy_gst',e.target.value.toUpperCase())} className={`${inputCls} pl-9 font-mono`} placeholder="29XXXXX1234X1ZX" /></div>
                                    </Field>
                                    <Field label="PAN Number">
                                        <div className="relative"><FileText size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input value={settings.academy_pan||''} onChange={e=>set('academy_pan',e.target.value.toUpperCase())} className={`${inputCls} pl-9 font-mono`} placeholder="ABCDE1234F" /></div>
                                    </Field>
                                </div>
                                <SaveBar saving={saving} saved={saved} onSave={save} />
                            </>
                        )}

                        {active === 'center' && (
                            <>
                                <div><h2 className="text-lg font-bold text-slate-900">Center Settings</h2>
                                <p className="text-sm text-slate-400 mt-0.5">Configure SMTP, payments, branding, and enrollment for each center independently.</p></div>
                                {centers.length === 0
                                    ? <div className="flex items-center justify-center py-10"><Loader2 className="animate-spin text-[#463a7a]" size={20} /></div>
                                    : <div className="space-y-3">{centers.map(c => <CenterCard key={c.id} center={c} />)}</div>
                                }
                            </>
                        )}

                        {active === 'centers' && (
                            <>
                                <div><h2 className="text-lg font-bold text-slate-900">Centers & Access Control</h2>
                                <p className="text-sm text-slate-400 mt-0.5">Each center has its own admin who only sees their center's data.</p></div>
                                <div className="space-y-2">
                                    {centers.map(c => (
                                        <div key={c.id} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
                                            <Building2 size={15} className="text-[#463a7a] flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-800 truncate">{c.name}</p>
                                                {c.address && <p className="text-xs text-slate-400 truncate">{c.address}</p>}
                                            </div>
                                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Active</span>
                                        </div>
                                    ))}
                                    <button onClick={() => setShowOnboardWizard(true)}
                                        className="mt-3 px-4 py-2.5 bg-[#463a7a] text-white rounded-2xl text-sm font-bold hover:bg-[#342a5b] transition-all flex items-center gap-2 w-full justify-center">
                                        <Plus size={14} /> Create New Center & Admin
                                    </button>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Staff Access & Center Assignment</p>
                                    <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead><tr className="border-b border-slate-200 bg-slate-100">
                                                <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-500 uppercase">Name</th>
                                                <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-500 uppercase">Role</th>
                                                <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-500 uppercase">Center</th>
                                            </tr></thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {staffList.map(s => (
                                                    <tr key={s.id} className="hover:bg-white transition-colors">
                                                        <td className="px-4 py-2.5 font-semibold text-slate-800">{s.name}</td>
                                                        <td className="px-4 py-2.5">
                                                            <select value={s.access_role||'teacher'} onChange={e=>updateStaffAccess(s.id,e.target.value,s.center_id)}
                                                                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold outline-none cursor-pointer">
                                                                <option value="teacher">Teacher</option>
                                                                <option value="center_admin">Center Admin</option>
                                                                <option value="super_admin">Super Admin</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-4 py-2.5">
                                                            <select value={s.center_id||''} onChange={e=>updateStaffAccess(s.id,s.access_role||'teacher',e.target.value?Number(e.target.value):null)}
                                                                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold outline-none cursor-pointer">
                                                                <option value="">— None —</option>
                                                                {centers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                                                            </select>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}

                        {active === 'email' && (
                            <>
                                <div><h2 className="text-lg font-bold text-slate-900">Global SMTP</h2>
                                <p className="text-sm text-slate-400 mt-0.5">Fallback used when a center hasn't configured its own SMTP. Per-center SMTP is in <strong>Center Settings</strong>.</p></div>
                                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-2">
                                    <AlertCircle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-700">Gmail: enable 2FA then create an App Password (Google Account → Security → App Passwords).</p>
                                </div>
                                <div className="grid grid-cols-2 gap-5">
                                    <Field label="SMTP Host">
                                        <input value={settings.smtp_host||''} onChange={e=>set('smtp_host',e.target.value)} className={`${inputCls} font-mono`} placeholder="smtp.gmail.com" />
                                    </Field>
                                    <Field label="Port">
                                        <input type="number" value={settings.smtp_port||''} onChange={e=>set('smtp_port',e.target.value)} className={`${inputCls} font-mono`} placeholder="587" />
                                    </Field>
                                    <div className="col-span-2"><Field label="Username (email)">
                                        <div className="relative"><Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="email" value={settings.smtp_user||''} onChange={e=>set('smtp_user',e.target.value)} className={`${inputCls} pl-9`} placeholder="your@gmail.com" /></div>
                                    </Field></div>
                                    <div className="col-span-2"><Field label="Password / App Password">
                                        <div className="relative">
                                            <input type={showSmtpPass?'text':'password'} value={settings.smtp_pass||''} onChange={e=>set('smtp_pass',e.target.value)} className={`${inputCls} font-mono pr-11`} placeholder="App password" />
                                            <button type="button" onClick={()=>setShowSmtpPass(v=>!v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                                {showSmtpPass?<EyeOff size={15}/>:<Eye size={15}/>}
                                            </button>
                                        </div>
                                    </Field></div>
                                    <div className="col-span-2"><Field label="Sender Display Name">
                                        <input value={settings.smtp_sender_name||''} onChange={e=>set('smtp_sender_name',e.target.value)} className={inputCls} placeholder="Vama Academy" />
                                    </Field></div>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                                    <p className="text-sm font-bold text-slate-700 flex items-center gap-2"><Send size={13}/> Send Test Email</p>
                                    <div className="flex gap-3">
                                        <input type="email" value={testEmail} onChange={e=>setTestEmail(e.target.value)} placeholder="recipient@email.com"
                                            className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#463a7a]/10" />
                                        <button onClick={sendTestEmail} disabled={testingEmail||!testEmail}
                                            className="px-5 py-2.5 bg-[#463a7a] text-white rounded-2xl text-sm font-bold hover:bg-[#342a5b] disabled:opacity-40 transition-all flex items-center gap-2">
                                            {testingEmail?<Loader2 size={14} className="animate-spin"/>:<Send size={14}/>} Send
                                        </button>
                                    </div>
                                    {testResult && (
                                        <div className={`flex items-center gap-2 text-xs font-semibold rounded-xl px-3 py-2 ${testResult.ok?'bg-emerald-50 text-emerald-700 border border-emerald-100':'bg-red-50 text-red-600 border border-red-100'}`}>
                                            {testResult.ok?<Check size={12}/>:<AlertCircle size={12}/>} {testResult.msg}
                                        </div>
                                    )}
                                </div>
                                <SaveBar saving={saving} saved={saved} onSave={save} />
                            </>
                        )}

                        {active === 'payments' && (
                            <>
                                <div><h2 className="text-lg font-bold text-slate-900">Payments & Tax</h2>
                                <p className="text-sm text-slate-400 mt-0.5">Default values for invoices and packages. Razorpay keys are configured per-center in Center Settings.</p></div>
                                <div className="grid grid-cols-2 gap-5">
                                    <Field label="Default Tax %" hint="Pre-filled when creating packages & invoices">
                                        <div className="relative"><Percent size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="number" min="0" max="100" step="0.1" value={settings.default_tax_pct||''} onChange={e=>set('default_tax_pct',e.target.value)} className={`${inputCls} pl-9`} placeholder="18" /></div>
                                    </Field>
                                    <Field label="Currency Symbol">
                                        <input value={settings.currency_symbol||'₹'} onChange={e=>set('currency_symbol',e.target.value)} className={`${inputCls} font-mono text-center text-lg`} maxLength={3} />
                                    </Field>
                                    <Field label="Invoice Prefix" hint="e.g. INV → INV-202506-0001">
                                        <input value={settings.invoice_prefix||'INV'} onChange={e=>set('invoice_prefix',e.target.value.toUpperCase())} className={`${inputCls} font-mono`} placeholder="INV" maxLength={8} />
                                    </Field>
                                    <Field label="Invoice Due Days">
                                        <input type="number" min="1" max="365" value={settings.invoice_due_days||''} onChange={e=>set('invoice_due_days',e.target.value)} className={inputCls} placeholder="30" />
                                    </Field>
                                </div>
                                <SaveBar saving={saving} saved={saved} onSave={save} />
                            </>
                        )}

                        {active === 'scheduling' && (
                            <>
                                <div><h2 className="text-lg font-bold text-slate-900">Scheduling</h2>
                                <p className="text-sm text-slate-400 mt-0.5">Global calendar defaults. Each center can override these in Center Settings.</p></div>
                                <div className="grid grid-cols-2 gap-5">
                                    <Field label="Calendar Start Hour">
                                        <select value={settings.session_start_hour||'8'} onChange={e=>set('session_start_hour',e.target.value)} className={`${inputCls} appearance-none cursor-pointer`}>
                                            {Array.from({length:13},(_,i)=>i+6).map(h=><option key={h} value={h}>{h<12?`${h}:00 AM`:h===12?'12:00 PM':`${h-12}:00 PM`}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Calendar End Hour">
                                        <select value={settings.session_end_hour||'21'} onChange={e=>set('session_end_hour',e.target.value)} className={`${inputCls} appearance-none cursor-pointer`}>
                                            {Array.from({length:10},(_,i)=>i+17).map(h=><option key={h} value={h}>{h<12?`${h}:00 AM`:h===12?'12:00 PM':`${h-12}:00 PM`}</option>)}
                                        </select>
                                    </Field>
                                    <div className="col-span-2">
                                        <Field label="Attendance Feedback Rule">
                                            <div className="space-y-2">
                                                {[
                                                    {val:'required_for_present',label:'Required when marking Present',sub:'Absent can be marked without feedback'},
                                                    {val:'required_always',label:'Required for both Present & Absent'},
                                                    {val:'optional',label:'Always optional'},
                                                ].map(opt=>(
                                                    <label key={opt.val} className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${settings.attendance_feedback===opt.val?'border-[#463a7a] bg-violet-50':'border-slate-200 bg-slate-50 hover:border-slate-300'}`}>
                                                        <input type="radio" name="att_feedback" value={opt.val} checked={settings.attendance_feedback===opt.val} onChange={()=>set('attendance_feedback',opt.val)} className="mt-0.5 accent-[#463a7a]" />
                                                        <div><p className="text-sm font-bold text-slate-800">{opt.label}</p><p className="text-xs text-slate-500 mt-0.5">{opt.sub}</p></div>
                                                    </label>
                                                ))}
                                            </div>
                                        </Field>
                                    </div>
                                </div>
                                <SaveBar saving={saving} saved={saved} onSave={save} />
                            </>
                        )}

                        {active === 'appearance' && (
                            <>
                                <div><h2 className="text-lg font-bold text-slate-900">Appearance</h2>
                                <p className="text-sm text-slate-400 mt-0.5">Global theme. Per-center brand color is in Center Settings → Profile.</p></div>
                                <Field label="Primary Brand Colour" hint="Used in sidebar, buttons, and accents globally">
                                    <div className="flex items-center gap-4">
                                        <input type="color" value={settings.primary_color||'#463a7a'} onChange={e=>set('primary_color',e.target.value)} className="w-14 h-14 rounded-2xl border-0 cursor-pointer p-1 bg-transparent" />
                                        <input value={settings.primary_color||'#463a7a'} onChange={e=>set('primary_color',e.target.value)} className={`${inputCls} font-mono uppercase flex-1`} placeholder="#463a7a" />
                                        <div className="w-12 h-12 rounded-2xl shadow-inner border border-slate-200" style={{background:settings.primary_color||'#463a7a'}} />
                                    </div>
                                </Field>
                                <SaveBar saving={saving} saved={saved} onSave={save} />
                            </>
                        )}

                        {active === 'system' && (
                            <>
                                <div><h2 className="text-lg font-bold text-slate-900">System & API</h2>
                                <p className="text-sm text-slate-400 mt-0.5">Backend connection and system information.</p></div>
                                <Field label="Backend API URL" hint="Set via VITE_API_URL environment variable.">
                                    <div className="relative"><Database size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input readOnly value={import.meta.env.VITE_API_URL||'http://127.0.0.1:8000'} className={`${inputCls} pl-9 font-mono bg-slate-100 cursor-default text-slate-600`} /></div>
                                </Field>
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
                            </>
                        )}

                        {/* ── SHARED SECTIONS ── */}

                        {active === 'credentials' && (
                            <>
                                <div><h2 className="text-lg font-bold text-slate-900">Login Credentials</h2>
                                <p className="text-sm text-slate-400 mt-0.5">Manage student and staff portal passwords.</p></div>
                                <div className="bg-violet-50 border border-violet-200 rounded-2xl p-5 space-y-4">
                                    <div className="flex items-start gap-3">
                                        <Shield size={16} className="text-[#463a7a] mt-0.5 flex-shrink-0" />
                                        <div><p className="text-sm font-bold text-slate-800">Set Default Passwords</p>
                                        <p className="text-xs text-slate-500 mt-0.5">Apply one password to all students & staff at once.</p></div>
                                    </div>
                                    <div className="flex gap-3">
                                        <input value={bulkPassword} onChange={e=>setBulkPassword(e.target.value)} className="flex-1 bg-white border border-violet-200 rounded-2xl px-4 py-2.5 text-sm font-mono outline-none" placeholder="vama@1234" />
                                        <button onClick={applyBulkPasswords} disabled={bulkSetting||!bulkPassword}
                                            className="px-5 py-2.5 bg-[#463a7a] text-white rounded-2xl text-sm font-bold hover:bg-[#342a5b] disabled:opacity-50 transition-all flex items-center gap-2">
                                            {bulkSetting?<Loader2 size={14} className="animate-spin"/>:<RefreshCw size={14}/>} Apply to All
                                        </button>
                                    </div>
                                    {bulkResult && <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2"><Check size={12}/> Set for {bulkResult.updated_students} students and {bulkResult.updated_staff} staff</div>}
                                </div>
                                {!credentials
                                    ? <button onClick={loadCredentials} disabled={credLoading} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-sm font-semibold text-slate-400 hover:border-[#463a7a]/30 hover:text-[#463a7a] transition-all flex items-center justify-center gap-2">
                                        {credLoading?<Loader2 size={14} className="animate-spin"/>:<Eye size={14}/>} Show All Login Credentials
                                      </button>
                                    : <div className="space-y-4">
                                        {[{title:'Students',data:credentials.students,isStaff:false},{title:'Staff / Teachers',data:credentials.staff,isStaff:true}].map(({title,data,isStaff})=>(
                                            <div key={title}>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{title}</p>
                                                <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                                                    <table className="w-full text-sm"><thead><tr className="border-b border-slate-200 bg-slate-100">
                                                        <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-500 uppercase">Name</th>
                                                        <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-500 uppercase">Email</th>
                                                        {isStaff&&<th className="px-4 py-2.5 text-left text-xs font-bold text-slate-500 uppercase">Role</th>}
                                                        <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-500 uppercase">Password</th>
                                                    </tr></thead>
                                                    <tbody className="divide-y divide-slate-100">{(data||[]).map(s=>(
                                                        <tr key={s.id} className="hover:bg-white transition-colors">
                                                            <td className="px-4 py-2.5 font-semibold text-slate-800">{s.name}</td>
                                                            <td className="px-4 py-2.5 font-mono text-slate-600 text-xs">{s.email}</td>
                                                            {isStaff&&<td className="px-4 py-2.5"><span className="text-xs font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-lg">{s.role}</span></td>}
                                                            <td className="px-4 py-2.5">{s.has_password?<span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><Check size={11}/> Set</span>:<span className="text-xs font-bold text-amber-600 flex items-center gap-1"><AlertCircle size={11}/> Not set</span>}</td>
                                                        </tr>
                                                    ))}</tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        ))}
                                      </div>
                                }
                            </>
                        )}

                        {active === 'audit-logs' && (
                            <>
                                <div><h2 className="text-lg font-bold text-slate-900">Activity Log</h2>
                                <p className="text-sm text-slate-400 mt-0.5">Actions performed by staff members.</p></div>
                                <AuditLogViewer />
                            </>
                        )}

                        {active === 'analytics' && isSuperAdmin && (
                            <>
                                <div><h2 className="text-lg font-bold text-slate-900">Global Analytics</h2>
                                <p className="text-sm text-slate-400 mt-0.5">Cross-center KPIs and performance metrics.</p></div>
                                <SuperAdminAnalytics />
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Onboarding Wizard */}
            {showOnboardWizard && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-gradient-to-br from-[#463a7a] to-[#2d2550] px-8 py-6 flex items-center justify-between">
                            <div><h3 className="text-xl font-bold text-white">Create New Center</h3>
                            <p className="text-white/60 text-sm mt-1">Step {onboardStep} of 3</p></div>
                            <button onClick={()=>{setShowOnboardWizard(false);setOnboardStep(1);setOnboardResult(null);}} className="text-white/60 hover:text-white"><X size={20}/></button>
                        </div>
                        <div className="p-8 space-y-6">
                            {onboardResult ? (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-4 text-center">
                                    <div className="flex items-center justify-center w-12 h-12 bg-emerald-500 rounded-full mx-auto mb-3"><Check size={20} className="text-white"/></div>
                                    <h4 className="font-bold text-emerald-900 text-lg">Center Created!</h4>
                                    <p className="text-sm text-emerald-700 mt-2"><strong>{onboardResult.center.name}</strong> is now active.</p>
                                    <p className="text-sm text-emerald-700 mt-1">Activation email sent to <strong>{onboardResult.admin_staff.email}</strong></p>
                                </div>
                            ) : (
                                <>
                                    {onboardStep === 1 && (
                                        <div className="space-y-4">
                                            <h4 className="font-bold text-slate-900">Center Details</h4>
                                            {[['center_name','Center Name *','e.g. Vama Academy – Whitefield','text'],['center_address','Address','123 Main St, City','text'],['center_phone','Phone','+91 9876543210','tel'],['center_email','Email','center@vama.academy','email']].map(([k,l,p,t])=>(
                                                <div key={k}><label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">{l}</label>
                                                <input type={t} value={onboardData[k]} onChange={e=>setOnboardData(prev=>({...prev,[k]:e.target.value}))} placeholder={p} className={inputCls}/></div>
                                            ))}
                                        </div>
                                    )}
                                    {onboardStep === 2 && (
                                        <div className="space-y-4">
                                            <h4 className="font-bold text-slate-900">Center Admin Details</h4>
                                            {[['admin_name','Admin Name *','John Doe','text'],['admin_email','Admin Email *','admin@vama.academy','email'],['admin_phone','Admin Phone *','+91 9876543210','tel']].map(([k,l,p,t])=>(
                                                <div key={k}><label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">{l}</label>
                                                <input type={t} value={onboardData[k]} onChange={e=>setOnboardData(prev=>({...prev,[k]:e.target.value}))} placeholder={p} className={inputCls}/></div>
                                            ))}
                                        </div>
                                    )}
                                    {onboardStep === 3 && (
                                        <div className="space-y-4">
                                            <h4 className="font-bold text-slate-900">Confirm</h4>
                                            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
                                                <div><p className="text-xs text-slate-500 uppercase font-bold">Center</p><p className="text-sm font-semibold text-slate-900">{onboardData.center_name}</p></div>
                                                <div><p className="text-xs text-slate-500 uppercase font-bold">Admin</p><p className="text-sm font-semibold text-slate-900">{onboardData.admin_name} · {onboardData.admin_email}</p></div>
                                            </div>
                                            <p className="text-xs text-slate-500">An activation email will be sent to the admin so they can set their password.</p>
                                        </div>
                                    )}
                                    {error && <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-700 font-medium flex items-start gap-2"><AlertCircle size={14} className="flex-shrink-0 mt-0.5"/>{error}</div>}
                                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                                        {onboardStep>1 && <button onClick={()=>setOnboardStep(onboardStep-1)} className="px-4 py-2.5 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all">Back</button>}
                                        <div className="flex-1"/>
                                        {onboardStep<3 && <button onClick={()=>handleOnboardStep(onboardStep)} className="px-4 py-2.5 bg-[#463a7a] hover:bg-[#342a5b] text-white rounded-2xl text-sm font-bold transition-all flex items-center gap-2">Next <ChevronRight size={14}/></button>}
                                        {onboardStep===3 && <button onClick={submitOnboard} disabled={onboarding} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50">{onboarding?<Loader2 size={14} className="animate-spin"/>:<Check size={14}/>} Create Center</button>}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SystemStatusRow({ label, checkUrl }) {
    const [status, setStatus] = useState('checking');
    useEffect(() => { api.get(checkUrl).then(()=>setStatus('ok')).catch(()=>setStatus('error')); }, [checkUrl]);
    return (
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
            <span className="text-sm font-semibold text-slate-700">{label}</span>
            <span className={`flex items-center gap-1.5 text-xs font-bold ${status==='ok'?'text-emerald-600':status==='error'?'text-red-500':'text-amber-500'}`}>
                <span className={`w-2 h-2 rounded-full ${status==='ok'?'bg-emerald-500':status==='error'?'bg-red-500':'bg-amber-400 animate-pulse'}`}/>
                {status==='ok'?'Connected':status==='error'?'Unreachable':'Checking…'}
            </span>
        </div>
    );
}
