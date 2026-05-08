import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { format } from 'date-fns';
import { api } from '../../lib/api';
import { parseSubject } from '../../lib/utils';
import {
    ArrowLeft,
    CheckCircle2,
    X,
    Clock,
    User,
    TrendingUp,
    Loader2,
    Calendar,
    Plus,
    Search,
    AlertCircle,
    Users,
    BookOpen,
    MessageSquare,
    Trash2
} from 'lucide-react';
import StudentProgressEditor from '../StudentProgressEditor';

function LiveBadge({ lastRefresh }) {
    return (
        <div className="flex items-center gap-2 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            Live · {format(lastRefresh, 'HH:mm')}
        </div>
    );
}

export default function TeacherSessionDetails() {
    const { sessionId } = useParams();
    const navigate = useNavigate();

    const [session, setSession] = useState(null);
    const [enrolledStudents, setEnrolledStudents] = useState([]);
    const [allStudents, setAllStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingAttendance, setSavingAttendance] = useState({});
    const [feedbackState, setFeedbackState] = useState({});
    const [feedbackError, setFeedbackError] = useState('');
    const [showProgressModal, setShowProgressModal] = useState(null);
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [enrollSearch, setEnrollSearch] = useState('');
    const [enrollType, setEnrollType] = useState('single_session'); // 'single_session' | 'recurring'
    const [enrolling, setEnrolling] = useState(null);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [removeTarget, setRemoveTarget] = useState(null); // { id, first_name, last_name, enrollment_type }
    const [removing, setRemoving] = useState(false);
    const feedbackInitialized = useRef(false);

    useEffect(() => {
        fetchAll();
        fetchAllStudents();
    }, [sessionId]);

    // Real-time polling
    useEffect(() => {
        if (!sessionId) return;
        const interval = setInterval(fetchAll, 20000);
        return () => clearInterval(interval);
    }, [sessionId]);

    // Pre-fill feedback from attendance notes — only on first load
    useEffect(() => {
        if (enrolledStudents.length > 0 && !feedbackInitialized.current) {
            feedbackInitialized.current = true;
            const initial = {};
            enrolledStudents.forEach(s => {
                if (s.attendance?.notes) initial[s.id] = s.attendance.notes;
            });
            setFeedbackState(initial);
        }
    }, [enrolledStudents]);

    const fetchAll = async () => {
        await Promise.all([fetchSessionDetails(), fetchEnrolledStudents()]);
        setLastRefresh(new Date());
    };

    const fetchSessionDetails = async () => {
        try {
            const res = await api.get(`/sessions/${sessionId}`);
            setSession(res.data);
        } catch (e) {
            console.error('Failed to fetch session', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchEnrolledStudents = async () => {
        try {
            const res = await api.get(`/sessions/${sessionId}/students`);
            setEnrolledStudents(res.data);
        } catch (e) {
            console.error('Failed to fetch students', e);
        }
    };

    const fetchAllStudents = async () => {
        try {
            const res = await api.get('/students');
            setAllStudents(res.data);
        } catch (e) {}
    };

    const handleAttendanceChange = async (studentId, status) => {
        const notes = (feedbackState[studentId] || '').trim();
        if (!notes) {
            setFeedbackError(String(studentId));
            return;
        }
        setFeedbackError('');
        setSavingAttendance(prev => ({ ...prev, [studentId]: true }));
        try {
            await api.put(`/sessions/${sessionId}/attendance/${studentId}`, null, {
                params: { status, notes, require_feedback: true }
            });
            await fetchEnrolledStudents();
            setLastRefresh(new Date());
        } catch (error) {
            console.error(error);
        } finally {
            setSavingAttendance(prev => ({ ...prev, [studentId]: false }));
        }
    };

    const closeEnrollModal = () => {
        setShowEnrollModal(false);
        setEnrollSearch('');
        setEnrollType('single_session');
    };

    const handleEnroll = async (studentId) => {
        setEnrolling(studentId);
        try {
            await api.post(`/sessions/${sessionId}/enroll`, null, {
                params: { student_id: studentId, enrollment_type: enrollType }
            });
            await fetchEnrolledStudents();
            closeEnrollModal();
        } catch (e) {
            console.error(e);
        } finally {
            setEnrolling(null);
        }
    };

    const handleRemove = async (scope) => {
        if (!removeTarget) return;
        setRemoving(true);
        try {
            await api.delete(`/sessions/${sessionId}/students/${removeTarget.id}`, {
                params: { scope }
            });
            await fetchEnrolledStudents();
            setRemoveTarget(null);
        } catch (e) {
            console.error(e);
        } finally {
            setRemoving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="w-8 h-8 text-[#463a7a] animate-spin" />
        </div>
    );

    if (!session) return (
        <div className="p-12 text-center">
            <h2 className="text-2xl font-black text-slate-900 mb-4">Session Not Found</h2>
            <button onClick={() => navigate(-1)} className="text-[#463a7a] font-bold underline">Go Back</button>
        </div>
    );

    const enrolledIds = new Set(enrolledStudents.map(s => s.id));
    const filteredEnroll = allStudents.filter(s =>
        !enrolledIds.has(s.id) &&
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(enrollSearch.toLowerCase())
    );

    const presentCount = enrolledStudents.filter(s => s.attendance?.status === 'present').length;
    const absentCount = enrolledStudents.filter(s => s.attendance?.status === 'absent').length;
    const pendingCount = Math.max(0, enrolledStudents.length - presentCount - absentCount);

    const sessionDateDisplay = session.date
        ? new Date(session.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        : '—';

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header Banner */}
            <div className="bg-[#463a7a] lg:rounded-b-[60px] p-5 lg:p-12 pb-24 lg:pb-32">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-5 lg:mb-8">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-11 h-11 lg:w-12 lg:h-12 flex items-center justify-center bg-white/10 rounded-2xl text-white hover:bg-white/20 transition-all border border-white/5"
                        >
                            <ArrowLeft className="w-5 h-5 lg:w-6 lg:h-6" />
                        </button>
                        <LiveBadge lastRefresh={lastRefresh} />
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 lg:gap-8">
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                                <span className="px-3 lg:px-4 py-1.5 bg-orange-400 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-orange-900/20">
                                    {parseSubject(session.batch?.subject) || 'Class'}
                                </span>
                                <span className="text-indigo-200/60 font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5">
                                    <Clock size={12} />
                                    {session.start_time} – {session.end_time}
                                </span>
                            </div>
                            <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tighter leading-[0.9]">
                                {session.batch?.name || `${parseSubject(session.batch?.subject) || ''} Session`}
                            </h1>
                        </div>

                        <div className="flex items-center gap-3 lg:gap-4 bg-white/5 p-3 lg:p-4 rounded-[24px] lg:rounded-[32px] border border-white/5 self-start lg:self-auto">
                            <div className="w-11 h-11 lg:w-14 lg:h-14 bg-white rounded-2xl flex items-center justify-center shadow-xl flex-shrink-0">
                                <Calendar size={20} className="text-[#463a7a]" />
                            </div>
                            <div>
                                <p className="text-indigo-100/40 text-[9px] font-black uppercase tracking-widest leading-none mb-1">Session Date</p>
                                <p className="text-base lg:text-xl font-black text-white">{sessionDateDisplay}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 lg:px-8 -mt-14 lg:-mt-20 space-y-5 lg:space-y-8 pb-20">
                {/* Stats Strip */}
                <div className="grid grid-cols-3 gap-3 lg:gap-5">
                    {[
                        { label: 'Present', count: presentCount, bar: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
                        { label: 'Absent', count: absentCount, bar: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700' },
                        { label: 'Pending', count: pendingCount, bar: 'bg-slate-300', bg: 'bg-slate-50', text: 'text-slate-600' },
                    ].map(stat => (
                        <div key={stat.label} className={`${stat.bg} rounded-[20px] lg:rounded-[28px] p-3 lg:p-6 flex items-center gap-2 lg:gap-4`}>
                            <div className={`w-1.5 lg:w-2 h-7 lg:h-10 ${stat.bar} rounded-full flex-shrink-0`} />
                            <div>
                                <p className={`text-xl lg:text-4xl font-black ${stat.text}`}>{stat.count}</p>
                                <p className={`text-[8px] lg:text-[10px] font-black uppercase tracking-widest ${stat.text} opacity-60`}>{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-8">
                    {/* Attendance List */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-[28px] lg:rounded-[40px] shadow-2xl shadow-indigo-900/10 overflow-hidden border border-slate-100">
                            <div className="p-5 lg:p-8 border-b border-slate-50 flex items-center justify-between gap-3">
                                <h2 className="text-lg lg:text-2xl font-black text-slate-900 flex items-center gap-2 lg:gap-3">
                                    <User className="w-5 lg:w-7 h-5 lg:h-7 text-[#463a7a]" />
                                    Attendance
                                    <span className="text-sm font-bold text-slate-400 ml-1">({enrolledStudents.length})</span>
                                </h2>
                                <button
                                    onClick={() => setShowEnrollModal(true)}
                                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white bg-[#463a7a] hover:bg-[#3a2f66] px-3 lg:px-4 py-2.5 rounded-xl transition-all whitespace-nowrap shadow-md"
                                >
                                    <Plus className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                                    Add Student
                                </button>
                            </div>

                            <div className="divide-y divide-slate-50">
                                {enrolledStudents.length > 0 ? enrolledStudents.map(student => {
                                    const att = student.attendance;
                                    const isPresent = att?.status === 'present';
                                    const isAbsent = att?.status === 'absent';
                                    const isCancelled = att?.status === 'student_cancelled';
                                    const hasError = feedbackError === String(student.id);
                                    const hasFeedback = (feedbackState[student.id] || '').trim().length > 0;

                                    return (
                                        <div key={student.id} className="p-4 lg:p-7 hover:bg-slate-50/50 transition-colors">
                                            {/* Student info row */}
                                            <div className="flex items-center gap-3 lg:gap-4 mb-3 lg:mb-4">
                                                <div className="w-11 h-11 lg:w-14 lg:h-14 bg-slate-50 rounded-[18px] lg:rounded-[24px] flex items-center justify-center border border-slate-100 shadow-sm relative overflow-hidden flex-shrink-0">
                                                    <span className="text-base lg:text-lg font-black text-[#463a7a]">
                                                        {student.first_name?.[0]}
                                                    </span>
                                                    <div className={`absolute bottom-0 left-0 right-0 h-0.5 lg:h-1 ${isPresent ? 'bg-emerald-500' : isAbsent ? 'bg-red-500' : isCancelled ? 'bg-orange-400' : 'bg-slate-200'}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-sm lg:text-base font-black text-slate-900 truncate">
                                                        {student.first_name} {student.last_name}
                                                    </h3>
                                                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                                        <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full ${
                                                            student.enrollment_type === 'single_session'
                                                                ? 'bg-orange-100 text-orange-600'
                                                                : 'bg-slate-100 text-slate-500'
                                                        }`}>
                                                            {student.enrollment_type === 'single_session' ? 'This class only' : 'Recurring'}
                                                        </span>
                                                        {isCancelled && (
                                                            <span className="px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 text-[8px] font-black uppercase tracking-widest">
                                                                Self-Cancelled
                                                            </span>
                                                        )}
                                                        {isPresent && (
                                                            <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-600 text-[8px] font-black uppercase tracking-widest">
                                                                Present ✓
                                                            </span>
                                                        )}
                                                        {isAbsent && (
                                                            <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 text-[8px] font-black uppercase tracking-widest">
                                                                Absent
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                                    <button
                                                        onClick={() => setShowProgressModal(student)}
                                                        className="p-2.5 lg:p-3 bg-[#463a7a]/5 text-[#463a7a] rounded-xl lg:rounded-2xl hover:bg-[#463a7a] hover:text-white transition-all"
                                                        title="View progress"
                                                    >
                                                        <TrendingUp size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => setRemoveTarget(student)}
                                                        className="p-2.5 lg:p-3 bg-red-50 text-red-400 rounded-xl lg:rounded-2xl hover:bg-red-500 hover:text-white transition-all"
                                                        title="Remove student"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Feedback textarea */}
                                            <div className="mb-3">
                                                <div className="relative">
                                                    <MessageSquare size={13} className="absolute left-3 top-3 text-slate-300 pointer-events-none" />
                                                    <textarea
                                                        rows={2}
                                                        placeholder="Write feedback before marking attendance..."
                                                        value={feedbackState[student.id] || ''}
                                                        onChange={(e) => {
                                                            setFeedbackState(prev => ({ ...prev, [student.id]: e.target.value }));
                                                            if (feedbackError === String(student.id)) setFeedbackError('');
                                                        }}
                                                        className={`w-full bg-slate-50 border rounded-2xl py-2.5 pl-9 pr-4 text-xs font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 transition-all resize-none
                                                            ${hasError
                                                                ? 'border-red-300 focus:ring-red-200 bg-red-50/50'
                                                                : 'border-slate-100 focus:ring-[#463a7a]/5 focus:bg-white'}`}
                                                    />
                                                </div>
                                                {hasError && (
                                                    <p className="mt-1 text-[9px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1">
                                                        <AlertCircle size={9} />
                                                        Feedback required before marking attendance
                                                    </p>
                                                )}
                                            </div>

                                            {/* Present / Absent buttons */}
                                            <div className="flex items-center gap-2 lg:gap-3">
                                                <button
                                                    onClick={() => handleAttendanceChange(student.id, 'present')}
                                                    disabled={savingAttendance[student.id]}
                                                    className={`flex-1 flex items-center justify-center gap-1.5 lg:gap-2 px-3 lg:px-5 py-2.5 lg:py-3.5 rounded-xl lg:rounded-2xl font-black text-[10px] lg:text-xs transition-all
                                                        ${isPresent
                                                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                                            : hasFeedback
                                                            ? 'bg-slate-50 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-100'
                                                            : 'bg-slate-50 text-slate-200 border border-slate-100 cursor-not-allowed'}`}
                                                >
                                                    {savingAttendance[student.id]
                                                        ? <Loader2 size={14} className="animate-spin" />
                                                        : <CheckCircle2 size={14} />}
                                                    PRESENT
                                                </button>
                                                <button
                                                    onClick={() => handleAttendanceChange(student.id, 'absent')}
                                                    disabled={savingAttendance[student.id]}
                                                    className={`flex-1 flex items-center justify-center gap-1.5 lg:gap-2 px-3 lg:px-5 py-2.5 lg:py-3.5 rounded-xl lg:rounded-2xl font-black text-[10px] lg:text-xs transition-all
                                                        ${isAbsent
                                                            ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                                                            : hasFeedback
                                                            ? 'bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-600 border border-slate-100'
                                                            : 'bg-slate-50 text-slate-200 border border-slate-100 cursor-not-allowed'}`}
                                                >
                                                    {savingAttendance[student.id]
                                                        ? <Loader2 size={14} className="animate-spin" />
                                                        : <X size={14} />}
                                                    ABSENT
                                                </button>
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="p-14 lg:p-20 text-center">
                                        <User size={40} className="mx-auto text-slate-100 mb-4" />
                                        <p className="text-slate-400 font-bold text-sm">No students added yet.</p>
                                        <button
                                            onClick={() => { setEnrollType('single_session'); setShowEnrollModal(true); }}
                                            className="mt-4 inline-flex items-center gap-1.5 text-[#463a7a] font-black text-xs underline underline-offset-4 hover:text-purple-700"
                                        >
                                            <Plus size={13} /> Add first student
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-5 lg:space-y-8">
                        {/* Session Info */}
                        <div className="bg-white rounded-[28px] lg:rounded-[40px] p-5 lg:p-8 shadow-2xl shadow-indigo-900/10 border border-slate-100">
                            <h3 className="text-base lg:text-xl font-black text-slate-900 mb-4 lg:mb-5 flex items-center gap-2 lg:gap-3">
                                <BookOpen size={18} className="text-indigo-400" />
                                Session Info
                            </h3>
                            <div className="space-y-0">
                                {[
                                    { label: 'Subject', value: parseSubject(session.batch?.subject) || '—' },
                                    { label: 'Batch', value: session.batch?.name || '—' },
                                    { label: 'Time', value: `${session.start_time} – ${session.end_time}` },
                                    { label: 'Date', value: sessionDateDisplay },
                                    { label: 'Students', value: `${enrolledStudents.length} enrolled` },
                                ].map(row => (
                                    <div key={row.label} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                                        <span className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">{row.label}</span>
                                        <span className="text-xs lg:text-sm font-black text-slate-900 text-right max-w-[55%] truncate">{row.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Attendance Rate */}
                        <div className="bg-gradient-to-br from-[#463a7a] to-purple-700 rounded-[28px] lg:rounded-[40px] p-5 lg:p-8 text-white relative overflow-hidden shadow-2xl">
                            <div className="relative z-10">
                                <h3 className="text-base lg:text-xl font-black leading-none mb-5 uppercase tracking-tight">
                                    Attendance Rate
                                </h3>
                                {enrolledStudents.length > 0 ? (
                                    <>
                                        <div className="text-4xl lg:text-5xl font-black mb-1">
                                            {Math.round((presentCount / enrolledStudents.length) * 100)}%
                                        </div>
                                        <p className="text-indigo-200/60 text-[10px] font-bold mb-4">
                                            {presentCount} present · {absentCount} absent · {pendingCount} pending
                                        </p>
                                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-yellow-400 rounded-full transition-all duration-700"
                                                style={{ width: `${(presentCount / enrolledStudents.length) * 100}%` }}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-indigo-200/40 text-sm font-bold">No students enrolled</p>
                                )}
                            </div>
                            <Users className="absolute -bottom-8 -right-8 w-36 lg:w-44 h-36 lg:h-44 text-white/5" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Modal */}
            {showProgressModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setShowProgressModal(null)} />
                    <div className="relative bg-white rounded-[40px] lg:rounded-[60px] w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                        <div className="p-6 lg:p-8 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tighter">Progress Tracker</h2>
                                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">
                                    {showProgressModal.first_name} {showProgressModal.last_name}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowProgressModal(null)}
                                className="w-12 h-12 flex items-center justify-center bg-slate-50 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all"
                            >
                                <X size={22} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
                            <StudentProgressEditor studentIdFromProps={showProgressModal.id} />
                        </div>
                    </div>
                </div>
            )}

            {/* Remove Student Modal */}
            {removeTarget && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setRemoveTarget(null)} />
                    <div className="relative bg-white rounded-[36px] w-full max-w-sm overflow-hidden shadow-2xl">
                        <div className="p-6 bg-red-500 text-white">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                                <Trash2 size={22} />
                            </div>
                            <h3 className="text-xl font-black tracking-tighter">Remove Student</h3>
                            <p className="text-red-200 text-sm font-bold mt-1">
                                {removeTarget.first_name} {removeTarget.last_name}
                            </p>
                        </div>
                        <div className="p-6 space-y-3">
                            <p className="text-slate-600 text-sm font-medium mb-4">
                                How would you like to remove this student?
                            </p>
                            <button
                                onClick={() => handleRemove('this_class')}
                                disabled={removing}
                                className="w-full p-4 rounded-2xl border-2 border-orange-200 bg-orange-50 hover:border-orange-400 hover:bg-orange-100 transition-all text-left group"
                            >
                                <p className="text-sm font-black text-orange-700 group-hover:text-orange-800">This class only</p>
                                <p className="text-[10px] text-orange-500 font-bold mt-0.5">Remove from this session only</p>
                            </button>
                            <button
                                onClick={() => handleRemove('all_future')}
                                disabled={removing}
                                className="w-full p-4 rounded-2xl border-2 border-red-200 bg-red-50 hover:border-red-400 hover:bg-red-100 transition-all text-left group"
                            >
                                <p className="text-sm font-black text-red-700 group-hover:text-red-800">All future classes</p>
                                <p className="text-[10px] text-red-500 font-bold mt-0.5">Remove from all recurring sessions</p>
                            </button>
                            <button
                                onClick={() => setRemoveTarget(null)}
                                disabled={removing}
                                className="w-full py-3.5 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all mt-1"
                            >
                                {removing ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Cancel'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Student Modal */}
            {showEnrollModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={closeEnrollModal} />
                    <div className="relative bg-white rounded-[40px] lg:rounded-[50px] w-full max-w-md overflow-hidden shadow-2xl">
                        {/* Modal Header */}
                        <div className="p-6 lg:p-8 bg-[#463a7a]">
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h3 className="text-xl lg:text-2xl font-black text-white tracking-tighter">Add Student</h3>
                                    <p className="text-indigo-200/60 text-xs font-bold uppercase tracking-widest mt-1">
                                        {session.batch?.name || 'this session'}
                                    </p>
                                </div>
                                <button onClick={closeEnrollModal} className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-2xl text-white hover:bg-white/20 transition-all">
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Enrollment type toggle */}
                            <div className="bg-white/10 rounded-2xl p-1 flex gap-1">
                                <button
                                    onClick={() => setEnrollType('single_session')}
                                    className={`flex-1 py-2.5 px-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                                        enrollType === 'single_session'
                                            ? 'bg-white text-[#463a7a] shadow-md'
                                            : 'text-white/60 hover:text-white'
                                    }`}
                                >
                                    This class only
                                </button>
                                <button
                                    onClick={() => setEnrollType('recurring')}
                                    className={`flex-1 py-2.5 px-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                                        enrollType === 'recurring'
                                            ? 'bg-white text-[#463a7a] shadow-md'
                                            : 'text-white/60 hover:text-white'
                                    }`}
                                >
                                    All recurring
                                </button>
                            </div>

                            {/* Context hint */}
                            <p className="mt-3 text-[10px] text-indigo-200/50 font-semibold">
                                {enrollType === 'single_session'
                                    ? '👆 Student added to this session only — recorded in session_ids'
                                    : '🔄 Student enrolled in all scheduled sessions of this batch'}
                            </p>
                        </div>

                        <div className="p-5 lg:p-6 space-y-4">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name..."
                                    value={enrollSearch}
                                    onChange={(e) => setEnrollSearch(e.target.value)}
                                    autoFocus
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10 text-sm font-medium"
                                />
                            </div>

                            {/* Student List */}
                            <div className="max-h-[280px] overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                                {filteredEnroll.length > 0 ? filteredEnroll.map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => handleEnroll(s.id)}
                                        disabled={enrolling === s.id}
                                        className="w-full p-3.5 rounded-2xl flex items-center justify-between border border-transparent hover:border-[#463a7a]/20 hover:bg-indigo-50/50 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center font-black text-[#463a7a] group-hover:bg-[#463a7a] group-hover:text-white transition-all text-sm flex-shrink-0">
                                                {s.first_name?.[0]}
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-bold text-slate-900">{s.first_name} {s.last_name}</p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                                                    {s.desired_course || s.current_grade ? `${s.desired_course || ''} · Grade ${s.current_grade || '—'}` : '—'}
                                                </p>
                                            </div>
                                        </div>
                                        {enrolling === s.id
                                            ? <Loader2 size={16} className="animate-spin text-[#463a7a]" />
                                            : (
                                                <span className={`flex items-center gap-1 text-[10px] font-black transition-colors ${
                                                    enrollType === 'single_session'
                                                        ? 'text-orange-500 group-hover:text-orange-600'
                                                        : 'text-[#463a7a] group-hover:text-purple-700'
                                                }`}>
                                                    <Plus size={14} />
                                                    {enrollType === 'single_session' ? 'This class' : 'All classes'}
                                                </span>
                                            )
                                        }
                                    </button>
                                )) : (
                                    <div className="py-12 text-center opacity-40">
                                        <User size={32} className="mx-auto mb-3 text-slate-300" />
                                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                                            {enrollSearch ? 'No matching students' : 'All students already enrolled'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-5 lg:px-6 pb-5 lg:pb-6">
                            <button
                                onClick={closeEnrollModal}
                                className="w-full py-3.5 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
