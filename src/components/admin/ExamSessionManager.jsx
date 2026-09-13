import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../lib/api';
import {
    FileText, Plus, Pencil, Trash2, Search, X, Loader2, Save, CalendarDays,
    ArrowLeft, CheckCircle2, Lock, GraduationCap, Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import Toast from './shared/Toast';

const EXAM_BOARDS = [
    { value: 'Trinity', label: 'Trinity College London' },
    { value: 'RSL',     label: 'RSL Awards (Rockschool)' },
    { value: 'ABRSM',   label: 'ABRSM' },
    { value: 'Other',   label: 'Other' },
];

const BOARD_COLORS = {
    Trinity: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200/70',
    RSL:     'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200/70',
    ABRSM:   'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/70',
    Other:   'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200/70',
};

const fmtDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

export default function ExamSessionManager() {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingSession, setEditingSession] = useState(null);
    const [search, setSearch] = useState('');
    const [formData, setFormData] = useState({ name: '', exam_board: 'Trinity', exam_date: '' });
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [toast, setToast] = useState(null);
    const navigate = useNavigate();

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/exam-sessions');
            setSessions(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingSession) {
                await api.put(`/admin/exam-sessions/${editingSession.id}`, formData);
                setToast({ message: `"${formData.name}" updated.`, type: 'success' });
            } else {
                await api.post('/admin/exam-sessions', { ...formData, is_active: true });
                setToast({ message: `"${formData.name}" created.`, type: 'success' });
            }
            await fetchData();
            resetForm();
        } catch (err) {
            console.error(err);
            setToast({ message: err.response?.data?.detail || 'Failed to save exam session', type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (session) => {
        setEditingSession(session);
        setFormData({ name: session.name, exam_board: session.exam_board, exam_date: session.exam_date || '' });
        setShowForm(true);
    };

    const handleDelete = async (id, name) => {
        if (!confirm(`Delete "${name}"? This can't be undone.`)) return;
        setDeletingId(id);
        try {
            await api.delete(`/admin/exam-sessions/${id}`);
            setToast({ message: `"${name}" deleted.`, type: 'success' });
            await fetchData();
        } catch (err) {
            console.error(err);
            setToast({ message: err.response?.data?.detail || 'Failed to delete exam session', type: 'error' });
        } finally {
            setDeletingId(null);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', exam_board: 'Trinity', exam_date: '' });
        setEditingSession(null);
        setShowForm(false);
    };

    const filteredSessions = sessions.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.exam_board.toLowerCase().includes(search.toLowerCase())
    );

    const stats = useMemo(() => ({
        total: sessions.length,
        active: sessions.filter(s => s.is_active).length,
        closed: sessions.filter(s => !s.is_active).length,
    }), [sessions]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
            <Loader2 className="w-9 h-9 text-[#463a7a] animate-spin" strokeWidth={2.25} />
        </div>
    );

    return (
        <div className="p-4 lg:p-10 max-w-7xl mx-auto space-y-7 pb-24">
            {/* Header */}
            <div className="relative rounded-[36px] p-8 lg:p-11 overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.06),0_24px_48px_-16px_rgba(70,58,122,0.45)]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#4c3f87] via-[#3b2f6b] to-[#241a45]" />
                <div className="absolute -top-20 -right-16 w-72 h-72 rounded-full bg-white/[0.06] blur-2xl" />
                <div className="absolute bottom-0 left-1/3 w-64 h-64 rounded-full bg-fuchsia-400/10 blur-3xl" />
                <FileText className="absolute -bottom-8 -right-6 w-56 h-56 text-white/[0.05]" strokeWidth={1} />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-7">
                    <div>
                        <button
                            onClick={() => navigate('/admin/curriculum')}
                            className="mb-5 text-indigo-200/70 hover:text-white text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors"
                        >
                            <ArrowLeft size={14} strokeWidth={2.5} /> Curriculum
                        </button>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-[10px] font-black uppercase tracking-[0.16em] mb-4">
                            <GraduationCap size={12} strokeWidth={2.5} /> Curriculum &middot; Exams
                        </span>
                        <h1 className="text-4xl lg:text-[42px] font-black text-white tracking-tight leading-[1.05]">
                            Exam Sessions
                        </h1>
                        <p className="text-indigo-100/50 font-medium text-base mt-3 max-w-md">
                            Schedule and manage board exam sittings — Trinity, RSL, ABRSM.
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden sm:flex items-center gap-5 pr-6 border-r border-white/10">
                            <div>
                                <p className="text-2xl font-black text-white leading-none">{stats.total}</p>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200/50 mt-1.5">Total</p>
                            </div>
                            <div>
                                <p className="text-2xl font-black text-emerald-300 leading-none">{stats.active}</p>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200/50 mt-1.5">Open</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowForm(true)}
                            className="px-6 py-3.5 bg-white text-[#3b2f6b] rounded-2xl font-black text-sm shadow-[0_8px_24px_-6px_rgba(0,0,0,0.35)] hover:shadow-[0_10px_28px_-4px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2"
                        >
                            <Plus size={17} strokeWidth={2.75} />
                            New Session
                        </button>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative group max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#463a7a] transition-colors" size={17} strokeWidth={2.25} />
                <input
                    type="text"
                    placeholder="Search sessions or boards…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white border border-slate-200/70 rounded-2xl py-3 pl-11 pr-4 text-sm text-slate-900 font-semibold placeholder:text-slate-300 placeholder:font-medium focus:outline-none focus:ring-2 focus:ring-[#463a7a]/15 focus:border-[#463a7a]/30 transition-all shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                />
            </div>

            {/* Sessions Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredSessions.map((session) => {
                    const boardColor = BOARD_COLORS[session.exam_board] || BOARD_COLORS.Other;
                    return (
                        <div
                            key={session.id}
                            className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_32px_-20px_rgba(15,23,42,0.15)] hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_20px_40px_-16px_rgba(70,58,122,0.25)] hover:-translate-y-1 hover:border-[#463a7a]/20 transition-all duration-200 group"
                        >
                            <div className="flex items-start justify-between mb-5">
                                <div className="w-11 h-11 bg-gradient-to-br from-indigo-50 to-indigo-100/60 rounded-2xl flex items-center justify-center group-hover:from-[#463a7a] group-hover:to-[#342a5b] transition-all duration-200">
                                    <FileText className="text-[#463a7a] group-hover:text-white transition-colors" size={19} strokeWidth={2.25} />
                                </div>
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${boardColor}`}>
                                    {session.exam_board}
                                </span>
                            </div>

                            <h3 className="text-[17px] font-black text-slate-900 mb-2 truncate tracking-tight">{session.name}</h3>
                            {session.exam_date && (
                                <p className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-1.5">
                                    <CalendarDays size={13} strokeWidth={2.25} className="text-[#463a7a]" /> {fmtDate(session.exam_date)}
                                </p>
                            )}
                            <div className={`inline-flex items-center gap-1.5 text-[11px] font-bold mb-5 px-2.5 py-1 rounded-lg ${session.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                {session.is_active ? <CheckCircle2 size={12} strokeWidth={2.5} /> : <Lock size={12} strokeWidth={2.5} />}
                                {session.is_active ? 'Open for registration' : 'Closed'}
                            </div>

                            <div className="flex gap-2 pt-4 border-t border-slate-50">
                                <button
                                    onClick={() => handleEdit(session)}
                                    disabled={deletingId === session.id}
                                    className="flex-1 py-2.5 bg-slate-50 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-100 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Pencil size={13} strokeWidth={2.25} /> Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(session.id, session.name)}
                                    disabled={deletingId === session.id}
                                    className="flex-1 py-2.5 bg-red-50/70 text-red-600 rounded-xl font-bold text-xs hover:bg-red-50 transition-all flex items-center justify-center gap-1.5 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {deletingId === session.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} strokeWidth={2.25} />}
                                    {deletingId === session.id ? 'Deleting…' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Empty State */}
            {filteredSessions.length === 0 && (
                <div className="bg-white rounded-[36px] p-20 text-center border border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-indigo-50 rounded-[26px] flex items-center justify-center mx-auto mb-6">
                        <FileText className="text-[#463a7a]" size={32} strokeWidth={1.75} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-700 tracking-tight mb-2">No exam sessions yet</h3>
                    <p className="text-slate-400 font-semibold text-sm mb-7">
                        Create a session to start tracking exam candidates.
                    </p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-7 py-3.5 bg-[#463a7a] text-white rounded-2xl font-black text-sm shadow-[0_8px_20px_-6px_rgba(70,58,122,0.5)] hover:bg-[#3a2f66] transition-all inline-flex items-center gap-2"
                    >
                        <Plus size={16} strokeWidth={2.5} /> Create Session
                    </button>
                </div>
            )}

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="p-7 bg-gradient-to-br from-[#4c3f87] to-[#2d2456] text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                                    <Sparkles size={16} strokeWidth={2.25} />
                                </div>
                                <h3 className="text-lg font-black tracking-tight">
                                    {editingSession ? 'Edit Session' : 'New Exam Session'}
                                </h3>
                            </div>
                            <button onClick={resetForm} className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-xl transition-colors">
                                <X size={18} strokeWidth={2.25} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-7 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Session Name</label>
                                <input
                                    type="text" required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Winter 2026 Trinity"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-semibold focus:outline-none focus:border-[#463a7a] focus:ring-2 focus:ring-[#463a7a]/10 transition-all"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Exam Board</label>
                                <select
                                    required
                                    value={formData.exam_board}
                                    onChange={(e) => setFormData({ ...formData, exam_board: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-semibold focus:outline-none focus:border-[#463a7a] focus:ring-2 focus:ring-[#463a7a]/10 transition-all appearance-none"
                                >
                                    {EXAM_BOARDS.map(b => (
                                        <option key={b.value} value={b.value}>{b.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Exam Date</label>
                                <input
                                    type="date"
                                    value={formData.exam_date}
                                    onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-semibold focus:outline-none focus:border-[#463a7a] focus:ring-2 focus:ring-[#463a7a]/10 transition-all"
                                />
                            </div>

                            <div className="flex gap-2.5 pt-3">
                                <button type="button" onClick={resetForm}
                                    className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all">
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting}
                                    className="flex-1 py-3 bg-[#463a7a] text-white rounded-xl font-bold text-sm shadow-[0_6px_16px_-4px_rgba(70,58,122,0.5)] hover:bg-[#342a5b] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                    {submitting ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} strokeWidth={2.25} />}
                                    {editingSession ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
        </div>
    );
}
