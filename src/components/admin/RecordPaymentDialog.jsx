import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../lib/api';
import {
    X, Loader2, CheckCircle2, AlertCircle, Mail, Banknote, Send, Bell, Receipt, Pencil, Lock, Trash2, Plus, Search,
} from 'lucide-react';

function PackagePicker({ packages, onPick, onCancel }) {
    const [q, setQ] = useState('');
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => { ref.current?.focus(); setOpen(true); }, []);
    const filtered = packages.filter(p => !q || p.name.toLowerCase().includes(q.toLowerCase()));
    return (
        <div className="relative flex-1">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input ref={ref} type="text" value={q} placeholder="Search package…" autoComplete="off"
                onChange={e => { setQ(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 160)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-7 pr-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#463a7a]/15" />
            {open && (
                <div className="absolute z-50 mt-1 left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-52 overflow-y-auto">
                    <button type="button" onMouseDown={e => { e.preventDefault(); onCancel(); }}
                        className="w-full text-left px-3 py-2 text-xs text-slate-400 font-bold hover:bg-slate-50 border-b border-slate-100">
                        ← Type manually instead
                    </button>
                    {filtered.length === 0
                        ? <p className="text-xs text-slate-400 text-center py-3">{q ? `No match for "${q}"` : 'No packages'}</p>
                        : filtered.map(p => (
                            <button key={p.id} type="button"
                                onMouseDown={e => { e.preventDefault(); onPick(p); }}
                                className="w-full text-left px-3 py-2.5 hover:bg-violet-50 border-b border-slate-50 last:border-0">
                                <p className="text-xs font-black text-slate-800">{p.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold">
                                    {p.total_sessions ? `${p.total_sessions} sessions · ` : ''}₹{Number(p.price || 0).toLocaleString('en-IN')}
                                </p>
                            </button>
                        ))
                    }
                </div>
            )}
        </div>
    );
}
import { format } from 'date-fns';

const money = (v) => `₹${(Number(v) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function RecordPaymentDialog({ invoiceId, onClose, onRecorded }) {
    const [inv, setInv] = useState(null);
    const [modes, setModes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('');
    const [reference, setReference] = useState('');
    const [paidDate, setPaidDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [installmentId, setInstallmentId] = useState('');
    const [sendReceipt, setSendReceipt] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [editing, setEditing] = useState(false);
    const [edit, setEdit] = useState({ due_date: '', notes: '', internal_notes: '', discount_pct: 0, tax_pct: 0, items: [] });
    const [packages, setPackages] = useState([]);
    const [pkgPickerKey, setPkgPickerKey] = useState(null); // item key that has picker open

    const load = useCallback(async () => {
        try {
            const r = await api.get(`/admin/invoices/${invoiceId}`);
            setInv(r.data);
            setAmount(String(r.data.balance || ''));
            const base = (r.data.amount || 0) - (r.data.discount_amount || 0);
            setEdit({
                due_date: r.data.due_date || '', notes: r.data.notes || '', internal_notes: r.data.internal_notes || '',
                discount_pct: r.data.discount_percentage || 0,
                tax_pct: base > 0 ? Math.round((r.data.tax_amount || 0) / base * 100) : 0,
                items: (r.data.items || []).map(it => ({ key: it.id, label: it.label, description: it.description || '', quantity: it.quantity, unit_price: it.unit_price, valid_till: it.valid_till || '' })),
            });
        } catch (e) { setError('Failed to load invoice'); }
        finally { setLoading(false); }
    }, [invoiceId]);

    const setEditItem = (key, patch) => setEdit(e => ({ ...e, items: e.items.map(it => it.key === key ? { ...it, ...patch } : it) }));
    const editSubtotal = (edit.items || []).reduce((a, it) => a + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0);

    const saveEdit = async () => {
        if (!edit.items.length || edit.items.some(it => !it.label)) { setError('Each item needs a name.'); return; }
        try {
            await api.put(`/admin/invoices/${invoiceId}`, {
                items: edit.items.map(it => ({ label: it.label, description: it.description, quantity: Number(it.quantity) || 1, unit_price: Number(it.unit_price) || 0, valid_till: it.valid_till || null })),
                discount_percentage: Number(edit.discount_pct) || 0, tax_percentage: Number(edit.tax_pct) || 0,
                due_date: edit.due_date, notes: edit.notes, internal_notes: edit.internal_notes,
            });
            setEditing(false); await load(); onRecorded?.(); flash('Invoice updated');
        } catch (e) { setError(e.response?.data?.detail || 'Failed to save'); }
    };
    useEffect(() => { load(); }, [load]);
    useEffect(() => {
        api.get('/admin/payment-modes', { params: { active_only: true } }).then(r => {
            const ms = (r.data || []).map(m => m.name);
            setModes(ms); if (ms.length) setMethod(ms[0]);
        }).catch(() => { setModes(['Cash', 'UPI']); setMethod('Cash'); });
        api.get('/admin/packages').then(r => setPackages(r.data || [])).catch(() => {});
    }, []);

    const flash = (m) => { setNotice(m); setTimeout(() => setNotice(''), 3500); };

    const pickInstallment = (id) => {
        setInstallmentId(id);
        const ins = inv.installments.find(i => String(i.id) === String(id));
        if (ins) setAmount(String(Math.max(0, (ins.amount || 0) - (ins.paid_amount || 0))));
    };

    const record = async () => {
        setError('');
        if (!(Number(amount) > 0)) { setError('Enter a payment amount.'); return; }
        setSaving(true);
        try {
            const r = await api.post(`/admin/invoices/${invoiceId}/record-payment`, {
                amount: Number(amount), method, reference: reference || null, paid_date: paidDate,
                installment_id: installmentId ? Number(installmentId) : null, send_receipt: sendReceipt,
            });
            await load();
            setReference(''); setInstallmentId('');
            onRecorded?.();
            flash(`Payment recorded · ${r.data.status}${r.data.receipt_emailed ? ' · receipt emailed' : ''}`);
        } catch (e) { setError(e.response?.data?.detail || 'Failed to record payment'); }
        finally { setSaving(false); }
    };

    const deletePayment = async (pid) => {
        if (!confirm('Delete this payment? The invoice balance will be restored.')) return;
        try { await api.delete(`/admin/invoices/${invoiceId}/payments/${pid}`); await load(); onRecorded?.(); flash('Payment deleted'); }
        catch (e) { setError(e.response?.data?.detail || 'Failed to delete payment'); }
    };
    const deleteInvoice = async () => {
        if (!confirm('Delete this entire invoice (items, payments, installments)? This cannot be undone.')) return;
        try { await api.delete(`/admin/invoices/${invoiceId}`); onRecorded?.(); onClose(); }
        catch (e) { setError(e.response?.data?.detail || 'Failed to delete invoice'); }
    };

    const printInvoice = async () => {
        try {
            const r = await api.get(`/admin/invoices/${invoiceId}/html`);
            const w = window.open('', '_blank');
            w.document.write(r.data); w.document.close(); w.focus();
            setTimeout(() => w.print(), 400);
        } catch { setError('Failed to open invoice'); }
    };

    const sendMail = async (kind) => {
        setError('');
        try {
            await api.post(`/admin/invoices/${invoiceId}/send`, { kind });
            flash(kind === 'reminder' ? 'Reminder emailed' : 'Invoice emailed');
        } catch (e) { setError(e.response?.data?.detail || 'Failed to send'); }
    };

    const input = "w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#463a7a]/15";

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={onClose} />
            <div className="relative bg-white rounded-[36px] w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl">
                {loading || !inv ? (
                    <div className="py-24 flex justify-center"><Loader2 className="animate-spin text-[#463a7a]" size={32} /></div>
                ) : (
                    <>
                        <div className="p-6 bg-[#463a7a] text-white sticky top-0 z-10 flex items-start justify-between">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest bg-white/15 px-2 py-0.5 rounded-lg">{inv.status}</span>
                                <h2 className="text-2xl font-black tracking-tighter mt-2 flex items-center gap-2"><Receipt size={22} /> {inv.invoice_number}</h2>
                                <p className="text-indigo-200/70 text-sm font-bold mt-0.5">{inv.student_name} · {inv.student_email}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setEditing(v => !v)} title="Edit invoice" className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-2xl hover:bg-white/20"><Pencil size={16} /></button>
                                <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-2xl hover:bg-white/20"><X size={18} /></button>
                            </div>
                        </div>

                        <div className="p-6 space-y-5">
                            {notice && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-2xl text-sm font-black flex items-center gap-2"><CheckCircle2 size={16} />{notice}</div>}
                            {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-2xl text-sm font-bold flex items-center gap-2"><AlertCircle size={16} />{error}</div>}

                            {editing && (
                                <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 space-y-3">
                                    <p className="font-black text-slate-900 text-sm flex items-center gap-2"><Pencil size={15} className="text-[#463a7a]" /> Edit invoice</p>
                                    {/* Line items */}
                                    <div className="space-y-2">
                                        {edit.items.map(it => (
                                            <div key={it.key} className="bg-white rounded-xl p-2.5 border border-slate-100 space-y-1.5">
                                                <div className="flex gap-1.5 items-center">
                                                    {pkgPickerKey === it.key ? (
                                                        <PackagePicker packages={packages}
                                                            onPick={pkg => {
                                                                setEditItem(it.key, {
                                                                    label: pkg.name,
                                                                    unit_price: pkg.price || 0,
                                                                    quantity: pkg.total_sessions || 1,
                                                                    description: pkg.description || '',
                                                                });
                                                                setPkgPickerKey(null);
                                                            }}
                                                            onCancel={() => setPkgPickerKey(null)}
                                                        />
                                                    ) : (
                                                        <div className="flex flex-1 gap-1.5">
                                                            <input value={it.label} onChange={e => setEditItem(it.key, { label: e.target.value })} placeholder="Item name" className={`${input} flex-1`} />
                                                            <button type="button" onClick={() => setPkgPickerKey(it.key)}
                                                                className="px-2.5 py-1.5 bg-violet-50 text-[#463a7a] rounded-xl text-[10px] font-black hover:bg-violet-100 whitespace-nowrap flex-shrink-0">
                                                                Pick pkg
                                                            </button>
                                                        </div>
                                                    )}
                                                    <button onClick={() => setEdit(e => ({ ...e, items: e.items.filter(x => x.key !== it.key) }))} className="px-2 text-slate-300 hover:text-red-500 flex-shrink-0"><Trash2 size={15} /></button>
                                                </div>
                                                <div className="grid grid-cols-3 gap-1.5">
                                                    <input type="number" value={it.quantity} onChange={e => setEditItem(it.key, { quantity: e.target.value })} placeholder="Qty" className={`${input} text-center`} />
                                                    <input type="number" value={it.unit_price} onChange={e => setEditItem(it.key, { unit_price: e.target.value })} placeholder="Price" className={`${input} text-right`} />
                                                    <input type="date" value={it.valid_till} onChange={e => setEditItem(it.key, { valid_till: e.target.value })} className={`${input} text-xs`} />
                                                </div>
                                                <input value={it.description} onChange={e => setEditItem(it.key, { description: e.target.value })} placeholder="Description" className={input} />
                                            </div>
                                        ))}
                                        <button onClick={() => setEdit(e => ({ ...e, items: [...e.items, { key: Math.random().toString(36).slice(2), label: '', description: '', quantity: 1, unit_price: 0, valid_till: '' }] }))} className="text-[#463a7a] font-black text-xs flex items-center gap-1"><Plus size={13} /> Add item</button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div><label className="text-[10px] font-black text-slate-400 uppercase">Discount %</label><input type="number" value={edit.discount_pct} onChange={e => setEdit({ ...edit, discount_pct: e.target.value })} className={`${input} mt-1`} /></div>
                                        <div><label className="text-[10px] font-black text-slate-400 uppercase">Tax %</label><input type="number" value={edit.tax_pct} onChange={e => setEdit({ ...edit, tax_pct: e.target.value })} className={`${input} mt-1`} /></div>
                                    </div>
                                    <p className="text-xs font-black text-slate-500 text-right">New subtotal: {money(editSubtotal)}</p>
                                    <div><label className="text-[10px] font-black text-slate-400 uppercase">Due date</label><input type="date" value={edit.due_date} onChange={e => setEdit({ ...edit, due_date: e.target.value })} className={`${input} mt-1`} /></div>
                                    <div><label className="text-[10px] font-black text-slate-400 uppercase">Notes (shown on invoice)</label><textarea rows={2} value={edit.notes} onChange={e => setEdit({ ...edit, notes: e.target.value })} className={`${input} mt-1 resize-none`} /></div>
                                    <div><label className="text-[10px] font-black text-amber-500 uppercase flex items-center gap-1"><Lock size={11} /> Internal notes (admin only)</label><textarea rows={2} value={edit.internal_notes} onChange={e => setEdit({ ...edit, internal_notes: e.target.value })} placeholder="Visible to staff only — never sent to the student" className={`${input} mt-1 resize-none border-amber-200 bg-amber-50/40`} /></div>
                                    {inv.paid_amount > 0 && <p className="text-[11px] text-amber-600 font-bold flex items-center gap-1"><AlertCircle size={12} /> {money(inv.paid_amount)} already paid — status recalculates after saving.</p>}
                                    <div className="flex gap-2">
                                        <button onClick={() => setEditing(false)} className="flex-1 bg-slate-100 text-slate-500 rounded-xl py-2 text-xs font-black">Cancel</button>
                                        <button onClick={saveEdit} className="flex-1 bg-[#463a7a] text-white rounded-xl py-2 text-xs font-black">Save changes</button>
                                    </div>
                                </div>
                            )}

                            {!editing && inv.internal_notes && (
                                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-sm">
                                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1 mb-1"><Lock size={11} /> Internal note</p>
                                    <p className="text-amber-700 font-bold whitespace-pre-wrap">{inv.internal_notes}</p>
                                </div>
                            )}

                            {/* Invoice items */}
                            <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
                                {inv.items.map(it => (
                                    <div key={it.id} className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 last:border-0">
                                        <div className="min-w-0"><p className="text-sm font-black text-slate-800 truncate">{it.label}</p><p className="text-xs text-slate-400 font-bold">{it.quantity} × {money(it.unit_price)}{it.valid_till ? ` · valid till ${it.valid_till}` : ''}</p></div>
                                        <span className="text-sm font-black text-slate-700">{money(it.amount)}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Totals */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-slate-50 rounded-2xl p-3 text-center"><p className="text-[10px] font-black text-slate-400 uppercase">Total</p><p className="text-lg font-black text-slate-900">{money(inv.total_amount)}</p></div>
                                <div className="bg-emerald-50 rounded-2xl p-3 text-center"><p className="text-[10px] font-black text-emerald-500 uppercase">Paid</p><p className="text-lg font-black text-emerald-700">{money(inv.paid_amount)}</p></div>
                                <div className="bg-amber-50 rounded-2xl p-3 text-center"><p className="text-[10px] font-black text-amber-500 uppercase">Balance</p><p className="text-lg font-black text-amber-700">{money(inv.balance)}</p></div>
                            </div>

                            {/* Installments */}
                            {inv.installments.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Installments</p>
                                    <div className="space-y-1.5">
                                        {inv.installments.map(i => (
                                            <button key={i.id} onClick={() => pickInstallment(i.id)}
                                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-left ${String(installmentId) === String(i.id) ? 'border-[#463a7a] bg-indigo-50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'} ${i.status === 'paid' ? 'opacity-60' : ''}`}>
                                                <span className="text-sm font-bold text-slate-700">#{i.seq} · due {i.due_date}</span>
                                                <span className="text-xs font-black">{money(i.amount)} <span className={`ml-1 ${i.status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>{i.status}</span></span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Record payment */}
                            {inv.balance > 0 ? (
                                <div className="bg-white border-2 border-[#463a7a]/15 rounded-2xl p-4 space-y-3">
                                    <p className="font-black text-slate-900 flex items-center gap-2"><Banknote size={18} className="text-[#463a7a]" /> Record a payment</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div><label className="text-[10px] font-black text-slate-400 uppercase">Amount</label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} className={`${input} mt-1`} /></div>
                                        <div><label className="text-[10px] font-black text-slate-400 uppercase">Method</label>
                                            <select value={method} onChange={e => setMethod(e.target.value)} className={`${input} mt-1`}>{modes.map(m => <option key={m}>{m}</option>)}</select>
                                        </div>
                                        <div><label className="text-[10px] font-black text-slate-400 uppercase">Date</label><input type="date" value={paidDate} onChange={e => setPaidDate(e.target.value)} className={`${input} mt-1`} /></div>
                                        <div><label className="text-[10px] font-black text-slate-400 uppercase">Reference (optional)</label><input value={reference} onChange={e => setReference(e.target.value)} placeholder="Txn / cheque #" className={`${input} mt-1`} /></div>
                                    </div>
                                    <label className="flex items-center gap-2.5 cursor-pointer">
                                        <input type="checkbox" checked={sendReceipt} onChange={e => setSendReceipt(e.target.checked)} className="w-5 h-5 rounded-md accent-[#463a7a]" />
                                        <span className="text-sm font-bold text-slate-600 flex items-center gap-1.5"><Mail size={14} className="text-[#463a7a]" /> Email payment receipt to student</span>
                                    </label>
                                    <button onClick={record} disabled={saving} className="w-full bg-[#463a7a] hover:bg-[#3a2f66] text-white rounded-2xl py-3 font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50">
                                        {saving ? <Loader2 className="animate-spin" size={18} /> : <>Record {money(amount)} payment</>}
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-emerald-50 text-emerald-700 rounded-2xl p-4 text-center font-black flex items-center justify-center gap-2"><CheckCircle2 size={18} /> Fully paid</div>
                            )}

                            {/* Past payments */}
                            {inv.payments.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Payment history</p>
                                    <div className="space-y-1.5">
                                        {inv.payments.map(p => (
                                            <div key={p.id} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl text-sm group">
                                                <span className="font-bold text-slate-600">{p.paid_date} · {p.method}{p.reference ? ` · ${p.reference}` : ''}</span>
                                                <span className="flex items-center gap-2">
                                                    <span className="font-black text-slate-800">{money(p.amount)}</span>
                                                    <button onClick={() => deletePayment(p.id)} title="Delete payment" className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Email actions */}
                            <div className="flex gap-2 pt-1">
                                <button onClick={printInvoice} className="flex-1 flex items-center justify-center gap-1.5 bg-[#463a7a]/10 text-[#463a7a] rounded-2xl py-2.5 text-xs font-black hover:bg-[#463a7a]/20"><Receipt size={14} /> Download PDF</button>
                                <button onClick={() => sendMail('invoice')} className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 text-slate-600 rounded-2xl py-2.5 text-xs font-black hover:bg-slate-200"><Send size={14} /> Send invoice</button>
                                <button onClick={() => sendMail('reminder')} className="flex-1 flex items-center justify-center gap-1.5 bg-amber-50 text-amber-600 rounded-2xl py-2.5 text-xs font-black hover:bg-amber-100"><Bell size={14} /> Send reminder</button>
                            </div>
                            <button onClick={deleteInvoice} className="w-full flex items-center justify-center gap-1.5 text-red-500 rounded-2xl py-2.5 text-xs font-black hover:bg-red-50 transition-colors"><Trash2 size={14} /> Delete invoice</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
