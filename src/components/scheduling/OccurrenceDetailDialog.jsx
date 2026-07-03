import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { format, parse } from 'date-fns';
import {
    X, Clock, Calendar, Users, Loader2, CheckCircle2, XCircle,
    Pencil, Ban, Plus, Search, AlertCircle, Trash2, UserPlus, UserMinus,
} from 'lucide-react';

const AVATAR_COLORS = ['#6366f1', '#10b981', '#f97316', '#ec4899', '#8b5cf6', '#3b82f6', '#ef4444', '#14b8a6'];
const initials = (f, l) => `${(f || '?')[0]}${(l || '')[0] || ''}`.toUpperCase();
const avatarColor = (id) => AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length];

function Avatar({ id, first, last, size = 36 }) {
    return (
        <div className="rounded-xl flex items-center justify-center text-white text-[11px] font-black flex-shrink-0"
            style={{ width: size, height: size, backgroundColor: avatarColor(id) }}>
            {initials(first, last)}
        </div>
    );
}
import EditScopeDialog from './EditScopeDialog';
import EditClassDialog from './EditClassDialog';
import ScopePopover from './ScopePopover';

export default function OccurrenceDetailDialog({ session, onClose, onUpdate }) {
    const occ = session;
    const [roster, setRoster] = useState([]);
    const [allStudents, setAllStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState({});
    const [feedback, setFeedback] = useState({});
    const [scopeAction, setScopeAction] = useState(null); // {kind,payload}
    const [showEdit, setShowEdit] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [search, setSearch] = useState('');
    const [enrolling, setEnrolling] = useState(null);
    const [error, setError] = useState('');
    const [pendingAdd, setPendingAdd] = useState(null);     // {studentId, anchor}
    const [pendingRemove, setPendingRemove] = useState(null); // {studentId, anchor}
    const [notice, setNotice] = useState('');               // transient success banner
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [warnings, setWarnings] = useState({});           // studentId -> [{level,message}]

    const flash = (msg) => { setNotice(msg); setTimeout(() => setNotice(''), 3500); };

    const load = useCallback(async () => {
        try {
            const r = await api.get(`/scheduling/occurrences/${occ.id}/attendance`);
            setRoster(r.data || []);
            const init = {};
            (r.data || []).forEach(s => { if (s.notes) init[s.student_id] = s.notes; });
            setFeedback(f => ({ ...init, ...f }));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [occ.id]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { api.get('/students').then(r => setAllStudents(r.data || [])).catch(() => {}); }, []);

    // Cancel = this class only. Attendance is preserved server-side.
    const doCancel = async () => {
        setError('');
        try {
            await api.post(`/scheduling/occurrences/${occ.id}/cancel`, { scope: 'this' });
            onUpdate?.();
            onClose();
        } catch (e) { setError(e.response?.data?.detail || 'Failed to cancel'); }
    };

    const mark = async (studentId, status) => {
        setError('');
        setSaving(s => ({ ...s, [studentId]: true }));
        try {
            const r = await api.put(`/scheduling/occurrences/${occ.id}/attendance/${studentId}`, null, {
                params: { status, notes: feedback[studentId] || undefined },
            });
            const w = r.data?.warnings || [];
            setWarnings(prev => ({ ...prev, [studentId]: w }));
            await load();
            onUpdate?.();
        } catch (e) {
            // Blocked by the validation engine (exhausted / makeup limit / expired / outside validity).
            setError(e.response?.data?.detail || 'Failed to mark attendance');
        } finally {
            setSaving(s => ({ ...s, [studentId]: false }));
        }
    };

    const applyScope = async (scope) => {
        const { kind, payload } = scopeAction;
        setError('');
        try {
            if (kind === 'time') await api.put(`/scheduling/occurrences/${occ.id}`, { scope, ...payload });
            else if (kind === 'cancel') await api.post(`/scheduling/occurrences/${occ.id}/cancel`, { scope });
            else if (kind === 'delete') await api.delete(`/scheduling/occurrences/${occ.id}`, { params: { scope } });
            setScopeAction(null);
            onUpdate?.();
            onClose();
        } catch (e) { setError(e.response?.data?.detail || 'Failed'); setScopeAction(null); }
    };

    const isRecurring = occ.is_recurring;

    // Add: recurring → ask scope via popover; one-off → add directly.
    const onAddClick = (studentId, e) => {
        if (isRecurring) setPendingAdd({ studentId, anchor: e.currentTarget });
        else doAdd(studentId, 'this');
    };
    const doAdd = async (studentId, scope) => {
        setError(''); setEnrolling(studentId); setPendingAdd(null);
        const stu = allStudents.find(s => s.id === studentId);
        try {
            const r = await api.post(`/scheduling/occurrences/${occ.id}/add-student`, { student_id: studentId, scope });
            const n = r.data?.occurrences_affected ?? 1;
            setShowAdd(false); setSearch('');
            await load(); onUpdate?.();
            flash(`Added ${stu ? stu.first_name : 'student'} to ${n} class${n === 1 ? '' : 'es'}`);
        } catch (e) { setError(e.response?.data?.detail || 'Failed to add student'); }
        finally { setEnrolling(null); }
    };

    // Remove: recurring → ask scope; one-off → remove directly.
    const onRemoveClick = (studentId, e) => {
        if (isRecurring) setPendingRemove({ studentId, anchor: e.currentTarget });
        else doRemove(studentId, 'this');
    };
    const doRemove = async (studentId, scope) => {
        setError(''); setPendingRemove(null);
        const stu = roster.find(s => s.student_id === studentId);
        try {
            const r = await api.post(`/scheduling/occurrences/${occ.id}/remove-student`, { student_id: studentId, scope });
            const n = r.data?.occurrences_affected ?? 1;
            await load(); onUpdate?.();
            flash(`Removed ${stu ? stu.first_name : 'student'} from ${n} class${n === 1 ? '' : 'es'}`);
        } catch (e) { setError(e.response?.data?.detail || 'Failed to remove student'); }
    };

    const present = roster.filter(s => s.status === 'present').length;
    const capacity = occ.capacity || occ.batch?.capacity || 0;
    const enrolledIds = new Set(roster.map(s => s.student_id));
    const addable = allStudents.filter(s => !enrolledIds.has(s.id) &&
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase()));
    const dateLabel = occ.date ? format(parse(occ.date, 'yyyy-MM-dd', new Date()), 'EEEE, MMM d, yyyy') : '';
    const dayShort = occ.date ? format(parse(occ.date, 'yyyy-MM-dd', new Date()), 'EEE, MMM d') : '';
    const weekday = occ.date ? format(parse(occ.date, 'yyyy-MM-dd', new Date()), 'EEEE') : '';
    const scopeDesc = {
        this: `Only this class — ${dayShort}`,
        this_and_future: `This and all later ${weekday} classes`,
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={onClose} />
            <div className="relative bg-white rounded-[36px] w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="p-6 bg-[#463a7a] text-white sticky top-0 z-10">
                    <div className="flex items-start justify-between">
                        <div>
                            <span className="px-2 py-0.5 bg-white/15 rounded-lg text-[10px] font-black uppercase tracking-widest">{occ.course || 'Class'}</span>
                            <h2 className="text-2xl font-black tracking-tighter mt-2">{occ.name || 'Class'}</h2>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-indigo-100/70 text-xs font-bold">
                                <span className="flex items-center gap-1"><Calendar size={12} /> {dateLabel}</span>
                                <span className="flex items-center gap-1"><Clock size={12} /> {occ.start_time}–{occ.end_time}</span>
                                {occ.teacher_name && <span className="flex items-center gap-1"><Users size={12} /> {occ.teacher_name}</span>}
                            </div>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-2xl hover:bg-white/20 flex-shrink-0"><X size={18} /></button>
                    </div>
                    {occ.status === 'cancelled' && <div className="mt-3 bg-red-500/20 text-red-100 rounded-xl px-3 py-1.5 text-xs font-black uppercase tracking-widest inline-block">Cancelled</div>}
                    <div className="flex gap-2 mt-4">
                        <button onClick={() => setShowEdit(true)} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-xl px-3 py-2 text-xs font-black transition-all"><Pencil size={13} /> Edit</button>
                        {occ.status !== 'cancelled' && (
                            confirmCancel ? (
                                <span className="flex items-center gap-1.5 bg-white/10 rounded-xl px-2 py-1.5 text-xs font-black">
                                    Cancel this class?
                                    <button onClick={doCancel} className="bg-amber-500 hover:bg-amber-600 rounded-lg px-2 py-1">Yes</button>
                                    <button onClick={() => setConfirmCancel(false)} className="bg-white/15 hover:bg-white/25 rounded-lg px-2 py-1">No</button>
                                </span>
                            ) : (
                                <button onClick={() => setConfirmCancel(true)} className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/40 rounded-xl px-3 py-2 text-xs font-black transition-all"><Ban size={13} /> Cancel</button>
                            )
                        )}
                        <button onClick={() => setScopeAction({ kind: 'delete' })} className="flex items-center gap-1.5 bg-red-500/20 hover:bg-red-500/40 rounded-xl px-3 py-2 text-xs font-black transition-all"><Trash2 size={13} /> Delete</button>
                    </div>
                    <div className="flex mt-2">
                        <div className="bg-white/10 rounded-xl px-3 py-2 text-xs font-black flex items-center gap-1.5"><Users size={13} /> {present}/{roster.length} present · {roster.length}/{capacity}</div>
                    </div>
                </div>

                <div className="p-6 space-y-3">
                    {notice && (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-2xl text-sm font-black flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                            <CheckCircle2 size={16} /> {notice}
                        </div>
                    )}
                    {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-2xl text-sm font-bold flex items-center gap-2"><AlertCircle size={16} />{error}</div>}

                    <div className="flex items-center justify-between">
                        <h3 className="font-black text-slate-900">Students <span className="text-slate-400">({roster.length})</span></h3>
                        <button onClick={() => setShowAdd(v => !v)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all ${showAdd ? 'bg-slate-100 text-slate-500' : 'bg-[#463a7a] text-white hover:bg-[#3a2f66] shadow-sm'}`}>
                            {showAdd ? <><X size={14} /> Close</> : <><UserPlus size={14} /> Add Student</>}
                        </button>
                    </div>

                    {showAdd && (
                        <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-3 space-y-2">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students to add…"
                                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#463a7a]/15" />
                            </div>
                            <div className="max-h-52 overflow-y-auto space-y-1">
                                {addable.slice(0, 30).map(s => (
                                    <button key={s.id} onClick={(e) => onAddClick(s.id, e)} disabled={enrolling === s.id}
                                        className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-white text-left transition-all group disabled:opacity-50">
                                        <Avatar id={s.id} first={s.first_name} last={s.last_name} size={34} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-slate-800 truncate">{s.first_name} {s.last_name}</p>
                                            {(s.current_grade || s.desired_course) && (
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide truncate">
                                                    {[s.desired_course, s.current_grade && `Grade ${s.current_grade}`].filter(Boolean).join(' · ')}
                                                </p>
                                            )}
                                        </div>
                                        {enrolling === s.id
                                            ? <Loader2 size={16} className="animate-spin text-[#463a7a]" />
                                            : <span className="flex items-center gap-1 text-[10px] font-black text-[#463a7a] opacity-0 group-hover:opacity-100 transition-opacity"><Plus size={13} /> Add</span>}
                                    </button>
                                ))}
                                {addable.length === 0 && <p className="text-xs text-slate-400 text-center py-4 font-bold">No students to add</p>}
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-[#463a7a]" /></div>
                    ) : roster.length === 0 ? (
                        <p className="text-slate-400 font-bold text-center py-8">No students enrolled yet.</p>
                    ) : roster.map(s => (
                        <div key={s.student_id} className="border border-slate-100 rounded-2xl p-3 group hover:border-slate-200 transition-colors">
                            <div className="flex items-center gap-3 mb-2">
                                <Avatar id={s.student_id} first={s.first_name} last={s.last_name} size={36} />
                                <span className="flex-1 font-black text-slate-900 text-sm truncate">{s.first_name} {s.last_name}</span>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {s.status === 'present' && <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Present</span>}
                                    {s.status === 'absent' && <span className="text-[9px] font-black uppercase bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Absent</span>}
                                    <button onClick={(e) => onRemoveClick(s.student_id, e)} title="Remove student"
                                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all text-[10px] font-black">
                                        <UserMinus size={14} /> <span className="hidden group-hover:inline">Remove</span>
                                    </button>
                                </div>
                            </div>
                            {(warnings[s.student_id] || []).length > 0 && (
                                <div className="mb-2 space-y-1">
                                    {warnings[s.student_id].map((w, i) => (
                                        <div key={i} className={`flex items-center gap-1.5 text-[11px] font-black px-2 py-1 rounded-lg ${w.level === 'error' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                                            <AlertCircle size={12} /> {w.message}
                                        </div>
                                    ))}
                                </div>
                            )}
                            <input value={feedback[s.student_id] || ''} onChange={e => setFeedback(f => ({ ...f, [s.student_id]: e.target.value }))}
                                placeholder="Feedback (optional)…"
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-xs font-medium mb-2 focus:outline-none" />
                            <div className="flex gap-2">
                                <button onClick={() => mark(s.student_id, 'present')} disabled={saving[s.student_id]}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black transition-all ${s.status === 'present' ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'}`}>
                                    {saving[s.student_id] ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Present
                                </button>
                                <button onClick={() => mark(s.student_id, 'absent')} disabled={saving[s.student_id]}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black transition-all ${s.status === 'absent' ? 'bg-red-500 text-white' : 'bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-600'}`}>
                                    <XCircle size={13} /> Absent
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {pendingAdd && (
                <ScopePopover
                    title="Add Student To"
                    confirmLabel="Add"
                    descriptions={scopeDesc}
                    anchorRef={{ current: pendingAdd.anchor }}
                    onConfirm={(scope) => doAdd(pendingAdd.studentId, scope)}
                    onClose={() => setPendingAdd(null)}
                />
            )}
            {pendingRemove && (
                <ScopePopover
                    title="Remove Student From"
                    confirmLabel="Remove"
                    confirmTone="red"
                    descriptions={scopeDesc}
                    anchorRef={{ current: pendingRemove.anchor }}
                    onConfirm={(scope) => doRemove(pendingRemove.studentId, scope)}
                    onClose={() => setPendingRemove(null)}
                />
            )}

            {showEdit && (
                <EditClassDialog
                    occ={occ}
                    onClose={() => setShowEdit(false)}
                    onSaved={() => { onUpdate?.(); onClose(); }}
                />
            )}

            {scopeAction && (
                <EditScopeDialog
                    title={scopeAction.kind === 'cancel' ? 'Cancel which classes?'
                        : scopeAction.kind === 'delete' ? 'Delete which classes?'
                        : 'Apply time change to…'}
                    allow={scopeAction.kind === 'cancel' ? ['this', 'this_and_future'] : undefined}
                    onPick={applyScope}
                    onClose={() => setScopeAction(null)}
                />
            )}
        </div>
    );
}
