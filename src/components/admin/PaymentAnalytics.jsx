import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
    TrendingUp, DollarSign, Users, Calendar, Download, Filter,
    BarChart3, PieChart, Clock, CheckCircle2, AlertCircle, XCircle
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export default function PaymentAnalytics() {
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState(null);
    const [timeRange, setTimeRange] = useState('this_month'); // this_month, last_month, this_year, all_time
    const [chartData, setChartData] = useState(null);

    useEffect(() => {
        fetchAnalytics();
    }, [timeRange]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/payments/analytics?range=${timeRange}`);
            setAnalytics(res.data);
            generateChartData(res.data);
        } catch (err) {
            console.error(err);
            setAnalytics(null);
        } finally {
            setLoading(false);
        }
    };

    const generateChartData = (data) => {
        // This would generate data for charts (to be implemented with a charting library)
        setChartData(data);
    };

    const downloadReport = () => {
        // Generate CSV or PDF report
        console.log('Downloading report...');
        alert('Report download feature coming soon!');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#463a7a] border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-12 max-w-[1800px] mx-auto space-y-8 pb-24">
            {/* Header */}
            <div className="relative bg-gradient-to-br from-[#463a7a] to-[#2d2550] rounded-[50px] p-8 lg:p-12 overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full translate-y-48 -translate-x-48"></div>

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="mb-6 lg:mb-0">
                        <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter leading-none mb-4">
                            Payment Analytics
                        </h1>
                        <p className="text-slate-200 text-lg">
                            Comprehensive insights into your payment performance
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            className="px-6 py-3 rounded-full bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 hover:bg-white/30 transition-all cursor-pointer"
                        >
                            <option value="this_month">This Month</option>
                            <option value="last_month">Last Month</option>
                            <option value="this_year">This Year</option>
                            <option value="all_time">All Time</option>
                        </select>

                        <button
                            onClick={downloadReport}
                            className="px-6 py-3 rounded-full bg-white text-[#463a7a] font-semibold hover:bg-slate-100 transition-all flex items-center gap-2 shadow-xl"
                        >
                            <Download size={18} />
                            Export
                        </button>
                    </div>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Revenue */}
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-[30px] p-6 text-white shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                                <DollarSign size={24} />
                            </div>
                            <span className="text-white/80 text-sm font-semibold">
                                ↑ {analytics.revenueGrowth}%
                            </span>
                        </div>
                        <div className="mb-2">
                            <div className="text-3xl font-black mb-1">
                                ₹{(analytics.totalRevenue / 100000).toFixed(2)}L
                            </div>
                            <div className="text-white/80 text-sm font-medium">Total Revenue</div>
                        </div>
                    </div>
                </div>

                {/* Total Invoices */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-[30px] p-6 text-white shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                                <BarChart3 size={24} />
                            </div>
                            <span className="text-white/80 text-sm font-semibold">
                                ↑ {analytics.invoiceGrowth}%
                            </span>
                        </div>
                        <div className="mb-2">
                            <div className="text-3xl font-black mb-1">{analytics.totalInvoices}</div>
                            <div className="text-white/80 text-sm font-medium">Total Invoices</div>
                        </div>
                    </div>
                </div>

                {/* Collection Rate */}
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-[30px] p-6 text-white shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                                <TrendingUp size={24} />
                            </div>
                            <span className="text-white/80 text-sm font-semibold">Excellent</span>
                        </div>
                        <div className="mb-2">
                            <div className="text-3xl font-black mb-1">{analytics.collectionRate}%</div>
                            <div className="text-white/80 text-sm font-medium">Collection Rate</div>
                        </div>
                    </div>
                </div>

                {/* Average Invoice */}
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-[30px] p-6 text-white shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                                <Calendar size={24} />
                            </div>
                        </div>
                        <div className="mb-2">
                            <div className="text-3xl font-black mb-1">
                                ₹{(analytics.averageInvoiceValue / 1000).toFixed(1)}k
                            </div>
                            <div className="text-white/80 text-sm font-medium">Avg Invoice Value</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-[40px] p-6 shadow-xl border border-slate-100">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-emerald-100 rounded-2xl">
                            <CheckCircle2 className="text-emerald-600" size={24} />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-900">{analytics.paidInvoices}</div>
                            <div className="text-sm text-slate-500 font-medium">Paid Invoices</div>
                        </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${analytics.paidPercentage}%` }}
                        ></div>
                    </div>
                    <div className="text-xs text-slate-500 mt-2">{analytics.paidPercentage}% of total</div>
                </div>

                <div className="bg-white rounded-[40px] p-6 shadow-xl border border-slate-100">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-100 rounded-2xl">
                            <Clock className="text-blue-600" size={24} />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-900">{analytics.pendingInvoices}</div>
                            <div className="text-sm text-slate-500 font-medium">Pending Invoices</div>
                        </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${(analytics.pendingInvoices / analytics.totalInvoices * 100).toFixed(1)}%` }}
                        ></div>
                    </div>
                    <div className="text-xs text-slate-500 mt-2">
                        {((analytics.pendingInvoices / analytics.totalInvoices) * 100).toFixed(1)}% of total
                    </div>
                </div>

                <div className="bg-white rounded-[40px] p-6 shadow-xl border border-slate-100">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-red-100 rounded-2xl">
                            <AlertCircle className="text-red-600" size={24} />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-900">{analytics.overdueInvoices}</div>
                            <div className="text-sm text-slate-500 font-medium">Overdue Invoices</div>
                        </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-red-500 to-red-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${(analytics.overdueInvoices / analytics.totalInvoices * 100).toFixed(1)}%` }}
                        ></div>
                    </div>
                    <div className="text-xs text-slate-500 mt-2">
                        {((analytics.overdueInvoices / analytics.totalInvoices) * 100).toFixed(1)}% of total
                    </div>
                </div>
            </div>

            {/* Monthly Trend */}
            <div className="bg-white rounded-[40px] p-8 shadow-xl border border-slate-100">
                <h2 className="text-2xl font-black text-slate-900 mb-6">Revenue Trend</h2>
                <div className="space-y-4">
                    {analytics.monthlyTrend.map((month, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                            <div className="w-16 text-sm font-semibold text-slate-600">{month.month}</div>
                            <div className="flex-1">
                                <div className="w-full bg-slate-100 rounded-full h-10 overflow-hidden relative">
                                    <div
                                        className="bg-gradient-to-r from-[#463a7a] to-[#5e4fa2] h-full rounded-full transition-all duration-500 flex items-center justify-end pr-4"
                                        style={{ width: `${(month.revenue / 350000) * 100}%` }}
                                    >
                                        <span className="text-white text-sm font-bold">₹{(month.revenue / 1000).toFixed(0)}k</span>
                                    </div>
                                </div>
                            </div>
                            <div className="w-24 text-sm text-slate-500 text-right">{month.invoices} invoices</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Top Payment Types */}
            <div className="bg-white rounded-[40px] p-8 shadow-xl border border-slate-100">
                <h2 className="text-2xl font-black text-slate-900 mb-6">Payment Types Breakdown</h2>
                <div className="space-y-4">
                    {analytics.topPaymentTypes.map((type, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#463a7a] to-[#5e4fa2] flex items-center justify-center text-white font-bold">
                                    {idx + 1}
                                </div>
                                <div>
                                    <div className="font-bold text-slate-900">{type.type}</div>
                                    <div className="text-sm text-slate-500">{type.count} invoices</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xl font-black text-[#463a7a]">₹{(type.amount / 1000).toFixed(0)}k</div>
                                <div className="text-xs text-slate-500">
                                    {((type.amount / analytics.totalRevenue) * 100).toFixed(1)}%
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
