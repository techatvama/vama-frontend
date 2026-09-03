import { useState } from 'react';
import { CalendarDays, CalendarRange, X, AlertTriangle, Loader2 } from 'lucide-react';

// Reusable "this occurrence / this & future" chooser used by occurrence
// edits (cancel, delete). Calls onPick(scope). No "entire series" option —
// that scope was removed as too destructive for a delete action (it wiped
// past attendance history, not just future classes).
const OPTIONS = [
    { scope: 'this', label: 'This occurrence only', desc: 'Change just this one class', Icon: CalendarDays },
    { scope: 'this_and_future', label: 'This and following', desc: 'Splits the series from this date forward', Icon: CalendarRange },
];

// Permanent-delete consequences, shown as a second confirm step so a single
// misclick can't wipe out a whole recurring class — there's no undo (hard
// delete, not a status flag) once onPick actually fires.
const DELETE_WARNINGS = {
    this: 'This class occurrence and its attendance record will be permanently deleted.',
    this_and_future: 'This class and every future occurrence in this weekday/time series will be permanently deleted, including attendance records. Past classes and their history are kept.',
};

export default function EditScopeDialog({ title = 'Apply change to…', onPick, onClose, allow, requireConfirm = false, saving = false }) {
    const opts = allow ? OPTIONS.filter(o => allow.includes(o.scope)) : OPTIONS;
    const [confirming, setConfirming] = useState(null); // scope pending a second confirm, or null
    const [pressed, setPressed] = useState(null); // scope of the option just clicked, for instant tactile feedback

    if (confirming) {
        const opt = OPTIONS.find(o => o.scope === confirming);
        return (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => !saving && onClose()} />
                <div className="relative bg-white rounded-[36px] w-full max-w-sm overflow-hidden shadow-2xl">
                    <div className="p-6 bg-red-600 text-white flex items-center justify-between">
                        <h3 className="text-lg font-black tracking-tighter flex items-center gap-2">
                            <AlertTriangle size={18} /> Are you sure?
                        </h3>
                        <button onClick={onClose} disabled={saving} className="w-9 h-9 flex items-center justify-center bg-white/10 rounded-xl hover:bg-white/20 disabled:opacity-40"><X size={16} /></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <p className="text-sm font-bold text-slate-800">{opt?.label}</p>
                        <p className="text-sm text-slate-500 font-medium">{DELETE_WARNINGS[confirming]}</p>
                        <p className="text-xs text-red-500 font-black uppercase tracking-wide">This cannot be undone.</p>
                        <div className="flex gap-2 pt-1">
                            <button onClick={() => setConfirming(null)} disabled={saving}
                                className="flex-1 py-3 rounded-2xl border-2 border-slate-100 text-slate-600 font-black text-sm hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-40">
                                Go back
                            </button>
                            <button onClick={() => onPick(confirming)} disabled={saving}
                                className="flex-1 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-sm active:scale-95 transition-all disabled:opacity-70 flex items-center justify-center gap-2">
                                {saving ? <><Loader2 size={16} className="animate-spin" /> Deleting…</> : 'Yes, delete'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
                        <button key={scope}
                            onClick={() => {
                                setPressed(scope);
                                if (requireConfirm) setConfirming(scope);
                                else onPick(scope);
                            }}
                            className={`w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-3 group active:scale-[0.98] ${
                                pressed === scope ? 'border-[#463a7a] bg-indigo-50/60' : 'border-slate-100 hover:border-[#463a7a] hover:bg-indigo-50/40'
                            }`}>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                pressed === scope ? 'bg-[#463a7a] text-white' : 'bg-indigo-50 text-[#463a7a] group-hover:bg-[#463a7a] group-hover:text-white'
                            }`}>
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
