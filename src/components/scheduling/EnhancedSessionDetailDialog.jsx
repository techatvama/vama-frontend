import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../../lib/api';
import { parseSubject } from '../../lib/utils';
import {
    X, UserPlus, Check, XCircle, Clock, Calendar, Trash2,
    Users, AlertCircle, Eye, EyeOff, Ban,
    Pencil, RefreshCw, MoreVertical, Search, ChevronRight,
    Repeat, BookOpen, GraduationCap, CheckCircle2, Loader2,
} from 'lucide-react';
import EditBatchDialog from './EditBatchDialog';

const fmtTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'pm' : 'am'}`;
};

const fmtDate = (d) => {
    if (!d) return '';
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long', month: 'short', day: 'numeric',
    });
};

const fmtWeekday = (d) => {
    if (!d) return '';
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });
};

// ─── Edit Repeats Modal ───────────────────────────────────────────────────────
function EditRepeatsModal({ session, onClose, onUpdate }) {
    const [series, setSeries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editTime, setEditTime] = useState({ start: session.start_time, end: session.end_time });
    const [saving, setSaving] = useState(false);
    const today = new Date().toISOString().slice(0, 10);

    useEffect(() => {
        api.get(`/sessions/${session.id}/series`)
            .then(r => setSeries(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [session.id]);

    const deleteOne = async (id) => {
        try {
            await api.delete(`/sessions/${id}`);
            setSeries(prev => prev.filter(s => s.id !== id));
            onUpdate();
        } catch (e) { console.error(e); }
    };

    const saveAll = async () => {
        setSaving(true);
        try {
            await api.put(`/sessions/${session.id}/update-future`, { start_time: editTime.start, end_time: editTime.end });
            onUpdate(); onClose();
        } catch (e) { console.error(e); } finally { setSaving(false); }
    };

    const upcoming = series.filter(s => s.date >= today);

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-3xl">
                    <div>
                        <h3 className="text-base font-bold text-slate-900">Manage series</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{series.length} total · {upcoming.length} upcoming</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors"><X size={16} /></button>
                </div>
                <div className="px-6 py-3 bg-violet-50 border-b border-violet-100 flex items-center gap-3 flex-wrap">
                    <RefreshCw size={13} className="text-[#463a7a] flex-shrink-0" />
                    <span className="text-xs font-semibold text-[#463a7a]">Update all upcoming:</span>
                    <input type="time" value={editTime.start} onChange={e => setEditTime(p => ({ ...p, start: e.target.value }))}
                        className="px-2 py-1.5 border border-violet-200 rounded-lg text-xs focus:border-[#463a7a] focus:outline-none bg-white" />
                    <span className="text-slate-400 text-xs">–</span>
                    <input type="time" value={editTime.end} onChange={e => setEditTime(p => ({ ...p, end: e.target.value }))}
                        className="px-2 py-1.5 border border-violet-200 rounded-lg text-xs focus:border-[#463a7a] focus:outline-none bg-white" />
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {loading ? (
                        <div className="flex items-center justify-center py-12"><Loader2 size={20} className="animate-spin text-slate-300" /></div>
                    ) : series.map((s, i) => {
                        const isPast = s.date < today;
                        return (
                            <div key={s.id} className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${isPast ? 'bg-slate-50 border-slate-100 opacity-50' : 'bg-white border-slate-200 hover:border-[#463a7a]/30'}`}>
                                <div className="w-7 h-7 rounded-xl bg-[#463a7a]/10 flex items-center justify-center text-[10px] font-bold text-[#463a7a] flex-shrink-0">{i + 1}</div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-800">{fmtDate(s.date)}</p>
                                    <p className="text-xs text-slate-400">{fmtTime(s.start_time)} – {fmtTime(s.end_time)}</p>
                                </div>
                                {s.status === 'cancelled' && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">CANCELLED</span>}
                                {!isPast && s.status !== 'cancelled' && (
                                    <button onClick={() => deleteOne(s.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 size={13} />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
                <div className="px-6 py-4 border-t border-slate-100 flex gap-3 justify-end bg-slate-50 rounded-b-3xl">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
                    <button onClick={saveAll} disabled={saving} className="px-5 py-2 text-sm font-semibold text-white bg-[#463a7a] rounded-xl hover:bg-[#342a5b] disabled:opacity-50 transition-colors flex items-center gap-2">
                        {saving ? <Loader2 size={14} className="animate-spin" /> : null} Save changes
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Dialog ──────────────────────────────────────────────────────────────
export default function EnhancedSessionDetailDialog({ session, isOpen, onClose, onUpdate }) {
    const navigate = useNavigate();
    const actionsRef = useRef(null);

    const [activeTab, setActiveTab] = useState('students');
    const [enrolledStudents, setEnrolledStudents] = useState([]);
    const [allStudents, setAllStudents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [attendanceState, setAttendanceState] = useState({});
    const [feedbackState, setFeedbackState] = useState({});
    const [feedbackError, setFeedbackError] = useState('');
    const [enrollmentType, setEnrollmentType] = useState('single_session');
    const [enrolling, setEnrolling] = useState(null); // studentId being enrolled
    const [removeTarget, setRemoveTarget] = useState(null);
    const [removing, setRemoving] = useState(false);

    const [showActions, setShowActions] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showRepeats, setShowRepeats] = useState(false);
    const [isPublished, setIsPublished] = useState(true);
    const [sessionStatus, setSessionStatus] = useState('scheduled');

    useEffect(() => {
        if (!showActions) return;
        const h = (e) => { if (actionsRef.current && !actionsRef.current.contains(e.target)) setShowActions(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [showActions]);

    useEffect(() => {
        if (isOpen && session) {
            fetchSessionStudents();
            fetchAllStudents();
            setIsPublished(session.is_published !== false);
            setSessionStatus(session.status || 'scheduled');
            setShowEditDialog(false); setShowActions(false);
            setActiveTab('students'); setSearchQuery('');
            setFeedbackState({}); setFeedbackError(''); setRemoveTarget(null);
        }
    }, [isOpen, session?.id]);

    const fetchSessionStudents = async () => {
        if (!session?.id) return;
        try {
            const res = await api.get(`/sessions/${session.id}/students`);
            setEnrolledStudents(res.data);
            const attState = {}, fbState = {};
            res.data.forEach(s => {
                if (s.attendance) {
                    attState[s.id] = s.attendance.status;
                    if (s.attendance.notes) fbState[s.id] = s.attendance.notes;
                }
            });
            setAttendanceState(attState);
            setFeedbackState(fbState);
        } catch (e) { console.error(e); }
    };

    const fetchAllStudents = async () => {
        try { const res = await api.get('/students'); setAllStudents(res.data); }
        catch (e) { console.error(e); }
    };

    const enrollStudent = async (studentId) => {
        setEnrolling(studentId);
        try {
            await api.post(`/sessions/${session.id}/enroll`, null, {
                params: { student_id: studentId, enrollment_type: enrollmentType }
            });
            await fetchSessionStudents();
            setSearchQuery('');
            onUpdate();
        } catch (e) {
            console.error(e);
            alert(`Failed to enroll: ${e.response?.data?.detail || e.message}`);
        } finally { setEnrolling(null); }
    };

    const removeStudent = (student) => {
        if (student.enrollment_type === 'recurring') setRemoveTarget(student);
        else doRemove(student.id, 'this_class');
    };

    const doRemove = async (studentId, scope) => {
        setRemoving(true);
        try {
            await api.delete(`/sessions/${session.id}/students/${studentId}`, { params: { scope } });
            setEnrolledStudents(prev => prev.filter(s => s.id !== studentId));
            setRemoveTarget(null);
            onUpdate();
        } catch (e) {
            console.error(e);
            alert(e.response?.data?.detail || 'Failed to remove student');
        } finally { setRemoving(false); }
    };

    const markAttendance = async (studentId, status) => {
        const notes = (feedbackState[studentId] || '').trim();
        // Feedback is required only when marking Present
        if (status === 'present' && !notes) { setFeedbackError(studentId); return; }
        setFeedbackError('');
        setAttendanceState(prev => ({ ...prev, [studentId]: status }));
        try {
            await api.put(`/sessions/${session.id}/attendance/${studentId}`, null, {
                params: { status, notes: notes || undefined, require_feedback: status === 'present' },
            });
            onUpdate();
        } catch (e) {
            console.error(e);
            if (e.response?.data?.detail) alert(e.response.data.detail);
        }
    };

    const handlePublish = async () => {
        try { const res = await api.put(`/sessions/${session.id}/publish`); setIsPublished(res.data.is_published); onUpdate(); }
        catch (e) { console.error(e); }
    };
    const handleCancel = async () => {
        if (!confirm('Cancel this class?')) return;
        try { await api.put(`/sessions/${session.id}/cancel`); setSessionStatus('cancelled'); onUpdate(); }
        catch (e) { console.error(e); }
    };
    const handleDelete = async () => {
        if (!confirm('Permanently delete this class? This cannot be undone.')) return;
        try { await api.delete(`/sessions/${session.id}`); onUpdate(); onClose(); }
        catch (e) { console.error(e); }
    };

    if (!isOpen || !session) return null;

    const isCancelled = sessionStatus === 'cancelled';
    const subject = parseSubject(session.batch?.subject) || 'Class';
    const colorTag = session.batch?.color_tag || '#463a7a';
    const weekday = fmtWeekday(session.date);
    const recurringLabel = `Every ${weekday} ${fmtTime(session.start_time)}`;
    const enrollmentCount = enrolledStudents.length;

    const filteredStudents = allStudents.filter(s =>
        !enrolledStudents.find(es => es.id === s.id) &&
        (`${s.first_name} ${s.last_name}`).toLowerCase().includes(searchQuery.toLowerCase())
    );

    const initials = (s) => `${(s.first_name || '?')[0]}${(s.last_name || '?')[0]}`.toUpperCase();

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
                onClick={onClose}>
                <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-xl max-h-[94vh] overflow-hidden flex flex-col"
                    onClick={e => e.stopPropagation()}>

                    {/* ── Header ── */}
                    <div className="relative flex-shrink-0" style={{ background: `linear-gradient(135deg, ${colorTag}18, ${colorTag}08)` }}>
                        {/* Color accent bar */}
                        <div className="h-1 w-full" style={{ background: colorTag }} />

                        <div className="px-5 pt-5 pb-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    {/* Subject + status */}
                                    <div className="flex items-center gap-2 flex-wrap mb-2">
                                        <h2 className="text-xl font-bold text-slate-900">{subject}</h2>
                                        {isCancelled && (
                                            <span className="text-[10px] bg-red-100 text-red-600 px-2.5 py-1 rounded-full font-bold uppercase tracking-wide">Cancelled</span>
                                        )}
                                        {!isPublished && !isCancelled && (
                                            <span className="text-[10px] bg-slate-200 text-slate-600 px-2.5 py-1 rounded-full font-bold uppercase tracking-wide flex items-center gap-1">
                                                <EyeOff size={9} /> Draft
                                            </span>
                                        )}
                                    </div>

                                    {/* Meta chips */}
                                    <div className="flex flex-wrap gap-2">
                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white/70 border border-slate-200 px-2.5 py-1.5 rounded-xl">
                                            <Clock size={11} style={{ color: colorTag }} />
                                            {fmtTime(session.start_time)} – {fmtTime(session.end_time)}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white/70 border border-slate-200 px-2.5 py-1.5 rounded-xl">
                                            <Calendar size={11} style={{ color: colorTag }} />
                                            {fmtDate(session.date)}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-white/70 border border-slate-200" style={{ color: colorTag }}>
                                            <Users size={11} /> {enrollmentCount} enrolled
                                        </span>
                                        {session.teacher_name && (
                                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white/70 border border-slate-200 px-2.5 py-1.5 rounded-xl">
                                                <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                                                    style={{ background: colorTag }}>
                                                    {(session.teacher_name || '?')[0]}
                                                </div>
                                                {session.teacher_name}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Controls */}
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <button onClick={() => setShowEditDialog(true)}
                                        className="flex items-center gap-1.5 px-3 py-2 text-white text-xs font-bold rounded-xl shadow-sm transition-all hover:opacity-90"
                                        style={{ background: colorTag }}>
                                        <Pencil size={12} /> Edit
                                    </button>
                                    <div className="relative" ref={actionsRef}>
                                        <button onClick={() => setShowActions(v => !v)}
                                            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                                            <MoreVertical size={14} className="text-slate-600" />
                                        </button>
                                        {showActions && (
                                            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-20 overflow-hidden">
                                                {[
                                                    { icon: <RefreshCw size={14} />, label: 'Manage series', sub: 'View / edit repetitions', onClick: () => setShowRepeats(true), color: 'text-violet-600' },
                                                    null,
                                                    { icon: isPublished ? <EyeOff size={14} /> : <Eye size={14} />, label: isPublished ? 'Unpublish' : 'Publish', sub: isPublished ? 'Hide from portals' : 'Make visible', onClick: handlePublish, color: 'text-blue-600' },
                                                    null,
                                                    { icon: <Ban size={14} />, label: 'Cancel class', sub: 'Mark as cancelled', onClick: handleCancel, color: 'text-orange-500', disabled: isCancelled },
                                                    { icon: <Trash2 size={14} />, label: 'Delete class', sub: 'Permanently remove', onClick: handleDelete, color: 'text-red-500' },
                                                ].map((item, i) => {
                                                    if (item === null) return <div key={i} className="my-1 border-t border-slate-100" />;
                                                    return (
                                                        <button key={i} disabled={item.disabled}
                                                            onClick={() => { item.onClick(); setShowActions(false); }}
                                                            className="w-full px-4 py-2.5 text-left flex items-start gap-3 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                                                            <span className={`mt-0.5 flex-shrink-0 ${item.color}`}>{item.icon}</span>
                                                            <div>
                                                                <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                                                                <p className="text-xs text-slate-400">{item.sub}</p>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                    <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-xl transition-colors">
                                        <X size={18} className="text-slate-500" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-slate-200 px-5">
                            {[{ key: 'students', label: `Students (${enrollmentCount})` }, { key: 'attendance', label: 'Attendance' }].map(t => (
                                <button key={t.key} onClick={() => setActiveTab(t.key)}
                                    className={`py-3 px-4 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === t.key ? 'border-current text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                                    style={activeTab === t.key ? { borderColor: colorTag, color: colorTag } : {}}>
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Body ── */}
                    <div className="flex-1 overflow-y-auto bg-slate-50">

                        {/* ── Students tab ── */}
                        {activeTab === 'students' && (
                            <div className="p-4 space-y-3">

                                {/* Add Student */}
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                                        <UserPlus size={14} style={{ color: colorTag }} />
                                        <span className="text-sm font-bold text-slate-800">Add Student</span>
                                    </div>
                                    <div className="p-3 space-y-3">
                                        {/* Enrollment type toggle */}
                                        <div className="flex gap-2">
                                            {[
                                                { val: 'single_session', icon: <Calendar size={11} />, label: 'This class only' },
                                                { val: 'recurring', icon: <Repeat size={11} />, label: recurringLabel },
                                            ].map(opt => (
                                                <button key={opt.val} type="button"
                                                    onClick={() => setEnrollmentType(opt.val)}
                                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold border-2 transition-all ${enrollmentType === opt.val ? 'text-white border-transparent shadow-sm' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'}`}
                                                    style={enrollmentType === opt.val ? { background: colorTag, borderColor: colorTag } : {}}>
                                                    {opt.icon} {opt.label}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Search */}
                                        <div className="relative">
                                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input type="text" placeholder="Search students…" value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                                className="w-full pl-8 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#463a7a] focus:ring-2 focus:ring-[#463a7a]/10 transition-all" />
                                            {searchQuery && (
                                                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                                    <X size={13} />
                                                </button>
                                            )}
                                        </div>

                                        {/* Results */}
                                        {searchQuery && (
                                            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden max-h-52 overflow-y-auto">
                                                {filteredStudents.length === 0 ? (
                                                    <div className="py-8 text-center text-sm text-slate-400">No students found</div>
                                                ) : filteredStudents.slice(0, 8).map(s => (
                                                    <button key={s.id} onClick={() => enrollStudent(s.id)} disabled={enrolling === s.id}
                                                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white border-b border-slate-100 last:border-0 transition-colors text-left group disabled:opacity-50">
                                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                                            style={{ background: colorTag }}>{initials(s)}</div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-slate-800">{s.first_name} {s.last_name}</p>
                                                            <p className="text-xs text-slate-400">{[s.current_grade, s.desired_course].filter(Boolean).join(' · ') || s.email}</p>
                                                        </div>
                                                        {enrolling === s.id
                                                            ? <Loader2 size={14} className="animate-spin text-slate-400 flex-shrink-0" />
                                                            : <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                style={{ background: `${colorTag}20`, color: colorTag }}>
                                                                <UserPlus size={13} />
                                                              </div>
                                                        }
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Enrolled Students */}
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Users size={14} style={{ color: colorTag }} />
                                            <span className="text-sm font-bold text-slate-800">Enrolled</span>
                                            <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: colorTag }}>{enrollmentCount}</span>
                                        </div>
                                    </div>

                                    {enrollmentCount === 0 ? (
                                        <div className="py-12 text-center text-slate-400">
                                            <Users size={32} className="mx-auto mb-2 opacity-30" />
                                            <p className="text-sm font-medium">No students enrolled yet</p>
                                            <p className="text-xs text-slate-300 mt-1">Search above to add students</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-50">
                                            {enrolledStudents.map(student => (
                                                <div key={student.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group">
                                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                                        style={{ background: colorTag }}>{initials(student)}</div>
                                                    <div className="flex-1 min-w-0">
                                                        <button onClick={() => { onClose(); navigate(`/students/${student.id}`); }}
                                                            className="text-sm font-bold text-slate-900 hover:underline text-left block truncate">
                                                            {student.first_name} {student.last_name}
                                                        </button>
                                                        <p className="text-xs text-slate-400 truncate">
                                                            {[student.current_grade, student.desired_course].filter(Boolean).join(' · ') || student.email}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${student.enrollment_type === 'recurring' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                                            {student.enrollment_type === 'recurring' ? '↻ Recurring' : 'Once'}
                                                        </span>
                                                        <button onClick={() => removeStudent(student)}
                                                            className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── Attendance tab ── */}
                        {activeTab === 'attendance' && (
                            <div className="p-4 space-y-3">
                                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-2">
                                    <AlertCircle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-700 font-medium">Feedback is required before marking <strong>Present</strong>. Not required for Absent.</p>
                                </div>

                                {enrolledStudents.length === 0 ? (
                                    <div className="bg-white rounded-2xl border border-slate-200 py-12 text-center text-slate-400">
                                        <Users size={32} className="mx-auto mb-2 opacity-30" />
                                        <p className="text-sm font-medium">No students enrolled</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {enrolledStudents.map(student => {
                                            const att = attendanceState[student.id];
                                            const feedback = feedbackState[student.id] || '';
                                            const hasError = feedbackError === student.id;
                                            const hasFeedback = feedback.trim().length > 0;

                                            return (
                                                <div key={student.id}
                                                    className={`bg-white rounded-2xl border transition-all ${hasError ? 'border-red-300' : att === 'present' ? 'border-emerald-200' : att === 'absent' ? 'border-red-200' : 'border-slate-200'}`}>
                                                    {/* Student + buttons */}
                                                    <div className="flex items-center gap-3 px-4 py-3">
                                                        <div className="relative w-9 h-9 flex-shrink-0">
                                                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold"
                                                                style={{ background: colorTag }}>{initials(student)}</div>
                                                            {att && (
                                                                <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${att === 'present' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                                                                    {att === 'present' ? <Check size={8} className="text-white" /> : <XCircle size={8} className="text-white" />}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold text-slate-900">{student.first_name} {student.last_name}</p>
                                                            <p className="text-xs text-slate-400">{[student.current_grade, student.desired_course].filter(Boolean).join(' · ')}</p>
                                                        </div>
                                                        <div className="flex gap-1.5 flex-shrink-0">
                                                            <button onClick={() => markAttendance(student.id, 'present')}
                                                                disabled={!hasFeedback}
                                                                title={!hasFeedback ? 'Write feedback first' : 'Mark Present'}
                                                                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${att === 'present' ? 'bg-emerald-500 text-white shadow-sm' : hasFeedback ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200' : 'bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-200'}`}>
                                                                <Check size={11} /> Present
                                                            </button>
                                                            <button onClick={() => markAttendance(student.id, 'absent')}
                                                                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${att === 'absent' ? 'bg-red-500 text-white shadow-sm' : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'}`}>
                                                                <XCircle size={11} /> Absent
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Feedback */}
                                                    <div className="px-4 pb-3">
                                                        <textarea rows={2} value={feedback}
                                                            onChange={e => { setFeedbackState(prev => ({ ...prev, [student.id]: e.target.value })); if (feedbackError === student.id) setFeedbackError(''); }}
                                                            placeholder={student.attendance?.notes ? `Prev: "${student.attendance.notes}"` : "Feedback / notes for this student…"}
                                                            className={`w-full text-xs px-3 py-2 border rounded-xl resize-none outline-none transition-all ${hasError ? 'border-red-300 bg-red-50 placeholder:text-red-400' : 'border-slate-200 bg-slate-50 focus:border-[#463a7a]/40 focus:ring-2 focus:ring-[#463a7a]/10 focus:bg-white'}`}
                                                        />
                                                        {hasError && <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1"><AlertCircle size={9} /> Feedback required to mark Present</p>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── Footer ── */}
                    <div className="px-5 py-3.5 border-t border-slate-200 bg-white flex items-center justify-between flex-shrink-0 rounded-b-3xl">
                        <div className="text-xs text-slate-500">
                            {isCancelled && <span className="text-red-500 font-semibold flex items-center gap-1"><Ban size={12} /> Cancelled</span>}
                            {!isCancelled && !isPublished && <span className="text-slate-400 font-semibold flex items-center gap-1"><EyeOff size={12} /> Draft — not visible</span>}
                        </div>
                        <button onClick={onClose}
                            className="px-5 py-2 text-white text-sm font-bold rounded-xl transition-all hover:opacity-90"
                            style={{ background: colorTag }}>
                            Done
                        </button>
                    </div>
                </div>
            </div>

            {/* Remove scope modal */}
            {removeTarget && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setRemoveTarget(null)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={20} className="text-red-500" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 text-center mb-1">Remove Student</h3>
                        <p className="text-sm text-slate-500 text-center mb-5">
                            Remove <span className="font-bold text-slate-800">{removeTarget.first_name} {removeTarget.last_name}</span> from:
                        </p>
                        <div className="space-y-2 mb-4">
                            <button onClick={() => doRemove(removeTarget.id, 'this_class')} disabled={removing}
                                className="w-full text-left px-4 py-3.5 rounded-2xl border-2 border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors disabled:opacity-50 group">
                                <p className="font-bold text-amber-800 text-sm flex items-center justify-between">
                                    This class only <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                                </p>
                                <p className="text-xs text-amber-600 mt-0.5">{fmtDate(session.date)} only</p>
                            </button>
                            <button onClick={() => doRemove(removeTarget.id, 'all_classes')} disabled={removing}
                                className="w-full text-left px-4 py-3.5 rounded-2xl border-2 border-red-200 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50 group">
                                <p className="font-bold text-red-800 text-sm flex items-center justify-between">
                                    All {weekday} {fmtTime(session.start_time)} classes <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                                </p>
                                <p className="text-xs text-red-600 mt-0.5">Removes from all recurring {weekday} sessions</p>
                            </button>
                        </div>
                        <button onClick={() => setRemoveTarget(null)}
                            className="w-full py-2.5 text-sm text-slate-600 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors font-semibold">
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Edit Repeats */}
            {showRepeats && <EditRepeatsModal session={session} onClose={() => setShowRepeats(false)} onUpdate={onUpdate} />}

            {/* Full Edit Dialog */}
            {showEditDialog && (
                <EditBatchDialog session={session} initialMode="single" isOpen={showEditDialog}
                    onClose={() => setShowEditDialog(false)}
                    onSaved={() => { onUpdate(); setShowEditDialog(false); }} />
            )}
        </>
    );
}
