import { CalendarDays, CalendarRange, Repeat, X } from 'lucide-react';

// Reusable "this occurrence / this & future / entire series" chooser used by
// every occurrence edit (time, teacher, room, cancel). Calls onPick(scope).
const OPTIONS = [
    { scope: 'this', label: 'This occurrence only', desc: 'Change just this one class', Icon: CalendarDays },
    { scope: 'this_and_future', label: 'This and following', desc: 'Splits the series from this date forward', Icon: CalendarRange },
    { scope: 'series', label: 'Entire series', desc: 'Apply to every class in the series', Icon: Repeat },
];

export default function EditScopeDialog({ title = 'Apply change to…', onPick, onClose, allow }) {
    const opts = allow ? OPTIONS.filter(o => allow.includes(o.scope)) : OPTIONS;
    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={onClose} />
            <div className="relative bg-white rounded-[36px] w-full max-w-sm overflow-hidden shadow-2xl">
                <div className="p-6 bg-[#463a7a] text-white flex items-center justify-between">
                    <h3 className="text-lg font-black tracking-tighter">{title}</h3>
                    <button onClick={onClose} className="w-9 h-9 flex items-center justify-center bg-white/10 rounded-xl hover:bg-white/20"><X size={16} /></button>
                </div>
                <div className="p-5 space-y-3">
                    {opts.map(({ scope, label, desc, Icon }) => (
                        <button key={scope} onClick={() => onPick(scope)}
                            className="w-full p-4 rounded-2xl border-2 border-slate-100 hover:border-[#463a7a] hover:bg-indigo-50/40 transition-all text-left flex items-center gap-3 group">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-[#463a7a] group-hover:bg-[#463a7a] group-hover:text-white transition-all">
                                <Icon size={18} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-900">{label}</p>
                                <p className="text-[11px] text-slate-400 font-bold">{desc}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
