import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { api, API_BASE } from '../../lib/api';
import {
    FileText, Plus, Search, X, Loader2, Download,
    CheckCircle2, Clock, AlertCircle, ChevronLeft, ChevronRight,
    Eye, Send, Mail, MessageSquare, Users,
    ChevronDown, ChevronUp, RefreshCw, Info, Banknote, Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import RecordPaymentDialog from './RecordPaymentDialog';

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
    const win = window.open(`${API_BASE}/admin/invoices/${invoice.id}/html`, '_blank');
    if (!win) alert('Allow pop-ups for this site to open the invoice PDF.');
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

function EmailSendModal({ invoice, onClose }) {
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
        } catch (err) {
            setError(err?.response?.data?.detail || 'Failed to send. Check SMTP settings (.env: SMTP_USER, SMTP_PASS).');
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
                        <p className="text-sm text-slate-500 mb-6">Sent to <span className="font-bold text-slate-700">{invoice.student_email || 'student email'}</span></p>
                        <button onClick={onClose} className="px-8 py-3 bg-emerald-500 text-white rounded-2xl font-bold text-sm hover:bg-emerald-600 transition-all">Done</button>
                    </div>
                ) : (
                    <div className="p-5 space-y-4">
                        {/* Type toggle */}
                        <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
                            {[['invoice', 'Invoice'], ['reminder', 'Reminder']].map(([v, l]) => (
                                <button key={v} type="button" onClick={() => setKind(v)}
                                    className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${kind === v ? (v === 'reminder' ? 'bg-red-600 text-white shadow' : 'bg-[#463a7a] text-white shadow') : 'text-slate-400 hover:text-slate-600'}`}>
                                    {l}
                                </button>
                            ))}
                        </div>

                        {/* Info card */}
                        <div className={`rounded-2xl p-4 ${isReminder ? 'bg-red-50 border border-red-100' : 'bg-slate-50 border border-slate-100'}`}>
                            <p className="text-xs font-bold text-slate-500 mb-2">Will be sent to</p>
                            <p className="text-sm font-black text-slate-900">{invoice.student_name}</p>
                            <p className="text-xs text-slate-500">{invoice.student_email || 'No email on record'}</p>
                            {isReminder && balance > 0 && (
                                <div className="mt-3 pt-3 border-t border-red-200">
                                    <p className="text-xs text-red-700 font-bold">Balance due: <span className="text-red-600 font-black">₹{balance.toLocaleString('en-IN')}</span></p>
                                    {invoice.due_date && <p className="text-xs text-red-600">Due: {format(new Date(invoice.due_date), 'MMM d, yyyy')}</p>}
                                </div>
                            )}
                        </div>

                        {error && <p className="text-xs text-red-600 bg-red-50 rounded-2xl p-3 border border-red-100">{error}</p>}
                        <div className="flex gap-3">
                            <button onClick={onClose} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all">Cancel</button>
                            <button onClick={handleSend} disabled={sending || !invoice.student_email} className={`flex-1 py-3 text-white rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${btnCls}`}>
                                {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                                Send
                            </button>
                        </div>
                        {!invoice.student_email && <p className="text-[10px] text-amber-600 text-center">No email on this student's record — update their profile first.</p>}
                    </div>
                )}
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
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [students, setStudents] = useState([]);
    const [packages, setPackages] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [formError, setFormError] = useState('');
    const [sortBy, setSortBy] = useState('issue_date');
    const [sortDir, setSortDir] = useState('desc');
    const [emailTarget, setEmailTarget] = useState(null);
    const [paymentTarget, setPaymentTarget] = useState(null);
    const [pkgSearch, setPkgSearch] = useState('');
    const [pkgDropOpen, setPkgDropOpen] = useState(false);
    const pkgRef = useRef(null);

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

    const deleteInvoice = async (inv) => {
        if (!window.confirm(`Delete invoice ${inv.invoice_number}? Items, payments and installments are removed. This cannot be undone.`)) return;
        try { await api.delete(`/admin/invoices/${inv.id}`); setInvoices(prev => prev.filter(x => x.id !== inv.id)); }
        catch (e) { alert(e.response?.data?.detail || 'Failed to delete invoice'); }
    };

    const handleBulkMarkPaid = () => {
        setInvoices(prev => prev.map(inv =>
            selectedIds.has(inv.id) && inv.status !== 'paid'
                ? { ...inv, status: 'paid', paid_date: new Date().toISOString(), paid_amount: inv.total_amount }
                : inv));
        setSelectedIds(new Set());
    };

    const handleBulkSendReminders = async () => {
        const targets = invoices.filter(inv => selectedIds.has(inv.id) && inv.status !== 'paid');
        if (!targets.length) return;
        if (!window.confirm(`Send payment reminders to ${targets.length} student(s)?`)) return;
        let sent = 0;
        for (const inv of targets) {
            try { await api.post(`/admin/invoices/${inv.id}/send`, { kind: 'reminder' }); sent++; }
            catch { /* skip if no email */ }
        }
        alert(`Reminder sent to ${sent} of ${targets.length} student(s).`);
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
        setPkgSearch('');
        setPkgDropOpen(true);
        setShowCreateForm(true);
    };

    const handleCreateInvoice = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError('');
        const amount = parseFloat(formData.amount) || 0;
        const sessions = parseInt(formData.sessions_count) || 1;
        const perSession = sessions > 0 ? Math.round((amount / sessions) * 100) / 100 : amount;
        const selectedPkg = packages.find(p => p.id === parseInt(formData.package_id));
        const validityDays = formData.validity_days;
        const validTill = validityDays
            ? new Date(Date.now() + validityDays * 86400000).toISOString().split('T')[0]
            : null;
        const payload = {
            student_id: parseInt(formData.student_id),
            issue_date: formData.issue_date || new Date().toISOString().split('T')[0],
            due_date: formData.due_date,
            discount_percentage: 0,
            discount_amount: parseFloat(formData.discount_amount) || 0,
            tax_percentage: parseFloat(formData.tax_percentage) || 0,
            notes: formData.description || null,
            send_email: false,
            items: [{
                package_id: formData.package_id ? parseInt(formData.package_id) : null,
                label: selectedPkg ? selectedPkg.name : (formData.description || 'Invoice Item'),
                description: formData.description || '',
                quantity: sessions,
                unit_price: perSession,
                valid_till: validTill,
            }],
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
                            <button onClick={() => navigate('/admin/billing-settings')} className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all border border-white/10">
                                <Info size={15} /> Settings
                            </button>
                            <button onClick={() => navigate('/admin/invoices/new')} className="px-5 py-3 bg-white text-[#463a7a] rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center gap-2">
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
                            <button onClick={handleBulkSendReminders} className="px-4 py-2 bg-red-500 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-red-400 transition-all flex items-center gap-1.5">
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
                                                    <button onClick={() => setPaymentTarget(inv)} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-[#463a7a] transition-all" title="View & Record Payment"><Eye size={14} /></button>
                                                    {inv.status !== 'paid' && (
                                                        <button onClick={() => handleMarkPaid(inv.id)} className="p-1.5 hover:bg-emerald-50 rounded-xl text-slate-400 hover:text-emerald-600 transition-all" title="Mark Paid"><CheckCircle2 size={14} /></button>
                                                    )}
                                                    <button onClick={() => setEmailTarget(inv)} className="p-1.5 hover:bg-blue-50 rounded-xl text-slate-400 hover:text-blue-500 transition-all" title="Send Email"><Mail size={14} /></button>
                                                    <button onClick={() => downloadInvoicePDF(inv)} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-all" title="Download PDF"><Download size={14} /></button>
                                                    <button onClick={() => deleteInvoice(inv)} className="p-1.5 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-500 transition-all" title="Delete invoice"><Trash2 size={14} /></button>
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

            {/* Email Modal */}
            {emailTarget && (
                <EmailSendModal invoice={emailTarget} onClose={() => setEmailTarget(null)} />
            )}

            {/* Record Payment */}
            {paymentTarget && (
                <RecordPaymentDialog invoiceId={paymentTarget.id} onClose={() => setPaymentTarget(null)} onRecorded={loadData} />
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

                                {/* Package — searchable combobox */}
                                <div className="space-y-1.5" ref={pkgRef}>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Package *</label>
                                    {formData.package_id ? (
                                        <div className="flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-2xl px-4 py-3">
                                            <span className="text-sm font-black text-[#463a7a] flex-1">
                                                {packages.find(p => String(p.id) === String(formData.package_id))?.name || 'Selected package'}
                                            </span>
                                            <button type="button" onClick={() => { handlePackageChange(''); setPkgSearch(''); }} className="text-[10px] font-black text-violet-400 hover:text-red-500 uppercase tracking-widest">change</button>
                                        </div>
                                    ) : (
                                        <div className="relative" ref={pkgRef}>
                                            <Search size={14} className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
                                            <input
                                                type="text"
                                                autoFocus
                                                placeholder="Search package by name..."
                                                value={pkgSearch}
                                                onChange={e => setPkgSearch(e.target.value)}
                                                onBlur={() => setTimeout(() => setPkgDropOpen(false), 160)}
                                                onFocus={() => setPkgDropOpen(true)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 pl-9 text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10"
                                                autoComplete="off"
                                            />
                                            <div className={`absolute z-30 mt-1 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-56 overflow-y-auto ${pkgDropOpen ? '' : 'hidden'}`}>
                                                {packages
                                                    .filter(p => !pkgSearch || p.name.toLowerCase().includes(pkgSearch.toLowerCase()))
                                                    .map(p => (
                                                        <button key={p.id} type="button"
                                                            onMouseDown={e => { e.preventDefault(); handlePackageChange(String(p.id)); setPkgSearch(''); setPkgDropOpen(false); }}
                                                            className="w-full text-left px-4 py-3 hover:bg-violet-50 border-b border-slate-50 last:border-0">
                                                            <p className="text-sm font-black text-slate-800">{p.name}</p>
                                                            <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                                                                {p.total_sessions ? `${p.total_sessions} sessions · ` : ''}{p.validity_days ? `${p.validity_days} days · ` : ''}₹{Number(p.price || 0).toLocaleString('en-IN')}
                                                            </p>
                                                        </button>
                                                    ))}
                                                {packages.filter(p => !pkgSearch || p.name.toLowerCase().includes(pkgSearch.toLowerCase())).length === 0 && (
                                                    <p className="text-sm text-slate-400 text-center py-4">{pkgSearch ? `No match for "${pkgSearch}"` : 'No packages available'}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
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
