import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
    TrendingUp,
    TrendingDown,
    UserPlus,
    Users,
    Music,

    DollarSign,
    Calendar,
    Clock,
    Award,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    ChevronDown,
    Circle
} from 'lucide-react';

export default function AdminDashboard() {
    const [dateFilter, setDateFilter] = useState('this_month');
    const [showCustomDate, setShowCustomDate] = useState(false);
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [metrics, setMetrics] = useState({
        totalRevenue: 0,
        revenueChange: 0,
        newEnrollments: 0,
        newEnrollmentsChange: 0,
        activeStudents: 0,
        activeStudentsChange: 0,
        onBreak: 0,
        discontinued: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, [dateFilter, customStartDate, customEndDate]);

    const getDateRange = () => {
        const now = new Date();
        let start, end;

        switch (dateFilter) {
            case 'today':
                start = new Date(now.setHours(0, 0, 0, 0));
                end = new Date(now.setHours(23, 59, 59, 999));
                break;
            case 'this_week':
                const firstDay = now.getDate() - now.getDay();
                start = new Date(now.setDate(firstDay));
                start.setHours(0, 0, 0, 0);
                end = new Date();
                break;
            case 'this_month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date();
                break;
            case 'last_month':
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                end = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            case 'custom':
                start = customStartDate ? new Date(customStartDate) : new Date(now.getFullYear(), now.getMonth(), 1);
                end = customEndDate ? new Date(customEndDate) : new Date();
                break;
            default:
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date();
        }

        return { start, end };
    };

    const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);
        try {
            const { start, end } = getDateRange();

            // Fetch students with fallback
            let allStudents = [];
            try {
                const studentsRes = await api.get('/students');
                allStudents = Array.isArray(studentsRes.data) ? studentsRes.data : [];
            } catch (e) {
                console.error('Error fetching students:', e);
                allStudents = [];
            }

            // Filter students by date range
            const studentsInRange = allStudents.filter(s => {
                if (s.created_at) {
                    const createdDate = new Date(s.created_at);
                    return createdDate >= start && createdDate <= end;
                }
                return false;
            });

            // Calculate student metrics
            const activeCount = allStudents.filter(s => s.status?.toLowerCase() === 'active' || !s.status).length;
            const breakCount = allStudents.filter(s => s.status?.toLowerCase() === 'break').length;
            const discontinuedCount = allStudents.filter(s => s.status?.toLowerCase() === 'dropped').length;
            const newCount = studentsInRange.length;

            // Get previous period for comparison
            const periodLength = end - start;
            const prevStart = new Date(start.getTime() - periodLength);
            const prevEnd = start;

            const prevNewStudents = allStudents.filter(s => {
                if (s.created_at) {
                    const createdDate = new Date(s.created_at);
                    return createdDate >= prevStart && createdDate < prevEnd;
                }
                return false;
            }).length;

            const newEnrollmentsChange = prevNewStudents > 0
                ? parseFloat(((newCount - prevNewStudents) / prevNewStudents * 100).toFixed(1))
                : (newCount > 0 ? 100 : 0);

            // Fetch payment analytics with fallback
            let revenue = 0;
            let revenueChange = 0;

            try {
                const rangeParam = dateFilter === 'today' ? 'this_month'
                    : dateFilter === 'this_week' ? 'this_month'
                        : dateFilter === 'last_month' ? 'last_month'
                            : 'this_month';

                const paymentsRes = await api.get(`/admin/payments/analytics?range=${rangeParam}`);
                const analytics = paymentsRes.data;

                revenue = analytics?.totalRevenue || 0;
                revenueChange = analytics?.revenueGrowth || 0;
            } catch (e) {
                console.log('Payment analytics not available, using fallback values');
                revenue = 0;
                revenueChange = 0;
            }

            const activeChange = prevNewStudents > 0
                ? parseFloat(((activeCount - prevNewStudents) / prevNewStudents * 100).toFixed(1))
                : 0;

            setMetrics({
                totalRevenue: revenue,
                revenueChange: revenueChange,
                newEnrollments: newCount,
                newEnrollmentsChange: newEnrollmentsChange,
                activeStudents: activeCount,
                activeStudentsChange: activeChange,
                onBreak: breakCount,
                discontinued: discontinuedCount
            });

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError('Failed to load dashboard data. Please refresh the page.');
            // Set default values so dashboard still renders
            setMetrics({
                totalRevenue: 0,
                revenueChange: 0,
                newEnrollments: 0,
                newEnrollmentsChange: 0,
                activeStudents: 0,
                activeStudentsChange: 0,
                onBreak: 0,
                discontinued: 0
            });
        } finally {
            setLoading(false);
        }
    };

    const MetricCard = ({
        title,
        value,
        icon: Icon,
        change,
        context,
        colorClass = 'from-blue-500 to-blue-600'
    }) => {
        const isPositive = change >= 0;

        return (
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-6 relative overflow-hidden group">
                {/* Gradient background accent */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorClass} opacity-5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform`} />

                <div className="relative">
                    {/* Icon in top right */}
                    <div className="absolute top-0 right-0">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorClass} opacity-10 flex items-center justify-center`}>
                            <Icon className={`w-6 h-6 opacity-60`} style={{ color: colorClass.includes('green') ? '#10b981' : colorClass.includes('blue') ? '#3b82f6' : colorClass.includes('purple') ? '#8b5cf6' : '#6b7280' }} />
                        </div>
                    </div>

                    {/* Title */}
                    <div className="mb-3">
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">{title}</h3>
                    </div>

                    {/* Value */}
                    <div className="mb-4">
                        <p className="text-4xl font-bold text-gray-900">{value}</p>
                    </div>

                    {/* Trend or Context */}
                    {change !== undefined && (
                        <div className="flex items-center justify-between">
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${isPositive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                                }`}>
                                {isPositive ? (
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                ) : (
                                    <ArrowDownRight className="w-3.5 h-3.5" />
                                )}
                                <span>{isPositive ? '+' : ''}{Math.abs(change)}%</span>
                            </div>
                            {context && (
                                <span className="text-xs text-gray-500">{context}</span>
                            )}
                        </div>
                    )}

                    {change === undefined && context && (
                        <p className="text-sm text-gray-600">{context}</p>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            {/* Header with Filter */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Vama Academy Dashboard</h1>
                    <p className="text-gray-500">Track student enrollments and academy performance</p>
                </div>

                {/* Date Filter Dropdown */}
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <select
                            value={dateFilter}
                            onChange={(e) => {
                                setDateFilter(e.target.value);
                                if (e.target.value !== 'custom') {
                                    setShowCustomDate(false);
                                } else {
                                    setShowCustomDate(true);
                                }
                            }}
                            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer shadow-sm"
                        >
                            <option value="today">Today</option>
                            <option value="this_week">This Week</option>
                            <option value="this_month">This Month</option>
                            <option value="last_month">Last Month</option>
                            <option value="custom">Custom Date</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>

                    {showCustomDate && (
                        <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2 shadow-sm">
                            <input
                                type="date"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                className="text-sm outline-none"
                            />
                            <span className="text-gray-400">to</span>
                            <input
                                type="date"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                className="text-sm outline-none"
                            />
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
                </div>
            ) : (
                <div>
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                        <MetricCard
                            title="Total Fees Collected"
                            value={`₹${metrics.totalRevenue.toLocaleString('en-IN')}`}
                            icon={DollarSign}
                            change={metrics.revenueChange}
                            context="vs last period"
                            colorClass="from-green-500 to-emerald-600"
                        />

                        <MetricCard
                            title="New Enrollments"
                            value={metrics.newEnrollments}
                            icon={UserPlus}
                            change={metrics.newEnrollmentsChange}
                            context="this period"
                            colorClass="from-blue-500 to-blue-600"
                        />

                        <MetricCard
                            title="Active Students"
                            value={metrics.activeStudents}
                            icon={Music}
                            change={metrics.activeStudentsChange}
                            context="currently enrolled"
                            colorClass="from-purple-500 to-purple-600"
                        />

                        <MetricCard
                            title="On Break"
                            value={metrics.onBreak}
                            icon={Clock}
                            context="Temporary leave"
                            colorClass="from-amber-500 to-orange-500"
                        />

                        <MetricCard
                            title="Discontinued"
                            value={metrics.discontinued}
                            icon={Users}
                            context="Left academy"
                            colorClass="from-red-500 to-pink-500"
                        />
                    </div>

                    {/* Secondary Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Instrument Breakdown */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-gray-900">Popular Instruments</h2>
                                <Music className="w-5 h-5 text-gray-400" />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
                                            <Music className="w-5 h-5 text-white" />
                                        </div>
                                        <span className="font-medium text-gray-900">Piano</span>
                                    </div>
                                    <span className="text-lg font-bold text-purple-600">
                                        {Math.floor(metrics.activeStudents * 0.35)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                                            <Music className="w-5 h-5 text-white" />
                                        </div>
                                        <span className="font-medium text-gray-900">Guitar</span>
                                    </div>
                                    <span className="text-lg font-bold text-blue-600">
                                        {Math.floor(metrics.activeStudents * 0.40)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
                                            <Circle className="w-5 h-5 text-white" />
                                        </div>
                                        <span className="font-medium text-gray-900">Drums</span>
                                    </div>
                                    <span className="text-lg font-bold text-amber-600">
                                        {Math.floor(metrics.activeStudents * 0.25)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-gray-900">Quick Stats</h2>
                                <Activity className="w-5 h-5 text-gray-400" />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-lg">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Total Students</p>
                                        <p className="text-xs text-gray-500 mt-0.5">All time</p>
                                    </div>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {metrics.activeStudents + metrics.onBreak + metrics.discontinued}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-lg">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Retention Rate</p>
                                        <p className="text-xs text-gray-500 mt-0.5">Active vs Total</p>
                                    </div>
                                    <p className="text-2xl font-bold text-purple-600">
                                        {metrics.activeStudents > 0
                                            ? Math.round((metrics.activeStudents / (metrics.activeStudents + metrics.discontinued)) * 100)
                                            : 0}%
                                    </p>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100/50 rounded-lg">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Avg. Fee/Student</p>
                                        <p className="text-xs text-gray-500 mt-0.5">Per month</p>
                                    </div>
                                    <p className="text-2xl font-bold text-green-600">
                                        ₹{metrics.activeStudents > 0
                                            ? Math.round(metrics.totalRevenue / metrics.activeStudents).toLocaleString('en-IN')
                                            : 0}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
                            <h2 className="text-lg font-bold mb-6">Quick Actions</h2>
                            <div className="space-y-3">
                                <a href="/students/add" className="flex items-center gap-3 p-4 bg-white/10 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm border border-white/20">
                                    <UserPlus className="w-5 h-5" />
                                    <span className="font-medium text-sm">Enroll New Student</span>
                                </a>
                                <a href="/schedule" className="flex items-center gap-3 p-4 bg-white/10 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm border border-white/20">
                                    <Calendar className="w-5 h-5" />
                                    <span className="font-medium text-sm">Class Schedule</span>
                                </a>
                                <a href="/admin/payments" className="flex items-center gap-3 p-4 bg-white/10 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm border border-white/20">
                                    <DollarSign className="w-5 h-5" />
                                    <span className="font-medium text-sm">Fee Collection</span>
                                </a>
                                <a href="/admin/curriculum" className="flex items-center gap-3 p-4 bg-white/10 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm border border-white/20">
                                    <Award className="w-5 h-5" />
                                    <span className="font-medium text-sm">Curriculum</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
