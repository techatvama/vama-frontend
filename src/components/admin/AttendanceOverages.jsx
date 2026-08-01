import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../../lib/api';
import { ArrowLeft, AlertTriangle, Loader2, Users } from 'lucide-react';

export default function AttendanceOverages() {
    const navigate = useNavigate();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        api.get('/admin/payments/attendance-overages')
            .then(r => setRows(r.data || []))
            .catch(() => setRows([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="min-h-screen bg-[#f5f6fa]">
            <div className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-20">
                <div className="max-w-[1100px] mx-auto px-6 lg:px-10 py-5 flex items-center gap-3">
                    <button onClick={() => navigate('/admin/payments')}
                        className="flex items-center gap-1.5 text-slate-500 hover:text-[#463a7a] font-medium text-sm transition-colors">
                        <ArrowLeft size={15} /> Payments
                    </button>
                    <span className="text-slate-300">/</span>
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fee Management</p>
                        <h1 className="text-xl font-bold text-slate-900 leading-none">Attendance Overages</h1>
                    </div>
                </div>
            </div>

            <div className="max-w-[1100px] mx-auto px-6 lg:px-10 py-7">
                <p className="text-sm text-slate-500 mb-5">
                    Students who were marked present after their package's sessions ran out — a teacher or admin
                    let them attend anyway. Each of these needs a renewal invoice or a new package assigned.
                </p>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-[#463a7a]" />
                    </div>
                ) : rows.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-14 text-center">
                        <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                            <Users size={24} className="text-emerald-500" />
                        </div>
                        <p className="text-slate-700 font-semibold">All clear</p>
                        <p className="text-slate-400 text-sm mt-1">No student has attended beyond their package limit.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                                    <th className="px-6 py-3.5">Student</th>
                                    <th className="px-6 py-3.5">Package</th>
                                    <th className="px-6 py-3.5 text-center">Used / Total</th>
                                    <th className="px-6 py-3.5 text-center">Overage</th>
                                    <th className="px-6 py-3.5">Last Attended</th>
                                    <th className="px-6 py-3.5 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {rows.map(r => (
                                    <tr key={`${r.student_id}-${r.package_id}`} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-6 py-4">
                                            <button onClick={() => navigate(`/students/${r.student_id}`)}
                                                className="font-semibold text-slate-800 hover:text-[#463a7a] transition-colors">
                                                {r.student_name}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">{r.package_name || '—'}</td>
                                        <td className="px-6 py-4 text-center text-slate-700 font-medium">
                                            {r.sessions_used}/{r.sessions_total}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-50 text-red-600 border border-red-100">
                                                <AlertTriangle size={11} /> +{r.overage}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">{r.last_attended_date || '—'}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => navigate('/admin/invoices/new')}
                                                className="px-3.5 py-2 bg-[#463a7a] hover:bg-[#3a3068] text-white rounded-lg text-xs font-semibold transition-colors">
                                                Create Invoice
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
