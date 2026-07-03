import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../../lib/api';
import {
    Plus, Trash2, X, Loader2, FileText, Search, Mail, Calendar, Layers,
    CheckCircle2, AlertCircle, Info,
} from 'lucide-react';
import { format, addDays } from 'date-fns';

const money = (v) => `₹${(Number(v) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const todayISO = () => format(new Date(), 'yyyy-MM-dd');

function PackagePicker({ packages, onPick }) {
    const [q, setQ] = useState('');
    const [open, setOpen] = useState(false);
    const inputRef = useRef(null);
    useEffect(() => { inputRef.current?.focus(); setOpen(true); }, []);
    const filtered = packages.filter(p => !q || p.name.toLowerCase().includes(q.toLowerCase()));
    return (
        <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input ref={inputRef} type="text" value={q} placeholder="Search package…"
                onChange={e => { setQ(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 160)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-8 pr-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#463a7a]/15"
                autoComplete="off" />
            {open && (
                <div className="absolute z-40 mt-1 left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-64 overflow-y-auto">
                    {filtered.length === 0
                        ? <p className="text-xs text-slate-400 font-bold text-center py-4">{q ? `No packages match "${q}"` : 'No packages available'}</p>
                        : filtered.map(p => (
                            <button key={p.id} type="button"
                                onMouseDown={e => { e.preventDefault(); onPick(String(p.id)); }}
                                className="w-full text-left px-4 py-3 hover:bg-violet-50 border-b border-slate-50 last:border-0 transition-colors">
                                <p className="text-sm font-black text-slate-800">{p.name}</p>
                                <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                                    {p.total_sessions ? `${p.total_sessions} sessions · ` : ''}{p.validity_days ? `${p.validity_days} days · ` : ''}₹{Number(p.price || 0).toLocaleString('en-IN')}
                                </p>
                            </button>
                        ))
                    }
                </div>
            )}
        </div>
    );
}

export default function InvoiceCreator() {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [packages, setPackages] = useState([]);
    const [studentId, setStudentId] = useState('');
    const [studentSearch, setStudentSearch] = useState('');
    const [showStudentList, setShowStudentList] = useState(false);
    const [issueDate, setIssueDate] = useState(todayISO());
    const [dueDate, setDueDate] = useState(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
    const [items, setItems] = useState([blankItem()]);
    const [discountPct, setDiscountPct] = useState(0);
    const [taxPct, setTaxPct] = useState(0);
    const [notes, setNotes] = useState('');
    const [useInstallments, setUseInstallments] = useState(false);
    const [installments, setInstallments] = useState([]);
    const [sendEmail, setSendEmail] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [done, setDone] = useState(null);

    function blankItem() {
        return { key: Math.random().toString(36).slice(2), package_id: '', label: '', description: '', quantity: 1, unit_price: 0, valid_till: '' };
    }

    useEffect(() => {
        api.get('/students').then(r => setStudents(r.data || [])).catch(() => {});
        api.get('/admin/packages').then(r => setPackages(r.data || [])).catch(() => {});
        // Single default invoice format — pre-fill the standard Welcome + T&C notes.
        api.get('/admin/org-settings').then(r => { if (r.data?.invoice_notes) setNotes(r.data.invoice_notes); }).catch(() => {});
    }, []);

    const student = students.find(s => String(s.id) === String(studentId));
    const studentMatches = students.filter(s => `${s.first_name} ${s.last_name} ${s.email}`.toLowerCase().includes(studentSearch.toLowerCase())).slice(0, 30);

    const subtotal = useMemo(() => items.reduce((a, it) => a + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0), [items]);
    const discountAmount = useMemo(() => Math.round(subtotal * Number(discountPct || 0)) / 100, [subtotal, discountPct]);
    const taxAmount = useMemo(() => Math.round((subtotal - discountAmount) * Number(taxPct || 0)) / 100, [subtotal, discountAmount, taxPct]);
    const total = useMemo(() => Math.max(0, subtotal + taxAmount - discountAmount), [subtotal, taxAmount, discountAmount]);

    const setItem = (key, patch) => setItems(items.map(it => it.key === key ? { ...it, ...patch } : it));
    const onPickPackage = (key, pkgId) => {
        const pkg = packages.find(p => String(p.id) === String(pkgId));
        if (!pkg) { setItem(key, { package_id: '' }); return; }
        // Per-session fee × sessions so the line reads like the academy invoice.
        const perSession = pkg.per_session_fee || (pkg.total_sessions ? Math.round((pkg.price || 0) / pkg.total_sessions) : pkg.price || 0);
        const dur = pkg.session_duration_minutes ? `${pkg.session_duration_minutes} min · ` : '';
        setItem(key, {
            package_id: pkgId, label: pkg.name,
            quantity: pkg.total_sessions || 1, unit_price: perSession,
            description: pkg.description || `${dur}${(pkg.applicable_courses || []).join(', ')} ${pkg.name}`.trim(),
            valid_till: pkg.validity_days ? format(addDays(new Date(), pkg.validity_days), 'yyyy-MM-dd') : '',
        });
        if (pkg.tax_percentage != null && taxPct === 0) setTaxPct(pkg.tax_percentage);
    };

    // Installments helpers
    const splitEvenly = (n) => {
        const each = Math.round((total / n) * 100) / 100;
        const rows = Array.from({ length: n }, (_, i) => ({
            key: Math.random().toString(36).slice(2),
            due_date: format(addDays(new Date(), 30 * i), 'yyyy-MM-dd'),
            amount: i === n - 1 ? Math.round((total - each * (n - 1)) * 100) / 100 : each,
        }));
        setInstallments(rows);
    };
    const toggleInstallments = () => {
        const next = !useInstallments;
        setUseInstallments(next);
        if (next && installments.length === 0) splitEvenly(2);
    };

    const submit = async () => {
        setError('');
        if (!studentId) { setError('Select a student.'); return; }
        const valid = items.filter(it => it.label && Number(it.unit_price) > 0);
        if (valid.length === 0) { setError('Add at least one item with a price.'); return; }
        setSaving(true);
        try {
            const res = await api.post('/admin/invoices', {
                student_id: Number(studentId), issue_date: issueDate, due_date: dueDate,
                items: valid.map(it => ({ package_id: it.package_id || null, label: it.label, description: it.description, quantity: Number(it.quantity) || 1, unit_price: Number(it.unit_price) || 0, valid_till: it.valid_till || null })),
                discount_percentage: Number(discountPct) || 0, tax_percentage: Number(taxPct) || 0,
                notes: notes || null,
                installments: useInstallments ? installments.map(i => ({ due_date: i.due_date, amount: Number(i.amount) || 0 })) : [],
                send_email: sendEmail,
            });
            setDone(res.data);
        } catch (e) { setError(e.response?.data?.detail || 'Failed to create invoice'); }
        finally { setSaving(false); }
    };

    if (done) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
                <div className="bg-white rounded-[36px] p-10 shadow-xl border border-slate-100 max-w-md text-center">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-5"><CheckCircle2 size={32} /></div>
                    <h2 className="text-2xl font-black text-slate-900">Invoice {done.invoice_number} created</h2>
                    <p className="text-slate-500 font-bold text-sm mt-2">{done.emailed ? `Emailed to ${student?.email}` : 'Invoice saved.'}</p>
                    <div className="flex gap-3 mt-7">
                        <button onClick={() => navigate('/admin/invoices')} className="flex-1 bg-[#463a7a] text-white rounded-2xl py-3 font-black text-sm">View Invoices</button>
                        <button onClick={() => window.location.reload()} className="flex-1 bg-slate-100 text-slate-600 rounded-2xl py-3 font-black text-sm">New Invoice</button>
                    </div>
                </div>
            </div>
        );
    }

    const input = "w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#463a7a]/15";

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 lg:p-8">
            <div className="max-w-5xl mx-auto space-y-5">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3"><FileText className="text-[#463a7a]" /> Create Invoice</h1>
                    <button onClick={() => navigate('/admin/invoices')} className="text-slate-400 hover:text-slate-600"><X size={22} /></button>
                </div>

                {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-2xl text-sm font-bold flex items-center gap-2"><AlertCircle size={16} />{error}</div>}

                {/* Student + dates */}
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="relative">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</label>
                        <div className="relative mt-1">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input value={student ? `${student.first_name} ${student.last_name}` : studentSearch}
                                onChange={e => { setStudentSearch(e.target.value); setStudentId(''); setShowStudentList(true); }}
                                onFocus={() => setShowStudentList(true)}
                                placeholder="Search student…" className={`${input} pl-9`} />
                        </div>
                        {showStudentList && !studentId && studentSearch && (
                            <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-2xl shadow-xl max-h-56 overflow-y-auto">
                                {studentMatches.map(s => (
                                    <button key={s.id} onClick={() => { setStudentId(s.id); setShowStudentList(false); }}
                                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-sm font-bold text-slate-700">
                                        {s.first_name} {s.last_name} <span className="text-slate-400 text-xs">· {s.email}</span>
                                    </button>
                                ))}
                                {studentMatches.length === 0 && <p className="px-4 py-3 text-xs text-slate-400 font-bold">No students</p>}
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Issue Date</label>
                        <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} className={`${input} mt-1`} />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Date</label>
                        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={`${input} mt-1`} />
                    </div>
                </div>

                {/* Items */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 grid grid-cols-12 gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <div className="col-span-5">Item</div><div className="col-span-2 text-center">Qty</div>
                        <div className="col-span-2 text-right">Price</div><div className="col-span-2 text-right">Valid till</div>
                        <div className="col-span-1 text-right">Amount</div>
                    </div>
                    {items.map(it => (
                        <div key={it.key} className="px-5 py-4 border-b border-slate-50">
                            <div className="grid grid-cols-12 gap-2 items-center">
                                <div className="col-span-5 min-w-0">
                                    {it.label ? (
                                        <div className="flex items-start gap-2">
                                            <p className="text-sm font-black text-slate-900 leading-snug flex-1 min-w-0">{it.label}</p>
                                            <button onClick={() => setItem(it.key, { package_id: '', label: '' })} title="Change item" className="text-[10px] font-black text-[#463a7a] hover:underline flex-shrink-0 mt-0.5">change</button>
                                        </div>
                                    ) : (
                                        <PackagePicker packages={packages} onPick={(pkgId) => onPickPackage(it.key, pkgId)} />
                                    )}
                                </div>
                                <div className="col-span-2"><input type="number" min="1" value={it.quantity} onChange={e => setItem(it.key, { quantity: e.target.value })} className={`${input} text-center`} /></div>
                                <div className="col-span-2"><input type="number" min="0" value={it.unit_price} onChange={e => setItem(it.key, { unit_price: e.target.value })} className={`${input} text-right`} /></div>
                                <div className="col-span-2"><input type="date" value={it.valid_till || ''} onChange={e => setItem(it.key, { valid_till: e.target.value })} className={`${input} text-xs`} /></div>
                                <div className="col-span-1 flex items-center justify-end gap-1.5">
                                    <span className="text-sm font-black text-slate-700">{money((Number(it.quantity) || 0) * (Number(it.unit_price) || 0))}</span>
                                    {items.length > 1 && <button onClick={() => setItems(items.filter(x => x.key !== it.key))} className="text-slate-300 hover:text-red-500"><Trash2 size={15} /></button>}
                                </div>
                            </div>
                            {it.label && (
                                <input value={it.description} onChange={e => setItem(it.key, { description: e.target.value })} placeholder="Description (e.g. Guitar - 60 mins)"
                                    className={`${input} mt-2`} />
                            )}
                        </div>
                    ))}
                    <div className="px-5 py-4 flex items-center justify-between">
                        <button onClick={() => setItems([...items, blankItem()])} className="flex items-center gap-2 text-[#463a7a] font-black text-sm"><Plus size={16} className="bg-[#463a7a] text-white rounded-full p-0.5" /> Add item</button>
                    </div>
                </div>

                {/* Totals + discount/tax + template notes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-3">
                        <div className="flex items-center gap-3">
                            <label className="text-xs font-black text-slate-500 w-24">Discount (%)</label>
                            <input type="number" min="0" max="100" value={discountPct} onChange={e => setDiscountPct(e.target.value)} className={input} />
                        </div>
                        <div className="flex items-center gap-3">
                            <label className="text-xs font-black text-slate-500 w-24">Tax (%)</label>
                            <input type="number" min="0" value={taxPct} onChange={e => setTaxPct(e.target.value)} className={input} />
                        </div>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Invoice notes (Welcome / Terms — pre-filled, editable)" rows={4} className={`${input} resize-none`} />
                    </div>
                    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
                        <div className="space-y-2 text-sm font-bold text-slate-600">
                            <div className="flex justify-between"><span>Subtotal</span><span>{money(subtotal)}</span></div>
                            <div className="flex justify-between"><span>Tax ({taxPct || 0}%)</span><span>{money(taxAmount)}</span></div>
                            <div className="flex justify-between"><span>Discount ({discountPct || 0}%)</span><span className="text-rose-500">-{money(discountAmount)}</span></div>
                            <div className="flex justify-between text-lg font-black text-slate-900 pt-2 border-t border-slate-100"><span>Total</span><span>{money(total)}</span></div>
                        </div>
                    </div>
                </div>

                {/* Installments */}
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
                    <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm font-black text-slate-800 flex items-center gap-2"><Layers size={16} className="text-[#463a7a]" /> Pay in installments</span>
                        <button type="button" onClick={toggleInstallments} className={`w-11 h-6 rounded-full transition-all relative ${useInstallments ? 'bg-[#463a7a]' : 'bg-slate-300'}`}>
                            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${useInstallments ? 'left-[22px]' : 'left-0.5'}`} />
                        </button>
                    </label>
                    {useInstallments && (
                        <div className="mt-4 space-y-2">
                            <div className="flex gap-2">
                                {[2, 3, 4].map(n => <button key={n} onClick={() => splitEvenly(n)} className="px-3 py-1.5 bg-slate-50 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-100">Split into {n}</button>)}
                            </div>
                            {installments.map((ins, idx) => (
                                <div key={ins.key} className="flex items-center gap-2">
                                    <span className="text-xs font-black text-slate-400 w-6">#{idx + 1}</span>
                                    <input type="date" value={ins.due_date} onChange={e => setInstallments(installments.map(x => x.key === ins.key ? { ...x, due_date: e.target.value } : x))} className={`${input} flex-1`} />
                                    <input type="number" value={ins.amount} onChange={e => setInstallments(installments.map(x => x.key === ins.key ? { ...x, amount: e.target.value } : x))} className={`${input} w-32 text-right`} />
                                    <button onClick={() => setInstallments(installments.filter(x => x.key !== ins.key))} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={15} /></button>
                                </div>
                            ))}
                            <button onClick={() => setInstallments([...installments, { key: Math.random().toString(36).slice(2), due_date: todayISO(), amount: 0 }])} className="text-[#463a7a] font-black text-xs flex items-center gap-1"><Plus size={13} /> Add installment</button>
                            {Math.abs(installments.reduce((a, i) => a + Number(i.amount || 0), 0) - total) > 0.5 && (
                                <p className="text-[11px] text-amber-600 font-bold flex items-center gap-1"><Info size={12} /> Installments total {money(installments.reduce((a, i) => a + Number(i.amount || 0), 0))} ≠ invoice total {money(total)}</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Email + submit */}
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex items-center justify-between flex-wrap gap-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={sendEmail} onChange={e => setSendEmail(e.target.checked)} className="w-5 h-5 rounded-md accent-[#463a7a]" />
                        <span className="text-sm font-black text-slate-700 flex items-center gap-2"><Mail size={16} className="text-[#463a7a]" /> Email this invoice to {student ? student.first_name : 'the student'}{student?.email ? ` (${student.email})` : ''}</span>
                    </label>
                    <button onClick={submit} disabled={saving}
                        className="bg-[#463a7a] hover:bg-[#3a2f66] text-white rounded-2xl px-8 py-3.5 font-black text-sm uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50">
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <><FileText size={18} /> Create Invoice · {money(total)}</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
