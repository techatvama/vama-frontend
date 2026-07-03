import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
    Calendar, Filter, Loader2, AlertCircle, ChevronLeft, ChevronRight,
    User, FileText, Clock
} from 'lucide-react';

export default function AuditLogViewer() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const [actionFilter, setActionFilter] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    const actionTypes = [
        'student.created', 'student.updated',
        'staff.created', 'staff.updated', 'staff.role_changed',
        'invoice.created', 'invoice.updated', 'invoice.deleted',
        'package.created', 'package.updated', 'package.assigned',
        'application.approved', 'application.rejected',
        'center.created', 'password.changed', 'activation.resent'
    ];

    useEffect(() => {
        fetchLogs();
    }, [page, limit, actionFilter, fromDate, toDate]);

    const fetchLogs = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            params.append('page', page);
            params.append('limit', limit);
            if (actionFilter) params.append('action', actionFilter);
            if (fromDate) params.append('from_date', fromDate);
            if (toDate) params.append('to_date', toDate);

            const res = await api.get(`/admin/audit-logs?${params.toString()}`);
            setLogs(res.data.logs || []);
            setTotalPages(res.data.pages || 1);
        } catch (err) {
            setError('Failed to load audit logs');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterClear = () => {
        setActionFilter('');
        setFromDate('');
        setToDate('');
        setPage(1);
    };

    const getActionBadgeColor = (action) => {
        if (action.includes('created')) return 'bg-green-100 text-green-700';
        if (action.includes('deleted')) return 'bg-red-100 text-red-700';
        if (action.includes('updated')) return 'bg-blue-100 text-blue-700';
        if (action.includes('assigned')) return 'bg-purple-100 text-purple-700';
        return 'bg-slate-100 text-slate-700';
    };

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900">Filters</h3>
                    {(actionFilter || fromDate || toDate) && (
                        <button
                            onClick={handleFilterClear}
                            className="text-xs text-slate-600 hover:text-slate-900 font-medium"
                        >
                            Clear filters
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Action Filter */}
                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Action Type</label>
                        <select
                            value={actionFilter}
                            onChange={(e) => {
                                setActionFilter(e.target.value);
                                setPage(1);
                            }}
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">All Actions</option>
                            {actionTypes.map(action => (
                                <option key={action} value={action}>{action}</option>
                            ))}
                        </select>
                    </div>

                    {/* From Date */}
                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">From Date</label>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => {
                                setFromDate(e.target.value);
                                setPage(1);
                            }}
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* To Date */}
                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">To Date</label>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => {
                                setToDate(e.target.value);
                                setPage(1);
                            }}
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <span className="text-red-800">{error}</span>
                    <button
                        onClick={fetchLogs}
                        className="ml-auto text-sm text-red-600 font-semibold hover:text-red-700"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Loading */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
            ) : logs.length === 0 ? (
                <div className="bg-slate-50 rounded-lg p-12 text-center text-slate-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-medium">No audit logs found</p>
                </div>
            ) : (
                <>
                    {/* Logs Table */}
                    <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-sm">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left px-6 py-3 font-semibold text-slate-900">Timestamp</th>
                                    <th className="text-left px-6 py-3 font-semibold text-slate-900">Action</th>
                                    <th className="text-left px-6 py-3 font-semibold text-slate-900">Actor</th>
                                    <th className="text-left px-6 py-3 font-semibold text-slate-900">Subject</th>
                                    <th className="text-left px-6 py-3 font-semibold text-slate-900">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {logs.map(log => (
                                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Clock className="w-4 h-4" />
                                                <span>
                                                    {new Date(log.created_at).toLocaleString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${getActionBadgeColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-2 text-slate-700">
                                                <User className="w-4 h-4 text-slate-400" />
                                                <span className="font-medium">{log.actor}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className="text-slate-600">
                                                {log.subject || '—'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <details className="cursor-pointer">
                                                <summary className="text-indigo-600 hover:text-indigo-700 font-medium">
                                                    View
                                                </summary>
                                                <div className="mt-2 bg-slate-50 rounded p-3 text-xs font-mono text-slate-700 max-w-md">
                                                    <pre>{JSON.stringify(log.detail || {}, null, 2)}</pre>
                                                </div>
                                            </details>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200 p-4">
                        <div className="text-sm text-slate-600">
                            Page <span className="font-semibold text-slate-900">{page}</span> of{' '}
                            <span className="font-semibold text-slate-900">{totalPages}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(Math.max(1, page - 1))}
                                disabled={page === 1}
                                className="flex items-center gap-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(Math.min(totalPages, page + 1))}
                                disabled={page === totalPages}
                                className="flex items-center gap-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        <select
                            value={limit}
                            onChange={(e) => {
                                setLimit(parseInt(e.target.value));
                                setPage(1);
                            }}
                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value={10}>10 per page</option>
                            <option value={20}>20 per page</option>
                            <option value={50}>50 per page</option>
                            <option value={100}>100 per page</option>
                        </select>
                    </div>
                </>
            )}
        </div>
    );
}
