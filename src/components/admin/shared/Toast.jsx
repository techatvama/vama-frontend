import React, { useEffect } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

// Shared toast for admin CRUD screens (Subjects, Grades, Exam Sessions,
// Syllabus Builder) — replaces silent list-refreshes and native alert()s so
// every save/delete gives the user clear, visible confirmation of what happened.
export default function Toast({ message, type = 'success', onDone }) {
    useEffect(() => {
        const t = setTimeout(onDone, 3000);
        return () => clearTimeout(t);
    }, [onDone]);

    const isError = type === 'error';

    return (
        <div
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-6 py-3.5 rounded-2xl shadow-2xl font-bold text-sm text-white animate-in fade-in slide-in-from-bottom-2 duration-200 ${
                isError ? 'bg-red-600' : 'bg-slate-900'
            }`}
            role="status"
        >
            {isError ? (
                <XCircle size={18} className="text-red-200 shrink-0" />
            ) : (
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            )}
            {message}
        </div>
    );
}
