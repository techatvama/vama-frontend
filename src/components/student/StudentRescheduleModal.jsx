import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { parseSubject } from '../../lib/utils';
import { Calendar, Clock, Users, X, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';

export default function StudentRescheduleModal({ session, onClose, onSuccess, studentId }) {
    const [loading, setLoading] = useState(false);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date()));
    const [reason, setReason] = useState('');

    useEffect(() => {
        fetchAvailableSlots();
    }, [currentWeek]);

    const fetchAvailableSlots = async () => {
        setLoading(true);
        try {
            const weekEnd = addDays(currentWeek, 6);
            const res = await api.get(`/student/${studentId}/available-slots`, {
                params: {
                    start: format(currentWeek, 'yyyy-MM-dd'),
                    end: format(weekEnd, 'yyyy-MM-dd'),
                    subject: session.batch?.subject
                }
            });
            setAvailableSlots(res.data);
        } catch (err) {
            console.error(err);
            setAvailableSlots([]);
        } finally {
            setLoading(false);
        }
    };


    const handleReschedule = async () => {
        if (!selectedSlot) {
            alert('Please select a slot');
            return;
        }

        setLoading(true);
        try {
            await api.post(`/student/${studentId}/reschedule`, {
                old_session_id: session.id,
                new_session_id: selectedSlot.id,
                reason: reason
            });

            alert('Class rescheduled successfully!');
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            alert('Failed to reschedule. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const goToPreviousWeek = () => {
        setCurrentWeek(addDays(currentWeek, -7));
    };

    const goToNextWeek = () => {
        setCurrentWeek(addDays(currentWeek, 7));
    };

    const getSlotsByDay = () => {
        const slotsByDay = {};
        for (let i = 0; i < 7; i++) {
            const date = addDays(currentWeek, i);
            const dateKey = format(date, 'yyyy-MM-dd');
            slotsByDay[dateKey] = availableSlots.filter(slot =>
                isSameDay(parseISO(slot.date) || slot.date, date)
            );
        }
        return slotsByDay;
    };

    const slotsByDay = getSlotsByDay();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white rounded-[40px] max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-br from-[#463a7a] to-[#2d2550] p-8 relative overflow-hidden">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 text-white/80 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>

                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                            <Calendar className="text-white" size={28} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-white">Reschedule Class</h2>
                            <p className="text-white/80 mt-1">
                                {parseSubject(session.batch?.subject)} • {format(new Date(session.date), 'EEEE, MMM d')} • {session.start_time}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {/* Original Class Info */}
                    <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-6 mb-6">
                        <div className="flex items-center gap-3 mb-2">
                            <AlertCircle className="text-red-600" size={20} />
                            <span className="font-bold text-red-900">Original Class (Will be cancelled)</span>
                        </div>
                        <div className="text-sm text-red-700">
                            {format(new Date(session.date), 'EEEE, MMMM d, yyyy')} at {session.start_time} - {session.end_time}
                        </div>
                    </div>

                    {/* Week Navigator */}
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={goToPreviousWeek}
                            className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <h3 className="text-xl font-bold text-slate-900">
                            {format(currentWeek, 'MMM d')} - {format(addDays(currentWeek, 6), 'MMM d, yyyy')}
                        </h3>

                        <button
                            onClick={goToNextWeek}
                            className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 transition-colors"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* Available Slots Grid */}
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#463a7a] border-t-transparent"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(slotsByDay).map(([dateKey, slots]) => {
                                const date = parseISO(dateKey);
                                return (
                                    <div key={dateKey} className="space-y-3">
                                        <div className="font-bold text-slate-700 text-sm">
                                            {format(date, 'EEEE, MMM d')}
                                        </div>

                                        {slots.length === 0 ? (
                                            <div className="text-sm text-slate-400 italic py-4">No slots available</div>
                                        ) : (
                                            slots.map(slot => {
                                                const isAvailable = slot.enrolled < slot.capacity;
                                                const isSelected = selectedSlot?.id === slot.id;
                                                const fillPercentage = (slot.enrolled / slot.capacity) * 100;

                                                return (
                                                    <button
                                                        key={slot.id}
                                                        onClick={() => isAvailable && setSelectedSlot(slot)}
                                                        disabled={!isAvailable}
                                                        className={`
                              w-full text-left p-4 rounded-2xl border-2 transition-all
                              ${isSelected
                                                                ? 'border-[#463a7a] bg-purple-50 shadow-lg scale-105'
                                                                : isAvailable
                                                                    ? 'border-slate-200 bg-white hover:border-[#463a7a] hover:shadow-md'
                                                                    : 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'}
                            `}
                                                    >
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <Clock size={16} className={isSelected ? 'text-[#463a7a]' : 'text-slate-600'} />
                                                                <span className="font-bold text-slate-900">
                                                                    {slot.start_time} - {slot.end_time}
                                                                </span>
                                                            </div>
                                                            {isSelected && <CheckCircle className="text-[#463a7a]" size={20} />}
                                                        </div>

                                                        <div className="text-sm text-slate-600 mb-3">
                                                            Teacher: {slot.teacher_name}
                                                        </div>

                                                        {/* Capacity Indicator */}
                                                        <div className="space-y-1">
                                                            <div className="flex items-center justify-between text-xs">
                                                                <div className="flex items-center gap-1">
                                                                    <Users size={14} />
                                                                    <span>{slot.enrolled}/{slot.capacity} students</span>
                                                                </div>
                                                                <span className={
                                                                    fillPercentage >= 80 ? 'text-orange-600 font-semibold' :
                                                                        fillPercentage >= 50 ? 'text-blue-600' :
                                                                            'text-emerald-600'
                                                                }>
                                                                    {isAvailable ? `${slot.capacity - slot.enrolled} spots left` : 'Full'}
                                                                </span>
                                                            </div>

                                                            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full transition-all ${fillPercentage >= 80 ? 'bg-orange-500' :
                                                                        fillPercentage >= 50 ? 'bg-blue-500' :
                                                                            'bg-emerald-500'
                                                                        }`}
                                                                    style={{ width: `${fillPercentage}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Reason Input */}
                    {selectedSlot && (
                        <div className="mt-6 p-6 bg-purple-50 rounded-3xl border-2 border-purple-200">
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                Reason for Rescheduling (Optional)
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="E.g., Personal commitment, Emergency, etc."
                                className="w-full px-4 py-3 rounded-2xl border-2 border-purple-300 focus:border-[#463a7a] focus:outline-none resize-none"
                                rows="3"
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-slate-200 p-6 bg-slate-50 flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-4 rounded-full bg-red-600 text-white font-semibold hover:bg-red-700 transition-all"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleReschedule}
                        disabled={!selectedSlot || loading}
                        className={`
              flex-1 px-6 py-4 rounded-full font-semibold transition-all
              ${selectedSlot && !loading
                                ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-xl hover:scale-105'
                                : 'bg-slate-300 text-slate-500 cursor-not-allowed'}
            `}
                    >
                        {loading ? 'Rescheduling...' : 'Confirm Reschedule'}
                    </button>
                </div>
            </div>
        </div>
    );
}
