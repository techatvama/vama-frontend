import React, { useState, useEffect } from 'react';
import { X, Users, Clock, Calendar, Repeat, Info } from 'lucide-react';
import { parseSubject, parseSubjectList } from '../../lib/utils';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { api } from '../../lib/api';

const cn = (...inputs) => twMerge(clsx(inputs));

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#6366F1', '#14B8A6'];

// ── Single-session edit fields ────────────────────────────────────────────
function SingleForm({ data, onChange }) {
    return (
        <div className="space-y-5">
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                <Info size={15} className="mt-0.5 flex-shrink-0" />
                <span>Changes apply <strong>only to this session</strong>. All other classes in this series remain unchanged.</span>
            </div>

            {/* Date */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                    <Calendar size={14} className="text-[#463A7A]" /> Date
                </label>
                <input type="date" value={data.date || ''}
                    onChange={e => onChange({ date: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-xl outline-none focus:border-[#463A7A] focus:ring-2 focus:ring-[#463A7A]/15 text-sm" />
            </div>

            {/* Time */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                        <Clock size={14} className="text-[#463A7A]" /> Start Time
                    </label>
                    <input type="time" value={data.start_time || ''}
                        onChange={e => onChange({ start_time: e.target.value })}
                        className="w-full p-2.5 border border-gray-300 rounded-xl outline-none focus:border-[#463A7A] focus:ring-2 focus:ring-[#463A7A]/15 text-sm" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">End Time</label>
                    <input type="time" value={data.end_time || ''}
                        onChange={e => onChange({ end_time: e.target.value })}
                        className="w-full p-2.5 border border-gray-300 rounded-xl outline-none focus:border-[#463A7A] focus:ring-2 focus:ring-[#463A7A]/15 text-sm" />
                </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Admin Notes</label>
                <textarea value={data.notes || ''} rows={3}
                    onChange={e => onChange({ notes: e.target.value })}
                    placeholder="Optional notes visible to admin only…"
                    className="w-full p-2.5 border border-gray-300 rounded-xl outline-none focus:border-[#463A7A] focus:ring-2 focus:ring-[#463A7A]/15 text-sm resize-none" />
            </div>
        </div>
    );
}

// ── Full batch edit form ───────────────────────────────────────────────────
function BatchForm({ data, onChange, subjects, staff }) {
    const toggleDay = (day) => {
        const days = data.days_of_week || [];
        onChange({ days_of_week: days.includes(day) ? days.filter(d => d !== day) : [...days, day] });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
                <Repeat size={15} className="mt-0.5 flex-shrink-0" />
                <span>Changes apply to <strong>all upcoming sessions</strong> in this series. Past sessions are preserved.</span>
            </div>

            {/* Recurrence toggle */}
            <div className="flex bg-gray-100 p-1 rounded-xl">
                {[{ id: false, label: 'One-Time Class' }, { id: true, label: 'Repeating Event' }].map(t => (
                    <button key={String(t.id)} type="button"
                        onClick={() => onChange({ is_recurring: t.id })}
                        className={cn(
                            "flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all",
                            data.is_recurring === t.id
                                ? "bg-white text-[#463A7A] shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                        )}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Subject + Capacity */}
            <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Subject</label>
                    {/* Chips for selected subjects */}
                    {(() => {
                        const current = parseSubjectList(data.subject);
                        return (
                            <>
                                <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                                    {current.map(name => (
                                        <span key={name} className="flex items-center gap-1 px-2.5 py-1 bg-[#463A7A]/10 text-[#463A7A] rounded-full text-xs font-semibold">
                                            {name}
                                            <button type="button"
                                                onClick={() => {
                                                    const next = current.filter(s => s !== name);
                                                    onChange({ subject: next.length === 1 ? next[0] : JSON.stringify(next) });
                                                }}
                                                className="hover:text-red-500 transition-colors ml-0.5">
                                                <X size={11} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <select value="" onChange={e => {
                                    const val = e.target.value;
                                    if (val && !current.includes(val)) {
                                        const next = [...current, val];
                                        onChange({ subject: next.length === 1 ? next[0] : JSON.stringify(next) });
                                    }
                                }}
                                    className="w-full p-2.5 border border-gray-300 rounded-xl outline-none focus:border-[#463A7A] focus:ring-2 focus:ring-[#463A7A]/15 text-sm text-gray-500">
                                    <option value="">+ Add subject...</option>
                                    {subjects.filter(s => !current.includes(s.name)).map(s => (
                                        <option key={s.id || s.name} value={s.name}>{s.name}</option>
                                    ))}
                                </select>
                            </>
                        );
                    })()}
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                        <Users size={14} className="text-[#463A7A]" /> Capacity
                    </label>
                    <input type="number" min={1} max={100} value={data.capacity || 10}
                        onChange={e => onChange({ capacity: parseInt(e.target.value) || 1 })}
                        className="w-full p-2.5 border border-gray-300 rounded-xl outline-none focus:border-[#463A7A] focus:ring-2 focus:ring-[#463A7A]/15 text-sm" />
                </div>
            </div>

            {/* Teachers */}
            <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Primary Teacher</label>
                    <select value={data.teacher_id || ''} onChange={e => onChange({ teacher_id: parseInt(e.target.value) })}
                        className="w-full p-2.5 border border-gray-300 rounded-xl outline-none focus:border-[#463A7A] focus:ring-2 focus:ring-[#463A7A]/15 text-sm">
                        <option value="">Select Teacher</option>
                        {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Co-Teacher <span className="text-gray-400 font-normal">(optional)</span></label>
                    <select value={data.co_teacher_id || ''} onChange={e => onChange({ co_teacher_id: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-full p-2.5 border border-gray-300 rounded-xl outline-none focus:border-[#463A7A] focus:ring-2 focus:ring-[#463A7A]/15 text-sm">
                        <option value="">None</option>
                        {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Class Name */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Class Name <span className="text-gray-400 font-normal">(optional)</span></label>
                <input type="text" value={data.name || ''}
                    onChange={e => onChange({ name: e.target.value })}
                    placeholder="e.g. Beginner Guitar Batch A"
                    className="w-full p-2.5 border border-gray-300 rounded-xl outline-none focus:border-[#463A7A] focus:ring-2 focus:ring-[#463A7A]/15 text-sm" />
            </div>

            {/* Color Tag */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Class Color</label>
                <div className="flex gap-2 items-center flex-wrap">
                    {COLORS.map(color => (
                        <button key={color} type="button" onClick={() => onChange({ color_tag: color })}
                            className={cn(
                                "w-9 h-9 rounded-lg border-2 transition-all hover:scale-110",
                                data.color_tag === color ? "border-gray-800 scale-110 shadow-lg" : "border-transparent"
                            )}
                            style={{ backgroundColor: color }} />
                    ))}
                    <input type="color" value={data.color_tag || '#8B5CF6'}
                        onChange={e => onChange({ color_tag: e.target.value })}
                        className="w-9 h-9 rounded-lg border-2 border-gray-200 cursor-pointer" title="Custom color" />
                </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                        <Calendar size={14} className="text-[#463A7A]" />
                        {data.is_recurring ? 'From Date' : 'Date'}
                    </label>
                    <input type="date" value={data.start_date || ''}
                        onChange={e => onChange({ start_date: e.target.value })}
                        className="w-full p-2.5 border border-gray-300 rounded-xl outline-none focus:border-[#463A7A] focus:ring-2 focus:ring-[#463A7A]/15 text-sm" />
                </div>
                {data.is_recurring && (
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">To Date</label>
                        <input type="date" value={data.end_date || ''}
                            onChange={e => onChange({ end_date: e.target.value })}
                            className="w-full p-2.5 border border-gray-300 rounded-xl outline-none focus:border-[#463A7A] focus:ring-2 focus:ring-[#463A7A]/15 text-sm" />
                    </div>
                )}
            </div>

            {/* Days of week (recurring) */}
            {data.is_recurring && (
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Repeat On</label>
                    <div className="flex gap-2 flex-wrap">
                        {DAYS.map(day => {
                            const selected = (data.days_of_week || []).includes(day);
                            return (
                                <button key={day} type="button" onClick={() => toggleDay(day)}
                                    className={cn(
                                        "w-10 h-10 rounded-full text-sm font-semibold transition-all",
                                        selected ? "bg-[#463A7A] text-white shadow-md" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                    )}>
                                    {day[0]}
                                </button>
                            );
                        })}
                    </div>
                    <p className="text-xs text-gray-400">
                        Selected: {(data.days_of_week || []).length > 0 ? (data.days_of_week || []).join(', ') : 'None'}
                    </p>
                </div>
            )}

            {/* Times */}
            <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                        <Clock size={14} className="text-[#463A7A]" /> Start Time
                    </label>
                    <input type="time" value={data.start_time || ''}
                        onChange={e => onChange({ start_time: e.target.value })}
                        className="w-full p-2.5 border border-gray-300 rounded-xl outline-none focus:border-[#463A7A] focus:ring-2 focus:ring-[#463A7A]/15 text-sm" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">End Time</label>
                    <input type="time" value={data.end_time || ''}
                        onChange={e => onChange({ end_time: e.target.value })}
                        className="w-full p-2.5 border border-gray-300 rounded-xl outline-none focus:border-[#463A7A] focus:ring-2 focus:ring-[#463A7A]/15 text-sm" />
                </div>
            </div>
        </div>
    );
}

// ── Main export ───────────────────────────────────────────────────────────
/**
 * EditBatchDialog
 * mode: 'single' = edit only this session | 'batch' = edit all classes in the series
 */
export default function EditBatchDialog({ session, initialMode = 'single', isOpen, onClose, onSaved }) {
    const [mode, setMode] = useState(initialMode);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [subjects, setSubjects] = useState([]);
    const [staff, setStaff] = useState([]);

    // Single-session data
    const [singleData, setSingleData] = useState({});

    // Batch data
    const [batchData, setBatchData] = useState({});

    useEffect(() => {
        if (!isOpen || !session) return;
        setMode(initialMode);
        loadData();
    }, [isOpen, session?.id, initialMode]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [subRes, staffRes] = await Promise.all([
                api.get('/admin/subjects'),
                api.get('/staff'),
            ]);
            const activeSubjects = subRes.data.filter(s => s.is_active);
            const allStaff = staffRes.data.filter(s => s.calendar === true);
            setSubjects(activeSubjects);
            setStaff(allStaff);

            // Prefill single-session data from current session
            setSingleData({
                date: session.date,
                start_time: session.start_time,
                end_time: session.end_time,
                notes: session.notes || '',
            });

            // Load batch data
            if (session.batch_id) {
                const batchRes = await api.get(`/batches/${session.batch_id}`);
                setBatchData(batchRes.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (mode === 'single') {
                await api.put(`/sessions/${session.id}`, singleData);
            } else {
                // Update batch + regenerate future sessions
                await api.put(`/batches/${session.batch_id}?regenerate=true`, batchData);
            }
            onSaved();
            onClose();
        } catch (e) {
            console.error(e);
            alert(e.response?.data?.detail || 'Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen || !session) return null;

    const hasRecurrenceId = !!session.recurrence_id;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 backdrop-blur-sm p-4"
            onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}>

                {/* ── Header ── */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Edit Class</h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {parseSubject(session.batch?.subject) || 'Session'} · {session.date}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={18} className="text-gray-500" />
                    </button>
                </div>

                {/* ── Mode Toggle ── */}
                <div className="px-6 pt-5 pb-2">
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setMode('single')}
                            className={cn(
                                "flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all",
                                mode === 'single'
                                    ? "bg-white text-[#463A7A] shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                            )}>
                            Edit this class only
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('batch')}
                            disabled={!hasRecurrenceId}
                            title={!hasRecurrenceId ? 'This class has no repeating series' : ''}
                            className={cn(
                                "flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all",
                                mode === 'batch'
                                    ? "bg-white text-[#463A7A] shadow-sm"
                                    : "text-gray-500 hover:text-gray-700",
                                !hasRecurrenceId && "opacity-40 cursor-not-allowed"
                            )}>
                            Edit all repeating classes
                        </button>
                    </div>
                </div>

                {/* ── Form body ── */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {loading ? (
                        <div className="text-center py-16 text-gray-400 animate-pulse">Loading…</div>
                    ) : mode === 'single' ? (
                        <SingleForm
                            data={singleData}
                            onChange={patch => setSingleData(prev => ({ ...prev, ...patch }))}
                        />
                    ) : (
                        <BatchForm
                            data={batchData}
                            onChange={patch => setBatchData(prev => ({ ...prev, ...patch }))}
                            subjects={subjects}
                            staff={staff}
                        />
                    )}
                </div>

                {/* ── Footer ── */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
                    <p className="text-xs text-gray-400">
                        {mode === 'single'
                            ? 'Only this session will be changed.'
                            : 'Past sessions are preserved. All future sessions will be regenerated.'}
                    </p>
                    <div className="flex gap-3">
                        <button onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button onClick={handleSave} disabled={saving || loading}
                            className="px-6 py-2 text-sm font-semibold text-white bg-[#463A7A] rounded-xl hover:bg-[#342a5b] disabled:opacity-50 transition-colors shadow-sm">
                            {saving ? 'Saving…' : mode === 'single' ? 'Save this class' : 'Save all classes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
