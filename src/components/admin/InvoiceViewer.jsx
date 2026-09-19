import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { api, API_BASE } from '../../lib/api';
import {
    ArrowLeft, Loader2, Download, Send, Mail, AlertCircle, Trash2,
    CheckCircle2, Clock, RefreshCw, Banknote, X
} from 'lucide-react';
import { format } from 'date-fns';
import RecordPaymentDialog from './RecordPaymentDialog';

const money = (v) => `₹${(Number(v) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const StatusBadge = ({ status }) => {
    const map = {
        paid: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        pending: 'bg-blue-50 text-blue-700 border-blue-100',
        overdue: 'bg-red-50 text-red-600 border-red-100',
        partial: 'bg-amber-50 text-amber-700 border-amber-100',
        cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
    };
    const icons = { paid: <CheckCircle2 size={11} />, pending: <Clock size={11} />, overdue: <AlertCircle size={11} />, partial: <RefreshCw size={11} /> };
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${map[status] || map.pending}`}>
            {icons[status]}
            {status}
        </span>
    );
};

function EmailSendModal({ invoice, onClose, onSent }) {
    const isOverdue = invoice.status === 'overdue';
    const [kind, setKind] = useState(isOverdue ? 'reminder' : 'invoice');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSend = async () => {
        setSending(true);
        setError('');
        try {
            await api.post(`/admin/invoices/${invoice.id}/send`, { kind });
            setSent(true);
            setTimeout(() => {
                onClose();
                onSent?.();
            }, 1500);
        } catch (err) {
            setError(err?.response?.data?.detail || 'Failed to send. Check SMTP settings.');
        } finally {
            setSending(false);
        }
    };

    const isReminder = kind === 'reminder';
    const headerCls = isReminder ? 'bg-gradient-to-br from-red-700 to-red-500' : 'bg-gradient-to-br from-[#463a7a] to-[#2d2550]';
    const btnCls = isReminder ? 'bg-red-600 hover:bg-red-700' : 'bg-[#463a7a] hover:bg-[#2d2550]';
    const balance = (invoice.total_amount || 0) - (invoice.paid_amount || 0);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
            <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
                <div className={`${headerCls} p-5 flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                            {isReminder ? <AlertCircle size={17} className="text-white" /> : <Mail size={17} className="text-white" />}
                        </div>
                        <div>
                            <h3 className="text-base font-black text-white">{isReminder ? 'Send Reminder' : 'Send Invoice'}</h3>
                            <p className="text-white/60 text-xs">{invoice.invoice_number}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl text-white/60 hover:text-white transition-all"><X size={18} /></button>
                </div>

                {sent ? (
                    <div className="p-10 text-center">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 size={28} className="text-emerald-500" />
                        </div>
                        <h4 className="text-lg font-black text-slate-900 mb-1">{isReminder ? 'Reminder Sent!' : 'Invoice Sent!'}</h4>
                        <p className="text-sm text-slate-500 mb-6">Sent to <span className="font-bold text-slate-700">{invoice.student_email}</span></p>
                    </div>
                ) : (
                    <div className="p-8 space-y-6">
                        {error && <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3"><AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" /><p className="text-sm text-red-700">{error}</p></div>}

                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Send as</p>
                            <div className="flex gap-3">
                                {['invoice', 'reminder'].map(opt => (
                                    <button key={opt} onClick={() => setKind(opt)} type="button"
                                        className={`flex-1 py-3 px-4 rounded-2xl font-bold text-sm transition-all ${kind === opt ? `${btnCls} text-white` : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                                        {opt === 'reminder' ? '🔔 Reminder' : '📧 Invoice'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {isReminder && balance > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                                <p className="text-sm text-amber-800"><span className="font-bold">Balance Due: {money(balance)}</span></p>
                            </div>
                        )}

                        <button onClick={handleSend} disabled={sending} type="button"
                            className={`w-full py-3 rounded-2xl font-bold text-white text-sm transition-all ${sending ? 'opacity-50 cursor-not-allowed' : `${btnCls}`}`}>
                            {sending ? <><Loader2 size={14} className="inline animate-spin mr-2" />Sending...</> : `Send ${isReminder ? 'Reminder' : 'Invoice'}`}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function InvoiceViewer() {
    const { invoiceId } = useParams();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [showSendModal, setShowSendModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchInvoice();
    }, [invoiceId]);

    const fetchInvoice = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get(`/admin/invoices/${invoiceId}`);
            setInvoice(res.data);
        } catch (err) {
            setError(err?.response?.data?.detail || 'Failed to load invoice');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Delete this invoice? This cannot be undone.')) return;
        setDeleting(true);
        try {
            await api.delete(`/admin/invoices/${invoiceId}`);
            navigate('/admin/invoices');
        } catch (err) {
            alert(err?.response?.data?.detail || 'Failed to delete invoice');
            setDeleting(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <Loader2 className="h-10 w-10 animate-spin text-[#463a7a] mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Loading invoice...</p>
            </div>
        </div>
    );

    if (error || !invoice) return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
                <AlertCircle size={32} className="text-slate-400" />
            </div>
            <p className="text-slate-500 text-lg font-medium">{error || 'Invoice not found'}</p>
            <button onClick={() => navigate('/admin/invoices')}
                className="flex items-center gap-2 px-4 py-2 bg-[#463a7a] text-white rounded-lg font-medium hover:bg-[#342a5b] transition-colors">
                <ArrowLeft size={16} /> Back to Invoices
            </button>
        </div>
    );

    const balance = (invoice.total_amount || 0) - (invoice.paid_amount || 0);
    const formattedIssueDate = invoice.issue_date ? format(new Date(invoice.issue_date), 'MMM d, yyyy') : '—';
    const formattedDueDate = invoice.due_date ? format(new Date(invoice.due_date), 'MMM d, yyyy') : '—';

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 hover:text-[#463a7a] font-medium transition-colors mb-4">
                    <ArrowLeft size={18} /> Back
                </button>
            </div>

            <div className="max-w-3xl mx-auto px-5 py-8">
                {/* Invoice Header */}
                <div className="bg-gradient-to-br from-[#463a7a] to-[#2d2550] rounded-2xl p-8 text-white mb-8 shadow-lg">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-black">{invoice.invoice_number}</h1>
                                <StatusBadge status={invoice.status} />
                            </div>
                            <p className="text-white/75 text-sm">{invoice.student_name} · {invoice.student_email}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                            <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Issue Date</p>
                            <p className="font-semibold">{formattedIssueDate}</p>
                        </div>
                        <div>
                            <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Due Date</p>
                            <p className="font-semibold">{formattedDueDate}</p>
                        </div>
                        <div>
                            <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Status</p>
                            <p className="font-semibold capitalize">{invoice.status}</p>
                        </div>
                    </div>
                </div>

                {/* Invoice Items */}
                {invoice.items && invoice.items.length > 0 && (
                    <div className="bg-white rounded-2xl p-8 mb-8 shadow-sm border border-slate-200">
                        <h2 className="text-lg font-bold text-slate-900 mb-6">Items</h2>
                        <div className="space-y-4">
                            {invoice.items.map((item, idx) => (
                                <div key={idx} className="border border-slate-100 rounded-xl p-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold text-slate-900">{item.label || item.description}</h3>
                                        <span className="text-lg font-black text-slate-900">{money(item.quantity * item.unit_price)}</span>
                                    </div>
                                    {item.description && <p className="text-sm text-slate-500 mb-2">{item.description}</p>}
                                    <p className="text-xs text-slate-400">{item.quantity} × {money(item.unit_price)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Payment Summary */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                        <p className="text-slate-500 text-xs uppercase tracking-wider font-bold mb-2">Total</p>
                        <p className="text-2xl font-black text-slate-900">{money(invoice.total_amount)}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 shadow-sm">
                        <p className="text-emerald-700 text-xs uppercase tracking-wider font-bold mb-2">Paid</p>
                        <p className="text-2xl font-black text-emerald-700">{money(invoice.paid_amount)}</p>
                    </div>
                    <div className={`rounded-2xl p-6 border shadow-sm ${balance > 0 ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-200'}`}>
                        <p className={`text-xs uppercase tracking-wider font-bold mb-2 ${balance > 0 ? 'text-amber-700' : 'text-slate-600'}`}>Balance</p>
                        <p className={`text-2xl font-black ${balance > 0 ? 'text-amber-700' : 'text-slate-900'}`}>{money(balance)}</p>
                    </div>
                </div>

                {/* Record Payment */}
                {balance > 0 && (
                    <div className="bg-white rounded-2xl p-8 mb-8 border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-[#463a7a]/10 rounded-lg flex items-center justify-center">
                                <Banknote size={20} className="text-[#463a7a]" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-900">Record a payment</h2>
                        </div>
                        <button onClick={() => setShowPaymentDialog(true)}
                            className="w-full py-3 bg-[#463a7a] text-white rounded-2xl font-bold hover:bg-[#342a5b] transition-colors">
                            Record Payment
                        </button>
                    </div>
                )}

                {/* Actions */}
                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-3">
                    <button onClick={() => window.open(`${API_BASE}/admin/invoices/${invoiceId}/html`, '_blank')}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-colors">
                        <Download size={16} /> Download PDF
                    </button>
                    <button onClick={() => setShowSendModal(true)}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-[#463a7a] text-white rounded-2xl font-bold hover:bg-[#342a5b] transition-colors">
                        <Send size={16} /> Send Invoice
                    </button>
                    <button onClick={handleDelete} disabled={deleting}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-colors disabled:opacity-50">
                        <Trash2 size={16} /> Delete Invoice
                    </button>
                </div>
            </div>

            {showPaymentDialog && (
                <RecordPaymentDialog
                    invoice={invoice}
                    onClose={() => setShowPaymentDialog(false)}
                    onSuccess={() => {
                        setShowPaymentDialog(false);
                        fetchInvoice();
                    }}
                />
            )}

            {showSendModal && (
                <EmailSendModal
                    invoice={invoice}
                    onClose={() => setShowSendModal(false)}
                    onSent={fetchInvoice}
                />
            )}
        </div>
    );
}
