import { parseSubject } from '../../lib/utils';
import { format, parse, isSameDay, addDays, startOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { Users } from 'lucide-react';

const SUBJECT_COLORS = {
    Guitar: '#10b981', Piano: '#3b82f6', Drums: '#f97316',
    Vocals: '#ec4899', Violin: '#8b5cf6', Keyboard: '#6366f1',
};
const toMins = (t) => { if (!t) return 0; const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const fmtTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ap = h >= 12 ? 'pm' : 'am';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ap}`;
};
const teacherOf = (s) => s.teacher_id ?? s.batch?.teacher_id;
const colorOf = (s) => s.batch?.color_tag || SUBJECT_COLORS[s.batch?.subject] || '#64748b';

const START_HOUR = 8, END_HOUR = 21, PX = 80;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

function computeLayout(items) {
    const sorted = [...items].sort((a, b) => toMins(a.start_time) - toMins(b.start_time));
    const res = {}, colEnds = [];
    for (const s of sorted) {
        const start = toMins(s.start_time), end = toMins(s.end_time);
        let col = 0;
        while (col < colEnds.length && colEnds[col] > start) col++;
        if (col === colEnds.length) colEnds.push(end); else colEnds[col] = end;
        res[s.id] = { col };
    }
    for (const s of sorted) {
        const start = toMins(s.start_time), end = toMins(s.end_time);
        let max = res[s.id].col;
        for (const o of sorted) {
            if (o.id === s.id) continue;
            if (toMins(o.start_time) < end && toMins(o.end_time) > start) max = Math.max(max, res[o.id].col);
        }
        res[s.id].totalCols = max + 1;
    }
    return res;
}

// ── A single class card with students visible (used in agenda mode) ──
function StudentChips({ session }) {
    const students = session.enrolled_students || [];
    const color = colorOf(session);
    if (students.length === 0) return <p className="text-[10px] italic text-slate-400 mt-0.5">No students yet</p>;
    return (
        <div className="flex flex-wrap gap-1 mt-1">
            {students.map(st => (
                <span key={st.id} className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ backgroundColor: color + '18', color }}>
                    {st.first_name} {st.last_name?.[0] ? st.last_name[0] + '.' : ''}
                </span>
            ))}
        </div>
    );
}

// ── Day mode: shared time axis + one column per instructor ──
function DayGrid({ columns, byTeacher, day, onSessionClick }) {
    return (
        <div className="flex bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
            <div className="w-14 flex-shrink-0 border-r border-gray-100 bg-gray-50/40 sticky left-0 z-10">
                <div className="h-12 border-b border-gray-100" />
                {HOURS.map(h => (
                    <div key={h} style={{ height: PX }} className="text-[10px] text-gray-400 text-right pr-2 pt-1 border-b border-gray-100/50">
                        {format(new Date().setHours(h, 0), 'h a')}
                    </div>
                ))}
            </div>
            {columns.map(t => {
                const items = (byTeacher.get(t.id) || []).filter(s => isSameDay(parse(s.date, 'yyyy-MM-dd', new Date()), day));
                const layout = computeLayout(items);
                return (
                    <div key={t.id} className="flex-1 min-w-[220px] border-r border-gray-100 last:border-0">
                        <div className="h-12 border-b border-gray-100 flex flex-col items-center justify-center bg-gray-50/40 sticky top-0">
                            <span className="text-sm font-black text-slate-700">{t.name}</span>
                            <span className="text-[10px] text-slate-400 font-bold">{items.length} class{items.length === 1 ? '' : 'es'}</span>
                        </div>
                        <div className="relative" style={{ height: HOURS.length * PX }}>
                            {HOURS.map(h => <div key={h} style={{ height: PX }} className="border-b border-gray-100/60" />)}
                            {items.map(s => {
                                const { col, totalCols } = layout[s.id] || { col: 0, totalCols: 1 };
                                const top = ((toMins(s.start_time) - START_HOUR * 60) / 60) * PX;
                                const height = Math.max(((toMins(s.end_time) - toMins(s.start_time)) / 60) * PX, 56);
                                const w = 100 / totalCols;
                                const color = colorOf(s);
                                return (
                                    <div key={s.id} onClick={() => onSessionClick(s)}
                                        className="absolute rounded-lg p-1.5 cursor-pointer overflow-hidden hover:shadow-md transition-all"
                                        style={{ top, height, left: `calc(${col * w}% + 2px)`, width: `calc(${w}% - 4px)`,
                                                 backgroundColor: color + '18', borderLeft: `3px solid ${color}`, opacity: s.status === 'cancelled' ? 0.5 : 1 }}>
                                        <p className="text-[10px] font-black" style={{ color }}>{fmtTime(s.start_time)}</p>
                                        <p className="text-[11px] font-black text-slate-800 truncate">{parseSubject(s.batch?.subject) || s.name} ({s.enrolled_count}/{s.capacity})</p>
                                        <StudentChips session={s} />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ── Week/Month mode: one agenda column per instructor ──
function AgendaColumns({ columns, byTeacher, days, onSessionClick }) {
    return (
        <div className="flex gap-3 overflow-x-auto pb-2">
            {columns.map(t => {
                const items = (byTeacher.get(t.id) || [])
                    .filter(s => days.some(d => isSameDay(parse(s.date, 'yyyy-MM-dd', new Date()), d)))
                    .sort((a, b) => a.date.localeCompare(b.date) || toMins(a.start_time) - toMins(b.start_time));
                const byDate = {};
                items.forEach(s => (byDate[s.date] = byDate[s.date] || []).push(s));
                return (
                    <div key={t.id} className="flex-1 min-w-[260px] bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50/60 border-b border-gray-100 sticky top-0">
                            <p className="text-sm font-black text-slate-700">{t.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{items.length} class{items.length === 1 ? '' : 'es'}</p>
                        </div>
                        <div className="max-h-[68vh] overflow-y-auto p-2 space-y-3">
                            {Object.keys(byDate).sort().map(date => (
                                <div key={date}>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-1">
                                        {format(parse(date, 'yyyy-MM-dd', new Date()), 'EEE, MMM d')}
                                    </p>
                                    <div className="space-y-1.5">
                                        {byDate[date].map(s => {
                                            const color = colorOf(s);
                                            return (
                                                <div key={s.id} onClick={() => onSessionClick(s)}
                                                    className="rounded-lg p-2 cursor-pointer hover:shadow-md transition-all"
                                                    style={{ backgroundColor: color + '14', borderLeft: `3px solid ${color}`, opacity: s.status === 'cancelled' ? 0.5 : 1 }}>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black" style={{ color }}>{fmtTime(s.start_time)}–{fmtTime(s.end_time)}</span>
                                                        <span className="text-[9px] font-black text-slate-500 flex items-center gap-0.5"><Users size={9} />{s.enrolled_count}/{s.capacity}</span>
                                                    </div>
                                                    <p className="text-[11px] font-black text-slate-800 truncate">{parseSubject(s.batch?.subject) || s.name}</p>
                                                    <StudentChips session={s} />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                            {items.length === 0 && <p className="text-xs text-slate-300 font-bold text-center py-8">No classes</p>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default function SegmentView({ sessions, teachers, selectedTeachers, viewMode, currentDate, onSessionClick }) {
    // Columns = selected instructors, or (if none selected) every instructor with classes in view.
    let columns = selectedTeachers.size > 0
        ? teachers.filter(t => selectedTeachers.has(t.id))
        : teachers.filter(t => sessions.some(s => teacherOf(s) === t.id));
    if (columns.length === 0) columns = teachers.slice(0, 8);

    const byTeacher = new Map(columns.map(t => [t.id, []]));
    sessions.forEach(s => { const id = teacherOf(s); if (byTeacher.has(id)) byTeacher.get(id).push(s); });

    if (columns.length === 0) {
        return <div className="text-center text-slate-400 font-bold py-20">Select one or more instructors to segment the calendar.</div>;
    }

    if (viewMode === 'day') {
        return <DayGrid columns={columns} byTeacher={byTeacher} day={currentDate} onSessionClick={onSessionClick} />;
    }
    const days = viewMode === 'week'
        ? Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), i))
        : eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) });
    return <AgendaColumns columns={columns} byTeacher={byTeacher} days={days} onSessionClick={onSessionClick} />;
}
