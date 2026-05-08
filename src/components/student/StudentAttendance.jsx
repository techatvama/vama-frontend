import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { parseSubject } from '../../lib/utils';
import {
    CheckCircle2,
    XCircle,
    MessageSquare,
    Calendar,
    Clock,
    TrendingUp,
    Award,
    Music,
    Loader2,
    Filter,
    Search
} from 'lucide-react';
import { format, parse } from 'date-fns';
import { useNavigate } from 'react-router';

export default function StudentAttendance() {
    const [student, setStudent] = useState(null);
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, present, absent, feedback
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const stored = localStorage.getItem('student');
        if (stored) {
            const s = JSON.parse(stored);
            setStudent(s);
            fetchAttendance(s.id);
        } else {
            navigate('/student-login');
        }
    }, [navigate]);

    const fetchAttendance = async (studentId) => {
        setLoading(true);
        try {
            const res = await api.get(`/student/${studentId}/attendance`);
            setAttendance(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredAttendance = attendance.filter(a => {
        const matchesSearch = parseSubject(a.session?.batch?.subject)?.toLowerCase().includes(search.toLowerCase()) ||
            a.notes?.toLowerCase().includes(search.toLowerCase());

        let matchesFilter = true;
        if (filter === 'present') matchesFilter = a.status === 'present';
        if (filter === 'absent') matchesFilter = a.status === 'absent';
        if (filter === 'feedback') matchesFilter = a.notes && a.notes.length > 0;

        return matchesSearch && matchesFilter;
    });

    const stats = {
        total: attendance.length,
        present: attendance.filter(a => a.status === 'present').length,
        absent: attendance.filter(a => a.status === 'absent').length,
        withFeedback: attendance.filter(a => a.notes).length
    };

    const attendanceRate = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
            <Loader2 className="w-10 h-10 text-[#463a7a] animate-spin" />
        </div>
    );

    return (
        <div className="p-4 lg:p-12 max-w-7xl mx-auto space-y-12 pb-24">
            {/* Header */}
            <div className="relative bg-gradient-to-br from-[#463a7a] to-[#2d2550] rounded-[50px] p-8 lg:p-16 overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-12 opacity-5 scale-125">
                    <TrendingUp className="w-96 h-96 text-white" />
                </div>

                <div className="relative z-10">
                    <h1 className="text-4xl lg:text-6xl font-black text-white tracking-tighter leading-none mb-4">
                        Attendance &<br />
                        <span className="text-indigo-300">Feedback</span>
                    </h1>
                    <p className="text-indigo-100/60 font-medium text-lg max-w-2xl mb-8">
                        Track your class attendance and view all teacher feedback in one place
                    </p>

                    {/* Search & Filter */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-white transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Search by subject or feedback..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-white/10 border border-white/10 rounded-3xl py-4 pl-14 pr-6 text-white font-bold placeholder:text-white/20 focus:outline-none focus:bg-white/15 transition-all backdrop-blur-md"
                            />
                        </div>
                        <div className="flex items-center gap-2 p-1 bg-white/10 rounded-3xl border border-white/10 backdrop-blur-md">
                            {[
                                { value: 'all', label: 'All' },
                                { value: 'present', label: 'Present' },
                                { value: 'absent', label: 'Absent' },
                                { value: 'feedback', label: 'Feedback' }
                            ].map(f => (
                                <button
                                    key={f.value}
                                    onClick={() => setFilter(f.value)}
                                    className={`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${filter === f.value
                                            ? 'bg-white text-[#463a7a] shadow-lg'
                                            : 'text-white/40 hover:text-white'
                                        }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-[40px] p-8 shadow-xl border border-slate-100">
                    <div className="w-14 h-14 bg-indigo-100 rounded-3xl flex items-center justify-center mb-6">
                        <Calendar className="text-[#463a7a]" size={28} />
                    </div>
                    <p className="text-3xl font-black text-slate-900 leading-none mb-2">{stats.total}</p>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Classes</p>
                </div>

                <div className="bg-white rounded-[40px] p-8 shadow-xl border border-slate-100">
                    <div className="w-14 h-14 bg-emerald-100 rounded-3xl flex items-center justify-center mb-6">
                        <CheckCircle2 className="text-emerald-600" size={28} />
                    </div>
                    <p className="text-3xl font-black text-emerald-600 leading-none mb-2">{stats.present}</p>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Attended</p>
                </div>

                <div className="bg-white rounded-[40px] p-8 shadow-xl border border-slate-100">
                    <div className="w-14 h-14 bg-red-100 rounded-3xl flex items-center justify-center mb-6">
                        <XCircle className="text-red-600" size={28} />
                    </div>
                    <p className="text-3xl font-black text-red-600 leading-none mb-2">{stats.absent}</p>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Missed</p>
                </div>

                <div className="bg-gradient-to-br from-[#463a7a] to-[#2d2550] rounded-[40px] p-8 shadow-xl text-white">
                    <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center mb-6 border border-white/10">
                        <Award className="text-yellow-400 fill-current" size={28} />
                    </div>
                    <p className="text-3xl font-black leading-none mb-2">{attendanceRate}%</p>
                    <p className="text-xs font-black text-indigo-200/60 uppercase tracking-widest">Attendance Rate</p>
                </div>
            </div>

            {/* Attendance List */}
            <div className="space-y-6">
                <h2 className="text-2xl font-black text-slate-900 tracking-tighter px-2 flex items-center gap-4">
                    <MessageSquare className="text-[#463a7a]" />
                    CLASS HISTORY
                </h2>

                {filteredAttendance.length > 0 ? (
                    <div className="space-y-4">
                        {filteredAttendance.map((record) => (
                            <div key={record.id} className="bg-white rounded-[40px] p-8 shadow-xl border border-slate-100 hover:border-[#463a7a] transition-all group">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                    {/* Left: Session Info */}
                                    <div className="flex items-start gap-6 flex-1">
                                        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center flex-shrink-0 ${record.status === 'present'
                                                ? 'bg-emerald-100 text-emerald-600'
                                                : 'bg-red-100 text-red-600'
                                            }`}>
                                            {record.status === 'present' ? (
                                                <CheckCircle2 size={32} />
                                            ) : (
                                                <XCircle size={32} />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-3">
                                                <span className="px-3 py-1 bg-indigo-50 text-[#463a7a] text-xs font-black uppercase tracking-widest rounded-lg">
                                                    {parseSubject(record.session?.batch?.subject) || 'Class'}
                                                </span>
                                                <span className={`px-3 py-1 text-xs font-black uppercase tracking-widest rounded-lg ${record.status === 'present'
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : 'bg-red-50 text-red-700'
                                                    }`}>
                                                    {record.status}
                                                </span>
                                            </div>

                                            <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-[#463a7a] transition-colors">
                                                {record.session?.batch?.name || `${parseSubject(record.session?.batch?.subject)} Session`}
                                            </h3>

                                            <div className="flex items-center gap-6 text-sm text-slate-500 font-bold">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} className="text-slate-300" />
                                                    {record.session?.date ? format(parse(record.session.date, 'yyyy-MM-dd', new Date()), 'MMM d, yyyy') : 'N/A'}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock size={14} className="text-slate-300" />
                                                    {record.session?.start_time} - {record.session?.end_time}
                                                </div>
                                            </div>

                                            {/* Feedback */}
                                            {record.notes && (
                                                <div className="mt-4 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl border border-indigo-100">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <MessageSquare size={14} className="text-indigo-600" />
                                                        <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">Teacher Feedback</span>
                                                    </div>
                                                    <p className="text-sm text-indigo-900 font-medium italic leading-relaxed">
                                                        "{record.notes}"
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Date Badge */}
                                    <div className="text-right lg:text-center flex-shrink-0">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Recorded</p>
                                        <p className="text-sm font-black text-slate-600">
                                            {format(new Date(record.created_at), 'MMM d, yyyy')}
                                        </p>
                                        <p className="text-xs text-slate-400 font-bold">
                                            {format(new Date(record.created_at), 'h:mm a')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-[50px] p-24 text-center border-2 border-dashed border-slate-100">
                        <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mx-auto mb-8 text-slate-200">
                            <Music size={48} />
                        </div>
                        <h3 className="text-3xl font-black text-slate-300 tracking-tighter mb-3">No records found</h3>
                        <p className="text-slate-400 font-bold uppercase text-xs tracking-widest px-8 max-w-md mx-auto">
                            {search || filter !== 'all'
                                ? 'Try adjusting your search or filters'
                                : 'Your attendance history will appear here once you start attending classes'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
