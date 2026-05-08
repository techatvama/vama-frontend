import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../../lib/api';
import { parseSubject } from '../../lib/utils';
import {
    X, UserPlus, Check, XCircle, Clock, Calendar, Trash2,
    Users, AlertCircle, ChevronDown, Eye, EyeOff, Ban,
    Pencil, RefreshCw, MoreVertical,
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import EditBatchDialog from './EditBatchDialog';

const cn = (...inputs) => twMerge(clsx(inputs));

const fmtTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'pm' : 'am';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
};

const fmtDate = (d) => {
    if (!d) return '';
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });
};

// ─── Edit Repeats Modal ────────────────────────────────────────────────────
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
            await api.put(`/sessions/${session.id}/update-future`, {
                start_time: editTime.start,
                end_time: editTime.end,
            });
            onUpdate();
            onClose();
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const upcoming = series.filter(s => s.date >= today);

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Edit repetitions</h3>
                        <p className="text-sm text-gray-500">{series.length} total · {upcoming.length} upcoming sessions</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Bulk time edit */}
                <div className="px-6 py-3 bg-[#463A7A]/5 border-b border-[#463A7A]/10 flex items-center gap-3 flex-wrap">
                    <RefreshCw size={14} className="text-[#463A7A] flex-shrink-0" />
                    <span className="text-sm font-medium text-[#463A7A]">Update all upcoming times:</span>
                    <input type="time" value={editTime.start}
                        onChange={e => setEditTime(p => ({ ...p, start: e.target.value }))}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:border-[#463A7A] focus:outline-none focus:ring-1 focus:ring-[#463A7A]/30" />
                    <span className="text-gray-400">–</span>
                    <input type="time" value={editTime.end}
                        onChange={e => setEditTime(p => ({ ...p, end: e.target.value }))}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:border-[#463A7A] focus:outline-none focus:ring-1 focus:ring-[#463A7A]/30" />
                </div>

                {/* Series list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {loading ? (
                        <div className="text-center py-12 text-gray-400 animate-pulse">Loading sessions…</div>
                    ) : series.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">No sessions in this series</div>
                    ) : series.map((s, i) => {
                        const isPast = s.date < today;
                        const days = (() => {
                            try { return JSON.parse(s.batch?.days_of_week || '[]').join(', '); }
                            catch { return s.batch?.days_of_week || ''; }
                        })();
                        return (
                            <div key={s.id} className={cn(
                                "flex items-center gap-3 p-3 rounded-xl border transition-all",
                                isPast ? "bg-gray-50 border-gray-100 opacity-55" : "bg-white border-gray-200 hover:border-[#463A7A]/30 hover:shadow-sm"
                            )}>
                                <div className="w-8 h-8 rounded-full bg-[#463A7A]/10 flex items-center justify-center text-xs font-bold text-[#463A7A] flex-shrink-0">
                                    {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-sm text-gray-800 truncate">
                                        {parseSubject(s.batch?.subject) || 'Class'}{s.batch?.name ? ` — ${s.batch.name}` : ''}
                                    </div>
                                    <div className="text-xs text-gray-500 flex flex-wrap items-center gap-1.5 mt-0.5">
                                        {days && <span>Weekly ({days})</span>}
                                        {days && <span>·</span>}
                                        <span>{fmtTime(s.start_time)} – {fmtTime(s.end_time)}</span>
                                        <span>·</span>
                                        <span>{s.batch?.capacity} seats</span>
                                        {s.batch?.teacher && <><span>·</span><span>{s.batch.teacher.name}</span></>}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-0.5">{fmtDate(s.date)}</div>
                                </div>
                                {s.status === 'cancelled' && (
                                    <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">CANCELLED</span>
                                )}
                                {!isPast && s.status !== 'cancelled' && (
                                    <button onClick={() => deleteOne(s.id)}
                                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                        title="Delete this session">
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        Cancel
                    </button>
                    <button onClick={saveAll} disabled={saving}
                        className="px-5 py-2 text-sm font-semibold text-white bg-[#463A7A] rounded-lg hover:bg-[#342a5b] disabled:opacity-50 transition-colors">
                        {saving ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Actions Dropdown ──────────────────────────────────────────────────────
function ActionsMenu({ session, isPublished, onManageSeries, onPublish, onCancel, onDelete, onClose: closeMenu }) {
    const isCancelled = session.status === 'cancelled';
    const items = [
        {
            icon: <RefreshCw size={15} />,
            label: 'Manage series',
            sub: 'View / delete individual sessions in this series',
            onClick: onManageSeries,
            disabled: !session.recurrence_id,
        },
        { divider: true },
        {
            icon: isPublished ? <EyeOff size={15} /> : <Eye size={15} />,
            label: isPublished ? 'Unpublish class' : 'Publish class',
            sub: isPublished ? 'Hide from students & teachers' : 'Make visible to students & teachers',
            onClick: onPublish,
        },
        { divider: true },
        {
            icon: <Ban size={15} />,
            label: 'Cancel this class',
            sub: 'Mark cancelled — attendance unchanged',
            onClick: onCancel,
            disabled: isCancelled,
            danger: true,
        },
        {
            icon: <Trash2 size={15} />,
            label: 'Delete this class',
            sub: 'Permanently remove this slot',
            onClick: onDelete,
            danger: true,
        },
    ];

    return (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 py-2 z-20 overflow-hidden">
            {items.map((item, i) => {
                if (item.divider) return <div key={i} className="my-1 border-t border-gray-100" />;
                return (
                    <button key={i} disabled={item.disabled}
                        onClick={() => { item.onClick(); closeMenu(); }}
                        className={cn(
                            "w-full px-4 py-2.5 text-left flex items-start gap-3 transition-colors group",
                            item.disabled ? "opacity-40 cursor-not-allowed" :
                                item.danger ? "hover:bg-red-50" : "hover:bg-gray-50"
                        )}>
                        <span className={cn("mt-0.5 flex-shrink-0", item.danger ? "text-red-500" : "text-[#463A7A]")}>
                            {item.icon}
                        </span>
                        <div>
                            <div className={cn("text-sm font-semibold", item.danger ? "text-red-600" : "text-gray-800")}>
                                {item.label}
                            </div>
                            <div className="text-xs text-gray-400">{item.sub}</div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

// ─── Main Dialog ──────────────────────────────────────────────────────────
export default function EnhancedSessionDetailDialog({ session, isOpen, onClose, onUpdate }) {
    const navigate = useNavigate();
    const actionsRef = useRef(null);

    const [activeTab, setActiveTab] = useState('students');
    const [enrolledStudents, setEnrolledStudents] = useState([]);
    const [allStudents, setAllStudents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [attendanceState, setAttendanceState] = useState({});
    const [enrollmentType, setEnrollmentType] = useState('single_session');

    const [showActions, setShowActions] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [editDialogMode, setEditDialogMode] = useState('single');
    const [showRepeats, setShowRepeats] = useState(false);
    const [isPublished, setIsPublished] = useState(true);
    const [sessionStatus, setSessionStatus] = useState('scheduled');
    const [feedbackState, setFeedbackState] = useState({});  // { [studentId]: string }
    const [feedbackError, setFeedbackError] = useState('');   // validation message
    const [removeTarget, setRemoveTarget] = useState(null);   // student object to remove
    const [removing, setRemoving] = useState(false);

    // Close actions menu on outside click
    useEffect(() => {
        if (!showActions) return;
        const handler = (e) => {
            if (actionsRef.current && !actionsRef.current.contains(e.target)) setShowActions(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showActions]);

    useEffect(() => {
        if (isOpen && session) {
            fetchSessionStudents();
            fetchAllStudents();
            setIsPublished(session.is_published !== false);
            setSessionStatus(session.status || 'scheduled');
            setShowEditDialog(false);
            setShowActions(false);
            setActiveTab('students');
            setFeedbackState({});
            setFeedbackError('');
            setRemoveTarget(null);
        }
    }, [isOpen, session?.id]);

    const fetchSessionStudents = async () => {
        if (!session?.id) return;
        try {
            const res = await api.get(`/sessions/${session.id}/students`);
            setEnrolledStudents(res.data);
            const attState = {};
            const fbState = {};
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
        try {
            const res = await api.get('/students');
            setAllStudents(res.data);
        } catch (e) { console.error(e); }
    };

    const enrollStudent = async (studentId) => {
        try {
            await api.post(`/sessions/${session.id}/enroll`, null, {
                params: { student_id: studentId, enrollment_type: enrollmentType }
            });
            fetchSessionStudents();
            setSearchQuery('');
            onUpdate();
        } catch (e) {
            console.error(e);
            alert(`Failed to enroll: ${e.response?.data?.detail || e.message}`);
        }
    };

    const removeStudent = (student) => {
        // For recurring students, ask scope; for single-session, remove directly
        if (student.enrollment_type === 'recurring') {
            setRemoveTarget(student);
        } else {
            doRemove(student.id, 'this_class');
        }
    };

    const doRemove = async (studentId, scope) => {
        setRemoving(true);
        try {
            await api.delete(`/sessions/${session.id}/students/${studentId}`, {
                params: { scope }
            });
            setEnrolledStudents(prev => prev.filter(s => s.id !== studentId));
            setRemoveTarget(null);
            onUpdate();
        } catch (e) {
            console.error(e);
            alert(e.response?.data?.detail || 'Failed to remove student');
        } finally {
            setRemoving(false);
        }
    };

    const markAttendance = async (studentId, status) => {
        const notes = (feedbackState[studentId] || '').trim();
        if (!notes) {
            setFeedbackError(studentId);
            return;
        }
        setFeedbackError('');
        setAttendanceState(prev => ({ ...prev, [studentId]: status }));
        try {
            await api.put(`/sessions/${session.id}/attendance/${studentId}`, null, {
                params: { status, notes, require_feedback: true },
            });
            onUpdate();
        } catch (e) {
            console.error(e);
            if (e.response?.data?.detail) alert(e.response.data.detail);
        }
    };

    const handlePublish = async () => {
        try {
            const res = await api.put(`/sessions/${session.id}/publish`);
            setIsPublished(res.data.is_published);
            onUpdate();
        } catch (e) { console.error(e); }
    };

    const handleCancel = async () => {
        if (!confirm('Cancel this class? Attendance records will not be affected.')) return;
        try {
            await api.put(`/sessions/${session.id}/cancel`);
            setSessionStatus('cancelled');
            onUpdate();
        } catch (e) { console.error(e); }
    };

    const handleDelete = async () => {
        if (!confirm('Permanently delete this class? This cannot be undone.')) return;
        try {
            await api.delete(`/sessions/${session.id}`);
            onUpdate();
            onClose();
        } catch (e) { console.error(e); }
    };

    if (!isOpen || !session) return null;

    const enrollmentCount = enrolledStudents.length;
    const capacity = session.batch?.capacity || 0;
    const isFullyBooked = enrollmentCount >= capacity;
    const isCancelled = sessionStatus === 'cancelled';

    const filteredStudents = allStudents.filter(s =>
        !enrolledStudents.find(es => es.id === s.id) &&
        (`${s.first_name} ${s.last_name}`).toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col"
                    onClick={e => e.stopPropagation()}>

                    {/* ── Header ── */}
                    <div className={cn(
                        "p-5 border-b border-gray-100",
                        isCancelled ? "bg-gradient-to-r from-red-50 to-orange-50" :
                            !isPublished ? "bg-gradient-to-r from-gray-50 to-slate-100" :
                                "bg-gradient-to-r from-purple-50 to-blue-50"
                    )}>
                        <div className="flex items-start justify-between gap-3">
                            {/* Left: info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2.5 flex-wrap mb-1">
                                    <h2 className="text-xl font-bold text-gray-900 truncate">
                                        {parseSubject(session.batch?.subject) || 'Class Details'}
                                    </h2>
                                    {session.batch?.color_tag && (
                                        <div className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                                            style={{ backgroundColor: session.batch.color_tag }} />
                                    )}
                                    {/* Status badges */}
                                    {isCancelled && (
                                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">Cancelled</span>
                                    )}
                                    {!isPublished && (
                                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                                            <EyeOff size={10} /> Draft
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                                    <div className="flex items-center gap-1.5">
                                        <Clock size={13} className="text-[#463A7A]" />
                                        <span className="font-medium">{fmtTime(session.start_time)} – {fmtTime(session.end_time)}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Calendar size={13} className="text-[#463A7A]" />
                                        <span className="font-medium">{fmtDate(session.date)}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Users size={13} className={isFullyBooked ? "text-orange-500" : "text-[#463A7A]"} />
                                        <span className={cn("font-medium", isFullyBooked && "text-orange-600")}>
                                            {enrollmentCount}/{capacity}
                                        </span>
                                    </div>
                                    {session.batch?.teacher && (
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-5 h-5 rounded-full bg-[#463A7A]/20 flex items-center justify-center text-[9px] font-black text-[#463A7A]">
                                                {session.batch.teacher.name[0]}
                                            </div>
                                            <span className="font-semibold text-[#463A7A]">{session.batch.teacher.name}</span>
                                        </div>
                                    )}
                                </div>

                                {session.notes && (
                                    <p className="mt-2 text-xs text-gray-500 italic bg-white/60 px-2 py-1 rounded-lg">
                                        {session.notes}
                                    </p>
                                )}
                            </div>

                            {/* Right: Edit + Actions + Close */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {/* Prominent Edit button */}
                                <button
                                    onClick={() => { setEditDialogMode('single'); setShowEditDialog(true); }}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-[#463A7A] text-white rounded-lg text-sm font-semibold hover:bg-[#342a5b] shadow-sm transition-all"
                                >
                                    <Pencil size={14} /> Edit
                                </button>

                                {/* Actions dropdown (publish / cancel / delete) */}
                                <div className="relative" ref={actionsRef}>
                                    <button
                                        onClick={() => setShowActions(v => !v)}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 shadow-sm transition-all"
                                    >
                                        <MoreVertical size={14} />
                                    </button>
                                    {showActions && (
                                        <ActionsMenu
                                            session={{ ...session, status: sessionStatus }}
                                            isPublished={isPublished}
                                            onManageSeries={() => setShowRepeats(true)}
                                            onPublish={handlePublish}
                                            onCancel={handleCancel}
                                            onDelete={handleDelete}
                                            onClose={() => setShowActions(false)}
                                        />
                                    )}
                                </div>

                                <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-lg transition-colors">
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>
                        </div>

                    </div>

                    {/* ── Tabs ── */}
                    <div className="flex border-b border-gray-100 px-5 bg-gray-50 flex-shrink-0">
                        {[
                            { key: 'students', label: `Students (${enrollmentCount})` },
                            { key: 'attendance', label: 'Attendance' },
                        ].map(t => (
                            <button key={t.key} onClick={() => setActiveTab(t.key)}
                                className={cn("py-3 px-4 text-sm font-semibold border-b-2 transition-colors",
                                    activeTab === t.key
                                        ? "border-[#463A7A] text-[#463A7A]"
                                        : "border-transparent text-gray-500 hover:text-gray-700")}>
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* ── Body ── */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-5">

                        {/* ─── Students tab ─── */}
                        {activeTab === 'students' && (
                            <>
                                {/* Add Student panel */}
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                                        <UserPlus size={15} className="text-blue-600" />
                                        Add Student to Class
                                    </h3>

                                    {/* Search */}
                                    <input
                                        type="text"
                                        placeholder="Search student name…"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-[#463A7A] focus:ring-2 focus:ring-[#463A7A]/15 bg-white mb-3"
                                    />

                                    {/* Enrollment type */}
                                    <div className="flex gap-4 mb-3">
                                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                                            <input type="radio" name="etype" value="single_session"
                                                checked={enrollmentType === 'single_session'}
                                                onChange={() => setEnrollmentType('single_session')}
                                                className="accent-[#463A7A]" />
                                            <span className="font-medium text-gray-700">This class only</span>
                                        </label>
                                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                                            <input type="radio" name="etype" value="recurring"
                                                checked={enrollmentType === 'recurring'}
                                                onChange={() => setEnrollmentType('recurring')}
                                                className="accent-[#463A7A]" />
                                            <span className="font-medium text-gray-700">All future recurring classes</span>
                                        </label>
                                    </div>

                                    {/* Results */}
                                    {searchQuery && (
                                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden max-h-44 overflow-y-auto">
                                            {filteredStudents.slice(0, 8).map(s => (
                                                <div key={s.id}
                                                    className="p-3 hover:bg-[#463A7A]/5 cursor-pointer flex justify-between items-center border-b border-gray-50 last:border-0 transition-colors"
                                                    onClick={() => enrollStudent(s.id)}>
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                            {s.first_name[0]}{s.last_name[0]}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-sm text-gray-800">{s.first_name} {s.last_name}</div>
                                                            <div className="text-xs text-gray-400">{s.email}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-semibold",
                                                            enrollmentType === 'single_session'
                                                                ? "bg-orange-100 text-orange-700"
                                                                : "bg-green-100 text-green-700")}>
                                                            {enrollmentType === 'single_session' ? 'Once' : 'Recurring'}
                                                        </span>
                                                        <UserPlus size={15} className="text-[#463A7A]" />
                                                    </div>
                                                </div>
                                            ))}
                                            {filteredStudents.length === 0 && (
                                                <div className="p-4 text-sm text-gray-400 text-center">No students found</div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Enrolled Students List */}
                                <div>
                                    <h3 className="font-semibold text-gray-800 mb-3 text-sm">Enrolled Students</h3>
                                    {enrolledStudents.length === 0 ? (
                                        <div className="text-center py-10 text-gray-400">
                                            <Users size={40} className="mx-auto mb-2 opacity-40" />
                                            <p className="text-sm">No students enrolled yet</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {enrolledStudents.map(student => (
                                                <div key={student.id}
                                                    className="flex justify-between items-center p-3.5 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition-shadow">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                                            {student.first_name[0]}{student.last_name[0]}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <button
                                                                onClick={() => { onClose(); navigate(`/students/${student.id}`); }}
                                                                className="font-semibold text-sm text-[#463a7a] hover:underline text-left block truncate">
                                                                {student.first_name} {student.last_name}
                                                            </button>
                                                            <div className="text-xs text-gray-400 truncate">{student.email}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold",
                                                            student.enrollment_type === 'recurring'
                                                                ? "bg-green-100 text-green-700"
                                                                : "bg-orange-100 text-orange-700")}>
                                                            {student.enrollment_type === 'recurring' ? 'Recurring' : 'Once'}
                                                        </span>
                                                        <button onClick={() => removeStudent(student)}
                                                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Remove student">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* ─── Attendance tab ─── */}
                        {activeTab === 'attendance' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-800 text-sm">Mark Attendance + Feedback</h3>
                                    <span className="text-xs text-amber-600 font-semibold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <AlertCircle size={11} /> Feedback required
                                    </span>
                                </div>

                                {/* helper hint */}
                                <div className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                                    Write feedback for each student first, then mark Present or Absent. Feedback syncs instantly to the student and admin portals.
                                </div>

                                {enrolledStudents.length === 0 ? (
                                    <div className="text-center py-10 text-gray-400">
                                        <AlertCircle size={40} className="mx-auto mb-2 opacity-40" />
                                        <p className="text-sm">No students to mark attendance</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {enrolledStudents.map(student => {
                                            const att = attendanceState[student.id];
                                            const feedback = feedbackState[student.id] || '';
                                            const hasError = feedbackError === student.id;
                                            const hasFeedback = feedback.trim().length > 0;
                                            const existingFeedback = student.attendance?.notes;

                                            return (
                                                <div key={student.id}
                                                    className={cn("p-4 rounded-xl border transition-all",
                                                        hasError ? "border-red-300 bg-red-50/30" :
                                                        att ? "border-[#463A7A]/20 bg-[#463A7A]/3" :
                                                        "border-gray-100 bg-gray-50")}>

                                                    {/* Student row */}
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-8 h-8 rounded-full bg-[#463A7A]/10 flex items-center justify-center text-[#463A7A] font-bold text-xs flex-shrink-0">
                                                                {student.first_name[0]}{student.last_name[0]}
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-sm text-gray-800">{student.first_name} {student.last_name}</div>
                                                                {att && (
                                                                    <span className={cn("text-[10px] font-bold",
                                                                        att === 'present' ? "text-green-600" : "text-red-500")}>
                                                                        {att === 'present' ? '✓ Present' : '✗ Absent'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1.5">
                                                            <button onClick={() => markAttendance(student.id, 'present')}
                                                                title={!hasFeedback ? 'Add feedback first' : 'Mark Present'}
                                                                className={cn("px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1",
                                                                    att === 'present'
                                                                        ? "bg-green-500 text-white shadow-sm"
                                                                        : hasFeedback
                                                                            ? "bg-white text-gray-600 border border-gray-200 hover:bg-green-50 hover:border-green-300"
                                                                            : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-50")}>
                                                                <Check size={12} /> Present
                                                            </button>
                                                            <button onClick={() => markAttendance(student.id, 'absent')}
                                                                title={!hasFeedback ? 'Add feedback first' : 'Mark Absent'}
                                                                className={cn("px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1",
                                                                    att === 'absent'
                                                                        ? "bg-red-500 text-white shadow-sm"
                                                                        : hasFeedback
                                                                            ? "bg-white text-gray-600 border border-gray-200 hover:bg-red-50 hover:border-red-300"
                                                                            : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-50")}>
                                                                <XCircle size={12} /> Absent
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Feedback textarea */}
                                                    <div className="relative">
                                                        <textarea
                                                            rows={2}
                                                            value={feedback}
                                                            onChange={e => {
                                                                setFeedbackState(prev => ({ ...prev, [student.id]: e.target.value }));
                                                                if (feedbackError === student.id) setFeedbackError('');
                                                            }}
                                                            placeholder={existingFeedback ? `Previous: "${existingFeedback}"` : "Add feedback for this student… (required to mark attendance)"}
                                                            className={cn(
                                                                "w-full text-xs px-3 py-2 border rounded-lg resize-none outline-none transition-all",
                                                                hasError
                                                                    ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200 placeholder:text-red-400"
                                                                    : hasFeedback
                                                                        ? "border-[#463A7A]/30 focus:border-[#463A7A] focus:ring-2 focus:ring-[#463A7A]/10 bg-white"
                                                                        : "border-gray-200 bg-white focus:border-[#463A7A]/40 focus:ring-2 focus:ring-[#463A7A]/10"
                                                            )}
                                                        />
                                                        {hasError && (
                                                            <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                                                                <AlertCircle size={10} /> Please write feedback before marking attendance
                                                            </p>
                                                        )}
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
                    <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center flex-shrink-0">
                        <div className="text-sm text-gray-500">
                            {isFullyBooked && (
                                <span className="text-orange-600 font-semibold flex items-center gap-1">
                                    <AlertCircle size={14} /> Class is fully booked
                                </span>
                            )}
                            {isCancelled && (
                                <span className="text-red-600 font-semibold flex items-center gap-1">
                                    <Ban size={14} /> This class is cancelled
                                </span>
                            )}
                        </div>
                        <button onClick={onClose}
                            className="px-6 py-2 bg-[#463A7A] text-white rounded-xl hover:bg-[#342a5b] font-semibold text-sm transition-colors">
                            Done
                        </button>
                    </div>
                </div>
            </div>

            {/* Remove Student Scope Modal */}
            {removeTarget && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setRemoveTarget(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-base font-bold text-gray-900 mb-1">Remove Student</h3>
                        <p className="text-sm text-gray-500 mb-5">
                            Remove <span className="font-semibold text-gray-800">{removeTarget.first_name} {removeTarget.last_name}</span> from:
                        </p>
                        <div className="space-y-2 mb-5">
                            <button
                                onClick={() => doRemove(removeTarget.id, 'this_class')}
                                disabled={removing}
                                className="w-full text-left px-4 py-3 rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100 transition-colors disabled:opacity-50">
                                <div className="font-semibold text-orange-800 text-sm">This class only</div>
                                <div className="text-xs text-orange-600 mt-0.5">Removes from {fmtDate(session.date)} only</div>
                            </button>
                            <button
                                onClick={() => doRemove(removeTarget.id, 'all_future')}
                                disabled={removing}
                                className="w-full text-left px-4 py-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50">
                                <div className="font-semibold text-red-800 text-sm">All future recurring classes</div>
                                <div className="text-xs text-red-600 mt-0.5">Stops all future sessions from {fmtDate(session.date)}</div>
                            </button>
                        </div>
                        <button onClick={() => setRemoveTarget(null)} className="w-full px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Edit Repeats Modal (series list / delete repetitions) */}
            {showRepeats && (
                <EditRepeatsModal
                    session={session}
                    onClose={() => setShowRepeats(false)}
                    onUpdate={onUpdate}
                />
            )}

            {/* Full Edit Dialog */}
            {showEditDialog && (
                <EditBatchDialog
                    session={session}
                    initialMode={editDialogMode}
                    isOpen={showEditDialog}
                    onClose={() => setShowEditDialog(false)}
                    onSaved={() => { onUpdate(); setShowEditDialog(false); }}
                />
            )}
        </>
    );
}
