import { useState, useEffect, useMemo } from 'react';
import { api } from '../../lib/api';
import { X, Loader2, CalendarClock, Sparkles } from 'lucide-react';

const WEEKDAYS = [['MO', 'Mon'], ['TU', 'Tue'], ['WE', 'Wed'], ['TH', 'Thu'], ['FR', 'Fri'], ['SA', 'Sat'], ['SU', 'Sun']];
const CODE_IDX = { MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6, SU: 0 }; // JS getDay(): Sun=0

// Client-side mirror of the backend recurrence engine — just for the live
// "will create N classes" preview. The backend is authoritative on submit.
function previewCount({ freq, interval, byday, startDate, endDate }) {
    if (!startDate) return 0;
    const start = new Date(startDate + 'T00:00:00');
    const end = endDate ? new Date(endDate + 'T00:00:00') : new Date(start.getTime() + 365 * 864e5);
    if (end < start) return 0;
    const step = Math.max(1, interval || 1);
    let n = 0;
    if (freq === 'daily') {
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + step)) n++;
    } else if (freq === 'weekly' || freq === 'custom') {
        const days = (byday || []).map(c => CODE_IDX[c]);
        const wk = freq === 'custom' ? 1 : step;
        const baseMon = new Date(start); baseMon.setDate(start.getDate() - ((start.getDay() + 6) % 7));
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const mon = new Date(d); mon.setDate(d.getDate() - ((d.getDay() + 6) % 7));
            const weeks = Math.round((mon - baseMon) / (7 * 864e5));
            if (weeks % wk === 0 && days.includes(d.getDay())) n++;
        }
    } else if (freq === 'monthly') {
        for (let d = new Date(start); d <= end; d.setMonth(d.getMonth() + step)) n++;
    }
    return n;
}

export default function TemplateBuilder({ onClose, onCreated }) {
    const [teachers, setTeachers] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [form, setForm] = useState({
        name: '', course: '', teacher_id: '', start_time: '10:00', end_time: '11:00', capacity: 10,
    });
    const [freq, setFreq] = useState('weekly');
    const [interval, setInterval] = useState(1);
    const [byday, setByday] = useState(['MO']);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get('/staff').then(r => setTeachers(r.data || [])).catch(() => {});
        api.get('/admin/subjects').then(r => setSubjects(r.data || [])).catch(() => {});
    }, []);

    const count = useMemo(() => previewCount({ freq, interval, byday, startDate, endDate }),
        [freq, interval, byday, startDate, endDate]);

    const toggleDay = (code) =>
        setByday(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);

    const submit = async () => {
        setError('');
        if (!form.name || !startDate) { setError('Class name and start date are required.'); return; }
        if ((freq === 'weekly' || freq === 'custom') && byday.length === 0) { setError('Pick at least one weekday.'); return; }
        setSaving(true);
        try {
            const res = await api.post('/scheduling/templates', {
                ...form,
                teacher_id: form.teacher_id || null,
                capacity: Number(form.capacity),
                recurrence: {
                    freq, interval: Number(interval),
                    by_weekday: (freq === 'weekly' || freq === 'custom') ? byday.join(',') : null,
                    start_date: startDate, end_date: endDate || null,
                },
            });
            onCreated?.(res.data);
            onClose?.();
        } catch (e) {
            setError(e.response?.data?.detail || 'Failed to create class');
        } finally {
            setSaving(false);
        }
    };

    const field = "w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={onClose} />
            <div className="relative bg-white rounded-[40px] w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl">
                <div className="p-6 lg:p-8 bg-[#463a7a] text-white sticky top-0 z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CalendarClock />
                        <h2 className="text-xl font-black tracking-tighter">New Class Template</h2>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-2xl hover:bg-white/20"><X size={18} /></button>
                </div>

                <div className="p-6 lg:p-8 space-y-4">
                    {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-2xl text-sm font-bold">{error}</div>}

                    <input className={field} placeholder="Class name (e.g. Violin Beginner)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    <div className="grid grid-cols-2 gap-3">
                        <select className={field} value={form.course} onChange={e => setForm({ ...form, course: e.target.value })}>
                            <option value="">Program / Course…</option>
                            {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                        <select className={field} value={form.teacher_id} onChange={e => setForm({ ...form, teacher_id: e.target.value })}>
                            <option value="">Teacher…</option>
                            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest col-span-3 -mb-2">Time & capacity</label>
                        <input type="time" className={field} value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
                        <input type="time" className={field} value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
                        <input type="number" min="1" className={field} value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} />
                    </div>

                    {/* Recurrence panel */}
                    <div className="bg-slate-50 rounded-3xl p-4 space-y-3 border border-slate-100">
                        <div className="flex gap-1.5">
                            {['daily', 'weekly', 'monthly', 'custom'].map(f => (
                                <button key={f} onClick={() => setFreq(f)}
                                    className={`flex-1 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${freq === f ? 'bg-[#463a7a] text-white' : 'bg-white text-slate-400 hover:text-slate-600'}`}>
                                    {f}
                                </button>
                            ))}
                        </div>

                        {(freq === 'weekly' || freq === 'custom') && (
                            <div className="flex flex-wrap gap-1.5">
                                {WEEKDAYS.map(([code, label]) => (
                                    <button key={code} onClick={() => toggleDay(code)}
                                        className={`px-3 py-2 rounded-xl text-[11px] font-black transition-all ${byday.includes(code) ? 'bg-[#463a7a] text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>
                                        {label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {freq !== 'custom' && (
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                                Every
                                <input type="number" min="1" value={interval} onChange={e => setInterval(e.target.value)}
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
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">End date (optional)</label>
                                <input type="date" className={field} value={endDate} onChange={e => setEndDate(e.target.value)} />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 bg-indigo-50 text-[#463a7a] rounded-2xl px-4 py-3 font-black text-sm">
                            <Sparkles size={16} />
                            Will create ~{count} class{count === 1 ? '' : 'es'}{!endDate && ' (next 12 months)'}
                        </div>
                    </div>

                    <button onClick={submit} disabled={saving}
                        className="w-full bg-[#463a7a] hover:bg-[#3a2f66] text-white rounded-2xl py-4 font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                        {saving ? <Loader2 className="animate-spin" size={18} /> : `Create class & generate ${count} occurrences`}
                    </button>
                </div>
            </div>
        </div>
    );
}
