import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Clock, Users, Repeat, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { api } from '../../lib/api';

const cn = (...inputs) => twMerge(clsx(inputs));

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const RECURRENCE_TYPES = [
    { id: 'one-time', label: 'One-Time Class' },
    { id: 'repeating', label: 'Repeating Event' }
];

export default function CreateBatchDialog({ isOpen, onClose, onCreated }) {
    const [formData, setFormData] = useState({
        subject: '',
        name: '',
        teacher_id: '',
        co_teacher_id: '',
        capacity: 10,
        color_tag: '#8B5CF6', // Default purple color
        is_recurring: false,
        days_of_week: [],
        start_date: '',
        end_date: '',
        start_time: '10:00',
        end_time: '11:00'
    });

    const [subjects, setSubjects] = useState([]);
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [additionalTeachers, setAdditionalTeachers] = useState([]); // array of staff_id numbers

    useEffect(() => {
        if (isOpen) {
            fetchData();
            setAdditionalTeachers([]);
            setSelectedSubjects([]);
        }
    }, [isOpen]);

    const fetchData = async () => {
        try {
            const [subjectRes, staffRes] = await Promise.all([
                api.get('/admin/subjects'),
                api.get('/staff')
            ]);

            const activeSubjects = subjectRes.data.filter(s => s.is_active);
            setSubjects(activeSubjects);

            const teachers = staffRes.data.filter(s => s.calendar === true);
            setStaff(teachers);

            if (activeSubjects.length > 0) {
                setSelectedSubjects([activeSubjects[0].name]);
                setFormData(prev => ({ ...prev, subject: activeSubjects[0].name }));
            }
            if (teachers.length > 0) {
                setFormData(prev => ({ ...prev, teacher_id: teachers[0].id }));
            }
        } catch (e) {
            console.error("Failed to fetch data", e);
        }
    };

    const handleRecurrenceChange = (type) => {
        setFormData(prev => ({
            ...prev,
            is_recurring: type === 'repeating',
            end_date: type === 'one-time' ? prev.start_date : prev.end_date
        }));
    };

    const toggleDay = (day) => {
        setFormData(prev => {
            const days = prev.days_of_week.includes(day)
                ? prev.days_of_week.filter(d => d !== day)
                : [...prev.days_of_week, day];
            return { ...prev, days_of_week: days };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Validate required fields
            if (!formData.teacher_id) {
                alert("Please select a primary teacher");
                setLoading(false);
                return;
            }

            if (selectedSubjects.length === 0) {
                alert("Please select at least one subject");
                setLoading(false);
                return;
            }

            const payload = {
                ...formData,
                subject: selectedSubjects.length === 1
                    ? selectedSubjects[0]
                    : JSON.stringify(selectedSubjects),
                teacher_id: parseInt(formData.teacher_id),
                co_teacher_id: additionalTeachers.length > 0 ? additionalTeachers[0] : null,
                days_of_week: formData.is_recurring ? formData.days_of_week : null,
                end_date: formData.is_recurring ? formData.end_date : null
            };

            const batchRes = await api.post('/batches', payload);
            const batchId = batchRes.data?.id;

            // Register additional teachers in batch_teachers table
            if (batchId && additionalTeachers.length > 0) {
                await Promise.all(
                    additionalTeachers.map(sid =>
                        api.post(`/batches/${batchId}/teachers`, null, { params: { staff_id: sid } })
                    )
                );
            }

            onCreated();
            onClose();
        } catch (e) {
            console.error("Create batch failed:", e.response?.data || e.message);
            const errorMsg = e.response?.data?.detail
                ? (typeof e.response.data.detail === 'object' ? JSON.stringify(e.response.data.detail) : e.response.data.detail)
                : "Failed to create class. Check console for details.";
            alert(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-800">Create New Class</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* Recurrence Type */}
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        {RECURRENCE_TYPES.map(type => (
                            <button
                                key={type.id}
                                type="button"
                                onClick={() => handleRecurrenceChange(type.id)}
                                className={cn(
                                    "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                                    (formData.is_recurring && type.id === 'repeating') || (!formData.is_recurring && type.id === 'one-time')
                                        ? "bg-white text-[#463A7A] shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                )}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {/* Subject — multi-select chips */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Subject</label>
                            {/* Chips */}
                            <div className="flex flex-wrap gap-1.5 min-h-[36px]">
                                {selectedSubjects.map(name => (
                                    <span key={name} className="flex items-center gap-1 px-2.5 py-1 bg-[#463A7A]/10 text-[#463A7A] rounded-full text-xs font-semibold">
                                        {name}
                                        <button
                                            type="button"
                                            onClick={() => setSelectedSubjects(prev => prev.filter(s => s !== name))}
                                            className="hover:text-red-500 transition-colors ml-0.5"
                                        >
                                            <X size={11} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <select
                                value=""
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val && !selectedSubjects.includes(val)) {
                                        setSelectedSubjects(prev => [...prev, val]);
                                    }
                                }}
                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#463A7A] focus:border-[#463A7A] outline-none text-gray-500 text-sm"
                            >
                                <option value="">+ Add subject...</option>
                                {subjects.filter(s => !selectedSubjects.includes(s.name)).map(s => (
                                    <option key={s.id} value={s.name}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Capacity */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Capacity</label>
                            <div className="relative">
                                <Users size={18} className="absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="number"
                                    value={formData.capacity}
                                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                                    className="w-full pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#463A7A] outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Teacher Selection */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Primary Teacher</label>
                            <select
                                value={formData.teacher_id}
                                onChange={(e) => setFormData({ ...formData, teacher_id: parseInt(e.target.value) })}
                                className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-[#463A7A]"
                            >
                                <option value="">Select Teacher</option>
                                {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Additional Teachers (Optional)</label>
                            {/* Chip strip */}
                            <div className="flex flex-wrap gap-2 min-h-[36px]">
                                {additionalTeachers.map(sid => {
                                    const member = staff.find(s => s.id === sid);
                                    return member ? (
                                        <span key={sid} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#463A7A]/10 text-[#463A7A] rounded-full text-sm font-medium">
                                            {member.name}
                                            <button
                                                type="button"
                                                onClick={() => setAdditionalTeachers(prev => prev.filter(id => id !== sid))}
                                                className="hover:text-red-500 transition-colors"
                                            >
                                                <X size={13} />
                                            </button>
                                        </span>
                                    ) : null;
                                })}
                            </div>
                            {/* Dropdown to add */}
                            <select
                                value=""
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (val && !additionalTeachers.includes(val) && val !== parseInt(formData.teacher_id)) {
                                        setAdditionalTeachers(prev => [...prev, val]);
                                    }
                                }}
                                className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-[#463A7A] text-gray-500"
                            >
                                <option value="">+ Add teacher...</option>
                                {staff
                                    .filter(s => s.id !== parseInt(formData.teacher_id) && !additionalTeachers.includes(s.id))
                                    .map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)
                                }
                            </select>
                        </div>
                    </div>

                    {/* Color Tag */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Class Color Tag</label>
                        <div className="flex gap-2 items-center flex-wrap">
                            {['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#6366F1', '#14B8A6'].map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, color_tag: color })}
                                    className={cn(
                                        "w-10 h-10 rounded-lg border-2 transition-all hover:scale-110",
                                        formData.color_tag === color ? "border-gray-800 shadow-lg scale-110" : "border-gray-200"
                                    )}
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                            <input
                                type="color"
                                value={formData.color_tag}
                                onChange={(e) => setFormData({ ...formData, color_tag: e.target.value })}
                                className="w-10 h-10 rounded-lg border-2 border-gray-200 cursor-pointer"
                                title="Custom color"
                            />
                        </div>
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">From Date</label>
                            <input
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-[#463A7A]"
                                required
                            />
                        </div>
                        {formData.is_recurring && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">To Date</label>
                                <input
                                    type="date"
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-[#463A7A]"
                                    required
                                />
                            </div>
                        )}
                    </div>

                    {/* Days Selection (Recurring Only) */}
                    {formData.is_recurring && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Repeat On</label>
                            <div className="flex gap-2">
                                {DAYS.map(day => (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => toggleDay(day)}
                                        className={cn(
                                            "w-10 h-10 rounded-full text-sm font-medium transition-all",
                                            formData.days_of_week.includes(day)
                                                ? "bg-[#463A7A] text-white shadow-md"
                                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                        )}
                                    >
                                        {day[0]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Start Time</label>
                            <input
                                type="time"
                                value={formData.start_time}
                                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-[#463A7A]"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">End Time</label>
                            <input
                                type="time"
                                value={formData.end_time}
                                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-[#463A7A]"
                                required
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2.5 text-white bg-[#463A7A] hover:bg-[#342a5b] rounded-lg font-medium shadow-md transition-all active:scale-95 disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Class'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
