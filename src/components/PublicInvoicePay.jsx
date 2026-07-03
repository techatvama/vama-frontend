import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { api } from '../lib/api';
import { Loader2, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';

const money = (v) => `₹${(Number(v) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

function loadRazorpay() {
    return new Promise((resolve) => {
        if (window.Razorpay) return resolve(true);
        const s = document.createElement('script');
        s.src = 'https://checkout.razorpay.com/v1/checkout.js';
        s.onload = () => resolve(true); s.onerror = () => resolve(false);
        document.body.appendChild(s);
    });
}

export default function PublicInvoicePay() {
    const { id } = useParams();
    const [inv, setInv] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');

    const load = () => api.get(`/pay/${id}`).then(r => setInv(r.data)).catch(() => setError('Invoice not found')).finally(() => setLoading(false));
    useEffect(() => { load(); }, [id]); // eslint-disable-line

    const pay = async () => {
        setError(''); setPaying(true);
        try {
            const ok = await loadRazorpay();
            if (!ok) throw new Error('Could not load payment gateway.');
            const { data: order } = await api.post(`/pay/${id}/order`);
            const rzp = new window.Razorpay({
                key: order.key, amount: order.amount, currency: 'INR',
                name: inv.academy || 'Vama Academy', description: `Invoice ${inv.invoice_number}`,
                order_id: order.order_id, image: inv.logo_url || undefined,
                handler: async (resp) => {
                    try {
                        await api.post(`/pay/${id}/verify`, {
                            razorpay_order_id: resp.razorpay_order_id,
                            razorpay_payment_id: resp.razorpay_payment_id,
                            razorpay_signature: resp.razorpay_signature,
                        });
                        setDone(true); load();
                    } catch { setError('Payment captured but verification failed. Contact the academy.'); }
                },
                prefill: { name: inv.student_name },
                theme: { color: '#463a7a' },
                modal: { ondismiss: () => setPaying(false) },
            });
            rzp.on('payment.failed', () => { setError('Payment failed. Please try again.'); setPaying(false); });
            rzp.open();
        } catch (e) { setError(e.response?.data?.detail || e.message || 'Payment could not be started.'); setPaying(false); }
    };

    if (loading) return <div className="min-h-screen bg-[#f4f3f8] flex items-center justify-center"><Loader2 className="animate-spin text-[#463a7a]" size={36} /></div>;
    if (error && !inv) return <div className="min-h-screen bg-[#f4f3f8] flex items-center justify-center"><div className="bg-white rounded-3xl p-10 text-center"><AlertCircle className="mx-auto text-rose-400 mb-3" /><p className="font-black text-slate-600">{error}</p></div></div>;

    const paid = done || inv.balance <= 0;

    return (
        <div className="min-h-screen bg-[#f4f3f8] flex items-center justify-center p-4">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden">
                <div className="bg-[#463a7a] text-white p-7 text-center">
                    {inv.logo_url ? <img src={inv.logo_url} alt="logo" className="h-12 mx-auto mb-3" />
                        : <div className="text-2xl font-black tracking-[3px] mb-1">VAMA</div>}
                    <p className="text-indigo-200/80 text-xs font-bold">{inv.academy}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200/60 mt-3">Invoice {inv.invoice_number}</p>
                </div>
                <div className="p-7 space-y-5">
                    {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-2xl text-sm font-bold flex items-center gap-2"><AlertCircle size={15} />{error}</div>}
                    <div className="space-y-2">
                        {inv.items.map(it => (
                            <div key={it.id} className="flex justify-between text-sm">
                                <span className="font-bold text-slate-600 truncate pr-3">{it.label}</span>
                                <span className="font-black text-slate-800">{money(it.amount)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-slate-100 pt-4 space-y-1.5 text-sm font-bold text-slate-500">
                        <div className="flex justify-between"><span>Total</span><span className="text-slate-800">{money(inv.total)}</span></div>
                        <div className="flex justify-between"><span>Paid</span><span className="text-emerald-600">{money(inv.paid)}</span></div>
                        <div className="flex justify-between text-lg font-black text-slate-900 pt-1"><span>Amount due</span><span>{money(inv.balance)}</span></div>
                    </div>

                    {paid ? (
                        <div className="bg-emerald-50 text-emerald-700 rounded-2xl p-4 text-center font-black flex items-center justify-center gap-2"><CheckCircle2 size={20} /> Payment received — thank you!</div>
                    ) : (
                        <>
                            <button onClick={pay} disabled={paying} className="w-full bg-[#463a7a] hover:bg-[#3a2f66] text-white rounded-2xl py-4 font-black text-base transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                {paying ? <Loader2 className="animate-spin" size={20} /> : <>Pay {money(inv.balance)}</>}
                            </button>
                            <p className="text-center text-[11px] text-slate-400 font-bold flex items-center justify-center gap-1"><ShieldCheck size={12} /> Secured by Razorpay</p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
