import { useState, useEffect, useRef } from 'react';
import { CalendarDays, CalendarRange } from 'lucide-react';

// Compact scope-selection popover for Add/Remove student (NOT a full modal).
// Options: This Class / This & Following. Default = This Class. Explicit confirm.
// `descriptions` optionally provides a helper line under each option.
export default function ScopePopover({ title, confirmLabel = 'Add', confirmTone = 'indigo',
                                      descriptions = {}, onConfirm, onClose, anchorRef }) {
    const [scope, setScope] = useState('this');
    const ref = useRef(null);
    const [pos, setPos] = useState(null);

    useEffect(() => {
        if (anchorRef?.current) {
            const r = anchorRef.current.getBoundingClientRect();
            const top = Math.min(r.bottom + 6, window.innerHeight - 230);
            setPos({ top, left: Math.min(Math.max(8, r.left - 40), window.innerWidth - 280) });
        }
        const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
        const onEsc = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('mousedown', onDoc);
        document.addEventListener('keydown', onEsc);
        return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onEsc); };
    }, [anchorRef, onClose]);

    const tone = confirmTone === 'red' ? 'bg-red-500 hover:bg-red-600' : 'bg-[#463a7a] hover:bg-[#3a2f66]';
    const style = pos ? { position: 'fixed', top: pos.top, left: pos.left }
                      : { position: 'fixed', top: '42%', left: '50%', transform: 'translate(-50%,-50%)' };

    const OPTIONS = [
        { val: 'this', label: 'This Class', Icon: CalendarDays },
        { val: 'this_and_future', label: 'This & Following', Icon: CalendarRange },
    ];

    return (
        <>
            {/* faint click-catcher so taps anywhere dismiss on mobile */}
            <div className="fixed inset-0 z-[190]" onClick={onClose} />
            <div ref={ref} style={{ ...style, zIndex: 200 }}
                className="w-[272px] bg-white rounded-2xl shadow-2xl border border-slate-100 p-3 animate-in fade-in zoom-in-95 duration-150">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">{title}</p>
                <div className="space-y-1.5">
                    {OPTIONS.map(({ val, label, Icon }) => {
                        const active = scope === val;
                        return (
                            <button key={val} onClick={() => setScope(val)}
                                className={`w-full flex items-start gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all border ${active ? 'bg-indigo-50 border-[#463a7a]/30' : 'border-transparent hover:bg-slate-50'}`}>
                                <span className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${active ? 'border-[#463a7a]' : 'border-slate-300'}`}>
                                    {active && <span className="w-2 h-2 rounded-full bg-[#463a7a]" />}
                                </span>
                                <span className="flex-1 min-w-0">
                                    <span className="flex items-center gap-1.5">
                                        <Icon size={13} className={active ? 'text-[#463a7a]' : 'text-slate-400'} />
                                        <span className={`text-sm font-black ${active ? 'text-[#463a7a]' : 'text-slate-700'}`}>{label}</span>
                                    </span>
                                    {descriptions[val] && (
                                        <span className="block text-[11px] text-slate-400 font-bold leading-snug mt-0.5">{descriptions[val]}</span>
                                    )}
                                </span>
                            </button>
                        );
                    })}
                </div>
                <div className="flex gap-2 mt-3">
                    <button onClick={onClose} className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-500 text-xs font-black hover:bg-slate-200 transition-colors">Cancel</button>
                    <button onClick={() => onConfirm(scope)} className={`flex-1 py-2 rounded-xl text-white text-xs font-black transition-colors ${tone}`}>{confirmLabel}</button>
                </div>
            </div>
        </>
    );
}
