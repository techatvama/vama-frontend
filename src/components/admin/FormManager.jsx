import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../../lib/api';
import {
    Search, Inbox, CheckCircle2, Loader2, X, AlertCircle,
    Mail, Phone, MapPin, Music, RefreshCw, ExternalLink, Copy, Save,
    User, Calendar, BookOpen, Globe, Droplets, Users, Link,
} from 'lucide-react';

const AVATAR_COLORS = ['#6366f1', '#10b981', '#f97316', '#ec4899', '#8b5cf6', '#3b82f6', '#ef4444', '#14b8a6'];
const initials = (f, l) => `${(f || '?')[0]}${(l || '')[0] || ''}`.toUpperCase();
const aColor = (id) => AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length];

function Avatar({ id, first, last, size = 40 }) {
    return <div className="rounded-2xl flex items-center justify-center text-white text-xs font-black flex-shrink-0"
        style={{ width: size, height: size, backgroundColor: aColor(id) }}>{initials(first, last)}</div>;
}

export default function FormManager() {
    const [applications, setApplications] = useState([]);
    const [centers, setCenters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);
    const [copiedId, setCopiedId] = useState(null);

    const formUrl = `${window.location.origin}/apply`;

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [appRes, centerRes] = await Promise.all([
                api.get('/admin/student-applications'),
                api.get('/centers').catch(() => ({ data: [] })),
            ]);
            setApplications(appRes.data || []);
            setCenters(centerRes.data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);
    useEffect(() => { load(); }, [load]);

    const filtered = useMemo(() => applications.filter(a => {
        const q = search.toLowerCase();
        if (q && !`${a.first_name} ${a.last_name} ${a.email} ${a.primary_phone_number}`.toLowerCase().includes(q)) return false;
        return true;
    }), [applications, search]);

    const centerLink = (center) => `${window.location.origin}/apply?center=${encodeURIComponent(center.name)}`;

    const copyLink = (url, id = 'main') => {
        navigator.clipboard.writeText(url).catch(() => {});
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]"><Loader2 className="animate-spin text-[#463a7a]" size={36} /></div>;

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 lg:p-8">
            <div className="max-w-[1300px] mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                            <Inbox className="text-[#463a7a]" /> Enrollments
                        </h1>
                        <p className="text-slate-400 font-bold text-sm mt-1">Students who enrolled via the public form. Click any row to view or edit their details.</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <a href="/apply" target="_blank" rel="noreferrer"
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-2xl text-sm font-black hover:border-[#463a7a] hover:text-[#463a7a] transition-all">
                            <ExternalLink size={15} /> Open Form
                        </a>
                        <button onClick={load} className="flex items-center gap-2 px-4 py-2.5 bg-[#463a7a] text-white rounded-2xl text-sm font-black hover:bg-[#3a2f66] transition-all shadow-sm">
                            <RefreshCw size={15} /> Refresh
                        </button>
                    </div>
                </div>

                {/* Per-center enrollment links */}
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Link size={11} /> Enrollment Links</p>
                        <button onClick={() => copyLink(formUrl, 'main')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs font-black hover:border-[#463a7a] hover:text-[#463a7a] transition-all">
                            {copiedId === 'main' ? <><CheckCircle2 size={12} className="text-emerald-500" /> Copied!</> : <><Copy size={12} /> All Centers</>}
                        </button>
                    </div>
                    {centers.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {centers.map(c => (
                                <div key={c.id} className="flex items-center justify-between gap-2 px-3 py-2.5 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="min-w-0">
                                        <p className="text-xs font-black text-slate-800 truncate">{c.name}</p>
                                        <p className="text-[10px] text-slate-400 font-bold truncate">/apply?center=…</p>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <a href={centerLink(c)} target="_blank" rel="noreferrer"
                                            className="p-1.5 text-slate-400 hover:text-[#463a7a] hover:bg-indigo-50 rounded-lg transition-all" title="Open">
                                            <ExternalLink size={13} />
                                        </a>
                                        <button onClick={() => copyLink(centerLink(c), c.id)}
                                            className="p-1.5 text-slate-400 hover:text-[#463a7a] hover:bg-indigo-50 rounded-lg transition-all" title="Copy link">
                                            {copiedId === c.id ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Copy size={13} />}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 font-bold">No centers found — add centers first.</p>
                    )}
                </div>

                {/* Summary pill */}
                <div className="flex items-center gap-3">
                    <span className="px-4 py-2 bg-white border border-slate-100 rounded-2xl text-sm font-black text-[#463a7a] shadow-sm">
                        {applications.length} total enrollment{applications.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* Search */}
                <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
                    <div className="relative">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, phone…"
                            className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#463a7a]/15" />
                    </div>
                </div>

                {/* List */}
                <div className="space-y-3">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
                    {filtered.map(a => (
                        <button key={a.id} onClick={() => setSelected(a)}
                            className="w-full text-left bg-white rounded-3xl p-4 lg:p-5 shadow-sm border border-slate-100 hover:border-[#463a7a]/30 hover:shadow-md transition-all">
                            <div className="flex items-center gap-4 flex-wrap lg:flex-nowrap">
                                <Avatar id={a.id} first={a.first_name} last={a.last_name} size={48} />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-black text-slate-900 truncate">{a.first_name} {a.last_name}</h3>
                                        <span className="text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                                            <CheckCircle2 size={9} className="inline mr-0.5" /> Enrolled
                                        </span>
                                        {a.desired_course && (
                                            <span className="text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-md bg-indigo-50 text-[#463a7a]">
                                                <Music size={9} className="inline mr-0.5" />{a.desired_course}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400 font-bold truncate mt-0.5">{a.email} · {a.primary_phone_number}</p>
                                    {a.nearest_vama_center && <p className="text-[11px] text-slate-400 font-bold truncate mt-0.5">{a.nearest_vama_center}</p>}
                                </div>
                                <p className="text-[11px] text-slate-400 font-bold flex-shrink-0">{a.created_at ? new Date(a.created_at).toLocaleDateString() : ''}</p>
                            </div>
                        </button>
                    ))}
                    {filtered.length === 0 && (
                        <div className="bg-white rounded-3xl p-16 text-center border border-slate-100">
                            <Inbox size={40} className="mx-auto text-slate-200 mb-3" />
                            <p className="text-slate-400 font-bold">No enrollments yet.</p>
                            <p className="text-slate-300 font-bold text-sm mt-1">Share the form link to start receiving students.</p>
                        </div>
                    )}
                </div>
            </div>

            {selected && (
                <EnrollmentDrawer
                    application={selected}
                    onClose={() => setSelected(null)}
                    onSaved={(updated) => {
                        setApplications(prev => prev.map(a => a.id === updated.id ? { ...a, ...updated } : a));
                        setSelected(null);
                    }}
                />
            )}
        </div>
    );
}

function Field({ icon: Icon, label, value }) {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3">
            <Icon size={15} className="text-slate-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="text-sm font-bold text-slate-700 break-words">{value}</p>
            </div>
        </div>
    );
}

const INPUT = "w-full bg-slate-50 border border-slate-100 rounded-2xl py-2.5 px-3.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#463a7a]/15 focus:border-[#463a7a]/30 transition-all";
const LABEL = "text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block";

function EnrollmentDrawer({ application: a, onClose, onSaved }) {
    const [form, setForm] = useState({
        first_name: a.first_name || '',
        last_name: a.last_name || '',
        email: a.email || '',
        primary_phone_number: a.primary_phone_number || '',
        guardian_email: a.guardian_email || '',
        emergency_contact: a.emergency_contact || '',
        date_of_birth: a.date_of_birth || '',
        gender: a.gender || '',
        parent_name: a.parent_name || '',
        address: a.address || '',
        city: a.city || '',
        state: a.state || '',
        desired_course: a.desired_course || '',
        class_frequency: a.class_frequency || '',
        nearest_vama_center: a.nearest_vama_center || '',
        preferred_mode_of_contact: a.preferred_mode_of_contact || '',
        blood_group: a.blood_group || '',
        allergies: a.allergies || '',
        referrer: a.referrer || '',
        notes: a.notes || '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(false);

    const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            // If a real student record exists, update it
            if (a.student_id) {
                await api.put(`/students/${a.student_id}`, {
                    first_name: form.first_name,
                    last_name: form.last_name,
                    email: form.email,
                    primary_phone_number: form.primary_phone_number,
                    guardian_email: form.guardian_email || null,
                    emergency_contact: form.emergency_contact || null,
                    date_of_birth: form.date_of_birth || null,
                    gender: form.gender || null,
                    parent_name: form.parent_name || null,
                    address: form.address || null,
                    city: form.city || null,
                    state: form.state || null,
                    desired_course: form.desired_course || null,
                    nearest_vama_center: form.nearest_vama_center || null,
                    preferred_mode_of_contact: form.preferred_mode_of_contact || null,
                    blood_group: form.blood_group || null,
                    allergies: form.allergies || null,
                    referrer: form.referrer || null,
                });
            }
            setSaved(true);
            setTimeout(() => onSaved({ ...a, ...form }), 800);
        } catch (e) {
            setError(e.response?.data?.detail || 'Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[120] flex justify-end">
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-200 flex flex-col">

                {/* Header */}
                <div className="p-6 bg-[#463a7a] text-white flex items-center gap-3 sticky top-0 z-10">
                    <Avatar id={a.id} first={form.first_name} last={form.last_name} size={44} />
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-black truncate">{form.first_name} {form.last_name}</h2>
                        <p className="text-indigo-200/70 text-xs font-bold">Edit enrollment details</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-2xl hover:bg-white/20"><X size={18} /></button>
                </div>

                {/* Form body */}
                <div className="flex-1 p-6 space-y-5">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-2xl text-sm font-bold flex items-center gap-2">
                            <AlertCircle size={16} />{error}
                        </div>
                    )}

                    {/* Personal */}
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><User size={11} /> Personal</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={LABEL}>First Name</label>
                                <input className={INPUT} value={form.first_name} onChange={set('first_name')} />
                            </div>
                            <div>
                                <label className={LABEL}>Last Name</label>
                                <input className={INPUT} value={form.last_name} onChange={set('last_name')} />
                            </div>
                            <div>
                                <label className={LABEL}>Date of Birth</label>
                                <input type="date" className={INPUT} value={form.date_of_birth} onChange={set('date_of_birth')} />
                            </div>
                            <div>
                                <label className={LABEL}>Gender</label>
                                <select className={INPUT} value={form.gender} onChange={set('gender')}>
                                    <option value="">Select</option>
                                    <option>Male</option>
                                    <option>Female</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className={LABEL}>Parent / Guardian Name</label>
                                <input className={INPUT} value={form.parent_name} onChange={set('parent_name')} />
                            </div>
                        </div>
                    </div>

                    {/* Contact */}
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Phone size={11} /> Contact</p>
                        <div className="grid grid-cols-1 gap-3">
                            <div>
                                <label className={LABEL}>Email</label>
                                <input type="email" className={INPUT} value={form.email} onChange={set('email')} />
                            </div>
                            <div>
                                <label className={LABEL}>Phone</label>
                                <input className={INPUT} value={form.primary_phone_number} onChange={set('primary_phone_number')} />
                            </div>
                            <div>
                                <label className={LABEL}>Guardian Email</label>
                                <input type="email" className={INPUT} value={form.guardian_email} onChange={set('guardian_email')} placeholder="Optional" />
                            </div>
                            <div>
                                <label className={LABEL}>Emergency Contact</label>
                                <input className={INPUT} value={form.emergency_contact} onChange={set('emergency_contact')} placeholder="Optional" />
                            </div>
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><MapPin size={11} /> Address</p>
                        <div className="grid grid-cols-1 gap-3">
                            <div>
                                <label className={LABEL}>Address</label>
                                <input className={INPUT} value={form.address} onChange={set('address')} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={LABEL}>City</label>
                                    <input className={INPUT} value={form.city} onChange={set('city')} />
                                </div>
                                <div>
                                    <label className={LABEL}>State</label>
                                    <input className={INPUT} value={form.state} onChange={set('state')} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Course */}
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Music size={11} /> Course</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={LABEL}>Desired Course</label>
                                <input className={INPUT} value={form.desired_course} onChange={set('desired_course')} />
                            </div>
                            <div>
                                <label className={LABEL}>Class Frequency</label>
                                <input className={INPUT} value={form.class_frequency} onChange={set('class_frequency')} placeholder="e.g. Weekly" />
                            </div>
                            <div>
                                <label className={LABEL}>Nearest Center</label>
                                <input className={INPUT} value={form.nearest_vama_center} onChange={set('nearest_vama_center')} />
                            </div>
                            <div>
                                <label className={LABEL}>Preferred Contact Mode</label>
                                <input className={INPUT} value={form.preferred_mode_of_contact} onChange={set('preferred_mode_of_contact')} placeholder="e.g. WhatsApp" />
                            </div>
                        </div>
                    </div>

                    {/* Health */}
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Droplets size={11} /> Health</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={LABEL}>Blood Group</label>
                                <input className={INPUT} value={form.blood_group} onChange={set('blood_group')} placeholder="e.g. O+" />
                            </div>
                            <div>
                                <label className={LABEL}>Allergies</label>
                                <input className={INPUT} value={form.allergies} onChange={set('allergies')} placeholder="None" />
                            </div>
                        </div>
                    </div>

                    {/* Other */}
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Globe size={11} /> Other</p>
                        <div className="grid grid-cols-1 gap-3">
                            <div>
                                <label className={LABEL}>Referrer</label>
                                <input className={INPUT} value={form.referrer} onChange={set('referrer')} placeholder="How did they hear about us?" />
                            </div>
                            <div>
                                <label className={LABEL}>Notes</label>
                                <textarea rows={2} className={INPUT + ' resize-none'} value={form.notes} onChange={set('notes')} placeholder="Any additional notes" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4">
                    <button
                        onClick={handleSave}
                        disabled={saving || saved}
                        className="w-full py-3.5 rounded-2xl bg-[#463a7a] text-white text-sm font-black hover:bg-[#3a2f66] transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-indigo-900/15"
                    >
                        {saved ? (
                            <><CheckCircle2 size={16} /> Saved!</>
                        ) : saving ? (
                            <><Loader2 size={16} className="animate-spin" /> Saving…</>
                        ) : (
                            <><Save size={16} /> Save Changes</>
                        )}
                    </button>
                    {!a.student_id && (
                        <p className="text-[10px] text-slate-400 font-bold text-center mt-2">No student account linked yet — changes will be saved when account is created.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
