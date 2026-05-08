import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { parseSubject } from '../../lib/utils';
import {
    format,
    startOfMonth,
    endOfMonth,
    addMonths,
    subMonths,
    parse,
    isBefore,
    isToday,
    addDays
} from 'date-fns';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Clock,
    CheckCircle2,
    Loader2,
    AlertCircle,
    ArrowRight,
    X
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router';

export default function StudentReschedule() {
    const { sessionId } = useParams();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [student, setStudent] = useState(null);
    const [originalSession, setOriginalSession] = useState(null);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const stored = localStorage.getItem('student');
        if (stored) {
            const s = JSON.parse(stored);
            setStudent(s);
            fetchData(s.id);
        } else {
            navigate('/student-login');
        }
    }, [currentDate, navigate, sessionId]);

    const fetchData = async (studentId) => {
        setLoading(true);
        try {
            // Get original session details
            const today = new Date();
            const futureDate = addMonths(today, 3);
            const sessionRes = await api.get(`/student/${studentId}/sessions`, {
                params: {
                    start: format(today, 'yyyy-MM-dd'),
                    end: format(futureDate, 'yyyy-MM-dd')
                }
            });

            const session = sessionRes.data.find(s => s.id === parseInt(sessionId));
            setOriginalSession(session);

            // Get available slots for the current month
            const start = format(startOfMonth(currentDate), 'yyyy-MM-dd');
            const end = format(endOfMonth(currentDate), 'yyyy-MM-dd');

            const slotsRes = await api.get(`/student/${studentId}/available-slots`, {
                params: {
                    start,
                    end,
                    subject: session?.batch?.subject
                }
            });

            // Transform and group slots by date
            const slots = (slotsRes.data || []).map(slot => ({
                id: slot.id,
                date: slot.date,
                start_time: slot.start_time,
                end_time: slot.end_time,
                subject: slot.subject,
                teacher_name: slot.teacher_name,
                enrolled: slot.enrolled,
                capacity: slot.capacity,
                batch_id: slot.batch_id
            }));

            setAvailableSlots(slots);
        } catch (err) {
            console.error(err);
            alert('Failed to load reschedule data');
        } finally {
            setLoading(false);
        }
    };

    const handleReschedule = async () => {
        if (!selectedSlot) return;

        setSubmitting(true);
        try {
            await api.post(`/student/${student.id}/reschedule`, {
                old_session_id: parseInt(sessionId),
                new_session_id: selectedSlot.id,
                reason: reason
            });

            setShowSuccess(true);
            setTimeout(() => {
                navigate('/student-portal/schedule');
            }, 2000);
        } catch (err) {
            console.error(err);
            alert('Failed to reschedule. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Get slots grouped by date
    const slotsByDate = availableSlots.reduce((acc, slot) => {
        if (!acc[slot.date]) {
            acc[slot.date] = [];
        }
        acc[slot.date].push(slot);
        return acc;
    }, {});

    // Get next 14 days with slots
    const getUpcomingDatesWithSlots = () => {
        const dates = [];
        let currentDay = new Date();

        // Get all dates that have slots
        const datesWithSlots = Object.keys(slotsByDate).sort();

        return datesWithSlots.slice(0, 14).map(dateStr => {
            const date = parse(dateStr, 'yyyy-MM-dd', new Date());
            return {
                date: dateStr,
                dateObj: date,
                slots: slotsByDate[dateStr]
            };
        });
    };

    const upcomingDates = getUpcomingDatesWithSlots();

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        </div>
    );

    if (!originalSession) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 flex items-center justify-center">
            <div className="bg-white rounded-3xl p-8 shadow-xl max-w-md text-center">
                <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Session Not Found</h2>
                <p className="text-slate-600 mb-6">Unable to find the session you're trying to reschedule.</p>
                <button
                    onClick={() => navigate('/student-portal/schedule')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all"
                >
                    Back to Schedule
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Mobile-friendly header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 md:p-6 sticky top-0 z-10 shadow-lg">
                <div className="max-w-6xl mx-auto">
                    <button
                        onClick={() => navigate('/student-portal/schedule')}
                        className="flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-3 text-sm font-medium"
                    >
                        <ChevronLeft size={18} />
                        <span>Back to Schedule</span>
                    </button>

                    <h1 className="text-2xl md:text-3xl font-bold mb-2">Reschedule Class</h1>
                    <p className="text-blue-100 text-sm md:text-base">Select a new time slot for your class</p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
                {/* Current Session Card - Mobile Optimized */}
                <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-lg border border-orange-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Clock className="text-orange-600" size={20} />
                        </div>
                        <h2 className="text-lg md:text-xl font-bold text-slate-900">Current Class</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                        <div className="p-3 md:p-4 bg-slate-50 rounded-xl">
                            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Subject</p>
                            <p className="text-base md:text-lg font-bold text-slate-900">{parseSubject(originalSession.batch?.subject)}</p>
                        </div>
                        <div className="p-3 md:p-4 bg-slate-50 rounded-xl">
                            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Date</p>
                            <p className="text-base md:text-lg font-bold text-slate-900">
                                {format(parse(originalSession.date, 'yyyy-MM-dd', new Date()), 'MMM d, yyyy')}
                            </p>
                        </div>
                        <div className="p-3 md:p-4 bg-slate-50 rounded-xl">
                            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Time</p>
                            <p className="text-base md:text-lg font-bold text-slate-900">
                                {originalSession.start_time} - {originalSession.end_time}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Available Slots - Mobile Friendly List */}
                <div className="bg-white rounded-2xl md:rounded-3xl shadow-lg overflow-hidden">
                    <div className="p-4 md:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                        <h2 className="text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
                            <CalendarIcon size={24} className="text-blue-600" />
                            Available Time Slots
                        </h2>
                        <p className="text-sm text-slate-600 mt-1">Tap on a slot to select it</p>
                    </div>

                    <div className="p-4 md:p-6 max-h-[60vh] overflow-y-auto">
                        {upcomingDates.length === 0 ? (
                            <div className="text-center py-12">
                                <CalendarIcon className="mx-auto text-slate-300 mb-4" size={48} />
                                <p className="text-slate-500 font-medium">No available slots found</p>
                                <p className="text-sm text-slate-400 mt-2">Try selecting a different month</p>
                                <div className="flex gap-2 justify-center mt-4">
                                    <button
                                        onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                                        className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-medium hover:bg-slate-200"
                                    >
                                        Previous Month
                                    </button>
                                    <button
                                        onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                                        className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-medium hover:bg-slate-200"
                                    >
                                        Next Month
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {upcomingDates.map(({ date, dateObj, slots }) => (
                                    <div key={date} className="border border-slate-200 rounded-xl overflow-hidden">
                                        {/* Date Header */}
                                        <div className="bg-gradient-to-r from-slate-100 to-slate-50 px-4 py-3 border-b border-slate-200">
                                            <p className="font-bold text-slate-900">
                                                {format(dateObj, 'EEEE, MMMM d, yyyy')}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {slots.length} slot{slots.length !== 1 ? 's' : ''} available
                                            </p>
                                        </div>

                                        {/* Time Slots */}
                                        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {slots.map((slot) => (
                                                <button
                                                    key={slot.id}
                                                    onClick={() => setSelectedSlot(slot)}
                                                    className={`
                                                        relative p-4 rounded-xl text-left transition-all border-2
                                                        ${selectedSlot?.id === slot.id
                                                            ? 'bg-blue-50 border-blue-500 shadow-lg scale-[1.02]'
                                                            : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'
                                                        }
                                                    `}
                                                >
                                                    {selectedSlot?.id === slot.id && (
                                                        <div className="absolute top-2 right-2">
                                                            <CheckCircle2 className="text-blue-600" size={20} />
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Clock className={selectedSlot?.id === slot.id ? 'text-blue-600' : 'text-slate-400'} size={18} />
                                                        <span className="font-bold text-slate-900">
                                                            {slot.start_time} - {slot.end_time}
                                                        </span>
                                                    </div>

                                                    <p className="text-sm text-slate-600 mb-1">
                                                        Teacher: {slot.teacher_name}
                                                    </p>

                                                    <div className="flex items-center gap-2">
                                                        <span className={`
                                                            text-xs font-semibold px-2 py-1 rounded-full
                                                            ${slot.enrolled >= slot.capacity * 0.8
                                                                ? 'bg-orange-100 text-orange-700'
                                                                : 'bg-emerald-100 text-emerald-700'
                                                            }
                                                        `}>
                                                            {slot.enrolled}/{slot.capacity} students
                                                        </span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Selected Slot Summary & Action - Sticky on Mobile */}
                {selectedSlot && (
                    <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-lg border-2 border-blue-200 sticky bottom-4 md:static">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <CheckCircle2 className="text-blue-600" size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">New Time Selected</h3>
                                    <p className="text-sm text-slate-600">
                                        {format(parse(selectedSlot.date, 'yyyy-MM-dd', new Date()), 'MMM d')} at {selectedSlot.start_time}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedSlot(null)}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Reason (Optional)
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="e.g., Travel, Illness, Family event..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows="2"
                            />
                        </div>

                        <button
                            onClick={handleReschedule}
                            disabled={submitting}
                            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-base shadow-lg hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Rescheduling...
                                </>
                            ) : (
                                <>
                                    Confirm Reschedule
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>

                        <p className="text-xs text-center text-slate-500 mt-3">
                            Your teacher will be notified of this change
                        </p>
                    </div>
                )}
            </div>

            {/* Success Modal */}
            {showSuccess && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="text-emerald-600" size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">
                            Rescheduled Successfully!
                        </h3>
                        <p className="text-slate-600 mb-6">
                            Your class has been rescheduled. Redirecting you back to your schedule...
                        </p>
                        <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
                    </div>
                </div>
            )}
        </div>
    );
}
