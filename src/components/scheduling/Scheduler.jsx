import React, { useState, useEffect, useRef } from 'react';
import {
    format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
    eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, parse,
} from 'date-fns';
import {
    ChevronLeft, ChevronRight, Plus, ChevronDown,
    Briefcase, Users, Filter, Check, X, LayoutGrid,
} from 'lucide-react';
import SegmentView from './SegmentView';
import { api } from '../../lib/api';
import { parseSubject } from '../../lib/utils';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import TemplateBuilder from './TemplateBuilder';
import ClassSessionCard from './ClassSessionCard';
import OccurrenceDetailDialog from './OccurrenceDetailDialog';

const cn = (...inputs) => twMerge(clsx(inputs));

// ── Multi-teacher dropdown ─────────────────────────────────────────────────
function TeacherMultiSelect({ teachers, selectedTeachers, onChange }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;
        const handle = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, [open]);

    const toggle = (id) => {
        const next = new Set(selectedTeachers);
        next.has(id) ? next.delete(id) : next.add(id);
        onChange(next);
    };

    const count = selectedTeachers.size;
    const label = count === 0
        ? 'All Teachers'
        : count === 1
            ? (teachers.find(t => selectedTeachers.has(t.id))?.name ?? '1 Teacher')
            : `${count} Teachers`;

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(o => !o)}
                className={cn(
                    "flex items-center gap-2 pl-3 pr-3 py-2 border rounded-lg text-sm font-medium transition-all",
                    "focus:outline-none focus:ring-2 focus:ring-[#463A7A]/20",
                    count > 0
                        ? "bg-[#463A7A]/5 border-[#463A7A] text-[#463A7A]"
                        : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"
                )}
                style={{ minWidth: 155 }}
            >
                <Users size={14} className="text-gray-400 flex-shrink-0" />
                <span className="flex-1 text-left truncate">{label}</span>
                {count > 0
                    ? <button onClick={(e) => { e.stopPropagation(); onChange(new Set()); }}
                        className="ml-1 text-gray-400 hover:text-gray-700 leading-none flex-shrink-0">
                        <X size={12} />
                      </button>
                    : <ChevronDown size={12} className="text-gray-400 flex-shrink-0" />}
            </button>

            {open && (
                <div className="absolute top-full left-0 mt-1.5 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-50 min-w-[210px] max-h-72 overflow-y-auto">
                    <div className="flex items-center justify-between px-3 pb-1.5 border-b border-gray-100 mb-1">
                        <button onClick={() => onChange(new Set(teachers.map(t => t.id)))}
                            className="text-xs text-[#463A7A] font-semibold hover:underline">Select all</button>
                        <button onClick={() => onChange(new Set())}
                            className="text-xs text-gray-400 font-semibold hover:underline">Clear</button>
                    </div>
                    {teachers.length === 0 && (
                        <div className="px-3 py-3 text-xs text-gray-400 text-center">
                            No teachers — enable Calendar in All Staff
                        </div>
                    )}
                    {teachers.map(t => {
                        const sel = selectedTeachers.has(t.id);
                        return (
                            <button key={t.id} onClick={() => toggle(t.id)}
                                className={cn(
                                    "w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-50 transition-colors",
                                    sel && "bg-[#463A7A]/5"
                                )}>
                                <div className="w-6 h-6 rounded-full bg-[#463A7A]/15 text-[#463A7A] flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                    {t.name?.[0]}
                                </div>
                                <span className={cn("text-sm truncate flex-1", sel ? "font-semibold text-[#463A7A]" : "text-gray-700")}>
                                    {t.name}
                                </span>
                                {sel && <Check size={13} className="text-[#463A7A] flex-shrink-0" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

const toMins = (t) => {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
};

const fmtTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'pm' : 'am';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
};

/**
 * Google-Calendar-style layout: overlapping sessions get placed in sub-columns.
 * Returns { [sessionId]: { col: 0-indexed, totalCols: N } }
 */
function computeDayLayout(sessions) {
    const sorted = [...sessions].sort((a, b) => toMins(a.start_time) - toMins(b.start_time));
    const result = {};       // sessionId -> { col }
    const colEnds = [];      // colEnds[i] = endMinutes of last session placed in column i

    for (const s of sorted) {
        const startMins = toMins(s.start_time);
        const endMins   = toMins(s.end_time);

        // Find first column where the last session has already ended
        let col = 0;
        while (col < colEnds.length && colEnds[col] > startMins) col++;

        if (col === colEnds.length) colEnds.push(endMins);
        else colEnds[col] = endMins;

        result[s.id] = { col };
    }

    // Second pass: for each session, find how many total columns its overlap group needs
    for (const s of sorted) {
        const sStart = toMins(s.start_time);
        const sEnd   = toMins(s.end_time);
        let maxCol = result[s.id].col;

        for (const other of sorted) {
            if (other.id === s.id) continue;
            const oStart = toMins(other.start_time);
            const oEnd   = toMins(other.end_time);
            // Overlaps if they share any minute
            if (oStart < sEnd && oEnd > sStart) {
                maxCol = Math.max(maxCol, result[other.id].col);
            }
        }
        result[s.id].totalCols = maxCol + 1;
    }

    return result;
}

const SUBJECT_COLORS = {
    Guitar:   '#10b981',
    Piano:    '#3b82f6',
    Drums:    '#f97316',
    Vocals:   '#ec4899',
    Violin:   '#8b5cf6',
    Keyboard: '#6366f1',
};

/** Month view pill — compact but informative */
function MonthPill({ session, onClick }) {
    const subject = parseSubject(session.batch?.subject) || 'Class';
    const color   = session.batch?.color_tag || SUBJECT_COLORS[session.batch?.subject] || '#64748b';
    const students = session.enrolled_students || [];
    const count    = session.enrollment_count || 0;
    const capacity = session.batch?.capacity || session.capacity || 0;
    const teacher  = session.batch?.teacher?.name || '';
    const isCancelled = session.status === 'cancelled';

    return (
        <div
            onClick={() => onClick(session)}
            className={cn(
                "rounded-lg px-2 py-1.5 cursor-pointer transition-all hover:shadow-md hover:-translate-y-px mb-1 group",
                isCancelled && "opacity-50"
            )}
            style={{ backgroundColor: color + '15', borderLeft: `3px solid ${color}` }}
        >
            {/* Row 1: time + count */}
            <div className="flex items-center justify-between mb-0.5">
                <span className="text-[9px] font-bold font-mono" style={{ color }}>
                    {fmtTime(session.start_time)}
                </span>
                <span className={cn(
                    "text-[9px] font-bold px-1 rounded-full",
                    count >= capacity ? "bg-orange-100 text-orange-700" : "bg-white/60 text-slate-500"
                )}>
                    {count}/{capacity}
                </span>
            </div>
            {/* Row 2: subject */}
            <div className="text-[10px] font-black uppercase tracking-wide truncate" style={{ color }}>
                {subject}
            </div>
            {/* Row 3: teacher */}
            {teacher && (
                <div className="text-[9px] text-slate-500 truncate mt-0.5">{teacher}</div>
            )}
            {/* Row 4: student names */}
            {students.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-x-1">
                    {students.slice(0, 3).map(st => (
                        <span key={st.id} className="text-[9px] font-medium truncate" style={{ color }}>
                            {st.first_name} {st.last_name?.[0]}.
                        </span>
                    ))}
                    {count > 3 && (
                        <span className="text-[9px] text-slate-400">+{count - 3}</span>
                    )}
                </div>
            )}
            {isCancelled && (
                <span className="text-[8px] text-red-500 font-bold uppercase">Cancelled</span>
            )}
        </div>
    );
}

// ── Mini date-picker popup ─────────────────────────────────────────────────
function DatePickerPopup({ currentDate, onSelect, onClose }) {
    const [pickerMonth, setPickerMonth] = useState(startOfMonth(currentDate));
    const ref = useRef(null);

    useEffect(() => {
        const handle = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, [onClose]);

    const days = eachDayOfInterval({
        start: startOfWeek(pickerMonth, { weekStartsOn: 1 }),
        end:   endOfWeek(endOfMonth(pickerMonth), { weekStartsOn: 1 }),
    });

    return (
        <div
            ref={ref}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 w-[272px] select-none"
            style={{ minWidth: 272 }}
        >
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-3">
                <button
                    onClick={() => setPickerMonth(m => subMonths(m, 1))}
                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                >
                    <ChevronLeft size={14} />
                </button>
                <span className="text-sm font-bold text-gray-800">
                    {format(pickerMonth, 'MMMM yyyy')}
                </span>
                <button
                    onClick={() => setPickerMonth(m => addMonths(m, 1))}
                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                >
                    <ChevronRight size={14} />
                </button>
            </div>

            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 mb-1">
                {['M','T','W','T','F','S','S'].map((d, i) => (
                    <div key={i} className="text-center text-[11px] font-semibold text-gray-400 py-1">
                        {d}
                    </div>
                ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-y-0.5">
                {days.map(day => {
                    const inMonth  = isSameMonth(day, pickerMonth);
                    const isToday  = isSameDay(day, new Date());
                    const isSel    = isSameDay(day, currentDate);
                    return (
                        <button
                            key={day.toString()}
                            onClick={() => { onSelect(day); onClose(); }}
                            className={cn(
                                "mx-auto w-8 h-8 flex items-center justify-center rounded-full text-xs font-medium transition-colors",
                                !inMonth && "text-gray-300 hover:bg-gray-50",
                                inMonth && !isToday && !isSel && "text-gray-700 hover:bg-[#463A7A]/10 hover:text-[#463A7A]",
                                isToday && !isSel && "bg-[#463A7A] text-white font-bold",
                                isSel   && "bg-[#463A7A] text-white font-bold ring-2 ring-[#463A7A]/30",
                            )}
                        >
                            {format(day, 'd')}
                        </button>
                    );
                })}
            </div>

            {/* Jump to today shortcut */}
            <div className="mt-3 pt-3 border-t border-gray-100 text-center">
                <button
                    onClick={() => { onSelect(new Date()); onClose(); }}
                    className="text-xs font-semibold text-[#463A7A] hover:underline"
                >
                    Go to today
                </button>
            </div>
        </div>
    );
}

export default function Scheduler() {
    const [currentDate, setCurrentDate]         = useState(new Date());
    const [viewMode, setViewMode]               = useState('week');
    const [sessions, setSessions]               = useState([]);
    const [loading, setLoading]                 = useState(false);
    const [teachers, setTeachers]               = useState([]);
    const [subjects, setSubjects]               = useState([]);
    const [selectedTeachers, setSelectedTeachers] = useState(new Set());
    const [selectedSubject, setSelectedSubject]   = useState('');
    const [enrollmentFilter, setEnrollmentFilter] = useState('');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [segmentByTeacher, setSegmentByTeacher] = useState(false);

    useEffect(() => {
        fetchSessions();
        fetchTeachers();
    }, [currentDate, viewMode, enrollmentFilter]);

    const fetchTeachers = async () => {
        try {
            const res = await api.get('/staff');
            setTeachers(res.data.filter(s => s.calendar !== false));
        } catch (e) { console.error(e); }
    };

    const fetchSessions = async () => {
        setLoading(true);
        try {
            let start, end;
            if (viewMode === 'day') {
                start = end = currentDate;
            } else if (viewMode === 'week') {
                start = startOfWeek(currentDate, { weekStartsOn: 1 });
                end   = endOfWeek(currentDate,   { weekStartsOn: 1 });
            } else {
                start = startOfMonth(currentDate);
                end   = endOfMonth(currentDate);
            }
            const res = await api.get('/scheduling/calendar', {
                params: {
                    start: format(start, 'yyyy-MM-dd'),
                    end:   format(end,   'yyyy-MM-dd'),
                },
            });
            const occ = res.data.occurrences || [];
            setSessions(occ);
            const uniq = [...new Set(occ.map(s => s.batch?.subject).filter(Boolean))].sort();
            setSubjects(uniq.map(s => ({ raw: s, label: parseSubject(s) })));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const navigate = (dir) => {
        const d = dir === 'next' ? 1 : -1;
        if (viewMode === 'day')   setCurrentDate(addDays(currentDate, d));
        if (viewMode === 'week')  setCurrentDate(addWeeks(currentDate, d));
        if (viewMode === 'month') setCurrentDate(addMonths(currentDate, d));
    };

    const filteredSessions = sessions.filter(s => {
        if (selectedTeachers.size > 0 && !selectedTeachers.has(s.batch?.teacher_id)) return false;
        if (selectedSubject && s.batch?.subject !== selectedSubject) return false;
        if (enrollmentFilter) {
            const count = s.enrollment_count || 0;
            const cap = s.batch?.capacity || s.capacity || 0;
            if (enrollmentFilter === 'fully_booked') { if (!(cap > 0 && count >= cap)) return false; }
            else if (count !== Number(enrollmentFilter)) return false;
        }
        return true;
    });

    // ── Constants ──────────────────────────────────────────────────────────
    const START_HOUR  = 8;
    const END_HOUR    = 21;
    const PX_PER_HOUR = viewMode === 'day' ? 100 : 88;
    const HOURS       = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
    const TOTAL_PX    = HOURS.length * PX_PER_HOUR;

    // ── Week / Day view ────────────────────────────────────────────────────
    const renderTimeGrid = () => {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const days = viewMode === 'day'
            ? [currentDate]
            : Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

        return (
            <div className="flex flex-col h-full overflow-hidden bg-white rounded-xl shadow-sm border border-gray-200">
                {/* Day headers */}
                <div className="flex border-b border-gray-100 flex-shrink-0">
                    <div className="w-14 flex-shrink-0 border-r border-gray-100 bg-gray-50/50" />
                    {days.map(day => {
                        const isToday = isSameDay(day, new Date());
                        return (
                            <button
                                key={day.toString()}
                                onClick={() => { setCurrentDate(day); setViewMode('day'); }}
                                className={cn(
                                    "flex-1 py-3 text-center border-r border-gray-100 last:border-0 transition-colors hover:bg-[#463A7A]/5 cursor-pointer",
                                    isToday && "bg-[#463A7A]/5"
                                )}
                            >
                                <div className={cn("text-[11px] font-semibold uppercase tracking-wide mb-1",
                                    isToday ? "text-[#463A7A]" : "text-gray-400")}>
                                    {format(day, 'EEE')}
                                </div>
                                <div className={cn(
                                    "text-lg font-bold leading-none mx-auto w-8 h-8 flex items-center justify-center rounded-full transition-colors",
                                    isToday ? "bg-[#463A7A] text-white" : "text-gray-800 hover:bg-[#463A7A]/10 hover:text-[#463A7A]"
                                )}>
                                    {format(day, 'd')}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Scrollable grid */}
                <div className="flex-1 overflow-y-auto">
                    <div className="flex" style={{ minHeight: `${TOTAL_PX}px` }}>
                        {/* Time labels */}
                        <div className="w-14 flex-shrink-0 border-r border-gray-100 bg-gray-50/30 relative">
                            {HOURS.map(h => (
                                <div key={h} style={{ height: PX_PER_HOUR }}
                                    className="text-[10px] text-gray-400 text-right pr-2 pt-1.5 border-b border-gray-100/50 leading-none">
                                    {format(new Date().setHours(h, 0), 'h a')}
                                </div>
                            ))}
                        </div>

                        {/* Day columns */}
                        {days.map(day => {
                            const daySessions = filteredSessions.filter(s =>
                                isSameDay(parse(s.date, 'yyyy-MM-dd', new Date()), day));
                            const layout = computeDayLayout(daySessions);

                            return (
                                <div key={day.toString()}
                                    className="flex-1 border-r border-gray-100 last:border-0 relative bg-white">
                                    {/* Hour grid lines */}
                                    {HOURS.map(h => (
                                        <div key={h} style={{ height: PX_PER_HOUR }}
                                            className="border-b border-gray-100/60" />
                                    ))}

                                    {/* Half-hour dotted lines */}
                                    {HOURS.map(h => (
                                        <div key={`h-${h}`}
                                            className="absolute w-full border-b border-gray-100/30 border-dashed pointer-events-none"
                                            style={{ top: (h - START_HOUR) * PX_PER_HOUR + PX_PER_HOUR / 2 }} />
                                    ))}

                                    {/* Session cards */}
                                    {daySessions.map(session => {
                                        const { col, totalCols } = layout[session.id] || { col: 0, totalCols: 1 };
                                        const startMins = toMins(session.start_time);
                                        const endMins   = toMins(session.end_time);
                                        const top    = ((startMins - START_HOUR * 60) / 60) * PX_PER_HOUR;
                                        const height = Math.max(((endMins - startMins) / 60) * PX_PER_HOUR, 52);

                                        const GAP   = 2; // px between parallel sessions
                                        const pctW  = 100 / totalCols;
                                        const left  = `calc(${col * pctW}% + ${GAP}px)`;
                                        const width = `calc(${pctW}% - ${GAP * 2}px)`;

                                        return (
                                            <div key={session.id}
                                                className="absolute z-10"
                                                style={{ top, height, left, width, minHeight: 52 }}>
                                                <ClassSessionCard
                                                    session={session}
                                                    onClick={handleSessionClick}
                                                    compact={totalCols > 1}
                                                    viewMode={viewMode}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    // ── Month view ─────────────────────────────────────────────────────────
    const renderMonthView = () => {
        const monthStart = startOfMonth(currentDate);
        const days = eachDayOfInterval({
            start: startOfWeek(monthStart, { weekStartsOn: 1 }),
            end:   endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 }),
        });

        return (
            <div className="h-full bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
                {/* Weekday headers */}
                <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                        <div key={d} className="py-3 text-center text-xs font-bold uppercase text-gray-400 tracking-wide">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 flex-1 overflow-hidden" style={{ gridAutoRows: '1fr' }}>
                    {days.map(day => {
                        const daySessions = filteredSessions
                            .filter(s => isSameDay(parse(s.date, 'yyyy-MM-dd', new Date()), day))
                            .sort((a, b) => toMins(a.start_time) - toMins(b.start_time));
                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const isToday = isSameDay(day, new Date());
                        return (
                            <div key={day.toString()}
                                className={cn(
                                    "border-b border-r border-gray-100 p-1.5 overflow-hidden min-h-[90px] transition-colors",
                                    !isCurrentMonth ? "bg-gray-50/60" : "bg-white",
                                    isToday && "bg-[#463A7A]/3"
                                )}>
                                {/* Date number — click to drill into day */}
                                <div className="mb-1.5">
                                    <button
                                        onClick={() => { setCurrentDate(day); setViewMode('day'); }}
                                        className={cn(
                                            "text-xs font-bold inline-flex items-center justify-center w-6 h-6 rounded-full transition-colors",
                                            isToday
                                                ? "bg-[#463A7A] text-white"
                                                : isCurrentMonth
                                                    ? "text-gray-700 hover:bg-[#463A7A] hover:text-white"
                                                    : "text-gray-300 hover:bg-gray-200 hover:text-gray-600"
                                        )}
                                    >
                                        {format(day, 'd')}
                                    </button>
                                </div>
                                {/* Session pills — click pill for detail, click "more" to open day view */}
                                <div className="space-y-0.5 overflow-y-auto max-h-[calc(100%-28px)]">
                                    {daySessions.slice(0, 3).map(s => (
                                        <MonthPill key={s.id} session={s} onClick={handleSessionClick} />
                                    ))}
                                    {daySessions.length > 3 && (
                                        <button
                                            onClick={() => { setCurrentDate(day); setViewMode('day'); }}
                                            className="w-full text-left text-[9px] font-bold text-[#463A7A] hover:underline px-1 py-0.5"
                                        >
                                            +{daySessions.length - 3} more
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const handleSessionClick = (s) => setSelectedSession(s);

    // ── Filter bar helpers ─────────────────────────────────────────────────
    const FilterSelect = ({ value, onChange, icon: Icon, placeholder, options, minWidth = 150 }) => (
        <div className="relative">
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className={cn(
                    "appearance-none pl-9 pr-7 py-2 border rounded-lg text-sm font-medium transition-all",
                    "focus:outline-none focus:ring-2 focus:ring-[#463A7A]/20",
                    value
                        ? "bg-[#463A7A]/5 border-[#463A7A] text-[#463A7A]"
                        : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"
                )}
                style={{ minWidth }}
            >
                <option value="">{placeholder}</option>
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            {value && (
                <button onClick={() => onChange('')}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xs font-bold leading-none">
                    ×
                </button>
            )}
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
            <div className="flex-1 flex flex-col h-full overflow-hidden">

                {/* ── Header ── */}
                <header className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200 shadow-sm z-20 gap-3 flex-wrap">
                    {/* Filters */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <TeacherMultiSelect
                            teachers={teachers}
                            selectedTeachers={selectedTeachers}
                            onChange={setSelectedTeachers}
                        />
                        <FilterSelect
                            value={selectedSubject}
                            onChange={setSelectedSubject}
                            icon={Briefcase}
                            placeholder="All Subjects"
                            options={subjects.map(s => ({ value: s.raw, label: s.label }))}
                            minWidth={140}
                        />
                        <FilterSelect
                            value={enrollmentFilter}
                            onChange={setEnrollmentFilter}
                            icon={Filter}
                            placeholder="All Enrollments"
                            options={[
                                { value: '0', label: '0 students (Empty)' },
                                { value: '1', label: '1 student' },
                                { value: '2', label: '2 students' },
                                { value: '3', label: '3 students' },
                                { value: 'fully_booked', label: 'Fully booked' },
                            ]}
                            minWidth={170}
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Date nav */}
                        <div className="flex items-center border border-gray-200 rounded-lg shadow-sm">
                            <button onClick={() => navigate('prev')}
                                className="px-3 py-2 border-r border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors rounded-l-lg">
                                <ChevronLeft size={15} />
                            </button>
                            <button onClick={() => { setCurrentDate(new Date()); setViewMode('day'); }}
                                className="px-3 py-2 text-sm font-medium text-gray-700 border-r border-gray-200 hover:bg-gray-50 transition-colors">
                                Today
                            </button>
                            <div className="relative">
                                <button
                                    onClick={() => setShowDatePicker(v => !v)}
                                    className="px-4 py-2 text-sm font-semibold text-gray-700 min-w-[190px] text-center hover:bg-[#463A7A]/5 hover:text-[#463A7A] transition-colors"
                                >
                                    {viewMode === 'month'
                                        ? format(currentDate, 'MMMM yyyy')
                                        : viewMode === 'week'
                                            ? `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d')} – ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d, yyyy')}`
                                            : format(currentDate, 'EEEE, MMM d, yyyy')}
                                </button>
                                {showDatePicker && (
                                    <DatePickerPopup
                                        currentDate={currentDate}
                                        onSelect={(day) => { setCurrentDate(day); setViewMode('day'); }}
                                        onClose={() => setShowDatePicker(false)}
                                    />
                                )}
                            </div>
                            <button onClick={() => navigate('next')}
                                className="px-3 py-2 border-l border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors rounded-r-lg">
                                <ChevronRight size={15} />
                            </button>
                        </div>

                        {/* View toggle */}
                        <div className="flex bg-gray-100 rounded-lg p-0.5">
                            {['Day', 'Week', 'Month'].map(v => (
                                <button key={v} onClick={() => setViewMode(v.toLowerCase())}
                                    className={cn("px-3 py-1.5 text-xs font-semibold rounded-md transition-all",
                                        viewMode === v.toLowerCase()
                                            ? "bg-white text-[#463A7A] shadow-sm"
                                            : "text-gray-500 hover:text-gray-700")}>
                                    {v}
                                </button>
                            ))}
                        </div>

                        {/* Segment-by-instructor toggle */}
                        <button onClick={() => setSegmentByTeacher(v => !v)}
                            title="Show a side-by-side column per instructor"
                            className={cn("flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all border",
                                segmentByTeacher
                                    ? "bg-[#463A7A] text-white border-[#463A7A]"
                                    : "bg-white text-gray-600 border-gray-300 hover:border-gray-400")}>
                            <LayoutGrid size={15} /> Instructors
                        </button>

                        <button
                            onClick={() => setIsCreateDialogOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-[#463A7A] text-white rounded-lg hover:bg-[#342a5b] transition-all shadow-sm active:scale-95 font-semibold text-sm">
                            <Plus size={15} /> Create Class
                        </button>
                    </div>
                </header>

                {/* ── Calendar body ── */}
                <div className="flex-1 overflow-auto p-4 bg-gray-50">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="w-8 h-8 border-2 border-[#463A7A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                <p className="text-sm text-gray-400 font-medium">Loading schedule…</p>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full">
                            {segmentByTeacher ? (
                                <SegmentView
                                    sessions={filteredSessions}
                                    teachers={teachers}
                                    selectedTeachers={selectedTeachers}
                                    viewMode={viewMode}
                                    currentDate={currentDate}
                                    onSessionClick={handleSessionClick}
                                />
                            ) : (
                                <>
                                    {(viewMode === 'week' || viewMode === 'day') && renderTimeGrid()}
                                    {viewMode === 'month' && renderMonthView()}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {isCreateDialogOpen && (
                <TemplateBuilder
                    onClose={() => setIsCreateDialogOpen(false)}
                    onCreated={() => { fetchSessions(); setIsCreateDialogOpen(false); }}
                />
            )}

            {selectedSession && (
                <OccurrenceDetailDialog
                    session={selectedSession}
                    onClose={() => setSelectedSession(null)}
                    onUpdate={fetchSessions}
                />
            )}
        </div>
    );
}
