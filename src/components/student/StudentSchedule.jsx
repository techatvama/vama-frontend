import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
    eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parse,
} from 'date-fns';
import {
    ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Users,
    MessageSquare, Music, X, CheckCircle2, AlertCircle, ArrowRight,
    RefreshCw, Zap, Ban, RotateCcw, Check,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router';
import { parseSubject, parseSubjectList } from '../../lib/utils';

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmtTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ap = h >= 12 ? 'pm' : 'am';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ap}`;
};

const SUBJECT_COLORS = {
    Guitar: '#10b981', Piano: '#3b82f6', Drums: '#f97316',
    Vocals: '#ec4899', Violin: '#8b5cf6', Keyboard: '#6366f1',
};
const subjectColor = (s) => SUBJECT_COLORS[s] || '#463a7a';

// ─── Live badge ───────────────────────────────────────────────────────────────
function LiveBadge({ lastRefresh, syncing }) {
    return (
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
            <span className={`w-2 h-2 rounded-full bg-emerald-500 ${syncing ? 'animate-ping' : 'animate-pulse'}`} />
            <span>LIVE</span>
            <span className="text-emerald-400 font-medium">
                {lastRefresh ? `· ${format(lastRefresh, 'h:mm a')}` : ''}
            </span>
        </div>
    );
}

// ─── Class Options Modal ──────────────────────────────────────────────────────
function ClassOptionsModal({ session, attendance, onCancel, onReschedule, onClose, cancelling }) {
    const [confirmCancel, setConfirmCancel] = useState(false);
    const color = subjectColor(parseSubjectList(session.batch?.subject)[0]);
    const isCancelled = session.status === 'cancelled';
    const isPast = new Date(session.date + 'T23:59:59') < new Date();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 text-white relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${color}dd, ${color}99)` }}>
                    <button onClick={onClose} className="absolute top-4 right-4 p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                        <X size={16} className="text-white" />
                    </button>
                    <div className="text-xs font-black uppercase tracking-widest opacity-70 mb-1">{parseSubject(session.batch?.subject)}</div>
                    <div className="text-xl font-black">{fmtTime(session.start_time)} – {fmtTime(session.end_time)}</div>
                    <div className="text-sm font-medium opacity-80 mt-0.5">{format(new Date(session.date + 'T00:00:00'), 'EEEE, MMMM d')}</div>
                    {session.batch?.teacher?.name && (
                        <div className="text-xs font-bold opacity-70 mt-2">with {session.batch.teacher.name}</div>
                    )}
                    {isCancelled && (
                        <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-red-500 text-white text-[10px] font-black uppercase rounded-full">
                            <Ban size={10} /> Cancelled
                        </span>
                    )}
                </div>

                {/* Attendance */}
                {attendance && (
                    <div className={`mx-4 mt-4 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold ${attendance.status === 'present' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {attendance.status === 'present' ? <CheckCircle2 size={14} /> : <X size={14} />}
                        {attendance.status === 'present' ? 'You attended this class' : 'Marked absent'}
                        {attendance.notes && <span className="ml-auto italic font-normal opacity-70">"{attendance.notes}"</span>}
                    </div>
                )}

                {/* Actions */}
                <div className="p-4 space-y-3">
                    {!isCancelled && !isPast && (
                        <>
                            <button
                                onClick={onReschedule}
                                className="w-full flex items-center justify-between px-5 py-4 bg-[#463a7a] text-white rounded-2xl font-black text-sm hover:bg-[#342a5b] transition-all active:scale-95 shadow-lg shadow-indigo-900/20"
                            >
                                <div className="flex items-center gap-3">
                                    <RotateCcw size={18} />
                                    <div className="text-left">
                                        <div>Reschedule Class</div>
                                        <div className="text-xs font-medium opacity-60">Pick a different time slot</div>
                                    </div>
                                </div>
                                <ArrowRight size={16} className="opacity-60" />
                            </button>

                            {!confirmCancel ? (
                                <button
                                    onClick={() => setConfirmCancel(true)}
                                    className="w-full flex items-center justify-between px-5 py-4 border-2 border-red-100 bg-red-50 text-red-600 rounded-2xl font-black text-sm hover:bg-red-100 transition-all active:scale-95"
                                >
                                    <div className="flex items-center gap-3">
                                        <Ban size={18} />
                                        <div className="text-left">
                                            <div>Cancel My Attendance</div>
                                            <div className="text-xs font-medium opacity-60">Only your slot — class continues for others</div>
                                        </div>
                                    </div>
                                    <ArrowRight size={16} className="opacity-60" />
                                </button>
                            ) : (
                                <div className="border-2 border-red-200 bg-red-50 rounded-2xl p-4 space-y-3">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-xs text-red-700 font-semibold">Your attendance will be marked as cancelled. The class continues for other students. Admin and teacher will be notified.</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setConfirmCancel(false)}
                                            className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors">
                                            Back
                                        </button>
                                        <button onClick={onCancel} disabled={cancelling}
                                            className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-black hover:bg-red-700 disabled:opacity-50 transition-colors">
                                            {cancelling ? 'Cancelling…' : 'Yes, Cancel'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {(isCancelled || isPast) && (
                        <p className="text-center text-sm text-gray-400 font-medium py-2">
                            {isCancelled ? 'This class has been cancelled.' : 'This class has already passed.'}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Reschedule Modal ─────────────────────────────────────────────────────────
function RescheduleModal({ session, studentId, onDone, onClose }) {
    const [step, setStep] = useState('slots');           // 'slots' | 'preview'
    const [slotDate, setSlotDate] = useState(session.date);
    const [slots, setSlots] = useState([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [confirming, setConfirming] = useState(false);
    const [error, setError] = useState('');

    const color = subjectColor(parseSubjectList(session.batch?.subject)[0]);
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    const fetchSlots = useCallback(async (d) => {
        setSlotsLoading(true);
        setError('');
        try {
            const res = await api.get(`/student/${studentId}/instructor-slots`, {
                params: { session_id: session.id, slot_date: d },
            });
            setSlots(res.data);
        } catch {
            setError('Failed to load available slots.');
        } finally {
            setSlotsLoading(false);
        }
    }, [studentId, session.id]);

    useEffect(() => {
        fetchSlots(slotDate);
    }, [slotDate]);

    const handleConfirm = async () => {
        if (!selectedSlot) return;
        setConfirming(true);
        setError('');
        try {
            await api.post(`/student/${studentId}/do-reschedule`, null, {
                params: {
                    original_session_id: session.id,
                    new_session_id: selectedSlot.id,
                    reason: 'Rescheduled by student',
                },
            });
            onDone();
        } catch (e) {
            setError(e.response?.data?.detail || 'Failed to reschedule. Please try again.');
            setConfirming(false);
        }
    };

    const availableCount = slots.filter(s => !s.is_fully_booked).length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                    <div>
                        <div className="text-xs font-black uppercase tracking-widest text-gray-400">
                            {step === 'slots' ? 'Step 1 of 2 — Choose a slot' : 'Step 2 of 2 — Confirm booking'}
                        </div>
                        <h3 className="text-lg font-black text-gray-900 mt-0.5">
                            {step === 'slots' ? 'Reschedule Class' : 'Review Booking'}
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0">
                        <X size={18} className="text-gray-500" />
                    </button>
                </div>

                {/* Step indicator */}
                <div className="flex px-6 pt-4 gap-2 flex-shrink-0">
                    {['slots', 'preview'].map((s, i) => (
                        <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${step === s || (s === 'slots' && step === 'preview') ? 'bg-[#463a7a]' : 'bg-gray-100'}`} />
                    ))}
                </div>

                {/* ── Step 1: Slots ── */}
                {step === 'slots' && (
                    <div className="flex-1 overflow-y-auto">
                        {/* Current class info */}
                        <div className="mx-4 mt-4 p-4 rounded-2xl" style={{ backgroundColor: color + '15', border: `1.5px solid ${color}30` }}>
                            <div className="text-xs font-black uppercase tracking-widest mb-1" style={{ color }}>Moving from</div>
                            <div className="font-black text-gray-900">{parseSubject(session.batch?.subject)} · {fmtTime(session.start_time)} – {fmtTime(session.end_time)}</div>
                            <div className="text-xs text-gray-500 font-medium mt-0.5">{format(new Date(session.date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}</div>
                        </div>

                        {/* Date filter */}
                        <div className="px-4 mt-4">
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
                                <CalendarIcon size={11} className="inline mr-1" /> Select Date
                            </label>
                            <input
                                type="date"
                                value={slotDate}
                                min={todayStr}
                                onChange={e => setSlotDate(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl text-sm font-semibold focus:border-[#463a7a] focus:outline-none focus:ring-2 focus:ring-[#463a7a]/15 transition-all"
                            />
                            {!slotsLoading && slots.length > 0 && (
                                <p className="text-xs font-bold text-gray-400 mt-2">
                                    {availableCount} of {slots.length} slot{slots.length !== 1 ? 's' : ''} available on this day
                                </p>
                            )}
                        </div>

                        {/* Slots list */}
                        <div className="px-4 py-4 space-y-3">
                            {slotsLoading ? (
                                <div className="flex items-center justify-center py-10 text-gray-400">
                                    <RefreshCw size={22} className="animate-spin mr-2" />
                                    <span className="text-sm font-bold">Loading slots…</span>
                                </div>
                            ) : error ? (
                                <div className="text-center py-8 text-red-500 text-sm font-bold">{error}</div>
                            ) : slots.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <CalendarIcon size={36} className="mx-auto mb-3 opacity-30" />
                                    <p className="text-sm font-black">No slots available on this day</p>
                                    <p className="text-xs font-medium opacity-60 mt-1">Try a different date</p>
                                </div>
                            ) : slots.map(slot => {
                                const sc = subjectColor(slot.subject);
                                const full = slot.is_fully_booked;
                                return (
                                    <div key={slot.id}
                                        className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${full ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-100 hover:border-[#463a7a]/40 hover:shadow-md cursor-pointer'}`}>
                                        {/* Color dot + time */}
                                        <div className="flex-shrink-0">
                                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-xs font-black" style={{ backgroundColor: sc }}>
                                                {(slot.subject || 'C')[0]}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-black text-sm text-gray-900">{fmtTime(slot.start_time)} – {fmtTime(slot.end_time)}</div>
                                            <div className="text-xs text-gray-500 font-medium truncate">{slot.subject}{slot.batch_name ? ` · ${slot.batch_name}` : ''}</div>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <Users size={11} className={full ? 'text-red-400' : 'text-emerald-500'} />
                                                <span className={`text-[10px] font-black ${full ? 'text-red-500' : 'text-emerald-600'}`}>
                                                    {full ? 'Fully Booked' : `${slot.available_slots} spot${slot.available_slots !== 1 ? 's' : ''} left`}
                                                </span>
                                                <span className="text-[10px] text-gray-300 font-medium">({slot.enrollment_count}/{slot.capacity})</span>
                                            </div>
                                        </div>
                                        {full ? (
                                            <span className="text-[10px] font-black text-red-400 bg-red-50 px-2.5 py-1 rounded-full flex-shrink-0">Full</span>
                                        ) : (
                                            <button
                                                onClick={() => { setSelectedSlot(slot); setStep('preview'); }}
                                                className="px-4 py-2 bg-[#463a7a] text-white text-xs font-black rounded-xl hover:bg-[#342a5b] transition-all active:scale-95 flex-shrink-0 shadow-sm shadow-indigo-900/20"
                                            >
                                                Book
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── Step 2: Preview ── */}
                {step === 'preview' && selectedSlot && (
                    <div className="flex-1 overflow-y-auto p-6 space-y-5">
                        <p className="text-sm text-gray-500 font-medium">Review your booking details before confirming.</p>

                        {/* From */}
                        <div className="p-5 bg-red-50 border-2 border-red-100 rounded-2xl">
                            <div className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-2 flex items-center gap-1.5">
                                <Ban size={11} /> Cancelling
                            </div>
                            <div className="font-black text-gray-900">{parseSubject(session.batch?.subject)}</div>
                            <div className="text-sm text-gray-600 font-medium mt-0.5">{fmtTime(session.start_time)} – {fmtTime(session.end_time)}</div>
                            <div className="text-xs text-gray-400 font-medium mt-0.5">{format(new Date(session.date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}</div>
                        </div>

                        {/* Arrow */}
                        <div className="flex items-center justify-center">
                            <div className="w-10 h-10 bg-[#463a7a] rounded-full flex items-center justify-center shadow-lg shadow-indigo-900/20">
                                <ArrowRight size={18} className="text-white" />
                            </div>
                        </div>

                        {/* To */}
                        <div className="p-5 bg-emerald-50 border-2 border-emerald-100 rounded-2xl">
                            <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2 flex items-center gap-1.5">
                                <Check size={11} /> New Booking
                            </div>
                            <div className="font-black text-gray-900">{selectedSlot.subject}</div>
                            <div className="text-sm text-gray-600 font-medium mt-0.5">{fmtTime(selectedSlot.start_time)} – {fmtTime(selectedSlot.end_time)}</div>
                            <div className="text-xs text-gray-400 font-medium mt-0.5">{format(new Date(selectedSlot.date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}</div>
                            <div className="flex items-center gap-1.5 mt-2">
                                <Users size={11} className="text-emerald-500" />
                                <span className="text-[10px] font-bold text-emerald-600">{selectedSlot.available_slots} spot{selectedSlot.available_slots !== 1 ? 's' : ''} left</span>
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-semibold">
                                <AlertCircle size={15} /> {error}
                            </div>
                        )}

                        <p className="text-xs text-gray-400 font-medium text-center">
                            This booking will reflect immediately in admin and teacher portals.
                        </p>
                    </div>
                )}

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3 flex-shrink-0">
                    {step === 'slots' ? (
                        <button onClick={onClose} className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl font-black text-sm hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                    ) : (
                        <>
                            <button onClick={() => setStep('slots')} className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl font-black text-sm hover:bg-gray-50 transition-colors">
                                Back
                            </button>
                            <button onClick={handleConfirm} disabled={confirming}
                                className="flex-2 px-6 py-3 bg-[#463a7a] text-white rounded-2xl font-black text-sm hover:bg-[#342a5b] disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-indigo-900/20 whitespace-nowrap">
                                {confirming ? 'Booking…' : 'Confirm Reschedule'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Success Toast ─────────────────────────────────────────────────────────────
function Toast({ message, onDone }) {
    useEffect(() => {
        const t = setTimeout(onDone, 3000);
        return () => clearTimeout(t);
    }, []);
    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 bg-gray-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl font-bold text-sm animate-bounce-in">
            <CheckCircle2 size={18} className="text-emerald-400" />
            {message}
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function StudentSchedule() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [sessions, setSessions] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [student, setStudent] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [lastRefresh, setLastRefresh] = useState(null);

    // Modal state
    const [optionsSession, setOptionsSession] = useState(null);
    const [rescheduleSession, setRescheduleSession] = useState(null);
    const [cancelling, setCancelling] = useState(false);
    const [toast, setToast] = useState('');

    const navigate = useNavigate();
    const intervalRef = useRef(null);

    const fetchData = useCallback(async (studentId, isInitial = false) => {
        if (isInitial) setLoading(true); else setSyncing(true);
        try {
            const start = format(startOfMonth(currentDate), 'yyyy-MM-dd');
            const end   = format(endOfMonth(currentDate),   'yyyy-MM-dd');
            const [sessRes, attRes] = await Promise.all([
                api.get(`/student/${studentId}/sessions`, { params: { start, end } }),
                api.get(`/student/${studentId}/attendance`),
            ]);
            setSessions(sessRes.data);
            setAttendance(attRes.data);
            setLastRefresh(new Date());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setSyncing(false);
        }
    }, [currentDate]);

    // Initialise student + start polling
    useEffect(() => {
        const stored = localStorage.getItem('student');
        if (!stored) { navigate('/student-login'); return; }
        const s = JSON.parse(stored);
        setStudent(s);
        fetchData(s.id, true);

        // Real-time polling every 20 s
        intervalRef.current = setInterval(() => fetchData(s.id, false), 20000);
        return () => clearInterval(intervalRef.current);
    }, []);

    // Re-fetch when month changes
    useEffect(() => {
        if (student) fetchData(student.id, false);
    }, [currentDate]);

    const refreshNow = () => { if (student) fetchData(student.id, false); };

    // ── Calendar helpers ──
    const monthStart = startOfMonth(currentDate);
    const calDays = eachDayOfInterval({
        start: startOfWeek(monthStart, { weekStartsOn: 1 }),
        end:   endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 }),
    });
    const selectedDateSessions = sessions
        .filter(s => isSameDay(parse(s.date, 'yyyy-MM-dd', new Date()), selectedDate))
        .sort((a, b) => a.start_time.localeCompare(b.start_time));

    // ── Actions ──
    const handleCancelSession = async () => {
        if (!optionsSession || !student) return;
        setCancelling(true);
        try {
            await api.post(`/student/${student.id}/sessions/${optionsSession.id}/cancel`, null, {
                params: { reason: 'Cancelled by student' },
            });
            setOptionsSession(null);
            setToast('Class cancelled. Changes reflected in all portals.');
            refreshNow();
        } catch (e) {
            alert(e.response?.data?.detail || 'Failed to cancel class.');
        } finally {
            setCancelling(false);
        }
    };

    const handleRescheduleClick = (sess) => {
        setOptionsSession(null);
        setRescheduleSession(sess);
    };

    const handleRescheduleDone = () => {
        setRescheduleSession(null);
        setToast('Class rescheduled! All portals updated in real time.');
        refreshNow();
    };

    // ── Render ──
    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-[#463a7a] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Loading calendar…</p>
            </div>
        </div>
    );

    return (
        <div className="p-4 lg:p-10 max-w-7xl mx-auto space-y-8 pb-24">

            {/* ── Header ── */}
            <div className="relative bg-[#463a7a] rounded-[36px] p-8 lg:p-12 overflow-hidden shadow-2xl shadow-indigo-900/40">
                <div className="absolute top-0 right-0 p-10 opacity-5">
                    <CalendarIcon className="w-64 h-64 text-white fill-current" />
                </div>

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <h1 className="text-4xl font-black text-white tracking-tight">Academic Calendar</h1>
                            <LiveBadge lastRefresh={lastRefresh} syncing={syncing} />
                        </div>
                        <p className="text-indigo-200/60 font-medium">Real-time sync · changes reflect instantly across all portals</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={refreshNow}
                            className="p-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl transition-all text-white"
                            title="Refresh now">
                            <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
                        </button>
                        <div className="flex items-center bg-white/10 backdrop-blur-md rounded-[24px] p-1.5 border border-white/5">
                            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-3 hover:bg-white/10 rounded-xl transition-all text-white active:scale-90">
                                <ChevronLeft size={20} />
                            </button>
                            <div className="px-6 font-black text-white min-w-[160px] text-center text-lg">
                                {format(currentDate, 'MMMM yyyy')}
                            </div>
                            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-3 hover:bg-white/10 rounded-xl transition-all text-white active:scale-90">
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* ── Calendar Grid ── */}
                <div className="xl:col-span-2 bg-white rounded-[40px] shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
                    {/* Day headers */}
                    <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-100 px-4 py-3">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                            <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{d}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7">
                        {calDays.map(day => {
                            const dateStr = format(day, 'yyyy-MM-dd');
                            const daySessions = sessions.filter(s => s.date === dateStr);
                            const isSelected = isSameDay(day, selectedDate);
                            const isCurrentMonth = isSameMonth(day, monthStart);
                            const isToday = isSameDay(day, new Date());
                            const hasCancelled = daySessions.some(s => s.status === 'cancelled' || s.my_attendance === 'student_cancelled');

                            return (
                                <div key={day.toString()} onClick={() => setSelectedDate(day)}
                                    className={`min-h-[110px] lg:min-h-[130px] p-2.5 border-r border-b border-slate-50 transition-all cursor-pointer flex flex-col
                                        ${!isCurrentMonth ? 'bg-slate-50/30' : 'bg-white hover:bg-[#463a7a]/3'}
                                        ${isSelected ? 'bg-indigo-50/50 ring-2 ring-inset ring-[#463a7a]/20' : ''}`}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className={`text-sm font-black w-7 h-7 flex items-center justify-center rounded-xl transition-all
                                            ${isToday ? 'bg-[#463a7a] text-white shadow-lg shadow-indigo-900/30' : isSelected ? 'bg-indigo-100 text-[#463a7a]' : isCurrentMonth ? 'text-slate-900' : 'text-slate-200'}`}>
                                            {format(day, 'd')}
                                        </span>
                                        {daySessions.length > 0 && (
                                            <span className={`w-2 h-2 rounded-full ${hasCancelled ? 'bg-red-400' : 'bg-emerald-400'} shadow-sm`} />
                                        )}
                                    </div>
                                    <div className="space-y-1 flex-1 overflow-hidden">
                                        {daySessions.slice(0, 2).map((s, i) => {
                                            const c = subjectColor(parseSubjectList(s.batch?.subject)[0]);
                                            const cancelled = s.status === 'cancelled';
                                            return (
                                                <div key={i}
                                                    className={`text-[9px] font-black px-1.5 py-1 rounded-lg truncate flex items-center gap-1 ${cancelled ? 'opacity-40 line-through' : ''}`}
                                                    style={{ backgroundColor: c + '18', color: c }}>
                                                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: c }} />
                                                    {s.start_time?.slice(0, 5)} {parseSubject(s.batch?.subject)}
                                                </div>
                                            );
                                        })}
                                        {daySessions.length > 2 && (
                                            <p className="text-[8px] font-black text-slate-300 pl-1">+{daySessions.length - 2} more</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Selected Day Panel ── */}
                <div className="space-y-6">
                    <div className="bg-white rounded-[40px] shadow-xl shadow-slate-200/60 border border-slate-100 p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{format(selectedDate, 'EEEE')}</h2>
                                <p className="text-[#463a7a] text-xs font-black uppercase tracking-widest mt-1">{format(selectedDate, 'MMMM d, yyyy')}</p>
                            </div>
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-[#463a7a]">
                                <CalendarIcon size={22} />
                            </div>
                        </div>

                        {selectedDateSessions.length > 0 ? (
                            <div className="space-y-4">
                                {selectedDateSessions.map(session => {
                                    const att = attendance.find(a => a.session_id === session.id);
                                    const color = subjectColor(parseSubjectList(session.batch?.subject)[0]);
                                    const slotCancelled = session.status === 'cancelled';          // admin cancelled whole slot
                                    const selfCancelled = session.my_attendance === 'student_cancelled'; // student cancelled own
                                    const cancelled = slotCancelled || selfCancelled;
                                    const isPast = new Date(session.date + 'T23:59:59') < new Date();

                                    return (
                                        <div key={session.id}
                                            onClick={() => setOptionsSession(session)}
                                            className={`p-5 rounded-[28px] border-2 cursor-pointer transition-all group
                                                ${cancelled ? 'border-red-100 bg-red-50/30 opacity-60' : 'border-slate-100 hover:border-[#463a7a]/30 hover:shadow-xl hover:shadow-indigo-100/50 hover:-translate-y-0.5'}`}
                                        >
                                            {/* Top row */}
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black" style={{ backgroundColor: color }}>
                                                        {(parseSubjectList(session.batch?.subject)[0] || 'C')[0]}
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] font-black uppercase tracking-widest" style={{ color }}>{parseSubject(session.batch?.subject)}</div>
                                                        {slotCancelled && <span className="text-[9px] font-black text-red-500 uppercase">Class Cancelled</span>}
                                                        {selfCancelled && !slotCancelled && <span className="text-[9px] font-black text-orange-500 uppercase">You Cancelled</span>}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[11px] font-black text-slate-500 flex items-center gap-1">
                                                        <Clock size={11} /> {fmtTime(session.start_time)}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-medium">– {fmtTime(session.end_time)}</div>
                                                </div>
                                            </div>

                                            <h3 className={`text-base font-black text-slate-900 mb-2 group-hover:text-[#463a7a] transition-colors ${cancelled ? 'line-through' : ''}`}>
                                                {session.batch?.name || `${parseSubject(session.batch?.subject)} Session`}
                                            </h3>

                                            {session.batch?.teacher?.name && (
                                                <p className="text-xs text-slate-500 font-medium mb-3">with {session.batch.teacher.name}</p>
                                            )}

                                            {/* Attendance badge — prefer embedded my_attendance, fallback to separate att record */}
                                            {(session.my_attendance || att?.status) && (() => {
                                                const st = session.my_attendance || att?.status;
                                                const map = {
                                                    present:          { cls: 'bg-emerald-100 text-emerald-700', label: 'Attended',         icon: <CheckCircle2 size={11} /> },
                                                    absent:           { cls: 'bg-red-100 text-red-600',         label: 'Absent',            icon: <X size={11} /> },
                                                    student_cancelled:{ cls: 'bg-orange-100 text-orange-700',   label: 'You Cancelled',     icon: <Ban size={11} /> },
                                                };
                                                const m = map[st];
                                                if (!m) return null;
                                                return (
                                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black mb-3 ${m.cls}`}>
                                                        {m.icon} {m.label}
                                                    </div>
                                                );
                                            })()}

                                            {/* Teacher feedback */}
                                            {att?.notes && (
                                                <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100 mb-3">
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <MessageSquare size={11} className="text-indigo-500" />
                                                        <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Teacher Feedback</span>
                                                    </div>
                                                    <p className="text-xs text-indigo-900 font-medium italic">"{att.notes}"</p>
                                                </div>
                                            )}

                                            {/* Click hint */}
                                            {!cancelled && !isPast && (
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300 group-hover:text-[#463a7a]/50 transition-colors">
                                                    <Zap size={11} /> Tap to manage
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-16 text-center opacity-30">
                                <Music size={36} className="mx-auto mb-3 text-slate-200" />
                                <h3 className="text-base font-black uppercase tracking-tight">Day is clear</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest mt-1">No classes scheduled</p>
                            </div>
                        )}
                    </div>

                    {/* ── Latest feedback widget ── */}
                    <div className="bg-[#463a7a] rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-900/40">
                        <h2 className="text-base font-black tracking-tight uppercase mb-6 relative z-10 flex items-center gap-2">
                            <MessageSquare size={16} className="text-orange-400" /> Latest Feedback
                        </h2>
                        <div className="relative z-10">
                            {(attendance || []).filter(a => a?.notes).slice(0, 1).map((a, i) => (
                                <div key={i} className="bg-white/10 backdrop-blur-md rounded-[24px] p-6 border border-white/5">
                                    <p className="text-sm font-medium leading-relaxed italic mb-4">"{a.notes}"</p>
                                    <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                                        <div className="w-8 h-8 bg-indigo-400 rounded-xl flex items-center justify-center font-black text-white text-xs">
                                            {(parseSubjectList(a.session?.batch?.subject)[0] || 'V')[0]}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest">{parseSubject(a.session?.batch?.subject)}</p>
                                            <p className="text-[10px] font-bold text-white/40 uppercase mt-0.5">
                                                {a.created_at ? format(new Date(a.created_at), 'MMMM do') : ''}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {(!attendance || attendance.filter(a => a?.notes).length === 0) && (
                                <p className="text-white/30 text-sm font-bold uppercase tracking-widest text-center py-6">No teacher feedback yet</p>
                            )}
                        </div>
                        <Music className="absolute -bottom-8 -right-8 w-40 h-40 text-white/5 rotate-12" />
                    </div>
                </div>
            </div>

            {/* ── Modals ── */}
            {optionsSession && (
                <ClassOptionsModal
                    session={optionsSession}
                    attendance={attendance.find(a => a.session_id === optionsSession.id)}
                    onCancel={handleCancelSession}
                    onReschedule={() => handleRescheduleClick(optionsSession)}
                    onClose={() => setOptionsSession(null)}
                    cancelling={cancelling}
                />
            )}

            {rescheduleSession && (
                <RescheduleModal
                    session={rescheduleSession}
                    studentId={student?.id}
                    onDone={handleRescheduleDone}
                    onClose={() => setRescheduleSession(null)}
                />
            )}

            {toast && <Toast message={toast} onDone={() => setToast('')} />}
        </div>
    );
}
