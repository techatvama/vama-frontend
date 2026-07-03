import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Loader2, CheckCircle2, AlertCircle, Music, MapPin } from 'lucide-react';

const initialForm = {
    first_name: '', last_name: '', email: '', primary_phone_number: '',
    guardian_email: '', emergency_contact: '',
    date_of_birth: '', gender: '',
    parent_name: '',
    address: '', city: '', state: '',
    desired_course: '', class_frequency: '',
    nearest_vama_center: '', preferred_mode_of_contact: '',
    blood_group: '', allergies: '',
    referrer: '', notes: '',
};

const FIELD = "w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#463a7a]/15 focus:border-transparent transition-all";
const LABEL = "text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block";

export default function PublicStudentForm() {
    const [form, setForm] = useState(initialForm);
    const [centers, setCenters] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [lockedCenter, setLockedCenter] = useState(null); // pre-selected from URL
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Load centers and subjects in parallel
        Promise.all([
            api.get('/centers').catch(() => ({ data: [] })),
            api.get('/admin/subjects').catch(() => ({ data: [] })),
        ]).then(([centersRes, subjectsRes]) => {
            const loadedCenters = centersRes.data || [];
            setCenters(loadedCenters);
            setSubjects(subjectsRes.data || []);

            // Check URL for ?center= param and pre-select
            const params = new URLSearchParams(window.location.search);
            const centerParam = params.get('center');
            if (centerParam) {
                // Match by id or name (case-insensitive)
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

    const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

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

                <form onSubmit={submit} className="p-7 space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-2xl text-sm font-bold flex items-center gap-2">
                            <AlertCircle size={15} /> {error}
                        </div>
                    )}

                    {/* Personal */}
                    <Section title="Personal Details">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={LABEL}>First Name *</label>
                                <input required className={FIELD} value={form.first_name} onChange={set('first_name')} placeholder="Jane" />
                            </div>
                            <div>
                                <label className={LABEL}>Last Name *</label>
                                <input required className={FIELD} value={form.last_name} onChange={set('last_name')} placeholder="Doe" />
                            </div>
                            <div>
                                <label className={LABEL}>Date of Birth</label>
                                <input type="date" className={FIELD} value={form.date_of_birth} onChange={set('date_of_birth')} />
                            </div>
                            <div>
                                <label className={LABEL}>Gender</label>
                                <select className={FIELD} value={form.gender} onChange={set('gender')}>
                                    <option value="">Select…</option>
                                    <option>Male</option>
                                    <option>Female</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div>
                                <label className={LABEL}>Parent / Guardian Name</label>
                                <input className={FIELD} value={form.parent_name} onChange={set('parent_name')} />
                            </div>
                            <div>
                                <label className={LABEL}>Guardian Email</label>
                                <input type="email" className={FIELD} value={form.guardian_email} onChange={set('guardian_email')} placeholder="For minors / parents" />
                            </div>
                        </div>
                    </Section>

                    {/* Contact */}
                    <Section title="Contact">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className={LABEL}>Email *</label>
                                <input required type="email" className={FIELD} value={form.email} onChange={set('email')} placeholder="jane.doe@example.com" />
                            </div>
                            <div>
                                <label className={LABEL}>Phone *</label>
                                <input required type="tel" className={FIELD} value={form.primary_phone_number} onChange={set('primary_phone_number')} placeholder="+91 98765 43210" />
                            </div>
                            <div>
                                <label className={LABEL}>Emergency Contact</label>
                                <input type="tel" className={FIELD} value={form.emergency_contact} onChange={set('emergency_contact')} />
                            </div>
                            <div>
                                <label className={LABEL}>Preferred Contact Mode</label>
                                <select className={FIELD} value={form.preferred_mode_of_contact} onChange={set('preferred_mode_of_contact')}>
                                    <option value="">Select…</option>
                                    <option>Email</option>
                                    <option>Phone</option>
                                    <option>WhatsApp</option>
                                </select>
                            </div>
                        </div>
                    </Section>

                    {/* Address */}
                    <Section title="Address">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className={LABEL}>Street Address</label>
                                <textarea rows={2} className={`${FIELD} resize-none`} value={form.address} onChange={set('address')} />
                            </div>
                            <div>
                                <label className={LABEL}>City</label>
                                <input className={FIELD} value={form.city} onChange={set('city')} />
                            </div>
                            <div>
                                <label className={LABEL}>State</label>
                                <input className={FIELD} value={form.state} onChange={set('state')} />
                            </div>
                        </div>
                    </Section>

                    {/* Course */}
                    <Section title="Course Preferences">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={LABEL}>Desired Course *</label>
                                <select required className={FIELD} value={form.desired_course} onChange={set('desired_course')}>
                                    <option value="">Select a course</option>
                                    {subjects.length > 0
                                        ? subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)
                                        : ['Guitar', 'Piano', 'Vocals', 'Violin', 'Drums', 'Keyboard'].map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))
                                    }
                                </select>
                            </div>
                            <div>
                                <label className={LABEL}>Class Frequency</label>
                                <select className={FIELD} value={form.class_frequency} onChange={set('class_frequency')}>
                                    <option value="">Select…</option>
                                    <option>Weekly</option>
                                    <option>Bi-Weekly</option>
                                    <option>Monthly</option>
                                </select>
                            </div>

                            {/* Center — locked if accessed via center-specific link */}
                            <div className="md:col-span-2">
                                <label className={LABEL}>Nearest Vama Center *</label>
                                {lockedCenter ? (
                                    <div className="flex items-center gap-2 px-4 py-3 bg-[#463a7a]/5 border border-[#463a7a]/20 rounded-2xl">
                                        <MapPin size={15} className="text-[#463a7a] flex-shrink-0" />
                                        <span className="text-sm font-black text-[#463a7a]">{lockedCenter.name}</span>
                                        <span className="ml-auto text-[10px] font-black text-slate-400 uppercase tracking-widest">Pre-selected</span>
                                    </div>
                                ) : (
                                    <select required className={FIELD} value={form.nearest_vama_center} onChange={set('nearest_vama_center')}>
                                        <option value="">Select a center</option>
                                        {centers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    </select>
                                )}
                            </div>
                        </div>
                    </Section>

                    {/* Health */}
                    <Section title="Health Info">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={LABEL}>Blood Group</label>
                                <select className={FIELD} value={form.blood_group} onChange={set('blood_group')}>
                                    <option value="">Select…</option>
                                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => <option key={g}>{g}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={LABEL}>Allergies</label>
                                <input className={FIELD} value={form.allergies} onChange={set('allergies')} placeholder="None / specify if any" />
                            </div>
                        </div>
                    </Section>

                    {/* Other */}
                    <Section title="Additional Info">
                        <div className="space-y-4">
                            <div>
                                <label className={LABEL}>How did you hear about us?</label>
                                <select className={FIELD} value={form.referrer} onChange={set('referrer')}>
                                    <option value="">Select…</option>
                                    <option>Social Media</option>
                                    <option>Google Search</option>
                                    <option>Advertisement</option>
                                    <option>Referral</option>
                                    <option>Event</option>
                                    <option>Returning Student</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div>
                                <label className={LABEL}>Anything else we should know?</label>
                                <textarea rows={3} className={`${FIELD} resize-none`} value={form.notes} onChange={set('notes')} placeholder="Goals, prior experience, scheduling constraints…" />
                            </div>
                        </div>
                    </Section>

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

function Section({ title, children }) {
    return (
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <span className="w-4 h-px bg-slate-200 inline-block" />
                {title}
                <span className="flex-1 h-px bg-slate-100 inline-block" />
            </p>
            {children}
        </div>
    );
}
