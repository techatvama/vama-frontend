import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
    CreditCard,
    Plus,
    Search,
    X,
    Loader2,
    DollarSign,
    TrendingUp,
    TrendingDown,
    Calendar,
    User,
    FileText,
    Download,
    Filter,
    CheckCircle2,
    Clock,
    AlertCircle,
    Edit2,
    Eye,
    ChevronLeft,
    ChevronRight,
    MoreVertical
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { format } from 'date-fns';

export default function PaymentManager() {
    const [payments, setPayments] = useState([]);
    const [filteredPayments, setFilteredPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [formData, setFormData] = useState({
        student_id: '',
        amount: '',
        due_date: '',
        payment_type: 'Monthly Tuition',
        description: '',
        status: 'pending'
    });
    const [submitting, setSubmitting] = useState(false);
    const [students, setStudents] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchPayments();
        fetchStudents();
    }, []);

    useEffect(() => {
        filterPayments();
    }, [payments, search, statusFilter, dateFilter]);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            // Replace with your actual API endpoint
            const res = await api.get('/admin/payments');
            setPayments(res.data);
        } catch (err) {
            console.error(err);
            setPayments([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async () => {
        try {
            const res = await api.get('/students');
            setStudents(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const filterPayments = () => {
        let filtered = [...payments];

        // Search filter
        if (search) {
            filtered = filtered.filter(p =>
                p.student_name?.toLowerCase().includes(search.toLowerCase()) ||
                p.id.toString().includes(search) ||
                p.payment_type?.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(p => p.status === statusFilter);
        }

        // Date filter
        if (dateFilter !== 'all') {
            const now = new Date();
            filtered = filtered.filter(p => {
                const paymentDate = new Date(p.issue_date);
                switch (dateFilter) {
                    case 'thisMonth':
                        return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear();
                    case 'lastMonth':
                        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                        return paymentDate.getMonth() === lastMonth.getMonth() && paymentDate.getFullYear() === lastMonth.getFullYear();
                    case 'thisYear':
                        return paymentDate.getFullYear() === now.getFullYear();
                    default:
                        return true;
                }
            });
        }

        setFilteredPayments(filtered);
        setCurrentPage(1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            await api.post('/admin/payments', formData);
            fetchPayments();
            resetForm();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.detail || 'Failed to create payment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleMarkAsPaid = async (paymentId) => {
        try {
            await api.patch(`/admin/payments/${paymentId}`, {
                status: 'paid',
                paid_date: new Date().toISOString()
            });
            fetchPayments();
        } catch (err) {
            console.error(err);
            // For demo, update locally
            setPayments(prev => prev.map(p =>
                p.id === paymentId ? { ...p, status: 'paid', paid_date: new Date().toISOString() } : p
            ));
        }
    };

    const resetForm = () => {
        setFormData({
            student_id: '',
            amount: '',
            due_date: '',
            payment_type: 'Monthly Tuition',
            description: '',
            status: 'pending'
        });
        setShowForm(false);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'paid':
                return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'pending':
                return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'overdue':
                return 'bg-red-50 text-red-700 border-red-100';
            case 'cancelled':
                return 'bg-slate-50 text-slate-700 border-slate-100';
            default:
                return 'bg-slate-50 text-slate-700 border-slate-100';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'paid':
                return <CheckCircle2 size={14} />;
            case 'pending':
                return <Clock size={14} />;
            case 'overdue':
                return <AlertCircle size={14} />;
            default:
                return <FileText size={14} />;
        }
    };

    // Calculate summary statistics
    const totalInvoiced = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const totalCollected = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const totalDue = payments.filter(p => p.status !== 'paid' && p.status !== 'cancelled').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const paidCount = payments.filter(p => p.status === 'paid').length;
    const dueCount = payments.filter(p => p.status !== 'paid' && p.status !== 'cancelled').length;

    // Pagination
    const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPayments = filteredPayments.slice(startIndex, endIndex);

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
            <Loader2 className="w-10 h-10 text-[#463a7a] animate-spin" />
        </div>
    );

    return (
        <div className="p-4 lg:p-12 max-w-[1600px] mx-auto space-y-8 pb-24">
            {/* Header */}
            <div className="relative bg-gradient-to-br from-[#463a7a] to-[#2d2550] rounded-[50px] p-8 lg:p-12 overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-12 opacity-5">
                    <CreditCard className="w-64 h-64 text-white" />
                </div>

                <div className="relative z-10">
                    <button
                        onClick={() => navigate('/admin')}
                        className="mb-4 text-white/60 hover:text-white text-sm font-bold flex items-center gap-2 transition-colors"
                    >
                        ← Back to Dashboard
                    </button>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter leading-none mb-4">
                                Payment Manager
                            </h1>
                            <p className="text-indigo-100/60 font-medium text-lg">
                                Manage invoices, track payments, and monitor financial health
                            </p>
                        </div>

                        <button
                            onClick={() => setShowForm(true)}
                            className="px-8 py-4 bg-white text-[#463a7a] rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center gap-2 whitespace-nowrap"
                        >
                            <Plus size={20} />
                            Add Invoice
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-[40px] p-8 shadow-xl border border-slate-100 relative overflow-hidden group hover:shadow-2xl transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[80px] -mr-8 -mt-8 group-hover:bg-blue-100 transition-colors" />
                    <div className="relative z-10">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Invoiced ({payments.length})</p>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-4xl font-black text-slate-900 tracking-tighter">₹{totalInvoiced.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-slate-400 font-medium">from 1,327,208.19</span>
                            <div className="flex items-center gap-1 text-slate-400">
                                <TrendingDown size={14} />
                                <span className="font-bold text-xs">-14%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[40px] p-8 shadow-xl border border-slate-100 relative overflow-hidden group hover:shadow-2xl transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-[80px] -mr-8 -mt-8 group-hover:bg-emerald-100 transition-colors" />
                    <div className="relative z-10">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Collected ({paidCount})</p>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-4xl font-black text-emerald-600 tracking-tighter">₹{totalCollected.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-slate-400 font-medium">from 1,727,476.65</span>
                            <div className="flex items-center gap-1 text-emerald-600">
                                <TrendingDown size={14} />
                                <span className="font-bold text-xs">-27%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[40px] p-8 shadow-xl border border-slate-100 relative overflow-hidden group hover:shadow-2xl transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-[80px] -mr-8 -mt-8 group-hover:bg-orange-100 transition-colors" />
                    <div className="relative z-10">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Due ({dueCount})</p>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-4xl font-black text-orange-600 tracking-tighter">₹{totalDue.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-slate-400 font-medium">from 236,858.50</span>
                            <div className="flex items-center gap-1 text-orange-600">
                                <TrendingUp size={14} />
                                <span className="font-bold text-xs">+33%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-[40px] p-6 shadow-xl border border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Date Filter */}
                    <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-slate-700 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10 transition-all appearance-none cursor-pointer"
                        >
                            <option value="all">All Time</option>
                            <option value="thisMonth">This Month</option>
                            <option value="lastMonth">Last Month</option>
                            <option value="thisYear">This Year</option>
                        </select>
                    </div>

                    {/* Search */}
                    <div className="relative md:col-span-2">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search invoices..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-slate-900 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10 transition-all"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-slate-700 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10 transition-all appearance-none cursor-pointer"
                        >
                            <option value="all">All Status</option>
                            <option value="paid">Paid</option>
                            <option value="pending">Pending</option>
                            <option value="overdue">Overdue</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Payments Table */}
            <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50">
                                <th className="px-6 py-5 text-left">
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Issue</span>
                                </th>
                                <th className="px-6 py-5 text-left">
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Invoice Amount</span>
                                </th>
                                <th className="px-6 py-5 text-left">
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Invoice Status</span>
                                </th>
                                <th className="px-6 py-5 text-left">
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Invoice Number</span>
                                </th>
                                <th className="px-6 py-5 text-left">
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Student</span>
                                </th>
                                <th className="px-6 py-5 text-left">
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Due</span>
                                </th>
                                <th className="px-6 py-5 text-left">
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Paid</span>
                                </th>
                                <th className="px-6 py-5 text-right">
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentPayments.map((payment, idx) => (
                                <tr
                                    key={payment.id}
                                    className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors group ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
                                >
                                    <td className="px-6 py-5">
                                        <span className="text-sm font-medium text-slate-600">
                                            {format(new Date(payment.issue_date), 'MMM d, yyyy')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-sm font-black text-slate-900">
                                            ₹{parseFloat(payment.amount).toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border ${getStatusColor(payment.status)}`}>
                                            {getStatusIcon(payment.status)}
                                            {payment.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-sm font-bold text-slate-700">
                                            #{payment.id}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-sm font-medium text-slate-900">
                                            {payment.student_name}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-sm font-medium text-slate-600">
                                            {format(new Date(payment.due_date), 'MMM d, yyyy')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-sm font-black text-slate-900">
                                            {payment.status === 'paid' ? `₹${parseFloat(payment.amount).toFixed(2)}` : '₹0.00'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedPayment(payment);
                                                    setShowDetailsModal(true);
                                                }}
                                                className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-[#463a7a] transition-all"
                                                title="View Details"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            {payment.status !== 'paid' && (
                                                <button
                                                    onClick={() => handleMarkAsPaid(payment.id)}
                                                    className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-100 transition-all"
                                                >
                                                    Mark Paid
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-5 border-t border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10 transition-all"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                            <span className="text-sm font-medium text-slate-600">
                                Showing {startIndex + 1} to {Math.min(endIndex, filteredPayments.length)} of {filteredPayments.length} results
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft size={18} />
                            </button>

                            {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }

                                return (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`min-w-[40px] h-10 rounded-xl text-sm font-black transition-all ${currentPage === pageNum
                                                ? 'bg-[#463a7a] text-white shadow-lg'
                                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}

                            {totalPages > 5 && currentPage < totalPages - 2 && (
                                <>
                                    <span className="text-slate-400 font-black">...</span>
                                    <button
                                        onClick={() => setCurrentPage(totalPages)}
                                        className="min-w-[40px] h-10 rounded-xl text-sm font-black bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
                                    >
                                        {totalPages}
                                    </button>
                                </>
                            )}

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Invoice Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white rounded-[50px] w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-10 bg-[#463a7a] text-white rounded-t-[50px]">
                            <div className="flex items-center justify-between">
                                <h3 className="text-3xl font-black tracking-tighter uppercase">
                                    New Invoice
                                </h3>
                                <button
                                    onClick={resetForm}
                                    className="p-2 hover:bg-white/10 rounded-2xl transition-all"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-10 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                                        Student *
                                    </label>
                                    <select
                                        required
                                        value={formData.student_id}
                                        onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-4 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10 transition-all appearance-none"
                                    >
                                        <option value="">Select a student</option>
                                        {students.map(student => (
                                            <option key={student.id} value={student.id}>
                                                {student.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                                        Payment Type *
                                    </label>
                                    <select
                                        required
                                        value={formData.payment_type}
                                        onChange={(e) => setFormData({ ...formData, payment_type: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-4 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10 transition-all appearance-none"
                                    >
                                        <option value="Monthly Tuition">Monthly Tuition</option>
                                        <option value="Exam Fee">Exam Fee</option>
                                        <option value="Material Fee">Material Fee</option>
                                        <option value="Registration Fee">Registration Fee</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                                        Amount (₹) *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        step="0.01"
                                        min="0"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        placeholder="0.00"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-4 text-slate-900 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10 transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                                        Due Date *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.due_date}
                                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-4 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Add notes or description..."
                                    rows={3}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-4 text-slate-900 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10 transition-all resize-none"
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-4 bg-[#463a7a] text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Plus size={18} />
                                            Create Invoice
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {showDetailsModal && selectedPayment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white rounded-[50px] w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-10 bg-gradient-to-br from-[#463a7a] to-[#2d2550] text-white rounded-t-[50px]">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-3xl font-black tracking-tighter uppercase">
                                    Invoice Details
                                </h3>
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="p-2 hover:bg-white/10 rounded-2xl transition-all"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-indigo-200 text-sm font-medium">Invoice #{selectedPayment.id}</span>
                                <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider ${getStatusColor(selectedPayment.status)}`}>
                                    {getStatusIcon(selectedPayment.status)}
                                    {selectedPayment.status}
                                </span>
                            </div>
                        </div>

                        <div className="p-10 space-y-8">
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Student</p>
                                    <p className="text-lg font-black text-slate-900">{selectedPayment.student_name}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Payment Type</p>
                                    <p className="text-lg font-black text-slate-900">{selectedPayment.payment_type}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Amount</p>
                                    <p className="text-2xl font-black text-[#463a7a]">₹{parseFloat(selectedPayment.amount).toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Issue Date</p>
                                    <p className="text-lg font-black text-slate-900">{format(new Date(selectedPayment.issue_date), 'MMM dd, yyyy')}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Due Date</p>
                                    <p className="text-lg font-black text-slate-900">{format(new Date(selectedPayment.due_date), 'MMM dd, yyyy')}</p>
                                </div>
                                {selectedPayment.paid_date && (
                                    <div>
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Paid Date</p>
                                        <p className="text-lg font-black text-emerald-600">{format(new Date(selectedPayment.paid_date), 'MMM dd, yyyy')}</p>
                                    </div>
                                )}
                            </div>

                            {selectedPayment.description && (
                                <div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Description</p>
                                    <p className="text-sm font-medium text-slate-600 bg-slate-50 p-4 rounded-2xl">{selectedPayment.description}</p>
                                </div>
                            )}

                            <div className="flex gap-4 pt-4 border-t border-slate-100">
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all"
                                >
                                    Close
                                </button>
                                <button
                                    className="flex-1 py-4 bg-[#463a7a] text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2"
                                >
                                    <Download size={18} />
                                    Download Invoice
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
