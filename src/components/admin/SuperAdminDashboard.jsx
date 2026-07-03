import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
    TrendingUp, DollarSign, Users, Building2, AlertCircle, Loader2,
    Activity, BarChart3, ArrowUpRight, ArrowDownRight, ChevronRight,
    Eye, EyeOff, Plus, Check, X, Mail, Phone, MapPin, User, Copy, CheckCircle
} from 'lucide-react';

const EMPTY_FORM = {
    center_name: '', center_address: '', center_phone: '', center_email: '',
};

export default function SuperAdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCenter, setSelectedCenter] = useState(null);

    // Create Center Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createData, setCreateData] = useState(EMPTY_FORM);
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState('');
    const [createSuccess, setCreateSuccess] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/admin/super-admin/stats');
            setStats(res.data);
            if (res.data.centers?.length > 0) {
                setSelectedCenter(null); // Show all by default
            }
        } catch (err) {
            setError('Failed to load dashboard data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const closeModal = () => {
        setShowCreateModal(false);
        setCreateError('');
        setCreateSuccess(null);
        setCreateData(EMPTY_FORM);
        setCopied(false);
    };

    const copyLink = (link) => {
        navigator.clipboard.writeText(link).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const submitCreateCenter = async () => {
        setCreateError('');
        if (!createData.center_name.trim() || !createData.center_email.trim() || !createData.center_phone.trim()) {
            setCreateError('Center name, email, and phone are required');
            return;
        }
        if (!/\S+@\S+\.\S+/.test(createData.center_email)) {
            setCreateError('Please enter a valid email address');
            return;
        }

        setCreating(true);
        try {
            const res = await api.post('/centers/onboard', createData);
            setCreateSuccess(res.data);
            fetchStats(); // Refresh stats in background
        } catch (err) {
            setCreateError(err.response?.data?.detail || 'Failed to create center');
        } finally {
            setCreating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
                <div className="max-w-md mx-auto bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <span className="text-red-800">{error}</span>
                    <button
                        onClick={fetchStats}
                        className="ml-auto text-sm text-red-600 font-semibold hover:text-red-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!stats) return null;

    const { global, centers } = stats;
    const displayedCenters = selectedCenter
        ? centers.filter(c => c.center_id === selectedCenter)
        : centers;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-8 py-12">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-4xl font-bold mb-2">SuperAdmin Dashboard</h1>
                            <p className="text-indigo-100">Global view of all centers and operations</p>
                        </div>
                        <div className="text-right">
                            <div className="text-4xl font-bold">{global.total_centers}</div>
                            <p className="text-indigo-100 text-sm">Active Centers</p>
                        </div>
                    </div>

                    {/* Global KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <KPICard
                            label="Total Students"
                            value={global.total_students}
                            icon={Users}
                            bgClass="bg-blue-500/20"
                            textClass="text-blue-100"
                        />
                        <KPICard
                            label="Total Staff"
                            value={global.total_staff}
                            icon={Users}
                            bgClass="bg-green-500/20"
                            textClass="text-green-100"
                        />
                        <KPICard
                            label="Total Revenue"
                            value={`₹${(global.total_revenue / 100000).toFixed(1)}L`}
                            icon={DollarSign}
                            bgClass="bg-emerald-500/20"
                            textClass="text-emerald-100"
                        />
                        <KPICard
                            label="Active Centers"
                            value={global.total_centers}
                            icon={Building2}
                            bgClass="bg-purple-500/20"
                            textClass="text-purple-100"
                        />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-8 py-12">
                {/* Centers Filter & Management */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">Center Performance</h2>
                            <p className="text-slate-500 text-sm mt-1">Monitor all branches in real-time</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition-all shadow-lg shadow-emerald-200"
                            >
                                <Plus className="w-4 h-4" />
                                Create Center
                            </button>
                            <button
                                onClick={() => setSelectedCenter(null)}
                                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                                    selectedCenter === null
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                View All {centers.length} Centers
                            </button>
                        </div>
                    </div>

                    {/* Center Selector */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {centers.map(center => (
                            <button
                                key={center.center_id}
                                onClick={() => setSelectedCenter(selectedCenter === center.center_id ? null : center.center_id)}
                                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all flex-shrink-0 ${
                                    selectedCenter === center.center_id
                                        ? 'bg-indigo-600 text-white shadow-lg'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                {center.center_name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Centers Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {displayedCenters.map(center => (
                        <CenterCard key={center.center_id} center={center} />
                    ))}
                </div>

                {displayedCenters.length === 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                        <Building2 className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-500 font-medium">No centers found</p>
                    </div>
                )}

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    <SummaryCard
                        title="Average Students per Center"
                        value={centers.length > 0 ? (global.total_students / centers.length).toFixed(0) : 0}
                        icon={Users}
                        color="blue"
                    />
                    <SummaryCard
                        title="Average Revenue per Center"
                        value={`₹${centers.length > 0 ? (global.total_revenue / centers.length / 100000).toFixed(1) : 0}L`}
                        icon={DollarSign}
                        color="emerald"
                    />
                    <SummaryCard
                        title="Average Staff per Center"
                        value={centers.length > 0 ? (global.total_staff / centers.length).toFixed(0) : 0}
                        icon={Users}
                        color="purple"
                    />
                </div>
            </div>

            {/* Create Center Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-xl font-bold">Create New Center</h2>
                                    {!createSuccess && (
                                        <p className="text-indigo-200 text-sm mt-1">Center Details</p>
                                    )}
                                </div>
                                <button onClick={closeModal} className="text-white/70 hover:text-white mt-1">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="px-8 py-6 space-y-4">
                            {/* Success State */}
                            {createSuccess ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                                            <CheckCircle className="w-7 h-7 text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-lg">Center Created!</p>
                                            <p className="text-slate-500 text-sm">{createSuccess.center?.name} is now active</p>
                                        </div>
                                    </div>

                                    {/* Admin Account Info */}
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Center Admin Created</p>
                                        <div className="flex items-center gap-2 text-sm text-slate-700">
                                            <User className="w-4 h-4 text-slate-400" />
                                            <span className="font-medium">{createSuccess.admin_staff?.name}</span>
                                            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">center_admin</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-700">
                                            <Mail className="w-4 h-4 text-slate-400" />
                                            <span>{createSuccess.admin_staff?.email}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-700">
                                            <Phone className="w-4 h-4 text-slate-400" />
                                            <span>{createSuccess.admin_staff?.phone || '—'}</span>
                                        </div>
                                    </div>

                                    {/* Email status */}
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                                        <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm">
                                            <p className="font-semibold text-blue-800">Activation email sent</p>
                                            <p className="text-blue-600 mt-0.5">
                                                Instructions sent to <strong>{createSuccess.admin_staff?.email}</strong>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Activation link (dev mode) */}
                                    {createSuccess.activation_link && (
                                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                                            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Dev Mode — Activation Link</p>
                                            <div className="flex items-center gap-2">
                                                <code className="flex-1 text-xs bg-white border border-amber-200 px-3 py-2 rounded-lg text-amber-900 break-all">
                                                    {createSuccess.activation_link}
                                                </code>
                                                <button
                                                    onClick={() => copyLink(createSuccess.activation_link)}
                                                    className="flex-shrink-0 p-2 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
                                                    title="Copy link"
                                                >
                                                    {copied ? <Check className="w-4 h-4 text-amber-700" /> : <Copy className="w-4 h-4 text-amber-700" />}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                            Center Name <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                                            <input
                                                type="text"
                                                value={createData.center_name}
                                                onChange={e => setCreateData(p => ({ ...p, center_name: e.target.value }))}
                                                placeholder="e.g. Vama Academy – Whitefield"
                                                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Address</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                                            <input
                                                type="text"
                                                value={createData.center_address}
                                                onChange={e => setCreateData(p => ({ ...p, center_address: e.target.value }))}
                                                placeholder="123 Main St, City, State"
                                                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone</label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                                                <input
                                                    type="tel"
                                                    value={createData.center_phone}
                                                    onChange={e => setCreateData(p => ({ ...p, center_phone: e.target.value }))}
                                                    placeholder="+91 98765 43210"
                                                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Center Email</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                                                <input
                                                    type="email"
                                                    value={createData.center_email}
                                                    onChange={e => setCreateData(p => ({ ...p, center_email: e.target.value }))}
                                                    placeholder="center@vama.academy"
                                                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Error */}
                            {createError && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    {createError}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="border-t border-slate-200 px-8 py-4 flex items-center justify-between bg-slate-50">
                            {createSuccess ? (
                                <button
                                    onClick={closeModal}
                                    className="ml-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all"
                                >
                                    Done
                                </button>
                            ) : (
                                <>
                                    <button onClick={closeModal} className="px-5 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-100">
                                        Cancel
                                    </button>
                                    <button
                                        onClick={submitCreateCenter}
                                        disabled={creating}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50"
                                    >
                                        {creating ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
                                        ) : (
                                            <><Plus className="w-4 h-4" /> Create Center</>
                                        )}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function KPICard({ label, value, icon: Icon, bgClass, textClass }) {
    return (
        <div className={`${bgClass} rounded-xl p-4 backdrop-blur-sm border border-white/20`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-white/80 text-sm font-medium">{label}</p>
                    <p className="text-2xl font-bold text-white mt-1">{value}</p>
                </div>
                <Icon className={`w-8 h-8 ${textClass}`} />
            </div>
        </div>
    );
}

function CenterCard({ center }) {
    const revenuePercent = center.revenue > 0
        ? ((center.revenue / 1000000) * 100).toFixed(1)
        : 0;

    const outstandingPercent = (center.outstanding / (center.revenue + center.outstanding || 1) * 100).toFixed(1);

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-6 pb-4 border-b border-slate-100">
                <div>
                    <h3 className="text-xl font-bold text-slate-900">{center.center_name}</h3>
                    <p className="text-sm text-slate-500 mt-1">
                        Added {new Date(center.created_at).toLocaleDateString()}
                    </p>
                </div>
                <div className="text-right">
                    <div className="inline-block bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold">
                        Center #{center.center_id}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <p className="text-xs font-semibold text-blue-600 uppercase mb-1">Students</p>
                    <p className="text-2xl font-bold text-blue-900">{center.students}</p>
                </div>

                <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                    <p className="text-xs font-semibold text-purple-600 uppercase mb-1">Staff</p>
                    <p className="text-2xl font-bold text-purple-900">{center.staff}</p>
                </div>

                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                    <p className="text-xs font-semibold text-emerald-600 uppercase mb-1">Revenue</p>
                    <p className="text-2xl font-bold text-emerald-900">₹{(center.revenue / 100000).toFixed(1)}L</p>
                </div>

                <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                    <p className="text-xs font-semibold text-red-600 uppercase mb-1">Outstanding</p>
                    <p className="text-2xl font-bold text-red-900">₹{(center.outstanding / 100000).toFixed(1)}L</p>
                </div>
            </div>

            {/* Progress Bars */}
            <div className="space-y-4">
                {/* Revenue Collection */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">Revenue Collection</span>
                        <span className="text-sm font-bold text-slate-900">{revenuePercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-green-600"
                            style={{ width: `${Math.min(revenuePercent, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Outstanding Dues */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">Outstanding Amount</span>
                        <span className="text-sm font-bold text-red-600">{outstandingPercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-red-500 to-orange-600"
                            style={{ width: `${Math.min(outstandingPercent, 100)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Footer Action */}
            <div className="mt-6 pt-4 border-t border-slate-100">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded-lg transition-colors">
                    <Eye className="w-4 h-4" />
                    View Center Admin Dashboard
                    <ChevronRight className="w-4 h-4 ml-auto" />
                </button>
            </div>
        </div>
    );
}

function SummaryCard({ title, value, icon: Icon, color }) {
    const colorClass = {
        blue: 'from-blue-500 to-blue-600',
        emerald: 'from-emerald-500 to-green-600',
        purple: 'from-purple-500 to-pink-600'
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-600">{title}</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
                </div>
                <div className={`w-16 h-16 bg-gradient-to-br ${colorClass[color]} rounded-2xl opacity-20`} />
            </div>
        </div>
    );
}
