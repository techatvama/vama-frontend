import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { format, parse } from 'date-fns';
import { useNavigate } from 'react-router';
import {
    X, Clock, Calendar, Users, Loader2, CheckCircle2, XCircle,
    Pencil, Ban, Plus, Search, AlertCircle, Trash2, UserPlus, UserMinus, BellRing,
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
    const navigate = useNavigate();
    const occ = session;
    const [roster, setRoster] = useState([]);
    const [allStudents, setAllStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState({});
    const [feedback, setFeedback] = useState({});
    const [scopeAction, setScopeAction] = useState(null); // {kind,payload}
    const [scopeSaving, setScopeSaving] = useState(false);
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
    const [confirmOverbook, setConfirmOverbook] = useState(null); // {studentId, scope, message}
    const [sendingReminder, setSendingReminder] = useState(false);

    const flash = (msg) => { setNotice(msg); setTimeout(() => setNotice(''), 3500); };

    const sendReminder = async () => {
        setSendingReminder(true);
        setError('');
        try {
            const res = await api.post(`/admin/occurrences/${occ.id}/send-reminder`);
            flash(`Reminder sent to ${res.data.sent} of ${res.data.recipients} student${res.data.recipients !== 1 ? 's' : ''}.`);
        } catch (e) {
            setError(e.response?.data?.detail || 'Failed to send reminder.');
        } finally {
            setSendingReminder(false);
        }
    };

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
    useEffect(() => { api.get('/students', { params: { exclude_dropped: true } }).then(r => setAllStudents(r.data || [])).catch(() => {}); }, []);

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
                // Admin marking attendance is never blocked by package limits — only
                // student self-booking is. If this pushes them past their package,
                // it surfaces as a warning here and on the Payments overages page.
                params: { status, notes: feedback[studentId] || undefined, bypass_package: true },
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
        setScopeSaving(true);
        try {
            if (kind === 'time') await api.put(`/scheduling/occurrences/${occ.id}`, { scope, ...payload });
            else if (kind === 'cancel') await api.post(`/scheduling/occurrences/${occ.id}/cancel`, { scope });
            else if (kind === 'delete') await api.delete(`/scheduling/occurrences/${occ.id}`, { params: { scope } });
            setScopeAction(null);
            onUpdate?.();
            onClose();
        } catch (e) {
            setError(e.response?.data?.detail || 'Failed');
            setScopeAction(null);
        } finally {
            setScopeSaving(false);
        }
    };

    const isRecurring = occ.is_recurring;

    // Add: recurring → ask scope via popover; one-off → add directly.
    const onAddClick = (studentId, e) => {
        if (isRecurring) setPendingAdd({ studentId, anchor: e.currentTarget });
        else doAdd(studentId, 'this');
    };
    const doAdd = async (studentId, scope, force = false) => {
        setError(''); setEnrolling(studentId); setPendingAdd(null); setConfirmOverbook(null);
        const stu = allStudents.find(s => s.id === studentId);
        try {
            const r = await api.post(`/scheduling/occurrences/${occ.id}/add-student`, { student_id: studentId, scope, force });
            const n = r.data?.occurrences_affected ?? 1;
            setShowAdd(false); setSearch('');
            await load(); onUpdate?.();
            flash(`Added ${stu ? stu.first_name : 'student'} to ${n} class${n === 1 ? '' : 'es'}${r.data?.overbooked ? ' (over capacity)' : ''}`);
        } catch (e) {
            const detail = e.response?.data?.detail;
            if (e.response?.status === 409 && detail?.code === 'capacity_exceeded') {
                setConfirmOverbook({ studentId, scope, message: detail.message });
            } else {
                setError(detail?.message || detail || 'Failed to add student');
            }
        }
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
            <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-md" onClick={onClose} />
            <div className="relative bg-white rounded-[30px] w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-[0_32px_80px_-20px_rgba(0,0,0,0.4)]">
                {/* Header */}
                <div className="relative p-6 text-white sticky top-0 z-10 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#4c3f87] to-[#2d2456]" />
                    <div className="relative z-10">
                        <div className="flex items-start justify-between">
                            <div className="min-w-0">
                                <span className="px-2.5 py-1 bg-white/12 rounded-lg text-[10px] font-black uppercase tracking-widest">{occ.course || 'Class'}</span>
                                <h2 className="text-2xl font-black tracking-tight mt-2.5 truncate">{occ.name || 'Class'}</h2>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 text-indigo-100/60 text-xs font-bold">
                                    <span className="flex items-center gap-1.5"><Calendar size={12} strokeWidth={2.25} /> {dateLabel}</span>
                                    <span className="flex items-center gap-1.5"><Clock size={12} strokeWidth={2.25} /> {occ.start_time}–{occ.end_time}</span>
                                    {occ.teacher_name && <span className="flex items-center gap-1.5"><Users size={12} strokeWidth={2.25} /> {occ.teacher_name}</span>}
                                </div>
                            </div>
                            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center bg-white/10 rounded-xl hover:bg-white/20 flex-shrink-0 transition-colors"><X size={16} strokeWidth={2.25} /></button>
                        </div>
                        {occ.status === 'cancelled' && <div className="mt-3 bg-red-500/20 text-red-100 rounded-xl px-3 py-1.5 text-xs font-black uppercase tracking-widest inline-flex items-center gap-1.5"><Ban size={12} strokeWidth={2.5} /> Cancelled</div>}
                        <div className="flex gap-2 mt-4">
                            <button onClick={() => setShowEdit(true)} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-xl px-3 py-2 text-xs font-bold transition-all"><Pencil size={13} strokeWidth={2.25} /> Edit</button>
                            {occ.status !== 'cancelled' && (
                                confirmCancel ? (
                                    <span className="flex items-center gap-1.5 bg-white/10 rounded-xl px-2 py-1.5 text-xs font-bold">
                                        Cancel this class?
                                        <button onClick={doCancel} className="bg-amber-500 hover:bg-amber-600 rounded-lg px-2 py-1 font-black">Yes</button>
                                        <button onClick={() => setConfirmCancel(false)} className="bg-white/15 hover:bg-white/25 rounded-lg px-2 py-1 font-black">No</button>
                                    </span>
                                ) : (
                                    <button onClick={() => setConfirmCancel(true)} className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/35 text-amber-100 rounded-xl px-3 py-2 text-xs font-bold transition-all"><Ban size={13} strokeWidth={2.25} /> Cancel</button>
                                )
                            )}
                            <button onClick={() => setScopeAction({ kind: 'delete' })} className="flex items-center gap-1.5 bg-red-500/20 hover:bg-red-500/35 text-red-100 rounded-xl px-3 py-2 text-xs font-bold transition-all"><Trash2 size={13} strokeWidth={2.25} /> Delete</button>
                            {occ.status !== 'cancelled' && (
                                <button onClick={sendReminder} disabled={sendingReminder}
                                    title="Email everyone on this class's roster a reminder"
                                    className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-xl px-3 py-2 text-xs font-bold transition-all disabled:opacity-50">
                                    {sendingReminder ? <Loader2 size={13} className="animate-spin" /> : <BellRing size={13} strokeWidth={2.25} />} Send Reminder
                                </button>
                            )}
                        </div>
                        <div className="flex mt-3">
                            <div className="bg-white/10 rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-1.5"><Users size={13} strokeWidth={2.25} /> {present}/{roster.length} present <span className="text-white/30">·</span> {roster.length}/{capacity} capacity</div>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-3">
                    {notice && (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-2xl text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                            <CheckCircle2 size={16} strokeWidth={2.25} /> {notice}
                        </div>
                    )}
                    {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-2xl text-sm font-bold flex items-center gap-2"><AlertCircle size={16} strokeWidth={2.25} />{error}</div>}
                    {confirmOverbook && (
                        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-2xl text-sm font-bold space-y-2.5">
                            <div className="flex items-start gap-2"><AlertCircle size={16} strokeWidth={2.25} className="flex-shrink-0 mt-0.5" /> <span>{confirmOverbook.message} You're adding more students than this slot's capacity — are you sure?</span></div>
                            <div className="flex gap-2">
                                <button onClick={() => doAdd(confirmOverbook.studentId, confirmOverbook.scope, true)}
                                    className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-[0_4px_12px_-2px_rgba(217,119,6,0.4)] transition-all">
                                    Add Anyway
                                </button>
                                <button onClick={() => setConfirmOverbook(null)}
                                    className="flex-1 py-2 rounded-xl bg-white border border-amber-200 text-amber-700 text-xs font-bold hover:bg-amber-100 transition-all">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <h3 className="font-black text-slate-900 text-[15px]">Students <span className="text-slate-400 font-bold">({roster.length})</span></h3>
                        <button onClick={() => setShowAdd(v => !v)}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${showAdd ? 'bg-slate-100 text-slate-500' : 'bg-[#463a7a] text-white hover:bg-[#3a2f66] shadow-[0_4px_12px_-2px_rgba(70,58,122,0.4)]'}`}>
                            {showAdd ? <><X size={14} strokeWidth={2.25} /> Close</> : <><UserPlus size={14} strokeWidth={2.25} /> Add Student</>}
                        </button>
                    </div>

                    {showAdd && (
                        <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-3 space-y-2">
                            <div className="relative">
                                <Search size={14} strokeWidth={2.25} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students to add…"
                                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-100 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#463a7a]/15" />
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
                                            : <span className="flex items-center gap-1 text-[10px] font-black text-[#463a7a] opacity-0 group-hover:opacity-100 transition-opacity"><Plus size={13} strokeWidth={2.5} /> Add</span>}
                                    </button>
                                ))}
                                {addable.length === 0 && <p className="text-xs text-slate-400 text-center py-4 font-semibold">No students to add</p>}
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-[#463a7a]" strokeWidth={2.25} /></div>
                    ) : roster.length === 0 ? (
                        <p className="text-slate-400 font-semibold text-center py-8">No students enrolled yet.</p>
                    ) : roster.map(s => (
                        <div key={s.student_id} className="border border-slate-100 rounded-2xl p-3.5 group hover:border-slate-200 hover:shadow-[0_2px_10px_-4px_rgba(15,23,42,0.08)] transition-all">
                            <div className="flex items-center gap-3 mb-2">
                                <Avatar id={s.student_id} first={s.first_name} last={s.last_name} size={36} />
                                <button onClick={() => navigate(`/students/${s.student_id}`)} className="flex-1 text-left font-black text-slate-900 text-sm truncate hover:text-[#463a7a] transition-colors">
                                    {s.first_name} {s.last_name}
                                </button>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {s.status === 'present' && <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle2 size={10} strokeWidth={2.5} /> Present</span>}
                                    {s.status === 'absent' && <span className="text-[9px] font-black uppercase bg-red-100 text-red-700 px-2 py-1 rounded-full flex items-center gap-1"><XCircle size={10} strokeWidth={2.5} /> Absent</span>}
                                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full flex items-center gap-1 ${s.has_invoice !== false && (s.outstanding ?? 0) <= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
                                        title={s.has_invoice === false ? 'No invoice on file for this class' : undefined}>
                                        {s.has_invoice !== false && (s.outstanding ?? 0) <= 0 ? '✓ Paid' : '💳 Unpaid'}
                                    </span>
                                    <button onClick={(e) => onRemoveClick(s.student_id, e)} title="Remove student"
                                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all text-[10px] font-bold">
                                        <UserMinus size={14} strokeWidth={2.25} /> <span className="hidden group-hover:inline">Remove</span>
                                    </button>
                                </div>
                            </div>
                            {(warnings[s.student_id] || []).length > 0 && (
                                <div className="mb-2 space-y-1">
                                    {warnings[s.student_id].map((w, i) => (
                                        <div key={i} className={`flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-lg ${w.level === 'error' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                                            <AlertCircle size={12} strokeWidth={2.25} /> {w.message}
                                        </div>
                                    ))}
                                </div>
                            )}
                            <input value={feedback[s.student_id] || ''} onChange={e => setFeedback(f => ({ ...f, [s.student_id]: e.target.value }))}
                                placeholder="Feedback (optional)…"
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-xs font-medium mb-2 focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10" />
                            <div className="flex gap-2">
                                <button onClick={() => mark(s.student_id, 'present')} disabled={saving[s.student_id]}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${s.status === 'present' ? 'bg-emerald-500 text-white shadow-[0_4px_12px_-3px_rgba(16,185,129,0.5)]' : 'bg-slate-50 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'}`}>
                                    {saving[s.student_id] ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} strokeWidth={2.25} />} Present
                                </button>
                                <button onClick={() => mark(s.student_id, 'absent')} disabled={saving[s.student_id]}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${s.status === 'absent' ? 'bg-red-500 text-white shadow-[0_4px_12px_-3px_rgba(239,68,68,0.5)]' : 'bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-600'}`}>
                                    <XCircle size={13} strokeWidth={2.25} /> Absent
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
                    allow={(scopeAction.kind === 'cancel' || scopeAction.kind === 'delete') ? ['this', 'this_and_future'] : undefined}
                    requireConfirm={scopeAction.kind === 'delete'}
                    saving={scopeSaving}
                    onPick={applyScope}
                    onClose={() => !scopeSaving && setScopeAction(null)}
                />
            )}
        </div>
    );
}
