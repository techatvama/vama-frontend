import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Loader2, CheckCircle2, AlertCircle, Music, MapPin } from 'lucide-react';

const FIELD = "w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#463a7a]/15 focus:border-transparent transition-all";
const LABEL = "text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block";

function DynField({ field, value, onChange, centers, subjects }) {
    const { key, label, type, required, options } = field;
    const inputProps = {
        id: key,
        value: value || '',
        onChange: e => onChange(key, e.target.value),
        required: !!required,
        className: FIELD,
    };

    if (type === 'select_subjects') {
        return (
            <select {...inputProps}>
                <option value="">Select a course</option>
                {subjects.length > 0
                    ? subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)
                    : ['Guitar', 'Piano', 'Vocals', 'Violin', 'Drums', 'Keyboard'].map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))
                }
            </select>
        );
    }

    if (type === 'select_centers') {
        return (
            <select {...inputProps}>
                <option value="">Select a center</option>
                {centers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
        );
    }

    if (type === 'select') {
        return (
            <select {...inputProps}>
                <option value="">Select…</option>
                {(options || []).map(o => <option key={o} value={o}>{o}</option>)}
            </select>
        );
    }

    if (type === 'textarea') {
        return (
            <textarea rows={3} {...inputProps} className={`${FIELD} resize-none`} />
        );
    }

    return <input type={type || 'text'} {...inputProps} />;
}

export default function PublicStudentForm() {
    const [formConfig, setFormConfig] = useState(null);
    const [form, setForm] = useState({});
    const [centers, setCenters] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [lockedCenter, setLockedCenter] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const centerParam = params.get('center');

        Promise.all([
            api.get('/centers').catch(() => ({ data: [] })),
            api.get('/admin/subjects').catch(() => ({ data: [] })),
            api.get('/public/form-config', { params: centerParam ? { center: centerParam } : {} }).catch(() => ({ data: null })),
        ]).then(([centersRes, subjectsRes, configRes]) => {
            const loadedCenters = centersRes.data || [];
            const config = configRes.data;
            setCenters(loadedCenters);
            setSubjects(subjectsRes.data || []);
            setFormConfig(Array.isArray(config) ? config : null);

            // Initialize form values
            const initial = {};
            (Array.isArray(config) ? config : []).forEach(f => { initial[f.key] = ''; });
            setForm(initial);

            if (centerParam) {
                const match = loadedCenters.find(
                    c => String(c.id) === centerParam ||
                        c.name.toLowerCase() === centerParam.toLowerCase() ||
                        c.name.toLowerCase().replace(/\s+/g, '-') === centerParam.toLowerCase()
                );
                if (match) {
                    setLockedCenter(match);
                    setForm(f => ({ ...f, nearest_vama_center: match.name }));
                }
            }
        });
    }, []);

    const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const submit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            await api.post('/public/student-applications', form);
            setDone(true);
        } catch (err) {
            setError(err.response?.data?.detail || 'Could not submit the form. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (done) {
        return (
            <div className="min-h-screen bg-[#f4f3f8] flex items-center justify-center p-4">
                <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md p-10 text-center">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
                        <CheckCircle2 className="text-emerald-500" size={40} />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tighter">You're enrolled!</h1>
                    <p className="text-slate-400 font-bold text-sm mt-2 leading-relaxed">
                        Welcome to Vama Academy{lockedCenter ? ` — ${lockedCenter.name}` : ''}!<br />
                        Your account has been created — check your email for login details.
                    </p>
                    {lockedCenter && (
                        <div className="mt-5 flex items-center justify-center gap-2 text-[#463a7a] font-black text-xs uppercase tracking-widest">
                            <MapPin size={13} /> {lockedCenter.name}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (!formConfig) {
        return (
            <div className="min-h-screen bg-[#f4f3f8] flex items-center justify-center">
                <Loader2 className="animate-spin text-[#463a7a]" size={36} />
            </div>
        );
    }

    const enabledFields = formConfig.filter(f => f.enabled !== false).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    return (
        <div className="min-h-screen bg-[#f4f3f8] flex items-center justify-center p-4 py-10">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden">

                {/* Header */}
                <div className="bg-[#463a7a] text-white p-7 text-center">
                    <div className="text-2xl font-black tracking-[3px] mb-1">VAMA</div>
                    <p className="text-indigo-200/80 text-xs font-bold">Enroll With Us</p>
                    {lockedCenter ? (
                        <div className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 bg-white/10 rounded-full text-[11px] font-black tracking-widest uppercase text-indigo-200">
                            <MapPin size={11} /> {lockedCenter.name}
                        </div>
                    ) : (
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200/60 mt-3">
                            Tell us about you and we'll get you started
                        </p>
                    )}
                </div>

                <form onSubmit={submit} className="p-7 space-y-5">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-2xl text-sm font-bold flex items-center gap-2">
                            <AlertCircle size={15} /> {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {enabledFields.map(field => {
                            const isLocked = field.key === 'nearest_vama_center' && lockedCenter;
                            return (
                                <div key={field.key} className={field.type === 'textarea' || field.type === 'select_centers' ? 'md:col-span-2' : ''}>
                                    <label className={LABEL} htmlFor={field.key}>
                                        {field.label}{field.required ? ' *' : ''}
                                    </label>
                                    {isLocked ? (
                                        <div className="flex items-center gap-2 px-4 py-3 bg-[#463a7a]/5 border border-[#463a7a]/20 rounded-2xl">
                                            <MapPin size={15} className="text-[#463a7a] flex-shrink-0" />
                                            <span className="text-sm font-black text-[#463a7a]">{lockedCenter.name}</span>
                                            <span className="ml-auto text-[10px] font-black text-slate-400 uppercase tracking-widest">Pre-selected</span>
                                        </div>
                                    ) : (
                                        <DynField
                                            field={field}
                                            value={form[field.key]}
                                            onChange={setField}
                                            centers={centers}
                                            subjects={subjects}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <button type="submit" disabled={submitting}
                        className="w-full bg-[#463a7a] hover:bg-[#3a2f66] active:scale-[0.99] text-white rounded-2xl py-4 font-black text-base transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-900/20">
                        {submitting
                            ? <Loader2 className="animate-spin" size={20} />
                            : <><Music size={18} /> Enroll Now</>
                        }
                    </button>

                    <p className="text-center text-[11px] text-slate-400 font-bold">
                        By submitting, your account will be created immediately. You'll receive login credentials by email.
                    </p>
                </form>
            </div>
        </div>
    );
}
