import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { api } from '../../lib/api';
import {
    FileText, Plus, Search, X, Loader2, Download,
    CheckCircle2, Clock, AlertCircle, ChevronLeft, ChevronRight,
    Eye, Send, Mail, MessageSquare, Users,
    ChevronDown, ChevronUp, RefreshCw, Info
} from 'lucide-react';
import { format } from 'date-fns';

const STATUSES = ['all', 'paid', 'pending', 'overdue', 'partial', 'cancelled'];
const DATE_FILTERS = [
    { key: 'all', label: 'All Time' },
    { key: 'today', label: 'Today' },
    { key: 'thisWeek', label: 'This Week' },
    { key: 'thisMonth', label: 'This Month' },
    { key: 'lastMonth', label: 'Last Month' },
    { key: 'thisYear', label: 'This Year' },
];

function generateInvoiceNumber(existingInvoices = []) {
    const now = new Date();
    const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const seq = String(existingInvoices.length + 1).padStart(4, '0');
    return `INV-${yyyymm}-${seq}`;
}

function downloadInvoicePDF(invoice) {
    const fmt = (d) => { try { return d ? format(new Date(d), 'MMMM d, yyyy') : '-'; } catch { return '-'; } };
    const money = (n) => (n || 0).toLocaleString('en-IN');
    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${invoice.invoice_number}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,sans-serif;color:#1e293b;background:#fff}
.page{max-width:800px;margin:0 auto;padding:56px 48px}
.hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:36px}
.logo{display:flex;align-items:center;gap:14px}
.logo-box{width:54px;height:54px;background:linear-gradient(135deg,#463a7a,#2d2550);border-radius:14px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:24px;font-weight:900;flex-shrink:0}
.logo-txt h1{font-size:21px;font-weight:800;color:#463a7a}
.logo-txt p{font-size:10px;color:#94a3b8;margin-top:2px;text-transform:uppercase;letter-spacing:.1em}
.inv-badge{text-align:right}
.inv-badge h2{font-size:34px;font-weight:900;color:#463a7a;letter-spacing:-1.5px}
.inv-badge .num{font-size:12px;color:#94a3b8;font-weight:600;margin-top:4px}
.chip{display:inline-block;padding:3px 12px;border-radius:999px;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;margin-top:10px}
.chip-paid{background:#dcfce7;color:#16a34a;border:1.5px solid #86efac}
.chip-pending{background:#dbeafe;color:#2563eb;border:1.5px solid #93c5fd}
.chip-overdue{background:#fee2e2;color:#dc2626;border:1.5px solid #fca5a5}
.chip-partial{background:#fef3c7;color:#d97706;border:1.5px solid #fcd34d}
.chip-cancelled{background:#f1f5f9;color:#64748b;border:1.5px solid #e2e8f0}
.hr{height:1px;background:#f1f5f9;margin:30px 0}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-bottom:28px}
.blk label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#94a3b8;display:block;margin-bottom:6px}
.blk .name{font-size:17px;font-weight:800;color:#1e293b;margin-bottom:4px}
.blk p{font-size:12px;color:#64748b;margin-top:3px}
.three-col{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:36px}
.dc{background:#f8fafc;border-radius:10px;padding:14px}
.dc label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#94a3b8;display:block;margin-bottom:5px}
.dc p{font-size:13px;font-weight:700;color:#1e293b}
table{width:100%;border-collapse:collapse;margin-bottom:20px}
thead{background:#463a7a}
thead th{padding:11px 16px;text-align:left;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:#fff}
thead th:last-child{text-align:right}
tbody tr{border-bottom:1px solid #f1f5f9}
tbody td{padding:13px 16px;font-size:12px;color:#475569}
tbody td:last-child{text-align:right;font-weight:700;color:#1e293b}
.totals{max-width:280px;margin-left:auto}
.tr{display:flex;justify-content:space-between;padding:6px 0;font-size:12px;color:#64748b}
.tr.disc{color:#16a34a}
.tr.final{border-top:2px solid #463a7a;margin-top:8px;padding-top:14px;font-size:21px;font-weight:900;color:#463a7a}
.notes-box{background:#f8fafc;border-radius:10px;padding:16px;margin-top:28px}
.notes-box label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#94a3b8;display:block;margin-bottom:6px}
.notes-box p{font-size:12px;color:#475569;line-height:1.6}
.footer{margin-top:52px;text-align:center;border-top:1px solid #f1f5f9;padding-top:20px;color:#94a3b8;font-size:10px;line-height:1.9}
.footer strong{color:#463a7a}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style>
</head><body><div class="page">
<div class="hdr">
  <div class="logo">
    <div class="logo-box">V</div>
    <div class="logo-txt"><h1>Vama Academy</h1><p>School of Music &amp; Arts</p></div>
  </div>
  <div class="inv-badge">
    <h2>INVOICE</h2>
    <p class="num">${invoice.invoice_number}</p>
    <span class="chip chip-${invoice.status || 'pending'}">${invoice.status || 'pending'}</span>
  </div>
</div>
<div class="hr"></div>
<div class="two-col">
  <div class="blk">
    <label>Bill To</label>
    <p class="name">${invoice.student_name || 'Student'}</p>
    ${invoice.grade ? `<p>${invoice.grade}${invoice.course ? ' · ' + invoice.course : ''}</p>` : ''}
  </div>
  <div class="blk">
    <label>From</label>
    <p class="name">Vama Academy</p>
    <p>School of Music &amp; Arts</p>
    <p>techatvama@gmail.com</p>
  </div>
</div>
<div class="three-col">
  <div class="dc"><label>Issue Date</label><p>${fmt(invoice.issue_date)}</p></div>
  <div class="dc"><label>Due Date</label><p>${fmt(invoice.due_date)}</p></div>
  <div class="dc"><label>Payment Mode</label><p>${invoice.payment_mode || invoice.payment_type || '-'}</p></div>
</div>
<table>
  <thead><tr><th>Description</th><th>Sessions</th><th>Amount (₹)</th></tr></thead>
  <tbody>
    <tr>
      <td>${invoice.description || invoice.package_name || invoice.payment_type || 'Music Lessons'}</td>
      <td>${invoice.sessions_count || '-'}</td>
      <td>${money(invoice.amount)}</td>
    </tr>
  </tbody>
</table>
<div class="totals">
  <div class="tr"><span>Subtotal</span><span>₹${money(invoice.amount)}</span></div>
  ${(invoice.tax_amount || 0) > 0 ? `<div class="tr"><span>Tax / GST</span><span>+₹${money(invoice.tax_amount)}</span></div>` : ''}
  ${(invoice.discount_amount || 0) > 0 ? `<div class="tr disc"><span>Discount</span><span>-₹${money(invoice.discount_amount)}</span></div>` : ''}
  <div class="tr final"><span>Total Due</span><span>₹${money(invoice.total_amount)}</span></div>
  ${invoice.status === 'paid' && invoice.paid_date ? `<div class="tr" style="color:#16a34a"><span>Paid On</span><span>${fmt(invoice.paid_date)}</span></div>` : ''}
</div>
${invoice.notes ? `<div class="notes-box"><label>Notes</label><p>${invoice.notes}</p></div>` : ''}
<div class="footer">
  <p>Thank you for learning with <strong>Vama Academy</strong> — School of Music &amp; Arts</p>
  <p>For queries: techatvama@gmail.com</p>
  <p style="margin-top:4px;font-size:9px">Computer-generated invoice · No signature required</p>
</div>
</div></body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) { alert('Allow popups to download PDF'); URL.revokeObjectURL(url); return; }
    win.addEventListener('load', () => { win.print(); URL.revokeObjectURL(url); });
}

function StatusBadge({ status }) {
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
}

function EmailSendModal({ invoice, students, onClose }) {
    const student = students.find(s => s.id === invoice.student_id);
    const [to, setTo] = useState(student?.email || '');
    const [subject, setSubject] = useState(`Invoice ${invoice.invoice_number} – Vama Academy`);
    const [body, setBody] = useState(
        `Dear ${invoice.student_name || 'Student'},\n\nPlease find your invoice details below:\n\nInvoice No: ${invoice.invoice_number}\nAmount Due: ₹${(invoice.total_amount || 0).toLocaleString('en-IN')}\nDue Date: ${invoice.due_date ? format(new Date(invoice.due_date), 'MMMM d, yyyy') : '-'}\n\nFor questions, reply to this email.\n\nWarm regards,\nVama Academy Team`
    );
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSend = async (e) => {
        e.preventDefault();
        setSending(true);
        setError('');
        try {
            await api.post(`/admin/invoices/${invoice.id}/send-email`, { to_email: to, subject, body });
            setSent(true);
        } catch (err) {
            setError(err?.response?.data?.detail || 'Failed to send. Check SMTP configuration in backend (.env: SMTP_USER, SMTP_PASS).');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                            <Mail size={18} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Send Invoice</h3>
                            <p className="text-blue-200 text-xs">{invoice.invoice_number}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-2xl text-white/60 hover:text-white transition-all"><X size={20} /></button>
                </div>
                {sent ? (
                    <div className="p-10 text-center">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 size={28} className="text-emerald-500" />
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 mb-2">Email Sent!</h4>
                        <p className="text-sm text-slate-500 mb-6">Invoice sent to {to}</p>
                        <button onClick={onClose} className="px-8 py-3 bg-emerald-500 text-white rounded-2xl font-bold text-sm hover:bg-emerald-600 transition-all">Done</button>
                    </div>
                ) : (
                    <form onSubmit={handleSend} className="p-6 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">To</label>
                            <input type="email" required value={to} onChange={e => setTo(e.target.value)} placeholder="student@email.com"
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Subject</label>
                            <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Message</label>
                            <textarea rows={7} value={body} onChange={e => setBody(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
                        </div>
                        {error && <p className="text-xs text-red-600 bg-red-50 rounded-2xl p-3 border border-red-100">{error}</p>}
                        <div className="flex gap-3 pt-1">
                            <button type="button" onClick={onClose} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all">Cancel</button>
                            <button type="submit" disabled={sending} className="flex-1 py-3.5 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                Send Email
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

function InvoiceDetailModal({ invoice, onClose, onMarkPaid, onSendEmail }) {
    if (!invoice) return null;
    const paidPct = Math.min(100, Math.round(((invoice.paid_amount || 0) / (invoice.total_amount || 1)) * 100));
    const safeDate = (d) => { try { return d ? format(new Date(d), 'MMM d, yyyy') : '—'; } catch { return '—'; } };

    const handleWhatsApp = () => {
        const msg = encodeURIComponent(`Hi! Invoice ${invoice.invoice_number} for ₹${(invoice.total_amount || 0).toLocaleString('en-IN')} from Vama Academy. Due: ${safeDate(invoice.due_date)}. Thank you!`);
        window.open(`https://wa.me/?text=${msg}`, '_blank');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-br from-[#463a7a] to-[#2d2550] p-8 text-white flex-shrink-0">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">{invoice.invoice_number}</p>
                            <h3 className="text-2xl font-bold tracking-tight">{invoice.student_name}</h3>
                            <p className="text-white/60 text-sm mt-1">{[invoice.payment_type, invoice.grade, invoice.course].filter(Boolean).join(' · ')}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <StatusBadge status={invoice.status} />
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-2xl transition-all"><X size={20} /></button>
                        </div>
                    </div>
                    <div className="mt-5">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold text-white/60">Payment Progress</span>
                            <span className="text-xs font-bold text-white">{paidPct}%</span>
                        </div>
                        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                            <div className="h-full bg-white rounded-full transition-all" style={{ width: `${paidPct}%` }} />
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-8 overflow-y-auto space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 rounded-2xl p-4">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Base Amount</p>
                            <p className="text-xl font-bold text-slate-900">₹{(invoice.amount || 0).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-4">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tax (GST)</p>
                            <p className="text-xl font-bold text-amber-600">+₹{(invoice.tax_amount || 0).toLocaleString('en-IN')}</p>
                        </div>
                        {(invoice.discount_amount || 0) > 0 && (
                            <div className="bg-emerald-50 rounded-2xl p-4">
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Discount</p>
                                <p className="text-xl font-bold text-emerald-600">-₹{(invoice.discount_amount).toLocaleString('en-IN')}</p>
                            </div>
                        )}
                        <div className="bg-gradient-to-br from-[#463a7a]/5 to-[#463a7a]/10 rounded-2xl p-4 border border-[#463a7a]/10">
                            <p className="text-[10px] font-bold text-[#463a7a] uppercase tracking-widest mb-1">Total Due</p>
                            <p className="text-xl font-bold text-[#463a7a]">₹{(invoice.total_amount || 0).toLocaleString('en-IN')}</p>
                        </div>
                    </div>

                    {(invoice.sessions_count || 0) > 0 && (
                        <div className="bg-slate-50 rounded-2xl p-5">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Session Summary</p>
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { v: invoice.sessions_count, l: 'Package Sessions', c: 'text-slate-900' },
                                    { v: invoice.attendance_sessions || 0, l: 'Attended', c: 'text-[#463a7a]' },
                                    { v: (invoice.sessions_count || 0) - (invoice.attendance_sessions || 0), l: 'Remaining', c: 'text-emerald-600' },
                                ].map((d, i) => (
                                    <div key={i} className="text-center">
                                        <p className={`text-2xl font-bold ${d.c}`}>{d.v}</p>
                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">{d.l}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-3 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-[#463a7a] to-violet-500 rounded-full"
                                    style={{ width: `${Math.round(((invoice.attendance_sessions || 0) / (invoice.sessions_count || 1)) * 100)}%` }} />
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: 'Issue Date', val: safeDate(invoice.issue_date), color: 'text-slate-900' },
                            { label: 'Due Date', val: safeDate(invoice.due_date), color: invoice.status === 'overdue' ? 'text-red-600' : 'text-slate-900' },
                            { label: 'Paid Date', val: safeDate(invoice.paid_date), color: 'text-emerald-600' },
                        ].map((d, i) => (
                            <div key={i}>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{d.label}</p>
                                <p className={`text-sm font-bold ${d.color}`}>{d.val}</p>
                            </div>
                        ))}
                    </div>

                    {invoice.notes && (
                        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Notes</p>
                            <p className="text-sm font-medium text-slate-700">{invoice.notes}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 pt-0 flex-shrink-0">
                    <div className="flex gap-3 flex-wrap">
                        {invoice.status !== 'paid' && (
                            <button onClick={() => { onMarkPaid(invoice.id); onClose(); }}
                                className="flex-1 py-3.5 bg-emerald-500 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-2">
                                <CheckCircle2 size={16} /> Mark Paid
                            </button>
                        )}
                        <button onClick={() => downloadInvoicePDF(invoice)}
                            className="flex-1 py-3.5 bg-[#463a7a] text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-[#2d2550] transition-all flex items-center justify-center gap-2">
                            <Download size={16} /> Download PDF
                        </button>
                        <button onClick={() => onSendEmail(invoice)}
                            className="flex-1 py-3.5 bg-blue-50 text-blue-700 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center justify-center gap-2">
                            <Mail size={16} /> Email
                        </button>
                        <button onClick={handleWhatsApp}
                            className="flex-1 py-3.5 bg-emerald-50 text-emerald-700 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center justify-center gap-2">
                            <MessageSquare size={16} /> WhatsApp
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const PAYMENT_MODES = ['Cash', 'UPI', 'Card'];

const EMPTY_FORM = {
    student_id: '',
    package_id: '',
    payment_mode: 'Cash',
    invoice_number: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    amount: '',
    tax_percentage: 18,
    discount_amount: 0,
    sessions_count: 0,
    validity_days: null,
    description: '',
    notes: '',
};

export default function InvoiceManager() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [invoices, setInvoices] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
    const [dateFilter, setDateFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [students, setStudents] = useState([]);
    const [packages, setPackages] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [formError, setFormError] = useState('');
    const [sortBy, setSortBy] = useState('issue_date');
    const [sortDir, setSortDir] = useState('desc');
    const [emailTarget, setEmailTarget] = useState(null);

    useEffect(() => { loadData(); }, []);
    useEffect(() => { applyFilters(); }, [invoices, search, statusFilter, dateFilter, sortBy, sortDir]);

    const loadData = async () => {
        setLoading(true);
        const [invRes, stuRes, pkgRes] = await Promise.allSettled([
            api.get('/admin/invoices'),
            api.get('/students'),
            api.get('/admin/packages'),
        ]);
        if (invRes.status === 'fulfilled') setInvoices(Array.isArray(invRes.value.data) ? invRes.value.data : []);
        else { console.error('Failed to load invoices:', invRes.reason); setInvoices([]); }
        if (stuRes.status === 'fulfilled') setStudents(Array.isArray(stuRes.value.data) ? stuRes.value.data : []);
        else { console.error('Failed to load students:', stuRes.reason); setStudents([]); }
        if (pkgRes.status === 'fulfilled') setPackages(Array.isArray(pkgRes.value.data) ? pkgRes.value.data : []);
        else { console.error('Failed to load packages:', pkgRes.reason); setPackages([]); }
        setLoading(false);
    };

    const applyFilters = () => {
        const now = new Date();
        let list = [...invoices];
        if (search) list = list.filter(inv =>
            inv.student_name?.toLowerCase().includes(search.toLowerCase()) ||
            inv.invoice_number?.includes(search) ||
            inv.payment_type?.toLowerCase().includes(search.toLowerCase())
        );
        if (statusFilter !== 'all') list = list.filter(inv => inv.status === statusFilter);
        if (dateFilter !== 'all') {
            list = list.filter(inv => {
                const d = new Date(inv.issue_date);
                switch (dateFilter) {
                    case 'today': return d.toDateString() === now.toDateString();
                    case 'thisWeek': { const ws = new Date(now); ws.setDate(now.getDate() - now.getDay()); return d >= ws; }
                    case 'thisMonth': return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                    case 'lastMonth': { const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1); return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear(); }
                    case 'thisYear': return d.getFullYear() === now.getFullYear();
                    default: return true;
                }
            });
        }
        list.sort((a, b) => {
            let va = sortBy === 'amount' ? a.total_amount : sortBy === 'issue_date' ? new Date(a.issue_date) : sortBy === 'due_date' ? new Date(a.due_date) : a.student_name;
            let vb = sortBy === 'amount' ? b.total_amount : sortBy === 'issue_date' ? new Date(b.issue_date) : sortBy === 'due_date' ? new Date(b.due_date) : b.student_name;
            return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
        });
        setFiltered(list);
        setPage(1);
    };

    const toggleSort = (col) => {
        if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortBy(col); setSortDir('desc'); }
    };

    const SortIcon = ({ col }) => sortBy === col ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : null;

    const handleMarkPaid = async (id) => {
        try { await api.patch(`/admin/invoices/${id}`, { status: 'paid', paid_date: new Date().toISOString() }); }
        catch { }
        setInvoices(prev => prev.map(inv => inv.id === id
            ? { ...inv, status: 'paid', paid_date: new Date().toISOString(), paid_amount: inv.total_amount }
            : inv));
    };

    const handleBulkMarkPaid = () => {
        setInvoices(prev => prev.map(inv =>
            selectedIds.has(inv.id) && inv.status !== 'paid'
                ? { ...inv, status: 'paid', paid_date: new Date().toISOString(), paid_amount: inv.total_amount }
                : inv));
        setSelectedIds(new Set());
    };

    const handlePackageChange = (pkgId) => {
        if (!pkgId) {
            setFormData(f => ({ ...f, package_id: '', amount: '', tax_percentage: 18, sessions_count: 0, validity_days: null, description: '' }));
            return;
        }
        const pkg = packages.find(p => p.id === parseInt(pkgId));
        if (pkg) {
            setFormData(f => ({
                ...f,
                package_id: pkgId,
                amount: pkg.price || '',
                tax_percentage: pkg.tax_percentage ?? 18,
                sessions_count: pkg.total_sessions || 0,
                validity_days: pkg.validity_days || null,
                description: pkg.description || f.description,
            }));
        } else {
            setFormData(f => ({ ...f, package_id: pkgId }));
        }
    };

    const openCreateForm = () => {
        setFormData({ ...EMPTY_FORM, invoice_number: generateInvoiceNumber(invoices) });
        setFormError('');
        setShowCreateForm(true);
    };

    const handleCreateInvoice = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError('');
        const amount = parseFloat(formData.amount) || 0;
        const taxAmount = amount * (parseFloat(formData.tax_percentage) || 0) / 100;
        const discount = parseFloat(formData.discount_amount) || 0;
        const total = amount + taxAmount - discount;
        const selectedPkg = packages.find(p => p.id === parseInt(formData.package_id));
        const payload = {
            ...formData,
            student_id: parseInt(formData.student_id),
            package_id: formData.package_id ? parseInt(formData.package_id) : null,
            payment_type: selectedPkg ? selectedPkg.name : null,
            payment_mode: formData.payment_mode,
            amount,
            tax_amount: taxAmount,
            discount_amount: discount,
            total_amount: total,
            issue_date: formData.issue_date || new Date().toISOString().split('T')[0],
            status: 'pending',
        };
        try {
            await api.post('/admin/invoices', payload);
            await loadData();
            setShowCreateForm(false);
            setFormData(EMPTY_FORM);
        } catch (err) {
            setFormError(err?.response?.data?.detail || 'Failed to create invoice. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
    };
    const toggleSelectAll = () => {
        if (selectedIds.size === currentPage2.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(currentPage2.map(i => i.id)));
    };

    const totalPages = Math.ceil(filtered.length / perPage);
    const start = (page - 1) * perPage;
    const currentPage2 = filtered.slice(start, start + perPage);

    const stats = {
        total: filtered.reduce((s, i) => s + (i.total_amount || 0), 0),
        collected: filtered.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total_amount || 0), 0),
        overdue: filtered.filter(i => i.status === 'overdue').reduce((s, i) => s + (i.total_amount || 0), 0),
        partial: filtered.filter(i => i.status === 'partial').reduce((s, i) => s + ((i.total_amount || 0) - (i.paid_amount || 0)), 0),
    };

    // Computed totals for create form preview
    const previewAmount = parseFloat(formData.amount) || 0;
    const previewTax = previewAmount * (parseFloat(formData.tax_percentage) || 0) / 100;
    const previewDiscount = parseFloat(formData.discount_amount) || 0;
    const previewTotal = previewAmount + previewTax - previewDiscount;

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
            <div className="w-10 h-10 border-4 border-[#463a7a]/20 border-t-[#463a7a] rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            {/* Header */}
            <div className="relative bg-gradient-to-br from-[#463a7a] to-[#2d2550] px-6 pt-8 pb-8 lg:px-12 overflow-hidden">
                <div className="absolute -top-16 -right-16 w-80 h-80 bg-white/5 rounded-full pointer-events-none" />
                <div className="relative z-10 max-w-[1600px] mx-auto">
                    <button onClick={() => navigate('/admin/payments')} className="mb-4 text-white/50 hover:text-white text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors">
                        ← Payment Hub
                    </button>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-4xl lg:text-5xl font-bold text-white tracking-tighter leading-none mb-2">Invoices</h1>
                            <p className="text-white/50 text-sm">Track, create, and manage all student invoices</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all border border-white/10">
                                <Users size={15} /> Bulk Generate
                            </button>
                            <button onClick={openCreateForm} className="px-5 py-3 bg-white text-[#463a7a] rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center gap-2">
                                <Plus size={15} /> New Invoice
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-4 lg:px-12 py-8 space-y-6 pb-24">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Invoiced', val: stats.total, color: 'text-slate-900', accent: 'bg-blue-50', count: filtered.length },
                        { label: 'Collected', val: stats.collected, color: 'text-emerald-600', accent: 'bg-emerald-50', count: filtered.filter(i => i.status === 'paid').length },
                        { label: 'Overdue', val: stats.overdue, color: 'text-red-600', accent: 'bg-red-50', count: filtered.filter(i => i.status === 'overdue').length },
                        { label: 'Partial Due', val: stats.partial, color: 'text-amber-600', accent: 'bg-amber-50', count: filtered.filter(i => i.status === 'partial').length },
                    ].map((s, i) => (
                        <div key={i} className="bg-white rounded-[28px] p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-all group relative overflow-hidden">
                            <div className={`absolute top-0 right-0 w-16 h-16 ${s.accent} rounded-bl-[48px] -mr-3 -mt-3 opacity-60 group-hover:opacity-80 transition-opacity`} />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 relative z-10">{s.label}</p>
                            <p className={`text-xl font-bold ${s.color} tracking-tight relative z-10`}>₹{(s.val / 1000).toFixed(1)}k</p>
                            <p className="text-[10px] font-medium text-slate-400 mt-1 relative z-10">{s.count} invoices</p>
                        </div>
                    ))}
                </div>

                {/* Status Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                    {STATUSES.map(s => {
                        const count = s === 'all' ? filtered.length : invoices.filter(inv => inv.status === s).length;
                        return (
                            <button key={s} onClick={() => setStatusFilter(s)}
                                className={`flex-shrink-0 px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${statusFilter === s ? 'bg-[#463a7a] text-white shadow-md' : 'bg-white text-slate-500 border border-slate-100 hover:border-[#463a7a]/20 shadow-sm'}`}>
                                {s}
                                <span className={`px-1.5 py-0.5 rounded-lg text-[9px] font-bold ${statusFilter === s ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>{count}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Search & Filters */}
                <div className="bg-white rounded-[32px] p-5 shadow-xl border border-slate-100 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input type="text" placeholder="Search by student, invoice number, type..." value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-11 pr-4 text-slate-900 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10 text-sm" />
                    </div>
                    <div className="flex items-center gap-2">
                        <select value={dateFilter} onChange={e => setDateFilter(e.target.value)}
                            className="bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-slate-700 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10 appearance-none cursor-pointer">
                            {DATE_FILTERS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                        </select>
                        <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}
                            className="bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-slate-700 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10 appearance-none cursor-pointer">
                            {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n} / page</option>)}
                        </select>
                    </div>
                </div>

                {/* Bulk Action Bar */}
                {selectedIds.size > 0 && (
                    <div className="bg-[#463a7a] rounded-3xl p-4 flex items-center gap-4 shadow-xl">
                        <span className="text-white font-bold text-sm">{selectedIds.size} selected</span>
                        <div className="flex items-center gap-2 ml-auto">
                            <button onClick={handleBulkMarkPaid} className="px-4 py-2 bg-emerald-500 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center gap-1.5">
                                <CheckCircle2 size={14} /> Mark All Paid
                            </button>
                            <button className="px-4 py-2 bg-white/10 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-1.5">
                                <Send size={14} /> Send Reminders
                            </button>
                            <button onClick={() => setSelectedIds(new Set())} className="p-2 hover:bg-white/10 rounded-xl text-white/60 hover:text-white transition-all"><X size={16} /></button>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="bg-white rounded-[32px] shadow-xl border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50">
                                    <th className="px-5 py-4 text-left w-10">
                                        <input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.size === currentPage2.length && currentPage2.length > 0}
                                            className="w-4 h-4 rounded-lg accent-[#463a7a] cursor-pointer" />
                                    </th>
                                    {[
                                        { label: 'Invoice', key: null }, { label: 'Student', key: 'student_name' },
                                        { label: 'Package / Mode', key: null }, { label: 'Amount', key: 'amount' },
                                        { label: 'Status', key: null }, { label: 'Sessions', key: null },
                                        { label: 'Due Date', key: 'due_date' }, { label: 'Actions', key: null },
                                    ].map(col => (
                                        <th key={col.label} onClick={() => col.key && toggleSort(col.key)}
                                            className={`px-5 py-4 text-left ${col.key ? 'cursor-pointer hover:bg-slate-100 transition-colors' : ''}`}>
                                            <div className="flex items-center gap-1">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{col.label}</span>
                                                {col.key && <SortIcon col={col.key} />}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {currentPage2.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="py-20 text-center">
                                            <FileText size={32} className="mx-auto mb-3 text-slate-200" />
                                            <p className="text-sm font-semibold text-slate-400">No invoices found</p>
                                            <p className="text-xs text-slate-300 mt-1">Create your first invoice or adjust the filters</p>
                                        </td>
                                    </tr>
                                )}
                                {currentPage2.map((inv, idx) => {
                                    const isSelected = selectedIds.has(inv.id);
                                    const isOverdueDate = inv.status !== 'paid' && inv.status !== 'cancelled' && new Date(inv.due_date) < new Date();
                                    return (
                                        <tr key={inv.id}
                                            className={`border-b border-slate-50 transition-colors group cursor-pointer ${isSelected ? 'bg-violet-50/50' : idx % 2 === 0 ? 'bg-white hover:bg-slate-50/50' : 'bg-slate-50/20 hover:bg-slate-50/60'}`}
                                            onClick={() => setSelectedInvoice(inv)}>
                                            <td className="px-5 py-4" onClick={e => { e.stopPropagation(); toggleSelect(inv.id); }}>
                                                <input type="checkbox" checked={isSelected} onChange={() => { }} className="w-4 h-4 rounded-lg accent-[#463a7a] cursor-pointer" />
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="text-xs font-bold text-[#463a7a]">{inv.invoice_number}</p>
                                                <p className="text-[10px] font-medium text-slate-400">{inv.issue_date ? format(new Date(inv.issue_date), 'MMM d, yyyy') : '—'}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold flex-shrink-0">
                                                        {(inv.student_name || '?')[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900">{inv.student_name || 'Unknown'}</p>
                                                        <p className="text-[10px] font-medium text-slate-400">{[inv.grade, inv.course].filter(Boolean).join(' · ') || '—'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex flex-col gap-1">
                                                    {inv.payment_mode && (
                                                        <span className="text-xs font-semibold text-[#463a7a] bg-violet-50 px-2.5 py-1 rounded-xl w-fit">{inv.payment_mode}</span>
                                                    )}
                                                    {inv.payment_type && (
                                                        <span className="text-[10px] font-medium text-slate-400 truncate max-w-[110px]">{inv.payment_type}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="text-sm font-bold text-slate-900">₹{(inv.total_amount || 0).toLocaleString('en-IN')}</p>
                                                {(inv.paid_amount || 0) > 0 && inv.status !== 'paid' && (
                                                    <p className="text-[10px] font-semibold text-emerald-600">Paid: ₹{inv.paid_amount.toLocaleString('en-IN')}</p>
                                                )}
                                            </td>
                                            <td className="px-5 py-4"><StatusBadge status={inv.status} /></td>
                                            <td className="px-5 py-4">
                                                {(inv.sessions_count || 0) > 0 ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className="h-full bg-[#463a7a] rounded-full"
                                                                style={{ width: `${Math.round(((inv.attendance_sessions || 0) / inv.sessions_count) * 100)}%` }} />
                                                        </div>
                                                        <span className="text-[10px] font-bold text-slate-500">{inv.attendance_sessions || 0}/{inv.sessions_count}</span>
                                                    </div>
                                                ) : <span className="text-[10px] text-slate-300">—</span>}
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className={`text-xs font-bold ${isOverdueDate ? 'text-red-600' : 'text-slate-700'}`}>
                                                    {inv.due_date ? format(new Date(inv.due_date), 'MMM d, yyyy') : '—'}
                                                </p>
                                            </td>
                                            <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => setSelectedInvoice(inv)} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-[#463a7a] transition-all" title="View"><Eye size={14} /></button>
                                                    {inv.status !== 'paid' && (
                                                        <button onClick={() => handleMarkPaid(inv.id)} className="p-1.5 hover:bg-emerald-50 rounded-xl text-slate-400 hover:text-emerald-600 transition-all" title="Mark Paid"><CheckCircle2 size={14} /></button>
                                                    )}
                                                    <button onClick={() => setEmailTarget(inv)} className="p-1.5 hover:bg-blue-50 rounded-xl text-slate-400 hover:text-blue-500 transition-all" title="Send Email"><Mail size={14} /></button>
                                                    <button onClick={() => downloadInvoicePDF(inv)} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-all" title="Download PDF"><Download size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between flex-wrap gap-4">
                        <span className="text-sm font-medium text-slate-500">
                            Showing {Math.min(start + 1, filtered.length)}–{Math.min(start + perPage, filtered.length)} of {filtered.length}
                        </span>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all"><ChevronLeft size={16} /></button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const pn = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                                return (
                                    <button key={i} onClick={() => setPage(pn)} className={`min-w-[36px] h-9 rounded-xl text-xs font-bold transition-all ${page === pn ? 'bg-[#463a7a] text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{pn}</button>
                                );
                            })}
                            {totalPages > 5 && page < totalPages - 2 && <>
                                <span className="text-slate-400 font-bold">...</span>
                                <button onClick={() => setPage(totalPages)} className="min-w-[36px] h-9 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">{totalPages}</button>
                            </>}
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0} className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all"><ChevronRight size={16} /></button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedInvoice && (
                <InvoiceDetailModal
                    invoice={selectedInvoice}
                    onClose={() => setSelectedInvoice(null)}
                    onMarkPaid={handleMarkPaid}
                    onSendEmail={(inv) => { setSelectedInvoice(null); setEmailTarget(inv); }}
                />
            )}

            {/* Email Modal */}
            {emailTarget && (
                <EmailSendModal invoice={emailTarget} students={students} onClose={() => setEmailTarget(null)} />
            )}

            {/* Create Invoice Modal */}
            {showCreateForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-br from-[#463a7a] to-[#2d2550] p-6 text-white flex-shrink-0">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold tracking-tight">New Invoice</h3>
                                    <p className="text-white/50 text-xs mt-0.5">Fill in the details below to create an invoice</p>
                                </div>
                                <button onClick={() => setShowCreateForm(false)} className="p-2 hover:bg-white/10 rounded-2xl transition-all"><X size={22} /></button>
                            </div>
                        </div>

                        <form onSubmit={handleCreateInvoice} className="overflow-y-auto">
                            <div className="p-6 space-y-5">

                                {/* Section: Invoice Info */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Invoice #</label>
                                        <input type="text" value={formData.invoice_number} onChange={e => setFormData(f => ({ ...f, invoice_number: e.target.value }))}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Issue Date *</label>
                                        <input required type="date" value={formData.issue_date} onChange={e => setFormData(f => ({ ...f, issue_date: e.target.value }))}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Due Date *</label>
                                        <input required type="date" value={formData.due_date} onChange={e => setFormData(f => ({ ...f, due_date: e.target.value }))}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10" />
                                    </div>
                                </div>

                                {/* Student */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Student *</label>
                                    <select required value={formData.student_id} onChange={e => setFormData(f => ({ ...f, student_id: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10 appearance-none cursor-pointer">
                                        <option value="">Select student...</option>
                                        {students.map(s => (
                                            <option key={s.id} value={s.id}>{s.first_name} {s.last_name}{s.current_grade ? ` (${s.current_grade})` : ''}</option>
                                        ))}
                                    </select>
                                    {students.length === 0 && (
                                        <p className="text-xs text-amber-600 flex items-center gap-1"><Info size={12} /> No students loaded — check backend connection</p>
                                    )}
                                </div>

                                {/* Package — required, auto-fills everything */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Package *</label>
                                    <select required value={formData.package_id} onChange={e => handlePackageChange(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10 appearance-none cursor-pointer">
                                        <option value="">Select a package...</option>
                                        {packages.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.name}
                                                {p.total_sessions ? ` · ${p.total_sessions} sessions` : ''}
                                                {p.validity_days ? ` · ${p.validity_days} days` : ''}
                                                {p.price ? ` — ₹${Number(p.price).toLocaleString('en-IN')}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    {packages.length === 0 && (
                                        <p className="text-xs text-amber-600 flex items-center gap-1"><Info size={12} /> No packages found — add packages in Package Manager first</p>
                                    )}
                                    {formData.package_id && (
                                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                            {formData.sessions_count > 0 && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-50 text-[#463a7a] rounded-xl text-xs font-semibold border border-violet-100">
                                                    {formData.sessions_count} sessions
                                                </span>
                                            )}
                                            {formData.validity_days && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-50 text-[#463a7a] rounded-xl text-xs font-semibold border border-violet-100">
                                                    Valid {formData.validity_days} days
                                                </span>
                                            )}
                                            {formData.amount && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold border border-emerald-100">
                                                    ₹{Number(formData.amount).toLocaleString('en-IN')}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Payment Mode */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Payment Mode *</label>
                                    <div className="flex gap-3">
                                        {PAYMENT_MODES.map(mode => (
                                            <button key={mode} type="button"
                                                onClick={() => setFormData(f => ({ ...f, payment_mode: mode }))}
                                                className={`flex-1 py-3.5 rounded-2xl text-sm font-bold border-2 transition-all ${formData.payment_mode === mode
                                                    ? 'bg-[#463a7a] text-white border-[#463a7a] shadow-md'
                                                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-[#463a7a]/40 hover:text-[#463a7a]'}`}>
                                                {mode}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Pricing Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                            Amount (₹) *
                                            {formData.package_id && <span className="ml-1.5 text-[9px] text-violet-500 normal-case font-semibold">auto-filled</span>}
                                        </label>
                                        <input required type="number" min="0" step="0.01" value={formData.amount}
                                            onChange={e => setFormData(f => ({ ...f, amount: e.target.value }))}
                                            placeholder="0.00"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                            Sessions
                                            {formData.package_id && <span className="ml-1.5 text-[9px] text-violet-500 normal-case font-semibold">auto-filled</span>}
                                        </label>
                                        <input type="number" min="0" value={formData.sessions_count}
                                            onChange={e => setFormData(f => ({ ...f, sessions_count: parseInt(e.target.value) || 0 }))}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tax %</label>
                                        <input type="number" min="0" max="100" step="0.1" value={formData.tax_percentage}
                                            onChange={e => setFormData(f => ({ ...f, tax_percentage: parseFloat(e.target.value) || 0 }))}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Discount (₹)</label>
                                        <input type="number" min="0" step="0.01" value={formData.discount_amount}
                                            onChange={e => setFormData(f => ({ ...f, discount_amount: parseFloat(e.target.value) || 0 }))}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10" />
                                    </div>
                                </div>

                                {/* Live Price Breakdown */}
                                {previewAmount > 0 && (
                                    <div className="bg-gradient-to-br from-[#463a7a]/5 to-violet-50 rounded-2xl p-4 border border-[#463a7a]/10 space-y-2">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Price Breakdown</p>
                                        <div className="flex justify-between text-sm text-slate-600">
                                            <span>Base Amount</span>
                                            <span className="font-semibold">₹{previewAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                        </div>
                                        {previewTax > 0 && (
                                            <div className="flex justify-between text-sm text-amber-600">
                                                <span>Tax ({formData.tax_percentage}%)</span>
                                                <span className="font-semibold">+₹{previewTax.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                            </div>
                                        )}
                                        {previewDiscount > 0 && (
                                            <div className="flex justify-between text-sm text-emerald-600">
                                                <span>Discount</span>
                                                <span className="font-semibold">-₹{previewDiscount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center pt-2 border-t border-[#463a7a]/10">
                                            <span className="text-sm font-bold text-[#463a7a]">Total Due</span>
                                            <span className="text-xl font-bold text-[#463a7a]">₹{Math.max(0, previewTotal).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Description */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Description</label>
                                    <input type="text" value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                                        placeholder="e.g. Piano lessons - May 2026"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10" />
                                </div>

                                {/* Notes */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Notes <span className="text-slate-300 normal-case font-normal">(optional)</span></label>
                                    <textarea rows={2} value={formData.notes} onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
                                        placeholder="Payment instructions, additional info..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10 resize-none" />
                                </div>

                                {formError && (
                                    <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-2xl p-4">
                                        <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-xs text-red-600">{formError}</p>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 pb-6 flex gap-4 flex-shrink-0">
                                <button type="button" onClick={() => setShowCreateForm(false)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all">
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting}
                                    className="flex-1 py-4 bg-[#463a7a] text-white rounded-2xl font-bold text-sm shadow-xl hover:bg-[#2d2550] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                    {submitting ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                                    Create Invoice
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* FAB */}
            <div className="fixed bottom-6 right-6 z-50">
                <button onClick={openCreateForm}
                    className="w-14 h-14 bg-gradient-to-br from-[#463a7a] to-[#2d2550] text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center group">
                    <Plus size={24} />
                    <span className="absolute right-full mr-3 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        Create Invoice
                    </span>
                </button>
            </div>
        </div>
    );
}
