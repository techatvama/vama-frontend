import { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';
import { Users, ChevronDown, Check } from 'lucide-react';

// Shown only when the logged-in student account (the parent/guardian login) has
// siblings linked via guardian_email. Lets a parent switch between children
// without logging out.
export default function ChildSwitcher() {
    const [children, setChildren] = useState([]);
    const [current, setCurrent] = useState(null);
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const stored = localStorage.getItem('student');
        if (!stored) return;
        const s = JSON.parse(stored);
        setCurrent(s);
        api.get(`/student/${s.id}/siblings`)
            .then((r) => setChildren(r.data || []))
            .catch(() => setChildren([]));
    }, []);

    useEffect(() => {
        const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, []);

    if (children.length <= 1 || !current) return null; // single child → nothing to switch

    const switchTo = (child) => {
        if (child.id === current.id) { setOpen(false); return; }
        // Preserve the existing shape, swap identity fields, then reload so every
        // view re-fetches for the newly selected child.
        const next = { ...current, id: child.id, first_name: child.first_name,
            last_name: child.last_name, email: child.email, current_grade: child.current_grade };
        localStorage.setItem('student', JSON.stringify(next));
        window.location.assign('/student-portal');
    };

    return (
        <div className="px-4 lg:px-12 pt-4" ref={ref}>
            <div className="relative inline-block">
                <button onClick={() => setOpen((o) => !o)}
                    className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl pl-4 pr-3 py-2.5 shadow-sm hover:border-[#463a7a] transition-all">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
                        <Users size={16} className="text-[#463a7a]" />
                    </div>
                    <div className="text-left">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Viewing</p>
                        <p className="text-sm font-black text-slate-900 leading-tight">{current.first_name} {current.last_name}</p>
                    </div>
                    <ChevronDown size={16} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>

                {open && (
                    <div className="absolute z-30 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
                        <p className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Your children</p>
                        {children.map((c) => {
                            const active = c.id === current.id;
                            return (
                                <button key={c.id} onClick={() => switchTo(c)}
                                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors ${active ? 'bg-indigo-50/50' : ''}`}>
                                    <div>
                                        <p className="text-sm font-black text-slate-900 leading-tight">{c.first_name} {c.last_name}</p>
                                        <p className="text-xs text-slate-400 font-bold">{c.current_grade || '—'}</p>
                                    </div>
                                    {active && <Check size={16} className="text-[#463a7a]" />}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
