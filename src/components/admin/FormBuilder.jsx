import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import {
    Loader2, ExternalLink, Copy, Save, CheckCircle2, Lock,
    GripVertical, Eye, EyeOff, Plus, Trash2, X,
} from 'lucide-react';

const TYPE_LABELS = {
    text: 'Text', email: 'Email', tel: 'Phone', date: 'Date',
    select: 'Dropdown', textarea: 'Long Text',
    select_subjects: 'Course Select', select_centers: 'Center Select',
};
const ADDABLE_TYPES = ['text', 'email', 'tel', 'date', 'select', 'textarea'];

function Toggle({ on, onClick, disabled }) {
    return (
        <button type="button" role="switch" aria-checked={on} onClick={onClick} disabled={disabled}
            className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${on ? 'bg-[#463a7a]' : 'bg-slate-200'} disabled:opacity-40`}>
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-4' : ''}`} />
        </button>
    );
}

export default function FormBuilder({ centerName }) {
    const [fields, setFields] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [copied, setCopied] = useState(false);
    const [dragIdx, setDragIdx] = useState(null);
    const [showAdd, setShowAdd] = useState(false);
    const [newLabel, setNewLabel] = useState('');
    const [newType, setNewType] = useState('text');
    const [newRequired, setNewRequired] = useState(false);
    const [newOptions, setNewOptions] = useState('');

    const enrollLink = centerName ? `${window.location.origin}/apply?center=${encodeURIComponent(centerName)}` : `${window.location.origin}/apply`;

    const load = useCallback(async () => {
        setLoading(true);
        try {
            // Backend scopes this to the caller's own center — no center_id needed.
            const res = await api.get('/admin/form-config');
            setFields(res.data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const save = async () => {
        setSaving(true);
        setSaved(false);
        try {
            await api.put('/admin/form-config', fields);
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(enrollLink).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const update = (idx, patch) => setFields(prev => prev.map((f, i) => i === idx ? { ...f, ...patch } : f));
    const remove = (idx) => setFields(prev => prev.filter((_, i) => i !== idx).map((f, i) => ({ ...f, order: i })));

    const addField = () => {
        if (!newLabel.trim()) return;
        const opts = newType === 'select' ? newOptions.split(',').map(o => o.trim()).filter(Boolean) : undefined;
        setFields(prev => [...prev, {
            key: `custom_${Date.now()}`,
            label: newLabel.trim(),
            type: newType,
            required: newRequired,
            enabled: true,
            system: false,
            order: prev.length,
            ...(opts ? { options: opts } : {}),
        }]);
        setNewLabel(''); setNewType('text'); setNewRequired(false); setNewOptions(''); setShowAdd(false);
    };

    const onDragStart = (idx) => setDragIdx(idx);
    const onDragOver = (e, idx) => {
        e.preventDefault();
        if (dragIdx === null || dragIdx === idx) return;
        setFields(prev => {
            const next = [...prev];
            const [moved] = next.splice(dragIdx, 1);
            next.splice(idx, 0, moved);
            setDragIdx(idx);
            return next.map((f, i) => ({ ...f, order: i }));
        });
    };
    const onDragEnd = () => setDragIdx(null);

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm font-black text-slate-800">Admission Form</p>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={copyLink}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs font-black hover:border-[#463a7a] hover:text-[#463a7a] transition-all">
                        {copied ? <><CheckCircle2 size={12} className="text-emerald-500" /> Copied!</> : <><Copy size={12} /> Copy Link</>}
                    </button>
                    <a href={enrollLink} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 text-slate-500 rounded-xl text-xs font-black hover:border-[#463a7a] hover:text-[#463a7a] transition-all">
                        <ExternalLink size={12} /> Preview
                    </a>
                    <button onClick={save} disabled={saving || !fields}
                        className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-black transition-all ${saved ? 'bg-emerald-500 text-white' : 'bg-[#463a7a] text-white hover:bg-[#3a2f66]'} disabled:opacity-50`}>
                        {saved ? <><CheckCircle2 size={14} /> Saved!</> : saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Save size={14} /> Save</>}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-[#463a7a]" size={28} /></div>
            ) : (
                <div className="space-y-3">
                    {(fields || []).map((field, idx) => (
                        <div key={field.key} draggable={!field.system}
                            onDragStart={() => onDragStart(idx)}
                            onDragOver={e => onDragOver(e, idx)}
                            onDragEnd={onDragEnd}
                            className={`bg-white rounded-2xl border shadow-sm p-4 transition-all ${dragIdx === idx ? 'border-[#463a7a]/40 bg-indigo-50/40' : 'border-slate-100'} ${!field.enabled ? 'opacity-50' : ''}`}>
                            <div className="flex items-start gap-3">
                                <div className={`pt-2 flex-shrink-0 ${field.system ? 'text-slate-200' : 'cursor-grab text-slate-300 hover:text-slate-400'}`}>
                                    <GripVertical size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <input value={field.label} onChange={e => update(idx, { label: e.target.value })}
                                            disabled={field.system}
                                            className="flex-1 min-w-0 text-base font-bold text-slate-800 bg-transparent border-b-2 border-transparent focus:border-[#463a7a] outline-none py-1.5 transition-all disabled:text-slate-500" />
                                        <span className="flex-shrink-0 text-[11px] font-bold px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full">{TYPE_LABELS[field.type] || field.type}</span>
                                    </div>

                                    {field.type === 'select' && !field.system && (
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {(field.options || []).map((opt, oi) => (
                                                <span key={oi} className="flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600">
                                                    {opt}
                                                    <button onClick={() => update(idx, { options: field.options.filter((_, i) => i !== oi) })}
                                                        className="text-slate-300 hover:text-red-500"><X size={12} /></button>
                                                </span>
                                            ))}
                                            <AddOption onAdd={val => update(idx, { options: [...(field.options || []), val] })} />
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                                        <div>
                                            {field.system && (
                                                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1"><Lock size={11} /> System field</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {!field.system && (
                                                <button onClick={() => remove(idx)} className="text-slate-300 hover:text-red-500 transition-all">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                            <button onClick={() => !field.system && update(idx, { enabled: !field.enabled })}
                                                disabled={field.system}
                                                className="text-slate-300 hover:text-[#463a7a] disabled:opacity-30 disabled:hover:text-slate-300 transition-all">
                                                {field.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
                                            </button>
                                            {!field.system && (
                                                <label className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                                    Required
                                                    <Toggle on={!!field.required} onClick={() => update(idx, { required: !field.required })} />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Add question */}
                    {showAdd ? (
                        <div className="bg-white rounded-2xl border-2 border-[#463a7a]/20 shadow-sm p-5 space-y-3">
                            <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Question"
                                autoFocus
                                className="w-full text-base font-bold text-slate-800 bg-transparent border-b-2 border-slate-200 focus:border-[#463a7a] outline-none py-1.5 transition-all" />
                            <div className="flex flex-wrap items-center gap-3">
                                <select value={newType} onChange={e => setNewType(e.target.value)}
                                    className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#463a7a]/15 appearance-none">
                                    {ADDABLE_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                                </select>
                                {newType === 'select' && (
                                    <input value={newOptions} onChange={e => setNewOptions(e.target.value)} placeholder="Option A, Option B, Option C"
                                        className="flex-1 min-w-[180px] bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#463a7a]/15" />
                                )}
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 ml-auto">
                                    Required
                                    <Toggle on={newRequired} onClick={() => setNewRequired(r => !r)} />
                                </label>
                            </div>
                            <div className="flex gap-2 pt-1">
                                <button onClick={addField} disabled={!newLabel.trim()}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-[#463a7a] text-white rounded-xl text-sm font-black hover:bg-[#3a2f66] transition-all disabled:opacity-40">
                                    <Plus size={14} /> Add Question
                                </button>
                                <button onClick={() => setShowAdd(false)}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl text-sm font-black hover:bg-slate-50 transition-all">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => setShowAdd(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-white border-2 border-dashed border-slate-200 text-slate-400 rounded-2xl text-sm font-black hover:border-[#463a7a] hover:text-[#463a7a] transition-all">
                            <Plus size={16} /> Add Question
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

function AddOption({ onAdd }) {
    const [open, setOpen] = useState(false);
    const [val, setVal] = useState('');
    const commit = () => {
        if (val.trim()) onAdd(val.trim());
        setVal(''); setOpen(false);
    };
    if (!open) {
        return (
            <button onClick={() => setOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 border border-dashed border-slate-300 rounded-lg text-xs font-bold text-slate-400 hover:border-[#463a7a] hover:text-[#463a7a] transition-all">
                <Plus size={12} /> Option
            </button>
        );
    }
    return (
        <input autoFocus value={val} onChange={e => setVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setVal(''); setOpen(false); } }}
            onBlur={commit} placeholder="Option label"
            className="w-28 px-2.5 py-1 bg-white border border-[#463a7a]/30 rounded-lg text-xs font-bold outline-none" />
    );
}
