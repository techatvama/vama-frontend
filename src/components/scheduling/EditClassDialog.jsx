import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { X, Loader2, Pencil, CalendarDays, CalendarRange, Repeat } from 'lucide-react';

const WEEKDAYS = [['MO', 'Mon'], ['TU', 'Tue'], ['WE', 'Wed'], ['TH', 'Thu'], ['FR', 'Fri'], ['SA', 'Sat'], ['SU', 'Sun']];

const SCOPES = [
    { scope: 'this', label: 'This class only', Icon: CalendarDays },
    { scope: 'this_and_future', label: 'This & following', Icon: CalendarRange },
    { scope: 'series', label: 'Entire series', Icon: Repeat },
];

// Full editor for a class occurrence. Time/teacher/room can apply to this /
// this-and-future / the whole series; name/course/capacity and the recurrence
// pattern are series-level and only editable under "Entire series".
export default function EditClassDialog({ occ, onClose, onSaved }) {
    const [teachers, setTeachers] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [scope, setScope] = useState('this');

    const [form, setForm] = useState({
        name: '', course: '', teacher_id: '', start_time: occ.start_time || '10:00',
        end_time: occ.end_time || '11:00', capacity: occ.capacity || 10,
    });
    const [freq, setFreq] = useState('weekly');
    const [interval, setInterval] = useState(1);
    const [byday, setByday] = useState(['MO']);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        api.get('/staff').then(r => setTeachers(r.data || [])).catch(() => {});
        api.get('/admin/subjects').then(r => setSubjects(r.data || [])).catch(() => {});
        api.get(`/scheduling/templates/${occ.template_id}`).then(r => {
            const t = r.data;
            setForm({
                name: t.name || '', course: t.course || '', teacher_id: t.teacher_id || '',
                start_time: occ.start_time || t.start_time, end_time: occ.end_time || t.end_time,
                capacity: t.capacity || 10,
            });
            const rec = t.recurrence;
            if (rec) {
                setFreq(rec.freq || 'weekly');
                setInterval(rec.interval || 1);
                setByday(rec.by_weekday ? rec.by_weekday.split(',') : ['MO']);
                setStartDate(rec.start_date || '');
                setEndDate(rec.end_date || '');
            }
        }).catch(() => {}).finally(() => setLoading(false));
    }, [occ.template_id, occ.start_time, occ.end_time]);

    const toggleDay = (code) =>
        setByday(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);

    const save = async () => {
        setError('');
        if (form.end_time <= form.start_time) { setError('End time must be after start time.'); return; }
        setSaving(true);
        try {
            if (scope === 'series') {
                await api.put(`/scheduling/templates/${occ.template_id}`, {
                    name: form.name, course: form.course,
                    teacher_id: form.teacher_id || null, capacity: Number(form.capacity),
                    start_time: form.start_time, end_time: form.end_time,
                    recurrence: {
                        freq, interval: Number(interval),
                        by_weekday: (freq === 'weekly' || freq === 'custom') ? byday.join(',') : null,
                        start_date: startDate, end_date: endDate || null,
                    },
                });
            } else {
                await api.put(`/scheduling/occurrences/${occ.id}`, {
                    scope, start_time: form.start_time, end_time: form.end_time,
                    teacher_id: form.teacher_id || null,
                });
            }
            onSaved?.();
            onClose();
        } catch (e) {
            setError(e.response?.data?.detail || 'Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    const field = "w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10";
    const isSeries = scope === 'series';

    return (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={onClose} />
            <div className="relative bg-white rounded-[36px] w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl">
                <div className="p-6 bg-[#463a7a] text-white sticky top-0 z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3"><Pencil size={18} /><h2 className="text-xl font-black tracking-tighter">Edit Class</h2></div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-2xl hover:bg-white/20"><X size={18} /></button>
                </div>

                {loading ? (
                    <div className="py-16 flex justify-center"><Loader2 className="animate-spin text-[#463a7a]" /></div>
                ) : (
                    <div className="p-6 space-y-4">
                        {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-2xl text-sm font-bold">{error}</div>}

                        {/* Scope selector */}
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Apply changes to</label>
                            <div className="grid grid-cols-3 gap-2 mt-1.5">
                                {SCOPES.map(({ scope: s, label, Icon }) => (
                                    <button key={s} onClick={() => setScope(s)}
                                        className={`flex flex-col items-center gap-1 py-3 rounded-2xl border-2 transition-all ${scope === s ? 'border-[#463a7a] bg-indigo-50/50 text-[#463a7a]' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                                        <Icon size={16} />
                                        <span className="text-[10px] font-black text-center leading-tight">{label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Series-only fields */}
                        {isSeries && (
                            <>
                                <input className={field} placeholder="Class name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                                <div className="grid grid-cols-2 gap-3">
                                    <select className={field} value={form.course} onChange={e => setForm({ ...form, course: e.target.value })}>
                                        <option value="">Program / Course…</option>
                                        {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                    </select>
                                    <input type="number" min="1" className={field} value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} placeholder="Capacity" />
                                </div>
                            </>
                        )}

                        {/* Always editable: teacher + time */}
                        <select className={field} value={form.teacher_id} onChange={e => setForm({ ...form, teacher_id: e.target.value })}>
                            <option value="">Teacher…</option>
                            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <div className="grid grid-cols-2 gap-3">
                            <input type="time" className={field} value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
                            <input type="time" className={field} value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
                        </div>

                        {/* Recurrence — series only */}
                        {isSeries && (
                            <div className="bg-slate-50 rounded-3xl p-4 space-y-3 border border-slate-100">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recurrence</label>
                                <div className="flex gap-1.5">
                                    {['daily', 'weekly', 'monthly', 'custom'].map(f => (
                                        <button key={f} onClick={() => setFreq(f)}
                                            className={`flex-1 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${freq === f ? 'bg-[#463a7a] text-white' : 'bg-white text-slate-400'}`}>{f}</button>
                                    ))}
                                </div>
                                {(freq === 'weekly' || freq === 'custom') && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {WEEKDAYS.map(([code, label]) => (
                                            <button key={code} onClick={() => toggleDay(code)}
                                                className={`px-3 py-2 rounded-xl text-[11px] font-black transition-all ${byday.includes(code) ? 'bg-[#463a7a] text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>{label}</button>
                                        ))}
                                    </div>
                                )}
                                {freq !== 'custom' && (
                                    <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                                        Every <input type="number" min="1" value={interval} onChange={e => setInterval(e.target.value)}
                                            className="w-16 bg-white border border-slate-100 rounded-xl py-1.5 px-2 text-center" />
                                        {freq === 'daily' ? 'day(s)' : freq === 'weekly' ? 'week(s)' : 'month(s)'}
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Start date</label>
                                        <input type="date" className={field} value={startDate} onChange={e => setStartDate(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">End date</label>
                                        <input type="date" className={field} value={endDate} onChange={e => setEndDate(e.target.value)} />
                                    </div>
                                </div>
                                <p className="text-[11px] text-slate-400 font-bold">Future classes will be regenerated to match. Past classes and attendance are kept.</p>
                            </div>
                        )}

                        <button onClick={save} disabled={saving}
                            className="w-full bg-[#463a7a] hover:bg-[#3a2f66] text-white rounded-2xl py-4 font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                            {saving ? <Loader2 className="animate-spin" size={18} /> : `Save (${SCOPES.find(s => s.scope === scope).label})`}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
