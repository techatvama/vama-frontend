import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../../lib/api';
import {
    Search, Inbox, CheckCircle2, Loader2, X, AlertCircle,
    Mail, Phone, MapPin, Music, RefreshCw, ExternalLink, Copy, Save,
    User, Globe, Droplets, Sliders, Users, CalendarDays, TrendingUp,
    GripVertical, ChevronUp, ChevronDown, Eye, EyeOff, Plus, Trash2,
} from 'lucide-react';

const AVATAR_COLORS = ['#6366f1', '#10b981', '#f97316', '#ec4899', '#8b5cf6', '#3b82f6', '#ef4444', '#14b8a6'];
const initials = (f, l) => `${(f || '?')[0]}${(l || '')[0] || ''}`.toUpperCase();
const aColor = (id) => AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length];
const today = () => new Date().toISOString().slice(0, 10);
const weekAgo = () => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().slice(0, 10); };
const monthAgo = () => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10); };

function Avatar({ id, first, last, size = 40 }) {
    return <div className="rounded-2xl flex items-center justify-center text-white text-xs font-black flex-shrink-0"
        style={{ width: size, height: size, backgroundColor: aColor(id) }}>{initials(first, last)}</div>;
}

function StatCard({ label, value, icon: Icon, color = '#463a7a', sub }) {
    return (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color + '15' }}>
                <Icon size={20} style={{ color }} />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="text-2xl font-black text-slate-900 leading-none mt-0.5">{value}</p>
                {sub && <p className="text-[10px] text-slate-400 font-bold mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

export default function FormManager() {
    const [tab, setTab] = useState('submissions');
    const [applications, setApplications] = useState([]);
    const [centers, setCenters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterCenter, setFilterCenter] = useState('');
    const [filterDate, setFilterDate] = useState('all');   // all | today | week | month
    const [filterStatus, setFilterStatus] = useState('all'); // all | active | pending
    const [selected, setSelected] = useState(null);

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

    const todayStr = today();
    const weekStr = weekAgo();
    const monthStr = monthAgo();

    const stats = useMemo(() => {
        const total = applications.length;
        const todayCount = applications.filter(a => a.created_at && a.created_at.slice(0, 10) === todayStr).length;
        const weekCount = applications.filter(a => a.created_at && a.created_at.slice(0, 10) >= weekStr).length;
        const active = applications.filter(a => a.student_id).length;
        return { total, todayCount, weekCount, active };
    }, [applications]);

    const filtered = useMemo(() => applications.filter(a => {
        const q = search.toLowerCase();
        if (q && !`${a.first_name} ${a.last_name} ${a.email} ${a.primary_phone_number}`.toLowerCase().includes(q)) return false;
        if (filterCenter && a.nearest_vama_center !== filterCenter) return false;
        if (filterDate === 'today' && a.created_at?.slice(0, 10) !== todayStr) return false;
        if (filterDate === 'week' && a.created_at?.slice(0, 10) < weekStr) return false;
        if (filterDate === 'month' && a.created_at?.slice(0, 10) < monthStr) return false;
        if (filterStatus === 'active' && !a.student_id) return false;
        if (filterStatus === 'pending' && a.student_id) return false;
        return true;
    }), [applications, search, filterCenter, filterDate, filterStatus]);

    const hasFilter = filterCenter || filterDate !== 'all' || filterStatus !== 'all' || search;

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
                        <p className="text-slate-400 font-bold text-sm mt-1">Track form submissions and customise your enrollment form per center.</p>
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

                {/* Tabs */}
                <div className="flex gap-1 bg-white rounded-2xl p-1 border border-slate-100 shadow-sm w-fit">
                    {[
                        { key: 'submissions', label: 'Submissions', icon: Inbox },
                        { key: 'builder', label: 'Form Builder', icon: Sliders },
                    ].map(({ key, label, icon: Icon }) => (
                        <button key={key} onClick={() => setTab(key)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black transition-all ${tab === key ? 'bg-[#463a7a] text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                            <Icon size={14} /> {label}
                        </button>
                    ))}
                </div>

                {tab === 'submissions' && (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <StatCard label="Total Enrollments" value={stats.total} icon={Inbox} color="#463a7a" />
                            <StatCard label="Today" value={stats.todayCount} icon={CalendarDays} color="#10b981" sub="new submissions" />
                            <StatCard label="This Week" value={stats.weekCount} icon={TrendingUp} color="#f97316" sub="last 7 days" />
                            <StatCard label="Active Students" value={stats.active} icon={Users} color="#6366f1" sub="accounts created" />
                        </div>

                        {/* Filters */}
                        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex flex-wrap gap-3 items-center">
                            {/* Search */}
                            <div className="relative flex-1 min-w-[180px]">
                                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, phone…"
                                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#463a7a]/15" />
                            </div>

                            {/* Center filter */}
                            {centers.length > 1 && (
                                <select value={filterCenter} onChange={e => setFilterCenter(e.target.value)}
                                    className="bg-slate-50 border border-slate-100 rounded-2xl py-2.5 px-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#463a7a]/15 appearance-none pr-8">
                                    <option value="">All Centers</option>
                                    {centers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                            )}

                            {/* Date filter */}
                            <select value={filterDate} onChange={e => setFilterDate(e.target.value)}
                                className="bg-slate-50 border border-slate-100 rounded-2xl py-2.5 px-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#463a7a]/15 appearance-none">
                                <option value="all">All Time</option>
                                <option value="today">Today</option>
                                <option value="week">This Week</option>
                                <option value="month">This Month</option>
                            </select>

                            {/* Status filter */}
                            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                                className="bg-slate-50 border border-slate-100 rounded-2xl py-2.5 px-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#463a7a]/15 appearance-none">
                                <option value="all">All Status</option>
                                <option value="active">Active (Student Created)</option>
                                <option value="pending">Pending</option>
                            </select>

                            {hasFilter && (
                                <button onClick={() => { setSearch(''); setFilterCenter(''); setFilterDate('all'); setFilterStatus('all'); }}
                                    className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 text-slate-500 rounded-2xl text-sm font-black hover:bg-slate-200 transition-all">
                                    <X size={13} /> Clear
                                </button>
                            )}

                            <span className="ml-auto text-xs font-black text-slate-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
                        </div>

                        {/* List */}
                        <div className="space-y-3">
                            {filtered.map(a => (
                                <button key={a.id} onClick={() => setSelected(a)}
                                    className="w-full text-left bg-white rounded-3xl p-4 lg:p-5 shadow-sm border border-slate-100 hover:border-[#463a7a]/30 hover:shadow-md transition-all">
                                    <div className="flex items-center gap-4 flex-wrap lg:flex-nowrap">
                                        <Avatar id={a.id} first={a.first_name} last={a.last_name} size={48} />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-black text-slate-900 truncate">{a.first_name} {a.last_name}</h3>
                                                {a.student_id ? (
                                                    <span className="text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                                                        <CheckCircle2 size={9} className="inline mr-0.5" /> Active
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-md bg-amber-50 text-amber-600">
                                                        Pending
                                                    </span>
                                                )}
                                                {a.desired_course && (
                                                    <span className="text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-md bg-indigo-50 text-[#463a7a]">
                                                        <Music size={9} className="inline mr-0.5" />{a.desired_course}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-400 font-bold truncate mt-0.5">{a.email} · {a.primary_phone_number}</p>
                                            {a.nearest_vama_center && (
                                                <p className="text-[11px] text-slate-400 font-bold truncate mt-0.5 flex items-center gap-1">
                                                    <MapPin size={9} /> {a.nearest_vama_center}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-[11px] text-slate-400 font-bold">{a.created_at ? new Date(a.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</p>
                                            {a.created_at && a.created_at.slice(0, 10) === todayStr && (
                                                <span className="text-[10px] font-black text-emerald-500">Today</span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                            {filtered.length === 0 && (
                                <div className="bg-white rounded-3xl p-16 text-center border border-slate-100">
                                    <Inbox size={40} className="mx-auto text-slate-200 mb-3" />
                                    <p className="text-slate-400 font-bold">{hasFilter ? 'No results match your filters.' : 'No enrollments yet.'}</p>
                                    {hasFilter && (
                                        <button onClick={() => { setSearch(''); setFilterCenter(''); setFilterDate('all'); setFilterStatus('all'); }}
                                            className="mt-3 text-sm font-black text-[#463a7a] hover:underline">Clear filters</button>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {tab === 'builder' && <FormBuilder centers={centers} />}
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

// ─── Form Builder ──────────────────────────────────────────────────────────────

const TYPE_LABELS = {
    text: 'Text', email: 'Email', tel: 'Phone', date: 'Date',
    select: 'Dropdown', textarea: 'Long Text',
    select_subjects: 'Course Select', select_centers: 'Center Select',
};
const ADDABLE_TYPES = ['text', 'email', 'tel', 'date', 'select', 'textarea'];

function FormBuilder({ centers }) {
    const [fields, setFields] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [copied, setCopied] = useState(false);
    const [dragIdx, setDragIdx] = useState(null);
    const [showAdd, setShowAdd] = useState(false);
    const [newLabel, setNewLabel] = useState('');
    const [newType, setNewType] = useState('text');
    const [newRequired, setNewRequired] = useState(false);
    const [newOptions, setNewOptions] = useState('');

    // Use the first center as this account's center (backend enforces isolation via auth)
    const myCenter = centers[0] || null;
    const enrollLink = myCenter ? `${window.location.origin}/apply?center=${encodeURIComponent(myCenter.name)}` : `${window.location.origin}/apply`;

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/form-config');
            setFields(res.data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const save = async () => {
        setSaving(true);
        setSaved(false);
        try {
            await api.put('/admin/form-config', fields);
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(enrollLink).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const update = (idx, patch) => setFields(prev => prev.map((f, i) => i === idx ? { ...f, ...patch } : f));
    const remove = (idx) => setFields(prev => prev.filter((_, i) => i !== idx).map((f, i) => ({ ...f, order: i })));
    const move = (idx, dir) => {
        setFields(prev => {
            const next = [...prev];
            const t = idx + dir;
            if (t < 0 || t >= next.length) return prev;
            [next[idx], next[t]] = [next[t], next[idx]];
            return next.map((f, i) => ({ ...f, order: i }));
        });
    };

    const addField = () => {
        if (!newLabel.trim()) return;
        const opts = newType === 'select' ? newOptions.split(',').map(o => o.trim()).filter(Boolean) : undefined;
        setFields(prev => [...prev, {
            key: `custom_${Date.now()}`,
            label: newLabel.trim(),
            type: newType,
            required: newRequired,
            enabled: true,
            system: false,
            order: prev.length,
            ...(opts ? { options: opts } : {}),
        }]);
        setNewLabel(''); setNewType('text'); setNewRequired(false); setNewOptions(''); setShowAdd(false);
    };

    const onDragStart = (idx) => setDragIdx(idx);
    const onDragOver = (e, idx) => {
        e.preventDefault();
        if (dragIdx === null || dragIdx === idx) return;
        setFields(prev => {
            const next = [...prev];
            const [moved] = next.splice(dragIdx, 1);
            next.splice(idx, 0, moved);
            setDragIdx(idx);
            return next.map((f, i) => ({ ...f, order: i }));
        });
    };
    const onDragEnd = () => setDragIdx(null);

    return (
        <div className="space-y-5">
            {centers.length === 0 ? (
                <div className="bg-white rounded-3xl p-16 text-center border border-slate-100">
                    <Sliders size={36} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-slate-400 font-bold">No centers found — add centers first.</p>
                </div>
            ) : (
                <>
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                            <div>
                                <p className="text-sm font-black text-slate-800">Enrollment Form</p>
                                <p className="text-xs text-slate-400 font-bold mt-0.5">Drag to reorder · Toggle visibility · System fields always shown</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button onClick={copyLink}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs font-black hover:border-[#463a7a] hover:text-[#463a7a] transition-all">
                                    {copied ? <><CheckCircle2 size={12} className="text-emerald-500" /> Copied!</> : <><Copy size={12} /> Copy Link</>}
                                </button>
                                <a href={enrollLink} target="_blank" rel="noreferrer"
                                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 text-slate-500 rounded-xl text-xs font-black hover:border-[#463a7a] hover:text-[#463a7a] transition-all">
                                    <ExternalLink size={12} /> Preview
                                </a>
                                <button onClick={save} disabled={saving || !fields}
                                    className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-black transition-all ${saved ? 'bg-emerald-500 text-white' : 'bg-[#463a7a] text-white hover:bg-[#3a2f66]'} disabled:opacity-50`}>
                                    {saved ? <><CheckCircle2 size={14} /> Saved!</> : saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Save size={14} /> Save</>}
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-[#463a7a]" size={28} /></div>
                        ) : (
                            <>
                                <div className="divide-y divide-slate-50">
                                    {(fields || []).map((field, idx) => (
                                        <div key={field.key} draggable
                                            onDragStart={() => onDragStart(idx)}
                                            onDragOver={e => onDragOver(e, idx)}
                                            onDragEnd={onDragEnd}
                                            className={`flex items-center gap-3 px-5 py-3.5 transition-all ${dragIdx === idx ? 'bg-indigo-50/60' : 'hover:bg-slate-50/50'} ${!field.enabled ? 'opacity-40' : ''}`}>
                                            <div className="cursor-grab text-slate-300 hover:text-slate-500 flex-shrink-0"><GripVertical size={16} /></div>
                                            <div className="flex flex-col gap-0.5 flex-shrink-0">
                                                <button onClick={() => move(idx, -1)} disabled={idx === 0} className="p-0.5 text-slate-300 hover:text-[#463a7a] disabled:opacity-20"><ChevronUp size={13} /></button>
                                                <button onClick={() => move(idx, 1)} disabled={idx === (fields.length - 1)} className="p-0.5 text-slate-300 hover:text-[#463a7a] disabled:opacity-20"><ChevronDown size={13} /></button>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <input value={field.label} onChange={e => update(idx, { label: e.target.value })}
                                                        disabled={field.system}
                                                        className="text-sm font-black text-slate-800 bg-transparent border-none outline-none focus:bg-slate-100 focus:px-2 rounded-lg transition-all disabled:pointer-events-none" />
                                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">{TYPE_LABELS[field.type] || field.type}</span>
                                                    {field.system && <span className="text-[10px] font-black px-2 py-0.5 bg-indigo-50 text-[#463a7a] rounded-full">System</span>}
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-bold mt-0.5">{field.key}</p>
                                            </div>
                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                                {!field.system && (
                                                    <button onClick={() => update(idx, { required: !field.required })}
                                                        className={`text-[10px] font-black px-2.5 py-1.5 rounded-xl border transition-all ${field.required ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'}`}>
                                                        {field.required ? 'Required' : 'Optional'}
                                                    </button>
                                                )}
                                                <button onClick={() => !field.system && update(idx, { enabled: !field.enabled })}
                                                    disabled={field.system}
                                                    className={`p-2 rounded-xl transition-all ${field.system ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100'}`}>
                                                    {field.enabled ? <Eye size={15} className="text-[#463a7a]" /> : <EyeOff size={15} className="text-slate-400" />}
                                                </button>
                                                {!field.system && (
                                                    <button onClick={() => remove(idx)} className="p-2 rounded-xl hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all">
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Add field */}
                                {showAdd ? (
                                    <div className="border-t border-slate-100 bg-slate-50 p-5 space-y-3">
                                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">New Field</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div className="sm:col-span-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Label</label>
                                                <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="e.g. School Name"
                                                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#463a7a]/15" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Type</label>
                                                <select value={newType} onChange={e => setNewType(e.target.value)}
                                                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#463a7a]/15 appearance-none">
                                                    {ADDABLE_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                                                </select>
                                            </div>
                                            <div className="flex items-end">
                                                <button onClick={() => setNewRequired(r => !r)}
                                                    className={`w-full py-2.5 px-3 rounded-xl border text-sm font-black transition-all ${newRequired ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-white border-slate-200 text-slate-400'}`}>
                                                    {newRequired ? 'Required' : 'Optional'}
                                                </button>
                                            </div>
                                        </div>
                                        {newType === 'select' && (
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Options (comma-separated)</label>
                                                <input value={newOptions} onChange={e => setNewOptions(e.target.value)} placeholder="Option A, Option B, Option C"
                                                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#463a7a]/15" />
                                            </div>
                                        )}
                                        <div className="flex gap-2">
                                            <button onClick={addField} disabled={!newLabel.trim()}
                                                className="flex items-center gap-2 px-4 py-2.5 bg-[#463a7a] text-white rounded-xl text-sm font-black hover:bg-[#3a2f66] transition-all disabled:opacity-40">
                                                <Plus size={14} /> Add Field
                                            </button>
                                            <button onClick={() => setShowAdd(false)}
                                                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl text-sm font-black hover:bg-slate-50 transition-all">
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="border-t border-slate-100 p-4">
                                        <button onClick={() => setShowAdd(true)}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-dashed border-slate-300 text-slate-500 rounded-2xl text-sm font-black hover:border-[#463a7a] hover:text-[#463a7a] transition-all w-full justify-center">
                                            <Plus size={15} /> Add Custom Field
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

// ─── Enrollment Detail Drawer ──────────────────────────────────────────────────

const INPUT = "w-full bg-slate-50 border border-slate-100 rounded-2xl py-2.5 px-3.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#463a7a]/15 focus:border-[#463a7a]/30 transition-all";
const LABEL = "text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block";

function EnrollmentDrawer({ application: a, onClose, onSaved }) {
    const [form, setForm] = useState({
        first_name: a.first_name || '', last_name: a.last_name || '',
        email: a.email || '', primary_phone_number: a.primary_phone_number || '',
        guardian_email: a.guardian_email || '', emergency_contact: a.emergency_contact || '',
        date_of_birth: a.date_of_birth || '', gender: a.gender || '',
        parent_name: a.parent_name || '', address: a.address || '',
        city: a.city || '', state: a.state || '',
        desired_course: a.desired_course || '', class_frequency: a.class_frequency || '',
        nearest_vama_center: a.nearest_vama_center || '', preferred_mode_of_contact: a.preferred_mode_of_contact || '',
        blood_group: a.blood_group || '', allergies: a.allergies || '',
        referrer: a.referrer || '', notes: a.notes || '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(false);

    const customResponses = useMemo(() => {
        try { return JSON.parse(a.custom_responses || '{}'); } catch { return {}; }
    }, [a.custom_responses]);

    const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

    const handleSave = async () => {
        setSaving(true); setError('');
        try {
            if (a.student_id) {
                await api.put(`/students/${a.student_id}`, {
                    first_name: form.first_name, last_name: form.last_name,
                    email: form.email, primary_phone_number: form.primary_phone_number,
                    guardian_email: form.guardian_email || null, emergency_contact: form.emergency_contact || null,
                    date_of_birth: form.date_of_birth || null, gender: form.gender || null,
                    parent_name: form.parent_name || null, address: form.address || null,
                    city: form.city || null, state: form.state || null,
                    desired_course: form.desired_course || null, nearest_vama_center: form.nearest_vama_center || null,
                    preferred_mode_of_contact: form.preferred_mode_of_contact || null,
                    blood_group: form.blood_group || null, allergies: form.allergies || null,
                    referrer: form.referrer || null,
                });
            }
            setSaved(true);
            setTimeout(() => onSaved({ ...a, ...form }), 800);
        } catch (e) { setError(e.response?.data?.detail || 'Failed to save.'); }
        finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 z-[120] flex justify-end">
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
                <div className="p-6 bg-[#463a7a] text-white flex items-center gap-3 sticky top-0 z-10">
                    <Avatar id={a.id} first={form.first_name} last={form.last_name} size={44} />
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-black truncate">{form.first_name} {form.last_name}</h2>
                        <p className="text-indigo-200/70 text-xs font-bold">
                            {a.student_id ? 'Active Student' : 'Pending'} · {a.created_at ? new Date(a.created_at).toLocaleDateString() : ''}
                        </p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-2xl hover:bg-white/20"><X size={18} /></button>
                </div>

                <div className="flex-1 p-6 space-y-5">
                    {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-2xl text-sm font-bold flex items-center gap-2"><AlertCircle size={16} />{error}</div>}

                    <Sect label="Personal" icon={<User size={11} />}>
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className={LABEL}>First Name</label><input className={INPUT} value={form.first_name} onChange={set('first_name')} /></div>
                            <div><label className={LABEL}>Last Name</label><input className={INPUT} value={form.last_name} onChange={set('last_name')} /></div>
                            <div><label className={LABEL}>Date of Birth</label><input type="date" className={INPUT} value={form.date_of_birth} onChange={set('date_of_birth')} /></div>
                            <div>
                                <label className={LABEL}>Gender</label>
                                <select className={INPUT} value={form.gender} onChange={set('gender')}>
                                    <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
                                </select>
                            </div>
                            <div className="col-span-2"><label className={LABEL}>Parent / Guardian</label><input className={INPUT} value={form.parent_name} onChange={set('parent_name')} /></div>
                        </div>
                    </Sect>

                    <Sect label="Contact" icon={<Phone size={11} />}>
                        <div className="grid grid-cols-1 gap-3">
                            <div><label className={LABEL}>Email</label><input type="email" className={INPUT} value={form.email} onChange={set('email')} /></div>
                            <div><label className={LABEL}>Phone</label><input className={INPUT} value={form.primary_phone_number} onChange={set('primary_phone_number')} /></div>
                            <div><label className={LABEL}>Guardian Email</label><input type="email" className={INPUT} value={form.guardian_email} onChange={set('guardian_email')} /></div>
                            <div><label className={LABEL}>Emergency Contact</label><input className={INPUT} value={form.emergency_contact} onChange={set('emergency_contact')} /></div>
                        </div>
                    </Sect>

                    <Sect label="Address" icon={<MapPin size={11} />}>
                        <div className="grid grid-cols-1 gap-3">
                            <div><label className={LABEL}>Street</label><input className={INPUT} value={form.address} onChange={set('address')} /></div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className={LABEL}>City</label><input className={INPUT} value={form.city} onChange={set('city')} /></div>
                                <div><label className={LABEL}>State</label><input className={INPUT} value={form.state} onChange={set('state')} /></div>
                            </div>
                        </div>
                    </Sect>

                    <Sect label="Course" icon={<Music size={11} />}>
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className={LABEL}>Desired Course</label><input className={INPUT} value={form.desired_course} onChange={set('desired_course')} /></div>
                            <div><label className={LABEL}>Class Frequency</label><input className={INPUT} value={form.class_frequency} onChange={set('class_frequency')} /></div>
                            <div><label className={LABEL}>Nearest Center</label><input className={INPUT} value={form.nearest_vama_center} onChange={set('nearest_vama_center')} /></div>
                            <div><label className={LABEL}>Preferred Contact</label><input className={INPUT} value={form.preferred_mode_of_contact} onChange={set('preferred_mode_of_contact')} /></div>
                        </div>
                    </Sect>

                    <Sect label="Health" icon={<Droplets size={11} />}>
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className={LABEL}>Blood Group</label><input className={INPUT} value={form.blood_group} onChange={set('blood_group')} /></div>
                            <div><label className={LABEL}>Allergies</label><input className={INPUT} value={form.allergies} onChange={set('allergies')} /></div>
                        </div>
                    </Sect>

                    <Sect label="Other" icon={<Globe size={11} />}>
                        <div className="grid grid-cols-1 gap-3">
                            <div><label className={LABEL}>Referrer</label><input className={INPUT} value={form.referrer} onChange={set('referrer')} /></div>
                            <div><label className={LABEL}>Notes</label><textarea rows={2} className={INPUT + ' resize-none'} value={form.notes} onChange={set('notes')} /></div>
                        </div>
                    </Sect>

                    {Object.keys(customResponses).length > 0 && (
                        <Sect label="Custom Fields" icon={<Sliders size={11} />}>
                            <div className="space-y-2">
                                {Object.entries(customResponses).map(([k, v]) => (
                                    <div key={k} className="flex gap-3 px-3 py-2.5 bg-slate-50 rounded-xl">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5 min-w-[100px] shrink-0">{k.replace(/custom_\d+/, '').replace(/_/g, ' ') || k}</span>
                                        <span className="text-sm font-bold text-slate-700">{v}</span>
                                    </div>
                                ))}
                            </div>
                        </Sect>
                    )}
                </div>

                <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4">
                    <button onClick={handleSave} disabled={saving || saved}
                        className="w-full py-3.5 rounded-2xl bg-[#463a7a] text-white text-sm font-black hover:bg-[#3a2f66] transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-indigo-900/15">
                        {saved ? <><CheckCircle2 size={16} /> Saved!</> : saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : <><Save size={16} /> Save Changes</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

function Sect({ label, icon, children }) {
    return (
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">{icon} {label}</p>
            {children}
        </div>
    );
}
