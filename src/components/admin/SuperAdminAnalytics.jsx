import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
    TrendingUp,
    DollarSign,
    Users,
    Building2,
    AlertCircle,
    Loader2,
    ChevronDown
} from 'lucide-react';

export default function SuperAdminAnalytics() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCenter, setSelectedCenter] = useState('all');

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/admin/super-admin/stats');
            setStats(res.data);
        } catch (err) {
            setError('Failed to load cross-center analytics');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-800">{error}</span>
                <button
                    onClick={fetchStats}
                    className="ml-auto text-sm text-red-600 font-semibold hover:text-red-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!stats) return null;

    const { global, centers } = stats;
    const displayedCenters = selectedCenter === 'all'
        ? centers
        : centers.filter(c => c.center_id === parseInt(selectedCenter));

    return (
        <div className="space-y-8">
            {/* Global Overview Cards */}
            <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Global Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatCard
                        label="Active Centers"
                        value={global.total_centers}
                        icon={Building2}
                        color="from-blue-500 to-blue-600"
                    />
                    <StatCard
                        label="Total Students"
                        value={global.total_students}
                        icon={Users}
                        color="from-purple-500 to-purple-600"
                    />
                    <StatCard
                        label="Total Staff"
                        value={global.total_staff}
                        icon={Users}
                        color="from-indigo-500 to-indigo-600"
                    />
                    <StatCard
                        label="Total Revenue"
                        value={`₹${(global.total_revenue / 100000).toFixed(1)}L`}
                        icon={DollarSign}
                        color="from-green-500 to-green-600"
                    />
                </div>
            </div>

            {/* Per-Center Analytics */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-slate-900">Per-Center Performance</h2>
                    <div className="relative">
                        <select
                            value={selectedCenter}
                            onChange={(e) => setSelectedCenter(e.target.value)}
                            className="appearance-none bg-white border border-slate-300 rounded-lg px-4 py-2 pr-10 text-sm font-medium hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">View All Centers</option>
                            {centers.map(c => (
                                <option key={c.center_id} value={c.center_id}>
                                    {c.center_name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                </div>

                <div className="grid gap-4">
                    {displayedCenters.length === 0 ? (
                        <div className="bg-slate-50 rounded-lg p-8 text-center text-slate-500">
                            No centers found
                        </div>
                    ) : (
                        displayedCenters.map(center => (
                            <CenterCard key={center.center_id} center={center} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color }) {
    return (
        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-6 border border-slate-100">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">{label}</p>
                    <p className="text-3xl font-bold text-slate-900">{value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${color} opacity-10 flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-slate-400" />
                </div>
            </div>
        </div>
    );
}

function CenterCard({ center }) {
    const revenue_pct = center.revenue > 0
        ? ((center.revenue / 1000000) * 100).toFixed(1)
        : 0;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">{center.center_name}</h3>
                    <p className="text-sm text-slate-500">
                        Added {new Date(center.created_at).toLocaleDateString()}
                    </p>
                </div>
                <div className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
                    Center #{center.center_id}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Students</p>
                    <p className="text-2xl font-bold text-slate-900">{center.students}</p>
                </div>

                <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Staff</p>
                    <p className="text-2xl font-bold text-slate-900">{center.staff}</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-xs font-semibold text-green-600 uppercase mb-1">Revenue</p>
                    <p className="text-2xl font-bold text-green-700">₹{(center.revenue / 100000).toFixed(1)}L</p>
                </div>

                <div className="bg-red-50 rounded-lg p-4">
                    <p className="text-xs font-semibold text-red-600 uppercase mb-1">Outstanding</p>
                    <p className="text-2xl font-bold text-red-700">₹{(center.outstanding / 100000).toFixed(1)}L</p>
                </div>
            </div>

            {/* Progress bars */}
            <div className="mt-4 space-y-3">
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-slate-600">Revenue Collection</span>
                        <span className="text-xs font-semibold text-slate-900">{revenue_pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all"
                            style={{ width: `${Math.min(revenue_pct, 100)}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
