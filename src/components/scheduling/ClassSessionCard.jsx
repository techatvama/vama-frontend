import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { parseSubject } from '../../lib/utils';

const cn = (...inputs) => twMerge(clsx(inputs));

const THEMES = {
    Guitar:   { border: '#10b981', bg: '#ecfdf5', text: '#065f46' },
    Piano:    { border: '#3b82f6', bg: '#eff6ff', text: '#1e3a8a' },
    Drums:    { border: '#f97316', bg: '#fff7ed', text: '#7c2d12' },
    Vocals:   { border: '#ec4899', bg: '#fdf2f8', text: '#831843' },
    Violin:   { border: '#8b5cf6', bg: '#f5f3ff', text: '#4c1d95' },
    Keyboard: { border: '#6366f1', bg: '#eef2ff', text: '#312e81' },
    Default:  { border: '#64748b', bg: '#f8fafc', text: '#1e293b' },
};

const fmtTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'pm' : 'am';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
};

/**
 * viewMode: 'day' | 'week'
 * compact:  true when session shares a time slot with another (parallel columns)
 *
 * Day view (non-compact): wide card — show ALL students as prominent chips
 * Day view (compact):     narrow column — initials avatars row
 * Week view (non-compact): medium — show up to 4 students as mini chips
 * Week view (compact):    narrow — initials avatars row
 */
export default function ClassSessionCard({ session, onClick, compact = false, viewMode = 'week' }) {
    const subject  = parseSubject(session.batch?.subject) || 'Class';
    const theme    = THEMES[subject] || THEMES.Default;
    const colorTag = session.batch?.color_tag;

    const borderColor = colorTag || theme.border;
    const bgColor     = colorTag ? colorTag + '12' : theme.bg;
    const textColor   = theme.text;

    const enrollmentCount  = session.enrollment_count || 0;
    const capacity         = session.batch?.capacity || session.capacity || 10;
    const enrolledStudents = session.enrolled_students || [];
    const teacher          = session.batch?.teacher?.name || '';
    const batchName        = session.batch?.name || '';
    const status           = session.status || 'scheduled';

    const isFullyBooked = enrollmentCount >= capacity;
    const isEmpty       = enrollmentCount === 0;
    const occupancyPct  = capacity > 0 ? Math.round((enrollmentCount / capacity) * 100) : 0;
    const isCancelled   = status === 'cancelled';
    const isCompleted   = status === 'completed';
    const isDraft       = session.is_published === false;
    const isDayView     = viewMode === 'day';

    // In day view show every student; week view caps at 4
    const studentLimit  = isDayView && !compact ? enrolledStudents.length : (compact ? 2 : 4);
    const visibleStudents = enrolledStudents.slice(0, studentLimit);
    const extraCount      = Math.max(0, enrollmentCount - visibleStudents.length);

    return (
        <div
            onClick={() => onClick(session)}
            className="group relative w-full h-full rounded-lg cursor-pointer overflow-hidden flex flex-col transition-all hover:shadow-lg hover:-translate-y-px"
            style={{
                backgroundColor: bgColor,
                borderLeft: `3px solid ${borderColor}`,
                boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
                opacity: isCancelled ? 0.6 : 1,
            }}
        >
            {/* Cancelled stripe */}
            {isCancelled && (
                <div className="absolute inset-0 pointer-events-none"
                    style={{ background: 'repeating-linear-gradient(45deg,transparent,transparent 6px,rgba(0,0,0,0.04) 6px,rgba(0,0,0,0.04) 12px)' }} />
            )}

            {/* Draft watermark */}
            {isDraft && (
                <div className="absolute top-0 right-0 px-1 py-0.5 bg-gray-200/80 text-gray-500 text-[7px] font-bold uppercase rounded-bl-md">
                    Draft
                </div>
            )}

            {/* ── TOP ROW: Time + Fraction ── */}
            <div className="flex items-center justify-between px-2 pt-1.5 pb-0 flex-shrink-0">
                <span className={cn("font-bold font-mono leading-none", isDayView && !compact ? "text-[11px]" : "text-[10px]")}
                    style={{ color: borderColor }}>
                    {compact
                        ? fmtTime(session.start_time)
                        : `${fmtTime(session.start_time)} – ${fmtTime(session.end_time)}`}
                </span>
                <span className={cn(
                    "text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0",
                    isFullyBooked ? "bg-orange-100 text-orange-700"
                        : isEmpty ? "bg-yellow-100 text-yellow-700"
                        : "bg-white/70 text-slate-600"
                )}>
                    {enrollmentCount}/{capacity}
                </span>
            </div>

            {/* ── SUBJECT + BADGES ── */}
            <div className="flex items-center gap-1 px-2 pb-0.5 flex-shrink-0">
                <span className={cn("font-black uppercase tracking-wide truncate", isDayView && !compact ? "text-[11px]" : "text-[10px]")}
                    style={{ color: borderColor }}>
                    {subject}
                </span>
                {!compact && batchName && (
                    <span className="text-[8px] text-slate-400 truncate hidden sm:block">
                        {batchName.replace(subject, '').trim()}
                    </span>
                )}
                {isCancelled && <span className="text-[7px] bg-red-100 text-red-600 px-1 rounded font-bold ml-auto flex-shrink-0">CANC</span>}
                {isCompleted && <span className="text-[7px] bg-green-100 text-green-600 px-1 rounded font-bold ml-auto flex-shrink-0">DONE</span>}
            </div>

            {/* ── TEACHER ── */}
            {teacher && (
                <div className="flex items-center gap-1 px-2 pb-0.5 flex-shrink-0">
                    <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-black text-white flex-shrink-0"
                        style={{ backgroundColor: borderColor + 'cc' }}>
                        {teacher[0]}
                    </div>
                    <span className={cn("truncate leading-none", compact ? "text-[8px]" : isDayView ? "text-[10px] font-semibold" : "text-[9px]")}
                        style={{ color: textColor, opacity: 0.85 }}>
                        {teacher}
                    </span>
                </div>
            )}

            {/* ── STUDENTS: Day view — prominent chips (all students) ── */}
            {isDayView && !compact && enrolledStudents.length > 0 && (
                <div className="px-2 flex-1 overflow-y-auto min-h-0 mt-0.5 pb-0.5"
                    style={{ scrollbarWidth: 'none' }}>
                    <div className="space-y-0.5">
                        {enrolledStudents.map((s, i) => (
                            <div key={s.id}
                                className="flex items-center gap-1.5 rounded-md px-1.5 py-0.5"
                                style={{ backgroundColor: borderColor + '1a' }}>
                                <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-black text-white flex-shrink-0"
                                    style={{ backgroundColor: borderColor + (i < 3 ? 'dd' : 'aa') }}>
                                    {s.first_name?.[0]}{s.last_name?.[0]}
                                </div>
                                <span className="text-[10px] font-semibold truncate leading-none" style={{ color: textColor }}>
                                    {s.first_name} {s.last_name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {isDayView && !compact && isEmpty && (
                <div className="flex-1 flex items-center px-2">
                    <span className="text-[9px] text-yellow-600 font-semibold italic">No students yet</span>
                </div>
            )}

            {/* ── STUDENTS: Week view full — mini chips ── */}
            {!isDayView && visibleStudents.length > 0 && !compact && (
                <div className="px-2 flex-1 overflow-hidden min-h-0 mt-0.5">
                    <div className="space-y-0.5">
                        {visibleStudents.map((s, i) => (
                            <div key={s.id}
                                className="flex items-center gap-1 rounded px-1 py-px"
                                style={{ backgroundColor: borderColor + '15' }}>
                                <div className="w-3 h-3 rounded-full flex items-center justify-center text-[6px] font-black text-white flex-shrink-0"
                                    style={{ backgroundColor: borderColor + (i === 0 ? 'ee' : i === 1 ? 'aa' : '77') }}>
                                    {s.first_name?.[0]}{s.last_name?.[0]}
                                </div>
                                <span className="text-[9px] font-semibold truncate" style={{ color: textColor }}>
                                    {s.first_name} {s.last_name}
                                </span>
                            </div>
                        ))}
                        {extraCount > 0 && (
                            <div className="text-[8px] font-semibold pl-1" style={{ color: borderColor }}>
                                +{extraCount} more
                            </div>
                        )}
                    </div>
                </div>
            )}

            {!isDayView && isEmpty && !compact && (
                <div className="flex-1 flex items-center px-2">
                    <span className="text-[9px] text-yellow-600 font-semibold italic">No students yet</span>
                </div>
            )}

            {/* ── STUDENTS: Compact mode (overlapping) — initials avatars row ── */}
            {compact && visibleStudents.length > 0 && (
                <div className="px-2 pb-0.5 flex-1 overflow-hidden">
                    <div className="flex items-center -space-x-1">
                        {visibleStudents.map((s, i) => (
                            <div key={s.id}
                                className="w-4 h-4 rounded-full border border-white flex items-center justify-center text-[6px] font-black text-white"
                                style={{ backgroundColor: borderColor + (i === 0 ? 'ee' : i === 1 ? 'aa' : '77') }}
                                title={`${s.first_name} ${s.last_name}`}>
                                {s.first_name?.[0]}{s.last_name?.[0]}
                            </div>
                        ))}
                        {extraCount > 0 && (
                            <div className="w-4 h-4 rounded-full border border-white bg-gray-300 flex items-center justify-center text-[6px] font-bold text-gray-600">
                                +{extraCount}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── OCCUPANCY BAR ── */}
            <div className="px-2 pb-1.5 mt-auto flex-shrink-0">
                <div className="w-full bg-black/8 rounded-full overflow-hidden" style={{ height: 2 }}>
                    <div className="h-full rounded-full transition-all"
                        style={{
                            width: `${occupancyPct}%`,
                            backgroundColor: isFullyBooked ? '#f97316' : isEmpty ? '#eab308' : borderColor,
                        }} />
                </div>
            </div>

            {/* Right-edge hover accent */}
            <div className="absolute right-0 top-0 bottom-0 w-[2px] opacity-0 group-hover:opacity-100 transition-opacity rounded-r"
                style={{ backgroundColor: borderColor }} />
        </div>
    );
}
