import React from 'react';
import { Clock, Users, User } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

const SUBJECT_THEMES = {
    Guitar: {
        bg: 'bg-emerald-50 hover:bg-emerald-100',
        border: 'border-emerald-500',
        text: 'text-emerald-900',
        icon: 'text-emerald-600',
        pill: 'bg-emerald-200/50 text-emerald-800'
    },
    Piano: {
        bg: 'bg-blue-50 hover:bg-blue-100',
        border: 'border-blue-500',
        text: 'text-blue-900',
        icon: 'text-blue-600',
        pill: 'bg-blue-200/50 text-blue-800'
    },
    Drums: {
        bg: 'bg-orange-50 hover:bg-orange-100',
        border: 'border-orange-500',
        text: 'text-orange-900',
        icon: 'text-orange-600',
        pill: 'bg-orange-200/50 text-orange-800'
    },
    Vocals: {
        bg: 'bg-pink-50 hover:bg-pink-100',
        border: 'border-pink-500',
        text: 'text-pink-900',
        icon: 'text-pink-600',
        pill: 'bg-pink-200/50 text-pink-800'
    },
    Violin: {
        bg: 'bg-purple-50 hover:bg-purple-100',
        border: 'border-purple-500',
        text: 'text-purple-900',
        icon: 'text-purple-600',
        pill: 'bg-purple-200/50 text-purple-800'
    },
    Default: {
        bg: 'bg-gray-50 hover:bg-gray-100',
        border: 'border-gray-500',
        text: 'text-gray-900',
        icon: 'text-gray-600',
        pill: 'bg-gray-200 text-gray-700'
    }
};

export default function ClassSessionCard({ session, onClick }) {
    const subject = session.batch?.subject || 'Class';
    const theme = SUBJECT_THEMES[subject] || SUBJECT_THEMES.Default;

    // Calculate duration or end time check? 
    // Just display nicely.

    // Student Avatars (Simulated if no direct url)
    // session.attendances has student objects now (thanks to schema update, backend auto-resolves rels if query allows)
    // Actually, backend might need `joinedload` in crud.py to be efficient, but default lazy loading + Pydantic's from_attributes might trigger individual queries or just work if session is open. 
    // Given crud.py implementation `return db.query(ClassSession)...all()`, SQLAlchemy will lazy load students when Pydantic access them.

    const students = session.attendances?.map(a => a.student) || [];
    const studentCount = students.length;
    const capacity = session.batch?.capacity || 10;

    return (
        <div
            onClick={() => onClick(session)}
            className={cn(
                "group relative w-full h-full p-2.5 rounded-lg border-l-[3px] shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col justify-between",
                theme.bg,
                theme.border
            )}
        >
            {/* Header: Subject & Time */}
            <div>
                <div className="flex justify-between items-start mb-1">
                    <span className={cn("text-xs font-bold tracking-wide uppercase px-1.5 py-0.5 rounded-md", theme.pill)}>
                        {subject}
                    </span>
                    {/* Optional: Status Indicator */}
                </div>

                <div className="flex items-center gap-1.5 mt-1 text-gray-700">
                    <Clock size={12} className={theme.icon} />
                    <span className="text-xs font-semibold font-mono leading-none">
                        {session.start_time} - {session.end_time}
                    </span>
                </div>
            </div>

            {/* Teacher Info */}
            {session.batch?.teacher && (
                <div className="flex items-center gap-1.5 mt-2">
                    <div className="w-5 h-5 rounded-full bg-white/50 border border-white/20 flex items-center justify-center text-[10px] font-bold shadow-sm">
                        {session.batch.teacher.name[0]}
                    </div>
                    <span className={cn("text-xs font-medium truncate opacity-90", theme.text)}>
                        {session.batch.teacher.name}
                    </span>
                </div>
            )}

            {/* Footer: Students */}
            <div className="mt-auto pt-2 flex items-center justify-between border-t border-black/5">
                <div className="flex -space-x-1.5 overflow-hidden">
                    {students.slice(0, 3).map((s, i) => (
                        <div key={s?.email || i} className="w-5 h-5 rounded-full border border-white bg-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-600 shadow-sm" title={s?.first_name}>
                            {s?.first_name?.[0] || '?'}
                        </div>
                    ))}
                    {studentCount > 3 && (
                        <div className="w-5 h-5 rounded-full border border-white bg-gray-100 flex items-center justify-center text-[8px] font-medium text-gray-500 shadow-sm">
                            +{studentCount - 3}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1 text-[10px] font-medium opacity-70">
                    <Users size={10} />
                    <span>{studentCount}/{capacity}</span>
                </div>
            </div>

            {/* Hover decorative element */}
            <div className={cn("absolute right-0 top-0 w-16 h-16 rounded-bl-full opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none", theme.icon.replace('text-', 'bg-'))} />
        </div>
    )
}
